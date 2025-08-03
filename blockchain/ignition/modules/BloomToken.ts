// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BloomTokenModule = buildModule("BloomTokenModule", (m) => {
  // 1. BloomTokenImpl 구현체 배포
  const bloomTokenImpl = m.contract("BloomTokenImpl");

  // 2. 초기화 데이터 준비 (initialize 함수 호출용)
  // 배포 트랜잭션을 보내는 기본 계정(0번)이 owner가 되도록 설정
  const owner = m.getAccount(0);
  
  // 3. BloomTokenImpl의 initialize 함수 호출 데이터 인코딩
  const initData = m.encodeFunctionCall(bloomTokenImpl, "initialize", [owner]);

  // 4. BloomToken 프록시(UUPS, ERC1967Proxy) 배포
  const bloomTokenProxy = m.contract("BloomToken", [bloomTokenImpl, initData]);

  // 5. 프록시 주소를 BloomTokenImpl ABI로 캐스팅
  // contractAt에 id를 지정해 자동 생성 id 충돌 방지
  const bloomToken = m.contractAt("BloomTokenImpl", bloomTokenProxy, {
    id: "BloomTokenAtProxy",
  });

  return { 
    bloomTokenProxy,     // 프록시 주소
    bloomToken,          // Impl ABI 인스턴스 (proxy address)
    bloomTokenImpl
  };
});

export default BloomTokenModule;
