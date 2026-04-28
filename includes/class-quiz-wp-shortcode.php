<?php

namespace Quiz_WP;

if (! defined('ABSPATH')) {
    exit;
}

class Shortcode
{
    public static function register(): void
    {
        add_shortcode('quiz_wp', [__CLASS__, 'render']);
    }

    public static function render(array $atts): string
    {
        $atts = shortcode_atts([
            'id' => 0,
            'modal' => '0',
            'button_label' => __('Пройти тест', 'quiz-wp'),
            'button_class' => '',
            'trigger' => 'auto',
        ], $atts, 'quiz_wp');

        $quiz_id = absint($atts['id']);
        if (! $quiz_id) {
            return '';
        }

        $post = get_post($quiz_id);
        if (! $post || 'quiz_wp' !== $post->post_type) {
            return '';
        }

        $stages = get_post_meta($quiz_id, '_quiz_wp_stages', true);
        if (! is_array($stages) || empty($stages)) {
            return '<div class="quiz-wp-empty">' . esc_html__('Quiz is not configured yet.', 'quiz-wp') . '</div>';
        }

        $cf7_form_id = (int) get_post_meta($quiz_id, '_quiz_wp_cf7_form_id', true);
        $intro_benefits = get_post_meta($quiz_id, '_quiz_wp_intro_benefits', true);
        $intro_bonus_items = get_post_meta($quiz_id, '_quiz_wp_intro_bonus_items', true);

        if (! is_array($intro_benefits)) {
            $intro_benefits = [];
        }

        if (! is_array($intro_bonus_items)) {
            $intro_bonus_items = [];
        }

        $data = [
            'id' => $quiz_id,
            'title' => get_the_title($quiz_id),
            'stages' => $stages,
            'results' => get_post_meta($quiz_id, '_quiz_wp_results', true),
            'finalTitle' => (string) get_post_meta($quiz_id, '_quiz_wp_final_title', true),
            'finalText' => (string) get_post_meta($quiz_id, '_quiz_wp_final_text', true),
            'hasCf7' => $cf7_form_id > 0,
            'productFlow' => '1' === (string) get_post_meta($quiz_id, '_quiz_wp_product_flow', true),
            'discountLabel' => (string) get_post_meta($quiz_id, '_quiz_wp_discount_label', true),
            'privacyUrl' => (string) get_post_meta($quiz_id, '_quiz_wp_privacy_url', true),
            'sideExpert' => [
                'name' => (string) get_post_meta($quiz_id, '_quiz_wp_side_expert_name', true),
                'role' => (string) get_post_meta($quiz_id, '_quiz_wp_side_expert_role', true),
                'quote' => (string) get_post_meta($quiz_id, '_quiz_wp_side_expert_quote', true),
                'avatarUrl' => (string) get_post_meta($quiz_id, '_quiz_wp_side_expert_avatar_url', true),
            ],
            'contact' => [
                'title' => (string) get_post_meta($quiz_id, '_quiz_wp_contact_title', true),
                'text' => (string) get_post_meta($quiz_id, '_quiz_wp_contact_text', true),
                'note' => (string) get_post_meta($quiz_id, '_quiz_wp_contact_note', true),
            ],
            'intro' => [
                'title' => (string) get_post_meta($quiz_id, '_quiz_wp_intro_title', true),
                'highlight' => (string) get_post_meta($quiz_id, '_quiz_wp_intro_highlight', true),
                'description' => (string) get_post_meta($quiz_id, '_quiz_wp_intro_description', true),
                'buttonLabel' => (string) get_post_meta($quiz_id, '_quiz_wp_intro_button_label', true),
                'timeText' => (string) get_post_meta($quiz_id, '_quiz_wp_intro_time_text', true),
                'imageUrl' => (string) get_post_meta($quiz_id, '_quiz_wp_intro_image_url', true),
                'benefits' => $intro_benefits,
                'bonusItems' => $intro_bonus_items,
                'giftCards' => [
                    [
                        'title' => (string) get_post_meta($quiz_id, '_quiz_wp_intro_gift_1_title', true),
                        'text' => (string) get_post_meta($quiz_id, '_quiz_wp_intro_gift_1_text', true),
                    ],
                    [
                        'title' => (string) get_post_meta($quiz_id, '_quiz_wp_intro_gift_2_title', true),
                        'text' => (string) get_post_meta($quiz_id, '_quiz_wp_intro_gift_2_text', true),
                    ],
                ],
            ],
            'thanks' => [
                'title' => (string) get_post_meta($quiz_id, '_quiz_wp_thanks_title', true),
                'text' => (string) get_post_meta($quiz_id, '_quiz_wp_thanks_text', true),
                'imageUrl' => (string) get_post_meta($quiz_id, '_quiz_wp_thanks_image_url', true),
                'bonusesTitle' => (string) get_post_meta($quiz_id, '_quiz_wp_thanks_bonuses_title', true),
                'discountTitle' => (string) get_post_meta($quiz_id, '_quiz_wp_thanks_discount_title', true),
                'discountNote' => (string) get_post_meta($quiz_id, '_quiz_wp_thanks_discount_note', true),
                'bookTitle' => (string) get_post_meta($quiz_id, '_quiz_wp_thanks_book_title', true),
                'bookNote' => (string) get_post_meta($quiz_id, '_quiz_wp_thanks_book_note', true),
                'card1ImageUrl' => (string) get_post_meta($quiz_id, '_quiz_wp_thanks_card_1_image_url', true),
                'card2ImageUrl' => (string) get_post_meta($quiz_id, '_quiz_wp_thanks_card_2_image_url', true),
                'reviewLabel' => (string) get_post_meta($quiz_id, '_quiz_wp_thanks_review_label', true),
                'reviewUrl' => (string) get_post_meta($quiz_id, '_quiz_wp_thanks_review_url', true),
                'rentLabel' => (string) get_post_meta($quiz_id, '_quiz_wp_thanks_rent_label', true),
                'rentUrl' => (string) get_post_meta($quiz_id, '_quiz_wp_thanks_rent_url', true),
                'bookLabel' => (string) get_post_meta($quiz_id, '_quiz_wp_thanks_book_label', true),
                'bookUrl' => (string) get_post_meta($quiz_id, '_quiz_wp_thanks_book_url', true),
            ],
        ];

        if (! is_array($data['results'])) {
            $data['results'] = [];
        }

        wp_enqueue_style('quiz-wp-public');
        wp_enqueue_script('quiz-wp-public');

        $cf7_html = '';
        if ($cf7_form_id > 0) {
            $cf7_html = do_shortcode('[contact-form-7 id="' . $cf7_form_id . '"]');
        }

        $intro = self::prepare_intro_data($data);

        $is_modal = self::is_truthy((string) $atts['modal']);
        $app_attrs = 'class="quiz-wp-app" data-quiz="' . esc_attr(wp_json_encode($data)) . '"';
        if ($is_modal) {
            $app_attrs = 'class="quiz-wp-app" data-quiz-mode="modal" data-quiz="' . esc_attr(wp_json_encode($data)) . '"';
        }

        ob_start();

        if ($is_modal) {
            $modal_id = 'quiz-wp-modal-' . $quiz_id . '-' . wp_unique_id();
            $trigger_mode = strtolower(trim((string) $atts['trigger']));
            $show_trigger = ! in_array($trigger_mode, ['none', 'manual', 'false', '0'], true);
            ?>
            <?php if ($show_trigger) : ?>
                <button type="button" class="quiz-wp-modal-trigger <?php echo esc_attr((string) $atts['button_class']); ?>" data-quiz-wp-modal-target="#<?php echo esc_attr($modal_id); ?>">
                    <?php echo esc_html((string) $atts['button_label']); ?>
                </button>
            <?php endif; ?>
            <div class="quiz-wp-modal-overlay" id="<?php echo esc_attr($modal_id); ?>" data-quiz-wp-modal-id="<?php echo esc_attr((string) $quiz_id); ?>" aria-hidden="true">
                <div class="quiz-wp-modal-dialog" role="dialog" aria-modal="true">
                    <div <?php echo $app_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
                        <?php echo self::render_intro_markup($intro); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                        <template class="quiz-wp-cf7-template"><?php echo $cf7_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></template>
                    </div>
                </div>
            </div>
            <?php
        } else {
            ?>
            <div <?php echo $app_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
                <?php echo self::render_intro_markup($intro); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                <template class="quiz-wp-cf7-template"><?php echo $cf7_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></template>
            </div>
            <?php
        }

        return (string) ob_get_clean();
    }

