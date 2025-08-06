// integrated-server.js - 모든 기능을 통합한 단일 서버

// 1. 모듈 임포트
const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { google } = require('googleapis');
const fetch = require('node-fetch');
const fileType = require('file-type');
const cors = require('cors');
const bodyParser = require('body-parser');

// 2. 환경설정
dotenv.config();

// 3. Express 앱 초기화
const app = express();
const PORT = process.env.PORT || 3001;

// 4. API 클라이언트 초기화
// OpenAI
let openai;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
    console.log('[API] OpenAI 초기화 완료');
} else {
    console.log('[ENV_WARN] OPENAI_API_KEY가 .env 파일에 설정되지 않았습니다.');
}

// Anthropic Claude
let anthropic;
if (process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });
    console.log('[API] Anthropic Claude 초기화 완료');
} else {
    console.log('[ENV_WARN] ANTHROPIC_API_KEY가 .env 파일에 설정되지 않았습니다.');
}

// Google Custom Search
let customsearch;
if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_CSE_ID) {
    customsearch = google.customsearch('v1');
    console.log('[API] Google Custom Search 초기화 완료');
} else {
    console.log('[ENV_WARN] GOOGLE_API_KEY 또는 GOOGLE_CSE_ID가 .env 파일에 설정되지 않았습니다.');
}

// 5. 미들웨어 설정
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(__dirname));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[REQ_LOG] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// ============================
// 논리적 평가 (Academic Writing) 관련 기능
// ============================

// 다양한 주제 풀 정의
const topicPool = [
    // 정치/행정
    "선거제도 개편", "지방자치 강화", "정치자금 투명화", "국회 개혁", "대통령제 vs 내각제", "정당정치 개선",
    
    // 경제/금융
    "기본소득제 도입", "암호화폐 규제", "부동산 정책", "최저임금 인상", "탄소세 도입", "금융투자세 신설",
    "중소기업 지원정책", "경제성장률 목표", "인플레이션 대응", "국가부채 관리",
    
    // 사회/복지
    "사회적 거리두기", "고령화 사회 대응", "청년실업 해결", "저출산 대책", "다문화 정책", "사회적 약자 보호",
    "공공의료 확대", "사회보장제도 개편", "젠더 갈등 해소", "세대 갈등 완화",
    
    // 문화/예술
    "한류 문화 정책", "전통문화 보존", "저작권 보호", "문화다양성 증진", "공연예술 지원", "미디어 규제",
    "게임 산업 육성", "웹툰 산업 발전", "K-콘텐츠 해외진출", "문화재 디지털화",
    
    // 윤리/철학
    "인공지능 윤리", "생명윤리 논란", "동물권 보호", "안락사 합법화", "개인정보 보호", "알고리즘 편향성",
    "유전자 편집 윤리", "뇌과학 연구 윤리", "의료진의 치료거부권", "종교의 자유",
];

// 랜덤 주제 선택 함수
function getRandomTopic() {
    return topicPool[Math.floor(Math.random() * topicPool.length)];
}

// Claude용 논증 구조 설계 프롬프트
function buildClaudeArgumentStructurePrompt(topic, criteria, difficulty) {
    const hasArgumentSupport = criteria.some(c => c.includes('근거가 결론을 뒷받침해'));

    // 각 지침에 대한 명확한 정의 제공
    const guidelineDefinitions = {
        '애매함': '단어나 문장이 여러 의미로 해석될 수 있어 무엇을 의미하는지 불분명한 경우 (예: "공정한 경쟁", "성공적인 정책" - 구체적 의미가 불분명)',
        '모호함': '단어나 개념의 경계가 불분명해서 어디까지가 그 범주에 속하는지 판단하기 어려운 경우 (예: "많은 사람", "상당한 효과" - 정확한 기준이 없음)',
        '거짓은 없어?': '사실이 아니거나 확인할 수 없는 정보를 포함한 경우 (허위 통계, 확인 불가능한 주장 등)',
        '논리적으로 타당해?': '전제에서 결론으로 이어지는 논리적 연결에 오류가 있는 경우 (논리적 비약, 잘못된 추론 등)',
        '충분히 뒷받침돼?': '주장에 비해 근거가 부족하거나 약한 경우 (표면적 근거, 불충분한 증거 등)',
        '근거가 결론을 뒷받침해?': '제시된 근거가 결론과 논리적으로 연결되지 않는 경우 (관련 없는 근거, 약한 연관성 등)'
    };

    // 수준별 기준 처리
    let criteriaForPrompt;
    if (difficulty === 'basic') {
        criteriaForPrompt = criteria.slice(0, 2);
    } else if (difficulty === 'intermediate') {
        criteriaForPrompt = criteria.slice(0, 3);
    } else if (difficulty === 'advanced') {
        criteriaForPrompt = criteria.slice(0, 4);
    } else {
        criteriaForPrompt = criteria;
    }

    const definitionsText = criteriaForPrompt.map(c => `- ${c}: ${guidelineDefinitions[c] || ''}`).join('\n');

    const prompt = `
당신은 논리적 사고 교육 전문가입니다. 
주제 "${topic}"에 대한 한국어 논증문을 생성하세요.

학습 수준: ${difficulty === 'basic' ? '기초' : difficulty === 'intermediate' ? '중급' : difficulty === 'advanced' ? '고급' : '전문가'}

**중요: 학습자가 다음 평가 기준에 대해 연습할 수 있도록 의도적으로 몇 가지 논리적 오류를 포함시켜주세요:**
${definitionsText}

수준별 복잡도:
- 기초: 간단한 일상적 논증 (2-3개 단락)
- 중급: 체계적 논증 (3-4개 단락)  
- 고급: 복잡한 학술적 논증 (4-5개 단락)
- 전문가: 전문적 심화 논증 (5-6개 단락)

각 평가 기준에 대해 1-2개의 명확한 오류를 의도적으로 포함시키되, 너무 명백하지 않게 만들어주세요.

논증문은 자연스럽고 설득력 있게 작성하되, 평가 기준에 맞는 문제점들을 포함해주세요.
`;

    return prompt;
}

// ============================
// 논증 요약 (Argument) 관련 기능
// ============================

