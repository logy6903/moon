// --- 탭 전환 함수들 ---
function switchToArgument() {
    // 네비게이션 버튼 활성화 상태 변경
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.mode-btn[onclick="switchToArgument()"]').classList.add('active');
    
    // 왼쪽 단 패널 전환
    document.getElementById('argument-panel').style.display = 'flex';
    document.getElementById('non-argument-panel').style.display = 'none';
    
    // 오른쪽 단 패널 전환
    document.getElementById('argument-summary-panel').style.display = 'flex';
    document.getElementById('non-argument-empty-panel').style.display = 'none';
}

function switchToNonArgument() {
    // 네비게이션 버튼 활성화 상태 변경
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.mode-btn[onclick="switchToNonArgument()"]').classList.add('active');
    
        // 왼쪽 단 패널 전환
    document.getElementById('argument-panel').style.display = 'none';
    document.getElementById('non-argument-panel').style.display = 'flex';
        
        // 오른쪽 단 패널 전환
        document.getElementById('argument-summary-panel').style.display = 'none';
        document.getElementById('non-argument-summary-panel').style.display = 'flex';
        

}

document.addEventListener('DOMContentLoaded', () => {
    // --- URL 파라미터 확인하여 탭 전환 ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'non-argument') {
        switchToNonArgument();
    } else {
        // 비논증 요약하기 탭에서 기본 설명 표시 (페이지 로드 후)
        setTimeout(() => {

        }, 100);
    }

    // --- DOM ?�소 가?�오�?---
    const generateBtn = document.getElementById('generate-btn');
    const keywordInput = document.getElementById('keyword-input');
    const textDisplay = document.getElementById('text-display');
    const difficultySelector = document.getElementById('difficulty-selector');
    const summaryForm = document.getElementById('summary-form');
    const issueInput = document.getElementById('issue-input');
    const claimInput = document.getElementById('claim-input');
    const groundsContainer = document.getElementById('grounds-container');
    const addGroundBtn = document.getElementById('add-ground-btn');
    const submitBtn = document.getElementById('submit-summary-btn');

    // 비논증 요약하기 DOM 요소
    const generateNonArgumentBtn = document.getElementById('generate-non-argument-btn');
    const nonArgumentKeyword = document.getElementById('non-argument-keyword');
    const nonArgumentTextDisplay = document.getElementById('non-argument-text-display');

    const nonArgumentSummaryInput = document.getElementById('non-argument-summary-input');
    const checkNonArgumentAnswerBtn = document.getElementById('check-non-argument-answer-btn');

    // '?�세??보기' 관??DOM ?�소
    const viewDetailBtn = document.getElementById('view-detail-btn');
    const passageDetailPanel = document.getElementById('passage-detail-panel');
    const passageDetailContent = document.getElementById('passage-detail-content');
    const closeDetailPanel = document.getElementById('close-detail-panel');
    
    // ?�업 관??DOM ?�소
    const popupBackdrop = document.getElementById('popup-backdrop');
    const popupContainer = document.getElementById('popup-container');
    const popupHeader = document.getElementById('popup-header');
    const popupContent = document.getElementById('popup-content');
    const popupCloseBtn = document.getElementById('popup-close-btn');

    let modelAnswer = null; // AI가 ?�성???�답 ?�리 구조
    let isDragging = false;
    let offsetX, offsetY;

    // --- 팝업 관리 함수 ---
    
    /**
     * 팝업을 닫는 함수
     */
    function closePopup() {
        if (popupBackdrop) popupBackdrop.classList.add('hidden');
        if (popupContainer) popupContainer.classList.add('hidden');
    }

    // 팝업 닫기 이벤트 리스너 설정
    if (popupBackdrop) {
        popupBackdrop.addEventListener('click', closePopup);
    }
    
    if (popupCloseBtn) {
        popupCloseBtn.addEventListener('click', closePopup);
    }

    // ESC 키로 팝업 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !popupContainer.classList.contains('hidden')) {
            closePopup();
        }
    });





    // --- ?�틸리티 ?�수 ---
    const autoResizeTextarea = (textarea) => {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    };

    // --- UI 초기??리셋 ?�수 ---
    const resetSummaryForm = () => {
        summaryForm.reset();
        groundsContainer.innerHTML = '';
        createGroundInput(); // 초기 근거 ?�드 1�??�성
        document.querySelectorAll('#summary-form textarea').forEach(autoResizeTextarea);
    };

    // --- ?�적 UI ?�성 ?�수 ---
    const createGroundInput = () => {
        const groundCount = groundsContainer.querySelectorAll('.ground-block').length;
        const groundId = `ground-input-${Date.now()}`;
        
        const groundBlock = document.createElement('div');
        groundBlock.className = 'ground-block';
        
        groundBlock.innerHTML = `
            <label for="${groundId}">근거 ${groundCount + 1}</label>
            <textarea id="${groundId}" class="form-control" placeholder="제시문에 근거하여 작성하세요"></textarea>
            <button type="button" class="remove-ground-btn">&times;</button>
            <button type="button" class="add-sub-ground-btn">하위 근거 추가</button>
        `;

        groundsContainer.appendChild(groundBlock);
        
        // ?�적?�로 추�???textarea?�도 ?�이 조절 ?�벤???�용
        const newTextarea = groundBlock.querySelector('textarea');
        newTextarea.addEventListener('input', () => autoResizeTextarea(newTextarea));
        
        // ??�� 버튼???�벤??리스??추�?
        groundBlock.querySelector('.remove-ground-btn').addEventListener('click', () => {
            groundBlock.remove();
            // ??�� ??근거 번호 ?�정??
            groundsContainer.querySelectorAll('.ground-block').forEach((block, index) => {
                block.querySelector('label').textContent = `근거 ${index + 1}`;
            });
        });
    };

    // --- ?�이???�집 ?�수 ---
    const collectUserSummary = () => {
        const grounds = Array.from(groundsContainer.querySelectorAll('textarea'))
            .map(textarea => textarea.value.trim())
            .filter(text => text !== '');

        return {
            issue: issueInput.value.trim(),
            claim: claimInput.value.trim(),
            grounds: grounds,
        };
    };

    // --- ?�업 �??�세 ?�널 ?�시 ?�수 ---

    /**
     * ?�로???�리 구조(모범 ?�안)�?HTML�??�매?�하???�수
     * @param {object} structure - ?�매?�할 ?�리 구조
     * @returns {string} - ?�성??HTML 문자??
     */
    const formatLogicalStructureToHtml = (structure) => {
        if (!structure) return '<p>표시할 내용이 없습니다.</p>';

        let html = `
            ${structure.topic ? `<p><strong>주제:</strong> ${structure.topic}</p>` : ''}
              ${structure.issue ? `<p><strong>쟁점:</strong> ${structure.issue}</p>` : ''}
            <p><strong>주장:</strong> ${structure.claim || '없음'}</p>
        `;

        if (structure.arguments && structure.arguments.length > 0) {
            html += '<div><strong>논증 구조:</strong>';
            html += '<ul class="argument-list">';
            structure.arguments.forEach((arg, index) => {
                html += `<li>
                    <div class="argument-item">
                        <span class="argument-title">근거 ${index + 1}:</span>
                        <span class="argument-content">${arg.ground}</span>
                    </div>`;
                if (arg.sub_grounds && arg.sub_grounds.length > 0) {
                    html += `<ul class="sub-argument-list">`;
                    arg.sub_grounds.forEach(sub => {
                        html += `<li><span class="sub-argument-content">${sub}</span></li>`;
                    });
                    html += `</ul>`;
                }
                if (arg.hidden_premise) {
                    html += `<div class="hidden-premise-item">
                                <span class="hidden-premise-title">?�� ?��? ?�제:</span>
                                <span class="hidden-premise-content">${arg.hidden_premise}</span>
                             </div>`;
                }
                html += `</li>`;
            });
            html += '</ul></div>';
        }
        
        return html;
    };

    const showEvaluationPopup = (userSummary, model, evaluation) => {
        popupContent.innerHTML = ''; // 기존 내용 초기화

        // 나의 답안 섹션
        const userSection = document.createElement('div');
        userSection.className = 'popup-section';
        userSection.innerHTML = `
            <h3>나의 답안</h3>
            <p><strong>쟁점:</strong> ${userSummary.issue || '<em>미작성</em>'}</p>
            <p><strong>주장:</strong> ${userSummary.claim || '<em>미작성</em>'}</p>
            <div><strong>근거:</strong><ul>${userSummary.grounds.length > 0 ? userSummary.grounds.map(g => `<li>${g}</li>`).join('') : '<li><em>미작성</em></li>'}</ul></div>
        `;
        
        // 모범 답안 섹션
        const modelSection = document.createElement('div');
        modelSection.className = 'popup-section';
        
        let modelAnswerHtml = '<h3>모범 답안</h3>';
        
        if (evaluation?.model_answer) {
            const modelAnswer = evaluation.model_answer;
            
            modelAnswerHtml += `<p><strong>주장:</strong> ${modelAnswer.claim}</p>`;
            
            // 쉬움 난이도: grounds 필드 사용
            if (modelAnswer.grounds) {
                modelAnswerHtml += '<div><strong>근거:</strong><pre style="white-space: pre-wrap; font-family: inherit; margin: 10px 0;">' + modelAnswer.grounds + '</pre></div>';
            }
            
            // 보통/어려움 난이도: detailed_structure 필드 사용
            if (modelAnswer.detailed_structure) {
                modelAnswerHtml += '<div><strong>논증 구조:</strong><pre style="white-space: pre-wrap; font-family: inherit; margin: 10px 0;">' + modelAnswer.detailed_structure + '</pre></div>';
            }
            
            // 어려움 난이도: 숨은전제 표시
            if (modelAnswer.hidden_premise && modelAnswer.hidden_premise !== "명시적 숨은전제 없음") {
                modelAnswerHtml += `<p><strong>숨은전제:</strong> ${modelAnswer.hidden_premise}</p>`;
            }
            
            // 구조 설명 추가
            if (modelAnswer.structure_note) {
                modelAnswerHtml += `<p style="color: #6c757d; font-style: italic; margin-top: 15px;"><strong>💡 분석 안내:</strong> ${modelAnswer.structure_note}</p>`;
            }
        } else {
            // 기존 형식 지원 (백업)
            modelAnswerHtml += formatLogicalStructureToHtml(model);
        }
        
        modelSection.innerHTML = modelAnswerHtml;

        // 피드백 섹션
        if (evaluation?.feedback) {
            const feedbackSection = document.createElement('div');
            feedbackSection.className = 'popup-section';
            feedbackSection.innerHTML = `
                <h3>학습 안내</h3>
                <p>${evaluation.feedback}</p>
            `;
            popupContent.appendChild(feedbackSection);
        }

        popupContent.appendChild(userSection);
        popupContent.appendChild(modelSection);
        
        popupBackdrop.classList.remove('hidden');
        popupContainer.classList.remove('hidden');
    };
    
    const createResultItem = (title, evalData) => {
        if (typeof evalData === 'undefined' || evalData === null) {
            return `<p><strong>${title}:</strong> 채점 정보 없음</p>`;
        }

        // 서버 응답이 문자열일 경우와 객체일 경우를 모두 처리
        const isMatch = typeof evalData === 'object' ? evalData?.match : (evalData === '일치');
        const feedback = typeof evalData === 'object' ? (evalData?.feedback || '') : '';

        const resultClass = isMatch ? 'match' : 'mismatch';
        const resultText = isMatch ? '일치' : '불일치';

        return `<p><strong>${title}:</strong> <span class="eval-status ${resultClass}">${resultText}</span> ${feedback ? `- ${feedback}` : ''}</p>`;
    };
    
    const hidePopup = () => {
        popupBackdrop.classList.add('hidden');
        popupContainer.classList.add('hidden');
        // ?�업 ?�치 초기??
        popupContainer.style.left = '50%';
        popupContainer.style.top = '50%';
        popupContainer.style.transform = 'translate(-50%, -50%)';
    };

    // --- ?�업 ?�래�?기능 ---
    const onDragStart = (e) => {
        if (e.target.tagName === 'BUTTON') return;
        isDragging = true;
        
        // ?�래�??�작 ??transform???�거?�야 offset 계산???�확?�짐
        if (popupContainer.style.transform !== 'none') {
            const rect = popupContainer.getBoundingClientRect();
            popupContainer.style.transform = 'none';
            popupContainer.style.left = `${rect.left}px`;
            popupContainer.style.top = `${rect.top}px`;
        }

        offsetX = e.clientX - popupContainer.offsetLeft;
        offsetY = e.clientY - popupContainer.offsetTop;

        document.addEventListener('mousemove', onDragging);
        document.addEventListener('mouseup', onDragEnd);
    };

    const onDragging = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        popupContainer.style.left = `${e.clientX - offsetX}px`;
        popupContainer.style.top = `${e.clientY - offsetY}px`;
    };

    const onDragEnd = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onDragging);
        document.removeEventListener('mouseup', onDragEnd);
    };

    // --- ?�벤???�들??---
    // ?�시�??�성
    generateBtn.addEventListener('click', async () => {
        const keyword = keywordInput.value.trim();
        if (!keyword) {
            alert('키워드를 입력해주세요.');
            return;
        }
        const difficulty = difficultySelector.querySelector('input[name="difficulty"]:checked').value;

        generateBtn.disabled = true;
        generateBtn.textContent = '생성 중...';
        textDisplay.innerHTML = '<div class="loader"></div>';
        viewDetailBtn.style.display = 'none';

        try {
            const response = await fetch('/api/generate-passage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword, type: 'argument', difficulty })
            });

            if (!response.ok) throw new Error('서버 오류');

            const data = await response.json();
            textDisplay.textContent = data.passage;
            modelAnswer = data.logical_structure;
            resetSummaryForm();

            if (difficulty === 'normal' || difficulty === 'hard') {
                viewDetailBtn.style.display = 'inline-block';
            }

        } catch (error) {
            textDisplay.textContent = '제시문 생성에 실패했습니다.';
            console.error(error);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = '제시문 생성';
        }
    });
    
    // 모범?�안 ?�인
    submitBtn.addEventListener('click', async () => {
        if (!modelAnswer) {
            alert('먼저 제시문을 생성해주세요.');
            return;
        }

        const userSummary = collectUserSummary();
        
        // 내용을 서버에 전송할 문자열로 변환
        const summaryText = `쟁점: ${userSummary.issue}
주장: ${userSummary.claim}
근거: ${userSummary.grounds.map((ground, index) => `${index + 1}. ${ground}`).join(', ')}`;
        
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.dataset.originalText = submitBtn.textContent; // 원래 텍스트 저장
        submitBtn.textContent = '확인 중...';

        try {
            // 현재 선택된 난이도 가져오기
            const difficulty = difficultySelector.querySelector('input[name="difficulty"]:checked').value;
            
            const response = await fetch('/api/evaluate-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    type: 'argument',
                    summary: summaryText, 
                    model: modelAnswer,
                    difficulty: difficulty
                })
            });
            if (!response.ok) throw new Error('채점 서버 오류');
            
            const evaluation = await response.json();
            showEvaluationPopup(userSummary, modelAnswer, evaluation);

        } catch (error) {
            alert(`오류가 발생했습니다: ${error.message}`);
            console.error(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.textContent = submitBtn.dataset.originalText; // 원래 텍스트로 복원
        }
    });

    // 기�? ?�벤??리스??
    addGroundBtn.addEventListener('click', createGroundInput);
    popupCloseBtn.addEventListener('click', hidePopup);
    popupBackdrop.addEventListener('click', hidePopup);
    popupHeader.addEventListener('mousedown', onDragStart);
    
    viewDetailBtn.addEventListener('click', () => {
        if (modelAnswer) {
            passageDetailContent.innerHTML = formatLogicalStructureToHtml(modelAnswer); // ?�로???�수 ?�사??
            passageDetailPanel.classList.remove('hidden');
        } else {
            alert('먼�? ?�시문을 ?�성?�주?�요.');
        }
    });

    closeDetailPanel.addEventListener('click', () => {
        passageDetailPanel.classList.add('hidden');
    });

    summaryForm.addEventListener('input', e => {
        if (e.target.tagName.toLowerCase() === 'textarea') {
            autoResizeTextarea(e.target);
        }
    });

    // --- 비논증 요약하기 이벤트 리스너 ---

    if (generateNonArgumentBtn) {
        generateNonArgumentBtn.addEventListener('click', () => {
            const keyword = nonArgumentKeyword.value.trim();
            const summaryType = document.querySelector('input[name="summary-type"]:checked');
            const difficulty = document.querySelector('input[name="non-argument-difficulty"]:checked');

            // 유효성 검사
            if (!keyword) {
                alert('키워드를 입력해주세요.');
                return;
            }

            if (!summaryType) {
                alert('요약 종류를 선택해주세요.');
                return;
            }

            if (!difficulty) {
                alert('난이도를 선택해주세요.');
                return;
            }

            // 제시문 생성 표시
            if (nonArgumentTextDisplay) {
                nonArgumentTextDisplay.innerHTML = `
                    <div style="color: #6c757d; font-style: italic; text-align: center; padding: 40px;">
                        <div class="loading-spinner" style="margin-bottom: 15px;">
                            <div class="spinner"></div>
                        </div>
                        <div style="font-size: 1.1em; margin-bottom: 8px;">📝 제시문을 생성하고 있습니다...</div>
                        <small style="color: #999;">키워드: ${keyword} | 유형: ${summaryType.value} | 난이도: ${difficulty.value}</small>
                        <div style="margin-top: 10px; font-size: 0.9em; color: #999;">
                            <span class="loading-dots">잠시만 기다려주세요</span>
                        </div>
                    </div>
                `;
                
                // 실제 AI 서버 연동하여 제시문 생성
                generateNonArgumentPassage(keyword, summaryType.value, difficulty.value);
            }
        });
    }

    // --- 비논증 요약 모범답안 확인 버튼 이벤트 ---
    if (checkNonArgumentAnswerBtn) {
        checkNonArgumentAnswerBtn.addEventListener('click', () => {
            // 모범답안 데이터가 있는지 확인
            if (!window.nonArgumentModelAnswer) {
                alert('먼저 제시문을 생성해주세요.');
                return;
            }

            // 현재 선택된 요약 유형에 따라 적절한 입력 필드 체크
            let userSummary = '';
            const summaryType = document.querySelector('input[name="summary-type"]:checked');
            
            if (summaryType) {
                const summaryTypeValue = summaryType.value;
                
                // 요약 유형별로 올바른 입력 필드에서 값 가져오기
                const summaryInput = document.getElementById('non-argument-summary-input');
                if (summaryInput) {
                    userSummary = summaryInput.value.trim();
                }
            } else {
                // 기본 입력 필드 체크
                if (nonArgumentSummaryInput) {
                    userSummary = nonArgumentSummaryInput.value.trim();
                }
            }
            
            if (!userSummary) {
                alert('요약문을 작성해주세요.');
                return;
            }

            // 팝업으로 모범답안 표시
            showNonArgumentModelAnswer();
        });
    }

    // --- 비논증 요약 제시문 생성 함수 ---
    
    /**
     * 비논증 요약 제시문을 생성하는 함수
     * @param {string} keyword - 키워드
     * @param {string} summaryType - 요약 유형 (delete, select, generalize, reconstruct)
     * @param {string} difficulty - 난이도 (easy, normal, hard)
     */
    async function generateNonArgumentPassage(keyword, summaryType, difficulty) {
        try {
            const response = await fetch('/api/generate-non-argument-passage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    keyword: keyword,
                    summaryType: summaryType,
                    difficulty: difficulty
                })
            });

            if (!response.ok) {
                throw new Error(`서버 오류: ${response.status}`);
            }

            const data = await response.json();
            
            // 생성된 제시문을 화면에 표시
            if (nonArgumentTextDisplay) {
                nonArgumentTextDisplay.innerHTML = `<div style="line-height: 1.6; color: #333;">${data.passage.replace(/\n/g, '<br>')}</div>`;
            }

            // 모범답안을 전역 변수에 저장 (추후 모범답안 확인 기능에서 사용)
            window.nonArgumentModelAnswer = {
                passage: data.passage,
                modelAnswer: data.model_answer,
                keyword: keyword,
                summaryType: summaryType,
                difficulty: difficulty,
                deleteTargets: data.delete_targets || [],
                selectTargets: data.select_targets || [],
                selectionProcess: data.selection_process || null,
                generalizeTargets: data.generalize_targets || [],
                reconstructTargets: data.reconstruct_targets || []
            };

            console.log('비논증 요약 제시문 생성 완료:', data);

        } catch (error) {
            console.error('비논증 요약 제시문 생성 오류:', error);
            if (nonArgumentTextDisplay) {
                nonArgumentTextDisplay.innerHTML = `
                    <div style="color: #dc3545; text-align: center; padding: 20px;">
                        ❌ 제시문 생성 중 오류가 발생했습니다.<br>
                        <small>${error.message}</small><br>
                        <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 10px; border: 1px solid #dc3545; background: white; color: #dc3545; cursor: pointer;">새로고침</button>
                    </div>
                `;
            }
        }
    }

    // --- 비논증 요약 모범답안 표시 함수 ---
    
    /**
     * 비논증 요약 모범답안을 팝업으로 표시하는 함수
     */
    function showNonArgumentModelAnswer() {
        const data = window.nonArgumentModelAnswer;
        if (!data) return;

        // 요약 유형별 제목 설정
        const typeNames = {
            'delete': '삭제',
            'select': '선택', 
            'generalize': '일반화',
            'reconstruct': '재구성'
        };
        
        const typeName = typeNames[data.summaryType] || data.summaryType;
        
        // 난이도별 이름 설정
        const difficultyNames = {
            'easy': '쉬움',
            'normal': '보통',
            'hard': '어려움'
        };
        
        const difficultyName = difficultyNames[data.difficulty] || data.difficulty;

        // 팝업 헤더 설정
        popupHeader.innerHTML = `
            <h4>비논증 요약 모범답안</h4>
            <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                키워드: ${data.keyword} | 유형: ${typeName} | 난이도: ${difficultyName}
            </div>
            <button id="popup-close-btn" class="popup-close-btn">&times;</button>
        `;

        // 원문 처리 (삭제/선택 요약일 때 대상 하이라이트)
        let processedPassage = data.passage;
        let targetExplanations = '';
        let explanationTitle = '';
        let explanationIcon = '';
        
        if (data.summaryType === 'delete' && data.deleteTargets && data.deleteTargets.length > 0) {
            const labels = ['A', 'B', 'C', 'D', 'E', 'F']; // 최대 6개까지 지원
            explanationTitle = '🗑️ 삭제 대상 설명';
            
            data.deleteTargets.forEach((target, index) => {
                if (target && (typeof target === 'string' ? target.trim() : target.text && target.text.trim())) {
                    const label = labels[index] || (index + 1);
                    const targetText = typeof target === 'string' ? target : target.text;
                    const reason = typeof target === 'string' ? '삭제 대상' : target.reason || '삭제 대상';
                    
                    // 원문에서 해당 부분을 라벨과 함께 하이라이트 (삭제: 취소선 + 빨간 배경)
                    const regex = new RegExp(targetText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                    processedPassage = processedPassage.replace(regex, 
                        `<span style="background-color: #ffebee; color: #c62828; text-decoration: line-through; padding: 2px 4px; border-radius: 3px; position: relative;">
                            <sup style="background-color: #c62828; color: white; font-size: 10px; padding: 1px 3px; border-radius: 2px; margin-left: 2px;">${label}</sup>$&
                        </span>`
                    );
                    
                    // 설명 섹션에 추가
                    targetExplanations += `
                        <div style="margin-bottom: 10px; padding: 8px; border-left: 3px solid #c62828; background-color: #fafafa;">
                            <strong style="color: #c62828;">${label}:</strong> <span style="font-size: 0.9em; color: #666;">${reason}</span>
                        </div>
                    `;
                }
            });
        } else if (data.summaryType === 'select' && data.selectTargets && data.selectTargets.length > 0) {
            const labels = ['A', 'B', 'C', 'D', 'E', 'F']; // 최대 6개까지 지원
            explanationTitle = '🎯 선택 대상 설명';
            
            data.selectTargets.forEach((target, index) => {
                if (target && (typeof target === 'string' ? target.trim() : target.text && target.text.trim())) {
                    const label = labels[index] || (index + 1);
                    const targetText = typeof target === 'string' ? target : target.text;
                    const reason = typeof target === 'string' ? '선택 대상' : target.reason || '선택 대상';
                    
                    // 원문에서 해당 부분을 라벨과 함께 하이라이트 (선택: 굵은 빨간 글씨)
                    const regex = new RegExp(targetText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                    processedPassage = processedPassage.replace(regex, 
                        `<span style="color: #c62828; font-weight: bold; position: relative;">
                            <sup style="background-color: #c62828; color: white; font-size: 10px; padding: 1px 3px; border-radius: 2px; margin-right: 2px;">${label}</sup>$&
                        </span>`
                    );
                    
                    // 설명 섹션에 추가
                    targetExplanations += `
                        <div style="margin-bottom: 10px; padding: 8px; border-left: 3px solid #c62828; background-color: #fafafa;">
                            <strong style="color: #c62828;">${label}:</strong> <span style="font-size: 0.9em; color: #666;">${reason}</span>
                        </div>
                    `;
                }
            });
        } else if (data.summaryType === 'generalize' && data.generalizeTargets && data.generalizeTargets.length > 0) {
            const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
            explanationTitle = '🔄 일반화 대상 설명';
            
            data.generalizeTargets.forEach((target, index) => {
                if (target && target.text && target.text.trim()) {
                    const label = labels[index] || (index + 1);
                    const reason = target.reason || '일반화 대상';
                    const generalizedForm = target.generalized_form || '상위 개념';
                    
                    // 설명 섹션에 추가
                    targetExplanations += `
                        <div style="margin-bottom: 10px; padding: 8px; border-left: 3px solid #f39c12; background-color: #fefaf0;">
                            <strong style="color: #f39c12;">${label}:</strong> 
                            <div style="font-size: 0.9em; color: #666; margin-top: 4px;">
                                <strong>구체적 내용:</strong> ${target.text}<br>
                                <strong>일반화 이유:</strong> ${reason}<br>
                                <strong>일반화 결과:</strong> <span style="color: #e67e22; font-weight: bold;">"${generalizedForm}"</span>
                            </div>
                        </div>
                    `;
                }
            });
        } else if (data.summaryType === 'reconstruct' && data.reconstructTargets && data.reconstructTargets.length > 0) {
            const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
            explanationTitle = '🔧 재구성 대상 설명';
            
            data.reconstructTargets.forEach((target, index) => {
                if (target && target.text && target.text.trim()) {
                    const label = labels[index] || (index + 1);
                    const reason = target.reason || '재구성 대상';
                    const reconstructedForm = target.reconstructed_form || '이해하기 쉬운 표현';
                    
                    // 설명 섹션에 추가
                    targetExplanations += `
                        <div style="margin-bottom: 10px; padding: 8px; border-left: 3px solid #9c27b0; background-color: #faf5ff;">
                            <strong style="color: #9c27b0;">${label}:</strong> 
                            <div style="font-size: 0.9em; color: #666; margin-top: 4px;">
                                <strong>복잡한 내용:</strong> ${target.text}<br>
                                <strong>재구성 이유:</strong> ${reason}<br>
                                <strong>재구성 결과:</strong> <span style="color: #8e24aa; font-weight: bold;">"${reconstructedForm}"</span>
                            </div>
                        </div>
                    `;
                }
            });
        }

        // 선택 과정 단계별 설명 생성 (선택 요약의 경우)
        let selectionProcessSection = '';
        if (data.summaryType === 'select' && data.selectTargets && data.selectTargets.length > 0) {
            const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
            
            // 1단계: 선택된 부분들 추출
            let extractedParts = '';
            data.selectTargets.forEach((target, index) => {
                if (target && (typeof target === 'string' ? target.trim() : target.text && target.text.trim())) {
                    const label = labels[index] || (index + 1);
                    const targetText = typeof target === 'string' ? target : target.text;
                    extractedParts += `
                        <div style="margin-bottom: 8px; padding: 8px; background-color: #fff; border: 1px solid #e0e0e0; border-radius: 4px;">
                            <strong style="color: #c62828;">${label}:</strong> "${targetText}"
                        </div>
                    `;
                }
            });

            // 1,2단계 + 유저 입력칸 + 버튼
            selectionProcessSection = `
                <div style="margin-bottom: 20px; padding: 15px; background-color: #e3f2fd; border-radius: 6px;">
                    <h5 style="margin: 0 0 15px 0; color: #1976d2;">🔄 요약 과정</h5>
                    
                    <div style="margin-bottom: 15px;">
                        <h6 style="margin: 0 0 8px 0; color: #1976d2; font-size: 0.95em;">1단계: 핵심 부분 추출</h6>
                        ${extractedParts}
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h6 style="margin: 0 0 8px 0; color: #1976d2; font-size: 0.95em;">2단계: 연결 및 조합</h6>
                        <div style="padding: 8px; background-color: #fff; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 0.9em; color: #666;">
                            선택된 핵심 부분들을 자연스럽게 연결하여 하나의 문장으로 조합합니다. 불필요한 연결어를 제거하고 의미가 통하도록 순서를 조정합니다.
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <h6 style="margin: 0 0 8px 0; color: #1976d2; font-size: 0.95em;">✏️ 요약문 작성</h6>
                        <textarea id="userSummaryInput" placeholder="위의 선택된 핵심 부분들을 참고하여 요약문을 작성해보세요..." 
                                  style="width: 100%; height: 80px; padding: 10px; border: 2px solid #1976d2; border-radius: 6px; 
                                         font-family: inherit; font-size: 0.9em; resize: vertical; background-color: #fff;">
                        </textarea>
                    </div>
                    
                    <div style="text-align: center; margin-bottom: 15px;">
                        <button id="checkModelSummaryBtn" 
                                style="background: linear-gradient(135deg, #1976d2, #1565c0); color: white; border: none; 
                                       padding: 12px 24px; border-radius: 6px; font-size: 0.95em; font-weight: bold; 
                                       cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                                onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.2)';"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">
                            📝 모범 요약문 확인하기
                        </button>
                    </div>
                    
                    <div id="stage3Container" style="display: none;">
                        <h6 style="margin: 0 0 8px 0; color: #1976d2; font-size: 0.95em;">3단계: 완성된 요약문</h6>
                        <div id="modelSummaryAnswer" style="padding: 12px; background-color: #f8f9fa; border: 1px solid #28a745; 
                             border-radius: 6px; color: #333; font-weight: 500;">
                            <!-- 모범 요약문이 여기에 표시됩니다 -->
                        </div>
                    </div>
                </div>
            `;
        }

        // 팝업 내용 설정
        let statusText = '';
        if (data.summaryType === 'delete') {
            statusText = ' <span style="font-size: 0.8em; color: #c62828;">(삭제 대상 표시)</span>';
        } else if (data.summaryType === 'select') {
            statusText = ' <span style="font-size: 0.8em; color: #c62828;">(선택 대상 표시)</span>';
        } else if (data.summaryType === 'generalize') {
            statusText = ' <span style="font-size: 0.8em; color: #f39c12;">(일반화 대상 표시)</span>';
        } else if (data.summaryType === 'reconstruct') {
            statusText = ' <span style="font-size: 0.8em; color: #9c27b0;">(재구성 대상 표시)</span>';
        }

        // 일반화 대상 하이라이트 처리 (일반화 요약의 경우)
        if (data.summaryType === 'generalize' && data.generalizeTargets && data.generalizeTargets.length > 0) {
            const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
            
            data.generalizeTargets.forEach((target, index) => {
                if (target && target.text && target.text.trim()) {
                    const label = labels[index] || (index + 1);
                    const regex = new RegExp(target.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                    processedPassage = processedPassage.replace(
                        regex, 
                        `<mark style="background-color: #fff3cd; border: 2px solid #f39c12; padding: 2px 4px; border-radius: 3px; font-weight: bold;">${target.text} <span style="background-color: #f39c12; color: white; padding: 1px 4px; border-radius: 2px; font-size: 0.8em; margin-left: 2px;">${label}</span></mark>`
                    );
                }
            });
        }

        // 재구성 대상 하이라이트 처리 (재구성 요약의 경우)
        if (data.summaryType === 'reconstruct' && data.reconstructTargets && data.reconstructTargets.length > 0) {
            const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
            
            data.reconstructTargets.forEach((target, index) => {
                if (target && target.text && target.text.trim()) {
                    const label = labels[index] || (index + 1);
                    const regex = new RegExp(target.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                    processedPassage = processedPassage.replace(
                        regex, 
                        `<mark style="background-color: #f3e5f5; border: 2px solid #9c27b0; padding: 2px 4px; border-radius: 3px; font-weight: bold;">${target.text} <span style="background-color: #9c27b0; color: white; padding: 1px 4px; border-radius: 2px; font-size: 0.8em; margin-left: 2px;">${label}</span></mark>`
                    );
                }
            });
        }

        // 삭제, 선택, 일반화 요약에 따라 다른 구조 적용
        if (data.summaryType === 'delete') {
            popupContent.innerHTML = `
                <div style="line-height: 1.6;">
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 6px;">
                        <h5 style="margin: 0 0 10px 0; color: #495057;">📝 원문${statusText}</h5>
                        <div style="color: #333; white-space: pre-line;">${processedPassage}</div>
                    </div>
                    
                    ${targetExplanations ? `
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #ffebee; border-radius: 6px;">
                        <h5 style="margin: 0 0 15px 0; color: #c62828;">${explanationTitle}</h5>
                        ${targetExplanations}
                    </div>
                    ` : ''}
                    
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #e3f2fd; border-radius: 6px;">
                        <h5 style="margin: 0 0 15px 0; color: #1976d2;">✏️ 요약문 작성</h5>
                        <div style="margin-bottom: 15px;">
                            <textarea id="userDeleteSummaryInput" placeholder="삭제 대상을 제거하여 핵심만 남긴 요약문을 작성해보세요..." 
                                      style="width: 100%; height: 80px; padding: 10px; border: 2px solid #c62828; border-radius: 6px; 
                                             font-family: inherit; font-size: 0.9em; resize: vertical; background-color: #fff;">
                            </textarea>
                        </div>
                        
                        <div style="text-align: center; margin-bottom: 15px;">
                            <button id="checkDeleteModelSummaryBtn" 
                                    style="background: linear-gradient(135deg, #c62828, #b71c1c); color: white; border: none; 
                                           padding: 12px 24px; border-radius: 6px; font-size: 0.95em; font-weight: bold; 
                                           cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                                    onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.2)';"
                                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">
                                📝 모범 요약문 확인하기
                            </button>
                        </div>
                        
                        <div id="deleteModelSummaryContainer" style="display: none;">
                            <h6 style="margin: 0 0 8px 0; color: #28a745; font-size: 0.95em;">✅ 모범 요약문</h6>
                            <div id="deleteModelSummaryAnswer" style="padding: 12px; background-color: #e8f5e8; border: 1px solid #28a745; 
                                 border-radius: 6px; color: #333; font-weight: 500;">
                                <!-- 모범 요약문이 여기에 표시됩니다 -->
                            </div>
                        </div>
                    </div>

                    <div style="padding: 15px; background-color: #fff3cd; border-radius: 6px;">
                        <h5 style="margin: 0 0 10px 0; color: #856404;">💡 요약 포인트</h5>
                        <div style="color: #333; font-size: 0.95em;">
                            ${getSummaryTip(data.summaryType)}
                        </div>
                    </div>
                </div>
            `;
        } else if (data.summaryType === 'generalize') {
            // 일반화 요약용 UI
            popupContent.innerHTML = `
                <div style="line-height: 1.6;">
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 6px;">
                        <h5 style="margin: 0 0 10px 0; color: #495057;">📝 원문${statusText}</h5>
                        <div style="color: #333; white-space: pre-line;">${processedPassage}</div>
                    </div>
                    
                    ${targetExplanations ? `
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #fefaf0; border-radius: 6px;">
                        <h5 style="margin: 0 0 15px 0; color: #f39c12;">${explanationTitle}</h5>
                        ${targetExplanations}
                    </div>
                    ` : ''}
                    
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #e3f2fd; border-radius: 6px;">
                        <h5 style="margin: 0 0 15px 0; color: #1976d2;">✏️ 요약문 작성</h5>
                        <div style="margin-bottom: 15px;">
                            <textarea id="userGeneralizeSummaryInput" placeholder="구체적인 내용들을 상위 개념으로 일반화하여 요약문을 작성해보세요..." 
                                      style="width: 100%; height: 80px; padding: 10px; border: 2px solid #f39c12; border-radius: 6px; 
                                             font-family: inherit; font-size: 0.9em; resize: vertical; background-color: #fff;">
                            </textarea>
                        </div>
                        
                        <div style="text-align: center; margin-bottom: 15px;">
                            <button id="checkGeneralizeModelSummaryBtn" 
                                    style="background: linear-gradient(135deg, #f39c12, #e67e22); color: white; border: none; 
                                           padding: 12px 24px; border-radius: 6px; font-size: 0.95em; font-weight: bold; 
                                           cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                                    onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.2)';"
                                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">
                                📝 모범 요약문 확인하기
                            </button>
                        </div>
                        
                        <div id="generalizeModelSummaryContainer" style="display: none;">
                            <h6 style="margin: 0 0 8px 0; color: #28a745; font-size: 0.95em;">✅ 모범 요약문</h6>
                            <div id="generalizeModelSummaryAnswer" style="padding: 12px; background-color: #e8f5e8; border: 1px solid #28a745; 
                                 border-radius: 6px; color: #333; font-weight: 500;">
                                <!-- 모범 요약문이 여기에 표시됩니다 -->
                            </div>
                        </div>
                    </div>

                    <div style="padding: 15px; background-color: #fff3cd; border-radius: 6px;">
                        <h5 style="margin: 0 0 10px 0; color: #856404;">💡 요약 포인트</h5>
                        <div style="color: #333; font-size: 0.95em;">
                            ${getSummaryTip(data.summaryType)}
                        </div>
                    </div>
                </div>
            `;
        } else if (data.summaryType === 'reconstruct') {
            // 재구성 요약용 UI
            popupContent.innerHTML = `
                <div style="line-height: 1.6;">
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 6px;">
                        <h5 style="margin: 0 0 10px 0; color: #495057;">📝 원문${statusText}</h5>
                        <div style="color: #333; white-space: pre-line;">${processedPassage}</div>
                    </div>
                    
                    ${targetExplanations ? `
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #faf5ff; border-radius: 6px;">
                        <h5 style="margin: 0 0 15px 0; color: #9c27b0;">${explanationTitle}</h5>
                        ${targetExplanations}
                    </div>
                    ` : ''}
                    
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #e3f2fd; border-radius: 6px;">
                        <h5 style="margin: 0 0 15px 0; color: #1976d2;">✏️ 요약문 작성</h5>
                        <div style="margin-bottom: 15px;">
                            <textarea id="userReconstructSummaryInput" placeholder="복잡한 내용을 이해하기 쉽게 재구성하여 요약문을 작성해보세요..." 
                                      style="width: 100%; height: 80px; padding: 10px; border: 2px solid #9c27b0; border-radius: 6px; 
                                             font-family: inherit; font-size: 0.9em; resize: vertical; background-color: #fff;">
                            </textarea>
                        </div>
                        
                        <div style="text-align: center; margin-bottom: 15px;">
                            <button id="checkReconstructModelSummaryBtn" 
                                    style="background: linear-gradient(135deg, #9c27b0, #7b1fa2); color: white; border: none; 
                                           padding: 12px 24px; border-radius: 6px; font-size: 0.95em; font-weight: bold; 
                                           cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                                    onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.2)';"
                                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">
                                📝 모범 요약문 확인하기
                            </button>
                        </div>
                        
                        <div id="reconstructModelSummaryContainer" style="display: none;">
                            <h6 style="margin: 0 0 8px 0; color: #28a745; font-size: 0.95em;">✅ 모범 요약문</h6>
                            <div id="reconstructModelSummaryAnswer" style="padding: 12px; background-color: #e8f5e8; border: 1px solid #28a745; 
                                 border-radius: 6px; color: #333; font-weight: 500;">
                                <!-- 모범 요약문이 여기에 표시됩니다 -->
                            </div>
                        </div>
                    </div>

                    <div style="padding: 15px; background-color: #fff3cd; border-radius: 6px;">
                        <h5 style="margin: 0 0 10px 0; color: #856404;">💡 요약 포인트</h5>
                        <div style="color: #333; font-size: 0.95em;">
                            ${getSummaryTip(data.summaryType)}
                        </div>
                    </div>
                </div>
            `;
        } else {
            // 선택 요약이나 기타 유형의 기존 구조 유지
            popupContent.innerHTML = `
                <div style="line-height: 1.6;">
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 6px;">
                        <h5 style="margin: 0 0 10px 0; color: #495057;">📝 원문${statusText}</h5>
                        <div style="color: #333; white-space: pre-line;">${processedPassage}</div>
                    </div>
                    
                    ${targetExplanations ? `
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #ffebee; border-radius: 6px;">
                        <h5 style="margin: 0 0 15px 0; color: #c62828;">${explanationTitle}</h5>
                        ${targetExplanations}
                    </div>
                    ` : ''}
                    
                    ${selectionProcessSection}
                    
                    ${data.summaryType !== 'select' ? `
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #e8f5e8; border-radius: 6px;">
                        <h5 style="margin: 0 0 10px 0; color: #28a745;">✅ 모범 요약문</h5>
                        <div style="color: #333; white-space: pre-line;">${data.modelAnswer}</div>
                    </div>
                    ` : ''}

                    <div style="padding: 15px; background-color: #fff3cd; border-radius: 6px;">
                        <h5 style="margin: 0 0 10px 0; color: #856404;">💡 요약 포인트</h5>
                        <div style="color: #333; font-size: 0.95em;">
                            ${getSummaryTip(data.summaryType)}
                        </div>
                    </div>
                </div>
            `;
        }

        // 팝업 표시
        popupBackdrop.classList.remove('hidden');
        popupContainer.classList.remove('hidden');

        // 새로운 닫기 버튼에 이벤트 리스너 추가
        const newCloseBtn = popupHeader.querySelector('#popup-close-btn');
        if (newCloseBtn) {
            newCloseBtn.addEventListener('click', closePopup);
        }

        // 모범 요약문 확인 버튼에 이벤트 리스너 추가 (재구성 요약의 경우)
        if (data.summaryType === 'reconstruct') {
            const checkReconstructModelSummaryBtn = document.getElementById('checkReconstructModelSummaryBtn');
            if (checkReconstructModelSummaryBtn) {
                checkReconstructModelSummaryBtn.addEventListener('click', function() {
                    // 모범 요약문 컨테이너 표시
                    const reconstructModelSummaryContainer = document.getElementById('reconstructModelSummaryContainer');
                    const reconstructModelSummaryAnswer = document.getElementById('reconstructModelSummaryAnswer');
                    
                    if (reconstructModelSummaryContainer && reconstructModelSummaryAnswer) {
                        // 모범 요약문 내용 설정
                        reconstructModelSummaryAnswer.innerHTML = `
                            <div style="background-color: #fff; padding: 12px; border-radius: 4px; border-left: 3px solid #28a745;">
                                ${data.modelAnswer}
                            </div>
                        `;
                        
                        // 모범 요약문 컨테이너 표시
                        reconstructModelSummaryContainer.style.display = 'block';
                        
                        // 버튼 텍스트 변경 및 비활성화
                        checkReconstructModelSummaryBtn.innerHTML = '✅ 모범 요약문 확인 완료';
                        checkReconstructModelSummaryBtn.style.background = 'linear-gradient(135deg, #28a745, #1e7e34)';
                        checkReconstructModelSummaryBtn.style.cursor = 'default';
                        checkReconstructModelSummaryBtn.disabled = true;
                        
                        // 모범 요약문으로 부드럽게 스크롤
                        setTimeout(() => {
                            reconstructModelSummaryContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }, 100);
                    }
                });
            }
        }
        
        // 모범 요약문 확인 버튼에 이벤트 리스너 추가 (일반화 요약의 경우)
        if (data.summaryType === 'generalize') {
            const checkGeneralizeModelSummaryBtn = document.getElementById('checkGeneralizeModelSummaryBtn');
            if (checkGeneralizeModelSummaryBtn) {
                checkGeneralizeModelSummaryBtn.addEventListener('click', function() {
                    // 모범 요약문 컨테이너 표시
                    const generalizeModelSummaryContainer = document.getElementById('generalizeModelSummaryContainer');
                    const generalizeModelSummaryAnswer = document.getElementById('generalizeModelSummaryAnswer');
                    
                    if (generalizeModelSummaryContainer && generalizeModelSummaryAnswer) {
                        // 모범 요약문 내용 설정
                        generalizeModelSummaryAnswer.innerHTML = `
                            <div style="background-color: #fff; padding: 12px; border-radius: 4px; border-left: 3px solid #28a745;">
                                ${data.modelAnswer}
                            </div>
                        `;
                        
                        // 모범 요약문 컨테이너 표시
                        generalizeModelSummaryContainer.style.display = 'block';
                        
                        // 버튼 텍스트 변경 및 비활성화
                        checkGeneralizeModelSummaryBtn.innerHTML = '✅ 모범 요약문 확인 완료';
                        checkGeneralizeModelSummaryBtn.style.background = 'linear-gradient(135deg, #28a745, #1e7e34)';
                        checkGeneralizeModelSummaryBtn.style.cursor = 'default';
                        checkGeneralizeModelSummaryBtn.disabled = true;
                        
                        // 모범 요약문으로 부드럽게 스크롤
                        setTimeout(() => {
                            generalizeModelSummaryContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }, 100);
                    }
                });
            }
        }
        
        // 모범 요약문 확인 버튼에 이벤트 리스너 추가 (삭제 요약의 경우)
        if (data.summaryType === 'delete') {
            const checkDeleteModelSummaryBtn = document.getElementById('checkDeleteModelSummaryBtn');
            if (checkDeleteModelSummaryBtn) {
                checkDeleteModelSummaryBtn.addEventListener('click', function() {
                    // 모범 요약문 컨테이너 표시
                    const deleteModelSummaryContainer = document.getElementById('deleteModelSummaryContainer');
                    const deleteModelSummaryAnswer = document.getElementById('deleteModelSummaryAnswer');
                    
                    if (deleteModelSummaryContainer && deleteModelSummaryAnswer) {
                        // 모범 요약문 내용 설정
                        deleteModelSummaryAnswer.innerHTML = `
                            <div style="background-color: #fff; padding: 12px; border-radius: 4px; border-left: 3px solid #28a745;">
                                ${data.modelAnswer}
                            </div>
                        `;
                        
                        // 모범 요약문 컨테이너 표시
                        deleteModelSummaryContainer.style.display = 'block';
                        
                        // 버튼 텍스트 변경 및 비활성화
                        checkDeleteModelSummaryBtn.innerHTML = '✅ 모범 요약문 확인 완료';
                        checkDeleteModelSummaryBtn.style.background = 'linear-gradient(135deg, #28a745, #1e7e34)';
                        checkDeleteModelSummaryBtn.style.cursor = 'default';
                        checkDeleteModelSummaryBtn.disabled = true;
                        
                        // 모범 요약문으로 부드럽게 스크롤
                        setTimeout(() => {
                            deleteModelSummaryContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }, 100);
                    }
                });
            }
        }
        
        // 모범 요약문 확인 버튼에 이벤트 리스너 추가 (선택 요약의 경우)
        if (data.summaryType === 'select') {
            const checkModelSummaryBtn = document.getElementById('checkModelSummaryBtn');
            if (checkModelSummaryBtn) {
                checkModelSummaryBtn.addEventListener('click', function() {
                    // 3단계 컨테이너 표시
                    const stage3Container = document.getElementById('stage3Container');
                    const modelSummaryAnswer = document.getElementById('modelSummaryAnswer');
                    
                    if (stage3Container && modelSummaryAnswer) {
                        // 모범 요약문 내용 설정
                        modelSummaryAnswer.innerHTML = `
                            <div style="background-color: #fff; padding: 12px; border-radius: 4px; border-left: 3px solid #28a745;">
                                ${data.modelAnswer}
                            </div>
                        `;
                        
                        // 3단계 컨테이너 표시
                        stage3Container.style.display = 'block';
                        
                        // 버튼 텍스트 변경 및 비활성화
                        checkModelSummaryBtn.innerHTML = '✅ 모범 요약문 확인 완료';
                        checkModelSummaryBtn.style.backgroundColor = '#28a745';
                        checkModelSummaryBtn.style.cursor = 'default';
                        checkModelSummaryBtn.disabled = true;
                        
                        // 3단계로 부드럽게 스크롤
                        setTimeout(() => {
                            stage3Container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }, 100);
                    }
                });
            }
        }
    }

    /**
     * 요약 유형별 팁을 반환하는 함수
     */
    function getSummaryTip(summaryType) {
        const tips = {
            'delete': '불필요한 수식어, 반복되는 내용, 부수적인 정보를 제거하여 핵심만 남기는 것이 포인트입니다.',
            'select': '글에서 주제를 압축적으로 전달할 수 있는 핵심 키워드나 중심 문장을 선별하여 구성하는 것이 포인트입니다. 선택된 부분만으로도 전체 의미가 전달되어야 합니다.',
            'generalize': '구체적인 사례들을 상위 개념으로 묶어서 포괄적인 표현으로 압축하는 것이 포인트입니다.',
            'reconstruct': '복잡한 내용을 이해하기 쉽게 재구성하고 어려운 표현을 쉬운 말로 바꾸는 것이 포인트입니다.'
        };
        return tips[summaryType] || '효과적인 요약을 위해 핵심 내용을 파악하는 것이 중요합니다.';
    }
    
    /**
     * 선택된 요약 유형에 따라 오른쪽 패널을 업데이트하는 함수
     */
    function updateNonArgumentRightPanel(summaryType) {
        const nonArgumentSummaryPanel = document.getElementById('non-argument-summary-panel');
        const scrollableContent = nonArgumentSummaryPanel.querySelector('.scrollable-content');
        const columnFooter = nonArgumentSummaryPanel.querySelector('.column-footer');
        
        if (summaryType === 'delete') {
            // 삭제 요약용 UI
            scrollableContent.innerHTML = `
                <div class="form-group">
                    <label for="delete-targets-input">삭제가 필요한 부분은?</label>
                    <textarea id="delete-targets-input" class="form-control" 
                              placeholder="제시문에서 삭제해도 좋은 부분을 찾아 나열하세요." 
                              rows="6" style="resize: vertical; min-height: 120px;"></textarea>
                </div>
                <div class="form-group">
                    <label for="non-argument-summary-input">요약문 작성:</label>
                    <textarea id="non-argument-summary-input" class="form-control" 
                              placeholder="삭제 대상을 제거하여 핵심만 남긴 요약문을 작성하세요..." 
                              rows="8" style="resize: vertical; min-height: 160px;"></textarea>
                </div>
            `;
        } else if (summaryType === 'select') {
            // 선택 요약용 UI
            scrollableContent.innerHTML = `
                <div class="form-group">
                    <label for="select-targets-input">선택할 핵심 부분은?</label>
                    <textarea id="select-targets-input" class="form-control" 
                              placeholder="제시문에서 핵심이 되는 키워드나 문장을 찾아 나열하세요." 
                              rows="6" style="resize: vertical; min-height: 120px;"></textarea>
                </div>
                <div class="form-group">
                    <label for="non-argument-summary-input">요약문 작성:</label>
                    <textarea id="non-argument-summary-input" class="form-control" 
                              placeholder="선택한 핵심 부분들을 조합하여 요약문을 작성하세요..." 
                              rows="8" style="resize: vertical; min-height: 160px;"></textarea>
                </div>
            `;
        } else if (summaryType === 'generalize') {
            // 일반화 요약용 UI
            scrollableContent.innerHTML = `
                <div class="form-group">
                    <label for="generalize-targets-input">일반화가 필요한 내용</label>
                    <textarea id="generalize-targets-input" class="form-control" 
                              placeholder="일반화가 필요한 내용들을 나열하고, 일반화 방법을 기술하세요." 
                              rows="6" style="resize: vertical; min-height: 120px;"></textarea>
                </div>
                <div class="form-group">
                    <label for="non-argument-summary-input">요약문 작성:</label>
                    <textarea id="non-argument-summary-input" class="form-control" 
                              placeholder="구체적인 내용들을 상위 개념으로 일반화하여 요약문을 작성하세요..." 
                              rows="8" style="resize: vertical; min-height: 160px;"></textarea>
                </div>
            `;
        } else if (summaryType === 'reconstruct') {
            // 재구성 요약용 UI
            scrollableContent.innerHTML = `
                <div class="form-group">
                    <label for="reconstruct-targets-input">재구성이 필요한 내용</label>
                    <textarea id="reconstruct-targets-input" class="form-control" 
                              placeholder="재구성이 필요한 내용들과 그 이유를 기술하세요." 
                              rows="6" style="resize: vertical; min-height: 120px;"></textarea>
                </div>
                <div class="form-group">
                    <label for="non-argument-summary-input">요약문 작성:</label>
                    <textarea id="non-argument-summary-input" class="form-control" 
                              placeholder="복잡한 내용을 이해하기 쉽게 재구성하여 요약문을 작성하세요..." 
                              rows="8" style="resize: vertical; min-height: 160px;"></textarea>
                </div>
            `;
        } else {
            // 기본 UI (혹시 다른 유형이 추가될 경우)
            scrollableContent.innerHTML = `
                <div class="form-group">
                    <label for="non-argument-summary-input">위 제시문을 선택한 요약 유형에 맞게 요약해보세요:</label>
                    <textarea id="non-argument-summary-input" class="form-control" 
                              placeholder="여기에 요약문을 작성하세요..." 
                              rows="10" style="resize: vertical; min-height: 200px;"></textarea>
                </div>
            `;
        }
    }
    
    // --- 초기화 ---
    resetSummaryForm();
    
    // 요약 유형 라디오 버튼 이벤트 리스너 추가
    const summaryTypeRadios = document.querySelectorAll('input[name="summary-type"]');
    summaryTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                updateNonArgumentRightPanel(this.value);
            }
        });
    });
    
    // 페이지 로드 시 초기 요약 유형에 따라 오른쪽 패널 설정
    const initialSummaryType = document.querySelector('input[name="summary-type"]:checked');
    if (initialSummaryType) {
        updateNonArgumentRightPanel(initialSummaryType.value);
    }
});
