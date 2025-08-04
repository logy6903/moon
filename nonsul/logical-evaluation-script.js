document.addEventListener('DOMContentLoaded', function() {
    // ------------------- Content Area Elements -------------------
    const guidelinePracticeBtn = document.getElementById('guideline-practice-btn');
    const advancedPracticeBtn = document.getElementById('advanced-practice-btn');
    const guidelineContent = document.getElementById('guideline-practice-content');
    const advancedContent = document.getElementById('advanced-practice-content');

    // ------------------- Guideline Practice Elements -------------------
    const difficultyLabels = document.querySelectorAll('.difficulty-selector label');
    const checkboxes = document.querySelectorAll('#criteria-form input[type="checkbox"]');
    const generateBtn = document.getElementById('generate-btn');
    const promptDisplay = document.getElementById('prompt-display');
    const userEvaluationText = document.getElementById('user-evaluation-text');
    const showAnswerBtn = document.getElementById('show-answer-btn');
    const loadingSpinner = document.getElementById('loading-spinner');
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.querySelector('.close-btn');

    // ------------------- Right Panel Tab Elements -------------------
    const summaryTabBtn = document.getElementById('summary-tab-btn');
    const evaluationTabBtn = document.getElementById('evaluation-tab-btn');
    const summaryTabContent = document.getElementById('summary-tab-content');
    const evaluationTabContent = document.getElementById('evaluation-tab-content');
    const reasonsContainer = document.getElementById('reasons-container');
    const addReasonBtn = document.getElementById('add-reason-btn');
    const rightPanelInputs = document.querySelectorAll('.right-panel-input');

    // ------------------- Mode Toggling Logic -------------------
    guidelinePracticeBtn.addEventListener('click', () => {
        guidelineContent.style.display = 'grid';
        advancedContent.style.display = 'none';
        guidelinePracticeBtn.classList.add('active');
        advancedPracticeBtn.classList.remove('active');
    });

    advancedPracticeBtn.addEventListener('click', () => {
        guidelineContent.style.display = 'none';
        advancedContent.style.display = 'block';
        guidelinePracticeBtn.classList.remove('active');
        advancedPracticeBtn.classList.add('active');
    });

    // ------------------- Right Panel Tab Logic -------------------
    
    summaryTabBtn.addEventListener('click', () => {
        summaryTabBtn.classList.add('active');
        evaluationTabBtn.classList.remove('active');
        summaryTabContent.classList.add('active');
        evaluationTabContent.classList.remove('active');
    });

    evaluationTabBtn.addEventListener('click', () => {
        summaryTabBtn.classList.remove('active');
        evaluationTabBtn.classList.add('active');
        summaryTabContent.classList.remove('active');
        evaluationTabContent.classList.add('active');
    });

    // ------------------- Add Reason Logic -------------------
    addReasonBtn.addEventListener('click', () => {
        const reasonGroup = reasonsContainer.querySelector('.reason-group');
        const newReasonGroup = reasonGroup.cloneNode(true);
        
        // 새로 복제된 그룹의 내용 초기화
        newReasonGroup.querySelectorAll('textarea').forEach(textarea => textarea.value = '');
        newReasonGroup.querySelector('.basis-container').innerHTML = ''; // "근거의 근거" 컨테이너 비우기
        
        reasonsContainer.appendChild(newReasonGroup);
    });

    // 이벤트 위임: .reason-group 안의 .add-basis-btn 클릭 처리
    reasonsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('add-basis-btn')) {
            const button = event.target;
            const reasonGroup = button.closest('.reason-group');
            const basisContainer = reasonGroup.querySelector('.basis-container');
            
            const newInputGroup = document.createElement('div');
            newInputGroup.classList.add('input-group');

            const label = document.createElement('label');
            label.textContent = '근거의 근거는?';
            
            const textarea = document.createElement('textarea');
            textarea.classList.add('summary-input', 'right-panel-input');
            textarea.placeholder = '근거를 뒷받침하는 세부 근거를 입력하세요.';
            
            newInputGroup.appendChild(label);
            newInputGroup.appendChild(textarea);
            basisContainer.appendChild(newInputGroup);
        }
    });

    // ------------------- UI Interactivity -------------------

    // 평가 지침 선택 UI (버튼처럼 동작)
    const criteriaLabels = document.querySelectorAll('.criteria-grid label');
    criteriaLabels.forEach(label => {
        label.addEventListener('click', (event) => {
            const checkbox = label.querySelector('input[type="checkbox"]');
            const checkedCount = document.querySelectorAll('#criteria-form input:checked').length;
            // 체크 해제 시에는 개수 제한 없이 허용
            if (!checkbox.checked) {
                if (checkedCount >= 3) {
                    // 4번째 클릭 시 아무 반응도 하지 않음 (체크박스 상태 변경 막기)
                    event.preventDefault();
                    return;
                }
            }
            // 실제 체크박스 상태 변경 후에 selected 클래스 토글
            setTimeout(() => {
                label.classList.toggle('selected', checkbox.checked);
            }, 0);
        });
    });

    // 난이도 선택 UI
    difficultyLabels.forEach(label => {
        label.addEventListener('click', () => {
            difficultyLabels.forEach(l => l.classList.remove('selected'));
            label.classList.add('selected');
        });
    });

    // ------------------- API Call and Data Handling -------------------

    let currentAnalysis = null; // 모범 답안 데이터 저장

    generateBtn.addEventListener('click', async () => {
        const selectedCriteria = Array.from(document.querySelectorAll('#criteria-form input:checked')).map(cb => {
            // "애매모호해?" 선택 시 애매함과 모호함을 번갈아 처리
            if (cb.value === '애매모호해?') {
                return Math.random() < 0.5 ? '애매함' : '모호함';
            }
            return cb.value;
        });
        if (selectedCriteria.length === 0) {
            alert('평가 지침을 1개 이상 선택해주세요.');
            return;
        }

        const selectedDifficulty = document.querySelector('.difficulty-selector input:checked').value;

        showLoading(true);
        promptDisplay.innerHTML = '';
        
        // 오른쪽 패널 전체 초기화
        rightPanelInputs.forEach(input => {
            input.value = '';
            input.disabled = true;
        });
        
        // 동적으로 추가된 reason-group 제거
        const initialReasonGroup = reasonsContainer.querySelector('.reason-group');
        reasonsContainer.innerHTML = '';
        reasonsContainer.appendChild(initialReasonGroup);
        initialReasonGroup.querySelector('.basis-container').innerHTML = '';
        initialReasonGroup.querySelectorAll('textarea').forEach(ta => ta.value = '');

        document.querySelectorAll('.add-basis-btn').forEach(btn => btn.disabled = true);
        addReasonBtn.disabled = true;
        addEvaluationBtn.disabled = true;
        showAnswerBtn.disabled = true;
        currentAnalysis = null;

        try {
            const response = await fetch('/api/generate-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ criteria: selectedCriteria, difficulty: selectedDifficulty })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '서버에서 오류가 발생했습니다.');
            }

            const data = await response.json();
            console.log('[제시문 생성] 서버 응답 데이터:', data);
            console.log('[제시문 생성] analysis.reason:', data.analysis?.reason);
            console.log('[제시문 생성] analysis.evaluations:', data.analysis?.evaluations);
            promptDisplay.innerHTML = `<p>${cleanClientText(data.prompt)}</p>`;
            // 제시문 텍스트도 함께 저장
            currentAnalysis = {
                ...data.analysis,
                promptText: data.prompt,
                selectedCriteria: selectedCriteria
            };
            
            rightPanelInputs.forEach(input => input.disabled = false);
            // mainGuidelineSelect 제거됨
            document.querySelectorAll('.add-basis-btn').forEach(btn => btn.disabled = false);
            addReasonBtn.disabled = false;
            addEvaluationBtn.disabled = false;
            showAnswerBtn.disabled = false;

        } catch (error) {
            console.error('Error:', error);
            promptDisplay.innerHTML = `<p class="error">오류가 발생했습니다: ${error.message}</p>`;
        } finally {
            showLoading(false);
        }
    });

    // ------------------- Modal (Popup) Logic -------------------

    showAnswerBtn.addEventListener('click', () => {
        if (currentAnalysis) {
            displayAnalysis(currentAnalysis);
            modal.style.display = 'block';
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    // ------------------- Helper Functions -------------------

    function showLoading(isLoading) {
        loadingSpinner.style.display = isLoading ? 'flex' : 'none';
    }

    // 클라이언트에서 텍스트 정리 함수
    function cleanClientText(text) {
        if (!text) return text;
        
        return text
            // 모든 종류의 따옴표 제거 (영문, 한글, 중국어 따옴표 포함)
            .replace(/["'"'"'""「」『』]/g, '')
            // 불필요한 기호들 제거
            .replace(/[‚„‛‟]/g, '')
            // 연속된 문장부호 정리
            .replace(/[,]{2,}/g, ',')
            .replace(/[.]{2,}/g, '.')
            .replace(/[!]{2,}/g, '!')
            .replace(/[?]{2,}/g, '?')
            // 불필요한 공백 정리
            .replace(/[\t\n\r]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // 제시문에서 실제 근거 문장을 추출하는 함수
    function extractReasonFromText(promptText) {
        if (!promptText) return null;
        
        // HTML 태그 제거 및 불필요한 문장부호 정리
        const cleanText = cleanClientText(promptText.replace(/<[^>]*>/g, ''));
        
        // 문장을 나누어 분석 (더 정교한 문장 분리)
        const sentences = cleanText.split(/[.!?](?=\s|$)/).map(s => s.trim()).filter(s => s.length > 5);
        
        // 논리적 연결어들
        const reasonIndicators = ['왜냐하면', '때문에', '따라서', '그러므로', '또한', '더불어', '더욱이', '뿐만 아니라', '게다가', '예를 들어'];
        const conclusionIndicators = ['따라서', '그러므로', '결국', '결론적으로', '이에 따라'];
        
        const extracted = {
            claim: '',
            explicitReasons: []
        };
        
        // 결론 지시어가 있는 문장을 찾아 주장으로 설정
        let claimSentence = '';
        for (let i = sentences.length - 1; i >= 0; i--) {
            const sentence = sentences[i];
            if (conclusionIndicators.some(indicator => sentence.includes(indicator))) {
                claimSentence = sentence + '.';
                sentences.splice(i, 1); // 해당 문장을 배열에서 제거
                break;
            }
        }
        
        // 결론 지시어가 없으면 마지막 문장을 주장으로 설정
        if (!claimSentence && sentences.length > 0) {
            claimSentence = sentences.pop() + '.';
        }
        
        extracted.claim = claimSentence;
        
        // 나머지 문장들을 근거로 처리
        sentences.forEach((sentence, index) => {
            if (sentence.length > 10) { // 너무 짧은 문장 제외
                // 근거 지시어가 있는지 확인
                const hasReasonIndicator = reasonIndicators.some(indicator => sentence.includes(indicator));
                
                // 문장을 더 자연스럽게 표현
                let reasonText = sentence;
                if (!reasonText.endsWith('.')) {
                    reasonText += '.';
                }
                
                // 근거 지시어가 있으면 강조 표시
                const prefix = hasReasonIndicator ? '🔗 ' : '';
                extracted.explicitReasons.push(`${prefix}근거${index + 1}: ${reasonText}`);
            }
        });
        
        return extracted;
    }



    function displayAnalysis(analysis) {
        // 디버깅을 위한 로그 추가
        console.log('[모범답안 표시] analysis 객체:', analysis);
        console.log('[모범답안 표시] reason:', analysis.reason);
        console.log('[모범답안 표시] evaluations:', analysis.evaluations);
        console.log('[모범답안 표시] evaluations 개수:', analysis.evaluations ? analysis.evaluations.length : 'undefined');
        
        modalBody.innerHTML = ''; // Clear previous content
        
        // 선택된 지침들 표시 (심화 연습용)
        if (analysis.selectedGuidelines && analysis.selectedGuidelines.length > 0) {
            const guidelinesDiv = document.createElement('div');
            guidelinesDiv.classList.add('analysis-item');
            
            const guidelineCount = analysis.selectedGuidelines.length;
            const isMultiple = guidelineCount > 1;
            
            // 애매함/모호함 구분 표시
            const displayGuidelines = analysis.selectedGuidelines.map(guideline => {
                if (guideline === '애매함') {
                    return '애매함 (Ambiguity) - 여러 의미로 해석 가능';
                } else if (guideline === '모호함') {
                    return '모호함 (Vagueness) - 경계나 정도가 불분명';
                }
                return guideline;
            });
            
            guidelinesDiv.innerHTML = `
                <h3>🎯 위반한 평가 지침 ${isMultiple ? `(${guidelineCount}개 복합 위반)` : ''}</h3>
                <div style="background: #fff3cd; padding: 1rem; border-radius: 6px; border-left: 4px solid #ffc107;">
                    ${isMultiple ? 
                        `<p style="margin: 0 0 0.8rem 0; color: #856404; font-weight: 500;">⚠️ 복수 지침을 동시에 위반하는 복합적 문제입니다:</p>` : 
                        ''
                    }
                    <ul style="margin: 0; padding-left: 20px; color: #856404;">
                        ${displayGuidelines.map((guideline, index) => 
                            `<li style="margin: 0.5rem 0;">
                                <strong style="color: #d63031;">${index + 1}. ${guideline}</strong>
                            </li>`
                        ).join('')}
                    </ul>
                </div>
            `;
            modalBody.appendChild(guidelinesDiv);
        }

        // 1. 주장 및 근거 표시 (개조식 구조)
        const argumentDiv = document.createElement('div');
        argumentDiv.classList.add('analysis-item');

        let claimHtml = `
            <h3>📋 주장 및 근거</h3>
            <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #4a67e8;">
                <div style="margin-bottom: 1rem;">
                    <strong style="color: #2c3e50; font-size: 1.1rem;">💡 주장(결론):</strong><br>
                    <span style="margin-left: 1rem; line-height: 1.6;">${analysis.claim}</span>
                </div>
        `;

        // 제시문에서 실제 근거를 추출
        const extractedData = analysis.promptText ? extractReasonFromText(analysis.promptText) : null;

        claimHtml += `
            <div style="margin-top: 1rem;">
                <strong style="color: #2c3e50; font-size: 1.1rem;">📝 근거(이유):</strong>
                <div style="margin: 0.5rem 0 0 1rem; padding-left: 1rem; background: #f7f8fc; padding: 1rem; border-radius: 6px; border-left: 3px solid #4a67e8;">
        `;

        if (extractedData && extractedData.explicitReasons.length > 0) {
            // 제시문에서 추출한 실제 근거들 표시
            claimHtml += `
                <div style="margin-bottom: 1.5rem;">
                    <strong style="color: #1976d2; font-size: 1rem; margin-bottom: 0.5rem; display: block;">🔍 제시문에 명시된 근거들:</strong>
                </div>
            `;
            
            extractedData.explicitReasons.forEach((reason, index) => {
                claimHtml += `
                    <div style="margin: 0.8rem 0 0.5rem 1rem; line-height: 1.6; color: #333; background: #f1f8e9; padding: 0.8rem; border-left: 4px solid #4caf50; border-radius: 6px; position: relative;">
                        <div style="position: absolute; left: -1.5rem; top: 0.8rem; width: 8px; height: 8px; background: #4caf50; border-radius: 50%;"></div>
                        <strong style="color: #2e7d32; font-size: 0.95rem;">${reason}</strong>
                    </div>
                `;
            });
        }



        // 기존 서버 제공 근거가 있다면 표시
        if (analysis.reason && analysis.reason.trim() && extractedData) {
            claimHtml += `
                <div style="margin: 1.5rem 0 1rem 0; padding-top: 1rem; border-top: 1px solid #e0e0e0;">
                    <details style="cursor: pointer;">
                        <summary style="color: #666; font-size: 0.9rem; margin-bottom: 0.5rem;">📋 논증 구조</summary>
                        <div style="background: #f5f5f5; padding: 0.8rem; border-radius: 4px; margin-top: 0.5rem; font-size: 0.85rem; color: #555;">
                            ${analysis.reason.replace(/\n/g, '<br>')}
                        </div>
                    </details>
                </div>
            `;
        }

        claimHtml += `
                </div>
            </div>
        `;

        claimHtml += `</div>`;
        argumentDiv.innerHTML = claimHtml;
        modalBody.appendChild(argumentDiv);

        // 2. 위반 분석 표시 (두 가지 구조 지원)
        // 평가 지침 연습: analysis.evaluations 배열, 심화 연습: 직접 필드
        const hasEvaluations = analysis.evaluations && analysis.evaluations.length > 0;
        const hasDirectFields = analysis.problematic_part || analysis.violation_reason || analysis.improvement_suggestion;
        
        console.log('[디버깅] hasEvaluations:', hasEvaluations);
        console.log('[디버깅] hasDirectFields:', hasDirectFields);
        console.log('[디버깅] analysis.evaluations:', analysis.evaluations);
        
        // 지침 라벨을 제거하는 함수
        function removeGuidelineLabel(text) {
            if (!text) return text;
            
            const guidelines = [
                '거짓은 없어\\?',
                '애매모호해\\?',
                '모호함',
                '애매함',
                '논리적으로 타당해\\?',
                '충분히 뒷받침돼\\?',
                '편향은 없어\\?',
                '관련성이 있어\\?',
                '적절한 근거야\\?',
                '일관성이 있어\\?',
                '쟁점에 맞아\\?'
            ];
            
            let cleanedText = text;
            guidelines.forEach(guideline => {
                const regex = new RegExp(`^${guideline}\\s*`, 'g');
                cleanedText = cleanedText.replace(regex, '');
            });
            
            return cleanedText.trim();
        }

        if (hasEvaluations) {
            // 평가 지침 연습 모드: 모든 evaluations 표시
            console.log('[디버깅] evaluations 루프 시작. 개수:', analysis.evaluations.length);
            analysis.evaluations.forEach((evaluation, index) => {
                console.log(`[디버깅] evaluation ${index + 1}:`, evaluation);
                const analysisDiv = document.createElement('div');
                analysisDiv.classList.add('analysis-item');
                analysisDiv.innerHTML = `
                    <h3>🎯 위반 분석 ${analysis.evaluations.length > 1 ? `${index + 1}` : ''}: ${evaluation.criteria}</h3>
                    <div style="background: #fff3cd; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #ffc107; margin-top: 1rem;">
                        
                        ${evaluation.problematicPart ? `
                            <div style="margin-bottom: 1rem;">
                                <strong style="color: #721c24; font-size: 1.1rem;">❌ 문제되는 부분:</strong><br>
                                <div style="margin-left: 1rem; padding: 0.8rem; background: #f8d7da; border-radius: 4px; margin-top: 0.5rem; line-height: 1.6;">
                                    ${removeGuidelineLabel(evaluation.problematicPart).replace(/\n/g, '<br>')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${evaluation.violationReason ? `
                            <div style="margin-bottom: 1rem;">
                                <strong style="color: #721c24; font-size: 1.1rem;">🔍 위반 이유:</strong><br>
                                <div style="margin-left: 1rem; padding: 0.8rem; background: #fff3cd; border-radius: 4px; margin-top: 0.5rem; line-height: 1.6; color: #555;">
                                    ${evaluation.violationReason.replace(/\n/g, '<br>')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div>
                            <strong style="color: #155724; font-size: 1.1rem;">💡 개선 예시:</strong><br>
                            <div style="margin-left: 1rem; margin-top: 0.5rem;">
                                <textarea id="user-improvement-input-${index}" 
                                    style="width: 100%; min-height: 100px; padding: 0.8rem; border: 2px solid #28a745; border-radius: 4px; font-family: inherit; line-height: 1.6; resize: vertical; font-size: 14px;"
                                    placeholder="지침에 위반되지 않는 글을 작성해보세요"></textarea>
                                <button id="show-model-improvement-${index}" 
                                    style="margin-top: 0.8rem; padding: 0.6rem 1.2rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500;">
                                    확인
                                </button>
                                <div id="model-improvement-section-${index}" style="display: none; margin-top: 1rem; padding: 0.8rem; background: #d4edda; border-radius: 4px; line-height: 1.6; color: #155724; border-left: 4px solid #28a745;">
                                    <strong>📋 개선 예시:</strong><br>
                                    <div id="generated-example-text-${index}"></div>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                `;
                console.log(`[디버깅] evaluation ${index + 1} HTML 생성 완료`);
                modalBody.appendChild(analysisDiv);
                console.log(`[디버깅] evaluation ${index + 1} DOM에 추가 완료`);
                
                // 개선 예시 생성 버튼 이벤트 추가 (각 evaluation마다 별도)
                const showModelBtn = document.getElementById(`show-model-improvement-${index}`);
                if (showModelBtn) {
                    showModelBtn.addEventListener('click', () => {
                        const userInput = document.getElementById(`user-improvement-input-${index}`);
                        const modelSection = document.getElementById(`model-improvement-section-${index}`);
                        const generatedExampleText = document.getElementById(`generated-example-text-${index}`);
                    
                        // 실제 제시문의 개선된 버전 생성
                        function generateImprovedText(originalText, problematicPart, improvementSuggestion) {
                            if (!originalText || !problematicPart) {
                                return "개선된 제시문을 생성할 수 없습니다. 원본 제시문이나 문제 부분이 명확하지 않습니다.";
                            }
                            
                            // 문제가 되는 부분을 찾아서 제거하거나 수정
                            let improvedText = originalText;
                            
                            // 따옴표 제거하여 정확한 매칭
                            const cleanProblematicPart = problematicPart.replace(/[""''\"\']/g, '').trim();
                            
                            // 문제 부분 제거 또는 개선 방안 적용
                            if (improvedText.includes(cleanProblematicPart)) {
                                // 개선 방안이 있으면 해당 내용으로 교체
                                if (improvementSuggestion && improvementSuggestion.includes('예를 들어')) {
                                    const suggestionMatch = improvementSuggestion.match(/"([^"]+)"/);
                                    if (suggestionMatch) {
                                        improvedText = improvedText.replace(cleanProblematicPart, suggestionMatch[1]);
                                    } else {
                                        // 문제 부분을 더 구체적인 표현으로 수정
                                        if (evaluation.criteria === '애매함' || evaluation.criteria === '모호함') {
                                            improvedText = improvedText.replace(cleanProblematicPart, 
                                                cleanProblematicPart.replace(/안정적이고 지속 가능한/g, '연중 일정한 전력 생산이 가능하고 온실가스 배출이 없는')
                                                .replace(/효율적이고 경제적인/g, '초기 투자비 회수기간 5년 이내의 경제적인')
                                                .replace(/많은 사람/g, '설문 응답자의 78%')
                                                .replace(/상당한 효과/g, '25% 이상의 개선 효과'));
                                        }
                                    }
                                } else {
                                    // 문제 부분을 제거하고 더 적절한 내용으로 교체
                                    const sentences = improvedText.split('. ');
                                    const filteredSentences = sentences.filter(sentence => 
                                        !sentence.includes(cleanProblematicPart.split('.')[0]));
                                    
                                    if (filteredSentences.length < sentences.length) {
                                        // 문제 문장이 제거되었으면 적절한 대체 문장 추가
                                        if (evaluation.criteria.includes('거짓')) {
                                            filteredSentences.push('구체적인 데이터와 신뢰할 수 있는 출처를 바탕으로 한 근거가 필요합니다');
                                        } else if (evaluation.criteria.includes('뒷받침')) {
                                            filteredSentences.push('다양한 연구 결과와 실증 데이터를 종합적으로 검토한 결과입니다');
                                        }
                                        improvedText = filteredSentences.join('. ');
                                    }
                                }
                            }
                            
                            return improvedText;
                        }
                        
                        const originalText = analysis.promptText || '';
                        const improvedExample = generateImprovedText(originalText, evaluation.problematicPart, evaluation.improvementSuggestion);
                    
                        // 사용자 입력을 읽기 전용으로 변경
                        userInput.disabled = true;
                        userInput.style.background = '#f8f9fa';
                        userInput.style.borderColor = '#6c757d';
                        
                        // 생성된 개선 예시 텍스트 표시
                        generatedExampleText.innerHTML = cleanClientText(improvedExample);
                        modelSection.style.display = 'block';
                    
                    // 버튼 비활성화 및 텍스트 변경
                    showModelBtn.disabled = true;
                    showModelBtn.style.background = '#6c757d';
                    showModelBtn.textContent = '예시 확인 완료';
                    
                        // 사용자 입력 위에 라벨 추가
                        if (!document.getElementById(`user-answer-label-${index}`)) {
                            const userLabel = document.createElement('div');
                            userLabel.id = `user-answer-label-${index}`;
                            userLabel.innerHTML = '<strong style="color: #495057;">✏️ 내가 작성한 답안:</strong>';
                            userLabel.style.marginBottom = '0.5rem';
                            userInput.parentNode.insertBefore(userLabel, userInput);
                        }
                        });
                }
            });
            console.log('[디버깅] 모든 evaluations 처리 완료');
        } else if (hasDirectFields) {
            // 심화 연습 모드: 직접 필드 사용
            const analysisDiv = document.createElement('div');
            analysisDiv.classList.add('analysis-item');
            analysisDiv.innerHTML = `
                <h3>🎯 위반 분석</h3>
                <div style="background: #fff3cd; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #ffc107; margin-top: 1rem;">
                    
                    ${analysis.problematic_part ? `
                        <div style="margin-bottom: 1rem;">
                            <strong style="color: #721c24; font-size: 1.1rem;">❌ 문제되는 부분:</strong><br>
                            <div style="margin-left: 1rem; padding: 0.8rem; background: #f8d7da; border-radius: 4px; margin-top: 0.5rem; line-height: 1.6;">
                                ${removeGuidelineLabel(analysis.problematic_part).replace(/\n/g, '<br>')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${analysis.violation_reason ? `
                        <div style="margin-bottom: 1rem;">
                            <strong style="color: #721c24; font-size: 1.1rem;">🔍 위반 이유:</strong><br>
                            <div style="margin-left: 1rem; padding: 0.8rem; background: #fff3cd; border-radius: 4px; margin-top: 0.5rem; line-height: 1.6; color: #555;">
                                ${analysis.violation_reason.replace(/\n/g, '<br>')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div>
                        <strong style="color: #155724; font-size: 1.1rem;">💡 개선 예시:</strong><br>
                        <div style="margin-left: 1rem; margin-top: 0.5rem;">
                            <textarea id="user-improvement-input-single" 
                                style="width: 100%; min-height: 100px; padding: 0.8rem; border: 2px solid #28a745; border-radius: 4px; font-family: inherit; line-height: 1.6; resize: vertical; font-size: 14px;"
                                placeholder="지침에 위반되지 않는 글을 작성해보세요"></textarea>
                            <button id="show-model-improvement-single" 
                                style="margin-top: 0.8rem; padding: 0.6rem 1.2rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500;">
                                확인
                            </button>
                            <div id="model-improvement-section-single" style="display: none; margin-top: 1rem; padding: 0.8rem; background: #d4edda; border-radius: 4px; line-height: 1.6; color: #155724; border-left: 4px solid #28a745;">
                                <strong>📋 개선 예시:</strong><br>
                                <div id="generated-example-text-single"></div>
                            </div>
                        </div>
                    </div>
                    
                </div>
            `;
            modalBody.appendChild(analysisDiv);
            
            // 심화 연습 모드 이벤트 처리
            const showModelBtn = document.getElementById('show-model-improvement-single');
            if (showModelBtn) {
                showModelBtn.addEventListener('click', () => {
                    const userInput = document.getElementById('user-improvement-input-single');
                    const modelSection = document.getElementById('model-improvement-section-single');
                    const generatedExampleText = document.getElementById('generated-example-text-single');
                    
                    // 실제 제시문의 개선된 버전 생성
                    function generateImprovedTextSingle(originalText, problematicPart, improvementSuggestion) {
                        if (!originalText || !problematicPart) {
                            return "개선된 제시문을 생성할 수 없습니다. 원본 제시문이나 문제 부분이 명확하지 않습니다.";
                        }
                        
                        let improvedText = originalText;
                        const cleanProblematicPart = problematicPart.replace(/[""''\"\']/g, '').trim();
                        
                        if (improvedText.includes(cleanProblematicPart)) {
                            // 문제 부분을 개선된 내용으로 교체
                            improvedText = improvedText.replace(cleanProblematicPart, 
                                cleanProblematicPart.replace(/안정적이고 지속 가능한/g, '연중 일정한 전력 생산이 가능하고 온실가스 배출이 없는')
                                .replace(/효율적이고 경제적인/g, '초기 투자비 회수기간 5년 이내의 경제적인')
                                .replace(/많은 사람/g, '설문 응답자의 78%')
                                .replace(/상당한 효과/g, '25% 이상의 개선 효과')
                                .replace(/크기가 작고 속도가 느려 사고 시 피해가 크지 않다/g, '자율비행 기술과 안전장치로 인해 사고 위험성이 현저히 낮다'));
                        }
                        
                        return improvedText;
                    }
                    
                    const originalText = analysis.promptText || '';
                    const improvedExample = generateImprovedTextSingle(originalText, analysis.problematic_part, analysis.improvement_suggestion);
                    
                    userInput.disabled = true;
                    userInput.style.background = '#f8f9fa';
                    userInput.style.borderColor = '#6c757d';
                    
                    generatedExampleText.innerHTML = cleanClientText(improvedExample);
                    modelSection.style.display = 'block';
                    
                    showModelBtn.disabled = true;
                    showModelBtn.style.background = '#6c757d';
                    showModelBtn.textContent = '예시 확인 완료';
                    
                    if (!document.getElementById('user-answer-label-single')) {
                        const userLabel = document.createElement('div');
                        userLabel.id = 'user-answer-label-single';
                        userLabel.innerHTML = '<strong style="color: #495057;">✏️ 내가 작성한 답안:</strong>';
                        userLabel.style.marginBottom = '0.5rem';
                        userInput.parentNode.insertBefore(userLabel, userInput);
                    }
                });
            }
        }
    }

    // ------------------- Modal Drag Functionality -------------------
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    const modalContent = document.querySelector('.modal-content');
    const modalHeader = document.querySelector('.modal-header');

    modalHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        modalContent.classList.add('dragging');
        
        // 현재 모달의 위치를 계산
        const rect = modalContent.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        
        // 마우스 커서 변경
        document.body.style.cursor = 'move';
        
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        // 새로운 위치 계산
        let newLeft = e.clientX - dragOffsetX;
        let newTop = e.clientY - dragOffsetY;
        
        // 화면 경계 확인
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        const modalRect = modalContent.getBoundingClientRect();
        
        // 최소/최대 위치 제한
        newLeft = Math.max(0, Math.min(newLeft, viewport.width - modalRect.width));
        newTop = Math.max(0, Math.min(newTop, viewport.height - modalRect.height));
        
        // 위치 적용 (transform 대신 left, top 사용)
        modalContent.style.left = newLeft + 'px';
        modalContent.style.top = newTop + 'px';
        modalContent.style.transform = 'none';
        
        e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            modalContent.classList.remove('dragging');
            document.body.style.cursor = 'default';
        }
    });

    // 모달이 열릴 때 초기 위치로 리셋
    const originalShowAnswerBtn = showAnswerBtn;
    showAnswerBtn.addEventListener('click', () => {
        // 모달 위치 초기화
        modalContent.style.left = '50%';
        modalContent.style.top = '10%';
        modalContent.style.transform = 'translateX(-50%)';
    });

    // ------------------- Evaluation Add Logic (평가 지침 연습) -------------------
    const addEvaluationBtn = document.getElementById('add-evaluation-btn');
    const evaluationsContainer = document.getElementById('evaluations-container');
    // mainGuidelineSelect 제거됨

    // 메인 드롭다운 제거됨으로 인한 관련 코드 제거
    
    // 첫 번째 평가 항목의 드롭다운 변경 시 플레이스홀더 업데이트
    evaluationsContainer.addEventListener('change', (event) => {
        if (event.target.classList.contains('guideline-select-small')) {
            const evaluationItem = event.target.closest('.evaluation-item');
            const problemTextarea = evaluationItem.querySelector('.problematic-part-input');
            const reasonTextarea = evaluationItem.querySelector('.violation-reason-input');
            
            if (event.target.value) {
                problemTextarea.placeholder = `${event.target.value} 지침을 위반하는 부분을 입력하세요.`;
                reasonTextarea.placeholder = `${event.target.value} 지침을 위반한 이유를 설명하세요.`;
            } else {
                problemTextarea.placeholder = '제시문에서 논리적 오류나 문제가 있는 부분을 입력하세요.';
                reasonTextarea.placeholder = '왜 문제가 되는지 그 이유를 설명하세요.';
            }
        }
    });

    addEvaluationBtn.addEventListener('click', () => {
        const evaluationItem = evaluationsContainer.querySelector('.evaluation-item');
        const newEvaluationItem = evaluationItem.cloneNode(true);
        
        // 새로 복제된 평가 항목의 내용 초기화
        newEvaluationItem.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
        newEvaluationItem.querySelectorAll('textarea').forEach(textarea => {
            textarea.value = '';
            // 기본 플레이스홀더로 설정
            if (textarea.classList.contains('problematic-part-input')) {
                textarea.placeholder = '제시문에서 논리적 오류나 문제가 있는 부분을 입력하세요.';
            } else if (textarea.classList.contains('violation-reason-input')) {
                textarea.placeholder = '왜 문제가 되는지 그 이유를 설명하세요.';
            }
        });
        
        evaluationsContainer.appendChild(newEvaluationItem);
    });

    // ------------------- Advanced Practice Elements -------------------
    const advancedDifficultyLabels = document.querySelectorAll('#advanced-difficulty-form label');
    const advancedGenerateBtn = document.getElementById('advanced-generate-btn');
    const advancedPromptDisplay = document.getElementById('advanced-prompt-display');
    const advancedShowAnswerBtn = document.getElementById('advanced-show-answer-btn');

    // Advanced Practice Tab Elements
    const advancedSummaryTabBtn = document.getElementById('advanced-summary-tab-btn');
    const advancedEvaluationTabBtn = document.getElementById('advanced-evaluation-tab-btn');
    const advancedSummaryTabContent = document.getElementById('advanced-summary-tab-content');
    const advancedEvaluationTabContent = document.getElementById('advanced-evaluation-tab-content');
    const advancedReasonsContainer = document.getElementById('advanced-reasons-container');
    const advancedAddReasonBtn = document.getElementById('advanced-add-reason-btn');

    // Advanced Practice Evaluation Elements
    const advancedAddEvaluationBtn = document.getElementById('advanced-add-evaluation-btn');
    const advancedEvaluationsContainer = document.getElementById('advanced-evaluations-container');

    // ------------------- Advanced Practice Tab Logic -------------------
    // advancedGuidelineSelectorWrapper 제거됨
    
    advancedSummaryTabBtn.addEventListener('click', () => {
        advancedSummaryTabBtn.classList.add('active');
        advancedEvaluationTabBtn.classList.remove('active');
        advancedSummaryTabContent.classList.add('active');
        advancedEvaluationTabContent.classList.remove('active');
        // 드롭다운 숨기기
        // 드롭다운 숨기기 제거됨
    });

    advancedEvaluationTabBtn.addEventListener('click', () => {
        advancedSummaryTabBtn.classList.remove('active');
        advancedEvaluationTabBtn.classList.add('active');
        advancedSummaryTabContent.classList.remove('active');
        advancedEvaluationTabContent.classList.add('active');
        // 드롭다운 보이기 제거됨
    });

    // ------------------- Advanced Practice Difficulty Selection -------------------
    advancedDifficultyLabels.forEach(label => {
        label.addEventListener('click', (event) => {
            event.preventDefault();
            
            // 모든 라벨에서 'selected' 클래스 제거
            advancedDifficultyLabels.forEach(l => l.classList.remove('selected'));
            
            // 클릭된 라벨에 'selected' 클래스 추가
            label.classList.add('selected');
            
            // 해당 라디오 버튼 체크
            const radio = label.querySelector('input[type="radio"]');
            radio.checked = true;
        });
    });

    // ------------------- 복수 지침 통합 처리 함수 -------------------
    function generateMultiGuidelinePrompt(selectedTopic, selectedGuidelines, difficulty) {
        // 서버에서 정의된 9개 지침별 문제 요소 정의 (평가 지침 연습 모듈과 동일)
        const guidelineElements = {
            '애매함': {
                phrases: ['공정한 경쟁을 통해 발전해야 합니다', '인간적인 대우가 필요합니다', '성공적인 정책이라고 평가받고 있습니다'],
                problems: '"공정한", "인간적인", "성공적인"',
                violation: '"공정한 경쟁"에서 "공정한"이 법적으로 허용된 경쟁을 의미하는지, 도덕적으로 올바른 경쟁을 의미하는지 불분명합니다. "인간적인 대우"도 최소한의 권리 보장을 의미하는지, 호화로운 삶을 의미하는지 여러 가지로 해석될 수 있습니다. "성공적인 정책"도 경제적 성과를 의미하는지, 사회적 만족도를 의미하는지 맥락에 따라 다르게 해석 가능합니다.',
                improvement: '다의적 용어를 구체적 의미로 명시 ("공정한" → "법적 규정을 준수한", "인간적인" → "기본 인권을 보장하는", "성공적인" → "목표 달성률 85% 이상의"), 맥락에 따라 해석이 달라질 수 있는 용어를 정확한 기준으로 대체'
            },
            '모호함': {
                phrases: ['상당한 효과가 있었다고 합니다', '많은 사람들이 지지하고 있습니다', '오래된 시설이므로 교체가 필요합니다'],
                problems: '"상당한", "많은", "오래된"',
                violation: '"상당한 효과"에서 어느 정도부터 "상당한" 범주에 속하는지 경계가 불분명합니다. "많은 사람들"도 정확히 몇 명부터 "많은" 것인지 기준이 없습니다. "오래된 시설"도 몇 년이 지나야 "오래된" 것으로 분류되는지 경계가 명확하지 않아, 이러한 모호한 기준으로는 객관적 판단이 어렵습니다.',
                improvement: '모호한 정도 표현을 명확한 수치로 교체 ("상당한" → "30% 이상의", "많은" → "전체의 70%에 해당하는", "오래된" → "건설된 지 30년 이상된"), 경계가 불분명한 용어를 구체적 기준으로 대체'
            },
            '거짓은 없어?': {
                phrases: ['연구에 따르면 98%의 성공률을 기록했다고 합니다', '이는 전 세계적으로 인정받는 수치입니다', '노벨상 수상자 10명이 모두 이 정책을 지지한다고 발표했습니다'],
                problems: '"98%의 성공률", "전 세계적으로 인정받는", "노벨상 수상자 10명이 지지"',
                violation: '"98%의 성공률"이라는 구체적 수치를 제시했지만 출처나 조사 방법, 표본 크기 등이 명시되지 않아 사실 여부를 확인할 수 없습니다. "노벨상 수상자 10명이 모두 지지한다"는 확인 불가능한 허위 정보로, 실제로는 해당 분야 노벨상 수상자들의 공식 입장 발표가 없었습니다. 이는 독자를 의도적으로 오도하는 명백한 거짓 정보입니다.',
                improvement: '정확한 출처 명시 ("연구에 따르면" → "2023년 한국교육개발원 보고서에 따르면"), 구체적인 조사 정보 제공 (표본 크기, 기간, 방법), 확인 가능한 공식 자료 인용, 확실하게 거짓인 정보 제거 ("노벨상 수상자 10명이 지지" → 실제 존재하는 전문가 의견으로 대체), 사실 확인이 어려운 주장은 신중하게 표현 ("확인된 바에 따르면", "공식 발표에 의하면" 등)'
            },
            '논리적으로 타당해?': {
                phrases: ['정책이 좋다면 당연히 모든 사람이 찬성할 것입니다', '일부 반대 의견이 있으므로 이 정책은 문제가 있다고 볼 수 있습니다'],
                problems: '"좋다면 당연히 모든 사람이 찬성할 것", "반대 의견이 있으므로 문제가 있다"',
                violation: '"좋은 정책이라면 모든 사람이 찬성할 것"이라는 전제가 현실적이지 않으며, "반대 의견이 있으므로 문제가 있다"는 결론은 논리적 비약입니다. 정책에 대한 의견 차이는 자연스러운 현상이며, 반대 의견의 존재만으로 정책의 문제를 단정할 수 없습니다. 전제와 결론 사이의 논리적 연결이 부족합니다.',
                improvement: '현실적이고 합리적인 전제 설정 ("모든 사람의 찬성" → "전문가들의 긍정적 평가"), 반대 의견의 구체적 내용과 타당성 분석, 전제에서 결론으로 이어지는 논리적 단계 명확히 제시, 다양한 관점을 종합한 균형잡힌 결론 도출'
            },
            '충분히 뒷받침돼?': {
                phrases: ['필요하다고 생각합니다', '다른 나라에서도 비슷한 사례가 있었기 때문입니다'],
                problems: '"필요하다고 생각합니다", "다른 나라에서도 비슷한 사례가 있었다"',
                violation: '"다른 나라에서도 비슷한 사례가 있었다"는 매우 표면적인 근거입니다. 구체적으로 어떤 나라에서, 어떤 정책이, 어떤 결과를 가져왔는지에 대한 세부 정보가 전혀 제시되지 않았습니다. 단순히 사례의 존재만으로는 정책의 필요성을 충분히 뒷받침할 수 없으며, 더 구체적이고 다각적인 근거가 필요합니다.',
                improvement: '구체적인 해외 사례 제시 (국가명, 정책명, 시행 기간), 해외 정책의 구체적 성과와 효과 데이터 제공, 국내 상황과의 유사점과 차이점 분석, 다양한 관점의 근거를 균형있게 제시'
            },
            '편향은 없어?': {
                phrases: ['반드시 추진해야 합니다', '반대하는 사람들은 기득권을 유지하려는 세력들일 뿐이며', '진정한 개혁을 원하는 국민들은 모두 찬성하고 있습니다'],
                problems: '"반드시 추진해야", "기득권을 유지하려는 세력들", "진정한 개혁을 원하는 국민들은 모두"',
                violation: '"반대하는 사람들은 기득권 세력"이라고 단정하며 반대 의견을 일방적으로 매도하고 있습니다. "진정한 개혁을 원하는 국민들은 모두 찬성"이라는 표현도 감정적이고 선동적입니다. 이는 균형잡힌 시각을 제시하지 못하고 특정 관점에만 치우친 편향된 서술입니다.',
                improvement: '반대 의견의 합리적 근거도 객관적으로 제시, 감정적 표현 대신 중립적이고 객관적인 언어 사용, 다양한 이해관계자의 관점을 균형있게 고려, "모두", "반드시" 같은 절대적 표현 지양'
            },
            '관련성이 있어?': {
                phrases: ['최근 연예인들의 사생활 문제가 사회적 이슈가 되고 있습니다', '이런 문제들을 보면 우리 사회의 전반적인 윤리 의식 개선이 필요합니다'],
                problems: '"연예인들의 사생활 문제", "사회 전반적인 윤리 의식"',
                violation: '"연예인들의 사생활 문제"는 정책과 직접적인 관련성이 없는 별개의 사안입니다. 정책 논의에서 갑자기 연예인 사생활로 화제를 전환하는 것은 본래 논점에서 벗어나 독자의 주의를 분산시키고 논의의 초점을 흐리는 결과를 가져옵니다.',
                improvement: '정책과 직접 관련된 사례와 근거만 제시, 부차적이거나 관련 없는 이슈는 제외, 논제의 핵심 범위 내에서 일관성 있게 논의 진행, 논점에서 벗어나지 않도록 구성 체계화'
            },
            '적절한 근거야?': {
                phrases: ['제 개인적인 경험으로는 큰 어려움을 겪었습니다', '유명한 연예인 A씨도 TV에서 이 문제의 심각성을 언급한 바 있습니다'],
                problems: '"제 개인적인 경험으로는", "유명한 연예인 A씨도 TV에서"',
                violation: '개인적 경험은 주관적이고 제한적인 근거로, 일반적인 정책 논의에서 객관적 근거로 사용하기에는 부적절합니다. 또한 "유명한 연예인 A씨"는 해당 분야의 전문가가 아니므로 정책적 판단의 근거로 인용하는 것은 권위에 호소하는 오류에 해당합니다.',
                improvement: '개인 경험 대신 객관적 통계나 연구 자료 활용, 해당 분야 전문가나 공신력 있는 기관의 의견 인용, 검증 가능하고 신뢰성 높은 자료 출처 명시, 최신 데이터와 시의적절한 근거 사용'
            },
            '일관성이 있어?': {
                phrases: ['모든 국민에게 공평해야 합니다', '하지만 특별한 경우에는 일부 계층에게 더 많은 혜택을 주어야 한다고 생각합니다', '원칙적으로는 평등이 중요하지만, 현실적으로는 차별이 필요할 수도 있습니다'],
                problems: '"모든 국민에게 공평해야" vs "일부 계층에게 더 많은 혜택", "평등이 중요하지만 차별이 필요"',
                violation: '"모든 국민에게 공평해야 한다"고 주장하면서 동시에 "일부 계층에게 더 많은 혜택을 주어야 한다"고 말하는 것은 명백한 모순입니다. "평등이 중요하지만 차별이 필요하다"는 표현도 앞뒤가 맞지 않는 이중적 기준을 보여줍니다. 논증 내에서 일관성 있는 원칙을 유지하지 못하고 있습니다.',
                improvement: '명확하고 일관된 원칙 하에서 논증 전개, 예외 상황이 있다면 그 기준과 근거를 명확히 제시, 모순되는 주장들을 정리하여 일관성 있는 결론 도출, 전체 논증의 논리적 흐름과 일치성 점검'
            },
            '쟁점에 맞아?': {
                phrases: ['그런데 더 중요한 것은 환경 보호 문제입니다', '최근 기후 변화로 인한 피해가 증가하고 있어 이에 대한 대책이 우선되어야 합니다'],
                problems: '"그런데 더 중요한 것은 환경 보호 문제", "기후 변화로 인한 피해"',
                violation: '논의 도중 갑자기 "환경 보호 문제"라는 다른 주제로 전환하여 핵심 쟁점에서 벗어났습니다. 정책에 대한 논의에서 환경 문제는 부차적이거나 관련성이 낮은 요소로, 논점을 흐리고 독자의 주의를 분산시킵니다.',
                improvement: '정책의 핵심 쟁점에 집중, 부차적 문제보다 본질적 논점 중심 논의, 논제와 직접 관련된 근거와 사례만 제시'
            }
        };

        // 선택된 지침들의 문제 요소들을 조합하여 통합 텍스트 생성
        let combinedPhrases = [];
        let combinedProblems = [];
        let combinedViolations = [];
        let combinedImprovements = [];

        selectedGuidelines.forEach(guideline => {
            // "애매모호해?" 처리를 위한 fallback
            let actualGuideline = guideline;
            if (guideline === '애매모호해?') {
                actualGuideline = Math.random() < 0.5 ? '애매함' : '모호함';
            }
            
            if (guidelineElements[actualGuideline]) {
                const element = guidelineElements[actualGuideline];
                combinedPhrases.push(...element.phrases);
                combinedProblems.push(element.problems);
                combinedViolations.push(`[${actualGuideline}] ${element.violation}`);
                combinedImprovements.push(`[${actualGuideline}] ${element.improvement}`);
            }
        });

        // 난이도별 통합된 논증 텍스트 생성
        let promptText = '';
        
        if (difficulty === 'easy') {
            // 쉬움: 간단하고 명확한 문제점들
            const selectedPhrase = combinedPhrases[0] || '효과적인 방안이라고 생각합니다';
            promptText = `${selectedTopic}에 대한 정책이 필요합니다. ${selectedPhrase}. 따라서 이 정책을 추진해야 합니다.`;
        } else if (difficulty === 'normal') {
            // 보통: 중간 복잡도, 여러 문제점 포함
            const phrases = combinedPhrases.slice(0, 2);
            promptText = `${selectedTopic}에 대한 정책 도입이 시급한 상황입니다. ${phrases.join(' 또한 ')} 이러한 근거들을 종합해볼 때, 해당 정책을 반드시 추진해야 한다고 봅니다.`;
        } else { // hard
            // 어려움: 복잡한 구조, 많은 문제점들이 교묘하게 섞임
            const phrases = combinedPhrases.slice(0, Math.min(4, combinedPhrases.length));
            promptText = `현 시점에서 ${selectedTopic}에 대한 종합적 정책 수립이 무엇보다 중요한 과제로 대두되고 있습니다. ${phrases.join(' 더불어 ')} 이와 같은 다각적 검토 결과를 바탕으로, 관련 정책의 조속한 시행이 국가 발전을 위해 절대적으로 필요하다는 결론에 도달하게 됩니다.`;
        }

        // 난이도별 통합된 분석 결과
        let claim = '';
        let reasonText = '';
        
        if (difficulty === 'easy') {
            claim = `${selectedTopic}에 대한 정책이 필요하다`;
            const reasons = selectedGuidelines.map((guideline, index) => {
                // 서버에서 "애매모호해?"를 보내는 경우 처리
                if (guideline === '애매모호해?') {
                    const randomChoice = Math.random() < 0.5 ? '애매함' : '모호함';
                    guideline = randomChoice;
                }
                
                let mainReason, subReason;
                if (guideline === '애매함') {
                    mainReason = `공정한 방법으로 진행되어야 함`;
                    subReason = `관련 전문가들이 이 방법이 효과적이라고 평가했음`;
                } else if (guideline === '모호함') {
                    mainReason = `상당한 효과가 기대됨`;
                    subReason = `과거 유사한 정책에서 많은 성과를 거두었음`;
                } else if (guideline === '거짓은 없어?') {
                    mainReason = `확실한 성공률을 보임`;
                    subReason = `최근 연구에서 95% 성공률이 확인되었음`;
                } else if (guideline === '논리적으로 타당해?') {
                    mainReason = `좋은 정책이므로 당연히 찬성해야 함`;
                    subReason = `합리적인 시민이라면 누구나 지지할 것임`;
                } else if (guideline === '충분히 뒷받침돼?') {
                    mainReason = `외국 사례가 존재함`;
                    subReason = `선진국에서 이미 시행하고 있는 정책임`;
                } else if (guideline === '편향은 없어?') {
                    mainReason = `모든 국민이 원하는 정책임`;
                    subReason = `진정한 발전을 추구하는 시민들이 지지하고 있음`;
                } else if (guideline === '관련성이 있어?') {
                    mainReason = `사회 문제와 관련이 있음`;
                    subReason = `근본적으로는 환경 보호와 연결되어 있음`;
                } else if (guideline === '적절한 근거야?') {
                    mainReason = `개인 경험으로 확인됨`;
                    subReason = `직접 경험해본 결과 효과가 있었음`;
                } else if (guideline === '일관성이 있어?') {
                    mainReason = `공평하면서도 차별이 필요함`;
                    subReason = `모든 사람을 동등하게 대우하되 특별한 배려도 필요함`;
                } else if (guideline === '쟁점에 맞아?') {
                    mainReason = `더 중요한 환경 문제와 연결됨`;
                    subReason = `궁극적으로는 지구 온난화 해결과 관련이 있음`;
                } else {
                    mainReason = `필요한 정책임`;
                    subReason = `사회 발전을 위해 반드시 필요함`;
                }
                
                return `근거${index + 1}: ${mainReason}\n근거${index + 1}의 근거: ${subReason}`;
            });
            reasonText = reasons.join('\n\n');
        } else if (difficulty === 'normal') {
            claim = `${selectedTopic}에 대한 종합적 정책 추진이 필요하다`;
            const reasons = selectedGuidelines.map((guideline, index) => {
                // 서버에서 "애매모호해?"를 보내는 경우 처리
                if (guideline === '애매모호해?') {
                    const randomChoice = Math.random() < 0.5 ? '애매함' : '모호함';
                    guideline = randomChoice;
                }
                
                let mainReason, subReason;
                if (guideline === '애매함') {
                    mainReason = `성공적인 정책으로 전문가들이 평가하고 있음`;
                    subReason = `국내외 정책 전문가들이 이 분야에서의 혁신적 접근이라고 평가했음`;
                } else if (guideline === '모호함') {
                    mainReason = `상당한 수준의 효과가 기대되는 정책으로 평가받고 있음`;
                    subReason = `과거 5년간 유사한 정책들에서 많은 긍정적 변화가 관찰되었음`;
                } else if (guideline === '거짓은 없어?') {
                    mainReason = `연구 결과 상당한 성공률을 보이는 것으로 확인됨`;
                    subReason = `국제적으로 인정받는 연구기관에서 발표한 보고서가 이를 뒷받침함`;
                } else if (guideline === '논리적으로 타당해?') {
                    mainReason = `합리적인 정책이라면 당연히 국민들의 지지를 받을 것으로 예상됨`;
                    subReason = `논리적 사고능력을 가진 시민이라면 누구나 이 정책의 필요성을 인정할 것임`;
                } else if (guideline === '충분히 뒷받침돼?') {
                    mainReason = `해외 여러 국가에서의 유사한 정책 사례들이 존재함`;
                    subReason = `선진국들이 이미 비슷한 방향으로 정책을 시행하고 있는 상황임`;
                } else if (guideline === '편향은 없어?') {
                    mainReason = `진정한 발전을 추구하는 시민들은 대부분 이 정책에 동의하고 있음`;
                    subReason = `깨어있는 시민의식을 가진 사람들이 이 정책을 지지하고 있음`;
                } else if (guideline === '관련성이 있어?') {
                    mainReason = `우리 사회의 전반적인 윤리 의식 개선과 밀접한 관련이 있음`;
                    subReason = `근본적으로는 사회 전체의 도덕적 수준 향상과 연결되어 있음`;
                } else if (guideline === '적절한 근거야?') {
                    mainReason = `실제 경험자들의 증언과 공인들의 의견이 이를 뒷받침함`;
                    subReason = `현장에서 직접 경험한 사람들과 유명 인사들이 모두 동의하고 있음`;
                } else if (guideline === '일관성이 있어?') {
                    mainReason = `공정성 원칙을 유지하면서도 현실적 차별화가 동시에 필요함`;
                    subReason = `모든 사람을 평등하게 대우하되, 특별한 상황에서는 예외적 조치가 필요함`;
                } else if (guideline === '쟁점에 맞아?') {
                    mainReason = `본질적으로는 환경 보호 같은 더 큰 차원의 문제와 연결되어 있음`;
                    subReason = `장기적으로는 지구 환경과 인류의 생존 문제와도 관련이 있음`;
                } else {
                    mainReason = `사회 발전에 기여할 수 있는 중요한 정책임`;
                    subReason = `국가의 미래와 국민의 복지 향상에 핵심적인 역할을 할 것임`;
                }
                
                return `근거${index + 1}: ${mainReason}\n근거${index + 1}의 근거: ${subReason}`;
            });
            reasonText = reasons.join('\n\n');
        } else { // hard
            claim = `${selectedTopic}에 대한 다차원적이고 통합적인 정책 체계 구축이 시급하다`;
            const reasons = selectedGuidelines.map((guideline, index) => {
                // 서버에서 "애매모호해?"를 보내는 경우 처리
                if (guideline === '애매모호해?') {
                    const randomChoice = Math.random() < 0.5 ? '애매함' : '모호함';
                    guideline = randomChoice;
                }
                
                let mainReason, subReason, subSubReason;
                if (guideline === '애매함') {
                    mainReason = `인간적인 관점에서 볼 때, 성공적인 정책으로 전문가들이 공정한 평가를 내리고 있음`;
                    subReason = `국내외 정책학계의 권위자들이 이 정책의 혁신성과 실효성을 높이 평가했음`;
                    subSubReason = `특히 하버드대 정책대학원과 옥스퍼드대 연구진이 공동으로 발표한 보고서에서 모범 사례로 언급됨`;
                } else if (guideline === '모호함') {
                    mainReason = `상당히 높은 수준의 정책 효과가 많은 연구를 통해 입증되었음`;
                    subReason = `지난 10년간 축적된 광범위한 데이터와 오래된 사례 분석을 통해 효과성이 검증됨`;
                    subSubReason = `국제기구들이 발표한 다수의 백서에서 이러한 접근법의 우수성이 거듭 확인되고 있음`;
                } else if (guideline === '거짓은 없어?') {
                    mainReason = `최근 실시된 대규모 연구조사에서 매우 높은 성공률이 확인됨`;
                    subReason = `국제적으로 인정받는 연구기관들의 메타분석 결과가 이를 뒷받침함`;
                    subSubReason = `총 50개국, 10만 명을 대상으로 한 종단연구에서도 일관된 결과가 도출됨`;
                } else if (guideline === '논리적으로 타당해?') {
                    mainReason = `논리적으로 판단해볼 때, 진정으로 우수한 정책이라면 합리적 사고를 가진 시민들 대부분이 지지할 것임`;
                    subReason = `이는 민주주의 사회에서 정책 정당성을 확보하는 기본 원리에 부합함`;
                    subSubReason = `역사적으로도 혁신적인 정책들은 초기에는 일부 반대가 있었지만 결국 광범위한 지지를 얻어왔음`;
                } else if (guideline === '충분히 뒷받침돼?') {
                    mainReason = `국제적으로 다양한 선진국들에서 이미 유사한 정책을 성공적으로 시행하고 있음`;
                    subReason = `특히 북유럽 국가들과 독일, 캐나다 등에서 탁월한 성과를 거두고 있음`;
                    subSubReason = `이들 국가의 정책 도입 후 5년간 추적조사 결과 모든 지표에서 개선이 확인됨`;
                } else if (guideline === '편향은 없어?') {
                    mainReason = `객관적으로 살펴볼 때, 진정한 사회 발전과 개혁을 추구하는 깨어있는 시민들은 대부분 이러한 정책 방향에 공감하고 있음`;
                    subReason = `다양한 사회 계층과 연령대를 아우르는 여론조사에서도 이러한 경향이 확인됨`;
                    subSubReason = `특히 교육 수준이 높고 사회 참여에 적극적인 시민들일수록 지지율이 높게 나타남`;
                } else if (guideline === '관련성이 있어?') {
                    mainReason = `표면적으로는 별개의 문제처럼 보일 수 있으나, 실제로는 우리 사회의 근본적인 윤리 의식 및 가치관 체계와 밀접한 연관성을 갖고 있음`;
                    subReason = `사회학적 관점에서 볼 때 모든 정책 이슈들은 상호 연결되어 있는 복합적 시스템의 일부임`;
                    subSubReason = `시스템 이론과 복잡성 과학의 관점에서도 이러한 통합적 접근의 필요성이 강조되고 있음`;
                } else if (guideline === '적절한 근거야?') {
                    mainReason = `실제 현장에서의 생생한 경험담들과 더불어 사회적 영향력을 가진 공인들의 공개적 지지 표명이 정책의 필요성을 강력하게 뒷받침하고 있음`;
                    subReason = `현장 전문가들과 시민사회 리더들의 일관된 증언이 정책의 실효성을 입증함`;
                    subSubReason = `특히 노벨평화상 수상자들과 국제기구 사무총장들의 연대 성명이 이를 뒷받침함`;
                } else if (guideline === '일관성이 있어?') {
                    mainReason = `기본적으로는 모든 계층에 대한 공정한 대우라는 원칙을 견지하면서도, 현실적 여건을 고려할 때 일정 부분 차별화된 접근이 동시에 요구되는 상황임`;
                    subReason = `이는 절대적 평등과 상대적 형평성을 동시에 추구하는 현대 복지국가의 기본 철학과 일치함`;
                    subSubReason = `롤스의 정의론과 센의 역량접근법 등 현대 정치철학의 주요 이론들도 이러한 접근을 지지함`;
                } else if (guideline === '쟁점에 맞아?') {
                    mainReason = `단순히 해당 정책만의 문제가 아니라, 궁극적으로는 환경 보호나 지속가능한 발전 같은 보다 포괄적이고 근본적인 사회적 과제와 직결되어 있는 사안임`;
                    subReason = `UN의 지속가능발전목표(SDGs)와도 밀접한 연관성을 가지고 있어 글로벌 의제와 부합함`;
                    subSubReason = `기후변화 대응과 사회적 포용성 확대라는 21세기 인류의 핵심 과제 해결에 기여할 것으로 예상됨`;
                } else {
                    mainReason = `다각적 관점에서 검토해본 결과, 국가 발전을 위해 반드시 필요한 핵심적 정책이라고 판단됨`;
                    subReason = `경제적, 사회적, 환경적 측면을 종합적으로 고려한 다차원적 분석의 결과임`;
                    subSubReason = `미래 세대에 대한 책임과 지속가능한 발전이라는 관점에서도 필수불가결한 정책임`;
                }
                
                return `근거${index + 1}: ${mainReason}\n근거${index + 1}의 근거: ${subReason}\n근거${index + 1}의 근거의 근거: ${subSubReason}`;
            });
            reasonText = reasons.join('\n\n');
        }
        
        const analysis = {
            selectedGuidelines: selectedGuidelines,
            claim: claim,
            reason: reasonText,
            problematic_part: combinedProblems.join(', '),
            violation_reason: combinedViolations.join('\n\n'),
            improvement_suggestion: combinedImprovements.join('\n\n')
        };

        return { promptText, analysis };
    }

    // ------------------- Advanced Practice Generation Logic -------------------
    advancedGenerateBtn.addEventListener('click', async () => {
        const selectedDifficulty = document.querySelector('input[name="advanced-difficulty"]:checked').value;
        
        // 로딩 표시
        loadingSpinner.style.display = 'flex';
        advancedGenerateBtn.disabled = true;
        
        try {
            // 심화 연습: 9개 지침 중 임의로 1-3개 선택 (클라이언트에서 처리)
            // 애매함과 모호함을 번갈아 가며 선택
            const ambiguityType = Math.random() < 0.5 ? '애매함' : '모호함';
            const allGuidelines = [
                ambiguityType,  // 애매함 또는 모호함을 번갈아 선택
                '거짓은 없어?', 
                '논리적으로 타당해?',
                '충분히 뒷받침돼?',
                '편향은 없어?',
                '관련성이 있어?',
                '적절한 근거야?',
                '일관성이 있어?',
                '쟁점에 맞아?'
            ];
            
            // 임의로 1-3개 지침 선택
            const numGuidelines = Math.floor(Math.random() * 3) + 1;
            const selectedGuidelines = [];
            const shuffledGuidelines = [...allGuidelines].sort(() => Math.random() - 0.5);
            
            for (let i = 0; i < numGuidelines; i++) {
                selectedGuidelines.push(shuffledGuidelines[i]);
            }
            
            console.log(`[심화 연습] 선택된 지침: ${selectedGuidelines.join(', ')}`);
            
            // 주제 선택
            const topics = ['선거제도 개편', '기본소득제 도입', '인공지능 교육 도입', '재생에너지 확대', '기후변화 대응', '핵에너지 활용', '가짜뉴스 대응', '대학입시 제도'];
            const selectedTopic = topics[Math.floor(Math.random() * topics.length)];
            
            // 복수 지침 체계적 처리: 선택된 모든 지침을 위반하는 통합 논증 생성
            // 자연스러운 로딩 시간 구현 (1.5-3초)
            const loadingTime = 1500 + Math.random() * 1500; // 1.5~3초
            
            setTimeout(() => {
                const { promptText, analysis } = generateMultiGuidelinePrompt(selectedTopic, selectedGuidelines, selectedDifficulty);
                
                // 생성된 텍스트 표시
                advancedPromptDisplay.innerHTML = `<p class="generated-text">${cleanClientText(promptText)}</p>`;
                
                console.log('[심화 연습] 선택된 지침:', selectedGuidelines);
                
                // 오른쪽 패널의 텍스트 영역들 활성화
                const advancedRightPanelInputs = document.querySelectorAll('#advanced-practice-content .right-panel-input');
                advancedRightPanelInputs.forEach(input => input.disabled = false);
                
                // 메인 지침 선택 드롭다운 활성화
                // advancedMainGuidelineSelect 제거됨
                
                // 버튼들 활성화
                document.querySelectorAll('#advanced-practice-content .add-basis-btn').forEach(btn => btn.disabled = false);
                advancedAddReasonBtn.disabled = false;
                advancedAddEvaluationBtn.disabled = false;
                advancedShowAnswerBtn.disabled = false;
                
                // 모범답안 데이터 저장 (제시문 텍스트와 지침 정보 포함)
                window.currentAdvancedAnalysis = {
                    ...analysis,
                    promptText: promptText,
                    selectedCriteria: selectedGuidelines
                };
                
                // 로딩 완료
                loadingSpinner.style.display = 'none';
                advancedGenerateBtn.disabled = false;
            }, loadingTime);
            
        } catch (error) {
            console.error('제시문 생성 중 오류:', error);
            advancedPromptDisplay.innerHTML = '<p style="color: red;">제시문 생성 중 오류가 발생했습니다. 다시 시도해주세요.</p>';
            loadingSpinner.style.display = 'none';
            advancedGenerateBtn.disabled = false;
        }
    });

    // ------------------- Advanced Practice Add Reason Logic -------------------
    advancedAddReasonBtn.addEventListener('click', () => {
        const reasonGroup = advancedReasonsContainer.querySelector('.reason-group');
        const newReasonGroup = reasonGroup.cloneNode(true);
        
        // 새로 복제된 그룹의 내용 초기화
        newReasonGroup.querySelectorAll('textarea').forEach(textarea => textarea.value = '');
        newReasonGroup.querySelector('.basis-container').innerHTML = ''; // "근거의 근거" 컨테이너 비우기
        
        advancedReasonsContainer.appendChild(newReasonGroup);
    });

    // 이벤트 위임: advanced-reasons-container 안의 .add-basis-btn 클릭 처리
    advancedReasonsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('add-basis-btn')) {
            const button = event.target;
            const reasonGroup = button.closest('.reason-group');
            const basisContainer = reasonGroup.querySelector('.basis-container');
            
            const newInputGroup = document.createElement('div');
            newInputGroup.classList.add('input-group');

            const label = document.createElement('label');
            label.textContent = '근거의 근거는?';
            
            const textarea = document.createElement('textarea');
            textarea.classList.add('summary-input', 'right-panel-input');
            textarea.placeholder = '근거를 뒷받침하는 세부 근거를 입력하세요.';
            
            newInputGroup.appendChild(label);
            newInputGroup.appendChild(textarea);
            basisContainer.appendChild(newInputGroup);
        }
    });

    // ------------------- Advanced Practice Evaluation Add Logic -------------------
    // advancedMainGuidelineSelect 제거됨

    // 메인 드롭다운 제거됨으로 인한 관련 코드 제거 (심화 연습)
    
    // 심화 연습 모드 평가 항목의 드롭다운 변경 시 플레이스홀더 업데이트
    advancedEvaluationsContainer.addEventListener('change', (event) => {
        if (event.target.classList.contains('guideline-select-small')) {
            const evaluationItem = event.target.closest('.evaluation-item');
            const problemTextarea = evaluationItem.querySelector('.problematic-part-input');
            const reasonTextarea = evaluationItem.querySelector('.violation-reason-input');
            
            if (event.target.value) {
                problemTextarea.placeholder = `${event.target.value} 지침을 위반하는 부분을 입력하세요.`;
                reasonTextarea.placeholder = `${event.target.value} 지침을 위반한 이유를 설명하세요.`;
            } else {
                problemTextarea.placeholder = '제시문에서 논리적 오류나 문제가 있는 부분을 입력하세요.';
                reasonTextarea.placeholder = '왜 문제가 되는지 그 이유를 설명하세요.';
            }
        }
    });

    advancedAddEvaluationBtn.addEventListener('click', () => {
        const evaluationItem = advancedEvaluationsContainer.querySelector('.evaluation-item');
        const newEvaluationItem = evaluationItem.cloneNode(true);
        
        // 새로 복제된 평가 항목의 내용 초기화
        newEvaluationItem.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
        newEvaluationItem.querySelectorAll('textarea').forEach(textarea => {
            textarea.value = '';
            // 기본 플레이스홀더로 설정
            if (textarea.classList.contains('problematic-part-input')) {
                textarea.placeholder = '제시문에서 논리적 오류나 문제가 있는 부분을 입력하세요.';
            } else if (textarea.classList.contains('violation-reason-input')) {
                textarea.placeholder = '왜 문제가 되는지 그 이유를 설명하세요.';
            }
        });
        
        advancedEvaluationsContainer.appendChild(newEvaluationItem);
    });

    // ------------------- Advanced Practice Answer Modal Logic -------------------
    advancedShowAnswerBtn.addEventListener('click', () => {
        if (!window.currentAdvancedAnalysis) {
            alert('먼저 제시문을 생성해주세요.');
            return;
        }

        const analysis = window.currentAdvancedAnalysis;
        displayAnalysis(analysis);
        modal.style.display = 'flex';
        
        // 모달 위치 초기화
        modalContent.style.left = '50%';
        modalContent.style.top = '10%';
        modalContent.style.transform = 'translateX(-50%)';
    });
});