// 논증 구조 생성 함수 - 새로운 난이도 구조 적용
async function generateArgumentStructure(keyword, difficulty) {
    if (!openai) throw new Error('OpenAI API가 설정되지 않았습니다.');
    
    console.log('[논증 로직] 논증 구조 생성 시작');
    
    let structurePrompt;
    
    if (difficulty === 'easy') {
        // 쉬움: 주장+근거1+근거2, 또는 주장+근거1+근거1의 근거
        structurePrompt = `"${keyword}"에 대한 논증을 만드세요.

구조 요구사항:
- 주장 1개
- 근거 2개 (또는 근거1 + 근거1의 하위근거)
- 간단하고 명확한 구조`;
    } else if (difficulty === 'normal') {
        // 보통: 주장+근거1+근거1의 근거+근거2, 또는 주장+근거1+근거2+근거2의 근거
        structurePrompt = `"${keyword}"에 대한 논증을 만드세요.

구조 요구사항:
- 주장 1개
- 근거 2개
- 각 근거마다 하위근거 1-2개씩
- 체계적인 논증 구조`;
    } else {
        // 어려움: 주장+근거1+근거1의 근거+근거2+근거2의 근거+근거3+근거3의 근거
        structurePrompt = `"${keyword}"에 대한 완전한 논증을 만드세요.

구조 요구사항:
- 주장 1개
- 근거 3개
- 각 근거마다 하위근거 2-3개씩
- 숨은전제 포함
- 복잡하고 정교한 논증 구조`;
    }

    const structureResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: structurePrompt + `

결과는 다음 JSON 형식으로만 답변해주세요:
{
  "claim": "주장 내용",
  "grounds": ["근거1", "근거2"${difficulty === 'hard' ? ', "근거3"' : ''}],
  "subgrounds": {
    "근거1": ["하위근거1-1"${difficulty !== 'easy' ? ', "하위근거1-2"' : ''}],
    "근거2": ["하위근거2-1"${difficulty !== 'easy' ? ', "하위근거2-2"' : ''}]${difficulty === 'hard' ? ',\n    "근거3": ["하위근거3-1", "하위근거3-2"]' : ''}
  }${difficulty === 'hard' ? ',\n  "warrant": "숨은전제 내용"' : ''}
}` }],
        max_tokens: 1000
    });

    let content = structureResponse.choices[0].message.content;
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const result = JSON.parse(content);
    
    console.log('[논증 로직] 논증 구조 생성 완료:', result);
    return result;
}

// ============================
// 이미지 요약 관련 기능
// ============================

// 신뢰할 수 있는 공익광고 사이트 도메인
const TRUSTED_DOMAINS = [
    'kobaco.co.kr',        // 한국방송광고진흥공사
    'jeski.org',           // 제천시 환경보건시민센터  
    'clean.gen.go.kr',     // 화학물질안전원
    'pinterest.com',       // 공익광고 컬렉션
    'behance.net',         // 디자인 포트폴리오
    'publicads.or.kr',     // 공익광고협의회
    'ad.go.kr'             // 정부 광고 포털
];

const EXCLUDED_DOMAINS = [
    'youtube.com', 'i.ytimg.com', 'facebook.com', 'instagram.com',  
    'twitter.com', 'linkedin.com',
    'yes24.com', 'kyobobook.co.kr', 'aladin.co.kr', 'interpark.com',
];

// ============================
// API 라우트
// ============================

