# 논증/인과설명 요약 교육 시스템 🎓

각 기능별로 독립적인 서버로 분리된 교육 웹 애플리케이션입니다.

## 📋 시스템 구조

```
nonsul/
├── 🔥 독립 모듈 서버들
│   ├── argument-server.js      # 논증 요약하기 (포트 3001)
│   ├── causal-server.js        # 인과설명 요약하기 (포트 3002)
│   ├── image-server.js         # 이미지 요약하기 (포트 3003)
│   └── compare-server.js       # 비교하기 (포트 3004)
├── 📄 HTML 페이지들
│   ├── argument-summary.html
│   ├── causal-explanation-summary.html
│   ├── image-summary.html
│   └── compare.html
├── 🎨 CSS 및 JavaScript
│   ├── style.css
│   └── *-script.js 파일들
└── 🚀 실행 스크립트
    └── start-all-servers.js   # 모든 서버 동시 실행
```

## 🚀 실행 방법

### 1. 모든 서버 동시 실행 (권장)
```bash
npm run start:all
```

### 2. 개별 서버 실행
```bash
# 논증 요약하기만 실행
npm run start:argument

# 인과설명 요약하기만 실행  
npm run start:causal

# 이미지 요약하기만 실행
npm run start:image

# 비교하기만 실행
npm run start:compare
```

### 3. 기존 통합 서버 실행
```bash
npm start
```

## 🌐 접속 주소

| 모듈 | 서버 주소 | HTML 페이지 |
|------|-----------|-------------|
| 논증 요약하기 | http://localhost:3001 | http://localhost:3001/argument-summary.html |
| 인과설명 요약하기 | http://localhost:3002 | http://localhost:3002/causal-explanation-summary.html |
| 이미지 요약하기 | http://localhost:3003 | http://localhost:3003/image-summary.html |
| 비교하기 | http://localhost:3004 | http://localhost:3004/compare.html |

## 🔧 각 모듈의 특징

### 📝 논증 요약하기 (argument-server.js)
- **기능**: 키워드 기반 논증문 생성 및 요약 채점
- **난이도**: 쉬움(2단락), 보통(3단락), 어려움(5단락 에세이)
- **API 엔드포인트**: 
  - `POST /api/generate-passage` - 제시문 생성
  - `POST /api/evaluate-summary` - 요약 채점

### 🧠 인과설명 요약하기 (causal-server.js)
- **기능**: 키워드 기반 인과설명문 생성 및 요약 채점
- **난이도**: 쉬움(현상+원인1개), 보통(원인2개+과정), 어려움(연쇄 인과관계)
- **API 엔드포인트**:
  - `POST /api/generate-passage` - 제시문 생성
  - `POST /api/evaluate-summary` - 요약 채점

### 🖼️ 이미지 요약하기 (image-server.js)
- **기능**: 키워드로 공익광고 이미지 검색 및 AI 논증 분석
- **특징**: 신뢰할 수 있는 사이트 우선 검색, OpenAI Vision API 활용
- **API 엔드포인트**:
  - `POST /api/generate-image` - 이미지 검색
  - `GET /api/proxy-image` - 이미지 프록시
  - `POST /api/analyze-image-argument` - AI 이미지 분석

### ⚖️ 비교하기 (compare-server.js)
- **기능**: 두 제시문(논증/인과설명) 비교 분석
- **특징**: 대조적 관점의 제시문 쌍 생성 (찬성vs반대, 개인vs사회적 원인)
- **API 엔드포인트**:
  - `POST /api/generate-passage` - 비교용 제시문 생성
  - `POST /api/evaluate-summary` - 비교 분석 채점

## 💡 독립 모듈의 장점

### 🎯 **개발 및 유지보수**
- 각 기능별로 코드가 분리되어 관리 용이
- 특정 모듈만 수정하거나 배포 가능
- 모듈별 독립적인 로그 및 에러 추적

### 🚀 **성능 및 확장성**
- 필요한 모듈만 실행하여 리소스 절약
- 각 모듈을 다른 서버에 배포 가능
- 로드 밸런싱 및 수평 확장 용이

### 👥 **협업 개발**
- 여러 개발자가 서로 다른 모듈 작업 가능
- 모듈 간 의존성 최소화
- 개별 테스트 및 디버깅 가능

### 🔒 **안정성**
- 한 모듈의 오류가 다른 모듈에 영향 없음
- 모듈별 독립적인 재시작 가능
- 점진적 업데이트 및 롤백 가능

## 📝 환경 변수 설정

각 서버는 동일한 `.env` 파일을 공유합니다:

```env
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_custom_search_engine_id

# 선택적 포트 설정
ARGUMENT_PORT=3001
CAUSAL_PORT=3002
IMAGE_PORT=3003
COMPARE_PORT=3004
```

## 🛠️ 개발 팁

1. **개별 모듈 개발**: 각 서버를 개별적으로 실행하여 해당 기능만 집중 개발
2. **로그 분석**: 각 서버의 로그는 `[모듈명]` 접두사로 구분됨
3. **API 테스트**: 각 모듈의 API를 독립적으로 테스트 가능
4. **점진적 배포**: 완성된 모듈부터 하나씩 배포 가능

## 🚫 종료 방법

- **모든 서버**: `Ctrl + C`로 일괄 종료
- **개별 서버**: 해당 터미널에서 `Ctrl + C`

---

**Made with ❤️ for Education** 