<?php

namespace Quiz_WP;

if (! defined('ABSPATH')) {
    exit;
}

class Import_Export
{
    private const VERSION = 2;

    private const META_KEYS = [
        '_quiz_wp_stages',
        '_quiz_wp_results',
        '_quiz_wp_intro_title',
        '_quiz_wp_intro_highlight',
        '_quiz_wp_intro_description',
        '_quiz_wp_intro_button_label',
        '_quiz_wp_intro_time_text',
        '_quiz_wp_intro_image_url',
        '_quiz_wp_intro_gift_1_title',
        '_quiz_wp_intro_gift_1_text',
        '_quiz_wp_intro_gift_2_title',
        '_quiz_wp_intro_gift_2_text',
        '_quiz_wp_intro_benefits',
        '_quiz_wp_intro_bonus_items',
        '_quiz_wp_discount_label',
        '_quiz_wp_side_expert_name',
        '_quiz_wp_side_expert_role',
        '_quiz_wp_side_expert_quote',
        '_quiz_wp_side_expert_avatar_url',
        '_quiz_wp_privacy_url',
        '_quiz_wp_contact_title',
        '_quiz_wp_contact_text',
        '_quiz_wp_contact_note',
        '_quiz_wp_thanks_title',
        '_quiz_wp_thanks_text',
        '_quiz_wp_thanks_image_url',
        '_quiz_wp_thanks_bonuses_title',
        '_quiz_wp_thanks_discount_title',
        '_quiz_wp_thanks_discount_note',
        '_quiz_wp_thanks_book_title',
        '_quiz_wp_thanks_book_note',
        '_quiz_wp_thanks_card_1_image_url',
        '_quiz_wp_thanks_card_2_image_url',
        '_quiz_wp_thanks_review_label',
        '_quiz_wp_thanks_review_url',
        '_quiz_wp_thanks_rent_label',
        '_quiz_wp_thanks_rent_url',
        '_quiz_wp_thanks_book_label',
        '_quiz_wp_thanks_book_url',
        '_quiz_wp_final_title',
        '_quiz_wp_final_text',
        '_quiz_wp_product_flow',
        '_quiz_wp_product_settings',
        '_quiz_wp_cf7_form_id',
    ];

    public static function register(): void
    {
        add_action('add_meta_boxes', [__CLASS__, 'add_meta_box']);
        add_action('admin_post_quiz_wp_export', [__CLASS__, 'export']);
        add_action('admin_post_quiz_wp_import', [__CLASS__, 'import']);
        add_action('admin_notices', [__CLASS__, 'admin_notices']);
        add_action('admin_footer-post.php', [__CLASS__, 'render_import_form_shell']);
    }

    public static function add_meta_box(): void
    {
        add_meta_box(
            'quiz-wp-import-export',
            __('Импорт / экспорт', 'quiz-wp'),
            [__CLASS__, 'render_meta_box'],
            'quiz_wp',
            'side',
            'default'
        );
    }

    public static function render_meta_box(\WP_Post $post): void
    {
        $form_id = 'quiz-wp-import-form-' . (int) $post->ID;
        $export_url = wp_nonce_url(
            admin_url('admin-post.php?action=quiz_wp_export&post_id=' . (int) $post->ID),
            'quiz_wp_export_' . (int) $post->ID
        );

        echo '<p>Экспорт скачает JSON-файл с настройками этого квиза.</p>';
        echo '<p><a class="button button-secondary" href="' . esc_url($export_url) . '">Экспорт JSON</a></p>';
        echo '<hr>';
        echo '<p>Импорт обновит текущий квиз данными из JSON-файла. Изображения переносятся как URL.</p>';
        echo '<div class="quiz-wp-import-fields">';
        echo '<input type="hidden" form="' . esc_attr($form_id) . '" name="action" value="quiz_wp_import">';
        echo '<input type="hidden" form="' . esc_attr($form_id) . '" name="post_id" value="' . esc_attr((string) $post->ID) . '">';
        echo '<input type="hidden" form="' . esc_attr($form_id) . '" name="quiz_wp_import_nonce" value="' . esc_attr(wp_create_nonce('quiz_wp_import_' . (int) $post->ID)) . '">';
        echo '<p><input type="file" form="' . esc_attr($form_id) . '" name="quiz_wp_import_file" accept="application/json,.json"></p>';
        echo '<p><button type="submit" class="button button-primary">Импорт JSON</button></p>';
        echo '</div>';
        echo '<script>(function(){var box=document.currentScript.previousElementSibling;if(!box){return;}var button=box.querySelector("button[type=submit]");if(button){button.setAttribute("form","' . esc_js($form_id) . '");}})();</script>';
    }