// 논리적 평가 관련 API (Academic Writing)
app.post('/api/generate-prompt', async (req, res) => {
    try {
        const { keyword, level } = req.body;
        console.log(`[API_CALL] /api/generate-prompt - keyword: ${keyword}, level: ${level}`);

        // 키워드가 없으면 랜덤으로 선택
        const selectedKeyword = keyword || getRandomTopic();
        
        // 평가 기준 설정
        const allCriteria = [
            '애매함',
            '모호함',
            '거짓은 없어?',
            '논리적으로 타당해?',
            '충분히 뒷받침돼?',
            '근거가 결론을 뒷받침해?'
        ];

        // 수준별 평가 기준 선택
        let criteria;
        switch(level) {
            case 'basic':
                criteria = allCriteria.slice(0, 2);
                break;
            case 'intermediate':
                criteria = allCriteria.slice(0, 3);
                break;
            case 'advanced':
                criteria = allCriteria.slice(0, 4);
                break;
            case 'expert':
                criteria = allCriteria;
                break;
            default:
                criteria = allCriteria.slice(0, 3);
        }

        // 위반 분석 정보 생성 함수
        const generateAnalysis = (keyword, criteria) => {
            const evaluations = criteria.map(criterion => {
                const violations = {
                    '애매함': {
                        problematicPart: '"많은 사람들이 이에 대해 관심을 가지고 있습니다."',
                        violationReason: '"많은 사람들"이라는 표현이 애매합니다. 정확히 얼마나 많은 사람인지, 어떤 집단을 지칭하는지 불분명합니다.',
                        improvementSuggestion: '구체적인 통계나 조사 결과를 인용하여 "2023년 여론조사에 따르면 응답자의 78%가..."와 같이 명확하게 표현하세요.'
                    },
                    '모호함': {
                        problematicPart: '"상당한 영향을 미치고 있습니다."',
                        violationReason: '"상당한"이라는 표현이 모호합니다. 어느 정도가 상당한 것인지 기준이 불명확합니다.',
                        improvementSuggestion: '구체적인 수치나 비교 기준을 제시하여 "전년 대비 30% 증가한..."과 같이 명확하게 표현하세요.'
                    },
                    '거짓은 없어?': {
                        problematicPart: '"대부분의 전문가들이 이를 인정합니다."',
                        violationReason: '검증되지 않은 주장입니다. 어떤 전문가들인지, 실제로 대부분이 동의하는지 확인할 수 없습니다.',
                        improvementSuggestion: '구체적인 출처와 전문가 이름을 명시하고, 실제 연구나 발표 내용을 인용하세요.'
                    },
                    '논리적으로 타당해?': {
                        problematicPart: '"많은 나라에서 시행하고 있으므로 우리도 도입해야 합니다."',
                        violationReason: '다수논증의 오류입니다. 다른 나라에서 시행한다는 것이 우리도 해야 한다는 논리적 근거가 되지 않습니다.',
                        improvementSuggestion: '우리나라의 특수한 상황과 필요성을 분석하고, 도입 시 예상되는 구체적인 효과를 제시하세요.'
                    },
                    '충분히 뒷받침돼?': {
                        problematicPart: '"성공적인 결과를 얻었다고 합니다."',
                        violationReason: '주장을 뒷받침하는 구체적인 증거나 데이터가 부족합니다. "~라고 합니다"는 불충분한 근거입니다.',
                        improvementSuggestion: '구체적인 성공 사례, 통계 데이터, 연구 결과 등을 제시하여 주장을 강화하세요.'
                    },
                    '근거가 결론을 뒷받침해?': {
                        problematicPart: '"경제적 비용이 발생하지만 장기적으로 이익이 될 것입니다."',
                        violationReason: '제시된 근거(비용 발생)가 결론(도입 필요)을 직접적으로 뒷받침하지 못합니다.',
                        improvementSuggestion: '비용 대비 효과 분석을 구체적으로 제시하고, 장기적 이익에 대한 명확한 근거를 제공하세요.'
                    }
                };
                
                return {
                    criteria: criterion,
                    ...(violations[criterion] || violations['애매함'])
                };
            });
            
            return {
                claim: `${keyword}에 대한 정책을 도입해야 합니다.`,
                reason: `이는 사회적으로 중요한 문제이며, 많은 나라에서 이미 시행하고 있습니다.`,
                evaluations: evaluations
            };
        };

        // Claude API 사용
        if (anthropic) {
            const prompt = buildClaudeArgumentStructurePrompt(selectedKeyword, criteria, level);
            
            const message = await anthropic.messages.create({
                model: "claude-3-opus-20240229",
                max_tokens: 2000,
                messages: [{
                    role: "user",
                    content: prompt
                }]
            });

            const analysis = generateAnalysis(selectedKeyword, criteria);
            
            res.json({
                success: true,
                prompt: message.content[0].text,
                keyword: selectedKeyword,
                criteria: criteria,
                analysis: analysis
            });
        } 
        // OpenAI API 폴백
        else if (openai) {
            const prompt = buildClaudeArgumentStructurePrompt(selectedKeyword, criteria, level);
            
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 2000
            });

            const analysis = generateAnalysis(selectedKeyword, criteria);

            res.json({
                success: true,
                prompt: response.choices[0].message.content,
                keyword: selectedKeyword,
                criteria: criteria,
                analysis: analysis
            });
        }
        // 목업 데이터
        else {
            const mockPrompts = {
                basic: `${selectedKeyword}에 대한 기초 수준 논증문입니다.\n\n이 주제는 우리 사회에서 중요한 문제입니다. 많은 사람들이 이에 대해 관심을 가지고 있습니다.\n\n따라서 우리는 이 문제를 해결해야 합니다.`,
                intermediate: `${selectedKeyword}는 현대 사회의 중요한 이슈입니다.\n\n첫째, 이는 상당한 영향을 미치고 있습니다. 대부분의 전문가들이 이를 인정합니다.\n\n둘째, 많은 나라에서 이미 시행하고 있습니다. 성공적인 결과를 얻었다고 합니다.\n\n결론적으로, 우리도 적극적으로 도입해야 합니다.`,
                advanced: `${selectedKeyword}에 대한 논의가 활발히 진행되고 있습니다.\n\n학계에서는 이 문제를 다각도로 분석하고 있습니다. 일부 연구자들은 긍정적 효과를 주장하며, 다른 연구자들은 부정적 측면을 지적합니다.\n\n경제적 관점에서 보면, 상당한 비용이 발생할 것으로 예상됩니다. 하지만 장기적으로는 이익이 될 것입니다.\n\n사회적 측면에서는 공정성 문제가 제기될 수 있습니다. 모든 계층이 동등한 혜택을 받을 수 있을지 의문입니다.\n\n따라서 신중한 접근이 필요합니다.`,
                expert: `${selectedKeyword}는 복잡한 정책적 함의를 지닌 주제입니다.\n\n역사적으로 이 문제는 여러 차례 논의되었습니다. 1990년대부터 지속적으로 제기되어 왔으며, 각 시대마다 다른 관점에서 접근되었습니다.\n\n이론적 배경을 살펴보면, 주류 경제학에서는 효율성을 강조합니다. 반면 행동경제학에서는 인간의 비합리성을 고려해야 한다고 주장합니다.\n\n실증적 증거는 혼재되어 있습니다. 일부 연구는 긍정적 효과를 보고하지만, 방법론적 한계가 지적되고 있습니다.\n\n정책적 함의를 고려할 때, 단계적 접근이 필요합니다. 파일럿 프로그램을 통해 효과를 검증한 후 확대하는 것이 바람직합니다.\n\n결론적으로, 이 문제는 간단한 해결책이 없으며, 지속적인 연구와 사회적 합의가 필요합니다.`
            };

            const analysis = generateAnalysis(selectedKeyword, criteria);
            
            res.json({
                success: true,
                prompt: mockPrompts[level] || mockPrompts.intermediate,
                keyword: selectedKeyword,
                criteria: criteria,
                analysis: analysis
            });
        }

    } catch (error) {
        console.error('[ERROR] /api/generate-prompt:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post('/api/submit-evaluation', async (req, res) => {
    try {
        const { evaluation, prompt, keyword, level } = req.body;
        console.log(`[API_CALL] /api/submit-evaluation - keyword: ${keyword}, level: ${level}`);

        // 간단한 피드백 생성 (실제로는 AI를 사용하여 평가)
        const feedback = {
            score: Math.floor(Math.random() * 30) + 70, // 70-100점 랜덤
            strengths: [
                "논리적 오류를 잘 파악했습니다.",
                "구체적인 예시를 들어 설명했습니다.",
                "체계적으로 분석했습니다."
            ],
            improvements: [
                "더 다양한 관점을 고려해보세요.",
                "반박 가능성을 더 검토해보세요.",
                "결론을 더 명확히 정리해보세요."
            ],
            overallComment: "전반적으로 좋은 평가입니다. 계속 연습하면 더 향상될 것입니다."
        };

        res.json({
            success: true,
            feedback: feedback
        });

    } catch (error) {
        console.error('[ERROR] /api/submit-evaluation:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 논증/인과설명 제시문 생성 통합 API
app.post('/api/generate-passage', async (req, res) => {
    try {
        const { type, keyword, difficulty } = req.body;
        console.log(`[API_CALL] /api/generate-passage - type: ${type}, keyword: ${keyword}, difficulty: ${difficulty}`);

        if (type === 'argument') {
            // 논증 요약하기 로직
            if (!openai) throw new Error('OpenAI API가 설정되지 않았습니다.');
            
            const structure = await generateArgumentStructure(keyword, difficulty);
            
            let passagePrompt;
            if (difficulty === 'easy') {
                // 쉬움: 200~300자, 한 단락
                passagePrompt = `다음 논증 구조를 바탕으로 ${keyword}에 대한 간단한 논증문을 작성하세요:
주장: ${structure.claim}
근거: ${structure.grounds.join(', ')}
${structure.subgrounds ? `하위근거: ${Object.entries(structure.subgrounds).map(([key, values]) => `${key} → ${values.join(', ')}`).join(' / ')}` : ''}

**중요: 반드시 다음 형식을 따르세요**
- 정확히 한 단락으로 구성
- 200~300자 정도의 글
- 주장을 먼저 제시하고 근거들로 뒷받침
- 자연스럽고 간결한 문체`;
            } else if (difficulty === 'normal') {
                // 보통: 400~500자, 한 단락
                passagePrompt = `다음 논증 구조를 바탕으로 ${keyword}에 대한 체계적인 논증문을 작성하세요:
주장: ${structure.claim}
근거: ${structure.grounds.join(', ')}
하위근거: ${Object.entries(structure.subgrounds).map(([key, values]) => `${key} → ${values.join(', ')}`).join(' / ')}

**중요: 반드시 다음 형식을 따르세요**
- 정확히 한 단락으로 구성
- 400~500자 정도의 글
- 주장과 근거들, 하위근거들을 체계적으로 연결
- 논리적 흐름이 명확한 문체`;
            } else {
                // 어려움: 1500자 이내, 3~4단락
                passagePrompt = `다음 논증 구조를 바탕으로 ${keyword}에 대한 완전한 논증문을 작성하세요:
주장: ${structure.claim}
근거: ${structure.grounds.join(', ')}
하위근거: ${Object.entries(structure.subgrounds).map(([key, values]) => `${key} → ${values.join(', ')}`).join(' / ')}
${structure.warrant ? `숨은전제: ${structure.warrant}` : ''}

**중요: 반드시 다음 형식을 따르세요**
- 정확히 3~4개 단락으로 구성
- 1500자 이내의 긴 글
- 각 단락의 중심문장은 전체 글의 주장에 대한 근거
- 1단락: 주장과 첫 번째 근거 제시
- 2단락: 두 번째 근거와 하위근거들 설명
- 3단락: 세 번째 근거와 하위근거들 설명
- 4단락(선택): 결론 및 주장 재확인
- **각 단락 사이에는 반드시 빈 줄 삽입**`;
            }

            const passageResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: passagePrompt }],
                max_tokens: 2000
            });

            let passage = passageResponse.choices[0].message.content;
            passage = passage.replace(/###[^\n]*\n?/g, '');
            
            const result = {
                passage: passage.trim(),
                logical_structure: {
                    claim: structure.claim,
                    grounds: structure.grounds,
                    subgrounds: structure.subgrounds,
                    warrant: structure.warrant || null
                }
            };

            res.json(result);
            
        } else if (type === 'causal') {
            // 인과설명 요약하기 로직 (간단한 예시)
            res.json({
                passage: `${keyword}에 대한 인과설명 제시문입니다. (구현 예정)`,
                causal_structure: {
                    phenomenon: `${keyword} 현상`,
                    causes: ["원인1", "원인2"],
                    process: "인과 과정 설명"
                }
            });
            
        } else if (type === 'compare') {
            // 비교하기 로직 (간단한 예시)
            res.json({
                passages: [
                    { title: "찬성 입장", content: `${keyword}에 찬성하는 논증` },
                    { title: "반대 입장", content: `${keyword}에 반대하는 논증` }
                ]
            });
            
        } else {
            res.status(400).json({ error: '지원하지 않는 타입입니다.' });
        }

    } catch (error) {
        console.error('[ERROR] /api/generate-passage:', error);
        res.status(500).json({ error: error.message });
    }
});

// 요약 평가 통합 API
app.post('/api/evaluate-summary', async (req, res) => {
    try {
        const { type, summary, difficulty } = req.body;
        console.log(`[API_CALL] /api/evaluate-summary - type: ${type}`);

        // 간단한 평가 로직 (실제로는 AI를 사용)
        const evaluation = {
            score: Math.floor(Math.random() * 30) + 70,
            feedback: "잘 작성했습니다. 계속 연습하세요!",
            details: {
                structure: "논리 구조를 잘 파악했습니다.",
                completeness: "핵심 내용이 포함되었습니다.",
                clarity: "명확하게 표현했습니다."
            }
        };

        res.json(evaluation);

    } catch (error) {
        console.error('[ERROR] /api/evaluate-summary:', error);
        res.status(500).json({ error: error.message });
    }
});

// 이미지 검색 및 통계 생성 API
app.post('/api/generate-image', async (req, res) => {
    try {
        const { type, keyword } = req.body;
        console.log(`[API_CALL] /api/generate-image - type: ${type}, keyword: ${keyword}`);

        if (type === 'statistics') {
            // 통계 차트 생성
            const chartData = generateMockChartData(keyword);
            const questions = generateMockAnalysisQuestions(keyword, 'chart');
            
            return res.json({
                type: 'chart',
                data: chartData,
                questions: questions,
                keyword: keyword
            });
            
        } else if (type === 'data_set') {
            // 통계표 생성
            const tableData = generateMockTableData(keyword);
            const questions = generateMockAnalysisQuestions(keyword, 'table');
            
            return res.json({
                type: 'table',
                data: tableData,
                questions: questions,
                keyword: keyword
            });
            
        } else {
            // 공익광고 이미지 검색
            if (!customsearch) {
                // API 없을 때도 일관된 응답 형식 유지
                return res.json({
                    type: 'image',  // type 필드 추가
                    success: true,
                    imageUrl: 'https://via.placeholder.com/600x400/0066cc/ffffff?text=' + encodeURIComponent(keyword + ' 공익광고'),
                    source: 'Test Image',
                    message: 'Google Search API가 설정되지 않았습니다. 테스트 이미지를 표시합니다.'
                });
            }

            // Google Custom Search로 이미지 검색
            const searchQuery = `${keyword} 공익광고 포스터 -유튜브 -뉴스 -기사`;
            
            const searchResponse = await customsearch.cse.list({
                cx: process.env.GOOGLE_CSE_ID,
                q: searchQuery,
                searchType: 'image',
                num: 10,
                auth: process.env.GOOGLE_API_KEY
            });

            if (searchResponse.data.items && searchResponse.data.items.length > 0) {
                const firstImage = searchResponse.data.items[0];
                res.json({
                    type: 'image',  // type 필드 추가
                    success: true,
                    imageUrl: firstImage.link,
                    title: firstImage.title,
                    source: 'Google Search'
                });
            } else {
                res.json({
                    type: 'image',  // type 필드 추가
                    success: false,
                    message: '이미지를 찾을 수 없습니다.'
                });
            }
        }

    } catch (error) {
        console.error('[ERROR] /api/generate-image:', error);
        res.status(500).json({ error: error.message });
    }
});

// 통계 차트 데이터 생성 헬퍼 함수
function generateMockChartData(keyword) {
    const chartTypes = ['bar', 'line', 'pie', 'radar'];
    const randomType = chartTypes[Math.floor(Math.random() * chartTypes.length)];
    
    return {
        chartType: randomType,
        title: `${keyword} 관련 통계 분석`,
        labels: ['2020년', '2021년', '2022년', '2023년', '2024년'],
        datasets: [{
            label: `${keyword} 추이`,
            data: [65, 78, 85, 81, 92],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
            borderColor: '#36A2EB'
        }]
    };
}

// 통계표 데이터 생성 헬퍼 함수
function generateMockTableData(keyword) {
    return {
        title: `${keyword} 관련 통계 테이블`,
        headers: ['구분', '수치', '비율', '증감률'],
        rows: [
            ['유형 A', '1,234', '35.2%', '+5.3%'],
            ['유형 B', '987', '28.1%', '-2.1%'],
            ['유형 C', '1,287', '36.7%', '+8.9%']
        ],
        summary: `${keyword} 관련 주요 지표 분석 결과`
    };
}

// 분석 질문 생성 헬퍼 함수
function generateMockAnalysisQuestions(keyword, dataType) {
    const chartQuestions = [
        `이 차트에서 가장 눈에 띄는 ${keyword} 관련 변화는 무엇인가요?`,
        `${keyword}의 증가/감소 추세를 어떻게 해석할 수 있을까요?`,
        `이 데이터가 시사하는 ${keyword}의 미래 전망은 어떠한가요?`
    ];
    
    const tableQuestions = [
        `이 표에서 가장 주목할 만한 ${keyword} 관련 수치는 무엇인가요?`,
        `각 항목 간의 비율 차이가 의미하는 바는 무엇일까요?`,
        `증감률을 통해 알 수 있는 ${keyword}의 변화 양상은?`
    ];
    
    return dataType === 'chart' ? chartQuestions : tableQuestions;
}

// ============================
// 논증 구분하기 관련 API
// ============================

// 논증 구분하기용 제시문 생성
app.post('/api/generate-distinction-passage', async (req, res) => {
    try {
        if (!openai) {
            // 목업 데이터 반환
            const mockData = {
                passageText: "인공지능은 우리 사회에 많은 변화를 가져오고 있습니다. 업무 자동화로 생산성이 향상되고 있으며, 의료 분야에서는 질병 진단의 정확도가 높아지고 있습니다. 따라서 인공지능 기술 개발에 더 많은 투자가 필요합니다.",
                passageType: "논증",
                explanation: "이 제시문은 인공지능 기술 개발에 대한 투자 필요성을 주장하는 논증문입니다.",
                coreSubject: "이 제시문은 인공지능 기술 개발에 더 많은 투자가 필요하다고 주장하고 있습니다.",
                logicalStructure: {
                    claim: "인공지능 기술 개발에 더 많은 투자가 필요하다",
                    grounds: ["업무 자동화로 생산성 향상", "의료 분야에서 진단 정확도 향상"]
                }
            };
            return res.json(mockData);
        }

        const { keyword } = req.body;
        console.log(`[API_CALL] /api/generate-distinction-passage - keyword: ${keyword}`);

        // 1. 논증을 생성할 것인가, 비논증을 생성할 것인가를 결정함
        const types = ['argument', 'non_argument'];
        const selectedType = types[Math.floor(Math.random() * types.length)];
        
        let passageText, coreSubject, explanation, logicalStructure;

        if (selectedType === 'argument') {
            // 1.1 논증을 생성하기로 함
            
            // 1.1.2 주장이나 결론에 해당하는 문장을 생성함
            const claimResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: `"${keyword}"에 대한 명확한 주장이나 결론을 한 문장으로 작성하세요. 찬성 또는 반대 입장을 분명히 표현해야 합니다.` }],
                max_tokens: 200
            });
            const claim = claimResponse.choices[0].message.content.trim();

            // 1.1.3 평서문으로 되어 있는 주장(결론)을 의문문으로 바꿔서 쟁점을 생성함
            const issueResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: `다음 주장을 의문문 형태의 쟁점으로 바꿔주세요:\n주장: ${claim}\n\n예시: "환경보호가 중요하다" → "환경보호가 중요한가?"\n쟁점은 한 문장으로 작성하고, 물음표로 끝나야 합니다.` }],
                max_tokens: 200
            });
            const issue = issueResponse.choices[0].message.content.trim();

            // 1.1.4 근거나 이유에 해당하는 문장들을 생성함
            const groundsResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: `다음 주장을 뒷받침하는 근거나 이유를 2-3개 생성하세요:\n주장: ${claim}\n\n각 근거는 별도의 줄에 작성하고, 번호나 기호 없이 문장만 작성하세요. 근거는 주장을 논리적으로 뒷받침해야 합니다.` }],
                max_tokens: 500
            });
            const grounds = groundsResponse.choices[0].message.content.trim().split('\n').filter(line => line.trim());

            // 1.1.5 주장(결론), 근거(이유)를 활용하여 논증을 생성함
            const argumentResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: `다음 구조를 바탕으로 자연스러운 논증문을 작성하세요:

주장(결론): ${claim}
근거들: ${grounds.join(' / ')}

요구사항:
- 4-6문장으로 구성
- 근거를 먼저 제시하고 결론으로 마무리하는 자연스러운 흐름
- 논리적 연결어 사용 (따라서, 그러므로, 왜냐하면 등)
- 읽기 쉬운 문체` }],
                max_tokens: 800
            });
            
            // 1.1.6 생성한 논증을 출력함
            passageText = argumentResponse.choices[0].message.content.trim();
            
            // 1.1.7 쟁점, 주장, 근거는 모범답안 팝업창에 출력함
            logicalStructure = { 
                type: 'argument',
                issue: issue,
                claim: claim, 
                grounds: grounds 
            };
            coreSubject = claim; // 주장을 중심문장으로 사용
            
            // 1.1.8 팝업창에는 논증 구조와 더불어 글의 종류에 대한 설명을 출력해줘
            explanation = `이 제시문은 특정 쟁점에 대한 입장을 논리적으로 주장하는 논증문입니다. 논증은 주장(결론)과 그것을 뒷받침하는 근거(이유)로 구성되며, 독자를 설득하려는 목적을 가집니다.`;

        } else {
            // 1.2 비논증을 생성하기로 함
            
            // 1.2.1 중심문장을 생성함 (서브타입 결정 포함)
            const subTypes = ['정의', '묘사', '서사', '설명', '분류', '원인-결과 분석'];
            const selectedSubType = subTypes[Math.floor(Math.random() * subTypes.length)];
            
            const centralSentenceResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: `"${keyword}"에 대한 ${selectedSubType} 글의 중심문장을 한 문장으로 작성하세요. 

${selectedSubType === '정의' ? `정의글 형식으로:
- "${keyword}은(는) ~이다" 또는 "${keyword}이란 ~을 말한다" 형식 사용
- 개념의 본질적 속성과 특징을 포함
- 명확하고 간결한 정의문 작성` : 
  selectedSubType === '묘사' ? `묘사글 형식으로:
- "${keyword}은(는) ~한 모습을 보인다" 또는 "${keyword}의 특징은 ~이다" 형식 사용
- 구체적인 특징이나 외관, 상태를 포함
- 감각적으로 느낄 수 있는 요소 포함` :
  selectedSubType === '서사' ? `서사글 형식으로:
- "${keyword}은(는) ~한 과정을 거쳐 발전했다" 또는 "${keyword}의 역사는 ~로 시작되었다" 형식 사용
- 시간의 흐름이나 변화 과정이 드러나는 내용
- 시작점이나 변화의 과정을 암시하는 표현` :
  selectedSubType === '설명' ? `설명글 형식으로:
- "${keyword}은(는) ~한 현상이다" 또는 "${keyword}에는 ~한 특성이 있다" 형식 사용
- 객관적 사실이나 현상을 중심으로
- 구체적인 내용이나 데이터를 암시하는 표현` :
  selectedSubType === '분류' ? `분류글 형식으로:
- "${keyword}은(는) 크게 ~로 나뉜다" 또는 "${keyword}에는 여러 종류가 있다" 형식 사용
- 여러 유형이나 종류가 있음을 명시
- 체계적 분류가 가능함을 나타내는 표현` :
  `원인-결과 분석글 형식으로:
- "${keyword}은(는) ~로 인해 발생한다" 또는 "${keyword}은(는) ~한 결과이다" 형식 사용
- 원인과 결과의 관계가 드러나는 내용
- 현상 발생의 원인을 설명하는 표현 포함`}

이 문장은 글 전체의 핵심 내용을 담아야 하며, 주장이 아닌 사실이나 정보 위주로 작성해주세요.` }],
                max_tokens: 200
            });
            const centralSentence = centralSentenceResponse.choices[0].message.content.trim();

            // 1.2.2 중심문장에 기반하여 글의 주제 문장을 생성함
            const topicSentenceResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: `다음 중심문장을 바탕으로 글의 주제를 한 문장으로 표현하세요:\n중심문장: ${centralSentence}\n\n주제 문장은 "이 글은 ~에 대해 설명한다" 또는 "이 글은 ~을 다룬다" 형식으로 작성해주세요.` }],
                max_tokens: 200
            });
            const topicSentence = topicSentenceResponse.choices[0].message.content.trim();

            // 1.2.3 중심문장을 부연, 상술, 묘사, 서사 등등의 방법을 동원해서 나머지 문장들을 생성함
            const supportingSentencesResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: `다음 ${selectedSubType} 글의 중심문장을 ${selectedSubType} 방법에 맞게 설명하는 문장들을 2-3개 생성하세요:
중심문장: ${centralSentence}

${selectedSubType === '정의' ? '정의에 맞게 개념의 특징이나 속성을 설명' : 
  selectedSubType === '묘사' ? '묘사에 맞게 구체적인 모습이나 특징을 자세히 그려내기' :
  selectedSubType === '서사' ? '서사에 맞게 시간 순서나 과정을 따라 서술' :
  selectedSubType === '설명' ? '설명에 맞게 객관적 사실이나 정보를 제시' :
  selectedSubType === '분류' ? '분류에 맞게 종류나 유형을 나누어 체계적으로 제시' :
  '원인-결과 분석에 맞게 현상의 원인과 결과의 관계를 객관적으로 설명'}해주세요.

각 문장은 별도의 줄에 작성하고, 주장이나 논증이 아닌 ${selectedSubType} 위주로 작성하세요.` }],
                max_tokens: 500
            });
            const supportingSentences = supportingSentencesResponse.choices[0].message.content.trim().split('\n').filter(line => line.trim());

            // 1.2.4 중심문장과 기타 문장들을 기반으로 제시문을 생성함
            const nonArgumentResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: `다음 구조를 바탕으로 ${selectedSubType} 방식의 자연스러운 글을 작성하세요:

중심문장: ${centralSentence}
부연 설명: ${supportingSentences.join(' / ')}

${selectedSubType} 글의 특성:
${selectedSubType === '정의' ? '- 개념의 본질과 특징을 명확히 설명\n- "~은 ~이다" 형식의 정의문 포함\n- 개념의 속성과 범위를 구체적으로 제시' : 
  selectedSubType === '묘사' ? '- 대상의 구체적인 모습과 특징을 생생하게 그려냄\n- 감각적 표현과 세부적 묘사 포함\n- 독자가 머릿속에 그림을 그릴 수 있도록 서술' :
  selectedSubType === '서사' ? '- 시간의 흐름에 따른 사건이나 과정을 순서대로 서술\n- "처음에는 ~, 그 다음에는 ~, 마지막에는 ~" 형식\n- 변화나 발전 과정을 시간순으로 제시' :
  selectedSubType === '설명' ? '- 현상이나 사실을 객관적이고 논리적으로 설명\n- 구체적인 예시와 데이터 포함\n- 독자의 이해를 돕는 체계적 설명' :
  selectedSubType === '분류' ? '- 대상을 종류나 유형별로 나누어 체계적으로 제시\n- "~은 크게 A, B, C로 나뉜다" 형식\n- 각 분류의 특징과 차이점을 명확히 구분' :
  '- 어떤 현상의 원인과 결과를 객관적으로 설명\n- 원인 → 과정 → 결과의 논리적 흐름\n- "~때문에 ~가 발생한다" 형식의 현상 발생 과정 서술'}

요구사항:
- 4-6문장으로 구성
- 중심문장을 자연스럽게 포함
- ${selectedSubType}의 특성을 명확히 드러내는 내용
- 주장이나 논증을 피하고 객관적 서술
- 읽기 쉬운 문체` }],
                max_tokens: 800
            });
            
            // 1.2.5 생성한 문장을 제시문으로 출력함
            passageText = nonArgumentResponse.choices[0].message.content.trim();
            
            // 1.2.6 팝업창에는 글의 주제, 중심문장 등의 내용 요약과 글의 종류에 대한 설명을 출력해줘
            
            // 제시문 내용 요약 생성
            const summaryResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: `다음 제시문의 내용을 2-3문장으로 요약해주세요:

제시문: ${passageText}

요약 요구사항:
- 제시문의 핵심 내용을 간결하게 정리
- 어떤 내용을 다루고 있는지 명확히 제시
- 객관적이고 중립적인 톤으로 작성` }],
                max_tokens: 300
            });
            const contentSummary = summaryResponse.choices[0].message.content.trim();
            
            logicalStructure = { 
                type: 'non_argument',
                subType: selectedSubType,
                topicSentence: topicSentence,
                centralSentence: centralSentence, 
                supportingSentences: supportingSentences,
                contentSummary: contentSummary
            };
            coreSubject = centralSentence; // 중심문장을 핵심 주제로 사용
            
            // 더 구체적인 해설 생성
            const subTypeExplanations = {
                '정의': '개념이나 대상의 본질과 특징을 명확히 설명하는 글입니다. 주로 "~은 ~이다" 형식으로 개념을 정의하고, 그 속성과 범위를 구체적으로 제시합니다.',
                '묘사': '대상의 구체적인 모습, 특징, 상태를 생생하게 그려내는 글입니다. 감각적 표현을 통해 독자가 머릿속에 생생한 그림을 그릴 수 있도록 서술합니다.',
                '서사': '시간의 흐름에 따른 사건이나 과정을 순서대로 서술하는 글입니다. 변화나 발전 과정을 시간순으로 제시하여 이야기를 전개합니다.',
                '설명': '현상이나 사실을 객관적이고 논리적으로 설명하는 글입니다. 구체적인 예시와 데이터를 통해 독자의 이해를 돕습니다.',
                '분류': '대상을 종류나 유형별로 나누어 체계적으로 제시하는 글입니다. 각 분류의 특징과 차이점을 명확히 구분하여 설명합니다.',
                '원인-결과 분석': '어떤 현상의 원인과 결과의 관계를 객관적으로 서술하는 글입니다. 원인에서 결과로 이어지는 논리적 흐름을 통해 현상의 발생 과정을 설명합니다.'
            };
            
            explanation = `이 제시문은 기타 유형의 글로, 구체적으로는 ${selectedSubType}에 해당합니다. ${subTypeExplanations[selectedSubType]} 

제시문 내용 요약: ${contentSummary}`;
        }

        const result = {
            passageText: passageText,
            passageType: selectedType === 'argument' ? '논증' : `기타(${logicalStructure.subType || '기타'})`,
            explanation: explanation,
            coreSubject: coreSubject,
            logicalStructure: logicalStructure
        };

        console.log(`[SUCCESS] 논증 구분하기용 제시문 생성 완료 - 유형: ${result.passageType}`);
        res.json(result);

    } catch (error) {
        console.error(`[ERROR] /api/generate-distinction-passage: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// 비논증 요약 제시문 생성 API
app.post('/api/generate-non-argument-passage', async (req, res) => {
    try {
        if (!openai) {
            // 목업 데이터 반환
            return res.json({
                passage: "기후변화는 지구 온난화로 인한 현상입니다. 이산화탄소 배출이 주요 원인이며, 해수면 상승과 극단적 기후가 나타나고 있습니다.",
                type: "causal"
            });
        }

        const { keyword, summaryType, difficulty } = req.body;
        console.log(`[API_CALL] /api/generate-non-argument-passage - keyword: ${keyword}, type: ${summaryType}, difficulty: ${difficulty}`);

        // 새로운 난이도별 분량 설정
        let lengthRequirement = '';
        if (difficulty === 'easy') {
            lengthRequirement = '200~300자 정도의 한 단락으로 구성된 글';
        } else if (difficulty === 'normal') {
            lengthRequirement = '400~600자 정도의 한 단락으로 구성된 글';
        } else if (difficulty === 'hard') {
            lengthRequirement = '1500자 이내, 3~4단락으로 구성된 긴 글';
        }

        // 요약 유형별 프롬프트 설정
        let typeSpecificPrompt = '';
        
        if (summaryType === 'delete') {
            typeSpecificPrompt = `"${keyword}"에 대한 글을 작성하되, 다음 요소들을 충분히 포함하여 삭제 요약이 필요한 글을 만드세요:
- 반복되는 표현이나 내용
- 과도한 수식어와 형용사
- 부수적이거나 지엽적인 정보`;
        } else if (summaryType === 'select') {
            typeSpecificPrompt = `"${keyword}"에 대한 글을 작성하되, 다음 요소들을 포함하여 선택 요약이 필요한 글을 만드세요:
- 핵심 정보와 부수적 정보가 혼재
- 여러 측면의 정보가 나열
- 중요도가 다른 여러 정보들`;
        } else if (summaryType === 'generalize') {
            typeSpecificPrompt = `"${keyword}"에 대한 글을 작성하되, 다음 요소들을 포함하여 일반화 요약이 필요한 글을 만드세요:
- 구체적인 사례나 예시들
- 세부적인 통계나 수치
- 개별적인 사실들`;
        } else if (summaryType === 'construct') {
            typeSpecificPrompt = `"${keyword}"에 대한 글을 작성하되, 다음 요소들을 포함하여 구성 요약이 필요한 글을 만드세요:
- 산만하게 흩어진 정보들
- 명확한 구조 없이 나열된 내용
- 연결이 느슨한 여러 아이디어`;
        }

        const prompt = `${typeSpecificPrompt}

${lengthRequirement}으로 작성하세요.
자연스럽고 읽기 쉬운 문체로 작성하되, 위에서 언급한 특징들이 자연스럽게 포함되도록 하세요.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2000
        });

        res.json({
            passage: response.choices[0].message.content.trim(),
            type: summaryType
        });

    } catch (error) {
        console.error(`[ERROR] /api/generate-non-argument-passage: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// 이미지 프록시 API
app.get('/api/proxy-image', async (req, res) => {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) {
            return res.status(400).send('이미지 URL이 필요합니다.');
        }

        console.log(`[API_CALL] /api/proxy-image - url: ${imageUrl}`);

        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`이미지 다운로드 실패: ${response.statusText}`);
        }

        const imageBuffer = await response.buffer();
        const contentType = response.headers.get('content-type');

        if (contentType) {
            res.set('Content-Type', contentType);
        }
        res.send(imageBuffer);

    } catch (error) {
        console.error(`[ERROR] /api/proxy-image: ${error.message}`);
        res.status(500).send('이미지를 가져올 수 없습니다.');
    }
});

// AI 이미지 논증 분석 API
app.post('/api/analyze-image-argument', async (req, res) => {
    try {
        if (!openai) {
            // 목업 데이터 반환
            return res.json({
                issue: "플라스틱 사용을 줄여야 하는가?",
                claim: "일회용 플라스틱 사용을 즉시 중단해야 한다.",
                grounds: [
                    "플라스틱 쓰레기가 해양 생태계를 파괴하고 있다.",
                    "미세 플라스틱이 인체 건강에 악영향을 미친다."
                ]
            });
        }

        const { imageUrl } = req.body;
        console.log(`[API_CALL] /api/analyze-image-argument`);

        if (!imageUrl) {
            return res.status(400).json({ error: "이미지 URL이 필요합니다." });
        }

        // OpenAI Vision API를 사용한 이미지 분석
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `이 공익광고 이미지를 분석하여 논증 구조를 파악해주세요.
                            
결과는 다음 JSON 형식으로 답해주세요:
{
  "issue": "광고가 다루는 핵심 쟁점 (질문 형태)",
  "claim": "광고의 주장",
  "grounds": ["근거1", "근거2"]
}`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl
                            }
                        }
                    ]
                }
            ],
            max_tokens: 500
        });

        let content = response.choices[0].message.content;
        content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        try {
            const result = JSON.parse(content);
            res.json(result);
        } catch (e) {
            // JSON 파싱 실패시 텍스트 그대로 반환
            res.json({
                issue: "이미지 분석 결과",
                claim: content,
                grounds: []
            });
        }

    } catch (error) {
        console.error(`[ERROR] /api/analyze-image-argument: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// 6.6 게임용 제시문 생성 (빠른 고품질 생성)
app.post('/api/generate-game-passage', async (req, res) => {
    try {
        // 개발 중 API 키 없이도 테스트 가능하도록 목업 데이터 제공
        if (!openai) {
            const mockData = {
                text: "스마트폰은 현대인의 필수품이 되었다. 이제 우리는 하루도 스마트폰 없이 살기 어려워했다. 많은 사람들이 스마트폰을 통해 소통하고 정보를 얻고 있다.",
                type: "비논증",
                explanation: "이 글은 스마트폰의 현재 상황과 중요성을 설명하는 비논증문입니다."
            };
            return res.json(mockData);
        }

        const { keyword, type } = req.body;
        console.log(`[API_CALL] /api/generate-game-passage - keyword: ${keyword}, type: ${type}`);

        // 게임용 단일 프롬프트로 빠른 생성 (GPT-4o 사용)
        let prompt;
        if (type === 'argument') {
            prompt = `"${keyword}"에 대한 짧은 논증문을 3-4문장으로 작성하세요.

요구사항:
- 명확한 주장 1개와 근거 2개 포함
- 논리적 관계사 사용 금지 (따라서, 그러므로, 왜냐하면 등)
- 자연스러운 연결로 논증 구조 표현
- 설득력 있는 내용

응답 형식:
제시문만 출력하세요. 다른 설명은 불필요합니다.`;
        } else {
            const subTypes = ['정의', '묘사', '서사', '설명', '분류', '현상묘사'];
            const selectedSubType = subTypes[Math.floor(Math.random() * subTypes.length)];
            
            prompt = `"${keyword}"에 대한 ${selectedSubType} 방식의 짧은 글을 3-4문장으로 작성하세요.

요구사항:
- ${selectedSubType} 글의 특성에 맞게 작성
- 주장이나 논증 구조 없이 사실적 설명만
- 자연스럽고 읽기 쉬운 문체
- 정보 전달 목적

응답 형식:
제시문만 출력하세요. 다른 설명은 불필요합니다.`;
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 300,
            temperature: 0.8
        });

        const passageText = response.choices[0].message.content.trim();

        // 간단한 설명 생성
        const explanationPrompt = `다음 제시문의 글의 종류와 특징을 1-2문장으로 설명하세요:

제시문: ${passageText}

${type === 'argument' ? '논증문' : '비논증문'}의 특징을 중심으로 간단히 설명해주세요.`;

        const explanationResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: explanationPrompt }],
            max_tokens: 150,
            temperature: 0.7
        });

        const explanation = explanationResponse.choices[0].message.content.trim();

        res.json({
            text: passageText,
            type: type === 'argument' ? '논증' : '비논증',
            explanation: explanation
        });

    } catch (error) {
        console.error(`[ERROR] /api/generate-game-passage: ${error.message}`);
        res.status(500).json({ error: '제시문 생성 중 오류가 발생했습니다.' });
    }
});

