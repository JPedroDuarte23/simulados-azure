document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentQuestions = [];
    let currentIndex = 0;
    let score = { correct: 0, wrong: 0 };
    let manifestData = null;
    
    // DOM Elements
    const hubSection = document.getElementById('hub-section');
    const quizSection = document.getElementById('quiz-section');
    const resultSection = document.getElementById('result-section');
    const statusBar = document.getElementById('status-bar');
    const hubContent = document.getElementById('hub-content');
    const questionContainer = document.getElementById('question-content');
    const feedbackArea = document.getElementById('feedback-area');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.className = 'hidden';
    loadingOverlay.innerHTML = '<div class="spinner"></div><p>Carregando questões...</p>';
    document.body.appendChild(loadingOverlay);
    
    // Fetch Manifest
    fetch('data/manifest.json')
        .then(response => response.json())
        .then(data => {
            manifestData = data;
            renderHub();
        })
        .catch(err => console.error('Error loading manifest:', err));

    // --- HUB FUNCTIONS ---
    function renderHub() {
        hubContent.innerHTML = '';
        
        manifestData.main_topics.forEach(topic => {
            const topicSection = document.createElement('div');
            topicSection.className = 'main-topic-section';

            const topicTitle = document.createElement('h3');
            topicTitle.className = 'main-topic-title';
            topicTitle.textContent = topic.title;
            topicSection.appendChild(topicTitle);

            const grid = document.createElement('div');
            grid.className = 'grid-container';

            topic.categories.forEach(cat => {
                const btn = document.createElement('button');
                btn.className = 'category-btn';
                btn.innerHTML = `
                    <span class="cat-name">${cat.name}</span>
                    <span class="cat-count">${cat.count} questões</span>
                `;
                btn.onclick = () => startQuiz(cat.id);
                grid.appendChild(btn);
            });
            topicSection.appendChild(grid);
            hubContent.appendChild(topicSection);
        });

        document.getElementById('start-general-btn').onclick = () => startQuiz('all');
    }

    function showLoading(show) {
        if (show) loadingOverlay.classList.remove('hidden');
        else loadingOverlay.classList.add('hidden');
    }
    
    // --- QUIZ FUNCTIONS ---
    async function startQuiz(categoryId) {
        showLoading(true);
        currentQuestions = [];

        try {
            if (categoryId === 'all') {
                // Flatten all categories from all main topics
                const allCategories = manifestData.main_topics.flatMap(topic => topic.categories);
                const promises = allCategories.map(cat => 
                    fetch(cat.file).then(r => r.json())
                );
                const results = await Promise.all(promises);
                currentQuestions = results.flat();
            } else {
                // Find the category across all main topics
                let category = null;
                for (const topic of manifestData.main_topics) {
                    const foundCat = topic.categories.find(c => c.id === categoryId);
                    if (foundCat) {
                        category = foundCat;
                        break;
                    }
                }
                
                if (category) {
                    const response = await fetch(category.file);
                    currentQuestions = await response.json();
                }
            }
            
            if (currentQuestions.length === 0) {
                alert('Nenhuma questão encontrada para esta categoria.');
                showLoading(false);
                return;
            }

            // Shuffle questions
            currentQuestions.sort(() => Math.random() - 0.5);
            
            currentIndex = 0;
            score = { correct: 0, wrong: 0 };
            updateScoreUI();
            
            hubSection.classList.add('hidden');
            resultSection.classList.add('hidden');
            quizSection.classList.remove('hidden');
            statusBar.classList.remove('hidden');
            
            loadQuestion();
        } catch (error) {
            console.error('Error starting quiz:', error);
            alert('Erro ao carregar as questões. Tente novamente.');
        } finally {
            showLoading(false);
        }
    }

    function showLoading(show) {
        if (show) loadingOverlay.classList.remove('hidden');
        else loadingOverlay.classList.add('hidden');
    }

    function loadQuestion() {
        const q = currentQuestions[currentIndex];
        
        // Update Header
        document.getElementById('question-category').textContent = q.category;
        document.getElementById('question-difficulty').textContent = q.difficulty;
        document.getElementById('progress').textContent = `Questão: ${currentIndex + 1}/${currentQuestions.length}`;
        
        // Reset UI
        feedbackArea.classList.add('hidden');
        feedbackArea.className = 'feedback-area'; // Reset classes
        submitBtn.classList.remove('hidden');
        nextBtn.classList.add('hidden');
        questionContainer.innerHTML = '';
        questionContainer.className = ''; // Reset answered state

        // Render based on type
        if (q.type === 'no_return_series') {
            const scenario = document.createElement('div');
            scenario.className = 'scenario-box';
            scenario.innerHTML = `<strong>Cenário:</strong> ${q.content.scenario}`;
            questionContainer.appendChild(scenario);
            
            const statement = document.createElement('p');
            statement.innerHTML = `<strong>Pergunta:</strong> ${q.content.statement}`;
            questionContainer.appendChild(statement);
        } else if (q.type === 'case_study') {
            renderCaseStudyTabs(q);
            const statement = document.createElement('p');
            statement.innerHTML = `<strong>Pergunta:</strong> ${q.content.statement}`;
            questionContainer.appendChild(statement);
        } else if (q.type === 'dropdown_fill_in_blank') {
             // Statement handled inside renderer or just print it here
             const statement = document.createElement('p');
             statement.textContent = q.content.statement;
             questionContainer.appendChild(statement);
        } else {
            const statement = document.createElement('p');
            statement.textContent = q.content.statement;
            questionContainer.appendChild(statement);
        }

        if (q.type === 'multiple_choice' || q.type === 'case_study') {
            renderMultipleChoice(q); // Case study uses same options format
        } else if (q.type === 'drag_and_drop') {
            renderDragAndDrop(q);
        } else if (q.type === 'no_return_series') {
            renderNoReturnSeries(q);
        } else if (q.type === 'dropdown_fill_in_blank') {
            renderDropdownFillInBlank(q);
        } else {
            questionContainer.innerHTML += '<p>Tipo de questão não suportado ainda.</p>';
        }
    }

    // --- RENDERERS ---
    function renderCaseStudyTabs(q) {
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'cs-tabs-container';

        const tabHeader = document.createElement('div');
        tabHeader.className = 'cs-tab-header';

        const tabContent = document.createElement('div');
        tabContent.className = 'cs-tab-content';

        q.content.tabs.forEach((tab, index) => {
            const btn = document.createElement('button');
            btn.className = `cs-tab-btn ${index === 0 ? 'active' : ''}`;
            btn.textContent = tab.title;
            btn.onclick = () => {
                // Switch Tabs
                document.querySelectorAll('.cs-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.cs-tab-pane').forEach(p => p.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`tab-${tab.id}`).classList.add('active');
            };
            tabHeader.appendChild(btn);

            const pane = document.createElement('div');
            pane.id = `tab-${tab.id}`;
            pane.className = `cs-tab-pane ${index === 0 ? 'active' : ''}`;
            pane.innerHTML = tab.content.replace(/\n/g, '<br>');
            tabContent.appendChild(pane);
        });

        tabsContainer.appendChild(tabHeader);
        tabsContainer.appendChild(tabContent);
        questionContainer.appendChild(tabsContainer);
    }

    function renderDropdownFillInBlank(q) {
        const container = document.createElement('div');
        container.className = 'dropdown-text-container';
        
        // Replace {{index}} with <select>
        let textHtml = q.content.text;
        
        // Find all placeholders {{0}}, {{1}}, etc.
        const regex = /\{\{(\d+)\}\}/g;
        textHtml = textHtml.replace(regex, (match, index) => {
            const dropdownIndex = parseInt(index);
            const dropdownData = q.content.dropdowns.find(d => d.index === dropdownIndex);
            
            if (!dropdownData) return '???';

            let optionsHtml = '<option value="">-- Selecione --</option>';
            dropdownData.options.forEach(opt => {
                optionsHtml += `<option value="${opt.id}">${opt.text}</option>`;
            });

            return `<select class="inline-dropdown" data-index="${dropdownIndex}">${optionsHtml}</select>`;
        });

        container.innerHTML = textHtml;
        questionContainer.appendChild(container);
    }

    function renderMultipleChoice(q) {
        const optionsDiv = document.createElement('div');
        const isMultiple = q.correct_answer.length > 1;
        
        if (isMultiple) {
            const hint = document.createElement('small');
            hint.textContent = `(Selecione ${q.correct_answer.length} opções)`;
            optionsDiv.appendChild(hint);
        }

        q.content.options.forEach(opt => {
            const label = document.createElement('label');
            label.className = 'option-item';
            const input = document.createElement('input');
            input.type = isMultiple ? 'checkbox' : 'radio';
            input.name = 'option';
            input.value = opt.id;
            label.appendChild(input);
            label.appendChild(document.createTextNode(opt.text));
            optionsDiv.appendChild(label);
        });
        questionContainer.appendChild(optionsDiv);
    }

    function renderDragAndDrop(q) {
        const container = document.createElement('div');
        container.className = 'dnd-container';

        // Source Column (Items to drag)
        const sourceCol = document.createElement('div');
        sourceCol.className = 'dnd-column';
        sourceCol.id = 'source-col';
        sourceCol.innerHTML = '<h4>Itens</h4>';
        
        // Target Column (Drop zone)
        const targetCol = document.createElement('div');
        targetCol.className = 'dnd-column';
        targetCol.id = 'target-col';
        targetCol.innerHTML = '<h4>Ordem Correta</h4>';

        // Shuffle items initially
        const items = [...q.content.items_to_drag].sort(() => Math.random() - 0.5);

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'draggable-item';
            div.draggable = true;
            div.textContent = item.text;
            div.dataset.id = item.id;
            
            div.addEventListener('dragstart', handleDragStart);
            div.addEventListener('dragend', handleDragEnd);
            sourceCol.appendChild(div);
        });

        [sourceCol, targetCol].forEach(col => {
            col.addEventListener('dragover', e => {
                e.preventDefault();
                const afterElement = getDragAfterElement(col, e.clientY);
                const draggable = document.querySelector('.dragging');
                if (afterElement == null) {
                    col.appendChild(draggable);
                } else {
                    col.insertBefore(draggable, afterElement);
                }
            });
        });

        container.appendChild(sourceCol);
        container.appendChild(targetCol);
        questionContainer.appendChild(container);
    }

    function renderNoReturnSeries(q) {
        const optionsDiv = document.createElement('div');
        q.content.options.forEach(opt => {
            const label = document.createElement('label');
            label.className = 'option-item';
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'option';
            input.value = opt.id;
            label.appendChild(input);
            label.appendChild(document.createTextNode(opt.text));
            optionsDiv.appendChild(label);
        });
        questionContainer.appendChild(optionsDiv);
    }

    // --- DRAG & DROP HELPERS ---
    function handleDragStart(e) {
        e.target.classList.add('dragging');
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.draggable-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // --- ANSWER CHECKING & HIGHLIGHTING ---
    function highlightAnswers(q, isOverallCorrect) {
        questionContainer.classList.add('answered');
        document.querySelectorAll('#question-content input, #question-content select').forEach(el => el.disabled = true);

        if (q.type === 'multiple_choice' || q.type === 'no_return_series' || q.type === 'case_study') {
            const selectedValues = [...document.querySelectorAll('input[name="option"]:checked')].map(i => i.value);
            document.querySelectorAll('.option-item').forEach(optLabel => {
                const input = optLabel.querySelector('input');
                const isSelected = selectedValues.includes(input.value);
                const isCorrectAnswer = q.correct_answer.includes(input.value);

                if (isSelected && isCorrectAnswer) {
                    optLabel.classList.add('correct');
                } else if (isSelected && !isCorrectAnswer) {
                    optLabel.classList.add('wrong');
                } else if (!isSelected && isCorrectAnswer && !isOverallCorrect) {
                    // If the user was wrong, show them the right answer
                    optLabel.classList.add('correct');
                }
            });
        } else if (q.type === 'drag_and_drop') {
            document.querySelectorAll('#target-col .draggable-item').forEach(item => {
                item.classList.add(isOverallCorrect ? 'correct' : 'wrong');
            });
        } else if (q.type === 'dropdown_fill_in_blank') {
            document.querySelectorAll('.inline-dropdown').forEach((sel, index) => {
                const isCorrectDropdown = sel.value === q.correct_answer[index];
                sel.classList.add(isCorrectDropdown ? 'correct' : 'wrong');
            });
        }
    }

    submitBtn.onclick = () => {
        const q = currentQuestions[currentIndex];
        let isCorrect = false;

        // Validation logic for each type
        if (q.type === 'multiple_choice' || q.type === 'case_study') {
            const isMultiple = q.correct_answer.length > 1;
            const selected = [...document.querySelectorAll('input[name="option"]:checked')].map(i => i.value);
            
            if(selected.length === 0) {
                return alert('Selecione ao menos uma opção!');
            }

            if (isMultiple) {
                // Exact match for multiple answers
                isCorrect = selected.every(val => q.correct_answer.includes(val)) && selected.length === q.correct_answer.length;
            } else {
                isCorrect = q.correct_answer.includes(selected[0]);
            }
        } 
        else if (q.type === 'no_return_series') {
            const selected = document.querySelector('input[name="option"]:checked');
            if (!selected) return alert('Selecione uma opção!');
            isCorrect = q.correct_answer.includes(selected.value);
        }
        else if (q.type === 'dropdown_fill_in_blank') {
            const selects = [...document.querySelectorAll('.inline-dropdown')];
            const userAnswers = selects.map(s => s.value);
            
            if (userAnswers.some(a => a === "")) return alert('Preencha todas as lacunas!');

            // Compare ordered arrays
            isCorrect = JSON.stringify(userAnswers) === JSON.stringify(q.correct_answer);
        }
        else if (q.type === 'drag_and_drop') {
            const targetCol = document.getElementById('target-col');
            const items = [...targetCol.querySelectorAll('.draggable-item')];
            const userOrder = items.map(i => i.dataset.id);
            
            if (userOrder.length !== q.content.items_to_drag.length) {
                return alert('Arraste todos os itens para a coluna da direita!');
            }
            
            // Check order
            isCorrect = JSON.stringify(userOrder) === JSON.stringify(q.correct_answer);
        }

        // Update Score
        if (isCorrect) score.correct++;
        else score.wrong++;
        updateScoreUI();

        // --- Post-validation ---
        highlightAnswers(q, isCorrect);

        // Show Feedback
        feedbackArea.classList.remove('hidden');
        feedbackArea.className = `feedback-area ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`;
        
        document.getElementById('feedback-message').innerHTML = `<strong>${isCorrect ? 'Correto!' : 'Incorreto'}</strong>`;
        document.getElementById('explanation-text').textContent = q.explanation;
        
        const docLink = document.getElementById('doc-link');
        if (q.official_doc_link) {
            docLink.href = q.official_doc_link;
            docLink.style.display = 'inline';
        } else {
            docLink.style.display = 'none';
        }

        submitBtn.classList.add('hidden');
        nextBtn.classList.remove('hidden');
    };

    nextBtn.onclick = () => {
        currentIndex++;
        if (currentIndex < currentQuestions.length) {
            loadQuestion();
        } else {
            finishQuiz();
        }
    };

    document.getElementById('exit-btn').onclick = () => {
        if(confirm('Tem certeza que deseja sair? O progresso será perdido.')) {
            location.reload();
        }
    };

    document.getElementById('restart-btn').onclick = () => location.reload();

    function updateScoreUI() {
        document.getElementById('score-correct').textContent = score.correct;
        document.getElementById('score-wrong').textContent = score.wrong;
    }

    function finishQuiz() {
        quizSection.classList.add('hidden');
        statusBar.classList.add('hidden');
        resultSection.classList.remove('hidden');
        
        document.getElementById('final-score').textContent = score.correct;
        document.getElementById('final-mistakes').textContent = score.wrong;
        const total = score.correct + score.wrong;
        const percentage = total === 0 ? 0 : Math.round((score.correct / total) * 100);
        document.getElementById('final-percentage').textContent = `${percentage}%`;
    }
});