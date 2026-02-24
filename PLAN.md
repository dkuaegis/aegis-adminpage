## 관리자페이지 Shadcn 마이그레이션 유지보수 리팩토링 계획 (중간 상세도)

### 요약
- 목적: `shadcn` 전환 이후 코드 일관성과 유지보수성을 높이기 위해, 공통 규칙을 먼저 통일하고 페이지를 단계적으로 분해합니다.
- 방향: `횡단 규칙/인프라 통일 → 페이지 분해 리팩토링 → 문서화`.
- 품질 게이트: 자동 테스트는 도입하지 않고, `lint + build(tsc 포함)` 통과를 기준으로 합니다.
- API 레이어: 도메인별 `request.ts`를 **공통 HTTP 클라이언트로 완전 통합**합니다.

### 범위
- 포함: 전체 페이지(`home/login/notfound/event/coupon/feature-flags/member-demotion/member-management/point/payment`), 공통 UI/레이아웃, API 클라이언트.
- 제외: 백엔드 API 스펙 변경, e2e/단위 테스트 도입, 디자인 시스템 대규모 재정의.

---

## 페이즈별 실행 계획

### Phase 1. 공통 규칙/인프라 통일
**목표**
- 페이지 분해 전에 “중복 제거의 기준점”을 만듭니다.

**작업**
1. 공통 HTTP 클라이언트 신설
- 신규 파일:
  - [`src/lib/http/client.ts`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/lib/http/client.ts)
  - [`src/lib/http/types.ts`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/lib/http/types.ts)
- 역할:
  - `credentials: "include"`, JSON 파싱/204 처리, 에러명 추출, 공통 로그 처리 일원화.

2. 에러 메시지 매핑 공통화
- 신규 파일:
  - [`src/lib/errors/admin-error.ts`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/lib/errors/admin-error.ts)
- 기존 페이지별 `mapErrorMessage`를 공통 `resolveAdminErrorMessage()` + 도메인별 override 패턴으로 통일.

3. 관리자 공통 UI 패턴 컴포넌트 도입
- 신규 디렉터리:
  - [`src/components/admin`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/components/admin)
- 후보 컴포넌트:
  - `AdminPageHeader` (제목/설명/우측 액션)
  - `AdminFilterBar` (검색/필터/조회 버튼 표준 레이아웃)
  - `AdminTableEmptyRow` (로딩/빈값 메시지 일관화)
  - `AdminSectionCard` (반복되는 Card 조합 축약)

**완료 기준**
- 신규 공통 모듈 생성 및 최소 1개 페이지에서 사용 시작.
- 중복 `requestApi`/`mapErrorMessage` 제거 시작점 확보.

---

### Phase 2. API 레이어 완전 통합
**목표**
- 도메인별로 복제된 `request.ts`를 단일 클라이언트로 통합하여 변경 비용을 줄입니다.

**작업**
1. 기존 도메인 `request.ts` 정리
- 대상:
  - [`src/api/coupon/request.ts`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/api/coupon/request.ts)
  - [`src/api/point/request.ts`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/api/point/request.ts)
  - [`src/api/payment/request.ts`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/api/payment/request.ts)
  - [`src/api/member-management/request.ts`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/api/member-management/request.ts)
- 방식:
  - 각 파일은 공통 클라이언트 re-export 또는 thin wrapper로 축소.
  - 호출부 시그니처는 가급적 유지(리스크 최소화).

2. activity/auth의 직접 fetch 패턴 정규화
- 대상:
  - [`src/api/activity`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/api/activity)
  - [`src/api/auth/members.ts`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/api/auth/members.ts)
- 반환 형식 불일치(`boolean`, `null`, object)를 단계적으로 통일.

**완료 기준**
- API 호출 공통 로직이 단일 파일군에서 관리됨.
- 도메인별 request 로직 복제 제거.

---

### Phase 3. 대형 페이지 분해 (핵심 유지보수 구간)
**목표**
- 한 파일에 몰린 상태/비즈니스/UI를 분리해 수정 난이도를 낮춥니다.

**우선 대상 (현재 라인수 기준)**
- [`src/page/coupon.tsx`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/page/coupon.tsx)
- [`src/page/point.tsx`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/page/point.tsx)
- [`src/page/member-management.tsx`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/page/member-management.tsx)
- [`src/page/payment.tsx`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/page/payment.tsx)
- [`src/page/event.tsx`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/page/event.tsx)

**분해 규칙 (모든 페이지 공통)**
1. `hooks/`로 상태/비즈니스 분리
- 예: `useCouponPageState`, `usePointLedger`, `usePaymentFilters`

2. `sections/`로 화면 블록 분리
- 예: `PaymentTableSection`, `TransactionTableSection`, `CouponIssuedSection`

