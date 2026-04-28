# Quiz WP Builder

WordPress quiz plugin with editable stages, images, single or multiple choice answers, and Contact Form 7 integration.

## Install

1. Copy `quiz-wp` to `wp-content/plugins/`.
2. Activate `Quiz WP Builder`.
3. Make sure `Contact Form 7` is active.

## Usage

1. Open `Quizzes` in WordPress admin.
2. Create a new quiz.
3. Add stages, titles, descriptions, images, and answer options.
4. Set Contact Form 7 form ID in the side box.
5. Save the quiz.

Use shortcode:

```text
[quiz_wp id="123"]
```

## Recommended Contact Form 7 hidden fields

```text
[hidden quiz_id]
[hidden quiz_title]
[hidden quiz_answers]
```