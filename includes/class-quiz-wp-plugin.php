<?php

namespace Quiz_WP;

if (! defined('ABSPATH')) {
    exit;
}

require_once QUIZ_WP_PATH . 'includes/class-quiz-wp-post-type.php';
require_once QUIZ_WP_PATH . 'includes/class-quiz-wp-meta-box.php';
require_once QUIZ_WP_PATH . 'includes/class-quiz-wp-shortcode.php';

class Plugin
{
    private static ?Plugin $instance = null;

    public static function instance(): Plugin
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    private function __construct()
    {
        add_action('init', [$this, 'register_components']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_public_assets']);
    }

    public function register_components(): void
    {
        Post_Type::register();
        Meta_Box::register();
        Shortcode::register();
    }

    public function enqueue_admin_assets(string $hook): void
    {
        global $post_type;

        if ('quiz_wp' !== $post_type) {
            return;
        }

        wp_enqueue_media();
        wp_enqueue_style('quiz-wp-admin', QUIZ_WP_URL . 'assets/css/admin.css', [], QUIZ_WP_VERSION);
        wp_enqueue_script('quiz-wp-admin', QUIZ_WP_URL . 'assets/js/admin.js', ['jquery'], QUIZ_WP_VERSION, true);

        wp_localize_script('quiz-wp-admin', 'QuizWpAdmin', [
            'stageTemplate' => Meta_Box::default_stage(),
            'optionTemplate' => Meta_Box::default_option(),
            'fieldTemplate' => Meta_Box::default_field(),
            'resultTemplate' => Meta_Box::default_result(),
            'mediaTitle' => __('�������� �����������', 'quiz-wp'),
            'mediaButton' => __('������������ �����������', 'quiz-wp'),
        ]);
    }

    public function enqueue_public_assets(): void
    {
        wp_enqueue_style('quiz-wp-public', QUIZ_WP_URL . 'assets/css/public.css', [], QUIZ_WP_VERSION);
        wp_enqueue_script('quiz-wp-public', QUIZ_WP_URL . 'assets/js/public.js', [], QUIZ_WP_VERSION, true);
    }
}
