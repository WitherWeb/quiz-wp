<?php

namespace Quiz_WP;

if (! defined('ABSPATH')) {
    exit;
}

class Meta_Box
{
    private const ALLOWED_HTML = [
        'a' => ['href' => true, 'target' => true, 'rel' => true, 'class' => true],
        'br' => [],
        'em' => [],
        'strong' => [],
        'span' => ['class' => true, 'style' => true],
        'small' => ['class' => true],
        'mark' => ['class' => true],
    ];
    public static function register(): void
    {
        add_action('add_meta_boxes', [__CLASS__, 'add_meta_boxes']);
        add_action('save_post_quiz_wp', [__CLASS__, 'save']);
    }

    public static function add_meta_boxes(): void
    {
        add_meta_box('quiz-wp-builder', __('Шаги квиза', 'quiz-wp'), [__CLASS__, 'render_builder'], 'quiz_wp', 'normal', 'high');
        add_meta_box('quiz-wp-results', __('Результаты квиза', 'quiz-wp'), [__CLASS__, 'render_results'], 'quiz_wp', 'advanced', 'high');
        add_meta_box('quiz-wp-settings', __('Настройки квиза', 'quiz-wp'), [__CLASS__, 'render_settings'], 'quiz_wp', 'side', 'default');
    }

    public static function default_stage(): array
    {
        return [
            'title' => '',
            'pick_hint_text' => '',
            'info_text' => '',
            'image_id' => 0,
            'image_url' => '',
            'stage_type' => 'options',
            'selection_mode' => 'single',
            'grid_columns' => 2,
            'show_pick_hint' => 1,
            'show_description' => 1,
            'options' => [self::default_option()],
            'fields' => [self::default_field()],
        ];
    }

    public static function default_option(): array
    {
        return [
            'label' => '',
            'value' => '',
            'image_id' => 0,
            'image_url' => '',
            'next_stage' => 0,
        ];
    }

    public static function default_field(): array
    {
        return [
            'label' => '',
            'placeholder' => '',
            'type' => 'text',
        ];
    }

    public static function default_result(): array
    {
        return [
            'title' => '',
            'text' => '',
            'image_id' => 0,
            'image_url' => '',
            'image_position' => 'left',
            'match_mode' => 'any',
            'trigger_values' => [],
        ];
    }

    public static function render_builder(\WP_Post $post): void
    {
        wp_nonce_field('quiz_wp_save_meta', 'quiz_wp_nonce');

        $stages = get_post_meta($post->ID, '_quiz_wp_stages', true);
        if (! is_array($stages) || empty($stages)) {
            $stages = [self::default_stage()];
        }

        echo '<div class="quiz-wp-builder">';
        echo '<p>' . esc_html__('Добавляйте шаги квиза, редактируйте текст, изображения, карточки ответов и сетку для каждого шага.', 'quiz-wp') . '</p>';
        echo '<div id="quiz-wp-stages" data-stages="' . esc_attr(wp_json_encode($stages)) . '"></div>';
        echo '<button type="button" class="button button-primary" id="quiz-wp-add-stage">' . esc_html__('Добавить шаг', 'quiz-wp') . '</button>';
        echo '<input type="hidden" id="quiz_wp_stages" name="quiz_wp_stages" value="' . esc_attr(wp_json_encode($stages)) . '">';
        echo '</div>';
    }

    public static function render_results(\WP_Post $post): void
    {
        $results = get_post_meta($post->ID, '_quiz_wp_results', true);
        if (! is_array($results)) {
            $results = [];
        }

        echo '<div class="quiz-wp-builder">';
        echo '<p>' . esc_html__('Создавайте варианты результатов. После квиза будет показан первый подходящий результат.', 'quiz-wp') . '</p>';
        echo '<div id="quiz-wp-results-list" data-results="' . esc_attr(wp_json_encode($results)) . '"></div>';
        echo '<button type="button" class="button button-secondary" id="quiz-wp-add-result">' . esc_html__('Добавить результат', 'quiz-wp') . '</button>';
        echo '<input type="hidden" id="quiz_wp_results" name="quiz_wp_results" value="' . esc_attr(wp_json_encode($results)) . '">';
        echo '</div>';
    }