    public static function render_import_form_shell(): void
    {
        global $post;

        if (! $post instanceof \WP_Post || 'quiz_wp' !== $post->post_type) {
            return;
        }

        echo '<form id="quiz-wp-import-form-' . esc_attr((string) $post->ID) . '" method="post" action="' . esc_url(admin_url('admin-post.php')) . '" enctype="multipart/form-data"></form>';
    }

    public static function export(): void
    {
        $post_id = absint($_GET['post_id'] ?? 0);
        self::guard_post_access($post_id, 'quiz_wp_export_' . $post_id);

        $post = get_post($post_id);
        if (! $post || 'quiz_wp' !== $post->post_type) {
            wp_die(esc_html__('Квиз не найден.', 'quiz-wp'));
        }

        $payload = [
            'plugin' => 'quiz-wp',
            'version' => self::VERSION,
            'exported_at' => gmdate('c'),
            'title' => get_the_title($post_id),
            'meta' => [],
        ];

        foreach (self::META_KEYS as $key) {
            $value = get_post_meta($post_id, $key, true);

            if ('_quiz_wp_product_settings' === $key) {
                $value = self::sanitize_product_settings($value);
            }

            $payload['meta'][$key] = $value;
        }

        $filename = sanitize_file_name('quiz-wp-' . $post_id . '-' . gmdate('Y-m-d-H-i-s') . '.json');
        nocache_headers();
        header('Content-Type: application/json; charset=' . get_option('blog_charset'));
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        echo wp_json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function import(): void
    {
        $post_id = absint($_POST['post_id'] ?? 0);
        self::guard_post_access($post_id, 'quiz_wp_import_' . $post_id, 'quiz_wp_import_nonce');

        $redirect = get_edit_post_link($post_id, 'raw');
        if (! $redirect) {
            $redirect = admin_url('edit.php?post_type=quiz_wp');
        }

        if (empty($_FILES['quiz_wp_import_file']['tmp_name']) || ! is_uploaded_file($_FILES['quiz_wp_import_file']['tmp_name'])) {
            self::redirect_with_status($redirect, 'error');
        }

        $raw = file_get_contents($_FILES['quiz_wp_import_file']['tmp_name']);
        $payload = json_decode((string) $raw, true);

        if (! is_array($payload) || ($payload['plugin'] ?? '') !== 'quiz-wp' || ! is_array($payload['meta'] ?? null)) {
            self::redirect_with_status($redirect, 'invalid');
        }

        $title = sanitize_text_field((string) ($payload['title'] ?? ''));
        if ('' !== $title) {
            wp_update_post([
                'ID' => $post_id,
                'post_title' => $title,
            ]);
        }

        foreach (self::META_KEYS as $key) {
            if (! array_key_exists($key, $payload['meta'])) {
                continue;
            }

            update_post_meta($post_id, $key, self::sanitize_import_value($key, $payload['meta'][$key]));
        }

        self::redirect_with_status($redirect, 'success');
    }

    public static function admin_notices(): void
    {
        if (! isset($_GET['quiz_wp_import'])) {
            return;
        }

        $status = sanitize_key((string) $_GET['quiz_wp_import']);
        $messages = [
            'success' => ['updated', 'Квиз импортирован. Проверьте данные и нажмите “Обновить”, если внесёте правки.'],
            'error' => ['error', 'Не удалось загрузить файл импорта.'],
            'invalid' => ['error', 'Файл импорта не похож на экспорт Quiz WP.'],
        ];

        if (! isset($messages[$status])) {
            return;
        }

        [$class, $message] = $messages[$status];
        echo '<div class="notice notice-' . esc_attr($class) . ' is-dismissible"><p>' . esc_html($message) . '</p></div>';
    }

    private static function guard_post_access(int $post_id, string $action, string $nonce_name = '_wpnonce'): void
    {
        if (! $post_id || ! current_user_can('edit_post', $post_id)) {
            wp_die(esc_html__('Недостаточно прав.', 'quiz-wp'));
        }

        $nonce = isset($_REQUEST[$nonce_name]) ? sanitize_text_field(wp_unslash($_REQUEST[$nonce_name])) : '';
        if (! wp_verify_nonce($nonce, $action)) {
            wp_die(esc_html__('Проверка безопасности не пройдена.', 'quiz-wp'));
        }
    }

    private static function redirect_with_status(string $redirect, string $status): void
    {
        wp_safe_redirect(add_query_arg('quiz_wp_import', $status, $redirect));
        exit;
    }

    private static function sanitize_import_value(string $key, $value)
    {
        if ('_quiz_wp_stages' === $key) {
            return self::sanitize_stages($value);
        }

        if ('_quiz_wp_results' === $key) {
            return self::sanitize_results($value);
        }

        if (in_array($key, ['_quiz_wp_intro_benefits', '_quiz_wp_intro_bonus_items'], true)) {
            return self::sanitize_text_lines($value);
        }

        if ('_quiz_wp_product_flow' === $key) {
            return self::truthy($value) ? '1' : '0';
        }

        if ('_quiz_wp_product_settings' === $key) {
            return self::sanitize_product_settings($value);
        }

        if ('_quiz_wp_cf7_form_id' === $key) {
            return absint($value);
        }

        if ('_url' === substr($key, -4)) {
            return esc_url_raw((string) $value);
        }

        return wp_kses_post((string) $value);
    }

    private static function sanitize_stages($stages): array
    {
        if (! is_array($stages)) {
            return [Meta_Box::default_stage()];
        }

        $clean = [];
        foreach ($stages as $stage) {
            if (! is_array($stage)) {
                continue;
            }

            $grid_columns = max(1, min(4, absint($stage['grid_columns'] ?? 2)));
            $clean[] = [
                'title' => wp_kses_post((string) ($stage['title'] ?? '')),
                'pick_hint_text' => wp_kses_post((string) ($stage['pick_hint_text'] ?? '')),
                'info_text' => wp_kses_post((string) ($stage['info_text'] ?? ($stage['description'] ?? ''))),
                'image_id' => 0,
                'image_url' => esc_url_raw((string) ($stage['image_url'] ?? '')),
                'stage_type' => 'fields' === ($stage['stage_type'] ?? '') ? 'fields' : 'options',
                'selection_mode' => 'multiple' === ($stage['selection_mode'] ?? '') ? 'multiple' : 'single',
                'grid_columns' => $grid_columns,
                'answer_style' => 'controls' === ($stage['answer_style'] ?? '') ? 'controls' : 'default',
                'show_pick_hint' => ! empty($stage['show_pick_hint']) ? 1 : 0,
                'show_description' => ! empty($stage['show_description']) ? 1 : 0,
                'options' => self::sanitize_options($stage['options'] ?? []),
                'fields' => self::sanitize_fields($stage['fields'] ?? []),
            ];
        }

        return $clean ?: [Meta_Box::default_stage()];
    }

    private static function sanitize_options($options): array
    {
        if (! is_array($options)) {
            return [Meta_Box::default_option()];
        }

        $clean = [];
        foreach ($options as $option) {
            if (! is_array($option)) {
                continue;
            }

            $label = wp_kses_post((string) ($option['label'] ?? ''));
            $value = sanitize_text_field((string) ($option['value'] ?? ''));
            $clean[] = [
                'label' => $label,
                'value' => '' !== $value ? $value : sanitize_title(wp_strip_all_tags($label)),
                'image_id' => 0,
                'image_url' => esc_url_raw((string) ($option['image_url'] ?? '')),
                'next_stage' => absint($option['next_stage'] ?? 0),
            ];
        }

        return $clean ?: [Meta_Box::default_option()];
    }

    private static function sanitize_fields($fields): array
    {
        if (! is_array($fields)) {
            return [Meta_Box::default_field()];
        }

        $clean = [];
        foreach ($fields as $field) {
            if (! is_array($field)) {
                continue;
            }

            $clean[] = [
                'label' => sanitize_text_field((string) ($field['label'] ?? '')),
                'placeholder' => sanitize_text_field((string) ($field['placeholder'] ?? '')),
                'type' => 'number' === ($field['type'] ?? '') ? 'number' : 'text',
            ];
        }

        return $clean ?: [Meta_Box::default_field()];
    }

    private static function sanitize_results($results): array
    {
        if (! is_array($results)) {
            return [];
        }

        $clean = [];
        foreach ($results as $result) {
            if (! is_array($result)) {
                continue;
            }

            $trigger_values = [];
            if (is_array($result['trigger_values'] ?? null)) {
                foreach ($result['trigger_values'] as $trigger) {
                    $trigger = sanitize_text_field((string) $trigger);
                    if ('' !== $trigger) {
                        $trigger_values[] = $trigger;
                    }
                }
            }

            $clean[] = [
                'title' => wp_kses_post((string) ($result['title'] ?? '')),
                'text' => wp_kses_post((string) ($result['text'] ?? '')),
                'image_id' => 0,
                'image_url' => esc_url_raw((string) ($result['image_url'] ?? '')),
                'image_position' => 'right' === ($result['image_position'] ?? '') ? 'right' : 'left',
                'match_mode' => 'all' === ($result['match_mode'] ?? '') ? 'all' : 'any',
                'trigger_values' => $trigger_values,
            ];
        }

        return $clean;
    }

    private static function sanitize_product_settings($settings): array
    {
        if (! is_array($settings)) {
            $settings = [];
        }

        $defaults = self::product_settings_defaults();
        $general = is_array($settings['general'] ?? null) ? $settings['general'] : [];
        $items = is_array($settings['items'] ?? null) ? $settings['items'] : [];
        $clean = ['general' => [], 'items' => []];

        foreach ($defaults['general'] as $key => $default_value) {
            $clean['general'][$key] = wp_kses_post((string) ($general[$key] ?? $default_value));
        }

        foreach ($defaults['items'] as $hardness => $default_item) {
            $item = is_array($items[$hardness] ?? null) ? $items[$hardness] : [];

            $clean['items'][$hardness] = [
                'title' => wp_kses_post((string) ($item['title'] ?? $default_item['title'])),
                'text' => wp_kses_post((string) ($item['text'] ?? $default_item['text'])),
                'weight' => sanitize_text_field((string) ($item['weight'] ?? $default_item['weight'])),
                'image_id' => 0,
                'image_url' => esc_url_raw((string) ($item['image_url'] ?? '')),
                'recommendation' => wp_kses_post((string) ($item['recommendation'] ?? $default_item['recommendation'])),
            ];
        }

        return $clean;
    }

    private static function product_settings_defaults(): array
    {
        $items = [];

        foreach (['0', '1', '2', '2+', '3'] as $hardness) {
            $items[$hardness] = [
                'title' => 'Жёсткость ' . $hardness,
                'text' => '',
                'weight' => '',
                'image_id' => 0,
                'image_url' => '',
                'recommendation' => '',
            ];
        }

        return [
            'general' => [
                'choice_title' => 'Мы подобрали {{count}} варианта',
                'choice_subtitle' => 'Выберите подходящий вариант Лечебного тракционного мата Детензор 18%',
                'result_title' => 'Ваш результат',
                'result_lead' => 'На основании ваших ответов мы подобрали<br>оптимальный вариант —',
                'recommendation_title' => 'Рекомендация специалиста',
            ],
            'items' => $items,
        ];
    }

    private static function sanitize_text_lines($value): array
    {
        if (is_array($value)) {
            $lines = $value;
        } else {
            $lines = preg_split('/\r\n|\r|\n/', (string) $value);
        }

        $clean = [];
        foreach ((array) $lines as $line) {
            $line = wp_kses_post((string) $line);
            if ('' !== trim(wp_strip_all_tags($line))) {
                $clean[] = $line;
            }
        }

        return $clean;
    }

    private static function truthy($value): bool
    {
        return in_array(strtolower(trim((string) $value)), ['1', 'true', 'yes', 'on'], true);
    }
}
