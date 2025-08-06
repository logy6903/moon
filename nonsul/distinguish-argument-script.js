// '논증 구분하기' 페이지를 위한 스크립트 파일입니다.
console.log("distinguish-argument-script.js loaded");

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const submitBtn = document.getElementById('submit-btn');
    const keywordInput = document.getElementById('keyword-input');
    const passageDisplay = document.getElementById('passage-display');
    const choiceBtns = document.querySelectorAll('.choice-btn');
    const subjectInput = document.getElementById('subject-input');

    // --- 팝업 관련 요소 ---
    const resultPopup = document.getElementById('result-popup');
    const resultPopupHeader = document.getElementById('result-popup-header');
    const resultPopupBody = document.getElementById('result-popup-body');
    const resultPopupCloseBtn = document.getElementById('result-popup-close-btn');
    const newProblemBtn = document.getElementById('new-problem-btn');
    
    let correctPassageType = null;
    let explanation = null;
    let selectedType = null;
    let correctCoreSubject = null;
    let logicalStructure = null;

    // 제시문 생성
    generateBtn.addEventListener('click', async () => {
        const keyword = keywordInput.value.trim();
        if (!keyword) {
            alert('키워드를 입력해주세요.');
            return;
        }

        // Reset
        passageDisplay.innerHTML = '<p class="placeholder-text">제시문을 생성 중입니다...</p>';
        submitBtn.disabled = true;
        choiceBtns.forEach(btn => btn.classList.remove('selected'));
        selectedType = null;
        subjectInput.value = '';
        
        try {
            const response = await fetch('/api/generate-distinction-passage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword })
            });

            if (!response.ok) {
                let errorMsg = `서버 오류: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMsg = errorData.error;
                    }
                } catch (e) {
                    // 응답이 JSON이 아닐 경우, 기존 메시지 사용
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            passageDisplay.innerHTML = `<p>${data.passageText.replace(/\n/g, '<br>')}</p>`;
            correctPassageType = data.passageType;
            explanation = data.explanation;
            correctCoreSubject = data.coreSubject;
            logicalStructure = data.logicalStructure;

        } catch (error) {
            passageDisplay.innerHTML = `<p class="placeholder-text" style="color: red;">오류: ${error.message}</p>`;
            console.error(error);
        }
    });

    // 유형 선택
    choiceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            choiceBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedType = btn.dataset.type;
            submitBtn.disabled = !subjectInput.value.trim(); // 중심문장이 입력되어야만 활성화
        });
    });

    subjectInput.addEventListener('input', () => {
        submitBtn.disabled = !(selectedType && subjectInput.value.trim());
    });

    // 모범답안 확인 (제출하기)
    submitBtn.addEventListener('click', () => {
        const userSubject = subjectInput.value.trim();
        if (!selectedType || !userSubject) {
            alert('제시문의 종류를 선택하고 중심문장을 입력해주세요.');
            return;
        }

        // 기타 서브타입 고려하여 비교
        const isCorrectType = selectedType === correctPassageType || 
                             (selectedType === '기타' && correctPassageType.startsWith('기타'));
        const isCorrectSubject = userSubject === correctCoreSubject;
        const isAllCorrect = isCorrectType && isCorrectSubject;
        
        // 디버깅용 로그
        console.log('correctPassageType:', correctPassageType);
        console.log('logicalStructure:', logicalStructure);
        console.log('correctCoreSubject:', correctCoreSubject);
        
        // 논리구조에 따른 상세 정보 생성
        let structureDetails = '';
        if (logicalStructure) {
            if (correctPassageType === '논증' && logicalStructure.type === 'argument') {
                structureDetails = `
                    <h4>논증 구조</h4>
                    <p><strong>쟁점:</strong> ${logicalStructure.issue}</p>
                    <p><strong>주장(결론):</strong> ${logicalStructure.claim}</p>
                    <p><strong>근거(이유):</strong></p>
                    <ul>
                        ${logicalStructure.grounds.map(ground => `<li>${ground}</li>`).join('')}
                    </ul>
                `;
            } else if (correctPassageType.startsWith('기타') && logicalStructure.type === 'non_argument') {
                structureDetails = `
                    <h4>글의 구조</h4>
                    <p><strong>글의 주제:</strong> ${logicalStructure.topicSentence}</p>
                    <p><strong>중심문장:</strong> ${logicalStructure.centralSentence}</p>
                    <p><strong>부연 설명:</strong></p>
                    <ul>
                        ${logicalStructure.supportingSentences.map(sentence => `<li>${sentence}</li>`).join('')}
                    </ul>
                    ${logicalStructure.contentSummary ? `
                    <br>
                    <h4>제시문 내용 요약</h4>
                    <p><strong>내용:</strong> ${logicalStructure.contentSummary}</p>
                    ` : ''}
                `;
            }
        }

        // 모범답안 내용 생성 - 더 안전한 방식으로 수정
        let answerContent = '';
        
        if (correctPassageType === '논증' && logicalStructure?.type === 'argument') {
            // 논증의 경우 - logicalStructure 데이터 우선 사용
            const issue = logicalStructure.issue || '쟁점을 확인할 수 없습니다';
            const claim = logicalStructure.claim || '주장을 확인할 수 없습니다';
            const grounds = logicalStructure.grounds || [];
            
            answerContent = `
                <h4>모범답안</h4>
                <p><strong>글의 종류:</strong> ${correctPassageType}</p>
                <p><strong>중심문장:</strong> ${claim}</p>
                <br>
                <h4>논증 구조</h4>
                <p><strong>쟁점:</strong> ${issue}</p>
                <p><strong>주장:</strong> ${claim}</p>
                <p><strong>근거:</strong></p>
                <ul>
                    ${grounds.length > 0 
                        ? grounds.map(ground => `<li>${ground}</li>`).join('') 
                        : '<li>근거를 확인할 수 없습니다.</li>'}
                </ul>
            `;
        } else if (correctPassageType.startsWith('기타') && logicalStructure?.type === 'non_argument') {
            // 비논증의 경우 - logicalStructure 데이터 우선 사용
            const centralSentence = logicalStructure.centralSentence || '중심문장을 확인할 수 없습니다';
            const contentSummary = logicalStructure.contentSummary || '제시문 요약을 확인할 수 없습니다';
            
            answerContent = `
                <h4>모범답안</h4>
                <p><strong>글의 종류:</strong> ${correctPassageType}</p>
                <p><strong>중심문장:</strong> ${centralSentence}</p>
                <br>
                <h4>제시문 요약</h4>
                <p>${contentSummary}</p>
            `;
        } else {
            // 기본 fallback - logicalStructure가 없거나 타입이 맞지 않는 경우
            answerContent = `
                <h4>모범답안</h4>
                <p><strong>글의 종류:</strong> ${correctPassageType}</p>
                <p><strong>중심문장:</strong> ${correctCoreSubject}</p>
                <br>
                <p><em>상세 구조 정보를 확인할 수 없습니다.</em></p>
            `;
        }

        resultPopupBody.innerHTML = `
            ${answerContent}
            <br>
            <h4>해설</h4>
            <div style="line-height: 1.6;">${explanation.replace(/\n/g, '<br>')}</div>
        `;
        resultPopup.style.display = 'flex';
    });

    // --- 팝업 기능 (닫기, 새 문제, 드래그) ---
    resultPopupCloseBtn.addEventListener('click', () => {
        resultPopup.style.display = 'none';
    });

    newProblemBtn.addEventListener('click', () => {
        // 팝업 닫기
        resultPopup.style.display = 'none';

        // 상태 초기화
        correctPassageType = null;
        explanation = null;
        selectedType = null;
        correctCoreSubject = null;
        logicalStructure = null;
        
        // UI 초기화
        passageDisplay.innerHTML = '<p class="placeholder-text">키워드를 입력하고 \'제시문 생성\' 버튼을 눌러주세요.</p>';
        keywordInput.value = '';
        subjectInput.value = '';
        choiceBtns.forEach(btn => btn.classList.remove('selected'));
        submitBtn.disabled = true;

        // 키워드 입력창에 포커스
        keywordInput.focus();
    });

    resultPopup.addEventListener('click', (e) => {
        if (e.target === resultPopup) {
            resultPopup.style.display = 'none';
        }
    });

    function makeDraggable(popupElement, headerElement) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        headerElement.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            popupElement.style.top = (popupElement.offsetTop - pos2) + "px";
            popupElement.style.left = (popupElement.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    makeDraggable(resultPopup.querySelector('.popup-content'), resultPopupHeader);
}); 