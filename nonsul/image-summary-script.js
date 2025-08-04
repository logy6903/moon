// ✨ Image Summary Script v8.0 - 완전한 기능 복구
console.log('✨ Image Summary Script v8.0 로드됨');

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 DOMContentLoaded - v8.0 시작');
    
    // --- DOM 요소 캐싱 ---
    const generateBtn = document.getElementById('generate-image-btn');
    const keywordInput = document.getElementById('keyword-input');
    const imageDisplayContainer = document.getElementById('image-display-container');
    const imageDisplay = document.getElementById('image-display');
    const instructionText = document.getElementById('instruction-text');
    
    // --- 차트 선택 관련 요소들 ---
    const chartTypeSelectionCard = document.getElementById('chart-type-selection-card');
    const chartTypeButtons = document.querySelectorAll('.chart-type-btn');
    const selectedCount = document.getElementById('selected-count');
    const selectedChartList = document.getElementById('selected-chart-list');
    const clearSelectionBtn = document.getElementById('clear-selection-btn');
    const generateSelectedChartsBtn = document.getElementById('generate-selected-charts-btn');
    const imageTypeRadios = document.querySelectorAll('input[name="image_type"]');

    // --- 오른쪽 패널 (동적 폼) ---
    const showModelAnswerBtn = document.getElementById('show-model-answer-btn');
    const groundsContainer = document.getElementById('grounds-container');
    const addGroundBtn = document.getElementById('add-ground-btn');
    
    // --- 패널 요소들 ---
    const imageAnalysisPanel = document.getElementById('image-analysis-panel');
    const dataAnalysisPanel = document.getElementById('data-analysis-panel');
    const dataAnalysisTitle = document.getElementById('data-analysis-title');
    const dataQuestionsContainer = document.getElementById('data-questions-container');
    const showDataModelAnswerBtn = document.getElementById('show-data-model-answer-btn');
    
    let groundCounter = 0;
    let currentImageUrl = null;
    let currentDataType = null;
    let currentData = null;
    let currentQuestions = null;
    let generatedCharts = []; // 생성된 차트들을 저장할 배열
    
    // --- 차트 선택 관련 변수들 ---
    let selectedChartTypes = [];
    const MAX_CHART_SELECTION = 2;

    // --- 랜덤 키워드 배열 (공익광고 특화) ---
    const randomKeywords = [
        '금연', '음주운전', '교통안전', '안전벨트', '헬멧착용',
        '환경보호', '에너지절약', '재활용', '분리수거', '물절약',
        '화재예방', '전기안전', '가스안전', '식품안전', '개인정보보호',
        '사이버폭력', '학교폭력', '가정폭력', '성폭력예방', '노인학대',
        '코로나19', '마스크착용', '손씻기', '사회적거리두기', '예방접종',
        '헌혈', '장기기증', '자원봉사', '기부', '나눔',
        '어린이보호', '스마트폰중독', '게임중독', '인터넷중독', '청소년보호'
    ];

    // --- 팝업 ---
    const popupBackdrop = document.getElementById('analysis-popup-backdrop');
    const popupWindow = document.getElementById('analysis-popup');
    const popupHeader = document.querySelector('#analysis-popup .popup-header');
    const popupContent = document.getElementById('popup-content');
    const popupCloseBtn = document.getElementById('popup-close-btn');

    // --- 이미지 팝업 ---
    const imagePopup = document.getElementById('image-popup');
    const imagePopupTitle = document.getElementById('image-popup-title');
    const imagePopupContent = document.getElementById('image-popup-content');
    const imagePopupClose = document.getElementById('image-popup-close');
    const imagePopupMinimize = document.getElementById('image-popup-minimize');
    const imagePopupHeader = document.getElementById('image-popup-header');
    const resizeHandle = document.getElementById('image-resize-handle');

    // --- 팝업 드래그 상태 관리 ---
    let isDragging = false;
    let offsetX, offsetY;
    
    // --- 이미지 팝업 드래그/리사이즈 상태 관리 ---
    let isImageDragging = false;
    let isResizing = false;
    let imageOffsetX, imageOffsetY;

    // --- 유틸리티 함수 ---
    const logToConsole = (message, data = '') => {
        console.log(`[UI] ${message}`, data);
    };

    const setLoading = (button, isLoading, loadingText = '처리 중...') => {
        const originalText = button.dataset.originalText || button.textContent;
        if (isLoading) {
            button.dataset.originalText = originalText;
            button.textContent = loadingText;
            button.disabled = true;
        } else {
            button.textContent = originalText;
            button.disabled = false;
        }
    };

    const getRandomKeyword = () => {
        return randomKeywords[Math.floor(Math.random() * randomKeywords.length)];
    };

    const updateInstructionText = () => {
        const selectedType = document.querySelector('input[name="image_type"]:checked').value;
        const instruction = instructionText;
        
        // 기존 클래스 제거
        instruction.classList.remove('public-ad', 'statistics', 'data-set');
        
        switch(selectedType) {
            case 'public_ad':
                instruction.textContent = '📢 이미지 불러오기 버튼을 클릭하면 다양한 주제의 공익광고가 랜덤으로 선택됩니다.';
                instruction.classList.add('public-ad');
                break;
            case 'statistics':
                instruction.textContent = '📊 이미지 불러오기 버튼을 클릭하면 통계 차트가 자동으로 생성됩니다.';
                instruction.classList.add('statistics');
                break;
            case 'data_set':
                instruction.textContent = '📋 이미지 불러오기 버튼을 클릭하면 통계표가 자동으로 생성됩니다.';
                instruction.classList.add('data-set');
                break;
        }
    };

    const resetUI = () => {
        imageDisplayContainer.style.display = 'none';
        imageDisplay.innerHTML = '';
        
        // 버튼 비활성화 (패널은 숨기지 않음 - 나중에 showAppropriatePanel에서 설정)
        showModelAnswerBtn.disabled = true;
        showDataModelAnswerBtn.disabled = true;
        
        // 폼 초기화
        groundsContainer.innerHTML = '';
        dataQuestionsContainer.innerHTML = '';
        groundCounter = 0;
        addGroundBlock();
        hidePopup();
        
        // 변수 초기화
        currentImageUrl = null;
        currentDataType = null;
        currentData = null;
        currentQuestions = null;
        generatedCharts = []; // 생성된 차트 배열 초기화
        
        // 차트 선택 초기화
        selectedChartTypes = [];
        updateSelectedChartsDisplay();
        chartTypeSelectionCard.style.display = 'none';
        
        // 입력 필드 초기화
        document.getElementById('user-issue').value = '';
        document.getElementById('user-claim').value = '';
    };

    // --- 차트 선택 관련 함수들 ---
    const updateSelectedChartsDisplay = () => {
        selectedCount.textContent = `선택된 차트: ${selectedChartTypes.length}개`;
        selectedChartList.innerHTML = '';
        
        selectedChartTypes.forEach(chartType => {
            const tag = document.createElement('span');
            tag.className = 'selected-chart-tag';
            tag.textContent = getChartDisplayName(chartType);
            selectedChartList.appendChild(tag);
        });
        
        generateSelectedChartsBtn.disabled = selectedChartTypes.length === 0;
        
        // 모든 버튼의 선택 상태 업데이트
        chartTypeButtons.forEach(btn => {
            const chartType = btn.getAttribute('data-chart-type');
            btn.classList.toggle('selected', selectedChartTypes.includes(chartType));
        });
    };

    const getChartDisplayName = (chartType) => {
        const chartNames = {
            'radar': '레이더 차트',
            'bubble': '버블 차트',
            'bar': '막대 차트',
            'line': '선 차트',
            'pie': '파이 차트',
            'area': '영역 차트',
            'trend': '추세 분석 차트',
            'multiLine': '다중선 차트',
            'correlation': '상관관계 차트',
            'multiVar': '다변수 분석 차트',
            'comparison': '비교 분석 차트',
            'regional': '지역별 비교 차트',
            'sectoral': '부문별 분석 차트',
            'stacked': '누적 막대 차트',
            'scatter': '산점도 차트',
            'polarArea': '극축 영역 차트',
            'doughnut': '도넛 차트',
            'candlestick': '캔들스틱 차트',
            'waterfall': '폭포 차트',
            'funnel': '깔때기 차트',
            'mixed': '혼합형 차트',
            'economic': '경제 분석 차트',
            'auto': 'AI 자동 선택'
        };
        return chartNames[chartType] || chartType;
    };

    const toggleChartSelection = (chartType) => {
        if (chartType === 'auto') {
            // AI 자동 선택은 단독 선택
            selectedChartTypes = ['auto'];
        } else {
            // auto가 선택되어 있으면 제거
            if (selectedChartTypes.includes('auto')) {
                selectedChartTypes = [];
            }
            
            const index = selectedChartTypes.indexOf(chartType);
            if (index > -1) {
                // 이미 선택된 경우 제거
                selectedChartTypes.splice(index, 1);
            } else {
                // 새로 선택하는 경우
                if (selectedChartTypes.length < MAX_CHART_SELECTION) {
                    selectedChartTypes.push(chartType);
                } else {
                    alert(`최대 ${MAX_CHART_SELECTION}개까지만 선택할 수 있습니다.`);
                    return;
                }
            }
        }
        
        updateSelectedChartsDisplay();
    };

    const showChartSelectionIfNeeded = () => {
        const selectedType = document.querySelector('input[name="image_type"]:checked').value;
        if (selectedType === 'statistics' || selectedType === 'data_set') {
            chartTypeSelectionCard.style.display = 'block';
        } else {
            chartTypeSelectionCard.style.display = 'none';
        }
    };

    // --- 왼쪽 패널: 이미지 생성 ---
    // 라디오 버튼 변경 이벤트 리스너 추가
    imageTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateInstructionText);
    });

    // 페이지 로드 시 초기 안내 문구 설정
    updateInstructionText();

    // 이미지 생성 버튼 클릭 이벤트
    generateBtn.addEventListener('click', async () => {
        const imageType = document.querySelector('input[name="image_type"]:checked').value;
        let keyword = keywordInput.value.trim();
        
        // 통계 차트나 통계표의 경우 항상 새로운 랜덤 키워드 생성
        if (imageType === 'statistics' || imageType === 'data_set') {
            // 기존 키워드 완전히 제거 후 새로운 키워드 설정
            keywordInput.value = '';
            keyword = getRandomKeyword();
            keywordInput.value = keyword;
            console.log('🎲 새로운 랜덤 키워드 강제 설정:', keyword);
        } 
        // 공익광고는 기존 로직 유지 (키워드가 없으면 랜덤 선택)
        else if (!keyword) {
            keyword = getRandomKeyword();
            keywordInput.value = keyword;
            console.log('🎲 랜덤 키워드 선택됨:', keyword);
        }
        
        // 타입별 로딩 메시지 설정
        let loadingMessage;
        if (imageType === 'statistics') {
            loadingMessage = '📊 통계 차트 생성중...';
        } else if (imageType === 'data_set') {
            loadingMessage = '📋 통계표 생성중...';
        } else {
            loadingMessage = '🖼️ 공익광고 검색중...';
        }
        
        // 즉시 로딩 팝업 표시
        showLoadingPopup(loadingMessage);
        setLoading(generateBtn, true, '생성중...');

        try {
            const requestData = { type: imageType, keyword };
            console.log('📡 API 요청 데이터:', requestData);
            console.log('📡 JSON 변환:', JSON.stringify(requestData));
            
            // 🔀 타입별 서버 분기
            let apiUrl;
            if (imageType === 'statistics' || imageType === 'data_set') {
                apiUrl = '/api/generate-image'; // integrated-server
                console.log('📡 통계표 요청 → integrated-server');
            } else {
                apiUrl = '/api/generate-image'; // integrated-server
                console.log('📡 공익광고 요청 → integrated-server');
            }
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `서버 오류: ${response.status}`);
            }

            const data = await response.json();
            
            // 🔍 디버깅: API 응답 확인
            console.log('📡 API 응답 전체:', data);
            console.log('📡 응답 타입:', data.type);
            console.log('📡 키워드:', data.keyword);
            
            // 유형별 다른 처리
            if (data.type === 'chart') {
                // 통계 차트 표시
                displayChart(data.data, data.keyword);
                setupDataAnalysisPanel('chart', data.data, data.questions, keyword);
            } else if (data.type === 'table') {
                // 통계표 표시
                displayTable(data.data, data.keyword);
                setupDataAnalysisPanel('table', data.data, data.questions, keyword);
            } else if (data.type === 'image') {
                // 공익 광고 이미지 표시
                if (data.success && data.imageUrl) {
                    displayImage(data.imageUrl, keyword, data.source);
                    // 이미지 로드 후 모범답안 버튼 활성화
                    showModelAnswerBtn.disabled = false;
                } else {
                    throw new Error(data.message || '이미지를 찾을 수 없습니다.');
                }
            } else {
                throw new Error('알 수 없는 응답 형식입니다.');
            }

        } catch (error) {
            // 하단 출력 영역 완전히 숨김
            imageDisplayContainer.style.display = 'none';
            imageDisplay.innerHTML = '';
            
            // 오류를 팝업에 표시
            showImagePopup('오류 발생', 'error');
            imagePopupContent.innerHTML = `
                <div style="height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; color: #dc3545;">
                    <div>
                        <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
                        <p style="margin: 0; font-size: 16px; font-weight: bold;">이미지 생성 실패</p>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">${error.message}</p>
                    </div>
                </div>
            `;
            currentImageUrl = null;
        } finally {
            setLoading(generateBtn, false);
        }
    });

    // --- 오른쪽 패널: 논증 분석 폼 ---
    const addGroundBlock = () => {
        groundCounter++;
        const groundBlock = document.createElement('div');
        groundBlock.className = 'ground-block';
        groundBlock.id = `ground-block-${groundCounter}`;
        groundBlock.innerHTML = `
            <div class="ground-block-header">
                <label for="user-ground-${groundCounter}">근거 ${groundCounter}</label>
                ${groundCounter > 1 ? '<button type="button" class="remove-ground-btn">&times; 삭제</button>' : ''}
            </div>
            <div class="form-group-vertical">
                <textarea id="user-ground-${groundCounter}" class="summary-textarea" placeholder="주장을 뒷받침하는 근거를 작성하세요."></textarea>
            </div>
        `;
        groundsContainer.appendChild(groundBlock);
    };

    groundsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-ground-btn')) {
            e.target.closest('.ground-block').remove();
        }
    });

    // --- AI 분석 및 팝업 기능 ---

    const showPopup = (analysis) => {
        let formattedHtml = '';
        if (analysis.error) {
            formattedHtml = `<p class="error-message">${analysis.error}</p>`;
        } else {
            formattedHtml = `
                <p><strong>쟁점:</strong> ${analysis.issue || 'N/A'}</p>
                <p><strong>주장:</strong> ${analysis.claim || 'N/A'}</p>
                <h5>근거:</h5>
                <ul>
                    ${(analysis.grounds && analysis.grounds.length > 0)
                        ? analysis.grounds.map(g => `<li>${g}</li>`).join('')
                        : '<li>분석된 근거가 없습니다.</li>'
                    }
                </ul>
            `;
    }
    
        popupContent.innerHTML = formattedHtml;
        popupWindow.style.left = '50%';
        popupWindow.style.top = '50%';
        popupWindow.style.transform = 'translate(-50%, -50%)';
        popupBackdrop.style.display = 'block';
        popupWindow.style.display = 'flex';
    };

    const hidePopup = () => {
        popupBackdrop.style.display = 'none';
        popupWindow.style.display = 'none';
    };

    // --- 모범답안 확인 기능 ---
    const showModelAnswerHandler = async () => {
        if (!currentImageUrl) {
            alert('먼저 이미지를 불러와주세요.');
            return;
        }
        
        setLoading(showModelAnswerBtn, true, '이미지 분석 중...');
        try {
            const keyword = keywordInput.value.trim();
            const res = await fetch('/api/analyze-image-structure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    imageUrl: currentImageUrl,
                    keyword: keyword
                })
            });
            
            if (!res.ok) throw new Error(`이미지 분석 서버 오류: ${res.status}`);

            const result = await res.json();
            showModelAnswerPopup(result.analysis);

        } catch (error) {
            popupContent.innerHTML = `<p class="error-message">모범답안 분석에 실패했습니다: ${error.message}</p>`;
            popupBackdrop.style.display = 'block';
            popupWindow.style.display = 'flex';
        } finally {
            setLoading(showModelAnswerBtn, false);
        }
    };

    // 모범답안 팝업 표시 함수
    const showModelAnswerPopup = (analysis) => {
        let formattedHtml = '';
        
        if (analysis.error) {
            formattedHtml = `<p class="error-message">${analysis.error}</p>`;
        } else {
            formattedHtml = `
                <div class="model-answer-content">
                    <div class="analysis-header">
                        <h4>🎯 AI 논증 구조 분석 (모범답안)</h4>
                        ${analysis.note ? `<p class="note">${analysis.note}</p>` : ''}
                    </div>
                    
                    <div class="analysis-section">
                        <h5>📋 쟁점 (Issue)</h5>
                        <p>${analysis.issue}</p>
                    </div>
                    
                    <div class="analysis-section">
                        <h5>🎯 주장 (Claim)</h5>
                        <p>${analysis.claim}</p>
                    </div>
                    
                    <div class="analysis-section">
                        <h5>📖 근거 (Grounds)</h5>
                        <ul>
                            ${analysis.grounds && analysis.grounds.length > 0
                                ? analysis.grounds.map(ground => `
                                    <li>
                                        <strong>${ground.main_ground}</strong>
                                        ${ground.sub_grounds && ground.sub_grounds.length > 0 
                                            ? `<ul>${ground.sub_grounds.map(sub => `<li>${sub}</li>`).join('')}</ul>`
                                            : ''
                                        }
                                    </li>
                                `).join('')
                                : '<li>분석된 근거가 없습니다.</li>'
                            }
                        </ul>
                    </div>
                    
                    ${analysis.warrant ? `
                    <div class="analysis-section">
                        <h5>🔗 숨은 전제 (Warrant)</h5>
                        <p>${analysis.warrant}</p>
                    </div>
                    ` : ''}
                    
                    <div class="analysis-section">
                        <h5>🎨 시각적 요소</h5>
                        <p>${analysis.visual_elements}</p>
                    </div>
                    
                    <div class="analysis-section">
                        <h5>🧠 설득 전략</h5>
                        <p>${analysis.persuasion_strategy}</p>
                    </div>
                </div>
            `;
        }
        
        popupContent.innerHTML = formattedHtml;
        popupWindow.style.left = '50%';
        popupWindow.style.top = '50%';
        popupWindow.style.transform = 'translate(-50%, -50%)';
        popupBackdrop.style.display = 'block';
        popupWindow.style.display = 'flex';
    };

    const onDragStart = (e) => {
        if (e.target !== popupHeader && e.target.parentElement !== popupHeader) return;
        e.preventDefault();
        isDragging = true;
        offsetX = e.clientX - popupWindow.offsetLeft;
        offsetY = e.clientY - popupWindow.offsetTop;
        document.addEventListener('mousemove', onDragging);
        document.addEventListener('mouseup', onDragEnd);
    };

    const onDragging = (e) => {
        if (!isDragging) return;
        popupWindow.style.left = `${e.clientX - offsetX}px`;
        popupWindow.style.top = `${e.clientY - offsetY}px`;
        if (popupWindow.style.transform !== 'none') {
            popupWindow.style.transform = 'none';
            }
    };
    
    const onDragEnd = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onDragging);
        document.removeEventListener('mouseup', onDragEnd);
    };

    // === 이미지 팝업 제어 함수들 먼저 정의 ===
    
    // 팝업 표시
    const showImagePopup = (title, type) => {
        imagePopupTitle.textContent = title;
        imagePopup.style.display = 'block';
        imagePopup.classList.remove('minimized');
        
        logToConsole(`이미지 팝업 표시: ${title} (${type})`);
    };
    
    // 팝업 숨기기
    const hideImagePopup = () => {
        imagePopup.style.display = 'none';
        imagePopup.classList.remove('minimized');
        logToConsole('이미지 팝업 숨김');
    };
    
    // 팝업 최소화/복원
    const toggleImagePopupMinimize = () => {
        imagePopup.classList.toggle('minimized');
        const isMinimized = imagePopup.classList.contains('minimized');
        logToConsole(`이미지 팝업 ${isMinimized ? '최소화' : '복원'}`);
    };
    
    // 팝업 드래그 시작
    const onImageDragStart = (e) => {
        if (e.target.closest('.popup-controls')) return; // 버튼 클릭 시 드래그 방지
        
        isImageDragging = true;
        const rect = imagePopup.getBoundingClientRect();
        imageOffsetX = e.clientX - rect.left;
        imageOffsetY = e.clientY - rect.top;
        
        document.addEventListener('mousemove', onImageDragging);
        document.addEventListener('mouseup', onImageDragEnd);
        
        e.preventDefault();
        logToConsole('이미지 팝업 드래그 시작');
    };
    
    // 팝업 드래그 중
    const onImageDragging = (e) => {
        if (!isImageDragging && !isResizing) return;
        
        if (isImageDragging) {
            let newX = e.clientX - imageOffsetX;
            let newY = e.clientY - imageOffsetY;
            
            // 화면 경계 체크
            const maxX = window.innerWidth - imagePopup.offsetWidth;
            const maxY = window.innerHeight - imagePopup.offsetHeight;
            
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            
            imagePopup.style.left = newX + 'px';
            imagePopup.style.top = newY + 'px';
            imagePopup.style.right = 'auto';
        }
        
        e.preventDefault();
    };
    
    // 팝업 드래그 종료
    const onImageDragEnd = () => {
        if (isImageDragging) {
            isImageDragging = false;
            logToConsole('이미지 팝업 드래그 종료');
        }
        
        document.removeEventListener('mousemove', onImageDragging);
        document.removeEventListener('mouseup', onImageDragEnd);
        document.removeEventListener('mousemove', onResizing);
        document.removeEventListener('mouseup', onResizeEnd);
        
        if (isResizing) {
            isResizing = false;
            logToConsole('이미지 팝업 리사이즈 종료');
        }
    };
    
    // 리사이즈 시작
    const onResizeStart = (e) => {
        isResizing = true;
        
        document.addEventListener('mousemove', onResizing);
        document.addEventListener('mouseup', onResizeEnd);
        
        e.preventDefault();
        e.stopPropagation();
        logToConsole('이미지 팝업 리사이즈 시작');
    };
    
    // 리사이즈 중
    const onResizing = (e) => {
        if (!isResizing) return;
        
        const rect = imagePopup.getBoundingClientRect();
        const newWidth = Math.max(450, e.clientX - rect.left);
        const newHeight = Math.max(350, e.clientY - rect.top);
        
        imagePopup.style.width = newWidth + 'px';
        imagePopup.style.height = newHeight + 'px';
        
        e.preventDefault();
    };
    
    // 리사이즈 종료
    const onResizeEnd = () => {
        isResizing = false;
        document.removeEventListener('mousemove', onResizing);
        document.removeEventListener('mouseup', onResizeEnd);
        logToConsole('이미지 팝업 리사이즈 종료');
    };

    // 이미지 표시 함수
    const displayImage = (imageUrl, keyword, source) => {
        currentImageUrl = imageUrl;
        
        // 팝업에 이미지 표시
        showImagePopup(`${keyword} - 공익 광고`, 'image');
        
        imagePopupContent.innerHTML = `
            <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <img src="${imageUrl}" alt="${keyword} 관련 공익광고 이미지" style="max-width: 100%; max-height: calc(100% - 30px); object-fit: contain;">
                <p class="source-text" style="text-align: center; font-size: 12px; color: #666; margin-top: 10px;">출처: ${source || '웹 검색'}</p>
            </div>
        `;
        
        // 하단 출력 영역 완전히 숨김
        imageDisplayContainer.style.display = 'none';
    };

    // === 패널 설정 함수들 ===
    
    // 공익 광고 분석 패널 설정
    const setupImageAnalysisPanel = () => {
        imageAnalysisPanel.style.display = 'block';
        dataAnalysisPanel.style.display = 'none';
        
        // 이미지가 있을 때만 모범답안 버튼 활성화
        if (currentImageUrl) {
            showModelAnswerBtn.disabled = false;
        } else {
            showModelAnswerBtn.disabled = true;
        }
        
        logToConsole('공익 광고 분석 패널 활성화');
    };
    
    // 통계 자료 분석 패널 설정
    const setupDataAnalysisPanel = (dataType, data, questions, keyword) => {
        currentDataType = dataType;
        currentData = data;
        currentQuestions = questions;
        
        imageAnalysisPanel.style.display = 'none';
        dataAnalysisPanel.style.display = 'block';
        
        // 제목 설정
        const typeText = dataType === 'chart' ? '차트' : '테이블';
        dataAnalysisTitle.textContent = `📊 ${typeText} 분석`;
        
        // 질문들 생성
        generateQuestionBlocks(questions);
        
        showDataModelAnswerBtn.disabled = false;
        logToConsole(`통계 자료 분석 패널 활성화 (${typeText})`);
    };
    
    // 질문 블록들 동적 생성
    const generateQuestionBlocks = (questionsData) => {
        dataQuestionsContainer.innerHTML = '';
        
        if (!questionsData || !questionsData.questions) {
            dataQuestionsContainer.innerHTML = '<p>질문을 생성하는 중 오류가 발생했습니다.</p>';
            return;
        }
        
        questionsData.questions.forEach(question => {
            const questionBlock = document.createElement('div');
            questionBlock.className = 'question-block';
            questionBlock.setAttribute('data-type', question.type);
            questionBlock.setAttribute('data-question-id', question.id);
            
            questionBlock.innerHTML = `
                <div class="question-header">
                    <div class="question-number">${question.id}</div>
                    <div class="question-content">
                        <div class="question-text">${question.question}</div>
                        <div class="question-meta">
                            <span class="question-type">${getTypeLabel(question.type)}</span>
                        </div>
                        <div class="question-hint">${question.hint}</div>
                    </div>
                </div>
                <div class="question-answer">
                    <label for="answer-${question.id}">답변:</label>
                    <textarea id="answer-${question.id}" placeholder="여기에 답변을 작성하세요..."></textarea>
                    <div class="model-answer-section" id="model-answer-${question.id}">
                        <div class="model-answer-header">📝 모범답안</div>
                        <div class="model-answer-text" id="model-answer-text-${question.id}"></div>
                        <div class="model-answer-reasoning" id="model-answer-reasoning-${question.id}"></div>
                    </div>
                </div>
            `;
            
            dataQuestionsContainer.appendChild(questionBlock);
        });
    };
    
    // 질문 유형 라벨 변환
    const getTypeLabel = (type) => {
        const labels = {
            'factual': '사실적',
            'analytical': '분석적', 
            'comparative': '비교적',
            'predictive': '예측적',
            'critical': '비판적'
        };
        return labels[type] || type;
    };
    
    // 통계 자료 모범답안 표시
    const showDataModelAnswerHandler = async () => {
        if (!currentData || !currentQuestions) {
            alert('먼저 통계 자료를 불러와주세요.');
            return;
        }
        
        setLoading(showDataModelAnswerBtn, true, '모범답안 생성 중...');
        try {
            const keyword = keywordInput.value.trim();
            const res = await fetch('/api/generate-data-analysis-answers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    keyword: keyword,
                    dataType: currentDataType,
                    data: currentData,
                    questions: currentQuestions
                })
            });
            
            if (!res.ok) throw new Error(`모범답안 생성 서버 오류: ${res.status}`);

            const result = await res.json();
            displayModelAnswers(result.answers);
            
        } catch (error) {
            alert('모범답안 생성에 실패했습니다: ' + error.message);
        } finally {
            setLoading(showDataModelAnswerBtn, false);
        }
    };
    
    // 모범답안들을 화면에 표시
    const displayModelAnswers = (answers) => {
        answers.forEach(answer => {
            const modelAnswerSection = document.getElementById(`model-answer-${answer.question_id}`);
            const modelAnswerText = document.getElementById(`model-answer-text-${answer.question_id}`);
            const modelAnswerReasoning = document.getElementById(`model-answer-reasoning-${answer.question_id}`);
            
            if (modelAnswerSection && modelAnswerText && modelAnswerReasoning) {
                modelAnswerText.textContent = answer.answer;
                modelAnswerReasoning.textContent = answer.reasoning;
                modelAnswerSection.classList.add('show');
            }
        });
        
        logToConsole(`모범답안 ${answers.length}개 표시 완료`);
    };

    // --- 이벤트 리스너 초기화 ---
    addGroundBtn.addEventListener('click', addGroundBlock);
    showModelAnswerBtn.addEventListener('click', showModelAnswerHandler);
    showDataModelAnswerBtn.addEventListener('click', showDataModelAnswerHandler);
    popupCloseBtn.addEventListener('click', hidePopup);
    popupHeader.addEventListener('mousedown', onDragStart);
    
    // --- 이미지 팝업 이벤트 리스너 ---
    imagePopupClose.addEventListener('click', hideImagePopup);
    imagePopupMinimize.addEventListener('click', toggleImagePopupMinimize);
    imagePopupHeader.addEventListener('mousedown', onImageDragStart);
    resizeHandle.addEventListener('mousedown', onResizeStart);

    // --- 차트 표시 함수 ---
    const displayChart = (chartData, keyword) => {
        // 하단 출력 영역 완전히 제거
        imageDisplayContainer.style.display = 'none';
        imageDisplay.innerHTML = '';
        
        currentImageUrl = null;
        
        const chartInfo = chartData.purpose ? ` (${chartData.purpose})` : '';
        const chartTypeDisplay = chartData.패턴정보?.선택된차트타입 ? ` [${getChartDisplayName(chartData.패턴정보.선택된차트타입)}]` : '';
        
        // 차트 데이터를 배열에 저장 - 선택된 차트 타입 정보도 포함
        const selectedChartType = chartData.패턴정보?.선택된차트타입 || chartData.chartType || 'bar';
        generatedCharts.push({
            chartData,
            keyword,
            title: chartData.title + chartInfo + chartTypeDisplay,
            chartType: selectedChartType,
            displayName: getChartDisplayName(selectedChartType)
        });
        
        // 차트가 하나만 있으면 바로 표시, 여러 개면 탭으로 표시
        if (generatedCharts.length === 1) {
            showSingleChart(generatedCharts[0]);
        } else {
            showChartsWithTabs();
        }
    };

    // --- 로딩 팝업 함수 ---
    const showLoadingPopup = (loadingMessage = '자료 생성중...') => {
        
        showImagePopup(loadingMessage, 'loading');
        
        imagePopupContent.innerHTML = `
            <div class="loading-container" style="
                width: 100%; 
                height: 100%; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center;
                padding: 40px;
                text-align: center;
            ">
                <div class="loading-spinner" style="
                    width: 80px;
                    height: 80px;
                    border: 8px solid #f3f3f3;
                    border-top: 8px solid #007bff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 30px;
                "></div>
                <h3 style="color: #007bff; margin: 0 0 15px 0; font-size: 24px;">${loadingMessage}</h3>
                <p style="color: #666; margin: 0; font-size: 16px;">AI가 데이터를 분석하고 있습니다...</p>
                <p style="color: #999; margin: 10px 0 0 0; font-size: 14px;">잠시만 기다려주세요</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    };

    // --- 새로운 차트 표시 함수들 ---
    
    // 단일 차트 표시
    const showSingleChart = (chartItem) => {
        showImagePopup(chartItem.title, 'chart');
        
        imagePopupContent.innerHTML = `
            <div class="chart-container" style="width: 100%; height: calc(100% - 20px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
                <canvas id="statisticsChart" style="width: 100%; height: 100%; max-width: 850px; max-height: 550px;"></canvas>
            </div>
        `;
        
        renderChart('statisticsChart', chartItem.chartData, chartItem.keyword);
    };
    
    // 여러 차트를 탭으로 표시
    const showChartsWithTabs = () => {
        console.log('🎯 탭 구조 생성 시작', generatedCharts);
        
        if (generatedCharts.length === 0) {
            console.log('❌ 생성된 차트가 없음');
            return;
        }
        
        console.log(`📊 ${generatedCharts.length}개 차트로 탭 구조 생성`);
        showImagePopup('생성된 차트들', 'chart');
        
        // 탭 구조 HTML 생성
        let tabsHtml = `
            <div class="chart-tabs-container" style="width: 100%; height: 100%; display: flex; flex-direction: column;">
                <div class="chart-tabs-header" style="display: flex; border-bottom: 2px solid #ddd; margin-bottom: 15px; background-color: #f8f9fa;">
        `;
        
        // 탭 버튼들 생성
        generatedCharts.forEach((chart, index) => {
            const isActive = index === 0 ? ' active' : '';
            const chartTypeName = chart.displayName || getChartDisplayName(chart.chartType);
            tabsHtml += `
                <button class="chart-tab-btn${isActive}" data-chart-index="${index}" style="
                    padding: 10px 20px; 
                    border: none; 
                    background-color: ${index === 0 ? '#007bff' : '#fff'}; 
                    color: ${index === 0 ? '#fff' : '#007bff'}; 
                    border-bottom: 3px solid ${index === 0 ? '#007bff' : 'transparent'};
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s ease;
                " onclick="switchChartTab(${index})">
                    ${chartTypeName}
                </button>
            `;
        });
        
        tabsHtml += `
                </div>
                <div class="chart-tabs-content" style="flex: 1; position: relative;">
        `;
        
        // 차트 컨테이너들 생성 (탭 구조) - 모든 차트 visibility로 숨김
        generatedCharts.forEach((chart, index) => {
            const isActive = index === 0;
            tabsHtml += `
                <div class="chart-tab-panel" id="chart-panel-${index}" style="
                    display: block;
                    visibility: ${isActive ? 'visible' : 'hidden'};
                    width: 100%; 
                    height: 100%; 
                    position: absolute; 
                    top: 0; 
                    left: 0;
                    padding: 20px;
                    box-sizing: border-box;
                ">
                    <canvas id="statisticsChart-${index}" width="800" height="400" style="width: 800px !important; height: 400px !important; display: block; margin: 0 auto;"></canvas>
                </div>
            `;
        });
        
        tabsHtml += `
                </div>
            </div>
        `;
        
        imagePopupContent.innerHTML = tabsHtml;
        console.log('✅ 탭 HTML 구조 생성 완료');
        
        // DOM 요소 생성 대기 후 차트 렌더링
        setTimeout(() => {
            console.log('🕐 DOM 생성 대기 완료, 차트 렌더링 시작');
            console.log(`📊 렌더링할 차트 개수: ${generatedCharts.length}개`);
            
            generatedCharts.forEach((chart, index) => {
                console.log(`🎨 차트 ${index + 1} 렌더링 시작:`, chart);
                const canvasId = `statisticsChart-${index}`;
                console.log(`🎯 렌더링할 Canvas ID: ${canvasId}`);
                
                // Canvas 요소 존재 확인
                const canvasElement = document.getElementById(canvasId);
                console.log(`🖼️ Canvas 요소 확인 (${canvasId}):`, canvasElement);
                
                if (!canvasElement) {
                    console.error(`❌ Canvas 요소를 찾을 수 없습니다: ${canvasId}`);
                    // DOM에서 모든 canvas 요소 검색
                    const allCanvases = document.querySelectorAll('canvas');
                    console.log('🔍 현재 DOM의 모든 Canvas 요소들:', allCanvases);
                    return;
                }
                
                // 실제 서버 데이터 사용
                console.log(`🔍 차트 ${index} 원본 데이터:`, chart.chartData);
                console.log(`🏷️ 차트 ${index} 타입:`, chart.chartType);
                console.log(`🔑 차트 ${index} 키워드:`, chart.keyword);
                console.log(`📊 차트 ${index} 제목:`, chart.title);
                
                // 데이터 구조 상세 확인
                if (chart.chartData) {
                    console.log(`📋 차트 ${index} labels:`, chart.chartData.labels);
                    console.log(`📋 차트 ${index} datasets:`, chart.chartData.datasets);
                    console.log(`📋 차트 ${index} datasets 길이:`, chart.chartData.datasets ? chart.chartData.datasets.length : 'undefined');
                    
                    if (chart.chartData.datasets && chart.chartData.datasets.length > 0) {
                        chart.chartData.datasets.forEach((dataset, dsIndex) => {
                            console.log(`📊 차트 ${index} dataset ${dsIndex}:`, dataset);
                            console.log(`📊 차트 ${index} dataset ${dsIndex} data:`, dataset.data);
                        });
                    }
                } else {
                    console.error(`❌ 차트 ${index} chartData가 null/undefined입니다!`);
                }
                
                try {
                    renderChart(canvasId, chart.chartData, chart.keyword);
                    console.log(`✅ 차트 ${index} 렌더링 시도 완료`);
                } catch (error) {
                    console.error(`❌ 차트 ${index} 렌더링 중 오류:`, error);
                }
            });
            console.log('🎉 모든 차트 렌더링 시도 완료');
        }, 200); // 대기 시간을 200ms로 늘림
    };
    
    // 간단한 차트 표시 함수 (탭 대신 세로 나열)
    const showChartsSimple = () => {
        console.log(`📊 ${generatedCharts.length}개 차트를 간단한 세로 나열로 표시`);
        showImagePopup('생성된 차트들', 'chart');
        
        // 간단한 세로 나열 구조
        let chartsHtml = `
            <div class="charts-simple-container" style="
                width: 100%; 
                height: 100%; 
                overflow-y: auto; 
                padding: 20px;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            ">
                <h2 style="
                    text-align: center; 
                    margin-bottom: 30px; 
                    color: #2c3e50; 
                    font-size: 1.8em;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                ">📊 생성된 차트들</h2>
        `;
        
        // 각 차트를 개별 컨테이너로 생성
        generatedCharts.forEach((chart, index) => {
            const chartTypeName = chart.displayName || getChartDisplayName(chart.chartType);
            chartsHtml += `
                <div class="chart-simple-item" style="
                    margin-bottom: 30px; 
                    padding: 25px; 
                    border: none;
                    border-radius: 15px;
                    background: white;
                    box-shadow: 0 8px 32px rgba(0,123,255,0.15);
                    transition: transform 0.3s ease;
                ">
                    <h3 style="
                        margin: 0 0 20px 0; 
                        color: #007bff; 
                        font-size: 1.4em; 
                        text-align: center;
                        font-weight: 600;
                        border-bottom: 2px solid #e9ecef;
                        padding-bottom: 15px;
                    ">
                        ${index + 1}번째 차트: ${chartTypeName}
                    </h3>
                    <div style="
                        background: #f8f9fa; 
                        padding: 20px; 
                        border-radius: 10px;
                        border: 1px solid #e9ecef;
                    ">
                        <canvas id="simple-chart-${index}" 
                                width="800" 
                                height="400" 
                                style="
                                    width: 100% !important; 
                                    height: 400px !important; 
                                    display: block; 
                                    max-width: 800px; 
                                    margin: 0 auto;
                                    background: white;
                                    border-radius: 8px;
                                ">
                        </canvas>
                    </div>
                </div>
            `;
        });
        
        chartsHtml += `
            </div>
        `;
        
        imagePopupContent.innerHTML = chartsHtml;
        console.log('✅ 간단한 차트 구조 생성 완료');
        
        // 각 차트를 순서대로 렌더링
        setTimeout(() => {
            console.log('🚀 차트 렌더링 시작!');
            
            generatedCharts.forEach((chart, index) => {
                const canvasId = `simple-chart-${index}`;
                console.log(`🎨 ${index + 1}번째 차트 렌더링: ${canvasId}`);
                
                const canvasElement = document.getElementById(canvasId);
                if (!canvasElement) {
                    console.error(`❌ Canvas 못찾음: ${canvasId}`);
                    return;
                }
                
                console.log(`✅ Canvas 발견: ${canvasId} (${canvasElement.width}x${canvasElement.height})`);
                
                // 간단한 차트 렌더링
                setTimeout(() => {
                    try {
                        renderChart(canvasId, chart.chartData, chart.keyword);
                        console.log(`🎉 ${index + 1}번째 차트 완료!`);
                    } catch (error) {
                        console.error(`💥 ${index + 1}번째 차트 실패:`, error);
                    }
                }, index * 500); // 각 차트마다 500ms씩 지연
            });
            
        }, 200);
    };
    
    // 탭 전환 함수 (전역 함수로 등록)
    window.switchChartTab = (tabIndex) => {
        console.log(`🔄 탭 전환: ${tabIndex}번 탭으로 이동`);
        
        // 모든 탭 버튼 비활성화
        document.querySelectorAll('.chart-tab-btn').forEach((btn, index) => {
            if (index === tabIndex) {
                btn.style.backgroundColor = '#007bff';
                btn.style.color = '#fff';
                btn.style.borderBottomColor = '#007bff';
                btn.classList.add('active');
            } else {
                btn.style.backgroundColor = '#fff';
                btn.style.color = '#007bff';
                btn.style.borderBottomColor = 'transparent';
                btn.classList.remove('active');
            }
        });
        
        // 모든 차트 패널 숨기기/보이기 (visibility 사용)
        document.querySelectorAll('.chart-tab-panel').forEach((panel, index) => {
            panel.style.visibility = index === tabIndex ? 'visible' : 'hidden';
        });
        
        // 선택된 탭의 차트 크기 확인 및 재설정
        setTimeout(() => {
            const canvasId = `statisticsChart-${tabIndex}`;
            const canvasElement = document.getElementById(canvasId);
            
            if (canvasElement) {
                console.log(`🔧 탭 ${tabIndex} Canvas 크기 확인: ${canvasElement.width}x${canvasElement.height}`);
                
                // Canvas 크기가 0이면 재설정
                if (canvasElement.width === 0 || canvasElement.height === 0) {
                    console.log(`🔄 ${canvasId} Canvas 크기 재설정 필요`);
                    
                    canvasElement.width = 800;
                    canvasElement.height = 400;
                    canvasElement.style.width = '800px';
                    canvasElement.style.height = '400px';
                    
                    // 기존 차트 완전 삭제 후 재생성
                    try {
                        if (window.Chart && window.Chart.getChart) {
                            const existingChart = window.Chart.getChart(canvasElement);
                            if (existingChart) {
                                existingChart.destroy();
                                console.log(`🧹 탭 전환 시 기존 차트 삭제: ${canvasId}`);
                            }
                        }
                        
                        // Canvas 초기화
                        canvasElement.width = canvasElement.width;
                        canvasElement.width = 800;
                        canvasElement.height = 400;
                        
                        // 차트 재생성
                        if (generatedCharts && generatedCharts[tabIndex]) {
                            const chart = generatedCharts[tabIndex];
                            renderChart(canvasId, chart.chartData, chart.keyword);
                            console.log(`✅ ${canvasId} 탭 전환 차트 재생성 완료`);
                        }
                    } catch (error) {
                        console.error(`❌ ${canvasId} 탭 전환 실패:`, error);
                    }
                }
            }
        }, 50);
    };
    
    // 차트 렌더링 함수 
    const renderChart = (canvasId, chartData, keyword) => {
        console.log(`🎯 차트 렌더링 시작: ${canvasId}`);
        console.log(`📊 Chart.js 로딩 상태:`, typeof window.Chart);
        console.log(`📊 chartData:`, chartData);
        console.log(`🔑 keyword:`, keyword);
        
        // Chart.js 라이브러리 확인
        if (typeof window.Chart === 'undefined') {
            console.error(`❌ Chart.js 라이브러리가 로드되지 않았습니다!`);
            return;
        }
        
        const canvasElement = document.getElementById(canvasId);
        console.log(`🎨 Canvas 요소:`, canvasElement);
        if (!canvasElement) {
            console.error(`❌ Canvas 요소를 찾을 수 없습니다: ${canvasId}`);
            return;
        }
        
        // chartData 유효성 검사
        console.log(`📋 ${canvasId} 전달받은 chartData:`, chartData);
        console.log(`📋 ${canvasId} keyword:`, keyword);
        
        if (!chartData) {
            console.error(`❌ ${canvasId} chartData가 null/undefined입니다`);
            // 기본 데이터로 대체
            chartData = {
                labels: ['데이터 없음'],
                datasets: [{
                    label: '오류 - 데이터 로드 실패',
                    data: [0],
                    backgroundColor: 'rgba(255, 99, 132, 0.8)'
                }]
            };
            console.log(`🔄 ${canvasId} 기본 데이터로 대체:`, chartData);
        }
        
        if (!chartData.labels) {
            console.error(`❌ ${canvasId} chartData.labels가 없습니다:`, chartData.labels);
            chartData.labels = ['라벨 없음'];
        }
        
        if (!chartData.datasets || !Array.isArray(chartData.datasets) || chartData.datasets.length === 0) {
            console.error(`❌ ${canvasId} chartData.datasets 오류:`, chartData.datasets);
            chartData.datasets = [{
                label: '데이터셋 오류',
                data: chartData.labels.map(() => Math.floor(Math.random() * 100)),
                backgroundColor: 'rgba(255, 99, 132, 0.8)'
            }];
        }
        
        // 기존 차트가 있다면 제거 (강화된 로직)
        try {
            if (window.Chart && window.Chart.getChart) {
                const existingChart = window.Chart.getChart(canvasElement);
                if (existingChart) {
                    existingChart.destroy();
                    console.log(`🧹 기존 차트 제거 성공: ${canvasId}`);
                }
            }
            
            // 추가 안전장치: Canvas 컨텍스트 초기화
            const ctx = canvasElement.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            }
            
            // Chart.js 내부 레지스트리에서도 제거
            if (window.Chart && window.Chart.registry && window.Chart.registry.remove) {
                window.Chart.registry.remove(canvasElement);
            }
            
        } catch (destroyError) {
            console.error(`❌ ${canvasId} 기존 차트 삭제 실패:`, destroyError);
            console.log(`🔄 ${canvasId} Canvas 강제 초기화 시도`);
            
            // 강제 초기화
            canvasElement.width = canvasElement.width; // Canvas 완전 초기화
            canvasElement.height = 400;
            canvasElement.width = 800;
        }
        
        // Canvas 컨텍스트 새로 가져오기
        const ctx = canvasElement.getContext('2d');
        const chartType = chartData.chartType || 'bar';
        
        // Canvas 완전 초기화 보장
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        console.log(`🎨 ${canvasId} Canvas 컨텍스트 초기화 완료`);
        
        // 색상 팔레트
        const colors = [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 99, 132, 0.8)', 
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(199, 199, 199, 0.8)',
            'rgba(83, 102, 255, 0.8)'
        ];
        
        const borderColors = colors.map(color => color.replace('0.8', '1'));
        
        // 차트 설정 생성
        let chartConfig = {
            type: chartType,
            data: {},
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: 20
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    title: {
                        display: true,
                        text: chartData.title || `${keyword} 통계 분석`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 15
                    }
                }
            }
        };
        
        // Chart.js에서 지원하는 타입으로 변환
        let actualChartType = chartType;
        if (chartType === 'multiLine') {
            actualChartType = 'line';
        } else if (chartType === 'trend') {
            actualChartType = 'line';
        } else if (chartType === 'comparison') {
            actualChartType = 'bar';
        } else if (chartType === 'multiVar') {
            actualChartType = 'bar';
        } else if (chartType === 'regional') {
            actualChartType = 'bar';
        } else if (chartType === 'correlation') {
            actualChartType = 'bar';
        } else if (chartType === 'bubble') {
            actualChartType = 'bubble';
        }
        
        chartConfig.type = actualChartType;
        
        // 차트 유형별 설정
        if (actualChartType === 'radar') {
            chartConfig.data = {
                labels: chartData.labels,
                datasets: chartData.datasets.map((dataset, index) => ({
                    ...dataset,
                    backgroundColor: dataset.backgroundColor || colors[index % colors.length].replace('0.8', '0.2'),
                    borderColor: dataset.borderColor || borderColors[index % borderColors.length],
                    borderWidth: 2,
                    pointBackgroundColor: dataset.borderColor || borderColors[index % borderColors.length]
                }))
            };
            chartConfig.options.scales = {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            };
        } else if (actualChartType === 'line') {
            chartConfig.data = {
                labels: chartData.labels,
                datasets: chartData.datasets.map((dataset, index) => ({
                    ...dataset,
                    borderColor: borderColors[index % borderColors.length],
                    backgroundColor: colors[index % colors.length],
                    tension: 0.1,
                    fill: false
                }))
            };
            chartConfig.options.scales = {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: chartData.unit || ''
                    }
                }
            };
        } else if (actualChartType === 'pie' || actualChartType === 'doughnut') {
            const pieData = chartData.datasets[0]?.data || chartData.data || [];
            chartConfig.data = {
                labels: chartData.labels,
                datasets: [{
                    label: chartData.datasets[0]?.label || `${keyword} 통계`,
                    data: pieData,
                    backgroundColor: colors.slice(0, pieData.length),
                    borderColor: borderColors.slice(0, pieData.length),
                    borderWidth: 1
                }]
            };
        } else if (actualChartType === 'bubble') {
            // 버블 차트는 일단 산점도로 대체 (안정성을 위해)
            actualChartType = 'scatter';
            chartConfig.type = 'scatter';
            chartConfig.data = {
                datasets: chartData.datasets.map((dataset, index) => ({
                    ...dataset,
                    backgroundColor: colors[index % colors.length],
                    borderColor: borderColors[index % borderColors.length],
                    pointRadius: 8,
                    pointHoverRadius: 12
                }))
            };
            chartConfig.options.scales = {
                x: {
                    type: 'linear',
                    position: 'bottom'
                },
                y: {
                    beginAtZero: true
                }
            };
        } else {
            // bar, scatter 등
            chartConfig.data = {
                labels: chartData.labels,
                datasets: chartData.datasets.map((dataset, idx) => ({
                    ...dataset,
                    backgroundColor: dataset.backgroundColor || colors[idx % colors.length],
                    borderColor: dataset.borderColor || borderColors[idx % borderColors.length],
                    borderWidth: dataset.borderWidth || 2
                }))
            };
            
            if (actualChartType === 'bar') {
                chartConfig.options.scales = {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: chartData.unit || ''
                        }
                    }
                };
            }
        }
        
        console.log(`🎯 차트 설정 완료, 차트 생성 시도...`);
        console.log(`📋 최종 chartConfig:`, chartConfig);
        console.log(`🎨 Canvas Context:`, ctx);
        console.log(`📐 Canvas 크기: ${canvasElement.width}x${canvasElement.height}`);
        
        try {
            console.log(`🔨 ${canvasId} Chart.js 인스턴스 생성 시도...`);
            console.log(`🔧 ${canvasId} 사용할 chartConfig:`, JSON.stringify(chartConfig, null, 2));
            
            const chart = new Chart(ctx, chartConfig);
            console.log(`✅ Chart ${canvasId} 생성 성공!`, chart);
            
            // Canvas 크기 강제 설정
            canvasElement.width = 800;
            canvasElement.height = 400;
            canvasElement.style.width = '800px';
            canvasElement.style.height = '400px';
            console.log(`🔧 ${canvasId} Canvas 크기 강제 설정 완료: ${canvasElement.width}x${canvasElement.height}`);
            
            // 차트 리사이즈 및 재렌더링
            chart.resize();
            chart.update();
            console.log(`🔄 ${canvasId} 차트 리사이즈 및 업데이트 완료`);
            
            // 차트 강제 업데이트
            setTimeout(() => {
                try {
                    chart.update('active');
                    console.log(`🔄 ${canvasId} 차트 강제 업데이트 완료`);
                } catch (updateError) {
                    console.error(`❌ ${canvasId} 차트 업데이트 실패:`, updateError);
                }
            }, 100);
            
            // 차트가 실제로 렌더링되었는지 확인
            setTimeout(() => {
                console.log(`🎯 ${canvasId} 차트 최종 상태:`, chart);
                console.log(`📊 ${canvasId} 차트 렌더링 완료 여부:`, chart.isReady || 'unknown');
                console.log(`📐 ${canvasId} Canvas 최종 크기: ${canvasElement.width}x${canvasElement.height}`);
                
                // 실제로 보이는지 확인
                const rect = canvasElement.getBoundingClientRect();
                console.log(`👁️ ${canvasId} Canvas 화면상 위치:`, rect);
                console.log(`🎨 ${canvasId} Canvas 스타일:`, canvasElement.style.cssText);
            }, 200);
            
        } catch (error) {
            console.error(`❌ Chart ${canvasId} 생성 실패:`, error);
            console.error(`❌ ${canvasId} Error 메시지:`, error.message);
            console.error(`❌ ${canvasId} Error Stack:`, error.stack);
            console.error(`❌ Chart.js 버전:`, Chart.version);
            console.error(`❌ ${canvasId} chartConfig 상태:`, chartConfig);
            console.error(`❌ ${canvasId} Canvas 상태:`, {
                id: canvasElement.id,
                width: canvasElement.width,
                height: canvasElement.height,
                style: canvasElement.style.cssText,
                parentElement: canvasElement.parentElement
            });
            
            // 오류 시에도 기본 차트 시도
            setTimeout(() => {
                try {
                    console.log(`🔄 ${canvasId} 기본 차트 생성 시도...`);
                    const fallbackConfig = {
                        type: 'bar',
                        data: {
                            labels: ['오류'],
                            datasets: [{
                                label: '차트 생성 실패',
                                data: [1],
                                backgroundColor: 'rgba(255, 99, 132, 0.8)'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false
                        }
                    };
                    const fallbackChart = new Chart(ctx, fallbackConfig);
                    console.log(`✅ ${canvasId} 기본 차트 생성 성공`);
                } catch (fallbackError) {
                    console.error(`❌ ${canvasId} 기본 차트도 실패:`, fallbackError);
                }
            }, 500);
        }
    };

    // --- 테이블 표시 함수 ---
    const displayTable = (tableData, keyword) => {
        currentImageUrl = null;
        
        // 팝업에 테이블 표시
        showImagePopup(tableData.title, 'table');
        
        let tableHtml = `
            <div style="height: 100%; overflow: auto;">
                <table style="width: 100%; border-collapse: collapse; margin: 0 auto; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
        `;
        
        tableData.headers.forEach(header => {
            tableHtml += `<th style="border: 1px solid #dee2e6; padding: 12px; text-align: center;">${header}</th>`;
        });
        
        tableHtml += `
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        tableData.rows.forEach((row, index) => {
            const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            tableHtml += `<tr style="background-color: ${bgColor};">`;
            row.forEach(cell => {
                tableHtml += `<td style="border: 1px solid #dee2e6; padding: 10px; text-align: center;">${cell}</td>`;
            });
            tableHtml += `</tr>`;
        });
        
        tableHtml += `
                    </tbody>
                </table>
            </div>
        `;
        
        // 팝업에 테이블 설정
        imagePopupContent.innerHTML = tableHtml;
        
        // 하단 출력 영역 완전히 숨김
        imageDisplayContainer.style.display = 'none';
    };

    // --- 라디오 버튼 변경 이벤트 ---
    const typeRadios = document.querySelectorAll('input[name="image_type"]');
    typeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const selectedType = document.querySelector('input[name="image_type"]:checked').value;
            showAppropriatePanel(selectedType);
        });
    });
    
    // 적절한 패널 표시 함수
    const showAppropriatePanel = (type) => {
        const generateBtn = document.getElementById('generate-image-btn');
        const generateBtnContainer = generateBtn.closest('.form-group-actions');
        
        if (type === 'public_ad') {
            // 공익광고: 상단 버튼 보이기
            generateBtn.textContent = '이미지 불러오기';
            generateBtnContainer.style.display = 'block';
            setupImageAnalysisPanel();
        } else {
            // 통계 차트/통계표: 상단 버튼 숨기고 하단 차트 생성 버튼만 사용
            generateBtnContainer.style.display = 'none';
            imageAnalysisPanel.style.display = 'none';
            dataAnalysisPanel.style.display = 'block';
            dataAnalysisTitle.textContent = type === 'statistics' ? '📊 차트 분석' : '📋 테이블 분석';
            dataQuestionsContainer.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">차트 종류를 선택하고 "선택한 차트로 생성"을 클릭하면<br/>AI가 생성한 분석 질문들이 여기에 표시됩니다.</p>';
            showDataModelAnswerBtn.disabled = true;
            logToConsole(`${type === 'statistics' ? '차트' : '테이블'} 분석 패널 준비 상태`);
        }
    };

    // --- 차트 생성 함수들 ---
    const generateSingleChart = async (keyword, chartType) => {
        const selectedType = document.querySelector('input[name="image_type"]:checked').value;
        
        // 로딩 메시지 설정
        let loadingMessage, loadingText;
        if (selectedType === 'statistics') {
            loadingMessage = '차트 생성 중...';
            loadingText = chartType === 'auto' 
                ? 'AI가 선택된 차트 타입으로 통계 차트를 생성하고 있습니다...'
                : `AI가 ${getChartDisplayName(chartType)}를 생성하고 있습니다...`;
        } else {
            loadingMessage = '이미지 불러오는 중...';
            loadingText = 'AI가 통계표를 생성하고 있습니다...';
        }
        
        imageDisplayContainer.style.display = 'block';
        imageDisplay.innerHTML = `<div class="loader-container"><div class="loader"></div><p>${loadingText}</p></div>`;

        const requestData = { 
            type: selectedType, 
            keyword,
            ...(chartType !== 'auto' && { chartType })
        };
        
        console.log('📡 단일 차트 API 요청 데이터:', requestData);
        
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `서버 오류: ${response.status}`);
        }

        const data = await response.json();
        console.log('📡 단일 차트 API 응답:', data);
        
        if (data.type === 'chart') {
            displayChart(data.data, data.keyword);
            setupDataAnalysisPanel('chart', data.data, data.questions, keyword);
        } else if (data.type === 'table') {
            displayTable(data.data, data.keyword);
            setupDataAnalysisPanel('table', data.data, data.questions, keyword);
        }
    };

    const generateMultipleCharts = async (keyword, chartTypes) => {
        const selectedType = document.querySelector('input[name="image_type"]:checked').value;
        
        // 차트 배열 초기화 (중요!)
        generatedCharts = [];
        
        // 로딩 팝업 표시
        showLoadingPopup(`📊 ${chartTypes.length}개의 차트를 생성중...`);

        const chartNames = chartTypes.map(type => getChartDisplayName(type)).join(', ');
        console.log('📡 다중 차트 생성 시작:', { keyword, chartTypes, chartNames });
        
        // 임시 디버깅: 선택된 차트들을 팝업에 표시
        console.log('🎯 요청된 차트 타입들:', chartTypes);
        
        // 차트 타입별 한글명 표시
        const chartNamesKorean = chartTypes.map(type => getChartDisplayName(type));
        console.log('🎯 요청된 차트들 (한글):', chartNamesKorean);

        // 모든 차트를 병렬로 생성
        const chartPromises = chartTypes.map(async (chartType, index) => {
            // 각 차트마다 다른 랜덤 키워드 사용
            const chartKeyword = getRandomKeyword();
            console.log(`📡 차트 ${index + 1} 키워드: ${chartKeyword}`);
            
            const requestData = { 
                type: selectedType, 
                keyword: chartKeyword,
                chartType 
            };
            
            console.log(`📡 차트 ${index + 1} API 요청:`, requestData);
            
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
                console.error(`❌ 차트 ${index + 1} (${chartType}) API 실패:`, errorData);
                throw new Error(`차트 ${index + 1} (${getChartDisplayName(chartType)}) 생성 실패: ${errorData.error || response.status}`);
            }

            const data = await response.json();
            return { ...data, chartType, keyword: chartKeyword, index };
        });

        const chartResults = await Promise.allSettled(chartPromises);
        console.log('📡 다중 차트 생성 완료:', chartResults);
        
        // 성공한 차트들만 필터링
        const successfulCharts = chartResults
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
            
        const failedCharts = chartResults
            .filter(result => result.status === 'rejected');
            
        console.log(`✅ 성공한 차트: ${successfulCharts.length}개`);
        console.log(`❌ 실패한 차트: ${failedCharts.length}개`);
        console.log('📊 성공한 차트 목록:', successfulCharts.map(c => c.chartType));
        
        if (failedCharts.length > 0) {
            console.error('실패한 차트들:', failedCharts.map(f => f.reason?.message || f.reason));
            console.log('📋 실패한 차트 상세 정보:');
            failedCharts.forEach((failed, index) => {
                console.log(`   ${index + 1}. ${failed.reason?.message || failed.reason}`);
            });
            console.warn(`⚠️ ${chartTypes.length}개 요청 중 ${failedCharts.length}개 실패`);
        }
        
        if (successfulCharts.length === 0) {
            throw new Error('모든 차트 생성이 실패했습니다.');
        }

        // 성공한 차트가 있으면 모두 탭 구조로 표시
        if (successfulCharts.length >= 1) {
            console.log('📊 차트 표시 시작 (탭 구조)');
            displaySimpleMultipleCharts(successfulCharts, keyword);
            setupMultipleChartsAnalysisPanel(successfulCharts, keyword);
        }

        // 성공한 차트들 정보를 콘솔에 로그
        console.log('📊 생성된 차트 목록:', successfulCharts.map(r => `${getChartDisplayName(r.chartType)} (질문 ${r.questions?.length || 0}개)`));
        
        // 부분 성공 메시지를 콘솔 및 팝업으로 표시
        if (failedCharts.length > 0) {
            console.warn(`⚠️ 부분 성공: ${successfulCharts.length}개 차트 생성 성공, ${failedCharts.length}개 차트 생성 실패`);
            
            // 실패 원인 상세 정보
            failedCharts.forEach((failed, index) => {
                console.error(`❌ 실패 차트 ${index + 1}:`, failed.reason);
            });
            
            // 사용자에게 알림
            setTimeout(() => {
                alert(`📊 차트 생성 결과:\n✅ 성공: ${successfulCharts.length}개\n❌ 실패: ${failedCharts.length}개\n\n실패 원인은 콘솔(F12)에서 확인하세요.`);
            }, 1000);
        } else {
            console.log(`✅ 모든 차트 생성 성공: ${successfulCharts.length}개`);
        }
        
        // 성공한 차트 결과를 전역 변수에 저장
        window.multipleChartResults = successfulCharts;
    };

    // 간단한 다중 차트 표시 함수
    const displaySimpleMultipleCharts = (chartResults, keyword) => {
        // 하단 출력 영역 완전히 제거
        imageDisplayContainer.style.display = 'none';
        imageDisplay.innerHTML = '';
        
        // 차트 배열 초기화 후 모든 차트 추가
        generatedCharts = [];
        
        chartResults.forEach((result, index) => {
            if (result.type === 'chart') {
                const chartInfo = result.data.purpose ? ` (${result.data.purpose})` : '';
                const selectedChartType = result.data.패턴정보?.선택된차트타입 || result.data.chartType || 'bar';
                
                generatedCharts.push({
                    chartData: result.data,
                    keyword: result.keyword,
                    title: result.data.title + chartInfo,
                    chartType: selectedChartType,
                    displayName: getChartDisplayName(selectedChartType)
                });
            }
        });
        
        console.log(`✅ ${generatedCharts.length}개 차트를 배열에 추가완료`);
        console.log('📊 생성된 차트 목록:', generatedCharts.map(c => c.displayName));
        
        // 간단한 세로 나열 방식으로 표시
        if (generatedCharts.length >= 1) {
            console.log('🎯 간단한 세로 나열로 표시 (성공한 차트 개수:', generatedCharts.length, '개)');
            showChartsSimple();
        } else {
            console.error('❌ 표시할 차트가 없습니다!');
        }
        
        console.log('✅ 차트 표시 완료');
    };

    // 다중 차트 표시 함수
    const displayMultipleCharts = (chartResults, keyword) => {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'multiple-charts-container';
        chartContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        `;

        chartResults.forEach((result, index) => {
            const chartWrapper = document.createElement('div');
            chartWrapper.className = 'chart-wrapper';
            chartWrapper.style.cssText = `
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 15px;
                background-color: #fff;
            `;

            const chartTitle = document.createElement('h4');
            chartTitle.textContent = `${getChartDisplayName(result.chartType)} - ${keyword}`;
            chartTitle.style.cssText = `
                margin: 0 0 15px 0;
                color: #333;
                font-size: 1.1em;
                text-align: center;
            `;

            const chartDiv = document.createElement('div');
            chartDiv.id = `chart-${index}`;
            chartDiv.style.cssText = `
                width: 100%;
                height: 300px;
                cursor: pointer;
            `;

            chartWrapper.appendChild(chartTitle);
            chartWrapper.appendChild(chartDiv);
            chartContainer.appendChild(chartWrapper);

            // 차트 클릭 시 팝업으로 크게 보기 (일단 주석 처리)
            chartDiv.addEventListener('click', () => {
                console.log('차트 클릭:', getChartDisplayName(result.chartType));
                // showChartInPopup(result.data, `${getChartDisplayName(result.chartType)} - ${keyword}`);
            });

            // Chart.js로 차트 렌더링
            if (result.type === 'chart') {
                renderChartInDiv(chartDiv.id, result.data);
            } else if (result.type === 'table') {
                renderTableInDiv(chartDiv.id, result.data);
            }
        });

        // 하단 출력 영역 완전히 제거
        imageDisplayContainer.style.display = 'none';
        imageDisplay.innerHTML = '';
        
        // 첫 번째 차트를 바로 팝업에 표시
        if (chartResults.length > 0) {
            const firstResult = chartResults[0];
            if (firstResult.type === 'chart') {
                displayChart(firstResult.data, firstResult.keyword);
            } else if (firstResult.type === 'table') {
                displayTable(firstResult.data, firstResult.keyword);
            }
        }
    };

    // 다중 차트 분석 패널 설정 함수
    const setupMultipleChartsAnalysisPanel = (chartResults, keyword) => {
        imageAnalysisPanel.style.display = 'none';
        dataAnalysisPanel.style.display = 'block';
        
        // 모든 차트의 질문을 통합
        const allQuestions = [];
        chartResults.forEach((result, index) => {
            if (result.questions && result.questions.length > 0) {
                const chartName = getChartDisplayName(result.chartType);
                result.questions.forEach((question, qIndex) => {
                    allQuestions.push({
                        id: `chart${index}_q${qIndex}`,
                        text: `[${chartName}] ${question.question}`,
                        chartIndex: index,
                        originalQuestion: question
                    });
                });
            }
        });

        dataAnalysisTitle.textContent = `📊 다중 차트 분석 - ${keyword}`;
        dataQuestionsContainer.innerHTML = '';

        if (allQuestions.length > 0) {
            allQuestions.forEach((questionItem, index) => {
                const questionCard = document.createElement('div');
                questionCard.className = 'qa-card';
                
                const questionText = document.createElement('div');
                questionText.className = 'question-text';
                questionText.textContent = `${index + 1}. ${questionItem.text}`;
                
                const userInput = document.createElement('textarea');
                userInput.className = 'user-answer-input';
                userInput.id = questionItem.id;
                userInput.placeholder = '답변을 입력하세요...';
                
                questionCard.appendChild(questionText);
                questionCard.appendChild(userInput);
                dataQuestionsContainer.appendChild(questionCard);
            });

            // 모범답안 버튼 활성화
            showDataModelAnswerBtn.disabled = false;
            
            // 모범답안 클릭 시 모든 답안 표시
            const newHandler = () => showMultipleChartsModelAnswers(chartResults, allQuestions, keyword);
            showDataModelAnswerBtn.removeEventListener('click', showDataModelAnswerBtn.currentHandler);
            showDataModelAnswerBtn.addEventListener('click', newHandler);
            showDataModelAnswerBtn.currentHandler = newHandler;
        } else {
            dataQuestionsContainer.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">분석 질문을 생성하는 중 오류가 발생했습니다.</p>';
            showDataModelAnswerBtn.disabled = true;
        }
        
        logToConsole(`다중 차트 분석 패널 설정 완료: ${allQuestions.length}개 질문`);
    };

    // 다중 차트 모범답안 표시 함수
    const showMultipleChartsModelAnswers = (chartResults, allQuestions, keyword) => {
        allQuestions.forEach((questionItem) => {
            const inputElement = document.getElementById(questionItem.id);
            const questionCard = inputElement.closest('.qa-card');
            
            // 기존 모범답안 제거
            const existingAnswer = questionCard.querySelector('.model-answer');
            if (existingAnswer) {
                existingAnswer.remove();
            }
            
            // 새 모범답안 추가
            const modelAnswer = document.createElement('div');
            modelAnswer.className = 'model-answer';
            modelAnswer.innerHTML = `<strong>모범답안:</strong><br/>${questionItem.originalQuestion.answer}`;
            questionCard.appendChild(modelAnswer);
        });
        
        showDataModelAnswerBtn.disabled = true;
        logToConsole('다중 차트 모범답안 표시 완료');
    };

    // 차트를 div에 렌더링하는 헬퍼 함수
    const renderChartInDiv = (divId, chartData) => {
        const div = document.getElementById(divId);
        if (!div) {
            console.error('차트 div를 찾을 수 없습니다:', divId);
            return;
        }
        
        const canvas = document.createElement('canvas');
        canvas.id = `canvas-${divId}`;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
        div.innerHTML = '';
        div.appendChild(canvas);
        
        try {
            const ctx = canvas.getContext('2d');
            const chartType = chartData.chartType || 'bar';
            
            new Chart(ctx, {
                type: chartType,
                data: chartData.data || chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: chartData.title || '차트'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('차트 렌더링 오류:', error);
            div.innerHTML = `<p style="text-align: center; padding: 40px; color: #666;">차트를 표시할 수 없습니다</p>`;
        }
    };

    // 테이블을 div에 렌더링하는 헬퍼 함수
    const renderTableInDiv = (divId, tableData) => {
        const div = document.getElementById(divId);
        if (!div) {
            console.error('테이블 div를 찾을 수 없습니다:', divId);
            return;
        }
        
        try {
            div.innerHTML = tableData.html || '<p style="text-align: center; padding: 40px; color: #666;">테이블 데이터를 표시할 수 없습니다</p>';
        } catch (error) {
            console.error('테이블 렌더링 오류:', error);
            div.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">테이블을 표시할 수 없습니다</p>';
        }
    };

    // --- 차트 선택 관련 이벤트 리스너들 ---
    
    // 이미지 타입 라디오 버튼 변경 시
    imageTypeRadios.forEach(radio => {
        radio.addEventListener('change', showChartSelectionIfNeeded);
    });
    
    // 차트 타입 버튼 클릭 시
    chartTypeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const chartType = btn.getAttribute('data-chart-type');
            toggleChartSelection(chartType);
        });
    });
    
    // 선택 초기화 버튼
    clearSelectionBtn.addEventListener('click', () => {
        selectedChartTypes = [];
        updateSelectedChartsDisplay();
    });
    
    // 선택한 차트로 생성 버튼
    generateSelectedChartsBtn.addEventListener('click', async () => {
        const keyword = keywordInput.value.trim();
        if (!keyword) {
            alert('키워드를 입력해주세요.');
            return;
        }
        
        if (selectedChartTypes.length === 0) {
            alert('차트 타입을 선택해주세요.');
            return;
        }
        
        setLoading(generateSelectedChartsBtn, true, '생성 중...');
        
        try {
            if (selectedChartTypes.includes('auto') || selectedChartTypes.length === 1) {
                // AI 자동 선택이거나 1개 선택인 경우 기존 로직 사용
                await generateSingleChart(keyword, selectedChartTypes[0]);
            } else {
                // 2개 선택인 경우 다중 차트 생성
                await generateMultipleCharts(keyword, selectedChartTypes);
            }
        } catch (error) {
            console.error('차트 생성 실패:', error);
            alert('차트 생성에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(generateSelectedChartsBtn, false);
        }
    });

    // --- 키워드 입력창 강제 활성화 ---
    const forceEnableKeywordInput = () => {
        const keywordInput = document.getElementById('keyword-input');
        if (keywordInput) {
            // 모든 비활성화 속성 제거
            keywordInput.removeAttribute('disabled');
            keywordInput.removeAttribute('readonly');
            keywordInput.style.pointerEvents = 'auto';
            keywordInput.style.userSelect = 'text';
            keywordInput.tabIndex = 0;
            
            // 입력창에 포커스 가능하도록 설정
            keywordInput.addEventListener('click', () => {
                keywordInput.focus();
            });
            
            // 디버깅용 로그
            console.log('🔧 키워드 입력창 강제 활성화 완료');
            console.log('입력창 상태:', {
                disabled: keywordInput.disabled,
                readOnly: keywordInput.readOnly,
                pointerEvents: window.getComputedStyle(keywordInput).pointerEvents,
                display: window.getComputedStyle(keywordInput).display
            });
        }
    };

    // --- 페이지 로드 시 초기화 ---
    resetUI();
    updateSelectedChartsDisplay();
    showChartSelectionIfNeeded();
    // 기본 선택된 타입에 맞는 패널 표시
    const defaultType = document.querySelector('input[name="image_type"]:checked').value;
    showAppropriatePanel(defaultType);
    
    // 키워드 입력창 강제 활성화 (약간의 지연을 두고)
    setTimeout(forceEnableKeywordInput, 100);
    
    // 테스트용: 키워드 입력창 클릭 시 확인
    setTimeout(() => {
        const keywordInput = document.getElementById('keyword-input');
        if (keywordInput) {
            keywordInput.addEventListener('focus', () => {
                console.log('✅ 키워드 입력창 포커스 성공!');
            });
            
            keywordInput.addEventListener('input', (e) => {
                console.log('✅ 키워드 입력 감지:', e.target.value);
            });
            
            // 강제로 테스트 값 입력해보기
            console.log('🧪 키워드 입력창 테스트 시작...');
            keywordInput.value = '테스트';
            keywordInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('🧪 테스트 값 입력 완료:', keywordInput.value);
        }
    }, 200);
});