    private static function is_truthy(string $value): bool
    {
        return in_array(strtolower(trim($value)), ['1', 'true', 'yes', 'on'], true);
    }

    private static function prepare_intro_data(array $data): array
    {
        $intro = is_array($data['intro'] ?? null) ? $data['intro'] : [];
        $title = (string) ($intro['title'] ?? 'Р Р€Р В·Р Р…Р В°Р в„–РЎвЂљР Вµ, Р С”Р В°Р С” {{highlight}} Р С—Р С•Р СР С•Р В¶Р ВµРЎвЂљ Р С‘Р СР ВµР Р…Р Р…Р С• Р Р†Р В°Р С');
        $highlight = (string) ($intro['highlight'] ?? 'Detensor');
        $description = (string) ($intro['description'] ?? ('Р СџРЎР‚Р С•Р в„–Р Т‘Р С‘РЎвЂљР Вµ РЎвЂљР ВµРЎРѓРЎвЂљ Р С‘Р В· ' . count($data['stages']) . ' Р Р†Р С•Р С—РЎР‚Р С•РЎРѓР С•Р Р† Р С‘ Р С—Р С•Р В»РЎС“РЎвЂЎР С‘РЎвЂљР Вµ Р С—Р ВµРЎР‚РЎРѓР С•Р Р…Р В°Р В»РЎРЉР Р…РЎС“РЎР‹ РЎР‚Р ВµР С”Р С•Р СР ВµР Р…Р Т‘Р В°РЎвЂ Р С‘РЎР‹'));
        $button_label = (string) ($intro['buttonLabel'] ?? 'Р СџРЎР‚Р С•Р в„–РЎвЂљР С‘ РЎвЂљР ВµРЎРѓРЎвЂљ');
        $time_text = (string) ($intro['timeText'] ?? '');
        $image_url = (string) ($intro['imageUrl'] ?? '');
        $benefits = is_array($intro['benefits'] ?? null) && ! empty($intro['benefits']) ? $intro['benefits'] : [
            'Книга в подарок',
            'Промокод на скидку',
            'Скидка 10%',
        ];
        $bonus_items = is_array($intro['bonusItems'] ?? null) && ! empty($intro['bonusItems']) ? $intro['bonusItems'] : array_slice($benefits, 0, 3);
        $gift_cards = is_array($intro['giftCards'] ?? null) ? $intro['giftCards'] : [];

        $title_html = str_replace(
            '{{highlight}}',
            '<span class="quiz-wp-brand">' . esc_html($highlight) . '</span>',
            $title
        );

        if ($title_html === $title && '' !== $highlight && false !== strpos($title, $highlight)) {
            $title_html = str_replace(
                $highlight,
                '<span class="quiz-wp-brand">' . esc_html($highlight) . '</span>',
                esc_html($title)
            );
        }

        return [
            'title_html' => wp_kses_post($title_html),
            'description' => wp_kses_post($description),
            'button_label' => wp_kses_post($button_label),
            'time_text' => wp_kses_post($time_text),
            'image_url' => esc_url($image_url),
            'benefits' => array_map('wp_kses_post', $benefits),
            'bonus_items' => array_map('wp_kses_post', $bonus_items),
            'gift_cards' => $gift_cards,
        ];
    }

