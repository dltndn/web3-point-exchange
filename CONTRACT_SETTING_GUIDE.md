# 컨트랙트 배포 및 설정 가이드

## 로컬 환경에서 컨트랙트 배포하기

### 1. 블록체인 폴더로 이동

```bash
cd blockchain
```

### 2. 환경변수 파일 생성

`blockchain` 폴더에 `.env` 파일을 생성하고 다음 내용을 추가합니다:

```bash
BASE_SEPOLIA_URL= # chain rpc url
PRIVATE_KEY = # private key of contract owner
BASESCAN_API_KEY= # etherscan api key
```

### 3. 컨트랙트 배포

다음 명령어로 컨트랙트를 배포합니다:

```bash
npx hardhat ignition deploy ignition/modules/PointManager.ts \
  --network baseSepolia \
  --parameters '{ "PointManagerModule": {"initialExchangeRate": 100} }' \
  --verify
```

### 4. 배포된 컨트랙트 주소 확인

실행 후 배포된 컨트랙트 주소 목록 출력 값에서:
- `BloomTokenModule#BloomTokenAtProxy`: 토큰 컨트랙트 주소
- `PointManagerModule#PointManagerAtProxy`: PointManager 컨트랙트 주소

### 5. 환경변수 추가

`.env` 파일에 배포된 PointManager 컨트랙트 주소를 추가합니다:

```bash
POINT_MANAGER_ADDRESS= # PointManager 컨트랙트 주소
```

### 6. PointManager 운영 스크립트 실행

다음 명령어로 pointManager 운영 스크립트를 실행합니다:

```bash
npx hardhat run scripts/pointManager.ts --network baseSepolia
```

### 7. 매니저 계정 등록

아래와 같은 출력이 나타나면 `1번(grantManager)`을 선택하여 manager 계정을 등록합니다:

```bash
🎯 PointManager 관리 스크립트
================================ 
현재 계정: 0xF821De8048B0C319ba84110aEb4bB01588878Db5
PointManager 주소: 0xF5837786C1c2dC81E8476ca47acB692499a0ACE2
현재 owner: 0xF821De8048B0C319ba84110aEb4bB01588878Db5
현재 교환비율: 100
연결된 토큰 주소: 0x6b21f39633d845B6C48378406108B0db3172aCC4

📋 사용 가능한 함수: 
1. grantManager - 매니저 권한 부여 (onlyOwner)
2. revokeManager - 매니저 권한 회수 (onlyOwner)
3. isManager - 매니저 권한 확인
4. setValidUser - 유효한 사용자 설정 (onlyOwner)
5. isValidUser - 유효한 사용자 확인
6. setExchangeRate - 교환비율 설정 (onlyOwner)
7. getExchangeRate - 교환비율 조회
8. pause - 시스템 일시정지 (onlyOwner)
9. unpause - 시스템 재개 (onlyOwner)
10. 종료
실행할 함수를 선택하세요 (1-10):  
```

### 8. 매니저 등록 확인

이후 `3번(isManager)`을 선택하여 매니저 계정의 등록 여부를 확인합니다.
