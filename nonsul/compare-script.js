// compare-script.js
document.addEventListener('DOMContentLoaded', () => {
    // '비교하기' 페이지 관련 스크립트
    console.log('compare-script.js loaded');

    const generateBtn = document.getElementById('generate-passages-btn');
    const keywordInput = document.getElementById('keyword-input');
    const passageAContainer = document.querySelector('#passage-a .scrollable-content');
    const passageBContainer = document.querySelector('#passage-b .scrollable-content');
    const detailBtnA = document.querySelector('.detail-btn[data-passage="a"]');
    const detailBtnB = document.querySelector('.detail-btn[data-passage="b"]');

    // 분석 섹션 DOM 요소
    const analysisSectionArgument = document.getElementById('analysis-section-argument');
    const analysisSectionCausal = document.getElementById('analysis-section-causal');
    const passageTypeRadios = document.querySelectorAll('input[name="passage-type"]');
    const argumentFooter = document.getElementById('argument-footer');

    // 인과 설명 분석 DOM 요소
    const addCauseProcessBtn = document.getElementById('add-cause-process-btn');
    const removeCauseProcessBtn = document.getElementById('remove-cause-process-btn');
    const causeProcessContainer = document.getElementById('cause-process-container');
    const submitArgBtn = document.getElementById('submit-analysis-btn');
    const submitCausalBtn = document.querySelector('.submit-causal-btn');

    let logicalStructureData = null; // 모범답안 (논리 구조) 데이터를 저장할 변수
    let fullPassageA = '';
    let fullPassageB = '';

    generateBtn.addEventListener('click', async () => {
        const keyword = keywordInput.value.trim();
        const type = document.querySelector('input[name="passage-type"]:checked').value;
        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;

        if (!keyword) {
            alert('키워드를 입력해주세요.');
            return;
        }

        // 로딩 상태 표시
        generateBtn.disabled = true;
        generateBtn.textContent = '생성 중...';

        // 로딩 메시지를 새로운 .passage-text 구조에 맞게 표시
        const passageAText = document.querySelector('#passage-a .passage-text');
        const passageBText = document.querySelector('#passage-b .passage-text');
        passageAText.textContent = 'AI가 (가) 제시문을 생성하고 있습니다. 잠시만 기다려주세요...';
        passageBText.textContent = 'AI가 (나) 제시문을 생성하고 있습니다. 잠시만 기다려주세요...';

        // 분석 양식 초기화
        resetAnalysisForms();

        try {
            const response = await fetch('/api/generate-comparison-passages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ keyword, type, difficulty }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '서버에서 오류가 발생했습니다.');
            }

            const result = await response.json();
            
            // 전체 제시문 저장
            fullPassageA = result.passage_a;
            fullPassageB = result.passage_b;

            // 결과 표시 (데이터 접근 경로 수정)
            const passageA = result.passage_a;
            const passageB = result.passage_b;

            // 새로운 구조에 맞게 텍스트를 .passage-text에 삽입
            document.querySelector('#passage-a .passage-text').textContent = passageA;
            document.querySelector('#passage-b .passage-text').textContent = passageB;
            
            // 내용이 넘칠 경우에만 "자세히 보기" 버튼을 표시합니다.
            if (passageAContainer.scrollHeight > passageAContainer.clientHeight) {
                detailBtnA.style.display = 'block';
            } else {
                detailBtnA.style.display = 'none';
            }
            if (passageBContainer.scrollHeight > passageBContainer.clientHeight) {
                detailBtnB.style.display = 'block';
            } else {
                detailBtnB.style.display = 'none';
            }

            // 모범답안 데이터 저장 및 분석 양식 업데이트
            logicalStructureData = result.logicalStructure;
            updateAnalysisUI(type);
            console.log('논리 구조 데이터가 저장되었습니다.', logicalStructureData);

        } catch (error) {
            console.error('Error generating passages:', error);
            alert(`제시문 생성 중 오류가 발생했습니다: ${error.message}`);
            // 오류 메시지도 .passage-text에 표시
            const passageATextOnError = document.querySelector('#passage-a .passage-text');
            const passageBTextOnError = document.querySelector('#passage-b .passage-text');
            if (passageATextOnError) passageATextOnError.textContent = '오류가 발생했습니다. 키워드를 확인하고 다시 시도해주세요.';
            if (passageBTextOnError) passageBTextOnError.textContent = '오류가 발생했습니다.';
        } finally {
            // 로딩 상태 해제
            generateBtn.disabled = false;
            generateBtn.textContent = '제시문 생성';
        }
    });

    // '모범답안 확인하기' 버튼 및 팝업 관련 로직
    const modelAnswerPopup = document.getElementById('model-answer-popup');
    const modelAnswerContent = document.getElementById('model-answer-content');
    const modelAnswerCloseBtn = document.getElementById('model-answer-close-btn');

    const handleSubmit = async (e) => {
        if (!logicalStructureData) {
            alert('먼저 제시문을 생성해주세요.');
            return;
        }

        const btn = e.currentTarget;
        const originalBtnText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '생성 중...';

        try {
            const response = await fetch('/api/generate-comparison-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logicalStructure: logicalStructureData }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '모범답안 생성 중 서버 오류가 발생했습니다.');
            }

            const result = await response.json();
            displayModelAnswer(logicalStructureData, result.comparisonText);

        } catch (error) {
            console.error('Error generating comparison text:', error);
            alert(`모범답안 생성 중 오류가 발생했습니다: ${error.message}`);
        } finally {
            btn.disabled = false;
            btn.textContent = originalBtnText;
        }
    };
    
    if(submitArgBtn) submitArgBtn.addEventListener('click', handleSubmit);
    if(submitCausalBtn) submitCausalBtn.addEventListener('click', handleSubmit);
    
    modelAnswerCloseBtn.addEventListener('click', () => {
        modelAnswerPopup.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == modelAnswerPopup) {
            modelAnswerPopup.style.display = 'none';
        }
    });

    // '인과' 유형 선택 시 UI 변경
    passageTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateAnalysisUI(e.target.value);
        });
    });

    // 동적으로 세부 쟁점 필드 추가/삭제 (기존 코드)
    const addSubIssueBtn = document.getElementById('add-sub-issue-btn');
    const removeSubIssueBtn = document.getElementById('remove-sub-issue-btn');
    const dynamicIssuesContainer = document.getElementById('dynamic-issues-container');

    const updateIssueLabels = () => {
        const issuePairs = dynamicIssuesContainer.querySelectorAll('.sub-issue-item');
        issuePairs.forEach((pair, index) => {
            const label = pair.querySelector('label');
            if (label) {
                label.textContent = `세부 쟁점 ${index + 1}`;
            }
        });
    };
    
    if (addSubIssueBtn) {
        addSubIssueBtn.addEventListener('click', () => {
            const issueCount = dynamicIssuesContainer.children.length + 1;
            const newIssue = document.createElement('div');
            newIssue.className = 'sub-issue-item';
            newIssue.innerHTML = `
                <div class="analysis-group">
                    <label for="sub-issue-${issueCount}">세부 쟁점 ${issueCount}</label>
                    <textarea id="sub-issue-${issueCount}" class="form-control sub-issue" rows="2" placeholder="세부 쟁점 ${issueCount}을(를) 입력하세요."></textarea>
                </div>
                <div class="analysis-group">
                    <label>입장</label>
                    <div class="stance-container">
                        <textarea class="form-control stance-a" rows="3" placeholder="(가)의 입장을 입력하세요."></textarea>
                        <textarea class="form-control stance-b" rows="3" placeholder="(나)의 입장을 입력하세요."></textarea>
                    </div>
                </div>
            `;
            dynamicIssuesContainer.appendChild(newIssue);
        });
    }
    
    if (removeSubIssueBtn) {
        removeSubIssueBtn.addEventListener('click', () => {
            if (dynamicIssuesContainer.children.length > 1) { // 최소 1개는 남김
                dynamicIssuesContainer.lastElementChild.remove();
            }
        });
    }

    // 동적으로 '원인/과정' 필드 추가/삭제
    const updateCauseProcessLabels = () => {
        const items = causeProcessContainer.querySelectorAll('.cause-process-item');
        items.forEach((item, index) => {
            const label = item.querySelector('label');
            const newIndex = index + 1;
            if (label) {
                label.textContent = `원인/과정 ${newIndex}`;
            }
            const textareas = item.querySelectorAll('textarea');
            if (textareas.length === 4) {
                textareas[0].placeholder = `(가)의 원인 ${newIndex}을(를) 입력하세요.`;
                textareas[1].placeholder = `(가)의 과정 ${newIndex}을(를) 입력하세요.`;
                textareas[2].placeholder = `(나)의 원인 ${newIndex}을(를) 입력하세요.`;
                textareas[3].placeholder = `(나)의 과정 ${newIndex}을(를) 입력하세요.`;
            }
        });
    };

    addCauseProcessBtn.addEventListener('click', () => {
        const newIndex = causeProcessContainer.children.length + 1;
        const newCauseProcessPair = document.createElement('div');
        newCauseProcessPair.classList.add('form-group', 'cause-process-item');
        newCauseProcessPair.innerHTML = `
            <label>원인/과정 ${newIndex}</label>
            <div class="cause-process-grid">
                <div class="cause-process-box">
                    <textarea class="form-control" rows="2" placeholder="(가)의 원인 ${newIndex}을(를) 입력하세요."></textarea>
                    <textarea class="form-control" rows="3" placeholder="(가)의 과정 ${newIndex}을(를) 입력하세요."></textarea>
                </div>
                <div class="cause-process-box">
                    <textarea class="form-control" rows="2" placeholder="(나)의 원인 ${newIndex}을(를) 입력하세요."></textarea>
                    <textarea class="form-control" rows="3" placeholder="(나)의 과정 ${newIndex}을(를) 입력하세요."></textarea>
                </div>
            </div>
        `;
        causeProcessContainer.appendChild(newCauseProcessPair);
        updateCauseProcessLabels();
    });

    removeCauseProcessBtn.addEventListener('click', () => {
        if (causeProcessContainer.children.length > 1) { // 최소 1개는 남김
            causeProcessContainer.lastElementChild.remove();
            updateCauseProcessLabels();
        }
    });

    // 초기 로드 시 첫 번째 레이블 업데이트
    updateIssueLabels();
    updateCauseProcessLabels();

    // 제시문 상세 보기 패널 관련 로직
    const detailPanel = document.getElementById('detail-panel');
    const detailPanelTitle = document.getElementById('detail-panel-title');
    const detailPanelBody = document.getElementById('detail-panel-body');
    const detailPanelCloseBtn = document.getElementById('detail-panel-close-btn');

    const openDetailPanel = (passageType) => {
        if (passageType === 'a') {
            detailPanelTitle.textContent = '제시문 (가) 전체 내용';
            detailPanelBody.innerHTML = `<p>${fullPassageA.replace(/\n/g, '<br>')}</p>`;
        } else {
            detailPanelTitle.textContent = '제시문 (나) 전체 내용';
            detailPanelBody.innerHTML = `<p>${fullPassageB.replace(/\n/g, '<br>')}</p>`;
        }
        detailPanel.style.display = 'flex';
    };

    detailBtnA.addEventListener('click', () => openDetailPanel('a'));
    detailBtnB.addEventListener('click', () => openDetailPanel('b'));

    detailPanelCloseBtn.addEventListener('click', () => {
        detailPanel.style.display = 'none';
    });

    function displayModelAnswer(data, comparisonText) {
        let contentHtml = '';

        // 데이터 유형에 따라 다른 템플릿을 사용
        if (data.phenomenon) { // 인과적 설명문 데이터
            const formatCausalStructure = (expData, title) => {
                let expHtml = `<div><h5>${title}</h5>`;
                expHtml += `<p><strong>원인 유형:</strong> ${expData.cause_type}</p>`;
                if (expData.causes && expData.causes.length > 0) {
                    expData.causes.forEach((c, index) => {
                        expHtml += `<div class="reason-block">
                                      <p><strong>원인 ${index + 1}:</strong> ${c.cause}</p>
                                      <p><strong>과정 ${index + 1}:</strong> ${c.process}</p>
                                   </div>`;
                    });
                }
                expHtml += `</div>`;
                return expHtml;
            };

            contentHtml = `
                <h4>설명 대상 현상</h4>
                <p>${data.phenomenon}</p>
                <hr>
                ${formatCausalStructure(data.explanation_a, '(가) 설명문 분석')}
                <hr>
                ${formatCausalStructure(data.explanation_b, '(나) 설명문 분석')}
            `;
        } else { // 기존 논증 데이터
            contentHtml = `
                <h4>공통 쟁점</h4>
                <p>${data.main_issue}</p>
                <h4>세부 쟁점</h4>
                <ul>
                    ${data.sub_issues.map(issue => `<li>${issue}</li>`).join('')}
                </ul>
                <hr>
            `;

            const formatPassageStructure = (passageData, title) => {
                let passageHtml = `<div><h5>${title}</h5>`;
                passageHtml += `<p><strong>주장:</strong> ${passageData.claim}</p>`;
                passageData.reasons.forEach((r, index) => {
                    passageHtml += `<div class="reason-block">
                                      <p><strong>근거 ${index + 1}:</strong> ${r.reason}</p>
                                      <p><strong>근거 ${index + 1}의 근거:</strong> ${r.support}</p>
                                   </div>`;
                });
                passageHtml += `</div>`;
                return passageHtml;
            };

            contentHtml += formatPassageStructure(data.passage_a, '(가) 제시문 논리 구조');
            contentHtml += formatPassageStructure(data.passage_b, '(나) 제시문 논리 구조');
        }

        if (comparisonText) {
            contentHtml += `
                <hr>
                <h4 style="margin-top: 1.5rem;">종합 비교 분석</h4>
                <p>${comparisonText.replace(/\n/g, '<br>')}</p>
            `;
        }

        modelAnswerContent.innerHTML = contentHtml;
        modelAnswerPopup.style.display = 'flex';
    }

    function updateAnalysisUI(type) {
        if (type === 'argument') {
            analysisSectionArgument.style.display = 'flex';
            analysisSectionCausal.style.display = 'none';
            if(argumentFooter) argumentFooter.style.display = 'block';
        } else if (type === 'causal') {
            analysisSectionArgument.style.display = 'none';
            analysisSectionCausal.style.display = 'flex';
            if(argumentFooter) argumentFooter.style.display = 'none';
        }
    }

    function resetAnalysisForms() {
        document.getElementById('analysis-form-argument').reset();
        document.getElementById('analysis-form-causal').reset();

        // 동적으로 추가된 필드들 삭제
        const dynamicIssues = dynamicIssuesContainer.querySelectorAll('.sub-issue-item');
        // 첫번째 자식을 제외한 나머지 모두 삭제
        for (let i = dynamicIssues.length - 1; i > 0; i--) {
            dynamicIssues[i].remove();
        }

        const dynamicCauses = causeProcessContainer.querySelectorAll('.cause-process-item');
        for (let i = dynamicCauses.length - 1; i > 0; i--) {
            dynamicCauses[i].remove();
        }
        updateCauseProcessLabels();
    }
}); 