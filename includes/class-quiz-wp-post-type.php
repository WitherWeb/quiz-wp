<?php

namespace Quiz_WP;

if (! defined('ABSPATH')) {
    exit;
}

class Post_Type
{
    public static function register(): void
    {
        register_post_type('quiz_wp', [
            'labels' => [
                'name' => __('Квизы', 'quiz-wp'),
                'singular_name' => __('Квиз', 'quiz-wp'),
                'add_new_item' => __('Добавить квиз', 'quiz-wp'),
                'edit_item' => __('Редактировать квиз', 'quiz-wp'),
            ],
            'public' => false,
            'show_ui' => true,
            'show_in_menu' => true,
            'menu_icon' => 'dashicons-list-view',
            'supports' => ['title'],
        ]);
    }
}