    private static function render_intro_markup(array $intro): string
    {
        $gift_items = array_slice(array_values($intro['bonus_items']), 0, 2);
        if (empty($gift_items)) {
            $gift_items = ['Р В Р’В Р РЋРІвЂћСћР В Р’В Р В РІР‚В¦Р В Р’В Р РЋРІР‚ВР В Р’В Р РЋРІР‚вЂњР В Р’В Р вЂ™Р’В° Р В Р’В Р В РІР‚В  Р В Р’В Р РЋРІР‚вЂќР В Р’В Р РЋРІР‚СћР В Р’В Р СћРІР‚ВР В Р’В Р вЂ™Р’В°Р В Р Р‹Р В РІР‚С™Р В Р’В Р РЋРІР‚СћР В Р’В Р РЋРІР‚Сњ', 'Р В Р’В Р РЋРЎСџР В Р Р‹Р В РІР‚С™Р В Р’В Р РЋРІР‚СћР В Р’В Р РЋР’ВР В Р’В Р РЋРІР‚СћР В Р’В Р РЋРІР‚СњР В Р’В Р РЋРІР‚СћР В Р’В Р СћРІР‚В Р В Р’В Р В РІР‚В¦Р В Р’В Р вЂ™Р’В° Р В Р Р‹Р В РЎвЂњР В Р’В Р РЋРІР‚СњР В Р’В Р РЋРІР‚ВР В Р’В Р СћРІР‚ВР В Р’В Р РЋРІР‚СњР В Р Р‹Р РЋРІР‚Сљ'];
        }

        $gifts_html = '';
        $bonus_html = '';
        $gift_items = self::prepare_intro_gift_cards($intro);
        foreach ($gift_items as $index => $gift_item) {
            $mode = 0 === $index ? 'book' : 'promo';
            $icon = 0 === $index ? 'book' : 'percent';
            $fallback_text = 0 === $index ? 'Р В Р’В Р В РІР‚В  Р В Р’В Р РЋРІР‚вЂќР В Р’В Р РЋРІР‚СћР В Р’В Р СћРІР‚ВР В Р’В Р вЂ™Р’В°Р В Р Р‹Р В РІР‚С™Р В Р’В Р РЋРІР‚СћР В Р’В Р РЋРІР‚Сњ' : 'Р В Р’В Р В РІР‚В¦Р В Р’В Р вЂ™Р’В° Р В Р Р‹Р В РЎвЂњР В Р’В Р РЋРІР‚СњР В Р’В Р РЋРІР‚ВР В Р’В Р СћРІР‚ВР В Р’В Р РЋРІР‚СњР В Р Р‹Р РЋРІР‚Сљ';
            $gifts_html .= '<div class="quiz-wp-intro-gift quiz-wp-intro-gift--' . esc_attr($mode) . '">' .
                '<span class="quiz-wp-intro-gift-icon">' . self::render_icon($icon) . '</span>' .
                '<span class="quiz-wp-intro-gift-text">' .
                    '<strong>' . wp_kses_post($gift_item['title']) . '</strong>' .
                    '<small>' . wp_kses_post($gift_item['text']) . '</small>' .
                '</span>' .
            '</div>';
        }

        $image_html = '<div class="quiz-wp-intro-media' . ('' !== $intro['image_url'] ? '' : ' is-empty') . '">';
        if ('' !== $intro['image_url']) {
            $image_html .= '<img src="' . esc_url($intro['image_url']) . '" alt="">';
        }
        $image_html .= '</div>';

        return '' .
            '<div class="quiz-wp-shell">' .
                '<div class="quiz-wp-modal quiz-wp-modal--intro">' .
                    $image_html .
                    '<div class="quiz-wp-intro-panel">' .
                        '<h2 class="quiz-wp-title quiz-wp-title--intro">' . $intro['title_html'] . '</h2>' .
                        '<div class="quiz-wp-muted quiz-wp-intro-copy">' . $intro['description'] . '</div>' .
                        '<div class="quiz-wp-intro-gifts">' . $gifts_html . '</div>' .
                        '<button type="button" class="quiz-wp-btn quiz-wp-btn--primary quiz-wp-start">' .
                            '<span>' . $intro['button_label'] . '</span>' .
                            '<span class="quiz-wp-btn-icon">' . self::render_icon('arrow') . '</span>' .
                        '</button>' .
                        '<div class="quiz-wp-intro-time">' . self::intro_time_text($intro) . '</div>' .
                        '<div class="quiz-wp-intro-footer">' .
                            '<div class="quiz-wp-intro-footer-title">Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦ Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦ Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦ Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦Р В РЎвЂ”Р РЋРІР‚вЂќР В РІР‚В¦</div>' .
                            '<div class="quiz-wp-mini-bonuses">' . $bonus_html . '</div>' .
                        '</div>' .
                    '</div>' .
                '</div>' .
            '</div>';
    }

