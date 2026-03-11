document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentQuestions = [];
    let currentIndex = 0;
    let score = { correct: 0, wrong: 0 };
    let manifestData = null;
    const questionsCache = {}; // Cache to store fetched questions
    
    // DOM Elements
    const hubSection = document.getElementById('hub-section');
    const quizSection = document.getElementById('quiz-section');
    const resultSection = document.getElementById('result-section');
    const statusBar = document.getElementById('status-bar');
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
        const bentoGrid = document.getElementById('bento-grid');
        bentoGrid.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        // 1. Add Hero Cards for General and Exam
        const examCard = document.createElement('div');
        examCard.className = 'bento-card hero-card span-2-cols exam-hero';
        examCard.innerHTML = `
            <div class="hero-content">
                <h3>Exame Completo</h3>
                <p>Simulação real com 50 questões sorteadas de todos os tópicos.</p>
                <button class="bento-action-btn">Iniciar Exame</button>
            </div>
        `;
        examCard.querySelector('button').onclick = () => startQuiz('exam', 50);
        fragment.appendChild(examCard);

        const generalCard = document.createElement('div');
        generalCard.className = 'bento-card hero-card general-hero';
        generalCard.innerHTML = `
            <div class="hero-content">
                <h3>Simulado Geral</h3>
                <p>Pratique com todas as questões disponíveis.</p>
                <button class="bento-action-btn">Iniciar Prática</button>
            </div>
        `;
        generalCard.querySelector('button').onclick = () => startQuiz('all');
        fragment.appendChild(generalCard);

        // 2. Add Topic Cards
        manifestData.main_topics.forEach(topic => {
            const topicCard = document.createElement('div');
            topicCard.className = 'bento-card topic-card';
            
            // If topic has many categories, span 2 columns
            if (topic.categories.length >= 4) {
                topicCard.classList.add('span-2-cols');
            }

            const topicTitle = document.createElement('h3');
            topicTitle.className = 'bento-title';
            topicTitle.textContent = topic.title;
            topicCard.appendChild(topicTitle);

            const pillsContainer = document.createElement('div');
            pillsContainer.className = 'pills-container';

            topic.categories.forEach(cat => {
                const pill = document.createElement('button');
                pill.className = 'category-pill';
                pill.innerHTML = `
                    <span class="pill-name">${cat.name}</span>
                    <span class="pill-count">${cat.count}</span>
                `;
                pill.onclick = () => startQuiz(cat.id);
                pillsContainer.appendChild(pill);
            });
            
            topicCard.appendChild(pillsContainer);
            fragment.appendChild(topicCard);
        });

        // Inject all elements at once
        bentoGrid.appendChild(fragment);

        // 3. Start prefetching questions in background
        setTimeout(prefetchQuestions, 1000);
    }

    async function prefetchQuestions() {
        if (!manifestData) return;
        
        const allCategories = manifestData.main_topics.flatMap(topic => topic.categories);
        
        for (const cat of allCategories) {
            if (!questionsCache[cat.id]) {
                try {
                    const response = await fetch(cat.file);
                    const data = await response.json();
                    questionsCache[cat.id] = data;
                } catch (err) {
                    console.error(`Error prefetching ${cat.id}:`, err);
                }
            }
        }
    }

    function showLoading(show) {
        if (show) loadingOverlay.classList.remove('hidden');
        else loadingOverlay.classList.add('hidden');
    }
    
    // --- QUIZ FUNCTIONS ---
    async function startQuiz(categoryId, questionCount = null) {
        showLoading(true);
        currentQuestions = [];

        try {
            // Smart exam generation has its own logic
            if (categoryId === 'exam') {
                currentQuestions = await generateSmartExam(questionCount);
            } else {
                let allAvailableQuestions = [];

                if (categoryId === 'all') {
                    // Flatten all categories from all main topics
                    const allCategories = manifestData.main_topics.flatMap(topic => topic.categories);
                    const promises = allCategories.map(async cat => {
                        if (questionsCache[cat.id]) {
                            return questionsCache[cat.id];
                        }
                        const response = await fetch(cat.file);
                        const data = await response.json();
                        questionsCache[cat.id] = data;
                        return data;
                    });
                    const results = await Promise.all(promises);
                    allAvailableQuestions = results.flat();
                } else {
                    if (questionsCache[categoryId]) {
                        allAvailableQuestions = [...questionsCache[categoryId]];
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
                            allAvailableQuestions = await response.json();
                            questionsCache[categoryId] = allAvailableQuestions;
                        }
                    }
                }

                // Shuffle all available questions
                allAvailableQuestions.sort(() => Math.random() - 0.5);

                // If a specific count is requested, slice the array
                if (questionCount) {
                    if (allAvailableQuestions.length < questionCount) {
                        alert(`Não há questões suficientes para um exame de ${questionCount} perguntas. O simulado começará com as ${allAvailableQuestions.length} questões disponíveis.`);
                        currentQuestions = allAvailableQuestions;
                    } else {
                        currentQuestions = allAvailableQuestions.slice(0, questionCount);
                    }
                } else {
                    currentQuestions = allAvailableQuestions;
                }
            }
            
            if (currentQuestions.length === 0) {
                alert('Nenhuma questão encontrada para esta categoria.');
                showLoading(false);
                return;
            }

            // Shuffle questions -- This is now done before slicing
            // currentQuestions.sort(() => Math.random() - 0.5);
            
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
        submitBtn.classList.remove('hidden');
        nextBtn.classList.add('hidden');
        questionContainer.innerHTML = '';
        questionContainer.className = ''; // Reset answered state

        // Render based on type
        if (q.type === 'no_return_series') {
            const scenario = document.createElement('div');
            scenario.className = 'scenario-box';
            scenario.innerHTML = `<strong>Cenário:</strong> ${formatText(q.content.scenario)}`;
            questionContainer.appendChild(scenario);
            
            const statement = document.createElement('p');
            statement.innerHTML = `<strong>Pergunta:</strong> ${formatText(q.content.statement)}`;
            questionContainer.appendChild(statement);
        } else if (q.type === 'case_study') {
            renderCaseStudyTabs(q); // Formatting is handled inside this function
            const statement = document.createElement('p');
            statement.innerHTML = `<strong>Pergunta:</strong> ${formatText(q.content.statement)}`;
            questionContainer.appendChild(statement);
        } else {
            const statement = document.createElement('p');
            statement.innerHTML = formatText(q.content.statement); // Use innerHTML for formatted code
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

    const examBlueprint = {
        totalQuestions: 50,
        domains: {
            "compute": {
                ids: ["app-service", "functions", "acr", "aci", "aca"],
                weight: 0.275 
            },
            "integration": {
                ids: ["service-bus", "event-grid", "event-hub", "api-management", "queue-storage"],
                weight: 0.225
            },
            "security": {
                ids: ["entra-id", "msal-graph-api", "key-vault", "managed-identities", "sas-token"],
                weight: 0.175
            },
            "storage": {
                ids: ["cosmos-db", "blob-storage"],
                weight: 0.175
            },
            "monitoring": {
                ids: ["app-insights", "cache-redis", "cdn", "app-configuration"],
                weight: 0.075
            },
            "case_study": {
                ids: ["casestudy"],
                weight: 0.075
            }
        }
    };

    async function generateSmartExam(totalQuestions = 50) {
        console.log("Starting smart exam generation...");
        let examQuestions = [];

        // --- 1. Fetch and select a Case Study ---
        let caseStudyBlock = [];
        if (questionsCache[examBlueprint.caseStudyId]) {
            caseStudyBlock = questionsCache[examBlueprint.caseStudyId];
        } else {
            const caseStudyCategory = manifestData.main_topics
                .flatMap(t => t.categories)
                .find(c => c.id === examBlueprint.caseStudyId);
            
            if(caseStudyCategory) {
                try {
                    const response = await fetch(caseStudyCategory.file);
                    const caseStudyData = await response.json();
                    questionsCache[examBlueprint.caseStudyId] = caseStudyData; // cache it
                    caseStudyBlock = caseStudyData;
                } catch (err) {
                    console.error(`Failed to load case study:`, err);
                }
            }
        }
        
        // Assuming the entire file is one case study block
        if (caseStudyBlock.length > 0) {
            examQuestions.push(...caseStudyBlock);
        }
        console.log(`Added ${caseStudyBlock.length} questions from case study.`);

        // --- 2. Calculate remaining questions for each domain ---
        const remainingQuestionsCount = totalQuestions - examQuestions.length;
        console.log(`Need to select ${remainingQuestionsCount} more questions.`);
        
        const questionsToSelectByDomain = {};
        const totalWeight = Object.values(examBlueprint.domains).reduce((sum, domain) => sum + domain.weight, 0);

        for (const [domainName, domainData] of Object.entries(examBlueprint.domains)) {
            const proportion = domainData.weight / totalWeight;
            questionsToSelectByDomain[domainName] = Math.round(proportion * remainingQuestionsCount);
        }
        
        let currentSelectionCount = Object.values(questionsToSelectByDomain).reduce((sum, count) => sum + count, 0);
        let diff = remainingQuestionsCount - currentSelectionCount;
        
        if (diff !== 0) {
            const largestDomain = Object.keys(questionsToSelectByDomain).reduce((a, b) => questionsToSelectByDomain[a] > questionsToSelectByDomain[b] ? a : b);
            questionsToSelectByDomain[largestDomain] += diff;
        }
        console.log("Questions to select per domain:", questionsToSelectByDomain);

        // --- 3. Fetch all questions and build pools for each domain ---
        const questionPools = {};
        const allCategoryIds = Object.values(examBlueprint.domains).flatMap(d => d.ids);
        
        for (const catId of allCategoryIds) {
            let questions = [];
            if (questionsCache[catId]) {
                questions = questionsCache[catId];
            } else {
                 const category = manifestData.main_topics
                    .flatMap(t => t.categories)
                    .find(c => c.id === catId);
                if(category) {
                    try {
                        const response = await fetch(category.file);
                        const data = await response.json();
                        questionsCache[catId] = data;
                        questions = data;
                    } catch (err) {
                         console.error(`Failed to load category ${catId}:`, err);
                    }
                }
            }
            
            for (const [domainName, domainData] of Object.entries(examBlueprint.domains)) {
                if (domainData.ids.includes(catId)) {
                    if (!questionPools[domainName]) {
                        questionPools[domainName] = [];
                    }
                    questionPools[domainName].push(...questions);
                    break;
                }
            }
        }

        // --- 4. Select questions from pools ---
        const domainQuestions = [];
        for (const [domainName, count] of Object.entries(questionsToSelectByDomain)) {
            const pool = questionPools[domainName] || [];
            if (pool.length > 0) {
                const shuffledPool = pool.sort(() => 0.5 - Math.random());
                const selected = shuffledPool.slice(0, count);
                domainQuestions.push(...selected);
            }
        }
        console.log(`Selected ${domainQuestions.length} questions from domains.`);

        // --- 5. Assemble final exam list ---
        const shuffledDomainQuestions = domainQuestions.sort(() => 0.5 - Math.random());
        examQuestions.push(...shuffledDomainQuestions);

        console.log(`Total exam questions assembled: ${examQuestions.length}`);
        return examQuestions;
    }

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
            pane.innerHTML = formatText(tab.content); // Apply formatting here
            tabContent.appendChild(pane);
        });

        tabsContainer.appendChild(tabHeader);
        tabsContainer.appendChild(tabContent);
        questionContainer.appendChild(tabsContainer);
    }

    function renderDropdownFillInBlank(q) {
        const container = document.createElement('div');
        container.className = 'dropdown-text-container';
        
        // Format code blocks and newlines first
        let textHtml = formatText(q.content.text);
        
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
    function handleDragStart(e) { e.target.classList.add('dragging'); }
    function handleDragEnd(e) { e.target.classList.remove('dragging'); }

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
            document.querySelectorAll('#target-col .draggable-item').forEach((item, index) => {
                // Check if the item at this position is the correct one
                if (q.correct_answer[index] === item.dataset.id) {
                    item.classList.add('correct');
                } else {
                    item.classList.add('wrong');
                }
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
            
            // The answer is correct only if the user's sequence exactly matches the correct answer sequence
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
        document.getElementById('explanation-text').innerHTML = formatText(q.explanation); // Apply formatting here
        
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

// --- HELPERS ---
    function formatText(text) {
        if (!text) return '';

        const codeBlockPlaceholder = '___CODE_BLOCK___';
        const codeBlocks = [];

        // 1. First, isolate and process the triple-backtick code blocks
        let processedText = text.replace(/```([\s\S]*?)```/g, (match, code) => {
            // Inside the code block, convert <br> back to \n and escape HTML
            const codeWithNewlines = code.replace(/<br\s*\/?>/gi, '\n');
            const escapedCode = codeWithNewlines.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            codeBlocks.push(`<pre class="code-block">${escapedCode.trim()}</pre>`);
            return codeBlockPlaceholder;
        });
        
        // 2. Now, process single-backtick inline code in the remaining text
        processedText = processedText.replace(/`([^`]+)`/g, (match, inlineCode) => {
            return `<code class="inline-code">${inlineCode}</code>`;
        });

        // 3. Re-insert the full code blocks
        codeBlocks.forEach(block => {
            processedText = processedText.replace(codeBlockPlaceholder, block);
        });

        return processedText;
    }

    function handleDragStart(e) { e.target.classList.add('dragging'); }
});