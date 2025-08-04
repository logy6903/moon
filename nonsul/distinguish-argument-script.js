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
            submitBtn.disabled = !subjectInput.value.trim(); // 핵심 소재가 입력되어야만 활성화
        });
    });

    subjectInput.addEventListener('input', () => {
        submitBtn.disabled = !(selectedType && subjectInput.value.trim());
    });

    // 모범답안 확인 (제출하기)
    submitBtn.addEventListener('click', () => {
        const userSubject = subjectInput.value.trim();
        if (!selectedType || !userSubject) {
            alert('제시문의 종류를 선택하고 핵심 소재를 입력해주세요.');
            return;
        }

        const isCorrectType = selectedType === correctPassageType;
        const isCorrectSubject = userSubject === correctCoreSubject;
        const isAllCorrect = isCorrectType && isCorrectSubject;
        
        // 논리구조에 따른 상세 정보 생성
        let structureDetails = '';
        if (logicalStructure) {
            if (correctPassageType === '논증') {
                structureDetails = `
                    <h4>논증 구조</h4>
                    <p><strong>주장:</strong> ${logicalStructure.claim}</p>
                    <p><strong>근거들:</strong></p>
                    <ul>
                        ${logicalStructure.grounds.map(ground => `<li>${ground}</li>`).join('')}
                    </ul>
                `;
            } else if (correctPassageType === '인과적 설명') {
                structureDetails = `
                    <h4>인과설명 구조</h4>
                    <p><strong>현상:</strong> ${logicalStructure.phenomenon}</p>
                    <p><strong>원인들:</strong></p>
                    <ul>
                        ${logicalStructure.causes.map(cause => `<li>${cause}</li>`).join('')}
                    </ul>
                    <p><strong>과정:</strong> ${logicalStructure.process}</p>
                `;
            } else if (correctPassageType === '기타') {
                structureDetails = `
                    <h4>글의 구조</h4>
                    <p><strong>화제:</strong> ${logicalStructure.topic}</p>
                    <p><strong>핵심 주제:</strong> ${logicalStructure.coreTheme}</p>
                    <p><strong>부연 설명:</strong></p>
                    <ul>
                        ${logicalStructure.supportingSentences.map(sentence => `<li>${sentence}</li>`).join('')}
                    </ul>
                `;
            }
        }

        resultPopupBody.innerHTML = `
            <h4>모범답안</h4>
            <p><strong>글의 종류:</strong> ${correctPassageType}</p>
            <p><strong>핵심 주제:</strong> ${correctCoreSubject}</p>
            <br>
            ${structureDetails}
            <br>
            <h4>해설</h4>
            <p>${explanation}</p>
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