3. 페이지 파일은 “조합/라우팅 엔트리” 역할만 수행
- 파일당 책임: 데이터 orchestration + 섹션 조립.

4. 분해 후 파일 크기 기준
- page 엔트리: 250줄 내외 목표
- hook/section: 200줄 내외 목표(초과 시 재분해).

**완료 기준**
- 위 5개 페이지 모두 hook/section 구조로 분해.
- 페이지 본문 가독성 및 변경 포인트 탐색성 개선.

---

### Phase 4. 중소형 페이지/레이아웃 정리 + UI 일관성 고정
**목표**
- 남은 페이지를 동일 패턴으로 정리해 전체 유지보수 경험 통일.

**작업**
- 대상:
  - [`src/page/feature-flags.tsx`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/page/feature-flags.tsx)
  - [`src/page/member-demotion.tsx`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/page/member-demotion.tsx)
  - [`src/page/login.tsx`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/page/login.tsx)
  - [`src/components/layout`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/components/layout)
- 액션:
  - 공통 헤더/필터/빈 상태 컴포넌트 적용.
  - 토스트/confirm 사용 규칙 통일 (`showError/success/confirm`).

**완료 기준**
- 페이지 간 UI 패턴/문구/행동 일관성 확보.
- layout 기반 진입 동선(사이드바/헤더) 규칙 정리 완료.

---

### Phase 5. 문서화 + 최종 안정화
**목표**
- 이후 유지보수 시 “어디를 어떻게 고쳐야 하는지”를 문서로 고정.

**작업**
1. 리팩토링 가이드 문서 추가
- 신규 문서:
  - [`PLAN.md`](/Volumes/personal/development/project/aegis/aegis-adminpage/PLAN.md) (페이즈 계획 + 진행체크)
  - [`README.md`](/Volumes/personal/development/project/aegis/aegis-adminpage/README.md) 내 운영 섹션 보강
- 내용:
  - 폴더 구조 규칙
  - 페이지 분해 규칙
  - API 추가 시 작성 규칙
  - 공통 컴포넌트 승격 기준

2. 최종 정리
- dead code/import 정리
- 타입 경고/린트 경고 제거
- 빌드 검증

**완료 기준**
- 신규 참여자가 문서만으로 구조를 따라갈 수 있음.
- 릴리즈 가능한 빌드 상태.

---

## 공용 API/인터페이스 변경 사항 (중요)
1. HTTP 클라이언트 인터페이스 추가
- `requestApi<T>()`의 사실상 표준 구현을 [`src/lib/http/client.ts`](/Volumes/personal/development/project/aegis/aegis-adminpage/src/lib/http/client.ts)로 이동.
- 도메인별 `request.ts`는 thin wrapper/re-export로 전환.

2. 에러 처리 인터페이스 정규화
- `errorName` 기반 메시지 해석을 공통 함수로 일원화.
- 페이지별 `mapErrorMessage`는 도메인 특화 보완 함수로 축소.

3. 페이지 내부 구조 계약
- `page -> hooks + sections` 구조를 공통 규칙으로 고정.
- 신규 페이지도 동일 구조를 따라야 함.

---

## 검증 시나리오 및 품질 게이트
### 자동 게이트
1. `npm run lint`
2. `npm run build`

### 수동 회귀 시나리오
1. 결제/트랜잭션 조회, 강제완료 동작, 재조회 일관성.
2. 포인트 단건/일괄 지급, 원장 페이지네이션.
3. 쿠폰 생성/수정/삭제, 코드 생성/삭제, 발급/회수.
4. 회원관리 검색/필터/타임라인/학기 상세 조회.
5. 행사 CRUD + QR 스캔 흐름, 세션 만료 처리.
6. 피처플래그 조회/저장(3개 플래그) 및 입력 검증 메시지.

---

## 커밋 단위 권장 (실행 시)
1. `chore(ui): introduce admin shared ui primitives and page scaffolds`
2. `refactor(api): unify request clients into shared http client`
3. `refactor(page): split payment and point into hooks/sections`
4. `refactor(page): split coupon and member-management into hooks/sections`
5. `refactor(page): split event/feature-flags and align interaction patterns`
6. `docs: add PLAN and maintenance guidelines; cleanup lint/build`

---

## 가정 및 기본값
- 테스트 코드는 추가하지 않는다(요청 사항 반영).
- 백엔드 API 스펙은 변경하지 않는다.
- shadcn 기반 UI(`src/components/ui`)는 유지하고, 커스텀은 래퍼/조합 컴포넌트에서 처리한다.
- 라우팅/권한 구조는 현재 방향을 유지한다(ProtectedLayout 기반).
- 계획 산출물은 “작업지시 + 개념설계 중간 수준”으로 유지한다.
