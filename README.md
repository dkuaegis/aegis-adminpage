# AEGIS Admin Page

AEGIS(이지스) 동아리의 행사 관리를 위한 관리자 페이지입니다. QR 코드를 통한 출석 체크와 포인트 관리 시스템을 제공합니다.

## 🚀 주요 기능

### 🔐 인증 시스템
- 로그인/로그아웃 기능
- 인증 가드를 통한 페이지 접근 제어
- 자동 세션 유지 (60초마다 API 호출)

### 📊 행사 관리
- 행사 생성, 수정, 삭제
- 포인트 설정 및 관리
- 행사별 QR 코드 생성

### 📱 QR 코드 스캔
- 실시간 QR 코드 스캔
- 멤버 출석 체크
- 자동 포인트 적립

### 🔍 검색 기능
- 행사 검색
- 데이터 테이블 필터링

## 🛠 기술 스택

- **Frontend**: React 19, TypeScript
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **QR Scanner**: qr-scanner
- **Icons**: React Icons
- **Notifications**: React Toastify

## 📁 프로젝트 구조

```
src/
├── api/                    # API 통신 관련
│   ├── activity/          # 활동 관련 API
│   └── auth/              # 인증 관련 API
├── components/            # 재사용 가능한 컴포넌트
│   ├── EventTable.tsx     # 행사 테이블
│   ├── Header.tsx         # 헤더
│   ├── QRScanner.tsx      # QR 스캐너
│   ├── Search.tsx         # 검색바
│   └── SideBar.tsx        # 사이드바
├── context/               # React Context
│   └── AuthContext.tsx    # 인증 컨텍스트
├── hooks/                 # 커스텀 훅
│   ├── useAuthGuard.tsx   # 인증 가드 훅
│   └── useSessionKeepAlive.ts # 세션 유지 훅
├── page/                  # 페이지 컴포넌트
│   ├── event.tsx          # 행사 관리 페이지
│   ├── home.tsx           # 홈 페이지
│   ├── login.tsx          # 로그인 페이지
│   └── notfound.tsx       # 404 페이지
└── utils/                 # 유틸리티
    └── alert.tsx          # 알림 기능
```

## 🎯 페이지 구성

- `/` - 홈 페이지 (사이드바 포함)
- `/login` - 로그인 페이지
- `/event` - 행사 관리 페이지 (CRUD 및 QR 스캔)
- `*` - 404 페이지

## 🔧 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 린트 검사
npm run lint

# 프리뷰
npm run preview
```

## 📋 주요 기능 설명

### 행사 관리
- 행사 생성: 행사명과 포인트를 설정하여 새로운 행사 생성
- 행사 수정: 기존 행사의 정보 수정
- 행사 삭제: 불필요한 행사 삭제
- QR 코드 생성: 각 행사별 고유 QR 코드 생성

### QR 스캔 기능
- 카메라 권한 요청 및 QR 코드 실시간 스캔
- 중복 스캔 방지 (1초 throttling)
- 스캔 성공 시 자동 포인트 적립
- 카메라 새로고침 기능

### 인증 시스템
- JWT 기반 인증
- 페이지별 접근 권한 제어
- 자동 세션 연장 (60초마다)
- 세션 만료 시 자동 로그인 페이지 리디렉션

## 🔒 보안 기능

- 인증되지 않은 사용자 접근 차단
- 세션 자동 관리
- QR 코드 중복 처리 방지
- 안전한 API 통신

## 🚀 배포

프로젝트는 Vite를 사용하여 빌드되며, 정적 파일로 배포할 수 있습니다.

```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

---

**AEGIS Admin Page** - 효율적인 동아리 행사 관리를 위한 솔루션