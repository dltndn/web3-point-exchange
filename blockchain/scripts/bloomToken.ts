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
  return !isNaN(Number(value)) && Number(value) >= 0;
}

async function main() {
  console.log("🌸 BloomToken 관리 스크립트");
  console.log("================================");
  
  // 배포된 컨트랙트 주소 입력받기
  let bloomTokenAddress = process.env.BLOOM_TOKEN_ADDRESS || "";
  
  if (!bloomTokenAddress) {
    bloomTokenAddress = await askQuestion("BloomToken 프록시 주소를 입력하세요: ");
    if (!isValidAddress(bloomTokenAddress)) {
      console.error("❌ 유효하지 않은 주소입니다.");
      process.exit(1);
    }
  }

  // 서명자 가져오기
  const [deployer] = await ethers.getSigners();
  console.log("현재 계정:", deployer.address);

  // BloomToken 컨트랙트 연결 (구현체 인터페이스 사용)
  const bloomToken = await ethers.getContractAt("BloomTokenImpl", bloomTokenAddress);

  console.log("BloomToken 주소:", await bloomToken.getAddress());
  
  try {
    const owner = await bloomToken.owner();
    console.log("현재 owner:", owner);
    
    const name = await bloomToken.name();
    const symbol = await bloomToken.symbol();
    const decimals = await bloomToken.decimals();
    console.log(`토큰 정보: ${name} (${symbol}), 소수점: ${decimals}`);
  } catch (error) {
    console.error("❌ 컨트랙트 정보 조회 실패:", error);
    process.exit(1);
  }

  // 메뉴 표시 및 실행
  while (true) {
    console.log("\n📋 사용 가능한 함수:");
    console.log("1. mint - 토큰 발행 (onlyOwner)");
    console.log("2. transfer - 토큰 전송");
    console.log("3. balanceOf - 잔액 조회");
    console.log("4. totalSupply - 총 공급량 조회");
    console.log("5. 종료");
    
    const choice = await askQuestion("실행할 함수를 선택하세요 (1-5): ");
    
    try {
      switch (choice) {
        case "1":
          await executeMint(bloomToken);
          break;
        case "2":
          await executeTransfer(bloomToken);
          break;
        case "3":
          await executeBalanceOf(bloomToken);
          break;
        case "4":
          await executeTotalSupply(bloomToken);
          break;
        case "5":
          console.log("👋 스크립트를 종료합니다.");
          process.exit(0);
        default:
          console.log("❌ 잘못된 선택입니다. 1-5 중에서 선택해주세요.");
      }
    } catch (error) {
      console.error("❌ 함수 실행 중 오류 발생:", error);
    }
  }
}

async function executeMint(bloomToken: any) {
  console.log("\n🏭 토큰 발행 (mint)");
  
  const to = await askQuestion("발행받을 주소를 입력하세요: ");
  if (!isValidAddress(to)) {
    console.log("❌ 유효하지 않은 주소입니다.");
    return;
  }
  
  const amountStr = await askQuestion("발행할 토큰 수량을 입력하세요 (ETH 단위): ");
  if (!isValidNumber(amountStr)) {
    console.log("❌ 유효하지 않은 수량입니다.");
    return;
  }
  
  const amount = ethers.parseEther(amountStr);
  
  console.log(`발행 대상: ${to}`);
  console.log(`발행 수량: ${amountStr} BLOOM`);
  
  const confirm = await askQuestion("발행을 진행하시겠습니까? (y/n): ");
  if (confirm.toLowerCase() !== 'y') {
    console.log("❌ 발행이 취소되었습니다.");
    return;
  }
  
  const tx = await bloomToken.mint(to, amount);
  console.log("⏳ 트랜잭션 대기 중...");
  await tx.wait();
  
  console.log("✅ 토큰 발행 완료!");
  console.log(`트랜잭션 해시: ${tx.hash}`);
}

async function executeTransfer(bloomToken: any) {
  console.log("\n💸 토큰 전송 (transfer)");
  
  const to = await askQuestion("전송받을 주소를 입력하세요: ");
  if (!isValidAddress(to)) {
    console.log("❌ 유효하지 않은 주소입니다.");
    return;
  }
  
  const amountStr = await askQuestion("전송할 토큰 수량을 입력하세요 (ETH 단위): ");
  if (!isValidNumber(amountStr)) {
    console.log("❌ 유효하지 않은 수량입니다.");
    return;
  }
  
  const amount = ethers.parseEther(amountStr);
  
  console.log(`전송 대상: ${to}`);
  console.log(`전송 수량: ${amountStr} BLOOM`);
  
  const confirm = await askQuestion("전송을 진행하시겠습니까? (y/n): ");
  if (confirm.toLowerCase() !== 'y') {
    console.log("❌ 전송이 취소되었습니다.");
    return;
  }
  
  const tx = await bloomToken.transfer(to, amount);
  console.log("⏳ 트랜잭션 대기 중...");
  await tx.wait();
  
  console.log("✅ 토큰 전송 완료!");
  console.log(`트랜잭션 해시: ${tx.hash}`);
}

async function executeBalanceOf(bloomToken: any) {
  console.log("\n💰 잔액 조회 (balanceOf)");
  
  const address = await askQuestion("조회할 주소를 입력하세요 (엔터: 현재 계정): ");
  
  let targetAddress: string;
  if (address === "") {
    const [deployer] = await ethers.getSigners();
    targetAddress = deployer.address;
  } else {
    if (!isValidAddress(address)) {
      console.log("❌ 유효하지 않은 주소입니다.");
      return;
    }
    targetAddress = address;
  }
  
  const balance = await bloomToken.balanceOf(targetAddress);
  const formattedBalance = ethers.formatEther(balance);
  
  console.log(`주소: ${targetAddress}`);
  console.log(`잔액: ${formattedBalance} BLOOM`);
}

async function executeTotalSupply(bloomToken: any) {
  console.log("\n📊 총 공급량 조회 (totalSupply)");
  
  const totalSupply = await bloomToken.totalSupply();
  const formattedSupply = ethers.formatEther(totalSupply);
  
  console.log(`총 공급량: ${formattedSupply} BLOOM`);
}

main().catch((error) => {
  console.error("❌ 오류 발생:", error);
  process.exitCode = 1;
}).finally(() => {
  rl.close();
});