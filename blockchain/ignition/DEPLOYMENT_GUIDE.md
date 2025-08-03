# 컨트랙트 배포 가이드

이 가이드는 Hardhat Ignition을 사용하여 BloomToken과 PointManager 컨트랙트를 배포하는 방법을 설명합니다.

## 📋 사전 준비사항

1. **Node.js 설치** (v16 이상)
2. **Hardhat 프로젝트 설정**
3. **환경 변수 설정**
   ```bash
   # .env 파일 생성
   PRIVATE_KEY=your_private_key_here
   BASE_SEPOLIA_URL=your_base_sepolia_node_url_here
   BASESCAN_API_KEY=your_basescan_api_key_here
   ```

## 🚀 배포 단계

### 1. Base Sepolia 네트워크 배포

#### 1.1 BloomToken 배포
```bash
npx hardhat ignition deploy ignition/modules/BloomToken.ts \
  --network baseSepolia \
  --verify
```

#### 1.2 PointManager 배포
```bash
npx hardhat ignition deploy ignition/modules/PointManager.ts \
  --network baseSepolia \
  --parameters '{
    "PointManagerModule": {"initialExchangeRate": 100}
  }' \
  --verify
```

## 📝 파라미터 설명

### BloomTokenModule 파라미터
현재 모듈은 배포 트랜잭션을 보낸 **기본 계정(0번)** 을 자동으로 `owner` 로 설정하므로 별도 파라미터가 필요 없습니다.

### PointManagerModule 파라미터
현재 모듈은 배포 트랜잭션을 보낸 **기본 계정(0번)** 을 자동으로 `owner` 로 설정하므로 `owner` 파라미터가 필요 없습니다.
- `initialExchangeRate`: 초기 포인트-토큰 교환비율 (기본값: 100)

## 🔧 배포 후 초기 설정

### 1. BloomToken 초기 설정
```bash
# 토큰 민팅 (PointManager에게 초기 공급량 제공)
npx hardhat run scripts/bloomToken.ts --network <network_name>
```

### 2. PointManager 초기 설정
```bash
# 매니저 권한 부여 및 유효 사용자 설정
npx hardhat run scripts/pointManager.ts --network <network_name>
```

## 📁 배포 결과 확인

배포가 완료되면 다음 위치에서 배포 정보를 확인할 수 있습니다:

```
ignition/deployments/
├── chain-84532/          # Base Sepolia 배포 정보
```

각 폴더에는 다음 파일들이 생성됩니다:
- `deployed_addresses.json`: 배포된 컨트랙트 주소
- `journal.jsonl`: 배포 과정 로그
- `artifacts/`: 컨트랙트 아티팩트

## 🔍 배포 검증

### 1. 컨트랙트 주소 확인
```bash
cat ignition/deployments/chain-<chain_id>/deployed_addresses.json
```

### 2. Base Sepolia scan 검증 확인
- `--verify` 플래그를 사용했다면 자동으로 Base Sepolia 네트워크에서 검증됩니다
- 수동 검증이 필요한 경우:
```bash
npx hardhat verify --network <network_name> <contract_address> <constructor_args>
```

## ⚠️ 주의사항

1. **Private Key 보안**: 실제 배포 시 private key를 안전하게 관리하세요
2. **Gas Fee**: 메인넷 배포 시 충분한 ETH가 있는지 확인하세요
3. **Owner 주소**: 배포 후 owner 주소를 multisig 지갑으로 변경하는 것을 권장합니다
4. **테스트**: 메인넷 배포 전 테스트넷에서 충분히 테스트하세요

## 🆘 문제 해결

### 배포 실패 시
```bash
# 배포 상태 확인
npx hardhat ignition status ignition/modules/PointManager.ts --network <network_name>

# 배포 재시도 (중단된 지점부터 재개)
npx hardhat ignition deploy ignition/modules/PointManager.ts --network <network_name> --resume
```

### 배포 초기화
```bash
# 배포 데이터 삭제 후 처음부터 다시 배포
rm -rf ignition/deployments/chain-<chain_id>
```