// 8. 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
    console.error('[ERROR]', err);
    res.status(500).json({
        error: '서버 오류가 발생했습니다.',
        message: err.message
    });
});

// 6.7 예시답안 생성 API
app.post('/api/generate-example-summary', async (req, res) => {
    try {
        console.log(`[API_CALL] /api/generate-example-summary`);
        
        const { claim, grounds, subgrounds, warrant } = req.body;
        
        if (!openai) {
            // API 키가 없는 경우 기본 예시답안 반환
            return res.json({
                exampleSummary: `${claim} 이는 여러 근거들을 통해 뒷받침된다. ${grounds ? grounds.join(', ') : ''}라는 점들이 이를 증명한다. 따라서 위와 같은 이유로 해당 주장이 타당하다고 볼 수 있다.`
            });
        }
        
        // 논리구조를 바탕으로 자연스러운 요약문 생성
        let structureText = `주장: ${claim}\n`;
        
        if (grounds && grounds.length > 0) {
            structureText += `근거들:\n`;
            grounds.forEach((ground, index) => {
                structureText += `${index + 1}. ${ground}\n`;
                if (subgrounds && subgrounds[ground]) {
                    subgrounds[ground].forEach((subGround, subIndex) => {
                        structureText += `  ${index + 1}.${subIndex + 1} ${subGround}\n`;
                    });
                }
            });
        }
        
        if (warrant) {
            structureText += `숨은전제: ${warrant}\n`;
        }
        
        const prompt = `다음 논증의 논리구조를 바탕으로 자연스럽고 완성도 높은 한 단락 요약문을 작성해주세요:

${structureText}

요구사항:
- 주장을 중심으로 근거들을 자연스럽게 연결
- 논리적 흐름이 명확한 한 단락 구성
- 학술적이면서도 읽기 쉬운 문체
- 150-250자 정도의 적절한 길이
- 단순 나열이 아닌 유기적 연결

요약문만 출력해주세요:`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 400,
            temperature: 0.7
        });

        const exampleSummary = response.choices[0].message.content.trim();
        
        res.json({ exampleSummary });
        
    } catch (error) {
        console.error(`[ERROR] /api/generate-example-summary: ${error.message}`);
        res.status(500).json({ 
            error: '예시답안 생성 중 오류가 발생했습니다.',
            exampleSummary: '예시답안을 생성할 수 없습니다. 주장과 근거를 자연스럽게 연결하여 한 단락으로 작성해보세요.'
        });
    }
});