    public static function render_settings(\WP_Post $post): void
    {
        $intro_title = (string) get_post_meta($post->ID, '_quiz_wp_intro_title', true);
        $intro_highlight = (string) get_post_meta($post->ID, '_quiz_wp_intro_highlight', true);
        $intro_description = (string) get_post_meta($post->ID, '_quiz_wp_intro_description', true);
        $intro_button_label = (string) get_post_meta($post->ID, '_quiz_wp_intro_button_label', true);
        $intro_image_id = (int) get_post_meta($post->ID, '_quiz_wp_intro_image_id', true);
        $intro_image_url = (string) get_post_meta($post->ID, '_quiz_wp_intro_image_url', true);
        $intro_gift_1_title = (string) get_post_meta($post->ID, '_quiz_wp_intro_gift_1_title', true);
        $intro_gift_1_text = (string) get_post_meta($post->ID, '_quiz_wp_intro_gift_1_text', true);
        $intro_gift_2_title = (string) get_post_meta($post->ID, '_quiz_wp_intro_gift_2_title', true);
        $intro_gift_2_text = (string) get_post_meta($post->ID, '_quiz_wp_intro_gift_2_text', true);
        $intro_time_text = (string) get_post_meta($post->ID, '_quiz_wp_intro_time_text', true);
        $intro_benefits = get_post_meta($post->ID, '_quiz_wp_intro_benefits', true);
        $intro_bonus_items = get_post_meta($post->ID, '_quiz_wp_intro_bonus_items', true);
        $discount_label = (string) get_post_meta($post->ID, '_quiz_wp_discount_label', true);
        $side_expert_name = (string) get_post_meta($post->ID, '_quiz_wp_side_expert_name', true);
        $side_expert_role = (string) get_post_meta($post->ID, '_quiz_wp_side_expert_role', true);
        $side_expert_quote = (string) get_post_meta($post->ID, '_quiz_wp_side_expert_quote', true);
        $side_expert_avatar_id = (int) get_post_meta($post->ID, '_quiz_wp_side_expert_avatar_id', true);
        $side_expert_avatar_url = (string) get_post_meta($post->ID, '_quiz_wp_side_expert_avatar_url', true);
        $privacy_url = (string) get_post_meta($post->ID, '_quiz_wp_privacy_url', true);
        $contact_title = (string) get_post_meta($post->ID, '_quiz_wp_contact_title', true);
        $contact_text = (string) get_post_meta($post->ID, '_quiz_wp_contact_text', true);
        $contact_note = (string) get_post_meta($post->ID, '_quiz_wp_contact_note', true);
        $thanks_review_label = (string) get_post_meta($post->ID, '_quiz_wp_thanks_review_label', true);
        $thanks_review_url = (string) get_post_meta($post->ID, '_quiz_wp_thanks_review_url', true);
        $thanks_rent_label = (string) get_post_meta($post->ID, '_quiz_wp_thanks_rent_label', true);
        $thanks_rent_url = (string) get_post_meta($post->ID, '_quiz_wp_thanks_rent_url', true);
        $thanks_book_label = (string) get_post_meta($post->ID, '_quiz_wp_thanks_book_label', true);
        $thanks_book_url = (string) get_post_meta($post->ID, '_quiz_wp_thanks_book_url', true);
        $final_title = (string) get_post_meta($post->ID, '_quiz_wp_final_title', true);
        $final_text = (string) get_post_meta($post->ID, '_quiz_wp_final_text', true);
        $cf7_form_id = (int) get_post_meta($post->ID, '_quiz_wp_cf7_form_id', true);

        if (! is_array($intro_benefits) || empty($intro_benefits)) {
            $intro_benefits = [
                'Книгу о лечении боли в спине',
                'Бесплатную консультацию специалиста',
                'Скидку 10% на аренду мата',
            ];
        }

        if (! is_array($intro_bonus_items) || empty($intro_bonus_items)) {
            $intro_bonus_items = $intro_benefits;
        }

        echo '<div class="quiz-wp-field-block">';
        echo '<p><label for="quiz_wp_intro_title"><strong>' . esc_html__('Заголовок стартового экрана', 'quiz-wp') . '</strong></label></p>';
        echo '<input type="text" class="widefat" id="quiz_wp_intro_title" name="quiz_wp_intro_title" value="' . esc_attr($intro_title) . '" placeholder="Узнайте, как {{highlight}} поможет именно вам">';
        echo '<p class="description">' . esc_html__('Используйте {{highlight}} там, где должно появиться выделенное слово бренда.', 'quiz-wp') . '</p>';
        echo '</div>';

        echo '<div class="quiz-wp-field-block">';
        echo '<p><label for="quiz_wp_intro_highlight"><strong>' . esc_html__('Выделенное слово', 'quiz-wp') . '</strong></label></p>';
        echo '<input type="text" class="widefat" id="quiz_wp_intro_highlight" name="quiz_wp_intro_highlight" value="' . esc_attr($intro_highlight) . '" placeholder="Detensor">';
        echo '</div>';

        echo '<div class="quiz-wp-field-block">';
        echo '<p><label for="quiz_wp_intro_description"><strong>' . esc_html__('Описание стартового экрана', 'quiz-wp') . '</strong></label></p>';
        echo '<textarea class="widefat" rows="3" id="quiz_wp_intro_description" name="quiz_wp_intro_description">' . esc_textarea($intro_description) . '</textarea>';
        echo '</div>';

        echo '<div class="quiz-wp-field-block">';
        echo '<p><label for="quiz_wp_intro_button_label"><strong>' . esc_html__('Текст кнопки старта', 'quiz-wp') . '</strong></label></p>';
        echo '<input type="text" class="widefat" id="quiz_wp_intro_button_label" name="quiz_wp_intro_button_label" value="' . esc_attr($intro_button_label) . '" placeholder="Пройти тест">';
        echo '</div>';

        echo '<div class="quiz-wp-field-block">';
        echo '<p><label for="quiz_wp_intro_time_text"><strong>' . esc_html__('Текст под кнопкой старта', 'quiz-wp') . '</strong></label></p>';
        echo '<input type="text" class="widefat" id="quiz_wp_intro_time_text" name="quiz_wp_intro_time_text" value="' . esc_attr($intro_time_text) . '" placeholder="Квиз займёт не более 2 минут">';
        echo '</div>';

        echo '<div class="quiz-wp-field-block">';
        echo '<p><strong>' . esc_html__('Изображение стартового экрана', 'quiz-wp') . '</strong></p>';
        echo '<div class="quiz-wp-image-row">';
        echo '<input type="hidden" id="quiz_wp_intro_image_id" name="quiz_wp_intro_image_id" value="' . esc_attr((string) $intro_image_id) . '">';
        echo '<input type="url" class="widefat" id="quiz_wp_intro_image_url" name="quiz_wp_intro_image_url" value="' . esc_attr($intro_image_url) . '" placeholder="' . esc_attr__('URL изображения', 'quiz-wp') . '">';
        echo '<button type="button" class="button" id="quiz-wp-select-intro-image">' . esc_html($intro_image_url ? __('Заменить изображение', 'quiz-wp') : __('Выбрать изображение', 'quiz-wp')) . '</button>';
        echo '<button type="button" class="button" id="quiz-wp-clear-intro-image">' . esc_html__('Очистить', 'quiz-wp') . '</button>';
        echo '</div>';
        echo '<div id="quiz-wp-intro-image-preview-wrapper">' . wp_kses_post(self::image_preview_markup($intro_image_url, __('Превью изображения стартового экрана', 'quiz-wp'))) . '</div>';
        echo '</div>';

        echo '<div class="quiz-wp-field-block">';
        echo '<p><strong>' . esc_html__('Карточка бонуса 1', 'quiz-wp') . '</strong></p>';
        echo '<input type="text" class="widefat" id="quiz_wp_intro_gift_1_title" name="quiz_wp_intro_gift_1_title" value="' . esc_attr($intro_gift_1_title) . '" placeholder="Книга">';
        echo '<input type="text" class="widefat" id="quiz_wp_intro_gift_1_text" name="quiz_wp_intro_gift_1_text" value="' . esc_attr($intro_gift_1_text) . '" placeholder="в подарок" style="margin-top:8px;">';
        echo '</div>';

        echo '<div class="quiz-wp-field-block">';
        echo '<p><strong>' . esc_html__('Карточка бонуса 2', 'quiz-wp') . '</strong></p>';
        echo '<input type="text" class="widefat" id="quiz_wp_intro_gift_2_title" name="quiz_wp_intro_gift_2_title" value="' . esc_attr($intro_gift_2_title) . '" placeholder="Промокод">';
        echo '<input type="text" class="widefat" id="quiz_wp_intro_gift_2_text" name="quiz_wp_intro_gift_2_text" value="' . esc_attr($intro_gift_2_text) . '" placeholder="на скидку" style="margin-top:8px;">';
        echo '</div>';

        echo '<div class="quiz-wp-field-block">';
        echo '<p><label for="quiz_wp_discount_label"><strong>' . esc_html__('Текст скидки', 'quiz-wp') . '</strong></label></p>';
        echo '<input type="text" class="widefat" id="quiz_wp_discount_label" name="quiz_wp_discount_label" value="' . esc_attr($discount_label) . '" placeholder="до 3000₽">';
        echo '<p class="description">' . esc_html__('Показывается в правой колонке шагов квиза.', 'quiz-wp') . '</p>';
        echo '</div>';

        echo '<div class="quiz-wp-field-block">';
        echo '<p><strong>' . esc_html__('Отзыв в правой колонке', 'quiz-wp') . '</strong></p>';
        echo '<input type="text" class="widefat" id="quiz_wp_side_expert_name" name="quiz_wp_side_expert_name" value="' . esc_attr($side_expert_name) . '" placeholder="Оксана Макарычева">';
        echo '<input type="text" class="widefat" id="quiz_wp_side_expert_role" name="quiz_wp_side_expert_role" value="' . esc_attr($side_expert_role) . '" placeholder="Специалист по лечению заболеваний позвоночника" style="margin-top:8px;">';
        echo '<textarea class="widefat" rows="3" id="quiz_wp_side_expert_quote" name="quiz_wp_side_expert_quote" placeholder="Детензор — уникальная система..." style="margin-top:8px;">' . esc_textarea($side_expert_quote) . '</textarea>';
        echo '</div>';

        echo '<div class="quiz-wp-field-block">';
        echo '<p><label for="quiz_wp_privacy_url"><strong>' . esc_html__('Ссылка на политику конфиденциальности', 'quiz-wp') . '</strong></label></p>';
        echo '<div class="quiz-wp-field-block">';
        echo '<p><strong>' . esc_html__('Аватарка отзыва', 'quiz-wp') . '</strong></p>';
        echo '<div class="quiz-wp-image-row">';
        echo '<input type="hidden" id="quiz_wp_side_expert_avatar_id" name="quiz_wp_side_expert_avatar_id" value="' . esc_attr((string) $side_expert_avatar_id) . '">';
        echo '<input type="url" class="widefat" id="quiz_wp_side_expert_avatar_url" name="quiz_wp_side_expert_avatar_url" value="' . esc_attr($side_expert_avatar_url) . '" placeholder="' . esc_attr__('URL аватарки', 'quiz-wp') . '">';
        echo '<button type="button" class="button" id="quiz-wp-select-side-expert-avatar">' . esc_html($side_expert_avatar_url ? __('Заменить аватарку', 'quiz-wp') : __('Выбрать аватарку', 'quiz-wp')) . '</button>';
        echo '<button type="button" class="button" id="quiz-wp-clear-side-expert-avatar">' . esc_html__('Очистить', 'quiz-wp') . '</button>';
        echo '</div>';
        echo '<div id="quiz-wp-side-expert-avatar-preview-wrapper">' . wp_kses_post(self::image_preview_markup($side_expert_avatar_url, __('Превью аватарки отзыва', 'quiz-wp'))) . '</div>';
        echo '</div>';

        echo '<input type="url" class="widefat" id="quiz_wp_privacy_url" name="quiz_wp_privacy_url" value="' . esc_attr($privacy_url) . '" placeholder="https://example.com/privacy">';
        echo '</div>';

        echo '<div class="quiz-wp-field-block">';
        echo '<p><label for="quiz_wp_contact_title"><strong>' . esc_html__('Заголовок экрана формы', 'quiz-wp') . '</strong></label></p>';
        echo '<textarea class="widefat" rows="3" id="quiz_wp_contact_title" name="quiz_wp_contact_title">' . esc_textarea($contact_title) . '</textarea>';
        echo '</div>';

        echo '<div class="quiz-wp-field-block">';
        echo '<p><label for="quiz_wp_contact_text"><strong>' . esc_html__('Текст экрана формы', 'quiz-wp') . '</strong></label></p>';
        echo '<textarea class="widefat" rows="4" id="quiz_wp_contact_text" name="quiz_wp_contact_text">' . esc_textarea($contact_text) . '</textarea>';
        echo '</div>';

        echo '<div class="quiz-wp-field-block">';
        echo '<p><label for="quiz_wp_contact_note"><strong>' . esc_html__('Нижняя подпись экрана формы', 'quiz-wp') . '</strong></label></p>';
        echo '<textarea class="widefat" rows="3" id="quiz_wp_contact_note" name="quiz_wp_contact_note">' . esc_textarea($contact_note) . '</textarea>';
        echo '</div>';

        echo '<div class="quiz-wp-field-block">';
        echo '<p><label for="quiz_wp_thanks_review_label"><strong>' . esc_html__('Кнопка 1 на экране спасибо', 'quiz-wp') . '</strong></label></p>';
        echo '<input type="text" class="widefat" id="quiz_wp_thanks_review_label" name="quiz_wp_thanks_review_label" value="' . esc_attr($thanks_review_label) . '" placeholder="Посмотреть отзывы о Detensor">';
        echo '<input type="url" class="widefat" id="quiz_wp_thanks_review_url" name="quiz_wp_thanks_review_url" value="' . esc_attr($thanks_review_url) . '" placeholder="https://example.com/reviews" style="margin-top:8px;">';
        echo '</div>';

        echo '<div class="quiz-wp-field-block">';
        echo '<p><label for="quiz_wp_thanks_rent_label"><strong>' . esc_html__('Кнопка 2 на экране спасибо', 'quiz-wp') . '</strong></label></p>';
        echo '<input type="text" class="widefat" id="quiz_wp_thanks_rent_label" name="quiz_wp_thanks_rent_label" value="' . esc_attr($thanks_rent_label) . '" placeholder="Взять в аренду за 299 руб./день">';
        echo '<input type="url" class="widefat" id="quiz_wp_thanks_rent_url" name="quiz_wp_thanks_rent_url" value="' . esc_attr($thanks_rent_url) . '" placeholder="https://example.com/rent" style="margin-top:8px;">';
        echo '</div>';

        echo '<div class="quiz-wp-field-block">';
        echo '<p><label for="quiz_wp_thanks_book_label"><strong>' . esc_html__('Кнопка 3 на экране спасибо', 'quiz-wp') . '</strong></label></p>';
        echo '<input type="text" class="widefat" id="quiz_wp_thanks_book_label" name="quiz_wp_thanks_book_label" value="' . esc_attr($thanks_book_label) . '" placeholder="Скачать книгу бесплатно">';
        echo '<input type="url" class="widefat" id="quiz_wp_thanks_book_url" name="quiz_wp_thanks_book_url" value="' . esc_attr($thanks_book_url) . '" placeholder="https://example.com/book" style="margin-top:8px;">';
        echo '</div>';

        echo '<p><label for="quiz_wp_final_title"><strong>' . esc_html__('Заголовок результата по умолчанию', 'quiz-wp') . '</strong></label></p>';
        echo '<input type="text" class="widefat" id="quiz_wp_final_title" name="quiz_wp_final_title" value="' . esc_attr($final_title) . '">';

        echo '<p><label for="quiz_wp_final_text"><strong>' . esc_html__('Текст результата по умолчанию', 'quiz-wp') . '</strong></label></p>';
        echo '<textarea class="widefat" rows="4" id="quiz_wp_final_text" name="quiz_wp_final_text">' . esc_textarea($final_text) . '</textarea>';

        echo '<p><label for="quiz_wp_cf7_form_id"><strong>' . esc_html__('ID формы Contact Form 7', 'quiz-wp') . '</strong></label></p>';
        echo '<input type="number" class="widefat" id="quiz_wp_cf7_form_id" name="quiz_wp_cf7_form_id" min="0" value="' . esc_attr((string) $cf7_form_id) . '">';

        echo '<p class="description">';
        echo esc_html__('Рекомендуемые hidden-поля в CF7: [hidden quiz_id], [hidden quiz_title], [hidden quiz_answers], [hidden quiz_result_title].', 'quiz-wp');
        echo '</p>';
    }

