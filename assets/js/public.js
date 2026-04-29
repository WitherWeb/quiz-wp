(function () {
    function initQuizApp(app) {
        if (!app || app.dataset.quizWpInitialized === 'true') {
            return;
        }

        app.dataset.quizWpInitialized = 'true';
        var data = {};

        try {
            data = JSON.parse(app.dataset.quiz || '{}');
        } catch (error) {
            app.innerHTML = '<p>Could not load quiz.</p>';
            return;
        }

        if (!Array.isArray(data.stages) || !data.stages.length) {
            app.innerHTML = '<p>Quiz is empty.</p>';
            return;
        }

        var cf7Template = app.querySelector('.quiz-wp-cf7-template');
        var cf7Markup = cf7Template ? cf7Template.innerHTML : '';
        var quizModalOverlay = app.closest('.quiz-wp-modal-overlay');
        var isQuizModal = app.dataset.quizMode === 'modal' && !!quizModalOverlay;
        var isEmbeddedPopup = !isQuizModal && !!app.closest('.modal__window, [data-modal], .modal-main');
        var state = {
            screen: 'intro',
            step: 0,
            history: [],
            answers: [],
            productOptions: [],
            selectedProduct: null,
            submitted: false
        };

        if (isEmbeddedPopup) {
            app.classList.add('quiz-wp-app--embedded');
        }

        function render() {
            if (state.screen === 'intro') {
                renderIntro();
                return;
            }

            if (state.screen === 'result') {
                renderResult();
                return;
            }

            if (state.screen === 'contact') {
                renderContact();
                return;
            }

            if (state.screen === 'productChoice') {
                renderProductChoice();
                return;
            }

            if (state.screen === 'productResult') {
                renderProductResult();
                return;
            }

            if (state.screen === 'thanks') {
                renderThanks();
                return;
            }

            renderQuestion();
        }

        function resetQuiz() {
            state.screen = 'intro';
            state.step = 0;
            state.history = [];
            state.answers = [];
            state.productOptions = [];
            state.selectedProduct = null;
            state.submitted = false;
        }

        function restoreInitialMarkup() {
            resetQuiz();
            renderIntro();
        }

        function closeQuizModal() {
            resetQuiz();
            renderIntro();

            if (quizModalOverlay) {
                quizModalOverlay.classList.remove('is-open');
                quizModalOverlay.setAttribute('aria-hidden', 'true');
                document.body.classList.remove('quiz-wp-modal-open');
            }
        }

        function renderIntro() {
            var intro = getIntroData();
            var introMediaHtml = '<div class="quiz-wp-intro-media' + (intro.imageUrl ? '' : ' is-empty') + '">' + (intro.imageUrl ? renderIntroImage(intro.imageUrl) : '') + '</div>';

            app.innerHTML = '' +
                '<div class="quiz-wp-shell">' +
                    '<div class="quiz-wp-modal quiz-wp-modal--intro">' +
                        renderCloseButton() +
                        introMediaHtml +
                        '<div class="quiz-wp-intro-panel">' +
                            '<h2 class="quiz-wp-title quiz-wp-title--intro">' + intro.titleHtml + '</h2>' +
                            '<div class="quiz-wp-muted quiz-wp-intro-copy">' + renderHtml(intro.description) + '</div>' +
                            '<div class="quiz-wp-intro-gifts">' + renderIntroGiftCards(intro.giftCards, intro.bonusItems) + '</div>' +
                            '<button type="button" class="quiz-wp-btn quiz-wp-btn--primary quiz-wp-start">' +
                                '<span>' + renderHtml(intro.buttonLabel) + '</span>' +
                                '<span class="quiz-wp-btn-icon">' + renderIcon('arrow') + '</span>' +
                            '</button>' +
                            '<div class="quiz-wp-intro-time">' + renderHtml(intro.timeText) + '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';

            app.querySelector('.quiz-wp-start').addEventListener('click', function () {
                state.screen = 'question';
                state.step = 0;
                state.history = [];
                state.answers = [];
                render();
            });

            bindClose();
        }

        function renderQuestion() {
            var stage = data.stages[state.step];
            var isFieldsStage = stage.stage_type === 'fields';
            var isMultiple = stage.selection_mode === 'multiple';
            var inputType = isMultiple ? 'checkbox' : 'radio';
            var savedValues = getAnswerValues(state.step);
            var savedFieldValues = getFieldValues(state.step);
            var progress = Math.round(((state.step + 1) / data.stages.length) * 100);
            var intro = getIntroData();
            var rightItems = intro.bonusItems.slice(0, 2);
            var contentHtml = '';
            var discountLabel = String(data.discountLabel || '\u0434\u043e 3000\u20bd');
            var answerStyle = stage.answer_style === 'controls' ? 'controls' : 'default';
            var selectionStyle = isMultiple ? 'multiple' : 'single';
            var showPickHint = !(String(stage.show_pick_hint) === '0' || stage.show_pick_hint === false);
            var showDescription = !(String(stage.show_description) === '0' || stage.show_description === false);
            var pickHintText = String(stage.pick_hint_text || (isFieldsStage ? '\u0443\u043a\u0430\u0436\u0438\u0442\u0435 \u0441\u0432\u043e\u0438 \u043f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u044b' : '\u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043e\u0434\u0438\u043d \u0438\u043b\u0438 \u043d\u0435\u0441\u043a\u043e\u043b\u044c\u043a\u043e'));
            var infoText = String(stage.info_text || stage.description || '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0432\u043e\u0439 \u0432\u0430\u0440\u0438\u0430\u043d\u0442 \u2014 \u0438 \u0443\u0437\u043d\u0430\u0439\u0442\u0435, \u043a\u0430\u043a \u0441\u0438\u0441\u0442\u0435\u043c\u0430 Detensor \u043f\u043e\u043c\u043e\u0433\u0430\u0435\u0442 \u0438\u043c\u0435\u043d\u043d\u043e \u043f\u0440\u0438 \u044d\u0442\u043e\u043c \u0441\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u0438.');
            var pickHintHtml = showPickHint
                ? '<div class="quiz-wp-pick-hint">' + renderIcon('check-soft') + '<span>' + renderHtml(pickHintText) + '</span></div>'
                : '';
            var descriptionHtml = showDescription
                ? '<div class="quiz-wp-muted quiz-wp-question-copy">' + renderHtml(infoText) + '</div>'
                : '';

            if (isFieldsStage) {
                contentHtml = '<div class="quiz-wp-parameter-form">' + (stage.fields || []).map(function (field, index) {
                    var fieldName = 'quiz-param-' + state.step + '-' + index;
                    var fieldValue = savedFieldValues[fieldName] || '';
                    return '' +
                        '<label class="quiz-wp-parameter-row">' +
                            '<span class="quiz-wp-parameter-label">' + renderHtml(field.label || ('Field ' + (index + 1))) + '</span>' +
                            '<input class="quiz-wp-parameter-input" type="' + escapeAttr(field.type === 'number' ? 'number' : 'text') + '" name="' + escapeAttr(fieldName) + '" data-label="' + escapeAttr(stripHtml(field.label || ('Field ' + (index + 1)))) + '" placeholder="' + escapeAttr(field.placeholder || '') + '" value="' + escapeAttr(fieldValue) + '">' +
                        '</label>';
                }).join('') + '</div>';
            } else {
                contentHtml = '<div class="quiz-wp-answer-grid quiz-wp-answer-grid--' + answerStyle + ' quiz-wp-answer-grid--' + selectionStyle + '" style="--quiz-grid-columns:' + (parseInt(stage.grid_columns, 10) || 4) + '">' +
                    (stage.options || []).map(function (option, index) {
                        var optionValue = String(option.value || option.label || ('option-' + index));
                        var optionLabel = String(option.label || optionValue);
                        var checked = savedValues.indexOf(optionValue) !== -1;
                        return '' +
                            '<label class="quiz-wp-answer-card' + (checked ? ' is-selected' : '') + '">' +
                                renderOptionImage(option.image_url) +
                                '<input type="' + inputType + '" name="quiz-stage-' + state.step + (isMultiple ? '[]' : '') + '" value="' + escapeAttr(optionValue) + '" data-label="' + escapeAttr(stripHtml(optionLabel)) + '"' + (checked ? ' checked' : '') + '>' +
                                '<span class="quiz-wp-answer-label">' + renderHtml(optionLabel) + '</span>' +
                            '</label>';
                    }).join('') +
                '</div>';
            }

            app.innerHTML = '' +
                '<div class="quiz-wp-shell">' +
                    '<div class="quiz-wp-modal quiz-wp-modal--question">' +
                        renderCloseButton() +
                        '<div class="quiz-wp-main-column">' +
                            '<div class="quiz-wp-question-head">' +
                                '<h3 class="quiz-wp-title quiz-wp-title--question">' + renderHtml(stage.title || ('Question ' + (state.step + 1))) + '</h3>' +
                                pickHintHtml +
                                descriptionHtml +
                            '</div>' +
                            contentHtml +
                            '<div class="quiz-wp-mobile-discount">' + renderMobileDiscount(discountLabel) + '</div>' +
                            '<div class="quiz-wp-footer-row">' +
                                '<div class="quiz-wp-progress-wrap">' +
                                    '<div class="quiz-wp-progress-meta"><span>\u0412\u043e\u043f\u0440\u043e\u0441 ' + (state.step + 1) + ' \u0438\u0437 ' + data.stages.length + '</span><span>' + progress + '%</span></div>' +
                                    '<div class="quiz-wp-progress-bar"><span style="width:' + progress + '%"></span></div>' +
                                '</div>' +
                                '<div class="quiz-wp-nav-actions">' +
                                    (state.history.length > 0 ? '<button type="button" class="quiz-wp-link-button quiz-wp-prev">' + renderIcon('back') + '<span>\u041d\u0430\u0437\u0430\u0434</span></button>' : '') +
                                    '<button type="button" class="quiz-wp-btn quiz-wp-btn--primary quiz-wp-next' + (isStepComplete(stage, state.step) ? '' : ' is-muted') + '">' +
                                        '<span>' + (state.step === data.stages.length - 1 ? '\u0423\u0437\u043d\u0430\u0442\u044c \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442' : '\u0414\u0430\u043b\u0435\u0435') + '</span>' +
                                        '<span class="quiz-wp-btn-icon">' + renderIcon('arrow') + '</span>' +
                                    '</button>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<aside class="quiz-wp-side-column">' +
                            renderBonusPanel(discountLabel, rightItems) +
                        '</aside>' +
                    '</div>' +
                '</div>';

            if (isFieldsStage) {
                app.querySelectorAll('.quiz-wp-parameter-input').forEach(function (input) {
                    input.addEventListener('input', function () {
                        app.querySelector('.quiz-wp-next').classList.toggle('is-muted', !isStepComplete(stage, state.step));
                    });
                });
            } else {
                app.querySelectorAll('.quiz-wp-answer-card input').forEach(function (input) {
                    input.addEventListener('change', function () {
                        syncCheckedState();
                        app.querySelector('.quiz-wp-next').classList.toggle('is-muted', !isStepComplete(stage, state.step));
                    });
                });
            }

            app.querySelector('.quiz-wp-next').addEventListener('click', function () {
                saveCurrentStep();
                if (!isStepComplete(stage, state.step)) {
                    window.alert(isFieldsStage ? '\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u0432\u0441\u0435 \u043f\u043e\u043b\u044f \u043d\u0430 \u044d\u0442\u043e\u043c \u0448\u0430\u0433\u0435.' : '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0445\u043e\u0442\u044f \u0431\u044b \u043e\u0434\u0438\u043d \u0432\u0430\u0440\u0438\u0430\u043d\u0442 \u043e\u0442\u0432\u0435\u0442\u0430.');
                    return;
                }

                var nextStep = getNextStepIndex(stage);
                state.history.push(state.step);

                if (nextStep >= data.stages.length) {
                    state.screen = data.productFlow ? 'contact' : 'result';
                } else {
                    state.step = nextStep;
                }
                render();
            });

            var prevButton = app.querySelector('.quiz-wp-prev');
            if (prevButton) {
                prevButton.addEventListener('click', function () {
                    saveCurrentStep();
                    state.step = state.history.length ? state.history.pop() : 0;
                    render();
                });
            }

            bindClose();
        }

        function renderResult() {
            var result = resolveResult();
            var resultTitle = result.title || data.finalTitle || '\u041a\u0430\u043a Detensor \u043f\u043e\u043c\u043e\u0436\u0435\u0442 \u0438\u043c\u0435\u043d\u043d\u043e \u0432\u0430\u043c';
            var resultText = result.text || data.finalText || '';
            var resultImage = String(result.image_url || '');

            app.innerHTML = '' +
                '<div class="quiz-wp-shell">' +
                    '<div class="quiz-wp-modal quiz-wp-modal--result">' +
                        renderCloseButton() +
                        '<div class="quiz-wp-result-media' + (resultImage ? '' : ' is-empty') + '">' +
                            (resultImage ? '<img src="' + escapeAttr(resultImage) + '" alt="">' : '') +
                        '</div>' +
                        '<div class="quiz-wp-result-content">' +
                            '<h3 class="quiz-wp-title quiz-wp-title--result">' + renderHtml(resultTitle) + '</h3>' +
                            '<div class="quiz-wp-result-copy">' + renderHtml(resultText) + '</div>' +
                            '<div class="quiz-wp-result-course">' +
                                '<small>\u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u043e\u0432\u0430\u043d\u043d\u044b\u0439 \u043a\u0443\u0440\u0441 \u043b\u0435\u0447\u0435\u043d\u0438\u044f</small>' +
                                '<strong>\u041e\u0442 2 \u043d\u0435\u0434\u0435\u043b\u044c \u0435\u0436\u0435\u0434\u043d\u0435\u0432\u043d\u043e\u0433\u043e \u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0438\u044f<br>45 \u043c\u0438\u043d\u0443\u0442 \u0443\u0442\u0440\u043e\u043c \u0438\u043b\u0438 \u0432\u0435\u0447\u0435\u0440\u043e\u043c</strong>' +
                            '</div>' +
                            '<div class="quiz-wp-result-stat quiz-wp-result-stat--blue">' +
                                '<strong>91%</strong>' +
                                '<span>\u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432 Detensor \u043f\u043e\u0447\u0443\u0432\u0441\u0442\u0432\u043e\u0432\u0430\u043b\u0438<br>\u043e\u0431\u043b\u0435\u0433\u0447\u0435\u043d\u0438\u0435 \u043f\u043e\u0441\u043b\u0435 \u043f\u0435\u0440\u0432\u043e\u0433\u043e \u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0438\u044f</span>' +
                            '</div>' +
                            '<div class="quiz-wp-result-stat quiz-wp-result-stat--violet">' +
                                '<strong>2500+</strong>' +
                                '<span>\u043a\u043b\u0438\u043d\u0438\u043a \u0438 \u0441\u0430\u043d\u0430\u0442\u043e\u0440\u0438\u0435\u0432<br>\u0424\u041c\u0411\u0410, \u0421\u0430\u043d\u0430\u0442\u043e\u0440\u0438\u0439 \u0413\u0430\u0437\u043f\u0440\u043e\u043c, \u041c\u0435\u0434\u0441\u0438,<br>\u0421\u041c-\u041a\u043b\u0438\u043d\u0438\u043a\u0430 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u044e\u0442 Detensor</span>' +
                            '</div>' +
                            '<button type="button" class="quiz-wp-btn quiz-wp-btn--primary quiz-wp-go-contact">' +
                                '<span>\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0439 \u0448\u0430\u0433</span>' +
                                '<span class="quiz-wp-btn-icon">' + renderIcon('arrow') + '</span>' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';

            app.querySelector('.quiz-wp-go-contact').addEventListener('click', function () {
                state.screen = 'contact';
                render();
            });

            bindClose();
        }

        function renderContact() {
            var discountLabel = String(data.discountLabel || '\u0434\u043e 3000\u20bd');
            var contact = data.contact || {};
            var contactTitle = String(contact.title || '\u0412\u0430\u0448\u0438 \u043e\u0442\u0432\u0435\u0442\u044b \u043f\u043e\u043a\u0430\u0437\u0430\u043b\u0438,<br>\u0447\u0442\u043e Detensor<br>\u043c\u043e\u0436\u0435\u0442 \u043f\u043e\u043c\u043e\u0447\u044c \u0438\u043c\u0435\u043d\u043d\u043e<br>\u0432\u0430\u043c');
            var contactCopy = String(contact.text || '\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u043a\u043e\u043d\u0442\u0430\u043a\u0442\u044b \u0438 \u043c\u044b \u0441\u043e\u0441\u0442\u0430\u0432\u0438\u043c \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u043b\u044c\u043d\u0443\u044e<br>\u0440\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0430\u0446\u0438\u044e \u043f\u043e \u0432\u0430\u0448\u0435\u0439 \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u0438');
            var intro = getIntroData();
            var privacyUrl = data.privacyUrl ? String(data.privacyUrl) : '#';
            var formHtml = data.hasCf7 ? cf7Markup : renderDefaultContactForm(privacyUrl);

            app.innerHTML = '' +
                '<div class="quiz-wp-shell">' +
                    '<div class="quiz-wp-modal quiz-wp-modal--contact">' +
                        renderCloseButton() +
                        '<div class="quiz-wp-contact-copy">' +
                            '<h3 class="quiz-wp-title quiz-wp-title--contact">' + renderHtml(contactTitle) + '</h3>' +
                            '<div class="quiz-wp-muted quiz-wp-contact-text">' + renderHtml(contactCopy) + '</div>' +
                            '<div class="quiz-wp-contact-arrow"></div>' +
                            '<div class="quiz-wp-contact-rewards">' + renderContactRewards(discountLabel, intro) + '</div>' +
                            '<button type="button" class="quiz-wp-link-button quiz-wp-prev-contact">' + renderIcon('back') + '<span>\u041d\u0430\u0437\u0430\u0434</span></button>' +
                        '</div>' +
                        '<div class="quiz-wp-contact-form-side">' +
                            '<div class="quiz-wp-cf7-wrap' + (data.hasCf7 ? '' : ' quiz-wp-cf7-wrap--default') + '">' + formHtml + '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';

            populateCf7Fields(contactTitle);
            initCf7();
            applyQuizPhoneMasks();

            var prevButton = app.querySelector('.quiz-wp-prev-contact');
            if (prevButton) {
                prevButton.addEventListener('click', function () {
                    state.screen = 'question';
                    state.step = state.history.length ? state.history[state.history.length - 1] : Math.max(0, data.stages.length - 1);
                    render();
                });
            }

            var defaultForm = app.querySelector('.quiz-wp-default-form');
            if (defaultForm) {
                defaultForm.addEventListener('submit', function (event) {
                    event.preventDefault();
                    handleContactSubmitted();
                });
            }

            bindClose();
        }

        function handleContactSubmitted() {
            state.submitted = true;

            if (data.productFlow) {
                state.productOptions = calculateProductOptions();
                state.selectedProduct = state.productOptions[0] || getProductHardnessData('2');
                state.screen = state.productOptions.length > 1 ? 'productChoice' : 'productResult';
            } else {
                state.screen = 'thanks';
            }

            render();
        }

        function renderProductChoice() {
            var options = state.productOptions && state.productOptions.length ? state.productOptions : calculateProductOptions();
            var productSettings = getProductSettings();
            var choiceTitle = String(productSettings.general.choice_title || 'Мы подобрали {{count}} варианта').replace('{{count}}', String(options.length));
            var choiceSubtitle = String(productSettings.general.choice_subtitle || 'Выберите подходящий вариант Лечебного тракционного мата Детензор 18%');
            state.productOptions = options;

            app.innerHTML = '' +
                '<div class="quiz-wp-shell">' +
                    '<div class="quiz-wp-modal quiz-wp-modal--product-choice">' +
                        renderCloseButton() +
                        '<div class="quiz-wp-product-choice-head">' +
                            '<h3 class="quiz-wp-title quiz-wp-title--product-choice">' + renderHtml(choiceTitle) + '</h3>' +
                            '<p>' + renderHtml(choiceSubtitle) + '</p>' +
                        '</div>' +
                        '<div class="quiz-wp-product-grid">' + options.map(renderProductCard).join('') + '</div>' +
                    '</div>' +
                '</div>';

            app.querySelectorAll('.quiz-wp-product-select').forEach(function (button) {
                button.addEventListener('click', function () {
                    var hardness = button.getAttribute('data-hardness') || '2';
                    state.selectedProduct = getProductHardnessData(hardness);
                    state.screen = 'productResult';
                    render();
                });
            });

            bindClose();
        }

        function renderProductResult() {
            var product = state.selectedProduct || (state.productOptions && state.productOptions[0]) || getProductHardnessData('2');
            var productSettings = getProductSettings();
            var resultCustomProduct = productSettings.items && productSettings.items[product.hardness] ? productSettings.items[product.hardness] : {};
            if (resultCustomProduct.recommendation) {
                product.recommendation = String(resultCustomProduct.recommendation);
            }
            var thanks = getThanksData();
            var imageUrl = product.imageUrl || thanks.imageUrl || '';
            var imageStyle = imageUrl ? ' style="background-image:url(' + escapeAttr(imageUrl) + ')"' : '';
            var catalogLabel = String(thanks.reviewLabel || '\u041f\u0435\u0440\u0435\u0439\u0442\u0438 \u0432 \u043a\u0430\u0442\u0430\u043b\u043e\u0433');
            var resultTitle = String(productSettings.general.result_title || '\u0412\u0430\u0448 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442');
            var resultLead = String(productSettings.general.result_lead || '\u041d\u0430 \u043e\u0441\u043d\u043e\u0432\u0430\u043d\u0438\u0438 \u0432\u0430\u0448\u0438\u0445 \u043e\u0442\u0432\u0435\u0442\u043e\u0432 \u043c\u044b \u043f\u043e\u0434\u043e\u0431\u0440\u0430\u043b\u0438<br>\u043e\u043f\u0442\u0438\u043c\u0430\u043b\u044c\u043d\u044b\u0439 \u0432\u0430\u0440\u0438\u0430\u043d\u0442 —');
            var recommendationTitle = String(productSettings.general.recommendation_title || '\u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0430\u0446\u0438\u044f \u0441\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0441\u0442\u0430');

            app.innerHTML = '' +
                '<div class="quiz-wp-shell">' +
                    '<div class="quiz-wp-modal quiz-wp-modal--product-result">' +
                        renderCloseButton() +
                        '<div class="quiz-wp-product-result-media' + (imageUrl ? ' has-image' : '') + '"' + imageStyle + '></div>' +
                        '<div class="quiz-wp-product-result-content">' +
                            '<h3 class="quiz-wp-title quiz-wp-title--product-result">' + renderHtml(resultTitle) + '</h3>' +
                            '<p class="quiz-wp-product-result-lead">' + renderHtml(resultLead) + '</p>' +
                            '<h4>' + renderHtml(product.fullName) + '</h4>' +
                            '<div class="quiz-wp-product-recommendation">' +
                                '<strong>' + renderHtml(recommendationTitle) + '</strong>' +
                                '<p>' + renderHtml(product.recommendation) + '</p>' +
                            '</div>' +
                            '<div class="quiz-wp-thanks-bonuses quiz-wp-product-bonuses">' +
                                '<strong>' + renderHtml(thanks.bonusesTitle) + '</strong>' +
                                '<div class="quiz-wp-thanks-bonus-row">' +
                                    '<span class="quiz-wp-thanks-bonus-icon">' + renderIcon('percent') + '</span>' +
                                    '<span><b>' + renderHtml(thanks.discountTitle || '\u0421\u043a\u0438\u0434\u043a\u0430 3 000 \u0440\u0443\u0431') + '</b><small>' + renderHtml(thanks.discountNote) + '</small></span>' +
                                '</div>' +
                                '<div class="quiz-wp-thanks-bonus-row">' +
                                    '<span class="quiz-wp-thanks-bonus-icon quiz-wp-thanks-bonus-icon--violet">' + renderIcon('book') + '</span>' +
                                    '<span><b>' + renderHtml(thanks.bookTitle) + '</b><small>' + renderHtml(thanks.bookNote) + '</small></span>' +
                                '</div>' +
                            '</div>' +
                            renderThanksLink(catalogLabel, thanks.reviewUrl, 'catalog') +
                        '</div>' +
                    '</div>' +
                '</div>';

            bindClose();
        }

        function renderThanks() {
            var thanks = getThanksData();
            var discountLabel = String(data.discountLabel || '\u0434\u043e 3000 \u0440\u0443\u0431');
            var catalogLabel = String(thanks.reviewLabel || '\u041f\u043e\u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u043a\u0430\u0442\u0430\u043b\u043e\u0433');
            var thanksMediaStyle = thanks.imageUrl ? ' style="background-image:url(' + escapeAttr(thanks.imageUrl) + ')"' : '';

            app.innerHTML = '' +
                '<div class="quiz-wp-shell">' +
                    '<div class="quiz-wp-modal quiz-wp-modal--thanks">' +
                        renderCloseButton() +
                        '<div class="quiz-wp-thanks-media' + (thanks.imageUrl ? ' has-image' : '') + '"' + thanksMediaStyle + '></div>' +
                        '<div class="quiz-wp-thanks-content">' +
                            '<div class="quiz-wp-thanks-check">' + renderIcon('success') + '</div>' +
                            '<h3 class="quiz-wp-title quiz-wp-title--thanks">' + renderHtml(thanks.title) + '</h3>' +
                            '<p class="quiz-wp-muted quiz-wp-thanks-copy">' + renderHtml(thanks.text) + '</p>' +
                            '<div class="quiz-wp-thanks-bonuses">' +
                                '<strong>' + renderHtml(thanks.bonusesTitle) + '</strong>' +
                                '<div class="quiz-wp-thanks-bonus-row">' +
                                    '<span class="quiz-wp-thanks-bonus-icon">' + renderIcon('percent') + '</span>' +
                                    '<span><b>' + renderHtml(thanks.discountTitle || ('\u0421\u043a\u0438\u0434\u043a\u0430 ' + discountLabel)) + '</b><small>' + renderHtml(thanks.discountNote) + '</small></span>' +
                                '</div>' +
                                '<div class="quiz-wp-thanks-bonus-row">' +
                                    '<span class="quiz-wp-thanks-bonus-icon quiz-wp-thanks-bonus-icon--violet">' + renderIcon('book') + '</span>' +
                                    '<span><b>' + renderHtml(thanks.bookTitle) + '</b><small>' + renderHtml(thanks.bookNote) + '</small></span>' +
                                '</div>' +
                            '</div>' +
                            renderThanksLink(catalogLabel, thanks.reviewUrl, 'catalog') +
                            '<div class="quiz-wp-thanks-promo-grid">' +
                                renderThanksPromoCard(thanks.rentUrl, thanks.card1ImageUrl) +
                                renderThanksPromoCard(thanks.bookUrl, thanks.card2ImageUrl) +
                            '</div>' +
                            '<button type="button" class="quiz-wp-link-button quiz-wp-close-thanks"><span>\u0417\u0430\u043a\u0440\u044b\u0442\u044c</span></button>' +
                        '</div>' +
                    '</div>' +
                '</div>';

            var closeThanks = app.querySelector('.quiz-wp-close-thanks');
            if (closeThanks) {
                closeThanks.addEventListener('click', function () {
                    restoreInitialMarkup();
                });
            }

            bindClose();
        }

        function saveCurrentStep() {
            var stage = data.stages[state.step];
            if (!stage) {
                return;
            }

            if (stage.stage_type === 'fields') {
                var fieldValues = {};
                var labels = [];

                app.querySelectorAll('.quiz-wp-parameter-input').forEach(function (input) {
                    var name = input.getAttribute('name') || '';
                    var label = input.getAttribute('data-label') || name;
                    var value = input.value || '';
                    fieldValues[name] = value;
                    labels.push(label + ': ' + value);
                });

                state.answers[state.step] = {
                    title: stage.title || ('Question ' + (state.step + 1)),
                    values: labels.slice(),
                    labels: labels.slice(),
                    fields: fieldValues
                };
                return;
            }

            var selected = getCheckedInputs().map(function (input) {
                return {
                    value: input.value,
                    label: input.getAttribute('data-label') || input.value
                };
            });

            state.answers[state.step] = {
                title: stage.title || ('Question ' + (state.step + 1)),
                values: selected.map(function (item) {
                    return item.value;
                }),
                labels: selected.map(function (item) {
                    return item.label;
                })
            };
        }

        function getCheckedInputs() {
            return Array.from(app.querySelectorAll('.quiz-wp-answer-card input:checked'));
        }

        function getNextStepIndex(stage) {
            if (!stage || stage.stage_type === 'fields') {
                return state.step + 1;
            }

            var selectedValues = getAnswerValues(state.step);
            var options = Array.isArray(stage.options) ? stage.options : [];
            var matchedOption = options.find(function (option) {
                var optionValue = String(option && (option.value || option.label || ''));
                return selectedValues.indexOf(optionValue) !== -1 && parseInt(option.next_stage, 10) > 0;
            });

            if (matchedOption) {
                return Math.max(0, parseInt(matchedOption.next_stage, 10) - 1);
            }

            return state.step + 1;
        }

        function getAnswerValues(stepIndex) {
            var answer = state.answers[stepIndex];
            return answer && Array.isArray(answer.values) ? answer.values : [];
        }

        function getFieldValues(stepIndex) {
            var answer = state.answers[stepIndex];
            return answer && answer.fields ? answer.fields : {};
        }

        function isStepComplete(stage, stepIndex) {
            if (stage.stage_type === 'fields') {
                var fieldValues = getCurrentFieldValues();
                var fields = Array.isArray(stage.fields) ? stage.fields : [];
                if (!fields.length) {
                    return false;
                }

                return fields.every(function (_, index) {
                    var key = 'quiz-param-' + stepIndex + '-' + index;
                    return String(fieldValues[key] || '').trim().length > 0;
                });
            }

            return getAnswerValues(stepIndex).length > 0;
        }

        function getCurrentFieldValues() {
            var values = {};
            app.querySelectorAll('.quiz-wp-parameter-input').forEach(function (input) {
                values[input.getAttribute('name') || ''] = input.value || '';
            });
            return values;
        }

        function syncCheckedState() {
            app.querySelectorAll('.quiz-wp-answer-card').forEach(function (card) {
                var input = card.querySelector('input');
                card.classList.toggle('is-selected', !!(input && input.checked));
            });
        }

        function resolveResult() {
            var allSelected = state.answers.reduce(function (carry, answer) {
                return carry.concat(answer && Array.isArray(answer.values) ? answer.values : []);
            }, []);
            var normalizedSelected = allSelected.map(function (value) {
                return String(value || '').trim().toLowerCase();
            });
            var results = Array.isArray(data.results) ? data.results : [];

            for (var index = 0; index < results.length; index += 1) {
                var result = results[index] || {};
                var triggerValues = Array.isArray(result.trigger_values) ? result.trigger_values : [];

                if (!triggerValues.length) {
                    continue;
                }

                var normalizedTriggers = triggerValues.map(function (value) {
                    return String(value || '').trim().toLowerCase();
                });
                var matches = normalizedTriggers.filter(function (value) {
                    return normalizedSelected.indexOf(value) !== -1;
                });

                if (result.match_mode === 'all') {
                    if (matches.length === normalizedTriggers.length) {
                        return result;
                    }
                } else if (matches.length > 0) {
                    return result;
                }
            }

            return {
                title: data.finalTitle || '\u041a\u0430\u043a Detensor \u043f\u043e\u043c\u043e\u0436\u0435\u0442 \u0438\u043c\u0435\u043d\u043d\u043e \u0432\u0430\u043c',
                text: data.finalText || ''
            };
        }

        function getIntroData() {
            var intro = data.intro || {};
            var title = String(intro.title || '\u0423\u0437\u043d\u0430\u0439\u0442\u0435, \u043a\u0430\u043a {{highlight}} \u043f\u043e\u043c\u043e\u0436\u0435\u0442 \u0438\u043c\u0435\u043d\u043d\u043e \u0432\u0430\u043c');
            var highlight = String(intro.highlight || 'Detensor');
            var description = String(intro.description || ('\u041e\u0442\u0432\u0435\u0442\u044c\u0442\u0435 \u043d\u0430 ' + data.stages.length + ' \u0432\u043e\u043f\u0440\u043e\u0441\u043e\u0432 \u0438 \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u0435 \u0431\u043e\u043d\u0443\u0441\u044b:'));
            var buttonLabel = String(intro.buttonLabel || '\u041f\u0440\u043e\u0439\u0442\u0438 \u0442\u0435\u0441\u0442');
            var timeText = String(intro.timeText || '\u041a\u0432\u0438\u0437 \u0437\u0430\u0439\u043c\u0451\u0442 \u043d\u0435 \u0431\u043e\u043b\u0435\u0435 2 \u043c\u0438\u043d\u0443\u0442');
            var imageUrl = String(intro.imageUrl || '');
            var benefits = Array.isArray(intro.benefits) && intro.benefits.length ? intro.benefits : [
                '\u041a\u043d\u0438\u0433\u0443 \u043e \u043b\u0435\u0447\u0435\u043d\u0438\u0438 \u0431\u043e\u043b\u0438 \u0432 \u0441\u043f\u0438\u043d\u0435',
                '\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u0443\u044e \u043a\u043e\u043d\u0441\u0443\u043b\u044c\u0442\u0430\u0446\u0438\u044e \u0441\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0441\u0442\u0430',
                '\u0421\u043a\u0438\u0434\u043a\u0443 10% \u043d\u0430 \u0430\u0440\u0435\u043d\u0434\u0443 \u043c\u0430\u0442\u0430'
            ];
            var bonusItems = Array.isArray(intro.bonusItems) && intro.bonusItems.length ? intro.bonusItems : benefits.slice(0, 3);
            var titleHtml = String(title || '');
            if (titleHtml.indexOf('{{highlight}}') !== -1) {
                titleHtml = titleHtml.replace('{{highlight}}', '<span class="quiz-wp-brand">' + escapeHtml(highlight) + '</span>');
            } else if (highlight && titleHtml.indexOf(highlight) !== -1) {
                titleHtml = escapeHtml(titleHtml).replace(escapeHtml(highlight), '<span class="quiz-wp-brand">' + escapeHtml(highlight) + '</span>');
            }

            return {
                titleHtml: titleHtml,
                description: description,
                buttonLabel: buttonLabel,
                timeText: timeText,
                imageUrl: imageUrl,
                benefits: benefits,
                bonusItems: bonusItems,
                giftCards: Array.isArray(intro.giftCards) ? intro.giftCards : []
            };
        }

        function getThanksData() {
            var thanks = data.thanks || {};

            return {
                title: String(thanks.title || '\u0421\u043f\u0430\u0441\u0438\u0431\u043e!'),
                text: String(thanks.text || '\u0412\u0430\u0448\u0438 \u0434\u0430\u043d\u043d\u044b\u0435 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u044b. \u0421\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0441\u0442 Detensor \u0441\u0432\u044f\u0436\u0435\u0442\u0441\u044f \u0441 \u0432\u0430\u043c\u0438 \u0438 \u0440\u0430\u0441\u0441\u043a\u0430\u0436\u0435\u0442, \u043a\u0430\u043a\u0430\u044f \u0441\u0438\u0441\u0442\u0435\u043c\u0430 \u043b\u0435\u0447\u0435\u043d\u0438\u044f \u043f\u043e\u0434\u043e\u0439\u0434\u0451\u0442 \u0438\u043c\u0435\u043d\u043d\u043e \u0432\u0430\u043c.'),
                imageUrl: String(thanks.imageUrl || ''),
                bonusesTitle: String(thanks.bonusesTitle || '\u0412\u0430\u0448\u0438 \u0431\u043e\u043d\u0443\u0441\u044b'),
                discountTitle: String(thanks.discountTitle || ''),
                discountNote: String(thanks.discountNote || '\u043f\u043e \u043f\u0440\u043e\u043c\u043e\u043a\u043e\u0434\u0443 \u00ab\u041a\u0412\u0418\u0417\u00bb'),
                bookTitle: String(thanks.bookTitle || thanks.bookLabel || '\u0421\u043a\u0430\u0447\u0430\u0442\u044c \u043a\u043d\u0438\u0433\u0443'),
                bookNote: String(thanks.bookNote || '\u00ab\u0411\u043e\u043b\u0438 \u0432 \u0441\u043f\u0438\u043d\u0435\u00bb'),
                card1ImageUrl: String(thanks.card1ImageUrl || ''),
                card2ImageUrl: String(thanks.card2ImageUrl || ''),
                reviewLabel: String(thanks.reviewLabel || '\u041f\u043e\u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u043e\u0442\u0437\u044b\u0432\u044b \u043e Detensor'),
                reviewUrl: String(thanks.reviewUrl || '#'),
                rentLabel: String(thanks.rentLabel || '\u0412\u0437\u044f\u0442\u044c \u0432 \u0430\u0440\u0435\u043d\u0434\u0443 \u0437\u0430 299 \u0440\u0443\u0431./\u0434\u0435\u043d\u044c'),
                rentUrl: String(thanks.rentUrl || '#'),
                bookLabel: String(thanks.bookLabel || '\u0421\u043a\u0430\u0447\u0430\u0442\u044c \u043a\u043d\u0438\u0433\u0443 \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e'),
                bookUrl: String(thanks.bookUrl || '#')
            };
        }

        function getProductSettings() {
            var settings = data.productSettings || {};
            var general = settings.general || {};
            var items = settings.items || {};

            return {
                general: general,
                items: items
            };
        }

        function calculateProductOptions() {
            var params = getProductParams();
            var age = params.age || 35;
            var weight = params.weight || 75;
            var height = params.height || 170;
            var bmi = height > 0 ? weight / Math.pow(height / 100, 2) : 0;
            var hardness = '2';
            var options = [];

            if (age < 12 || weight < 18) {
                options = ['0', '1'];
            } else if (age < 18 || weight < 60) {
                options = ['1', '2'];
            } else if (weight <= 90) {
                options = ['2'];
            } else if (weight <= 110) {
                options = ['2+', '2'];
            } else {
                options = ['3'];
            }

            if (age >= 70 && options.indexOf('3') !== -1) {
                options = ['2+', '3'];
            } else if (age >= 70 && options.indexOf('2+') !== -1) {
                options = ['2', '2+'];
            }

            if (bmi >= 34 && weight >= 90 && options.indexOf('3') === -1) {
                options = ['3', options[0] || '2'];
            } else if (bmi <= 19 && weight <= 65 && options.indexOf('1') === -1) {
                options = ['2', '1'];
            }

            options = options.filter(function (value, index, list) {
                return list.indexOf(value) === index;
            }).slice(0, 2);

            hardness = options[0] || hardness;
            options = options.length ? options : [hardness];

            return options.map(function (value, index) {
                var product = getProductHardnessData(value);
                product.recommended = index === 0;
                return product;
            });
        }

        function getProductParams() {
            var text = state.answers.map(function (answer) {
                return answer && Array.isArray(answer.labels) ? answer.labels.join('\n') : '';
            }).join('\n');
            var age = extractNumberByLabel(text, /(?:возраст|лет)/i);

            if (/старше\s*70|больше\s*70|70\+/i.test(text)) {
                age = 71;
            } else if (/младше\s*70|до\s*70|менее\s*70/i.test(text)) {
                age = 69;
            }

            return {
                age: age,
                weight: extractNumberByLabel(text, /(?:вес|кг)/i),
                height: extractNumberByLabel(text, /(?:рост|см)/i)
            };
        }

        function extractNumberByLabel(text, pattern) {
            var lines = String(text || '').split(/\n+/);

            for (var index = 0; index < lines.length; index += 1) {
                if (pattern.test(lines[index])) {
                    var match = String(lines[index]).replace(',', '.').match(/(\d+(?:\.\d+)?)/);
                    if (match) {
                        return parseFloat(match[1]);
                    }
                }
            }

            return 0;
        }

        function getProductHardnessData(hardness) {
            var map = {
                '0': {
                    text: '\u0414\u0435\u0442\u0441\u043a\u0438\u0439 \u0432\u0430\u0440\u0438\u0430\u043d\u0442. \u041f\u043e\u0434\u0445\u043e\u0434\u0438\u0442 \u0434\u043b\u044f \u0441\u0430\u043c\u044b\u0445 \u043c\u0430\u043b\u0435\u043d\u044c\u043a\u0438\u0445 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0435\u0439.',
                    weight: '\u0434\u043e 8 \u043a\u0433'
                },
                '1': {
                    text: '\u041c\u044f\u0433\u043a\u0438\u0439 \u0432\u0430\u0440\u0438\u0430\u043d\u0442. \u041f\u043e\u0434\u0445\u043e\u0434\u0438\u0442 \u0434\u043b\u044f \u0434\u0435\u0442\u0435\u0439, \u043f\u043e\u0434\u0440\u043e\u0441\u0442\u043a\u043e\u0432 \u0438 \u043b\u044e\u0434\u0435\u0439 \u0441 \u043d\u0435\u0431\u043e\u043b\u044c\u0448\u0438\u043c \u0432\u0435\u0441\u043e\u043c.',
                    weight: '\u0434\u043e 60 \u043a\u0433'
                },
                '2': {
                    text: '\u0421\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u043d\u044b\u0439 \u0432\u0437\u0440\u043e\u0441\u043b\u044b\u0439 \u0432\u0430\u0440\u0438\u0430\u043d\u0442. \u041e\u043f\u0442\u0438\u043c\u0430\u043b\u044c\u043d\u0430\u044f \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430 \u043f\u043e\u0437\u0432\u043e\u043d\u043e\u0447\u043d\u0438\u043a\u0430.',
                    weight: '60\u201390 \u043a\u0433'
                },
                '2+': {
                    text: '\u0423\u0441\u0438\u043b\u0435\u043d\u043d\u0430\u044f \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430. \u041f\u043e\u0434\u0445\u043e\u0434\u0438\u0442 \u0434\u043b\u044f \u0441\u043f\u043e\u0440\u0442\u0430 \u0438 \u043f\u043e\u0432\u044b\u0448\u0435\u043d\u043d\u043e\u0439 \u043d\u0430\u0433\u0440\u0443\u0437\u043a\u0438.',
                    weight: '95\u2013110 \u043a\u0433'
                },
                '3': {
                    text: '\u0416\u0451\u0441\u0442\u043a\u0438\u0439 \u0432\u0430\u0440\u0438\u0430\u043d\u0442 \u0434\u043b\u044f \u043a\u0440\u0443\u043f\u043d\u044b\u0445 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0435\u0439 \u0438 \u0432\u044b\u0441\u043e\u043a\u043e\u0439 \u043d\u0430\u0433\u0440\u0443\u0437\u043a\u0438.',
                    weight: '\u0431\u043e\u043b\u0435\u0435 110 \u043a\u0433'
                }
            };
            var product = map[hardness] || map['2'];
            var productSettings = getProductSettings();
            var custom = productSettings.items && productSettings.items[hardness] ? productSettings.items[hardness] : {};
            var title = String(custom.title || ('\u0416\u0451\u0441\u0442\u043a\u043e\u0441\u0442\u044c ' + hardness));
            var text = String(custom.text || product.text);
            var weight = String(custom.weight || product.weight);
            var recommendation = String(custom.recommendation || ('\u041b\u0435\u0447\u0435\u0431\u043d\u044b\u0439 \u0442\u0440\u0430\u043a\u0446\u0438\u043e\u043d\u043d\u044b\u0439 \u043c\u0430\u0442 \u0414\u0435\u0442\u0435\u043d\u0437\u043e\u0440 18%, \u0416\u0451\u0441\u0442\u043a\u043e\u0441\u0442\u044c ' + hardness + ' — \u043e\u043f\u0442\u0438\u043c\u0430\u043b\u044c\u043d\u044b\u0439 \u0432\u0430\u0440\u0438\u0430\u043d\u0442 \u0434\u043b\u044f \u0432\u0430\u0448\u0435\u0433\u043e \u0432\u0435\u0441\u0430 \u0438 \u0445\u0430\u0440\u0430\u043a\u0442\u0435\u0440\u0430 \u0431\u043e\u043b\u0438. \u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u0435\u043c\u044b\u0439 \u043a\u0443\u0440\u0441: \u043e\u0442 2 \u043d\u0435\u0434\u0435\u043b\u044c \u0435\u0436\u0435\u0434\u043d\u0435\u0432\u043d\u043e\u0433\u043e \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u044f.'));

            return {
                hardness: hardness,
                title: title,
                fullName: '\u041b\u0435\u0447\u0435\u0431\u043d\u044b\u0439 \u0442\u0440\u0430\u043a\u0446\u0438\u043e\u043d\u043d\u044b\u0439 \u043c\u0430\u0442 \u0414\u0435\u0442\u0435\u043d\u0437\u043e\u0440 18%,<br>' + title,
                text: text,
                weight: weight,
                recommendation: '\u041b\u0435\u0447\u0435\u0431\u043d\u044b\u0439 \u0442\u0440\u0430\u043a\u0446\u0438\u043e\u043d\u043d\u044b\u0439 \u043c\u0430\u0442 \u0414\u0435\u0442\u0435\u043d\u0437\u043e\u0440 18%, \u0416\u0451\u0441\u0442\u043a\u043e\u0441\u0442\u044c ' + hardness + ' — \u043e\u043f\u0442\u0438\u043c\u0430\u043b\u044c\u043d\u044b\u0439 \u0432\u0430\u0440\u0438\u0430\u043d\u0442 \u0434\u043b\u044f \u0432\u0430\u0448\u0435\u0433\u043e \u0432\u0435\u0441\u0430 \u0438 \u0445\u0430\u0440\u0430\u043a\u0442\u0435\u0440\u0430 \u0431\u043e\u043b\u0438. \u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u0435\u043c\u044b\u0439 \u043a\u0443\u0440\u0441: \u043e\u0442 2 \u043d\u0435\u0434\u0435\u043b\u044c \u0435\u0436\u0435\u0434\u043d\u0435\u0432\u043d\u043e\u0433\u043e \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u044f.',
                imageUrl: String(custom.image_url || custom.imageUrl || '')
            };
        }

        function renderProductCard(product) {
            var mediaStyle = product.imageUrl ? ' style="background-image:url(' + escapeAttr(product.imageUrl) + ')"' : '';
            return '' +
                '<article class="quiz-wp-product-card">' +
                    (product.recommended ? '<span class="quiz-wp-product-badge">\u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u0435\u043c\u044b\u0439</span>' : '') +
                    '<div class="quiz-wp-product-card-media' + (product.imageUrl ? ' has-image' : '') + '"' + mediaStyle + '></div>' +
                    '<div class="quiz-wp-product-card-body">' +
                        '<h4>' + renderHtml(product.title) + '</h4>' +
                        '<p>' + renderHtml(product.text) + '</p>' +
                        '<small>\u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u0435\u043c\u044b\u0439 \u0432\u0435\u0441: ' + renderHtml(product.weight) + '</small>' +
                        '<button type="button" class="quiz-wp-product-select' + (product.recommended ? ' is-primary' : '') + '" data-hardness="' + escapeAttr(product.hardness) + '">\u0412\u044b\u0431\u0440\u0430\u0442\u044c</button>' +
                    '</div>' +
                '</article>';
        }

        function renderBonusPanel(discount, items, compact) {
            if (compact) {
                return '' +
                    '<div class="quiz-wp-bonus-card">' +
                            '<div class="quiz-wp-bonus-discount">' + renderIcon('percent') + '<span>\u0412\u0430\u0448\u0430 \u0441\u043a\u0438\u0434\u043a\u0430 <strong>' + escapeHtml(discount) + '</strong></span></div>' +
                        '<div class="quiz-wp-bonus-list">' + (items || []).map(function (item, index) {
                            var iconNames = ['book', 'phone'];
                            return '<div class="quiz-wp-bonus-item">' + renderIcon(iconNames[index] || 'check') + '<span>' + renderHtml(item) + '</span></div>';
                        }).join('') + '</div>' +
                    '</div>';
            }

            var intro = getIntroData();
            var giftCards = intro.giftCards || [];
            var expert = getSideExpertData();
            var firstGift = sideGiftLabel(giftCards[0], items && items[0], '\u041a\u043d\u0438\u0433\u0430 \u0432 \u043f\u043e\u0434\u0430\u0440\u043e\u043a');
            var secondGift = sideGiftLabel(giftCards[1], items && items[1], '\u041f\u0440\u043e\u043c\u043e\u043a\u043e\u0434 \u043d\u0430 \u0441\u043a\u0438\u0434\u043a\u0443');

            return '' +
                '<div class="quiz-wp-bonus-card quiz-wp-bonus-card--stack">' +
                    '<div class="quiz-wp-bonus-discount">' +
                        '<span>\u0412\u0430\u0448\u0430 \u0441\u043a\u0438\u0434\u043a\u0430: <strong>' + escapeHtml(discount) + '</strong></span>' +
                        '<span class="quiz-wp-bonus-symbol">' + renderIcon('percent') + '</span>' +
                    '</div>' +
                    '<div class="quiz-wp-side-gift quiz-wp-side-gift--book">' +
                        '<span class="quiz-wp-side-gift-icon">' + renderIcon('book') + '</span>' +
                        '<span>' + renderHtml(firstGift) + '</span>' +
                    '</div>' +
                    '<div class="quiz-wp-side-gift quiz-wp-side-gift--promo">' +
                        '<span class="quiz-wp-side-gift-icon">' + renderIcon('percent') + '</span>' +
                        '<span>' + renderHtml(secondGift) + '</span>' +
                    '</div>' +
                    '<div class="quiz-wp-side-expert">' +
                        '<div class="quiz-wp-side-expert-head">' +
                            '<span class="quiz-wp-side-expert-avatar">' + (expert.avatarUrl ? '<img src="' + escapeAttr(expert.avatarUrl) + '" alt="">' : '') + '</span>' +
                            '<span class="quiz-wp-side-expert-meta">' +
                                '<strong>' + renderHtml(expert.name) + '</strong>' +
                                '<small>' + renderHtml(expert.role) + '</small>' +
                            '</span>' +
                        '</div>' +
                        '<div class="quiz-wp-side-expert-quote">' + renderHtml(expert.quote) + '</div>' +
                    '</div>' +
                '</div>';
        }

        function renderMobileDiscount(discount) {
            return '' +
                '<div class="quiz-wp-mobile-discount-card">' +
                    '<span class="quiz-wp-mobile-discount-icon">' + renderIcon('percent') + '</span>' +
                    '<strong>\u0412\u0430\u0448\u0430 \u0441\u043a\u0438\u0434\u043a\u0430: ' + escapeHtml(discount) + '</strong>' +
                '</div>';
        }

        function sideGiftLabel(card, fallbackItem, defaultText) {
            var title = card ? String(card.title || '').trim() : '';
            var text = card ? String(card.text || '').trim() : '';

            if (title || text) {
                return [title, text].filter(Boolean).join(' ');
            }

            return String(fallbackItem || defaultText);
        }

        function getSideExpertData() {
            var expert = data.sideExpert || {};

            return {
                name: String(expert.name || '\u041e\u043a\u0441\u0430\u043d\u0430 \u041c\u0430\u043a\u0430\u0440\u044b\u0447\u0435\u0432\u0430'),
                role: String(expert.role || '\u0421\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0441\u0442 \u043f\u043e \u043b\u0435\u0447\u0435\u043d\u0438\u044e \u0437\u0430\u0431\u043e\u043b\u0435\u0432\u0430\u043d\u0438\u0439 \u043f\u043e\u0437\u0432\u043e\u043d\u043e\u0447\u043d\u0438\u043a\u0430'),
                quote: String(expert.quote || '\u00ab\u0414\u0435\u0442\u0435\u043d\u0437\u043e\u0440 \u2014 \u0443\u043d\u0438\u043a\u0430\u043b\u044c\u043d\u0430\u044f \u0441\u0438\u0441\u0442\u0435\u043c\u0430, \u043a\u043e\u0442\u043e\u0440\u0430\u044f \u043f\u043e\u043c\u043e\u0433\u0430\u0435\u0442 \u0441\u043d\u044f\u0442\u044c \u0431\u043e\u043b\u044c \u0431\u0435\u0437 \u043c\u0435\u0434\u0438\u043a\u0430\u043c\u0435\u043d\u0442\u043e\u0432\u00bb'),
                avatarUrl: String(expert.avatarUrl || '')
            };
        }

        function getDynamicDiscountLabel(currentStep, totalSteps) {
            var baseLabel = String(data.discountLabel || '10%');
            var parsedDiscount = parseDiscountLabel(baseLabel);

            if (!parsedDiscount || totalSteps <= 0) {
                return baseLabel;
            }

            var ratio = Math.max(0, Math.min(currentStep / totalSteps, 1));
            var value = Math.round(parsedDiscount.value * ratio);

            return parsedDiscount.prefix + String(value) + parsedDiscount.suffix;
        }

        function parseDiscountLabel(label) {
            var match = String(label || '').match(/^(.*?)(\d+(?:[.,]\d+)?)(.*)$/);

            if (!match) {
                return null;
            }

            return {
                prefix: match[1] || '',
                value: parseFloat(String(match[2]).replace(',', '.')) || 0,
                suffix: match[3] || ''
            };
        }

        function renderMiniBonuses(items) {
            var iconNames = ['book', 'phone', 'percent'];

            return (items || []).slice(0, 3).map(function (item, index) {
                return '' +
                    '<div class="quiz-wp-mini-bonus">' +
                        '<span class="quiz-wp-mini-icon">' + renderIcon(iconNames[index] || 'check') + '</span>' +
                        '<span>' + renderHtml(item) + '</span>' +
                    '</div>';
            }).join('');
        }

        function renderContactRewards(discount, intro) {
            var giftCards = (intro && intro.giftCards) || [];
            var bonusItems = (intro && intro.bonusItems) || [];
            var firstGift = sideGiftLabel(giftCards[0], bonusItems[0], '\u041a\u043d\u0438\u0433\u0430 \u0432 \u043f\u043e\u0434\u0430\u0440\u043e\u043a');
            var secondGift = sideGiftLabel(giftCards[1], bonusItems[1], '\u041f\u0440\u043e\u043c\u043e\u043a\u043e\u0434 \u043d\u0430 \u0441\u043a\u0438\u0434\u043a\u0443');

            return '' +
                '<div class="quiz-wp-contact-reward quiz-wp-contact-reward--blue">' +
                    '<span class="quiz-wp-contact-reward-icon">' + renderIcon('percent') + '</span>' +
                    '<strong>\u0421\u043a\u0438\u0434\u043a\u0430<br>' + escapeHtml(discount) + '</strong>' +
                '</div>' +
                '<div class="quiz-wp-contact-reward quiz-wp-contact-reward--violet">' +
                    '<span class="quiz-wp-contact-reward-icon">' + renderIcon('book') + '</span>' +
                    '<strong>' + renderContactRewardText(firstGift) + '</strong>' +
                '</div>' +
                '<div class="quiz-wp-contact-reward quiz-wp-contact-reward--blue-light">' +
                    '<span class="quiz-wp-contact-reward-icon">' + renderIcon('percent') + '</span>' +
                    '<strong>' + renderContactRewardText(secondGift) + '</strong>' +
                '</div>';
        }

        function renderContactRewardText(value) {
            var parts = String(value || '').trim().split(/\s+/);

            if (parts.length > 1) {
                return renderHtml(parts.slice(0, 1).join(' ') + '<br>' + parts.slice(1).join(' '));
            }

            return renderHtml(value);
        }

        function renderDefaultContactForm(privacyUrl) {
            return '' +
                '<form class="quiz-wp-default-form">' +
                    '<label><span>\u0418\u043c\u044f</span><input type="text" name="quiz_default_name" placeholder="\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0432\u0430\u0448\u0435 \u0438\u043c\u044f" autocomplete="name"></label>' +
                    '<label><span>\u0422\u0435\u043b\u0435\u0444\u043e\u043d</span><input type="tel" name="quiz_default_phone" placeholder="+7 (___) ___-__-__" autocomplete="tel"></label>' +
                    '<label><span>E-mail</span><input type="email" name="quiz_default_email" placeholder="example@mail.ru" autocomplete="email"></label>' +
                    '<label class="quiz-wp-default-consent"><input type="checkbox" checked required><span>\u042f \u0441\u043e\u0433\u043b\u0430\u0441\u0435\u043d \u043d\u0430 \u043e\u0431\u0440\u0430\u0431\u043e\u0442\u043a\u0443 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u043b\u044c\u043d\u044b\u0445 \u0434\u0430\u043d\u043d\u044b\u0445</span></label>' +
                    '<button type="submit" class="quiz-wp-btn quiz-wp-btn--primary quiz-wp-default-submit"><span>\u041f\u043e\u043b\u0443\u0447\u0438\u0442\u044c \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b</span><span class="quiz-wp-btn-icon">' + renderIcon('arrow') + '</span></button>' +
                    (privacyUrl && privacyUrl !== '#' ? '<a class="quiz-wp-default-privacy" href="' + escapeAttr(privacyUrl) + '" target="_blank" rel="noopener">\u041f\u043e\u043b\u0438\u0442\u0438\u043a\u0430 \u043a\u043e\u043d\u0444\u0438\u0434\u0435\u043d\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u0438</a>' : '') +
                '</form>';
        }

        function renderIntroGiftCards(cards, fallbackItems) {
            cards = (cards || []).filter(function (card) {
                return card && (String(card.title || '').trim() || String(card.text || '').trim());
            }).slice(0, 2);

            if (!cards.length && Array.isArray(fallbackItems)) {
                cards = fallbackItems.slice(0, 2).map(function (item) {
                    return {
                        title: item,
                        text: ''
                    };
                });
            }

            if (!cards.length) {
                cards = [
                    { title: '\u041a\u043d\u0438\u0433\u0430', text: '\u0432 \u043f\u043e\u0434\u0430\u0440\u043e\u043a' },
                    { title: '\u041f\u0440\u043e\u043c\u043e\u043a\u043e\u0434', text: '\u043d\u0430 \u0441\u043a\u0438\u0434\u043a\u0443' }
                ];
            }

            return cards.map(function (card, index) {
                var mode = index === 0 ? 'book' : 'promo';
                var iconName = index === 0 ? 'book' : 'percent';
                var fallbackTitle = index === 0 ? '\u041a\u043d\u0438\u0433\u0430' : '\u041f\u0440\u043e\u043c\u043e\u043a\u043e\u0434';
                var fallbackText = index === 0 ? '\u0432 \u043f\u043e\u0434\u0430\u0440\u043e\u043a' : '\u043d\u0430 \u0441\u043a\u0438\u0434\u043a\u0443';
                var title = String(card.title || '').trim() || fallbackTitle;
                var text = String(card.text || '').trim() || fallbackText;

                return '' +
                    '<div class="quiz-wp-intro-gift quiz-wp-intro-gift--' + mode + '">' +
                        '<span class="quiz-wp-intro-gift-icon">' + renderIcon(iconName) + '</span>' +
                        '<span class="quiz-wp-intro-gift-text">' +
                            '<strong>' + renderHtml(title) + '</strong>' +
                            '<small>' + renderHtml(text) + '</small>' +
                        '</span>' +
                    '</div>';
            }).join('');
        }

        function renderThanksLink(label, url, mode) {
            return '<a class="quiz-wp-thanks-link quiz-wp-thanks-link--' + mode + '" href="' + escapeAttr(url || '#') + '"' + (url && url !== '#' ? ' target="_blank" rel="noopener"' : '') + '>' + renderHtml(label) + (mode === 'catalog' ? '<span class="quiz-wp-btn-icon">' + renderIcon('arrow') + '</span>' : '') + '</a>';
        }

        function renderThanksPromoCard(url, imageUrl) {
            var imageStyle = imageUrl ? ' style="background-image:url(' + escapeAttr(imageUrl) + ')"' : '';
            return '<a class="quiz-wp-thanks-promo-card' + (imageUrl ? ' has-image' : '') + '" href="' + escapeAttr(url || '#') + '"' + (url && url !== '#' ? ' target="_blank" rel="noopener"' : '') + imageStyle + '></a>';
        }

        function renderIntroImage(url) {
            return '<img src="' + escapeAttr(url) + '" alt="">';
        }

        function renderOptionImage(url) {
            if (!url) {
                return '';
            }

            return '<span class="quiz-wp-answer-media"><img src="' + escapeAttr(url) + '" alt=""></span>';
        }

        function populateCf7Fields(resultTitle) {
            var form = app.querySelector('.wpcf7 form');
            if (!form) {
                return;
            }

            setField(form, 'quiz_id', String(data.id || ''));
            setField(form, 'quiz_title', String(data.title || ''));
            setField(form, 'quiz_answers', state.answers.filter(Boolean).map(function (answer) {
                return answer.title + ': ' + (answer.labels || answer.values || []).join(', ');
            }).join(' | '));
            setField(form, 'quiz_result_title', String(resultTitle || ''));
        }

        function setField(form, fieldName, value) {
            var field = form.querySelector('[name="' + fieldName + '"]');
            if (field) {
                field.value = value;
            }
        }

        function initCf7() {
            if (typeof window.wpcf7 !== 'undefined' && window.wpcf7.init) {
                app.querySelectorAll('.wpcf7 form').forEach(function (form) {
                    window.wpcf7.init(form);
                });
            }
        }

        function applyQuizPhoneMasks() {
            if (typeof window.IMask === 'undefined') {
                return;
            }

            app.querySelectorAll('input[type="tel"]').forEach(function (input) {
                if (input.dataset.maskApplied === 'true') {
                    return;
                }

                var mask = window.IMask(input, {
                    mask: '+{7} (000) 000-00-00',
                    lazy: true
                });

                input.addEventListener('beforeinput', function (event) {
                    if (event.data === '8' && input.value.trim() === '') {
                        event.preventDefault();
                        mask.value = '+7 ';
                    }
                });

                input.addEventListener('paste', function (event) {
                    event.preventDefault();
                    var pasted = (event.clipboardData || window.clipboardData).getData('text');
                    pasted = pasted.replace(/\D/g, '');

                    if (pasted.startsWith('8')) {
                        pasted = '7' + pasted.slice(1);
                    }

                    if (!pasted.startsWith('7')) {
                        pasted = '7' + pasted;
                    }

                    mask.value = '+7' + pasted.slice(1, 11);
                });

                input.dataset.maskApplied = 'true';
                input._mask = mask;
            });
        }

        function bindClose() {
            var close = app.querySelector('.quiz-wp-close');
            if (close) {
                close.addEventListener('click', function () {
                    if (isQuizModal) {
                        closeQuizModal();
                        return;
                    }

                    restoreInitialMarkup();
                });
            }
        }

        function highlightBrand(text) {
            return escapeHtml(String(text || '')).replace(/Detensor/g, '<span class="quiz-wp-brand">Detensor</span>');
        }

        function renderCloseButton() {
            if (isEmbeddedPopup) {
                return '';
            }

            return '<button type="button" class="quiz-wp-close" aria-label="Close">' + renderIcon('close') + '</button>';
        }

        function renderIcon(name) {
            var icons = {
                check: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.3272 3.99817L5.99721 11.3281L2.66541 7.99633" stroke="#00A859" stroke-width="1.33272" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`,
                'check-soft': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.3272 3.99817L5.99721 11.3281L2.66541 7.99633" stroke="#00A859" stroke-width="1.33272" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`,
                arrow: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.33179 7.99609H12.6608" stroke="white" stroke-width="1.33272" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M7.99634 3.33203L12.6609 7.99655L7.99634 12.6611" stroke="white" stroke-width="1.33272" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`,
                back: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.99448 11.0743L2.91437 6.99418L6.99448 2.91406" stroke="#6B7280" stroke-width="1.16575" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M11.0746 6.99414H2.91437" stroke="#6B7280" stroke-width="1.16575" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`,
                close: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.9945 3.99805L3.99817 11.9944" stroke="#1A1A2E" stroke-width="1.33272" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3.99817 3.99805L11.9945 11.9944" stroke="#1A1A2E" stroke-width="1.33272" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`,
                book: `<svg width="21" height="28" viewBox="0 0 21 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M0.61499 23.9404V3.9474C0.61499 3.06365 0.933256 2.2161 1.49977 1.5912C2.06629 0.966301 2.83465 0.615234 3.63582 0.615234H18.74C19.0605 0.615234 19.3678 0.755661 19.5944 1.00562C19.821 1.25558 19.9483 1.5946 19.9483 1.9481V25.9397C19.9483 26.2932 19.821 26.6322 19.5944 26.8822C19.3678 27.1321 19.0605 27.2725 18.74 27.2725H3.63582C2.83465 27.2725 2.06629 26.9215 1.49977 26.2966C0.933256 25.6717 0.61499 24.8241 0.61499 23.9404ZM0.61499 23.9404C0.61499 23.0566 0.933256 22.2091 1.49977 21.5842C2.06629 20.9593 2.83465 20.6082 3.63582 20.6082H19.9483" stroke="#0057B8" stroke-width="1.23009" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`,
                phone: `<svg width="22" height="24" viewBox="0 0 22 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21.426 16.9973V20.426C21.4272 20.7443 21.3678 21.0594 21.2515 21.351C21.1353 21.6427 20.9649 21.9045 20.7511 22.1197C20.5373 22.3349 20.2849 22.4987 20.0101 22.6007C19.7353 22.7026 19.4441 22.7405 19.1552 22.7119C15.9498 22.3297 12.8708 21.1279 10.1656 19.2031C7.64875 17.4483 5.51491 15.1071 3.9156 12.3456C2.15516 9.36396 1.0596 5.96925 0.717683 2.4365C0.691653 2.12044 0.725886 1.8019 0.818205 1.50116C0.910523 1.20042 1.0589 0.92406 1.2539 0.689684C1.44889 0.455308 1.68623 0.268049 1.9508 0.139828C2.21537 0.0116067 2.50137 -0.0547661 2.7906 -0.055065H5.9156C6.42113 -0.0605241 6.91122 0.135892 7.29452 0.497573C7.67782 0.859254 7.92818 1.36152 7.99893 1.91075C8.13083 3.00803 8.37544 4.08541 8.7281 5.12235C8.86825 5.53143 8.89858 5.97601 8.8155 6.40343C8.73242 6.83084 8.53942 7.22316 8.25935 7.53391L6.93643 8.98542C8.4193 11.8468 10.5786 14.2159 13.1864 15.8429L14.5093 14.3914C14.7926 14.0841 15.1501 13.8724 15.5397 13.7812C15.9292 13.6901 16.3344 13.7233 16.7073 13.8771C17.6523 14.264 18.6343 14.5324 19.6344 14.6771C20.1404 14.7555 20.6025 15.0351 20.9328 15.4629C21.2632 15.8907 21.4387 16.4368 21.426 16.9973Z" stroke="#0057B8" stroke-width="1.4185" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`,
                percent: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.8333 4.1665L4.16663 15.8332" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.41671 7.50016C6.5673 7.50016 7.50004 6.56742 7.50004 5.41683C7.50004 4.26624 6.5673 3.3335 5.41671 3.3335C4.26611 3.3335 3.33337 4.26624 3.33337 5.41683C3.33337 6.56742 4.26611 7.50016 5.41671 7.50016Z" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14.5833 16.6667C15.7339 16.6667 16.6667 15.7339 16.6667 14.5833C16.6667 13.4327 15.7339 12.5 14.5833 12.5C13.4327 12.5 12.5 13.4327 12.5 14.5833C12.5 15.7339 13.4327 16.6667 14.5833 16.6667Z" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`,
                success: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M26.6545 7.99609L11.9945 22.656L5.33093 15.9924" stroke="#00A859" stroke-width="2.66544" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
            };

            return icons[name] || icons.check;
        }

        function escapeHtml(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function escapeAttr(value) {
            return escapeHtml(value);
        }

        function renderHtml(value) {
            return String(value || '');
        }

        function stripHtml(value) {
            return String(value || '').replace(/<[^>]*>/g, '').trim();
        }

        document.addEventListener('wpcf7mailsent', function (event) {
            var form = app.querySelector('.wpcf7 form');
            if (form && event.target === form) {
                handleContactSubmitted();
            }
        });

        app._quizWpReset = restoreInitialMarkup;
        render();
    }

    function initAllQuizApps(root) {
        var scope = root && root.querySelectorAll ? root : document;
        scope.querySelectorAll('.quiz-wp-app').forEach(function (app) {
            initQuizApp(app);
        });
    }

    function openQuizModal(overlay) {
        if (!overlay) {
            return;
        }

        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('quiz-wp-modal-open');
        initAllQuizApps(overlay);

        var app = overlay.querySelector('.quiz-wp-app');
        if (app && typeof app._quizWpReset === 'function') {
            app._quizWpReset();
        }
    }

    function closeQuizModalOverlay(overlay) {
        if (!overlay) {
            return;
        }

        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('quiz-wp-modal-open');
    }

    document.addEventListener('DOMContentLoaded', function () {
        initAllQuizApps(document);
    });

    document.addEventListener('click', function (event) {
        var trigger = event.target.closest ? event.target.closest('.quiz-wp-modal-trigger') : null;
        if (trigger) {
            var target = trigger.getAttribute('data-quiz-wp-modal-target');
            var overlay = target ? document.querySelector(target) : null;
            event.preventDefault();
            openQuizModal(overlay);
            return;
        }

        var externalTrigger = event.target.closest ? event.target.closest('[data-quiz-wp-open]') : null;
        if (externalTrigger) {
            var quizId = externalTrigger.getAttribute('data-quiz-wp-open');
            var externalOverlay = null;
            document.querySelectorAll('.quiz-wp-modal-overlay[data-quiz-wp-modal-id]').forEach(function (candidate) {
                if (!externalOverlay && candidate.getAttribute('data-quiz-wp-modal-id') === quizId) {
                    externalOverlay = candidate;
                }
            });
            event.preventDefault();
            openQuizModal(externalOverlay);
            return;
        }

        var overlay = event.target.classList && event.target.classList.contains('quiz-wp-modal-overlay') ? event.target : null;
        if (overlay) {
            closeQuizModalOverlay(overlay);
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') {
            return;
        }

        document.querySelectorAll('.quiz-wp-modal-overlay.is-open').forEach(function (overlay) {
            closeQuizModalOverlay(overlay);
        });
    });

    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (!node || node.nodeType !== 1) {
                    return;
                }

                if (node.matches && node.matches('.quiz-wp-app')) {
                    initQuizApp(node);
                    return;
                }

                if (node.querySelectorAll) {
                    initAllQuizApps(node);
                }
            });
        });
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    window.QuizWpInit = initAllQuizApps;
})();
