// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BloomTokenModule from "./BloomToken";

const PointManagerModule = buildModule("PointManagerModule", (m) => {
  // 1. BloomToken 모듈에서 배포된 토큰 가져오기
  const { bloomTokenProxy, bloomToken } = m.useModule(BloomTokenModule);

  // 2. PointManagerImpl 구현체 배포
  const pointManagerImpl = m.contract("PointManagerImpl");

  // 3. 초기화 파라미터 준비
  const owner               = m.getAccount(0);
  const initialExchangeRate = m.getParameter("initialExchangeRate", 100);

  // 4. initialize 데이터 인코딩 (토큰 = 프록시 주소)
  const initData = m.encodeFunctionCall(pointManagerImpl, "initialize", [
    bloomTokenProxy,
    owner,
    initialExchangeRate
  ]);

  // 5. PointManager 프록시(UUPS) 배포
  const pointManagerProxy = m.contract("PointManager", [pointManagerImpl, initData]);

  // 6. 프록시 주소를 PointManagerImpl ABI로 캐스팅
  // contractAt에 id를 지정해 자동 생성 id 충돌 방지
  const pointManager = m.contractAt("PointManagerImpl", pointManagerProxy, {
    id: "PointManagerAtProxy",
  });

  // 7. 배포 후 초기 설정 ─ 초기 토큰 공급량 민팅
  const initialTokenSupply = m.getParameter(
    "initialTokenSupply",
    "10000000000000000000000000" // 10M wei
  );
  m.call(bloomToken, "mint", [pointManagerProxy, initialTokenSupply]);

  return {
    pointManagerProxy,   // 프록시 주소
    pointManager,        // Impl ABI 인스턴스
    pointManagerImpl,
    bloomToken           // Impl ABI 인스턴스 (토큰)
  };
});

export default PointManagerModule;
