# Point Server API

포인트 시스템을 관리하는 NestJS 기반 백엔드 API 서버입니다.

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript를 사용하여 구축된 포인트 관리 시스템입니다.
사용자 포인트 관리, 포인트-토큰 교환, 토큰 민팅/소각 등의 기능을 제공합니다.

## 프로젝트 구조

이 프로젝트는 **모듈 기반 구조 (Modular Structure)**를 채택하여 비즈니스 로직 중심으로 4개의 주요 도메인으로 분리되어 있습니다:

```
src/
├── app.controller.ts          # 기본 헬스체크 컨트롤러
├── app.service.ts             # 기본 앱 서비스  
├── app.module.ts              # 루트 모듈 (4개 모듈 import)
├── main.ts                    # 애플리케이션 진입점
├── common/                    # 공통 기능
│   ├── decorators/            # 커스텀 데코레이터
│   ├── filters/               # 예외 필터
│   ├── guards/                # 인증/인가 가드
│   ├── interceptors/          # 인터셉터
│   ├── pipes/                 # 파이프 (유효성 검사, 변환)
│   └── dto/                   # 공통 DTO
├── config/                    # 환경 설정
└── modules/                   # 비즈니스 모듈들
    ├── point/                 # 포인트 관리 모듈
    │   ├── dto/
    │   │   ├── user-point.dto.ts
    │   │   ├── consumption-history.dto.ts
    │   │   └── grant-history.dto.ts
    │   ├── entities/          # MikroORM 엔티티 클래스
    │   │   ├── user-point.entity.ts
    │   │   ├── consumption-history.entity.ts
    │   │   └── grant-history.entity.ts
    │   ├── repositories/      # 데이터 접근 로직 (리포지토리)
    │   ├── point.controller.ts
    │   ├── point.service.ts
    │   └── point.module.ts
    ├── swap/                  # 교환 관리 모듈
    │   ├── dto/
    │   │   └── user-swap-history.dto.ts
    │   ├── entities/          # MikroORM 엔티티 클래스
    │   │   └── user-swap-history.entity.ts
    │   ├── repositories/      # 데이터 접근 로직 (리포지토리)
    │   ├── swap.controller.ts
    │   ├── swap.service.ts
    │   └── swap.module.ts
    ├── token/                 # 토큰 관리 모듈
    │   ├── dto/
    │   │   ├── token-mint-history.dto.ts
    │   │   └── token-burn-history.dto.ts
    │   ├── entities/          # MikroORM 엔티티 클래스
    │   │   ├── token-mint-history.entity.ts
    │   │   └── token-burn-history.entity.ts
    │   ├── repositories/      # 데이터 접근 로직 (리포지토리)
    │   ├── token.controller.ts
    │   ├── token.service.ts
    │   └── token.module.ts
    └── blockchain/            # 블록체인 연동 모듈
        ├── dto/
        │   ├── transaction.dto.ts
        │   └── signature.dto.ts
        ├── repositories/      # 데이터 접근 로직 (리포지토리)
        ├── blockchain.controller.ts
        ├── blockchain.service.ts
        └── blockchain.module.ts
```

## 주요 모듈

### 1. Point 모듈 (포인트 관리)
- **사용자 포인트 CRUD**: 포인트 생성, 조회, 업데이트
- **포인트 사용**: 쇼핑몰 구매, 이벤트 참여 등으로 포인트 사용
- **포인트 지급**: 구매 리워드, 이벤트 참여, 출석체크 등으로 포인트 지급
- **사용/지급 내역 관리**: 내역 조회, 롤백 처리

### 2. Swap 모듈 (교환 관리)
- **포인트-토큰 교환**: 포인트를 토큰으로 또는 토큰을 포인트로 교환
- **교환 내역 관리**: 교환 내역 조회 및 상태 관리

### 3. Token 모듈 (토큰 관리)
- **토큰 민팅 내역**: 토큰 생성 트랜잭션 관리
- **토큰 소각 내역**: 토큰 소각 트랜잭션 관리

### 4. Blockchain 모듈 (블록체인 연동)
- **매니저 계정 관리**: 매니저 계정의 서명값 생성 및 관리
- **트랜잭션 전송**: 블록체인에 트랜잭션 전송 및 처리
- **상태 추적**: 블록체인 트랜잭션 상태 실시간 추적

## 데이터베이스 구조

![ERD](images/erd_image.png)

주요 테이블:
- `user_point`: 사용자 포인트 정보
- `consumption_history`: 포인트 사용 내역
- `grant_history`: 포인트 지급 내역
- `user_swap_history`: 포인트-토큰 교환 내역
- `token_mint_history`: 토큰 생성 내역
- `token_burn_history`: 토큰 소각 내역

## API 문서

주요 API 엔드포인트:
- `GET /api/v1/point/user-points` - 사용자 포인트 목록 조회
- `POST /api/v1/point/user-points` - 사용자 포인트 생성
- `POST /api/v1/point/user-points/:id/swap-to-point` - 포인트 교환
- `POST /api/v1/point/user-points/:id/consume` - 포인트 사용
- `POST /api/v1/point/user-points/:id/grant` - 포인트 지급
- `GET /api/v1/point/user-swap-histories` - 교환 내역 조회

## Project setup

```bash
$ npm install
```