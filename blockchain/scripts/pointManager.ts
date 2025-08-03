import { ethers } from "hardhat";
import * as readline from "readline";

// readline 인터페이스 생성
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 사용자 입력을 받는 함수
function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// 주소 유효성 검사
function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

// 숫자 유효성 검사
function isValidNumber(value: string): boolean {
  return !isNaN(Number(value)) && Number(value) > 0;
}

async function main() {
  console.log("🎯 PointManager 관리 스크립트");
  console.log("================================");
  
  // 배포된 컨트랙트 주소 입력받기
  let pointManagerAddress = process.env.POINT_MANAGER_ADDRESS || "";
  
  if (!pointManagerAddress) {
    pointManagerAddress = await askQuestion("PointManager 프록시 주소를 입력하세요: ");
    if (!isValidAddress(pointManagerAddress)) {
      console.error("❌ 유효하지 않은 주소입니다.");
      process.exit(1);
    }
  }

  // 서명자 가져오기
  const [deployer] = await ethers.getSigners();
  console.log("현재 계정:", deployer.address);

  // PointManager 컨트랙트 연결 (구현체 인터페이스 사용)
  const pointManager = await ethers.getContractAt("PointManagerImpl", pointManagerAddress);

  console.log("PointManager 주소:", await pointManager.getAddress());
  
  try {
    const owner = await pointManager.owner();
    console.log("현재 owner:", owner);
    
    const exchangeRate = await pointManager.getExchangeRate();
    console.log("현재 교환비율:", exchangeRate.toString());
    
    const tokenAddress = await pointManager.getTokenAddress();
    console.log("연결된 토큰 주소:", tokenAddress);
  } catch (error) {
    console.error("❌ 컨트랙트 정보 조회 실패:", error);
    process.exit(1);
  }

  // 메뉴 표시 및 실행
  while (true) {
    console.log("\n📋 사용 가능한 함수:");
    console.log("1. grantManager - 매니저 권한 부여 (onlyOwner)");
    console.log("2. revokeManager - 매니저 권한 회수 (onlyOwner)");
    console.log("3. isManager - 매니저 권한 확인");
    console.log("4. setValidUser - 유효한 사용자 설정 (onlyOwner)");
    console.log("5. isValidUser - 유효한 사용자 확인");
    console.log("6. setExchangeRate - 교환비율 설정 (onlyOwner)");
    console.log("7. getExchangeRate - 교환비율 조회");
    console.log("8. pause - 시스템 일시정지 (onlyOwner)");
    console.log("9. unpause - 시스템 재개 (onlyOwner)");
    console.log("10. 종료");
    
    const choice = await askQuestion("실행할 함수를 선택하세요 (1-10): ");
    
    try {
      switch (choice) {
        case "1":
          await executeGrantManager(pointManager);
          break;
        case "2":
          await executeRevokeManager(pointManager);
          break;
        case "3":
          await executeIsManager(pointManager);
          break;
        case "4":
          await executeSetValidUser(pointManager);
          break;
        case "5":
          await executeIsValidUser(pointManager);
          break;
        case "6":
          await executeSetExchangeRate(pointManager);
          break;
        case "7":
          await executeGetExchangeRate(pointManager);
          break;
        case "8":
          await executePause(pointManager);
          break;
        case "9":
          await executeUnpause(pointManager);
          break;
        case "10":
          console.log("👋 스크립트를 종료합니다.");
          process.exit(0);
        default:
          console.log("❌ 잘못된 선택입니다. 1-10 중에서 선택해주세요.");
      }
    } catch (error) {
      console.error("❌ 함수 실행 중 오류 발생:", error);
    }
  }
}

async function executeGrantManager(pointManager: any) {
  console.log("\n👥 매니저 권한 부여 (grantManager)");
  
  const account = await askQuestion("매니저 권한을 부여할 주소를 입력하세요: ");
  if (!isValidAddress(account)) {
    console.log("❌ 유효하지 않은 주소입니다.");
    return;
  }
  
  // 이미 매니저인지 확인
  const isAlreadyManager = await pointManager.isManager(account);
  if (isAlreadyManager) {
    console.log("⚠️ 이미 매니저 권한을 가진 주소입니다.");
    return;
  }
  
  console.log(`대상 주소: ${account}`);
  
  const confirm = await askQuestion("매니저 권한 부여를 진행하시겠습니까? (y/n): ");
  if (confirm.toLowerCase() !== 'y') {
    console.log("❌ 권한 부여가 취소되었습니다.");
    return;
  }
  
  const tx = await pointManager.grantManager(account);
  console.log("⏳ 트랜잭션 대기 중...");
  await tx.wait();
  
  console.log("✅ 매니저 권한 부여 완료!");
  console.log(`트랜잭션 해시: ${tx.hash}`);
}

async function executeRevokeManager(pointManager: any) {
  console.log("\n❌ 매니저 권한 회수 (revokeManager)");
  
  const account = await askQuestion("매니저 권한을 회수할 주소를 입력하세요: ");
  if (!isValidAddress(account)) {
    console.log("❌ 유효하지 않은 주소입니다.");
    return;
  }
  
  // 매니저인지 확인
  const isManager = await pointManager.isManager(account);
  if (!isManager) {
    console.log("⚠️ 매니저 권한이 없는 주소입니다.");
    return;
  }
  
  console.log(`대상 주소: ${account}`);
  
  const confirm = await askQuestion("매니저 권한 회수를 진행하시겠습니까? (y/n): ");
  if (confirm.toLowerCase() !== 'y') {
    console.log("❌ 권한 회수가 취소되었습니다.");
    return;
  }
  
  const tx = await pointManager.revokeManager(account);
  console.log("⏳ 트랜잭션 대기 중...");
  await tx.wait();
  
  console.log("✅ 매니저 권한 회수 완료!");
  console.log(`트랜잭션 해시: ${tx.hash}`);
}