    private static function image_preview_markup(string $url, string $alt): string
    {
        if ('' === $url) {
            return '<div class="quiz-wp-image-preview is-empty">' . esc_html__('Изображение не выбрано', 'quiz-wp') . '</div>';
        }

        return '<div class="quiz-wp-image-preview"><img src="' . esc_url($url) . '" alt="' . esc_attr($alt) . '"></div>';
    }

    private static function sanitize_lines(string $raw): array
    {
        $lines = preg_split('/\r\n|\r|\n/', $raw);
        if (! is_array($lines)) {
            return [];
        }

        $clean = [];
        foreach ($lines as $line) {
            $line = sanitize_text_field($line);
            if ('' !== $line) {
                $clean[] = $line;
            }
        }

        return $clean;
    }

    private static function sanitize_rich_lines(string $raw): array
    {
        $lines = preg_split('/\r\n|\r|\n/', $raw);
        if (! is_array($lines)) {
            return [];
        }

        $clean = [];
        foreach ($lines as $line) {
            $line = self::sanitize_rich_text($line);
            if ('' !== trim(wp_strip_all_tags($line))) {
                $clean[] = $line;
            }
        }

        return $clean;
    }

    private static function sanitize_rich_text(string $value): string
    {
        return wp_kses($value, self::ALLOWED_HTML);
    }

