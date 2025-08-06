document.addEventListener('DOMContentLoaded', function() {
    // 게임 변수들
    let gameTimer;
    let gameStartTime;
    let gameData = [];
    let gameAnswersShown = false;
    let userSelections = {};

    // DOM 요소들
    const gameStartBtn = document.getElementById('game-start-btn');
    const checkAnswersBtn = document.getElementById('check-answers-btn');
    const resetGameBtn = document.getElementById('reset-game-btn');
    const timerDisplay = document.getElementById('timer');
    const gameTableBody = document.getElementById('game-table-body');

    // 이벤트 리스너 등록
    if (gameStartBtn) {
        gameStartBtn.addEventListener('click', function(event) {
            console.log('게임 시작 버튼이 클릭되었습니다!');
            event.preventDefault();
            startGame();
        });
        console.log('게임 시작 버튼 이벤트 리스너 추가됨');
    }
    
    if (checkAnswersBtn) {
        checkAnswersBtn.addEventListener('click', showAnswers);
    }

    if (resetGameBtn) {
        resetGameBtn.addEventListener('click', resetGame);
    }

    // 선택 버튼들에 이벤트 리스너 추가
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('choice-btn')) {
            handleChoiceClick(event.target);
        }
    });

    // 게임 시작 함수
    function startGame() {
        console.log('게임 시작 함수 호출됨');
        
        // 게임 초기화
        gameData = [];
        gameAnswersShown = false;
        userSelections = {};
        
        // UI 초기화
        clearTable();
        if (checkAnswersBtn) {
            checkAnswersBtn.disabled = true;
        }
        
        // 타이머는 아직 시작하지 않음 (제시문 생성 완료 후 시작)
        timerDisplay.textContent = '00:00';
        
        // 제시문 타입 미리 결정 (논증과 비논증을 적당히 섞어서)
        const passageTypes = generatePassageTypes();
        
        // 10개의 제시문 생성
        generateGamePassages(passageTypes);
        
        if (gameStartBtn) {
            gameStartBtn.textContent = '제시문 생성 중...';
            gameStartBtn.disabled = true;
        }
        
        console.log('게임 시작 - 제시문 생성 중');
    }

    // 제시문 타입들을 미리 결정하는 함수
    function generatePassageTypes() {
        const types = [];
        // 논증과 비논증을 5:5 또는 6:4 정도로 섞어서 생성
        for (let i = 0; i < 10; i++) {
            if (i < 5) {
                types.push(Math.random() < 0.6 ? 'argument' : 'non_argument');
            } else {
                // 나머지는 반대로 배치하여 균형 맞추기
                types.push(types.filter(t => t === 'argument').length < 5 ? 'argument' : 'non_argument');
            }
        }
        // 배열 섞기
        return types.sort(() => Math.random() - 0.5);
    }

    // 테이블 초기화
    function clearTable() {
        const passageCells = document.querySelectorAll('.passage-cell');
        const timeCells = document.querySelectorAll('.time-cell');
        const answerCells = document.querySelectorAll('.answer-cell');
        const choiceBtns = document.querySelectorAll('.choice-btn');
        
        passageCells.forEach(cell => cell.textContent = '');
        timeCells.forEach(cell => cell.textContent = '');
        answerCells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'answer-cell'; // 클래스 초기화
        });
        choiceBtns.forEach(btn => {
            btn.classList.remove('selected');
            btn.disabled = false;
        });
    }

    // 타이머 시작
    function startTimer() {
        gameTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            timerDisplay.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    // 타이머 정지
    function stopTimer() {
        clearInterval(gameTimer);
    }

    // 제시문 생성 (병렬 처리로 속도 개선)
    async function generateGamePassages(passageTypes) {
        console.log('제시문 생성 시작 (병렬 처리)');
        try {
            // 모든 제시문을 병렬로 동시 생성
            const promises = passageTypes.map(async (type, index) => {
                console.log(`제시문 ${index + 1} 생성 시작... (타입: ${type})`);
                
                const keyword = generateRandomKeyword();
                
                // 로컬에서 빠르게 생성하거나 API 호출
                const passageData = await generateQuickPassage(keyword, type);
                
                return {
                    passage: passageData.text,
                    correctType: passageData.type,
                    explanation: passageData.explanation,
                    userChoice: null,
                    timeStamp: null
                };
            });
            
            // 모든 Promise가 완료될 때까지 대기
            const results = await Promise.all(promises);
            gameData = results;
            
            console.log('모든 제시문 생성 완료 - 화면에 일괄 출력');
            
            // 모든 제시문을 한꺼번에 화면에 출력
            gameData.forEach((data, index) => {
                displayPassageInTable(index + 1, data.passage);
            });
            
            console.log('제시문 화면 출력 완료 - 타이머 시작');
            
            // 모든 제시문이 화면에 출력된 후 타이머 시작
            gameStartTime = Date.now();
            startTimer();
            
            // 버튼 텍스트 변경
            if (gameStartBtn) {
                gameStartBtn.textContent = '게임 진행 중...';
            }
            
        } catch (error) {
            console.error('게임 제시문 생성 중 오류:', error);
            alert('게임 제시문 생성 중 오류가 발생했습니다.');
            resetGame();
        }
    }

    // 짧은 제시문 생성 함수
    async function generateShortPassage(keyword, type) {
        try {
            const response = await fetch('/api/generate-distinction-passage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    keyword: keyword
                })
            });

            if (response.ok) {
                const data = await response.json();
                
                // 제시문을 3문장 정도로 줄이기
                const sentences = data.passageText.split(/[.!?]+/).filter(s => s.trim().length > 0);
                const shortText = sentences.slice(0, 3).join('. ') + '.';
                
                return {
                    text: shortText,
                    type: data.passageType.includes('논증') ? '논증' : '비논증',
                    explanation: data.explanation
                };
            } else {
                throw new Error(`서버 응답 오류: ${response.status}`);
            }
        } catch (error) {
            console.error('제시문 생성 오류:', error);
            // 오류 시 기본 제시문 반환
            return generateDefaultPassage(keyword, type);
        }
    }

    // 빠른 제시문 생성 (API 호출로 고품질 생성)
    async function generateQuickPassage(keyword, type) {
        try {
            // API 호출로 고품질 제시문 생성
            const response = await fetch('/api/generate-game-passage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    keyword: keyword,
                    type: type 
                })
            });
            
            if (!response.ok) {
                throw new Error('API 호출 실패');
            }
            
            const data = await response.json();
            return {
                text: data.text,
                type: data.type,
                explanation: data.explanation
            };
        } catch (error) {
            console.error('API 제시문 생성 실패, 로컬 방식으로 폴백:', error);
            // 에러 시 로컬 생성으로 폴백
            return generateLocalPassage(keyword, type);
        }
    }

    // 로컬 제시문 생성 함수
    function generateLocalPassage(keyword, type) {
        const argumentTemplates = [
            {
                text: `${keyword}은 현대 사회에서 매우 중요한 역할을 한다. 여러 연구에 따르면 ${keyword}이 사회 발전에 긍정적인 영향을 미치고 있다. 우리는 ${keyword}에 더 많은 관심과 투자를 해야 한다.`,
                explanation: `이 글은 ${keyword}의 중요성을 주장하고 연구 결과를 근거로 제시하는 논증문입니다.`
            },
            {
                text: `${keyword}이 우리 삶에 미치는 부정적 영향이 심각하다. 최근 조사 결과 ${keyword}으로 인한 문제점들이 계속 증가하고 있다. 이에 대한 강력한 규제와 대책이 시급히 필요하다.`,
                explanation: `이 글은 ${keyword}의 문제점을 지적하고 대책의 필요성을 주장하는 논증문입니다.`
            },
            {
                text: `많은 사람들이 ${keyword}을 찬성하고 있다. 전문가들도 ${keyword}의 효과성을 인정하고 있으며, 실제로 좋은 결과를 보여주고 있다. ${keyword}을 적극적으로 추진해야 한다.`,
                explanation: `이 글은 ${keyword}에 대한 찬성 입장을 표명하고 근거를 제시하는 논증문입니다.`
            },
            {
                text: `${keyword}의 도입은 신중하게 검토되어야 한다. 다른 지역의 사례를 보면 ${keyword}으로 인한 부작용이 많이 보고되었다. 충분한 준비 없이 ${keyword}을 시행하는 것은 위험하다.`,
                explanation: `이 글은 ${keyword}의 도입에 대한 신중론을 주장하고 다른 지역의 사례를 근거로 제시하는 논증문입니다.`
            },
            {
                text: `${keyword}은 현재 우리가 직면한 문제의 해결책이 될 수 있다. 선진국들의 성공 사례가 이를 뒷받침한다. ${keyword}의 효과적인 활용 방안을 마련해야 한다.`,
                explanation: `이 글은 ${keyword}을 해결책으로 제시하고 선진국 사례를 근거로 활용 방안을 주장하는 논증문입니다.`
            }
        ];

        const nonArgumentTemplates = [
            {
                text: `${keyword}은 다양한 특징을 가지고 있다. 역사적으로 ${keyword}은 여러 단계를 거쳐 발전해왔다. 현재 ${keyword}은 우리 사회의 한 부분으로 자리잡고 있다.`,
                explanation: `이 글은 ${keyword}의 특징과 역사를 설명하는 비논증문입니다.`
            },
            {
                text: `${keyword}이란 특정한 의미를 가진 개념이다. 일반적으로 ${keyword}은 여러 요소로 구성되어 있다. 사람들은 ${keyword}을 다양한 방식으로 이해하고 있다.`,
                explanation: `이 글은 ${keyword}의 정의와 구성 요소를 설명하는 비논증문입니다.`
            },
            {
                text: `${keyword}의 과정은 여러 단계로 나누어진다. 먼저 초기 단계에서는 기본적인 준비가 이루어진다. 그 다음 본격적인 ${keyword} 활동이 시작되고, 마지막으로 결과가 도출된다.`,
                explanation: `이 글은 ${keyword}의 과정을 순서대로 설명하는 비논증문입니다.`
            },
            {
                text: `${keyword}은 우리 일상에서 자주 접할 수 있는 현상이다. 이러한 ${keyword}은 여러 형태로 나타난다. 사람들은 각자의 경험에 따라 ${keyword}을 다르게 받아들인다.`,
                explanation: `이 글은 ${keyword}의 일반적인 특성과 현상을 묘사하는 비논증문입니다.`
            },
            {
                text: `${keyword}의 종류는 크게 세 가지로 분류할 수 있다. 첫 번째는 전통적인 ${keyword}이고, 두 번째는 현대적인 ${keyword}이다. 세 번째는 최근에 등장한 새로운 형태의 ${keyword}이다.`,
                explanation: `이 글은 ${keyword}을 유형별로 분류하여 설명하는 비논증문입니다.`
            },
            {
                text: `지난 주말에 ${keyword} 관련 행사가 열렸다. 많은 사람들이 참여했고 다양한 활동이 진행되었다. 참가자들은 ${keyword}에 대한 새로운 경험을 할 수 있었다.`,
                explanation: `이 글은 ${keyword} 관련 행사의 모습을 서술하는 비논증문입니다.`
            }
        ];

        if (type === 'argument') {
            const template = argumentTemplates[Math.floor(Math.random() * argumentTemplates.length)];
            return {
                text: template.text,
                type: '논증',
                explanation: template.explanation
            };
        } else {
            const template = nonArgumentTemplates[Math.floor(Math.random() * nonArgumentTemplates.length)];
            return {
                text: template.text,
                type: '비논증',
                explanation: template.explanation
            };
        }
    }

    // 테이블에 제시문 표시
    function displayPassageInTable(row, text) {
        const passageCell = document.querySelector(`tr[data-row="${row}"] .passage-cell`);
        if (passageCell) {
            passageCell.textContent = text;
        }
    }

    // 랜덤 키워드 생성 (1000개+ 키워드)
    function generateRandomKeyword() {
        const keywords = [
            // 기술/디지털 (100개)
            '스마트폰', '인터넷', '인공지능', '빅데이터', '클라우드', '사물인터넷', '블록체인', '가상현실', '증강현실', '메타버스',
            '로봇', '드론', '자율주행', '전기차', '5G', '6G', '양자컴퓨터', '바이오테크', '나노기술', '3D프린팅',
            '홀로그램', '스마트워치', '태블릿', '노트북', '데스크톱', '서버', '데이터베이스', '소프트웨어', '앱개발', '웹개발',
            '사이버보안', '해킹', '암호화', '디지털화폐', '비트코인', '이더리움', 'NFT', 'SNS', '유튜브', '틱톡',
            '인스타그램', '페이스북', '트위터', '카카오톡', '줌', '넷플릭스', '스트리밍', '게임', '모바일게임', 'e스포츠',
            '프로그래밍', '코딩', '알고리즘', '머신러닝', '딥러닝', '데이터분석', '클라우드컴퓨팅', '서버리스', '마이크로서비스', 'API',
            '오픈소스', '깃허브', '아마존', '구글', '애플', '마이크로소프트', '테슬라', '스페이스X', '우버', '에어비앤비',
            '배달앱', '쇼핑앱', '핀테크', '디지털뱅킹', '온라인결제', 'QR코드', 'NFC', '생체인식', '음성인식', '번역앱',
            '내비게이션', 'GPS', '위성', '통신', '광섬유', '와이파이', '블루투스', '무선충전', '배터리', '반도체',
            '칩셋', '프로세서', '그래픽카드', '메모리', 'SSD', 'HDD', '모니터', '키보드', '마우스', '헤드셋',

            // 음식/요리 (100개)
            '피자', '햄버거', '치킨', '스테이크', '파스타', '라면', '김치', '불고기', '갈비', '삼겹살',
            '냉면', '비빔밥', '김밥', '떡볶이', '순대', '호떡', '붕어빵', '타코야키', '초밥', '라멘',
            '우동', '소바', '카레', '짜장면', '짬뽕', '탕수육', '마라탕', '훠궈', '딤섬', '만두',
            '샐러드', '샌드위치', '브런치', '베이글', '도넛', '크로와상', '마카롱', '케이크', '쿠키', '초콜릿',
            '아이스크림', '요거트', '치즈', '빵', '쌀', '밀', '옥수수', '감자', '고구마', '토마토',
            '양파', '마늘', '생강', '당근', '브로콜리', '시금치', '상추', '배추', '무', '오이',
            '호박', '가지', '피망', '고추', '버섯', '콩', '견과류', '아몬드', '호두', '땅콩',
            '사과', '바나나', '오렌지', '포도', '딸기', '수박', '참외', '메론', '복숭아', '자두',
            '배', '감', '귤', '레몬', '라임', '파인애플', '망고', '키위', '아보카도', '코코넛',
            '커피', '차', '녹차', '홍차', '허브티', '우유', '두유', '주스', '탄산음료', '맥주',

            // 스포츠/운동 (100개)
            '축구', '야구', '농구', '배구', '테니스', '배드민턴', '탁구', '골프', '수영', '마라톤',
            '사이클', '등산', '하이킹', '클라이밍', '스키', '스노보드', '서핑', '요가', '필라테스', '헬스',
            '크로스핏', '복싱', '태권도', '유도', '검도', '합기도', '카라테', '격투기', 'MMA', '레슬링',
            '체조', '피겨스케이팅', '쇼트트랙', '스피드스케이팅', '컬링', '아이스하키', '루지', '봅슬레이', '스켈레톤', '바이애슬론',
            '양궁', '사격', '펜싱', '승마', '조정', '카누', '요트', '윈드서핑', '다이빙', '수구',
            '럭비', '미식축구', '하키', '크리켓', '소프트볼', '볼링', '당구', '다트', '카트', '모터스포츠',
            '파쿠르', '스케이트보드', '롤러블레이드', '인라인스케이트', '스쿠터', '비보잉', '댄스', '발레', '힙합', '재즈댄스',
            '에어로빅', '줌바', '스피닝', '런닝머신', '웨이트트레이닝', '덤벨', '바벨', '케틀벨', '밴드운동', '맨몸운동',
            '플랭크', '스쿼트', '런지', '버피', '풀업', '푸시업', '싯업', '크런치', '데드리프트', '벤치프레스',
            '턱걸이', '철봉', '평행봉', '줄넘기', '훌라후프', '트램펄린', '암벽등반', '볼더링', '패러글라이딩', '번지점프',

            // 취미/문화 (100개)
            '독서', '글쓰기', '일기', '블로그', '소설', '시', '에세이', '만화', '웹툰', '애니메이션',
            '영화', '드라마', '다큐멘터리', '뮤지컬', '연극', '콘서트', '페스티벌', '전시회', '박물관', '미술관',
            '음악', '노래', '랩', '힙합', '록', '팝', '재즈', '클래식', '국악', '트로트',
            '기타', '피아노', '드럼', '베이스', '바이올린', '첼로', '플루트', '색소폰', '트럼펫', '하모니카',
            '사진', '촬영', '인스타', '셀피', '풍경사진', '인물사진', '스냅사진', '여행사진', '드론촬영', '타임랩스',
            '그림', '스케치', '수채화', '유화', '아크릴화', '디지털아트', '캘리그라피', '서예', '조각', '도예',
            '뜨개질', '자수', '퀼트', '비즈공예', '목공예', '가죽공예', '도자기', '캔들', '비누', '향수',
            '요리', '베이킹', '홈카페', '바리스타', '와인', '칵테일', '맥주', '위스키', '사케', '차',
            '정원가꾸기', '원예', '화분', '다육식물', '선인장', '꽃꽂이', '분재', '수경재배', '베란다정원', '텃밭',
            '여행', '배낭여행', '캠핑', '글램핑', '펜션', '호텔', '리조트', '온천', '스파', '마사지',

            // 생활/일상 (100개)
            '집', '아파트', '주택', '원룸', '투룸', '오피스텔', '빌라', '펜트하우스', '전세', '월세',
            '매매', '이사', '인테리어', '리모델링', '가구', '소파', '침대', '책상', '의자', '옷장',
            '냉장고', '세탁기', '에어컨', '텔레비전', '전자레인지', '오븐', '인덕션', '청소기', '로봇청소기', '공기청정기',
            '가습기', '제습기', '선풍기', '히터', '전기장판', '가스레인지', '정수기', '믹서기', '커피머신', '토스터',
            '청소', '빨래', '다림질', '설거지', '요리', '쇼핑', '장보기', '마트', '백화점', '온라인쇼핑',
            '배송', '택배', '배달', '퀵서비스', '대중교통', '지하철', '버스', '택시', '자전거', '킥보드',
            '출퇴근', '등하교', '통학', '교통카드', '주차', '주유', '세차', '차량관리', '보험', '은행',
            '적금', '예금', '투자', '펀드', '주식', '부동산', '대출', '신용카드', '체크카드', '현금',
            '가계부', '용돈', '알바', '아르바이트', '투잡', '부업', '창업', '프리랜서', '재택근무', '출장',
            '회식', '야근', '연봉', '보너스', '휴가', '연차', '병가', '육아휴직', '퇴직', '이직',

            // 교육/학습 (100개)
            '학교', '유치원', '초등학교', '중학교', '고등학교', '대학교', '대학원', '어학원', '학원', '과외',
            '온라인강의', '인터넷강의', '동영상강의', '라이브강의', '스터디', '독서실', '도서관', '카페스터디', '그룹스터디', '과제',
            '숙제', '시험', '중간고사', '기말고사', '모의고사', '수능', '입시', '대입', '편입', '대학원입시',
            '토익', '토플', '아이엘츠', 'HSK', 'JLPT', '자격증', '기사', '기능사', '컴활', '정보처리',
            '공무원', '고시', '사법고시', '행정고시', '외무고시', '기술고시', '회계사', '변호사', '의사', '약사',
            '국어', '영어', '수학', '과학', '사회', '역사', '지리', '화학', '물리', '생물',
            '지구과학', '정치', '경제', '철학', '심리학', '사회학', '인류학', '언어학', '문학', '예술',
            '음악', '미술', '체육', '기술', '가정', '도덕', '종교', '한문', '일본어', '중국어',
            '프랑스어', '독일어', '스페인어', '러시아어', '아랍어', '힌디어', '베트남어', '태국어', '인도네시아어', '말레이어',
            '라틴어', '그리스어', '히브리어', '산스크리트어', '에스페란토', '수화', '점자', '컴퓨터', '프로그래밍', '코딩',

            // 건강/의료 (100개)
            '건강', '질병', '감기', '독감', '코로나', '알레르기', '천식', '당뇨병', '고혈압', '심장병',
            '뇌졸중', '암', '폐암', '위암', '간암', '대장암', '유방암', '자궁암', '피부암', '혈액암',
            '치매', '파킨슨병', '우울증', '불안장애', '스트레스', '불면증', '두통', '편두통', '목디스크', '허리디스크',
            '관절염', '류마티스', '골다공증', '근육통', '신경통', '비염', '아토피', '습진', '여드름', '탈모',
            '충치', '잇몸질환', '치주염', '구내염', '입냄새', '위염', '위궤양', '역류성식도염', '장염', '변비',
            '설사', '치질', '신장병', '간염', '지방간', '담석', '갑상선', '당뇨', '고지혈증', '빈혈',
            '비타민결핍', '칼슘부족', '철분부족', '단백질', '탄수화물', '지방', '섬유질', '미네랄', '영양소', '보충제',
            '운동', '다이어트', '체중관리', '근력운동', '유산소운동', '스트레칭', '마사지', '물리치료', '재활', '침술',
            '한의학', '양의학', '병원', '의사', '간호사', '약사', '물리치료사', '영양사', '검진', '건강검진',
            '혈액검사', 'X레이', 'CT', 'MRI', '초음파', '내시경', '수술', '입원', '외래', '응급실',

            // 패션/뷰티 (100개)
            '옷', '상의', '하의', '셔츠', '티셔츠', '블라우스', '니트', '스웨터', '후드티', '맨투맨',
            '원피스', '스커트', '바지', '청바지', '슬랙스', '레깅스', '반바지', '치마바지', '점프수트', '정장',
            '캐주얼', '스포츠웨어', '아우터', '자켓', '코트', '점퍼', '가디건', '패딩', '야상', '트렌치코트',
            '신발', '운동화', '구두', '부츠', '샌들', '슬리퍼', '로퍼', '스니커즈', '하이힐', '플랫슈즈',
            '가방', '핸드백', '백팩', '숄더백', '크로스백', '토트백', '클러치', '여행가방', '캐리어', '지갑',
            '악세서리', '목걸이', '귀걸이', '반지', '팔찌', '시계', '헤어핀', '머리끈', '모자', '선글라스',
            '화장품', '스킨케어', '기초화장품', '메이크업', '파운데이션', '컨실러', '파우더', '블러셔', '아이섀도', '마스카라',
            '아이라이너', '립스틱', '립글로스', '틴트', '향수', '바디로션', '핸드크림', '선크림', '클렌징', '토너',
            '에센스', '세럼', '크림', '팩', '마스크', '스크럽', '필링', '미스트', '오일', '밤',
            '헤어', '샴푸', '린스', '트리트먼트', '헤어오일', '염색', '펌', '매직', '드라이', '고데기',

            // 자연/환경 (100개)
            '자연', '환경', '생태계', '지구', '대기', '바다', '바다', '강', '호수', '산',
            '숲', '들판', '사막', '극지', '열대', '온대', '한대', '계절', '봄', '여름',
            '가을', '겨울', '날씨', '맑음', '흐림', '비', '눈', '바람', '태풍', '지진',
            '화산', '홍수', '가뭄', '폭염', '한파', '황사', '미세먼지', '오존', '온실가스', '이산화탄소',
            '메탄', '산소', '질소', '수소', '헬륨', '아르곤', '네온', '크세논', '라돈', '오존층',
            '자외선', '적외선', '가시광선', '방사선', '핵폐기물', '방사능', '원자력', '재생에너지', '태양광', '풍력',
            '수력', '지열', '바이오', '석유', '석탄', '천연가스', '전기', '배터리', '수소연료', '에너지',
            '동물', '포유류', '조류', '파충류', '양서류', '어류', '곤충', '고래', '돌고래', '상어',
            '개', '고양이', '말', '소', '돼지', '양', '염소', '닭', '오리', '거위',
            '사자', '호랑이', '표범', '치타', '늑대', '여우', '곰', '팬더', '코알라', '캥거루',

            // 사회/정치 (100개)
            '정치', '민주주의', '공화국', '왕정', '독재', '자유', '평등', '정의', '인권', '평화',
            '선거', '투표', '대통령', '국회', '법원', '정부', '행정부', '입법부', '사법부', '지방자치',
            '시장', '군수', '구청장', '도지사', '시의회', '도의회', '국정감사', '탄핵', '헌법', '법률',
            '조례', '규칙', '제도', '정책', '복지', '연금', '의료보험', '실업급여', '기초생활수급', '장애인복지',
            '아동복지', '노인복지', '청년정책', '육아지원', '교육정책', '주택정책', '교통정책', '환경정책', '에너지정책', '외교정책',
            '국방', '군대', '병역', '징병제', '모병제', '예비군', '민방위', '안보', '통일', '북한',
            '외교', '국제관계', '유엔', 'G7', 'G20', 'OECD', 'WHO', 'UNESCO', 'NATO', '아세안',
            '경제', '자본주의', '사회주의', '시장경제', '계획경제', '혼합경제', 'GDP', 'GNP', '인플레이션', '디플레이션',
            '실업률', '취업률', '최저임금', '임금', '노동', '노조', '파업', '협상', '사회보장', '세금',
            '부가세', '소득세', '법인세', '상속세', '증여세', '재산세', '취득세', '등록세', '인지세', '관세',

            // 과학/연구 (96개)
            '과학', '물리학', '화학', '생물학', '지구과학', '천문학', '수학', '통계학', '확률', '미적분',
            '대수학', '기하학', '집합론', '논리학', '정수론', '해석학', '위상수학', '그래프이론', '암호학', '알고리즘',
            '실험', '관찰', '가설', '이론', '법칙', '공식', '방정식', '함수', '변수', '상수',
            '원자', '분자', '이온', '전자', '양성자', '중성자', '쿼크', '렙톤', '보손', '페르미온',
            '중력', '전자기력', '강력', '약력', '상대성이론', '양자역학', '끈이론', '빅뱅', '블랙홀', '중력파',
            'DNA', 'RNA', '단백질', '효소', '호르몬', '세포', '유전자', '염색체', '진화', '자연선택',
            '돌연변이', '적응', '환경', '생태', '먹이사슬', '서식지', '종', '개체군', '군집', '생물권',
            '지질학', '광물학', '암석학', '지진학', '화산학', '기상학', '해양학', '빙하학', '토양학', '수문학',
            '우주', '별', '행성', '위성', '혜성', '소행성', '성운', '은하', '성단', '퀘이사',
            '연구', '논문', '학회', '학술지', '피어리뷰', '인용', '특허', '발명', '발견', '노벨상'
        ];
        return keywords[Math.floor(Math.random() * keywords.length)];
    }

    // 사용자 선택 처리
    function handleChoiceClick(button) {
        const rowNum = parseInt(button.dataset.row);
        const choice = button.dataset.type;
        
        // 이미 선택했다면 무시
        if (userSelections[rowNum]) return;
        
        // 현재 시간 기록
        const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        const timeString = `${minutes}:${seconds}`;
        
        // 선택 저장
        userSelections[rowNum] = {
            choice: choice,
            time: timeString
        };
        
        // UI 업데이트
        button.classList.add('selected');
        const otherButton = button.parentElement.querySelector(`[data-type="${choice === '논증' ? '비논증' : '논증'}"]`);
        if (otherButton) {
            otherButton.disabled = true;
        }
        
        // 시간 표시
        const timeCell = document.querySelector(`tr[data-row="${rowNum}"] .time-cell`);
        if (timeCell) {
            timeCell.textContent = timeString;
        }
        
        // 모든 문제가 선택되었는지 확인
        checkAllAnswered();
        
        // 10번째 문제를 선택했으면 타이머 정지
        if (Object.keys(userSelections).length === 10) {
            stopTimer();
            gameStartBtn.textContent = '게임 완료!';
        }
    }

    // 모든 답이 선택되었는지 확인
    function checkAllAnswered() {
        const selectedCount = Object.keys(userSelections).length;
        if (selectedCount === 10) {
            if (checkAnswersBtn) {
                checkAnswersBtn.disabled = false;
            }
            console.log('모든 문제가 선택되었습니다!');
        }
    }

    // 게임 선택 처리
    function handleGameChoice(button) {
        const index = parseInt(button.dataset.index);
        const choice = button.dataset.choice;
        
        // 이미 선택했다면 무시
        if (gameData[index].userChoice) return;
        
        // 현재 시간 기록
        const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        const timeString = `${minutes}:${seconds}`;
        
        // 데이터 저장
        gameData[index].userChoice = choice;
        gameData[index].timeStamp = timeString;
        
        // 정답 체크
        const isCorrect = choice === gameData[index].correctType;
        if (isCorrect) {
            correctAnswers++;
        }
        
        currentProgress++;
        updateStats();
        
        // UI 업데이트
        button.classList.add('selected');
        button.parentElement.querySelectorAll('.game-choice-btn').forEach(btn => {
            if (btn !== button) btn.disabled = true;
        });
        
        // 타임체크 셀 업데이트
        document.querySelector(`.time-cell-${index}`).textContent = timeString;
        
        // 모든 문제를 풀었는지 확인
        checkGameCompletion();
    }

    // 통계 업데이트
    function updateStats() {
        if (progressCount) {
            progressCount.textContent = `${currentProgress}/10`;
        }
        if (correctCount) {
            correctCount.textContent = correctAnswers;
        }
        if (accuracyRate && currentProgress > 0) {
            const accuracy = Math.round((correctAnswers / currentProgress) * 100);
            accuracyRate.textContent = `${accuracy}%`;
        } else if (accuracyRate) {
            accuracyRate.textContent = '0%';
        }
    }

    // 게임 완료 체크
    function checkGameCompletion() {
        const allAnswered = gameData.every(item => item.userChoice !== null);
        if (allAnswered) {
            stopTimer();
            gameStartBtn.textContent = '게임 완료!';
            
            // 완료 모달 표시를 약간 지연시켜서 마지막 선택이 보이도록 함
            setTimeout(() => {
                showCompletionModal();
            }, 500);
        }
    }

    // 완료 모달 표시
    function showCompletionModal() {
        const totalTime = timerDisplay.textContent;
        const accuracy = Math.round((correctAnswers / 10) * 100);
        
        if (finalScore) {
            finalScore.textContent = `${correctAnswers}/10`;
        }
        if (finalTime) {
            finalTime.textContent = totalTime;
        }
        if (completionMessage) {
            let message = '';
            if (accuracy >= 90) {
                message = '완벽합니다! 논증 구분 실력이 뛰어나네요! 🏆';
            } else if (accuracy >= 80) {
                message = '훌륭한 성과입니다! 👏';
            } else if (accuracy >= 70) {
                message = '잘했습니다! 조금만 더 연습하면 완벽할 거예요! 💪';
            } else if (accuracy >= 60) {
                message = '괜찮은 시작입니다! 더 연습해보세요! 📚';
            } else {
                message = '아직 연습이 더 필요해요. 포기하지 마세요! 🌟';
            }
            completionMessage.textContent = message;
        }
        
        if (gameCompleteModal) {
            gameCompleteModal.style.display = 'flex';
        }
    }

    // 정답 확인
    function showAnswers() {
        console.log('정답 확인 버튼 클릭됨');
        
        gameData.forEach((item, index) => {
            const rowNum = index + 1;
            const answerCell = document.querySelector(`tr[data-row="${rowNum}"] .answer-cell`);
            const userChoice = userSelections[rowNum]?.choice;
            const isCorrect = userChoice === item.correctType;
            
            if (answerCell) {
                // 정답과 맞음/틀림 표시
                const resultSymbol = isCorrect ? '(o)' : '(x)';
                answerCell.textContent = `${resultSymbol} ${item.correctType}`;
                answerCell.classList.add(isCorrect ? 'correct' : 'incorrect');
                
                // 툴팁 이벤트 추가
                answerCell.addEventListener('mouseenter', (e) => showTooltip(e, item.explanation));
                answerCell.addEventListener('mouseleave', hideTooltip);
            }
        });
        
        // 게임 완료 처리
        stopTimer();
        if (gameStartBtn) {
            gameStartBtn.textContent = '새 게임 시작';
            gameStartBtn.disabled = false;
        }
        if (checkAnswersBtn) {
            checkAnswersBtn.style.display = 'none';
        }
        
        // 결과 계산
        const correctCount = gameData.filter((item, index) => {
            const rowNum = index + 1;
            return userSelections[rowNum]?.choice === item.correctType;
        }).length;
        
        const totalTime = timerDisplay.textContent;
        alert(`게임 완료!\n정답: ${correctCount}/10\n총 시간: ${totalTime}\n\n정답에 마우스를 올려 해설을 확인하세요!`);
    }

    // 툴팁 표시
    function showTooltip(event, explanation) {
        hideTooltip(); // 기존 툴팁 제거
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = explanation;
        
        event.target.appendChild(tooltip);
    }

    // 툴팁 숨김
    function hideTooltip() {
        const existingTooltip = document.querySelector('.tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    }

    // 게임 리셋
    function resetGame() {
        stopTimer();
        gameData = [];
        gameAnswersShown = false;
        userSelections = {};
        timerDisplay.textContent = '00:00';
        
        // 테이블 초기화
        clearTable();
        
        if (gameStartBtn) {
            gameStartBtn.textContent = '게임 시작!';
            gameStartBtn.disabled = false;
        }
        if (checkAnswersBtn) {
            checkAnswersBtn.style.display = 'inline-block';
            checkAnswersBtn.disabled = true;
        }
        if (resetGameBtn) {
            resetGameBtn.style.display = 'none';
        }
    }

    console.log('게임 스크립트 로딩 완료');
});