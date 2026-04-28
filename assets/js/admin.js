(function ($) {
    function cloneDeep(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function normalizeStage(stage) {
        stage.stage_type = stage.stage_type === 'fields' ? 'fields' : 'options';
        stage.options = Array.isArray(stage.options) && stage.options.length ? stage.options : [cloneDeep(window.QuizWpAdmin.optionTemplate)];
        stage.fields = Array.isArray(stage.fields) && stage.fields.length ? stage.fields : [cloneDeep(window.QuizWpAdmin.fieldTemplate)];
        stage.grid_columns = parseInt(stage.grid_columns, 10) || 2;
        stage.selection_mode = stage.selection_mode === 'multiple' ? 'multiple' : 'single';
        stage.show_pick_hint = !(String(stage.show_pick_hint) === '0' || stage.show_pick_hint === false);
        stage.show_description = !(String(stage.show_description) === '0' || stage.show_description === false);
        stage.pick_hint_text = stage.pick_hint_text || '';
        stage.info_text = stage.info_text || stage.description || '';
        return stage;
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function renderImagePreview(url, alt) {
        if (!url) {
            return '<div class="quiz-wp-image-preview is-empty">Изображение не выбрано</div>';
        }

        return '<div class="quiz-wp-image-preview"><img src="' + escapeHtml(url) + '" alt="' + escapeHtml(alt) + '"></div>';
    }

    function renderFieldCard(field, index) {
        return $(
            '<div class="quiz-wp-parameter-card">' +
                '<div class="quiz-wp-option-top">' +
                    '<span class="quiz-wp-option-order">Поле ' + (index + 1) + '</span>' +
                '</div>' +
                '<div class="quiz-wp-option-fields">' +
                    '<div class="quiz-wp-field-block">' +
                        '<label class="quiz-wp-label">Ярлык поля</label>' +
                        '<input type="text" class="quiz-wp-param-label" value="' + escapeHtml(field.label || '') + '" placeholder="Рост (см)">' +
                    '</div>' +
                    '<div class="quiz-wp-field-block">' +
                        '<label class="quiz-wp-label">Плейсхолдер</label>' +
                        '<input type="text" class="quiz-wp-param-placeholder" value="' + escapeHtml(field.placeholder || '') + '" placeholder="Например: 157 см">' +
                    '</div>' +
                '</div>' +
                '<div class="quiz-wp-field-block">' +
                    '<label class="quiz-wp-label">Тип поля</label>' +
                    '<select class="quiz-wp-param-type">' +
                        '<option value="text"' + ((field.type || 'text') === 'text' ? ' selected' : '') + '>Текст</option>' +
                        '<option value="number"' + (field.type === 'number' ? ' selected' : '') + '>Число</option>' +
                    '</select>' +
                '</div>' +
                '<button type="button" class="button-link-delete quiz-wp-remove-field">Удалить</button>' +
            '</div>'
        );
    }

    function renderOptionCard(option, index) {
        var buttonLabel = option.image_url ? 'Заменить изображение' : 'Выбрать изображение';

        return $(
            '<div class="quiz-wp-option-card" draggable="true">' +
                '<div class="quiz-wp-option-top">' +
                    '<span class="quiz-wp-drag-handle" title="Перетащите для сортировки">::</span>' +
                    '<span class="quiz-wp-option-order">Вариант ' + (index + 1) + '</span>' +
                '</div>' +
                '<div class="quiz-wp-option-fields">' +
                    '<div class="quiz-wp-field-block">' +
                        '<label class="quiz-wp-label">Текст варианта</label>' +
                        '<input type="text" class="quiz-wp-option-label" value="' + escapeHtml(option.label || '') + '" placeholder="Название варианта">' +
                    '</div>' +
                    '<div class="quiz-wp-field-block">' +
                        '<label class="quiz-wp-label">Значение варианта</label>' +
                        '<input type="text" class="quiz-wp-option-value" value="' + escapeHtml(option.value || '') + '" placeholder="Значение для правил результата">' +
                    '</div>' +
                '</div>' +
                '<div class="quiz-wp-field-block">' +
                    '<label class="quiz-wp-label">Следующий шаг</label>' +
                    '<input type="number" min="0" class="quiz-wp-option-next-stage" value="' + escapeHtml(option.next_stage || 0) + '" placeholder="0 = следующий по порядку">' +
                    '<div class="quiz-wp-help">Укажите номер шага, на который нужно перейти после выбора этого варианта. 0 - обычный переход.</div>' +
                '</div>' +
                '<div class="quiz-wp-image-row quiz-wp-option-image-row">' +
                    '<input type="hidden" class="quiz-wp-option-image-id" value="' + (option.image_id || 0) + '">' +
                    '<input type="url" class="widefat quiz-wp-option-image-url" value="' + escapeHtml(option.image_url || '') + '" placeholder="URL изображения варианта">' +
                    '<button type="button" class="button quiz-wp-select-option-image">' + buttonLabel + '</button>' +
                    '<button type="button" class="button quiz-wp-clear-option-image">Очистить</button>' +
                '</div>' +
                renderImagePreview(option.image_url, 'Превью изображения варианта') +
                '<button type="button" class="button-link-delete quiz-wp-remove-option">Удалить</button>' +
            '</div>'
        );
    }

    function readStage($stage) {
        var options = [];
        var fields = [];

        $stage.find('.quiz-wp-option-card').each(function () {
            options.push({
                label: $(this).find('.quiz-wp-option-label').val(),
                value: $(this).find('.quiz-wp-option-value').val(),
                image_id: parseInt($(this).find('.quiz-wp-option-image-id').val(), 10) || 0,
                image_url: $(this).find('.quiz-wp-option-image-url').val(),
                next_stage: parseInt($(this).find('.quiz-wp-option-next-stage').val(), 10) || 0
            });
        });

        $stage.find('.quiz-wp-parameter-card').each(function () {
            fields.push({
                label: $(this).find('.quiz-wp-param-label').val(),
                placeholder: $(this).find('.quiz-wp-param-placeholder').val(),
                type: $(this).find('.quiz-wp-param-type').val() || 'text'
            });
        });

        return normalizeStage({
            title: $stage.find('.quiz-wp-stage-title').val(),
            pick_hint_text: $stage.find('.quiz-wp-stage-pick-hint-text').val(),
            info_text: $stage.find('.quiz-wp-stage-info-text').val(),
            image_id: parseInt($stage.find('.quiz-wp-stage-image-id').val(), 10) || 0,
            image_url: $stage.find('.quiz-wp-stage-image-url').val(),
            stage_type: $stage.find('.quiz-wp-stage-type').val() || 'options',
            selection_mode: $stage.find('.quiz-wp-selection-mode').val() || 'single',
            grid_columns: parseInt($stage.find('.quiz-wp-grid-columns').val(), 10) || 2,
            show_pick_hint: $stage.find('.quiz-wp-stage-show-pick-hint').is(':checked'),
            show_description: $stage.find('.quiz-wp-stage-show-description').is(':checked'),
            options: options,
            fields: fields
        });
    }

    function writeStages(stages) {
        $('#quiz_wp_stages').val(JSON.stringify(stages));
    }

    function writeResults(results) {
        $('#quiz_wp_results').val(JSON.stringify(results));
    }

    function refreshStagesOrder($container) {
        $container.find('.quiz-wp-stage-card').each(function (index) {
            $(this).find('.quiz-wp-stage-order').text('Шаг ' + (index + 1));
        });
    }

    function refreshItemsOrder($stage) {
        $stage.find('.quiz-wp-option-card').each(function (index) {
            $(this).find('.quiz-wp-option-order').text('Вариант ' + (index + 1));
        });

        $stage.find('.quiz-wp-parameter-card').each(function (index) {
            $(this).find('.quiz-wp-option-order').text('Поле ' + (index + 1));
        });
    }

    function openMediaFrame(callback) {
        var frame = wp.media({
            title: window.QuizWpAdmin.mediaTitle,
            button: {
                text: window.QuizWpAdmin.mediaButton
            },
            multiple: false
        });

        frame.on('select', function () {
            callback(frame.state().get('selection').first().toJSON());
        });

        frame.open();
    }

    function syncStage($stage, stages, index) {
        stages[index] = readStage($stage);
        writeStages(stages);
    }

    function syncResult($result, results, index) {
        results[index] = {
            title: $result.find('.quiz-wp-result-title').val(),
            text: $result.find('.quiz-wp-result-text').val(),
            image_id: parseInt($result.find('.quiz-wp-result-image-id').val(), 10) || 0,
            image_url: $result.find('.quiz-wp-result-image-url').val(),
            image_position: $result.find('.quiz-wp-result-image-position').val() || 'left',
            match_mode: $result.find('.quiz-wp-result-match-mode').val() || 'any',
            trigger_values: String($result.find('.quiz-wp-result-trigger-values').val() || '')
                .split(',')
                .map(function (value) {
                    return value.trim();
                })
                .filter(Boolean)
        };

        writeResults(results);
    }

    function renderResults($container, results) {
        $container.empty().addClass('quiz-wp-result-list');

        results.forEach(function (result, index) {
            var buttonLabel = result.image_url ? 'Заменить изображение' : 'Выбрать изображение';
            var triggerValues = Array.isArray(result.trigger_values) ? result.trigger_values.join(', ') : '';
            var $result = $(
                '<section class="quiz-wp-result-card">' +
                    '<div class="quiz-wp-stage-head">' +
                        '<div>' +
                            '<div class="quiz-wp-chip quiz-wp-chip--accent">Результат</div>' +
                            '<h3>Результат ' + (index + 1) + '</h3>' +
                        '</div>' +
                        '<button type="button" class="button-link-delete quiz-wp-remove-result">Удалить</button>' +
                    '</div>' +
                    '<div class="quiz-wp-field-block">' +
                        '<label class="quiz-wp-label">Заголовок результата</label>' +
                        '<input type="text" class="widefat quiz-wp-result-title" value="' + escapeHtml(result.title || '') + '">' +
                    '</div>' +
                    '<div class="quiz-wp-field-block">' +
                        '<label class="quiz-wp-label">Текст результата</label>' +
                        '<textarea class="widefat quiz-wp-result-text" rows="4">' + escapeHtml(result.text || '') + '</textarea>' +
                    '</div>' +
                    '<div class="quiz-wp-section-grid">' +
                        '<div class="quiz-wp-settings-card">' +
                            '<div class="quiz-wp-field-block">' +
                                '<label class="quiz-wp-label">Значения ответов для срабатывания</label>' +
                                '<input type="text" class="widefat quiz-wp-result-trigger-values" value="' + escapeHtml(triggerValues) + '">' +
                                '<div class="quiz-wp-help">Указывайте значения ответов через запятую.</div>' +
                            '</div>' +
                            '<div class="quiz-wp-result-grid">' +
                                '<div class="quiz-wp-field-block">' +
                                    '<label class="quiz-wp-label">Режим совпадения</label>' +
                                    '<select class="quiz-wp-result-match-mode">' +
                                        '<option value="any"' + (result.match_mode === 'any' ? ' selected' : '') + '>Любое совпадение</option>' +
                                        '<option value="all"' + (result.match_mode === 'all' ? ' selected' : '') + '>Все указанные значения</option>' +
                                    '</select>' +
                                '</div>' +
                                '<div class="quiz-wp-field-block">' +
                                    '<label class="quiz-wp-label">Позиция изображения</label>' +
                                    '<select class="quiz-wp-result-image-position">' +
                                        '<option value="left"' + (result.image_position === 'left' ? ' selected' : '') + '>Слева</option>' +
                                        '<option value="right"' + (result.image_position === 'right' ? ' selected' : '') + '>Справа</option>' +
                                    '</select>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="quiz-wp-field-block">' +
                            '<label class="quiz-wp-label">Изображение результата</label>' +
                            '<div class="quiz-wp-image-row">' +
                                '<input type="hidden" class="quiz-wp-result-image-id" value="' + (result.image_id || 0) + '">' +
                                '<input type="url" class="widefat quiz-wp-result-image-url" value="' + escapeHtml(result.image_url || '') + '">' +
                                '<button type="button" class="button quiz-wp-select-result-image">' + buttonLabel + '</button>' +
                                '<button type="button" class="button quiz-wp-clear-result-image">Очистить</button>' +
                            '</div>' +
                            renderImagePreview(result.image_url, 'Превью изображения результата') +
                        '</div>' +
                    '</div>' +
                '</section>'
            );

            $result.on('input change', '.quiz-wp-result-title, .quiz-wp-result-text, .quiz-wp-result-trigger-values, .quiz-wp-result-match-mode, .quiz-wp-result-image-position, .quiz-wp-result-image-id, .quiz-wp-result-image-url', function () {
                syncResult($result, results, index);
            });

            $result.on('input', '.quiz-wp-result-image-url', function () {
                $result.find('.quiz-wp-result-image-id').val(0);
                $result.find('.quiz-wp-image-preview').first().replaceWith(renderImagePreview($(this).val(), 'Превью изображения результата'));
                syncResult($result, results, index);
            });

            $result.on('click', '.quiz-wp-remove-result', function () {
                results.splice(index, 1);
                renderResults($container, results);
                writeResults(results);
            });

            $result.on('click', '.quiz-wp-select-result-image', function () {
                openMediaFrame(function (media) {
                    $result.find('.quiz-wp-result-image-id').val(media.id);
                    $result.find('.quiz-wp-result-image-url').val(media.url).trigger('change');
                    $result.find('.quiz-wp-image-preview').first().replaceWith(renderImagePreview(media.url, 'Превью изображения результата'));
                });
            });

            $result.on('click', '.quiz-wp-clear-result-image', function () {
                $result.find('.quiz-wp-result-image-id').val(0);
                $result.find('.quiz-wp-result-image-url').val('').trigger('change');
                $result.find('.quiz-wp-image-preview').first().replaceWith(renderImagePreview('', 'Превью изображения результата'));
            });

            $container.append($result);
        });
    }

    function renderStages($container, stages) {
        $container.empty().addClass('quiz-wp-stage-list');

        stages.forEach(function (stage, index) {
            stage = normalizeStage(stage);
            var buttonLabel = stage.image_url ? 'Заменить изображение' : 'Выбрать изображение';
            var $stage = $(
                '<section class="quiz-wp-stage-card" draggable="true">' +
                    '<div class="quiz-wp-stage-head">' +
                        '<div class="quiz-wp-stage-title-wrap">' +
                            '<span class="quiz-wp-drag-handle quiz-wp-stage-drag-handle" title="Перетащите для сортировки">::</span>' +
                            '<div>' +
                                '<div class="quiz-wp-chip">Шаг</div>' +
                                '<h3 class="quiz-wp-stage-order">Шаг ' + (index + 1) + '</h3>' +
                            '</div>' +
                        '</div>' +
                        '<div class="quiz-wp-stage-actions">' +
                            '<button type="button" class="button-link-delete quiz-wp-remove-stage">Удалить</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="quiz-wp-field-block">' +
                        '<label class="quiz-wp-label">Заголовок</label>' +
                        '<input type="text" class="widefat quiz-wp-stage-title" value="' + escapeHtml(stage.title) + '">' +
                    '</div>' +
                    '<div class="quiz-wp-field-block">' +
                        '<label class="quiz-wp-label">Текст плашки выбора</label>' +
                        '<input type="text" class="widefat quiz-wp-stage-pick-hint-text" value="' + escapeHtml(stage.pick_hint_text) + '" placeholder="' + escapeHtml(stage.stage_type === 'fields' ? 'Укажите свои параметры' : 'Выберите один или несколько') + '">' +
                    '</div>' +
                    '<div class="quiz-wp-field-block">' +
                        '<label class="quiz-wp-label">Текст под плашкой</label>' +
                        '<textarea class="widefat quiz-wp-stage-info-text" rows="3">' + escapeHtml(stage.info_text) + '</textarea>' +
                    '</div>' +
                    '<div class="quiz-wp-section-grid">' +
                        '<div class="quiz-wp-field-block">' +
                            '<label class="quiz-wp-label">Изображение шага</label>' +
                            '<div class="quiz-wp-image-row">' +
                                '<input type="hidden" class="quiz-wp-stage-image-id" value="' + (stage.image_id || 0) + '">' +
                                '<input type="url" class="widefat quiz-wp-stage-image-url" value="' + escapeHtml(stage.image_url || '') + '">' +
                                '<button type="button" class="button quiz-wp-select-stage-image">' + buttonLabel + '</button>' +
                                '<button type="button" class="button quiz-wp-clear-stage-image">Очистить</button>' +
                            '</div>' +
                            '<div class="quiz-wp-help">Необязательное изображение для этого шага.</div>' +
                            renderImagePreview(stage.image_url, 'Превью изображения шага') +
                        '</div>' +
                            '<div class="quiz-wp-settings-card">' +
                                '<div class="quiz-wp-field-block">' +
                                    '<label class="quiz-wp-label">Тип шага</label>' +
                                    '<select class="quiz-wp-stage-type">' +
                                        '<option value="options"' + (stage.stage_type === 'options' ? ' selected' : '') + '>Карточки ответов</option>' +
                                        '<option value="fields"' + (stage.stage_type === 'fields' ? ' selected' : '') + '>Поля параметров</option>' +
                                    '</select>' +
                                '</div>' +
                                '<label class="quiz-wp-checkbox-row"><input type="checkbox" class="quiz-wp-stage-show-pick-hint"' + (stage.show_pick_hint ? ' checked' : '') + '> <span>Показывать плашку выбора</span></label>' +
                                '<label class="quiz-wp-checkbox-row"><input type="checkbox" class="quiz-wp-stage-show-description"' + (stage.show_description ? ' checked' : '') + '> <span>Показывать текст под плашкой</span></label>' +
                                '<div class="quiz-wp-stage-type-settings quiz-wp-stage-type-settings--options' + (stage.stage_type === 'options' ? '' : ' is-hidden') + '">' +
                                    '<div class="quiz-wp-field-block">' +
                                        '<label class="quiz-wp-label">Режим выбора</label>' +
                                        '<select class="quiz-wp-selection-mode">' +
                                            '<option value="single"' + (stage.selection_mode === 'single' ? ' selected' : '') + '>Один вариант</option>' +
                                        '<option value="multiple"' + (stage.selection_mode === 'multiple' ? ' selected' : '') + '>Несколько вариантов</option>' +
                                    '</select>' +
                                '</div>' +
                                '<div class="quiz-wp-field-block">' +
                                    '<label class="quiz-wp-label">Колонки сетки</label>' +
                                    '<select class="quiz-wp-grid-columns">' +
                                        '<option value="1"' + (String(stage.grid_columns) === '1' ? ' selected' : '') + '>1 колонка</option>' +
                                        '<option value="2"' + (String(stage.grid_columns) === '2' ? ' selected' : '') + '>2 колонки</option>' +
                                        '<option value="3"' + (String(stage.grid_columns) === '3' ? ' selected' : '') + '>3 колонки</option>' +
                                        '<option value="4"' + (String(stage.grid_columns) === '4' ? ' selected' : '') + '>4 колонки</option>' +
                                    '</select>' +
                                '</div>' +
                            '</div>' +
                                '<div class="quiz-wp-stage-type-settings quiz-wp-stage-type-settings--fields' + (stage.stage_type === 'fields' ? '' : ' is-hidden') + '">' +
                                    '<div class="quiz-wp-help">Используйте этот шаг для роста, веса, возраста и других пользовательских параметров.</div>' +
                                '</div>' +
                            '</div>' +
                    '</div>' +
                    '<div class="quiz-wp-options quiz-wp-stage-options' + (stage.stage_type === 'options' ? '' : ' is-hidden') + '">' +
                        '<div class="quiz-wp-subsection-head">' +
                            '<div>' +
                                '<h4>Карточки ответов</h4>' +
                                '<p>Добавляйте текст, значения и необязательные изображения для каждого ответа.</p>' +
                            '</div>' +
                            '<button type="button" class="button quiz-wp-add-option">Добавить вариант</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="quiz-wp-parameter-fields quiz-wp-stage-fields' + (stage.stage_type === 'fields' ? '' : ' is-hidden') + '">' +
                        '<div class="quiz-wp-subsection-head">' +
                            '<div>' +
                                '<h4>Поля параметров</h4>' +
                                '<p>Добавляйте пользовательские поля для параметров пользователя.</p>' +
                            '</div>' +
                            '<button type="button" class="button quiz-wp-add-field">Добавить поле</button>' +
                        '</div>' +
                    '</div>' +
                '</section>'
            );

            $stage.find('.quiz-wp-options').append(stage.options.map(renderOptionCard));
            $stage.find('.quiz-wp-parameter-fields').append(stage.fields.map(renderFieldCard));
            refreshItemsOrder($stage);

            $stage.on('input change', '.quiz-wp-stage-title, .quiz-wp-stage-pick-hint-text, .quiz-wp-stage-info-text, .quiz-wp-stage-image-url, .quiz-wp-stage-image-id, .quiz-wp-stage-type, .quiz-wp-selection-mode, .quiz-wp-grid-columns, .quiz-wp-stage-show-pick-hint, .quiz-wp-stage-show-description, .quiz-wp-option-label, .quiz-wp-option-value, .quiz-wp-option-next-stage, .quiz-wp-option-image-id, .quiz-wp-option-image-url, .quiz-wp-param-label, .quiz-wp-param-placeholder, .quiz-wp-param-type', function () {
                syncStage($stage, stages, index);
            });

            $stage.on('input', '.quiz-wp-stage-image-url', function () {
                $stage.find('.quiz-wp-stage-image-id').val(0);
                $stage.find('.quiz-wp-image-preview').first().replaceWith(renderImagePreview($(this).val(), 'Превью изображения шага'));
                syncStage($stage, stages, index);
            });

            $stage.on('input', '.quiz-wp-option-image-url', function () {
                var $option = $(this).closest('.quiz-wp-option-card');
                $option.find('.quiz-wp-option-image-id').val(0);
                $option.find('.quiz-wp-image-preview').first().replaceWith(renderImagePreview($(this).val(), 'Превью изображения варианта'));
                syncStage($stage, stages, index);
            });

            $stage.on('change', '.quiz-wp-stage-type', function () {
                var isFields = $(this).val() === 'fields';
                $stage.find('.quiz-wp-stage-options, .quiz-wp-stage-type-settings--options').toggleClass('is-hidden', isFields);
                $stage.find('.quiz-wp-stage-fields, .quiz-wp-stage-type-settings--fields').toggleClass('is-hidden', !isFields);
                syncStage($stage, stages, index);
            });

            $stage.on('click', '.quiz-wp-remove-stage', function () {
                stages.splice(index, 1);

                if (!stages.length) {
                    stages.push(cloneDeep(window.QuizWpAdmin.stageTemplate));
                }

                renderStages($container, stages);
                writeStages(stages);
            });

            $stage.on('click', '.quiz-wp-add-option', function () {
                stages[index].options.push(cloneDeep(window.QuizWpAdmin.optionTemplate));
                renderStages($container, stages);
                writeStages(stages);
            });

            $stage.on('click', '.quiz-wp-remove-option', function () {
                var optionIndex = $(this).closest('.quiz-wp-option-card').prevAll('.quiz-wp-option-card').length;
                stages[index].options.splice(optionIndex, 1);

                if (!stages[index].options.length) {
                    stages[index].options.push(cloneDeep(window.QuizWpAdmin.optionTemplate));
                }

                renderStages($container, stages);
                writeStages(stages);
            });

            $stage.on('click', '.quiz-wp-add-field', function () {
                stages[index].fields.push(cloneDeep(window.QuizWpAdmin.fieldTemplate));
                renderStages($container, stages);
                writeStages(stages);
            });

            $stage.on('click', '.quiz-wp-remove-field', function () {
                var fieldIndex = $(this).closest('.quiz-wp-parameter-card').prevAll('.quiz-wp-parameter-card').length;
                stages[index].fields.splice(fieldIndex, 1);

                if (!stages[index].fields.length) {
                    stages[index].fields.push(cloneDeep(window.QuizWpAdmin.fieldTemplate));
                }

                renderStages($container, stages);
                writeStages(stages);
            });

            $stage.on('click', '.quiz-wp-select-stage-image', function () {
                openMediaFrame(function (media) {
                    $stage.find('.quiz-wp-stage-image-id').val(media.id);
                    $stage.find('.quiz-wp-stage-image-url').val(media.url).trigger('change');
                    $stage.find('.quiz-wp-image-preview').first().replaceWith(renderImagePreview(media.url, 'Превью изображения шага'));
                });
            });

            $stage.on('click', '.quiz-wp-clear-stage-image', function () {
                $stage.find('.quiz-wp-stage-image-id').val(0);
                $stage.find('.quiz-wp-stage-image-url').val('').trigger('change');
                $stage.find('.quiz-wp-image-preview').first().replaceWith(renderImagePreview('', 'Превью изображения шага'));
            });

            $stage.on('click', '.quiz-wp-select-option-image', function () {
                var $option = $(this).closest('.quiz-wp-option-card');

                openMediaFrame(function (media) {
                    $option.find('.quiz-wp-option-image-id').val(media.id);
                    $option.find('.quiz-wp-option-image-url').val(media.url).trigger('change');
                    $option.find('.quiz-wp-image-preview').first().replaceWith(renderImagePreview(media.url, 'Превью изображения варианта'));
                });
            });

            $stage.on('click', '.quiz-wp-clear-option-image', function () {
                var $option = $(this).closest('.quiz-wp-option-card');
                $option.find('.quiz-wp-option-image-id').val(0);
                $option.find('.quiz-wp-option-image-url').val('').trigger('change');
                $option.find('.quiz-wp-image-preview').first().replaceWith(renderImagePreview('', 'Превью изображения варианта'));
            });

            $container.append($stage);
        });

        refreshStagesOrder($container);
    }

    $(function () {
        var $stagesContainer = $('#quiz-wp-stages');
        var $resultsContainer = $('#quiz-wp-results-list');

        if ($stagesContainer.length) {
            var stages = [];

            try {
                stages = JSON.parse($stagesContainer.attr('data-stages'));
            } catch (error) {
                stages = [cloneDeep(window.QuizWpAdmin.stageTemplate)];
            }

            if (!Array.isArray(stages) || !stages.length) {
                stages = [cloneDeep(window.QuizWpAdmin.stageTemplate)];
            }

            stages = stages.map(normalizeStage);
            renderStages($stagesContainer, stages);
            writeStages(stages);

            $stagesContainer.on('dragstart', '.quiz-wp-stage-card', function (event) {
                $(this).addClass('is-dragging');
                event.originalEvent.dataTransfer.effectAllowed = 'move';
            });

            $stagesContainer.on('dragend', '.quiz-wp-stage-card', function () {
                $(this).removeClass('is-dragging');
                $stagesContainer.find('.quiz-wp-stage-card').removeClass('is-drag-over');

                var rebuilt = [];
                $stagesContainer.find('.quiz-wp-stage-card').each(function () {
                    rebuilt.push(readStage($(this)));
                });

                stages.length = 0;
                rebuilt.forEach(function (stage) {
                    stages.push(stage);
                });

                writeStages(stages);
                refreshStagesOrder($stagesContainer);
            });

            $stagesContainer.on('dragover', '.quiz-wp-stage-card', function (event) {
                event.preventDefault();

                var $dragging = $stagesContainer.find('.quiz-wp-stage-card.is-dragging');
                var $target = $(this);

                if (!$dragging.length || $dragging[0] === $target[0]) {
                    return;
                }

                $stagesContainer.find('.quiz-wp-stage-card').removeClass('is-drag-over');
                $target.addClass('is-drag-over');

                var rect = $target[0].getBoundingClientRect();
                var insertAfter = event.originalEvent.clientY > rect.top + rect.height / 2;

                if (insertAfter) {
                    $target.after($dragging);
                } else {
                    $target.before($dragging);
                }
            });

            $stagesContainer.on('drop', '.quiz-wp-stage-card', function (event) {
                event.preventDefault();
                $stagesContainer.find('.quiz-wp-stage-card').removeClass('is-drag-over');
            });

            $('#quiz-wp-add-stage').on('click', function () {
                stages.push(cloneDeep(window.QuizWpAdmin.stageTemplate));
                renderStages($stagesContainer, stages);
                writeStages(stages);
            });
        }

        if ($resultsContainer.length) {
            var results = [];

            try {
                results = JSON.parse($resultsContainer.attr('data-results'));
            } catch (error) {
                results = [];
            }

            if (!Array.isArray(results)) {
                results = [];
            }

            renderResults($resultsContainer, results);
            writeResults(results);

            $('#quiz-wp-add-result').on('click', function () {
                results.push(cloneDeep(window.QuizWpAdmin.resultTemplate));
                renderResults($resultsContainer, results);
                writeResults(results);
            });
        }

        $('#quiz-wp-select-intro-image').on('click', function () {
            openMediaFrame(function (media) {
                $('#quiz_wp_intro_image_id').val(media.id);
                $('#quiz_wp_intro_image_url').val(media.url);
                $('#quiz-wp-intro-image-preview-wrapper').html(renderImagePreview(media.url, 'Превью изображения стартового экрана'));
                $('#quiz-wp-select-intro-image').text('Заменить изображение');
            });
        });

        $('#quiz_wp_intro_image_url').on('input', function () {
            var url = $(this).val();
            $('#quiz_wp_intro_image_id').val(0);
            $('#quiz-wp-intro-image-preview-wrapper').html(renderImagePreview(url, 'Превью изображения стартового экрана'));
            $('#quiz-wp-select-intro-image').text(url ? 'Заменить изображение' : 'Выбрать изображение');
        });

        $('#quiz-wp-clear-intro-image').on('click', function () {
            $('#quiz_wp_intro_image_id').val(0);
            $('#quiz_wp_intro_image_url').val('');
            $('#quiz-wp-intro-image-preview-wrapper').html(renderImagePreview('', 'Превью изображения стартового экрана'));
            $('#quiz-wp-select-intro-image').text('Выбрать изображение');
        });
        $('#quiz-wp-select-side-expert-avatar').on('click', function () {
            openMediaFrame(function (media) {
                $('#quiz_wp_side_expert_avatar_id').val(media.id);
                $('#quiz_wp_side_expert_avatar_url').val(media.url);
                $('#quiz-wp-side-expert-avatar-preview-wrapper').html(renderImagePreview(media.url, 'Превью аватарки отзыва'));
                $('#quiz-wp-select-side-expert-avatar').text('Заменить аватарку');
            });
        });

        $('#quiz_wp_side_expert_avatar_url').on('input', function () {
            var url = $(this).val();
            $('#quiz_wp_side_expert_avatar_id').val(0);
            $('#quiz-wp-side-expert-avatar-preview-wrapper').html(renderImagePreview(url, 'Превью аватарки отзыва'));
            $('#quiz-wp-select-side-expert-avatar').text(url ? 'Заменить аватарку' : 'Выбрать аватарку');
        });

        $('#quiz-wp-clear-side-expert-avatar').on('click', function () {
            $('#quiz_wp_side_expert_avatar_id').val(0);
            $('#quiz_wp_side_expert_avatar_url').val('');
            $('#quiz-wp-side-expert-avatar-preview-wrapper').html(renderImagePreview('', 'Превью аватарки отзыва'));
            $('#quiz-wp-select-side-expert-avatar').text('Выбрать аватарку');
        });
        function bindSimpleImageField(config) {
            $('#' + config.select).on('click', function () {
                openMediaFrame(function (media) {
                    $('#' + config.id).val(media.id);
                    $('#' + config.url).val(media.url);
                    $('#' + config.preview).html(renderImagePreview(media.url, config.alt));
                    $('#' + config.select).text('Заменить изображение');
                });
            });

            $('#' + config.url).on('input', function () {
                var url = $(this).val();
                $('#' + config.id).val(0);
                $('#' + config.preview).html(renderImagePreview(url, config.alt));
                $('#' + config.select).text(url ? 'Заменить изображение' : 'Выбрать изображение');
            });

            $('#' + config.clear).on('click', function () {
                $('#' + config.id).val(0);
                $('#' + config.url).val('');
                $('#' + config.preview).html(renderImagePreview('', config.alt));
                $('#' + config.select).text('Выбрать изображение');
            });
        }

        bindSimpleImageField({
            select: 'quiz-wp-select-thanks-image',
            clear: 'quiz-wp-clear-thanks-image',
            id: 'quiz_wp_thanks_image_id',
            url: 'quiz_wp_thanks_image_url',
            preview: 'quiz-wp-thanks-image-preview-wrapper',
            alt: 'Превью изображения экрана спасибо'
        });

        bindSimpleImageField({
            select: 'quiz-wp-select-thanks-card-1-image',
            clear: 'quiz-wp-clear-thanks-card-1-image',
            id: 'quiz_wp_thanks_card_1_image_id',
            url: 'quiz_wp_thanks_card_1_image_url',
            preview: 'quiz-wp-thanks-card-1-image-preview-wrapper',
            alt: 'Превью нижней карточки 1'
        });

        bindSimpleImageField({
            select: 'quiz-wp-select-thanks-card-2-image',
            clear: 'quiz-wp-clear-thanks-card-2-image',
            id: 'quiz_wp_thanks_card_2_image_id',
            url: 'quiz_wp_thanks_card_2_image_url',
            preview: 'quiz-wp-thanks-card-2-image-preview-wrapper',
            alt: 'Превью нижней карточки 2'
        });
    });
})(jQuery);

