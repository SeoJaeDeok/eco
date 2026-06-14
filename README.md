# Eco Design Only Starter

기존 Google AI Studio 결과물에서 디자인만 분리한 Vite + React + TypeScript 프로젝트입니다.

포함한 것:

- 홈 히어로 디자인
- 상단 내비게이션 디자인
- 소개/도감 페이지 디자인
- 관찰목록 카드 그리드 디자인
- 관찰 상세 모달 디자인
- 기록하기 폼 디자인
- 지도 화면 느낌을 내는 정적 MapPreview 컴포넌트
- 샘플 관찰 데이터와 일부 이미지

의도적으로 제외한 것:

- Kakao Map SDK
- Kakao API key
- Firebase/Firestore
- Express 서버
- 업로드 API
- 삭제/관리자 기능
- 실제 DB 연결

## 실행

```bash
npm install
npm run dev
```

브라우저에서 엽니다.

```text
http://localhost:3000
```

## Codex CLI에서 쓰는 방법

이 프로젝트는 새 구현의 디자인 기준점으로 사용하세요. 처음에는 API를 붙이지 말고, 화면 단위 컴포넌트와 디자인 토큰을 유지한 채 데이터 모델부터 정리하는 것이 좋습니다.

추천 첫 프롬프트:

```text
이 프로젝트는 생태지도 웹앱의 디자인 레퍼런스입니다.
Kakao Map, Firebase, Express 서버는 의도적으로 제거되어 있습니다.

목표는 이 디자인을 유지하면서 실제 구현용 프로젝트 구조를 설계하는 것입니다.
먼저 코드를 수정하지 말고 다음을 분석해 주세요.
1. 디자인을 담당하는 컴포넌트 구조
2. 재사용 가능한 UI 컴포넌트 후보
3. 실제 지도 컴포넌트를 나중에 끼워 넣을 위치
4. 데이터 모델과 API 연결 시 바꿔야 할 부분
5. 모바일 화면에서 점검해야 할 부분

마지막에 작은 단위의 구현 계획만 제안해 주세요.
```

## 새 프로젝트에 디자인만 옮길 때 복사할 핵심 파일

```text
src/index.css
src/types.ts
src/components/Navbar.tsx
src/components/Hero.tsx
src/components/IntroPage.tsx
src/components/ObservationListPage.tsx
src/components/ObservationDetail.tsx
src/components/UploadMockPage.tsx
src/components/MapPreview.tsx
src/components/DesignMap.tsx
src/data/sampleObservations.ts
public/observations/*
```

## 실제 지도 연결 시 교체할 파일

나중에 Kakao Map, Naver Map, Leaflet, MapLibre 중 하나를 선택하면 `src/components/MapPreview.tsx`와 `src/components/DesignMap.tsx`를 실제 지도 컴포넌트로 교체하는 방향이 가장 안전합니다.


## 확인한 명령

```bash
npm run typecheck
npm run build
npm audit --audit-level=high
```