    private static function intro_time_text(array $intro): string
    {
        $time_text = trim((string) ($intro['time_text'] ?? ''));

        return wp_kses_post('' !== $time_text ? $time_text : 'Р С™Р Р†Р С‘Р В· Р В·Р В°Р в„–Р СРЎвЂРЎвЂљ Р Р…Р Вµ Р В±Р С•Р В»Р ВµР Вµ 2 Р СР С‘Р Р…РЎС“РЎвЂљ');
    }

    private static function prepare_intro_gift_cards(array $intro): array
    {
        $cards = [];
        $gift_cards = is_array($intro['gift_cards'] ?? null) ? $intro['gift_cards'] : [];

        foreach ($gift_cards as $card) {
            if (! is_array($card)) {
                continue;
            }

            $title = trim((string) ($card['title'] ?? ''));
            $text = trim((string) ($card['text'] ?? ''));

            if ('' !== $title || '' !== $text) {
                $cards[] = [
                    'title' => '' !== $title ? wp_kses_post($title) : '',
                    'text' => '' !== $text ? wp_kses_post($text) : '',
                ];
            }
        }

        if (empty($cards)) {
            foreach (array_slice(array_values($intro['bonus_items'] ?? []), 0, 2) as $bonus_item) {
                $cards[] = [
                    'title' => wp_kses_post((string) $bonus_item),
                    'text' => '',
                ];
            }
        }

        $fallbacks = [
            ['title' => 'Р В Р’В Р РЋРІвЂћСћР В Р’В Р В РІР‚В¦Р В Р’В Р РЋРІР‚ВР В Р’В Р РЋРІР‚вЂњР В Р’В Р вЂ™Р’В°', 'text' => 'Р В Р’В Р В РІР‚В  Р В Р’В Р РЋРІР‚вЂќР В Р’В Р РЋРІР‚СћР В Р’В Р СћРІР‚ВР В Р’В Р вЂ™Р’В°Р В Р Р‹Р В РІР‚С™Р В Р’В Р РЋРІР‚СћР В Р’В Р РЋРІР‚Сњ'],
            ['title' => 'Р В Р’В Р РЋРЎСџР В Р Р‹Р В РІР‚С™Р В Р’В Р РЋРІР‚СћР В Р’В Р РЋР’ВР В Р’В Р РЋРІР‚СћР В Р’В Р РЋРІР‚СњР В Р’В Р РЋРІР‚СћР В Р’В Р СћРІР‚В', 'text' => 'Р В Р’В Р В РІР‚В¦Р В Р’В Р вЂ™Р’В° Р В Р Р‹Р В РЎвЂњР В Р’В Р РЋРІР‚СњР В Р’В Р РЋРІР‚ВР В Р’В Р СћРІР‚ВР В Р’В Р РЋРІР‚СњР В Р Р‹Р РЋРІР‚Сљ'],
        ];

        foreach ($fallbacks as $index => $fallback) {
            if (! isset($cards[$index])) {
                $cards[$index] = $fallback;
                continue;
            }

            if ('' === $cards[$index]['title']) {
                $cards[$index]['title'] = $fallback['title'];
            }

            if ('' === $cards[$index]['text']) {
                $cards[$index]['text'] = $fallback['text'];
            }
        }

        return array_slice($cards, 0, 2);
    }