    public static function save(int $post_id): void
    {
        if (! isset($_POST['quiz_wp_nonce']) || ! wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['quiz_wp_nonce'])), 'quiz_wp_save_meta')) {
            return;
        }

        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (! current_user_can('edit_post', $post_id)) {
            return;
        }

        $stages_raw = isset($_POST['quiz_wp_stages']) ? wp_unslash($_POST['quiz_wp_stages']) : '[]';
        $stages = json_decode($stages_raw, true);
        if (! is_array($stages)) {
            $stages = [self::default_stage()];
        }

        $clean_stages = [];
        foreach ($stages as $stage) {
            if (! is_array($stage)) {
                continue;
            }

            $options = [];
            if (! empty($stage['options']) && is_array($stage['options'])) {
                foreach ($stage['options'] as $option) {
                    if (! is_array($option)) {
                        continue;
                    }

                    $label = self::sanitize_rich_text((string) ($option['label'] ?? ''));
                    $value = sanitize_text_field($option['value'] ?? '');
                    $image_id = absint($option['image_id'] ?? 0);
                    $image_url = esc_url_raw($option['image_url'] ?? '');
                    $next_stage = absint($option['next_stage'] ?? 0);

                    if ('' === trim(wp_strip_all_tags($label)) && '' === $value && 0 === $image_id && '' === $image_url && 0 === $next_stage) {
                        continue;
                    }

                    $options[] = [
                        'label' => $label,
                        'value' => '' !== $value ? $value : sanitize_title(wp_strip_all_tags($label)),
                        'image_id' => $image_id,
                        'image_url' => $image_url,
                        'next_stage' => $next_stage,
                    ];
                }
            }

            $grid_columns = absint($stage['grid_columns'] ?? 2);
            $grid_columns = max(1, min(4, $grid_columns));

            $clean_stages[] = [
                'title' => self::sanitize_rich_text((string) ($stage['title'] ?? '')),
                'pick_hint_text' => self::sanitize_rich_text((string) ($stage['pick_hint_text'] ?? '')),
                'info_text' => self::sanitize_rich_text((string) ($stage['info_text'] ?? ($stage['description'] ?? ''))),
                'image_id' => absint($stage['image_id'] ?? 0),
                'image_url' => esc_url_raw($stage['image_url'] ?? ''),
                'stage_type' => 'fields' === ($stage['stage_type'] ?? '') ? 'fields' : 'options',
                'selection_mode' => 'multiple' === ($stage['selection_mode'] ?? '') ? 'multiple' : 'single',
                'grid_columns' => $grid_columns,
                'show_pick_hint' => ! empty($stage['show_pick_hint']) ? 1 : 0,
                'show_description' => ! empty($stage['show_description']) ? 1 : 0,
                'options' => ! empty($options) ? $options : [self::default_option()],
                'fields' => self::sanitize_fields($stage['fields'] ?? []),
            ];
        }

        $results_raw = isset($_POST['quiz_wp_results']) ? wp_unslash($_POST['quiz_wp_results']) : '[]';
        $results = json_decode($results_raw, true);
        if (! is_array($results)) {
            $results = [];
        }

        $clean_results = [];
        foreach ($results as $result) {
            if (! is_array($result)) {
                continue;
            }

            $trigger_values = [];
            if (! empty($result['trigger_values']) && is_array($result['trigger_values'])) {
                foreach ($result['trigger_values'] as $trigger) {
                    $trigger = sanitize_text_field($trigger);
                    if ('' !== $trigger) {
                        $trigger_values[] = $trigger;
                    }
                }
            }

            $title = self::sanitize_rich_text((string) ($result['title'] ?? ''));
            $text = self::sanitize_rich_text((string) ($result['text'] ?? ''));
            $image_id = absint($result['image_id'] ?? 0);
            $image_url = esc_url_raw($result['image_url'] ?? '');

            if ('' === $title && '' === $text && 0 === $image_id && '' === $image_url && empty($trigger_values)) {
                continue;
            }

            $clean_results[] = [
                'title' => $title,
                'text' => $text,
                'image_id' => $image_id,
                'image_url' => $image_url,
                'image_position' => 'right' === ($result['image_position'] ?? '') ? 'right' : 'left',
                'match_mode' => 'all' === ($result['match_mode'] ?? '') ? 'all' : 'any',
                'trigger_values' => $trigger_values,
            ];
        }

        update_post_meta($post_id, '_quiz_wp_stages', $clean_stages);
        update_post_meta($post_id, '_quiz_wp_results', $clean_results);
        update_post_meta($post_id, '_quiz_wp_intro_title', self::sanitize_rich_text((string) wp_unslash($_POST['quiz_wp_intro_title'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_intro_highlight', sanitize_text_field(wp_unslash($_POST['quiz_wp_intro_highlight'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_intro_description', self::sanitize_rich_text((string) wp_unslash($_POST['quiz_wp_intro_description'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_intro_button_label', self::sanitize_rich_text((string) wp_unslash($_POST['quiz_wp_intro_button_label'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_intro_time_text', self::sanitize_rich_text((string) wp_unslash($_POST['quiz_wp_intro_time_text'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_intro_image_id', absint($_POST['quiz_wp_intro_image_id'] ?? 0));
        update_post_meta($post_id, '_quiz_wp_intro_image_url', esc_url_raw(wp_unslash($_POST['quiz_wp_intro_image_url'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_intro_gift_1_title', self::sanitize_rich_text((string) wp_unslash($_POST['quiz_wp_intro_gift_1_title'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_intro_gift_1_text', self::sanitize_rich_text((string) wp_unslash($_POST['quiz_wp_intro_gift_1_text'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_intro_gift_2_title', self::sanitize_rich_text((string) wp_unslash($_POST['quiz_wp_intro_gift_2_title'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_intro_gift_2_text', self::sanitize_rich_text((string) wp_unslash($_POST['quiz_wp_intro_gift_2_text'] ?? '')));
        if (isset($_POST['quiz_wp_intro_benefits'])) {
            update_post_meta($post_id, '_quiz_wp_intro_benefits', self::sanitize_rich_lines((string) wp_unslash($_POST['quiz_wp_intro_benefits'])));
        }

        if (isset($_POST['quiz_wp_intro_bonus_items'])) {
            update_post_meta($post_id, '_quiz_wp_intro_bonus_items', self::sanitize_rich_lines((string) wp_unslash($_POST['quiz_wp_intro_bonus_items'])));
        }
        update_post_meta($post_id, '_quiz_wp_discount_label', sanitize_text_field(wp_unslash($_POST['quiz_wp_discount_label'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_side_expert_name', sanitize_text_field(wp_unslash($_POST['quiz_wp_side_expert_name'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_side_expert_role', self::sanitize_rich_text((string) wp_unslash($_POST['quiz_wp_side_expert_role'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_side_expert_quote', self::sanitize_rich_text((string) wp_unslash($_POST['quiz_wp_side_expert_quote'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_side_expert_avatar_id', absint($_POST['quiz_wp_side_expert_avatar_id'] ?? 0));
        update_post_meta($post_id, '_quiz_wp_side_expert_avatar_url', esc_url_raw(wp_unslash($_POST['quiz_wp_side_expert_avatar_url'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_privacy_url', esc_url_raw(wp_unslash($_POST['quiz_wp_privacy_url'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_contact_title', self::sanitize_rich_text((string) wp_unslash($_POST['quiz_wp_contact_title'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_contact_text', self::sanitize_rich_text((string) wp_unslash($_POST['quiz_wp_contact_text'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_contact_note', self::sanitize_rich_text((string) wp_unslash($_POST['quiz_wp_contact_note'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_thanks_review_label', self::sanitize_rich_text((string) wp_unslash($_POST['quiz_wp_thanks_review_label'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_thanks_review_url', esc_url_raw(wp_unslash($_POST['quiz_wp_thanks_review_url'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_thanks_rent_label', self::sanitize_rich_text((string) wp_unslash($_POST['quiz_wp_thanks_rent_label'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_thanks_rent_url', esc_url_raw(wp_unslash($_POST['quiz_wp_thanks_rent_url'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_thanks_book_label', self::sanitize_rich_text((string) wp_unslash($_POST['quiz_wp_thanks_book_label'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_thanks_book_url', esc_url_raw(wp_unslash($_POST['quiz_wp_thanks_book_url'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_final_title', self::sanitize_rich_text((string) wp_unslash($_POST['quiz_wp_final_title'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_final_text', self::sanitize_rich_text((string) wp_unslash($_POST['quiz_wp_final_text'] ?? '')));
        update_post_meta($post_id, '_quiz_wp_cf7_form_id', absint($_POST['quiz_wp_cf7_form_id'] ?? 0));
    }

    private static function sanitize_fields($fields): array
    {
        if (! is_array($fields)) {
            return [self::default_field()];
        }

        $clean_fields = [];
        foreach ($fields as $field) {
            if (! is_array($field)) {
                continue;
            }

            $label = self::sanitize_rich_text((string) ($field['label'] ?? ''));
            $placeholder = sanitize_text_field($field['placeholder'] ?? '');
            $type = 'number' === ($field['type'] ?? '') ? 'number' : 'text';

            if ('' === trim(wp_strip_all_tags($label)) && '' === $placeholder) {
                continue;
            }

            $clean_fields[] = [
                'label' => $label,
                'placeholder' => $placeholder,
                'type' => $type,
            ];
        }

        return ! empty($clean_fields) ? $clean_fields : [self::default_field()];
    }
}

