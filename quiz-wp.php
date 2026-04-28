<?php
/**
 * Plugin Name: Quiz WP Builder
 * Description: Quiz builder for WordPress with editable stages, images, single or multiple choice answers, and Contact Form 7 integration.
 * Version: 0.1.2
 * Author: Detensor Quiz
 * Text Domain: quiz-wp
 */

if (! defined('ABSPATH')) {
    exit;
}

define('QUIZ_WP_VERSION', '0.1.2');
define('QUIZ_WP_FILE', __FILE__);
define('QUIZ_WP_PATH', plugin_dir_path(__FILE__));
define('QUIZ_WP_URL', plugin_dir_url(__FILE__));

require_once QUIZ_WP_PATH . 'includes/class-quiz-wp-plugin.php';

\Quiz_WP\Plugin::instance();
