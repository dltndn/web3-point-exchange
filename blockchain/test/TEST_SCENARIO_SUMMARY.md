# PointManagerImpl.sol 보안 테스트 시나리오

`PointManagerImpl.sol`의 핵심 로직과 보안 취약점 가능성을 기준으로 작성한 테스트 시나리오 목록입니다.  
(각 항목은 "준비(Precondition) → 행동(Act) → 기대 결과(Assert)" 형태의 테스트 구성을 가정합니다.)

## 1. 소유자(Owner) 권한 관리

### 1.1 매니저 권한 부여/회수
- Owner가 `grantManager` 호출 시 성공
- 임의 주소가 호출하면 `Ownable: caller is not the owner` revert

### 1.2 환율 설정 권한
- Owner가 0 초과 값으로 호출 → 이벤트, 상태 업데이트 확인
- 0 값 입력 시 `exchange rate must be greater than 0` revert
- 비-Owner 호출 시 revert

### 1.3 유저 유효성 설정 권한
- 0 주소 입력 시 revert
- 비-Owner 호출 시 revert

## 2. 시스템 제어 기능

### 2.1 Pausable 기능
- Owner가 `pause` → `depositPoint`, `withdrawPoint` 모두 `Pausable: paused` revert
- Owner가 `unpause` 후 동일 호출이 정상 수행

### 2.2 UUPS 업그레이드 권한
- Owner 아닌 계정이 `_authorizeUpgrade` 경로로 업그레이드 시도 시 revert
- Owner는 정상적으로 새 구현 컨트랙트 주소로 업그레이드 가능

## 3. depositPoint 보안 검증

### 3.1 서명 검증
- 유효한 EIP-712 서명으로 호출 시 성공
- 잘못된 매니저 서명 → `InvalidSignature` revert
- 서명자 ≠ 매니저 → `InvalidManager` revert

### 3.2 만료 기간 확인
- `validUntil` < 현재 블록타임 → 통과
- `validUntil` ≥ 현재 블록타임 → `ValidIsExpired` revert

### 3.3 유효하지 않은 유저
- `isValidUser`가 false인 계정 호출 → `InvalidUser` revert

### 3.4 토큰 전송 정확성
- `exchangeRate` 기준으로 계산된 토큰 수량이 계정으로 정확히 전송되는지 확인
- 토큰 잔액 부족 시 `ERC20: transfer amount exceeds balance` revert

## 4. withdrawPoint 보안 검증

### 4.1 서명 검증
- 계정 본인이 서명한 경우만 성공
- 타인이 서명한 경우 `InvalidSignature` revert

### 4.2 만료 기간/유효 사용자 체크
- `ValidIsExpired`, `InvalidUser` 분기 각각 확인

### 4.3 토큰 전송 & Allowance
- 사용자가 사전에 `approve` 하지 않으면 `safeTransferFrom` revert
- 정확한 토큰 금액이 컨트랙트로 이동하고, 이벤트 값도 맞는지 검증

## 5. 고급 보안 검증

### 5.1 재진입(Re-entrancy) 보호
- 악의적 토큰(재진입 구현)으로 `depositPoint`, `withdrawPoint` 호출 시 재진입 차단 여부 확인 (`nonReentrant`)

### 5.2 역할 오용 방지
- `grantManager` 된 주소가 다시 `grantManager` 호출 시 revert
- `revokeManager` 되지 않은 주소에 대해 `revokeManager` 호출 시 revert

### 5.3 EIP-165 인터페이스 식별자
- `supportsInterface(type(IPointManager).interfaceId)`가 true 반환
- 무작위 interfaceId 전달 시 false 반환

### 5.4 이벤트 로그 무결성
- 각 함수 호출 후 `ManagerGranted`, `PointDeposited` 등 이벤트 파라미터가 정확한지 검증

### 5.5 초기화 보안
- 컨트랙트 배포 후 `initialize`를 한 번 더 호출하면 `Initializable: contract is already initialized` revert
- `_token` 또는 `_owner`에 0 주소 전달 시 revert (OpenZeppelin 내부 체크)

## 6. 스트레스 테스트

### 6.1 임계값 Fuzz 테스트
- `amount`·`exchangeRate`에 대해 uint256 최대값 근처, 0 근처 값 등 임의 데이터로 fuzz 테스트하여 오버플로/언더플로 여부 확인

### 6.2 클라이언트-측 EIP-712 도메인 일치
- 다른 체인ID, 계약 주소로 서명한 메시지를 보내면 `InvalidSignature` revert

## 7. Multicall 기능 테스트

### 7.1 여러 유효 함수 호출 성공
- 매니저가 multicall로 depositPoint 함수를 여러 번 호출 → 모든 호출 성공, 각 계정에 토큰 전송 및 이벤트 확인

### 7.2 일부 호출 실패 시 전체 revert
- multicall에 유효한 호출과 무효한 호출(예: 비-Owner가 Owner-only 함수 호출) 포함 → 전체 multicall revert 확인