// 9. 서버 시작
app.listen(PORT, () => {
    console.log(`
====================================
🚀 통합 서버가 시작되었습니다!
====================================
서버 주소: http://localhost:${PORT}

📚 사용 가능한 페이지:
- 메인: http://localhost:${PORT}/
- 논증 구분하기: http://localhost:${PORT}/distinguish-argument.html
- 논증 요약하기: http://localhost:${PORT}/argument-summary.html
- 이미지 요약하기: http://localhost:${PORT}/image-summary.html
- 비교하기: http://localhost:${PORT}/compare.html
- 논리적 평가하기: http://localhost:${PORT}/logical-evaluation.html

🔧 API 엔드포인트:
- POST /api/generate-prompt (논리적 평가)
- POST /api/submit-evaluation (논리적 평가)
- POST /api/generate-passage (논증/인과설명)
- POST /api/evaluate-summary (요약 평가)
- POST /api/generate-image (이미지 검색)
- POST /api/generate-distinction-passage (논증 구분하기)
- POST /api/generate-non-argument-passage (비논증 요약)
- GET /api/proxy-image (이미지 프록시)
- POST /api/analyze-image-argument (이미지 논증 분석)
- POST /api/generate-game-passage (게임용 제시문 생성)
- POST /api/generate-example-summary (예시답안 생성)

⚙️ 설정된 API:
- OpenAI: ${openai ? '✅' : '❌'}
- Anthropic: ${anthropic ? '✅' : '❌'}
- Google Search: ${customsearch ? '✅' : '❌'}
====================================
    `);
});