    private static function render_icon(string $name): string
    {
        $icons = [
            'check' => '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.3272 3.99817L5.99721 11.3281L2.66541 7.99633" stroke="#00A859" stroke-width="1.33272" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            'check-soft' => '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.3272 3.99817L5.99721 11.3281L2.66541 7.99633" stroke="#00A859" stroke-width="1.33272" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            'arrow' => '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.33179 7.99609H12.6608" stroke="white" stroke-width="1.33272" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.99634 3.33203L12.6609 7.99655L7.99634 12.6611" stroke="white" stroke-width="1.33272" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            'back' => '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.99448 11.0743L2.91437 6.99418L6.99448 2.91406" stroke="#6B7280" stroke-width="1.16575" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.0746 6.99414H2.91437" stroke="#6B7280" stroke-width="1.16575" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            'close' => '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.9945 3.99805L3.99817 11.9944" stroke="#1A1A2E" stroke-width="1.33272" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.99817 3.99805L11.9945 11.9944" stroke="#1A1A2E" stroke-width="1.33272" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            'book' => '<svg width="29" height="39" viewBox="0 0 29 39" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.83337 29.4965V9.50355C4.83337 8.61981 5.15164 7.77226 5.71816 7.14735C6.28467 6.52245 7.05303 6.17139 7.85421 6.17139H22.9584C23.2788 6.17139 23.5862 6.31181 23.8128 6.56177C24.0394 6.81173 24.1667 7.15075 24.1667 7.50425V31.4958C24.1667 31.8493 24.0394 32.1883 23.8128 32.4383C23.5862 32.6883 23.2788 32.8287 22.9584 32.8287H7.85421C7.05303 32.8287 6.28467 32.4776 5.71816 31.8527C5.15164 31.2278 4.83337 30.3803 4.83337 29.4965ZM4.83337 29.4965C4.83337 28.6128 5.15164 27.7652 5.71816 27.1403C6.28467 26.5154 7.05303 26.1644 7.85421 26.1644H24.1667" stroke="#0057B8" stroke-width="1.23009" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            'phone' => '<svg width="22" height="24" viewBox="0 0 22 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.426 16.9973V20.426C21.4272 20.7443 21.3678 21.0594 21.2515 21.351C21.1353 21.6427 20.9649 21.9045 20.7511 22.1197C20.5373 22.3349 20.2849 22.4987 20.0101 22.6007C19.7353 22.7026 19.4441 22.7405 19.1552 22.7119C15.9498 22.3297 12.8708 21.1279 10.1656 19.2031C7.64875 17.4483 5.51491 15.1071 3.9156 12.3456C2.15516 9.36396 1.0596 5.96925 0.717683 2.4365C0.691653 2.12044 0.725886 1.8019 0.818205 1.50116C0.910523 1.20042 1.0589 0.92406 1.2539 0.689684C1.44889 0.455308 1.68623 0.268049 1.9508 0.139828C2.21537 0.0116067 2.50137 -0.0547661 2.7906 -0.055065H5.9156C6.42113 -0.0605241 6.91122 0.135892 7.29452 0.497573C7.67782 0.859254 7.92818 1.36152 7.99893 1.91075C8.13083 3.00803 8.37544 4.08541 8.7281 5.12235C8.86825 5.53143 8.89858 5.97601 8.8155 6.40343C8.73242 6.83084 8.53942 7.22316 8.25935 7.53391L6.93643 8.98542C8.4193 11.8468 10.5786 14.2159 13.1864 15.8429L14.5093 14.3914C14.7926 14.0841 15.1501 13.8724 15.5397 13.7812C15.9292 13.6901 16.3344 13.7233 16.7073 13.8771C17.6523 14.264 18.6343 14.5324 19.6344 14.6771C20.1404 14.7555 20.6025 15.0351 20.9328 15.4629C21.2632 15.8907 21.4387 16.4368 21.426 16.9973Z" stroke="#0057B8" stroke-width="1.4185" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            'percent' => '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.8333 4.1665L4.16663 15.8332" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.41671 7.50016C6.5673 7.50016 7.50004 6.56742 7.50004 5.41683C7.50004 4.26624 6.5673 3.3335 5.41671 3.3335C4.26611 3.3335 3.33337 4.26624 3.33337 5.41683C3.33337 6.56742 4.26611 7.50016 5.41671 7.50016Z" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.5833 16.6667C15.7339 16.6667 16.6667 15.7339 16.6667 14.5833C16.6667 13.4327 15.7339 12.5 14.5833 12.5C13.4327 12.5 12.5 13.4327 12.5 14.5833C12.5 15.7339 13.4327 16.6667 14.5833 16.6667Z" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            'success' => '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M26.6545 7.99609L11.9945 22.656L5.33093 15.9924" stroke="#00A859" stroke-width="2.66544" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        ];

        return $icons[$name] ?? $icons['check'];
    }
}