async function executeIsManager(pointManager: any) {
  console.log("\n🔍 매니저 권한 확인 (isManager)");
  
  const account = await askQuestion("확인할 주소를 입력하세요: ");
  if (!isValidAddress(account)) {
    console.log("❌ 유효하지 않은 주소입니다.");
    return;
  }
  
  const isManager = await pointManager.isManager(account);
  
  console.log(`주소: ${account}`);
  console.log(`매니저 권한: ${isManager ? "✅ 있음" : "❌ 없음"}`);
}

async function executeSetValidUser(pointManager: any) {
  console.log("\n👤 유효한 사용자 설정 (setValidUser)");
  
  const account = await askQuestion("설정할 사용자 주소를 입력하세요: ");
  if (!isValidAddress(account)) {
    console.log("❌ 유효하지 않은 주소입니다.");
    return;
  }
  
  const isValidStr = await askQuestion("유효성을 설정하세요 (true/false): ");
  const isValid = isValidStr.toLowerCase() === 'true';
  
  console.log(`대상 주소: ${account}`);
  console.log(`유효성 설정: ${isValid ? "유효" : "무효"}`);
  
  const confirm = await askQuestion("설정을 진행하시겠습니까? (y/n): ");
  if (confirm.toLowerCase() !== 'y') {
    console.log("❌ 설정이 취소되었습니다.");
    return;
  }
  
  const tx = await pointManager.setValidUser(account, isValid);
  console.log("⏳ 트랜잭션 대기 중...");
  await tx.wait();
  
  console.log("✅ 유효한 사용자 설정 완료!");
  console.log(`트랜잭션 해시: ${tx.hash}`);
}

async function executeIsValidUser(pointManager: any) {
  console.log("\n🔍 유효한 사용자 확인 (isValidUser)");
  
  const account = await askQuestion("확인할 주소를 입력하세요: ");
  if (!isValidAddress(account)) {
    console.log("❌ 유효하지 않은 주소입니다.");
    return;
  }
  
  const isValid = await pointManager.isValidUser(account);
  
  console.log(`주소: ${account}`);
  console.log(`유효성: ${isValid ? "✅ 유효" : "❌ 무효"}`);
}

async function executeSetExchangeRate(pointManager: any) {
  console.log("\n💱 교환비율 설정 (setExchangeRate)");
  
  const currentRate = await pointManager.getExchangeRate();
  console.log(`현재 교환비율: ${currentRate.toString()}`);
  
  const rateStr = await askQuestion("새로운 교환비율을 입력하세요 (1 이상): ");
  if (!isValidNumber(rateStr)) {
    console.log("❌ 유효하지 않은 교환비율입니다.");
    return;
  }
  
  const newRate = Number(rateStr);
  
  console.log(`새로운 교환비율: ${newRate}`);
  
  const confirm = await askQuestion("교환비율 설정을 진행하시겠습니까? (y/n): ");
  if (confirm.toLowerCase() !== 'y') {
    console.log("❌ 설정이 취소되었습니다.");
    return;
  }
  
  const tx = await pointManager.setExchangeRate(newRate);
  console.log("⏳ 트랜잭션 대기 중...");
  await tx.wait();
  
  console.log("✅ 교환비율 설정 완료!");
  console.log(`트랜잭션 해시: ${tx.hash}`);
}

async function executeGetExchangeRate(pointManager: any) {
  console.log("\n📊 교환비율 조회 (getExchangeRate)");
  
  const exchangeRate = await pointManager.getExchangeRate();
  console.log(`현재 교환비율: ${exchangeRate.toString()}`);
}

async function executePause(pointManager: any) {
  console.log("\n⏸️ 시스템 일시정지 (pause)");
  
  console.log("⚠️ 시스템을 일시정지하면 depositPoint와 withdrawPoint 함수가 비활성화됩니다.");
  
  const confirm = await askQuestion("시스템 일시정지를 진행하시겠습니까? (y/n): ");
  if (confirm.toLowerCase() !== 'y') {
    console.log("❌ 일시정지가 취소되었습니다.");
    return;
  }
  
  const tx = await pointManager.pause();
  console.log("⏳ 트랜잭션 대기 중...");
  await tx.wait();
  
  console.log("✅ 시스템 일시정지 완료!");
  console.log(`트랜잭션 해시: ${tx.hash}`);
}

async function executeUnpause(pointManager: any) {
  console.log("\n▶️ 시스템 재개 (unpause)");
  
  const confirm = await askQuestion("시스템 재개를 진행하시겠습니까? (y/n): ");
  if (confirm.toLowerCase() !== 'y') {
    console.log("❌ 재개가 취소되었습니다.");
    return;
  }
  
  const tx = await pointManager.unpause();
  console.log("⏳ 트랜잭션 대기 중...");
  await tx.wait();
  
  console.log("✅ 시스템 재개 완료!");
  console.log(`트랜잭션 해시: ${tx.hash}`);
}

main().catch((error) => {
  console.error("❌ 오류 발생:", error);
  process.exitCode = 1;
}).finally(() => {
  rl.close();
});