# Eco Design-Only Starter

경북대학교 대구캠퍼스 생물다양성 모니터링 및 생태지도 웹앱을 위한 design-only 스타터입니다.

이 저장소는 실제 서비스 구현 전, 화면 구조와 시각 디자인을 안전하게 보존하기 위한 정적/Mock 기반 프론트엔드 기준점입니다. 현재는 실제 지도 API, 실제 DB, 서버, 저장 기능, 인증, 이미지 업로드/스토리지가 연결되어 있지 않습니다.

## 현재 상태

- Vite + React + TypeScript 기반 프론트엔드
- Tailwind CSS v4 기반 스타일
- 정적 샘플 데이터 사용
- mock observation repository 사용
- 정적 지도 디자인 사용
- 업로드 화면은 저장 없는 mock 화면
- 기존 디자인, 한국어 문구, 색감, 레이아웃 보존 우선

## 실행 방법

Windows PowerShell에서는 `npm.ps1` 실행 정책 문제가 있을 수 있으므로 `npm.cmd`를 권장합니다.

```bash
npm.cmd ci --registry=https://registry.npmjs.org/ --no-audit --no-fund
npm.cmd run dev
```

개발 서버:

```text
http://localhost:3000
```

검증:

```bash
npm.cmd run typecheck
npm.cmd run build
```

## 주요 폴더 구조

```text
src/App.tsx
  앱 shell, 페이지 상태, 선택된 관찰 상세 모달 상태

src/components/ui/
  공통 UI: Button, ImageFrame, PageHeader, SearchInput, TaxonFilterButton

src/components/intro/
  생물다양성 도감 화면 전용 컴포넌트

src/components/observations/
  관찰 목록 화면 전용 컴포넌트

src/components/observations/detail/
  관찰 상세 모달 전용 컴포넌트

src/components/upload/
  업로드 mock 화면 전용 컴포넌트

src/components/map/
  정적 지도 디자인 컴포넌트

src/features/map/
  지도 타입, static provider, 좌표 projection 로직

src/features/upload/
  업로드 form 초기값, preview, 변환 helper

src/repositories/
  ObservationRepository interface와 mock repository

src/utils/
  관찰 필터, 통계, validation helper

src/constants/
  분류군 상수와 색상/스타일 매핑

src/data/
  정적 샘플 관찰 데이터

src/types.ts
  Taxon, Coordinates, Observation, CreateObservationInput 등 공유 타입

public/observations/
  샘플 관찰 이미지
```

## 현재 구현된 화면

- 홈
- 생물다양성 도감
- 관찰 목록
- 관찰 상세 모달
- 업로드 mock 화면
- 정적 생태지도

## 아직 포함되지 않은 것

- 실제 지도 API
- Kakao Map SDK
- Naver Map SDK
- Leaflet / MapLibre
- Firebase / Firestore
- Supabase
- Express 또는 서버 API
- 실제 DB
- 실제 저장 기능
- localStorage / IndexedDB 저장
- 실제 파일 업로드
- 이미지 스토리지
- 인증 / 권한 관리
- 관리자 승인 기능

## 다음 단계 후보

- README와 AGENTS 기준으로 개발 규칙 유지
- 저장소 선택 설계
  - Supabase/Postgres
  - Firebase
  - static/local JSON
- 지도 provider 선택 설계
  - Kakao Map
  - Naver Map
  - Leaflet
  - MapLibre
  - static-only 유지
- 실제 저장 기능 구현 전 architecture decision 문서 작성
- 관리자 기능과 승인 흐름 설계
- PWA 또는 앱 확장 가능성 검토
- Navbar / Hero 리팩터링 검토

## 보안 주의

- API key, token, secret을 코드에 하드코딩하지 마세요.
- `.env`, `.env.local`, `.env.production`을 커밋하지 마세요.
- 환경 변수가 필요해지면 placeholder만 담은 `.env.example`을 추가하세요.
- 실제 저장 기능을 붙이기 전에는 개인정보와 공개 범위를 먼저 정의하세요.
- 이미지 업로드를 구현할 때는 DB에 대용량 base64를 저장하지 말고, object storage와 URL/metadata 저장 구조를 사용하세요.

## Design-Only 원칙

현재 프로젝트는 디자인 기준점입니다. 기능 구현 전까지 다음을 유지합니다.

- 기존 디자인과 한국어 문구 보존
- 정적 지도 유지
- mock 데이터 유지
- 새 의존성 추가 금지
- 실제 API, DB, 서버, 저장, 인증 기능 추가 금지
- 기능 추가와 리팩터링 분리
