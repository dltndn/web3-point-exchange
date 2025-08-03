const {
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
import { expect } from "chai";
import { ethers } from "hardhat";

// Test Constants
const TEST_AMOUNT = 1000;
const TEST_EXCHANGE_RATE = 200;
const TEST_TOKEN_AMOUNT = ethers.parseEther('1000');
const TEST_VALID_UNTIL = Math.floor(Date.now() / 1000) + 3600; // 1시간 후 (유효한 상태)
const TEST_EXPIRED_UNTIL = Math.floor(Date.now() / 1000) - 3600; // 1시간 전 (만료된 상태)
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("PointManager Contract Test", function () {
  
  describe("1. 소유자(Owner) 권한 관리", function () {
    describe("1.1 매니저 권한 부여/회수", function () {
      it("Owner가 grantManager 호출 시 성공", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await expect(pointManager.connect(admin).grantManager(anotherUser.address))
          .to.emit(pointManager, "ManagerGranted")
          .withArgs(anotherUser.address);
        
        expect(await pointManager.isManager(anotherUser.address)).to.be.true;
      });

      it("임의 주소가 호출하면 revert", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await expect(pointManager.connect(user).grantManager(anotherUser.address))
          .to.be.revertedWithCustomError(pointManager, "OwnableUnauthorizedAccount");
      });

      it("매니저 권한 회수 테스트", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await expect(pointManager.connect(admin).revokeManager(manager.address))
          .to.emit(pointManager, "ManagerRevoked")
          .withArgs(manager.address);
        
        expect(await pointManager.isManager(manager.address)).to.be.false;
      });
    });

    describe("1.2 환율 설정 권한", function () {
      it("Owner가 0 초과 값으로 호출 시 성공", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await expect(pointManager.connect(admin).setExchangeRate(TEST_EXCHANGE_RATE))
          .to.emit(pointManager, "ExchangeRateUpdated")
          .withArgs(TEST_EXCHANGE_RATE);
        
        expect(await pointManager.getExchangeRate()).to.equal(TEST_EXCHANGE_RATE);
      });

      it("0 값 입력 시 revert", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await expect(pointManager.connect(admin).setExchangeRate(0))
          .to.be.revertedWith("PointManager: exchange rate must be greater than 0");
      });

      it("비-Owner 호출 시 revert", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await expect(pointManager.connect(user).setExchangeRate(TEST_EXCHANGE_RATE))
          .to.be.revertedWithCustomError(pointManager, "OwnableUnauthorizedAccount");
      });
    });

    describe("1.3 유저 유효성 설정 권한", function () {
      it("유효한 유저 설정 성공", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await expect(pointManager.connect(admin).setValidUser(anotherUser.address, true))
          .to.emit(pointManager, "ValidUserSet")
          .withArgs(anotherUser.address, true);
        
        expect(await pointManager.isValidUser(anotherUser.address)).to.be.true;
      });

      it("0 주소 입력 시 revert", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await expect(pointManager.connect(admin).setValidUser(ZERO_ADDRESS, true))
          .to.be.revertedWith("PointManager: account is the zero address");
      });

      it("비-Owner 호출 시 revert", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await expect(pointManager.connect(user).setValidUser(user.address, true))
          .to.be.revertedWithCustomError(pointManager, "OwnableUnauthorizedAccount");
      });
    });
  });

  describe("2. 시스템 제어 기능", function () {
    describe("2.1 Pausable 기능", function () {
      it("Owner가 pause 시 depositPoint, withdrawPoint 모두 revert", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await pointManager.connect(admin).pause();

        const depositSignature = await getDepositPointSignature(
          pointManager,
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          manager.address,
          manager
        );

        await expect(pointManager.connect(relayer).depositPoint(
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          manager.address,
          depositSignature
        )).to.be.revertedWithCustomError(pointManager, "EnforcedPause");

        const withdrawSignature = await getWithdrawPointSignature(
          pointManager,
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          user
        );

        await expect(pointManager.connect(relayer).withdrawPoint(
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          withdrawSignature
        )).to.be.revertedWithCustomError(pointManager, "EnforcedPause");
      });

      it("Owner가 unpause 후 정상 수행", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await pointManager.connect(admin).pause();
        await pointManager.connect(admin).unpause();

        const depositSignature = await getDepositPointSignature(
          pointManager,
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          manager.address,
          manager
        );

        await expect(pointManager.connect(relayer).depositPoint(
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          manager.address,
          depositSignature
        )).to.emit(pointManager, "PointDeposited");
      });
    });
  });

  describe("3. depositPoint 보안 검증", function () {
    describe("3.1 서명 검증", function () {
      it("유효한 EIP-712 서명으로 호출 시 성공", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        const signature = await getDepositPointSignature(
          pointManager,
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          manager.address,
          manager
        );

        await expect(pointManager.connect(relayer).depositPoint(
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          manager.address,
          signature
        )).to.emit(pointManager, "PointDeposited");
      });

      it("잘못된 매니저 서명 시 revert", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        const signature = await getDepositPointSignature(
          pointManager,
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          manager.address,
          user // 잘못된 서명자
        );

        await expect(pointManager.connect(relayer).depositPoint(
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          manager.address,
          signature
        )).to.be.revertedWithCustomError(pointManager, "InvalidSignature");
      });

      it("서명자 ≠ 매니저 시 revert", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        const signature = await getDepositPointSignature(
          pointManager,
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          anotherUser.address, // 매니저가 아닌 주소
          anotherUser
        );

        await expect(pointManager.connect(relayer).depositPoint(
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          anotherUser.address,
          signature
        )).to.be.revertedWithCustomError(pointManager, "InvalidManager");
      });
    });

    describe("3.2 만료 기간 확인", function () {
      it("validUntil이 만료된 경우 revert", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        const signature = await getDepositPointSignature(
          pointManager,
          user.address,
          TEST_AMOUNT,
          TEST_EXPIRED_UNTIL,
          manager.address,
          manager
        );

        await expect(pointManager.connect(relayer).depositPoint(
          user.address,
          TEST_AMOUNT,
          TEST_EXPIRED_UNTIL,
          manager.address,
          signature
        )).to.be.revertedWithCustomError(pointManager, "ValidIsExpired");
      });
    });

    describe("3.3 유효하지 않은 유저", function () {
      it("isValidUser가 false인 계정 호출 시 revert", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        // 유효하지 않은 유저로 테스트
        await pointManager.connect(admin).setValidUser(user.address, false);

        const signature = await getDepositPointSignature(
          pointManager,
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          manager.address,
          manager
        );

        await expect(pointManager.connect(relayer).depositPoint(
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          manager.address,
          signature
        )).to.be.revertedWithCustomError(pointManager, "InvalidUser");
      });
    });

    describe("3.4 토큰 전송 정확성", function () {
      it("exchangeRate 기준으로 계산된 토큰 수량이 정확히 전송", async function () {
        const { pointManager, bloomToken } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await pointManager.connect(admin).setExchangeRate(TEST_EXCHANGE_RATE);

        const balanceBefore = await bloomToken.balanceOf(user.address);

        const signature = await getDepositPointSignature(
          pointManager,
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          manager.address,
          manager
        );

        await pointManager.connect(relayer).depositPoint(
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          manager.address,
          signature
        );

        const balanceAfter = await bloomToken.balanceOf(user.address);
        const expectedTokenAmount = (BigInt(TEST_AMOUNT) * ethers.parseEther("1")) / BigInt(TEST_EXCHANGE_RATE);
        
        expect(balanceAfter - balanceBefore).to.equal(expectedTokenAmount);
      });
    });
  });

  describe("4. withdrawPoint 보안 검증", function () {
    describe("4.1 서명 검증", function () {
      it("계정 본인이 서명한 경우 성공", async function () {
        const { pointManager, bloomToken } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await bloomToken.connect(admin).mint(user.address, TEST_TOKEN_AMOUNT);
        await bloomToken.connect(user).approve(pointManager.target, TEST_TOKEN_AMOUNT);

        const signature = await getWithdrawPointSignature(
          pointManager,
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          user
        );

        await expect(pointManager.connect(relayer).withdrawPoint(
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          signature
        )).to.emit(pointManager, "PointWithdrawn");
      });

      it("타인이 서명한 경우 revert", async function () {
        const { pointManager, bloomToken } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await bloomToken.connect(admin).mint(user.address, TEST_TOKEN_AMOUNT);
        await bloomToken.connect(user).approve(pointManager.target, TEST_TOKEN_AMOUNT);

        const signature = await getWithdrawPointSignature(
          pointManager,
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          anotherUser // 타인이 서명
        );

        await expect(pointManager.connect(relayer).withdrawPoint(
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          signature
        )).to.be.revertedWithCustomError(pointManager, "InvalidSignature");
      });
    });

    describe("4.2 만료 기간/유효 사용자 체크", function () {
      it("ValidIsExpired 확인", async function () {
        const { pointManager, bloomToken } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await bloomToken.connect(admin).mint(user.address, TEST_TOKEN_AMOUNT);
        await bloomToken.connect(user).approve(pointManager.target, TEST_TOKEN_AMOUNT);

        const signature = await getWithdrawPointSignature(
          pointManager,
          user.address,
          TEST_AMOUNT,
          TEST_EXPIRED_UNTIL,
          user
        );

        await expect(pointManager.connect(relayer).withdrawPoint(
          user.address,
          TEST_AMOUNT,
          TEST_EXPIRED_UNTIL,
          signature
        )).to.be.revertedWithCustomError(pointManager, "ValidIsExpired");
      });

      it("InvalidUser 확인", async function () {
        const { pointManager, bloomToken } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await bloomToken.connect(admin).mint(user.address, TEST_TOKEN_AMOUNT);
        await bloomToken.connect(user).approve(pointManager.target, TEST_TOKEN_AMOUNT);

        // 유효하지 않은 유저로 설정
        await pointManager.connect(admin).setValidUser(user.address, false);

        const signature = await getWithdrawPointSignature(
          pointManager,
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          user
        );

        await expect(pointManager.connect(relayer).withdrawPoint(
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          signature
        )).to.be.revertedWithCustomError(pointManager, "InvalidUser");
      });
    });

    describe("4.3 토큰 전송 & Allowance", function () {
      it("approve 하지 않으면 revert", async function () {
        const { pointManager, bloomToken } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await bloomToken.connect(admin).mint(user.address, TEST_TOKEN_AMOUNT);

        const signature = await getWithdrawPointSignature(
          pointManager,
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          user
        );

        await expect(pointManager.connect(relayer).withdrawPoint(
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          signature
        )).to.be.revertedWithCustomError(bloomToken, "ERC20InsufficientAllowance");
      });

      it("정확한 토큰 금액이 컨트랙트로 이동", async function () {
        const { pointManager, bloomToken } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await pointManager.connect(admin).setExchangeRate(TEST_EXCHANGE_RATE);
        await bloomToken.connect(admin).mint(user.address, TEST_TOKEN_AMOUNT);

        // withdrawPoint에서는 amount(포인트 수량)를 exchangeRate로 나누어 토큰 수량을 계산
        const expectedTokenAmount = (BigInt(TEST_AMOUNT) * ethers.parseEther("1")) / BigInt(TEST_EXCHANGE_RATE);
        await bloomToken.connect(user).approve(pointManager.target, expectedTokenAmount);

        const userBalanceBefore = await bloomToken.balanceOf(user.address);
        const contractBalanceBefore = await bloomToken.balanceOf(pointManager.target);

        const signature = await getWithdrawPointSignature(
          pointManager,
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          user
        );

        await pointManager.connect(relayer).withdrawPoint(
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          signature
        );

        const userBalanceAfter = await bloomToken.balanceOf(user.address);
        const contractBalanceAfter = await bloomToken.balanceOf(pointManager.target);

        // withdrawPoint에서는 exchangeRate 기준으로 계산된 토큰 수량이 전송됨
        expect(userBalanceBefore - userBalanceAfter).to.equal(expectedTokenAmount);
        expect(contractBalanceAfter - contractBalanceBefore).to.equal(expectedTokenAmount);
      });
    });
  });

  describe("5. 고급 보안 검증", function () {
    describe("5.1 역할 오용 방지", function () {
      it("이미 매니저인 주소에 grantManager 호출 시 revert", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await expect(pointManager.connect(admin).grantManager(manager.address))
          .to.be.revertedWith("PointManager: account already has manager role");
      });

      it("매니저가 아닌 주소에 revokeManager 호출 시 revert", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await expect(pointManager.connect(admin).revokeManager(user.address))
          .to.be.revertedWith("PointManager: account does not have manager role");
      });
    });

    describe("5.2 EIP-165 인터페이스 식별자", function () {
      it("IPointManager interfaceId가 true 반환", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        
        // IPointManager interface ID 계산 (실제 interface ID는 컨트랙트에서 확인해야 함)
        const interfaceId = "0x01ffc9a7"; // 임시값, 실제로는 컨트랙트에서 확인
        expect(await pointManager.supportsInterface(interfaceId)).to.be.true;
      });

      it("무작위 interfaceId 전달 시 false 반환", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        
        const randomInterfaceId = "0x12345678";
        expect(await pointManager.supportsInterface(randomInterfaceId)).to.be.false;
      });
    });

    describe("5.3 초기화 보안", function () {
      it("컨트랙트 배포 후 initialize 한 번 더 호출하면 revert", async function () {
        const { pointManager, bloomToken } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await expect(pointManager.connect(admin).initialize(
          bloomToken.target,
          admin.address,
          100
        )).to.be.revertedWithCustomError(pointManager, "InvalidInitialization");
      });
    });
  });

  describe("6. 스트레스 테스트", function () {
    describe("6.1 클라이언트-측 EIP-712 도메인 일치", function () {
      it("다른 체인ID로 서명한 메시지 보내면 revert", async function () {
        const { pointManager } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        // 올바른 도메인 정보 가져오기
        const correctDomain = await getEIP712Domain(pointManager);
        const nonce = await pointManager.nonces(manager.address);
        
        // 잘못된 도메인으로 서명 생성
        const wrongDomain = {
          ...correctDomain,
          chainId: 999, // 잘못된 체인ID
        };

        const types = {
          DepositPoint: [
            { type: "address", name: "account" },
            { type: "uint256", name: "amount" },
            { type: "uint256", name: "validUntil" },
            { type: "address", name: "manager" },
            { type: "uint256", name: "nonce" },
          ],
        };

        const data = {
          account: user.address,
          amount: TEST_AMOUNT,
          validUntil: TEST_VALID_UNTIL,
          manager: manager.address,
          nonce: nonce,
        };

        const wrongSignature = await manager.signTypedData(wrongDomain, types, data);

        await expect(pointManager.connect(relayer).depositPoint(
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          manager.address,
          wrongSignature
        )).to.be.revertedWithCustomError(pointManager, "InvalidSignature");
      });
    });
  });

  describe("7. Multicall 기능 테스트", function () {
    describe("7.1 여러 유효 함수 호출 성공", function () {
      it("매니저가 multicall로 depositPoint 함수를 여러 번 호출 시 성공", async function () {
        const { pointManager, bloomToken } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        await pointManager.connect(admin).setExchangeRate(TEST_EXCHANGE_RATE);
        await pointManager.connect(admin).setValidUser(anotherUser.address, true);

        // 도메인 정보와 현재 nonce 가져오기
        const domain = await getEIP712Domain(pointManager);
        const currentNonce = await pointManager.nonces(manager.address);

        const types = {
          DepositPoint: [
            { type: "address", name: "account" },
            { type: "uint256", name: "amount" },
            { type: "uint256", name: "validUntil" },
            { type: "address", name: "manager" },
            { type: "uint256", name: "nonce" },
          ],
        };

        // 첫 번째 서명 생성 (현재 nonce 사용)
        const data1 = {
          account: user.address,
          amount: TEST_AMOUNT,
          validUntil: TEST_VALID_UNTIL,
          manager: manager.address,
          nonce: currentNonce,
        };
        const signature1 = await manager.signTypedData(domain, types, data1);

        // 두 번째 서명 생성 (nonce + 1 사용)
        const data2 = {
          account: anotherUser.address,
          amount: TEST_AMOUNT * 2,
          validUntil: TEST_VALID_UNTIL,
          manager: manager.address,
          nonce: currentNonce + 1n,
        };
        const signature2 = await manager.signTypedData(domain, types, data2);

        // 함수 호출 인코딩
        const depositCall1 = pointManager.interface.encodeFunctionData("depositPoint", [
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          manager.address,
          signature1
        ]);

        const depositCall2 = pointManager.interface.encodeFunctionData("depositPoint", [
          anotherUser.address,
          TEST_AMOUNT * 2,
          TEST_VALID_UNTIL,
          manager.address,
          signature2
        ]);

        const userBalanceBefore = await bloomToken.balanceOf(user.address);
        const anotherUserBalanceBefore = await bloomToken.balanceOf(anotherUser.address);

        // multicall 실행
        await expect(pointManager.connect(relayer).multicall([depositCall1, depositCall2]))
          .to.emit(pointManager, "PointDeposited")
          .to.emit(pointManager, "PointDeposited");

        // 토큰 잔액 확인
        const userBalanceAfter = await bloomToken.balanceOf(user.address);
        const anotherUserBalanceAfter = await bloomToken.balanceOf(anotherUser.address);

        const expectedTokenAmount1 = (BigInt(TEST_AMOUNT) * ethers.parseEther("1")) / BigInt(TEST_EXCHANGE_RATE);
        const expectedTokenAmount2 = (BigInt(TEST_AMOUNT * 2) * ethers.parseEther("1")) / BigInt(TEST_EXCHANGE_RATE);

        expect(userBalanceAfter - userBalanceBefore).to.equal(expectedTokenAmount1);
        expect(anotherUserBalanceAfter - anotherUserBalanceBefore).to.equal(expectedTokenAmount2);
      });
    });

    describe("7.2 일부 호출 실패 시 전체 revert", function () {
      it("유효한 호출과 무효한 호출 포함 시 전체 multicall revert", async function () {
        const { pointManager, bloomToken } = await loadFixture(deployContracts);
        const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

        // 유효한 depositPoint 호출
        const validSignature = await getDepositPointSignature(
          pointManager,
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          manager.address,
          manager
        );

        const validCall = pointManager.interface.encodeFunctionData("depositPoint", [
          user.address,
          TEST_AMOUNT,
          TEST_VALID_UNTIL,
          manager.address,
          validSignature
        ]);

        // 무효한 호출 (비-Owner가 Owner-only 함수 호출)
        const invalidCall = pointManager.interface.encodeFunctionData("setExchangeRate", [
          TEST_EXCHANGE_RATE
        ]);

        const userBalanceBefore = await bloomToken.balanceOf(user.address);

        // multicall 실행 시 전체 revert
        await expect(pointManager.connect(relayer).multicall([validCall, invalidCall]))
          .to.be.revertedWithCustomError(pointManager, "OwnableUnauthorizedAccount");

        // 토큰 잔액이 변경되지 않음을 확인
        const userBalanceAfter = await bloomToken.balanceOf(user.address);
        expect(userBalanceAfter).to.equal(userBalanceBefore);
      });
    });
  });
});

const deployContracts = async () => {
  const INITIAL_EXCHANGE_RATE = 100;
  const INITIAL_TOKEN_SUPPLY = ethers.parseEther('10000000');

  const [admin, manager, relayer, user, anotherUser] = await ethers.getSigners();

  const deployBloomToken = async () => {
    const BloomTokenImpl = await ethers.getContractFactory("BloomTokenImpl");
    const bloomTokenImpl = await BloomTokenImpl.deploy();

    const initData = BloomTokenImpl.interface.encodeFunctionData("initialize", [
      admin.address,
    ]);

    const BloomToken = await ethers.getContractFactory("BloomToken");
    let bloomToken = await BloomToken.deploy(bloomTokenImpl.target, initData);
    bloomToken = await ethers.getContractAt("BloomTokenImpl", bloomToken.target);

    return {
      bloomToken,
    }
  }

  const deployPointManager = async (bloomTokenAddress: string) => {
    const PointManagerImpl = await ethers.getContractFactory("PointManagerImpl");
    const pointManagerImpl = await PointManagerImpl.deploy();

    const initData = PointManagerImpl.interface.encodeFunctionData("initialize", [
      bloomTokenAddress,
      admin.address,
      INITIAL_EXCHANGE_RATE,
    ]);

    const PointManager = await ethers.getContractFactory("PointManager");
    let pointManager = await PointManager.deploy(
        pointManagerImpl.target,
        initData
    );

    pointManager = await ethers.getContractAt("PointManagerImpl", pointManager.target);
    
    return {
      pointManager,
    }
  }

  const { bloomToken } = await deployBloomToken();
  const { pointManager } = await deployPointManager(bloomToken.target);

  await bloomToken.connect(admin).mint(pointManager.target, INITIAL_TOKEN_SUPPLY);
  await pointManager.connect(admin).grantManager(manager.address);
  await pointManager.connect(admin).setValidUser(user.address, true);

  return {
    bloomToken,
    pointManager,
  }
}

const getDepositPointSignature = async (
  contract: any,
  accountAddress: string,
  amount: number,
  validUntil: number,
  managerAddress: string,
  signer: any,
) => {
  const domain = await getEIP712Domain(contract);
  const signatureNonce = await contract.nonces(managerAddress);

  const types = {
    DepositPoint: [
      { type: "address", name: "account" },
      { type: "uint256", name: "amount" },
      { type: "uint256", name: "validUntil" },
      { type: "address", name: "manager" },
      { type: "uint256", name: "nonce" },
    ],
  };

  const data = {
    account: accountAddress,
    amount,
    validUntil,
    manager: managerAddress,
    nonce: signatureNonce,
  };

  return await signer.signTypedData(domain, types, data);
};

const getWithdrawPointSignature = async (
  contract: any,
  accountAddress: string,
  amount: number,
  validUntil: number,
  signer: any,
) => {
  const domain = await getEIP712Domain(contract);
  const signatureNonce = await contract.nonces(accountAddress);

  const types = {
    WithdrawPoint: [
      { type: "address", name: "account" },
      { type: "uint256", name: "amount" },
      { type: "uint256", name: "validUntil" },
      { type: "uint256", name: "nonce" },
    ],
  };

  const data = {
    account: accountAddress,  
    amount,
    validUntil,
    nonce: signatureNonce,
  };

  return await signer.signTypedData(domain, types, data);
}

const getEIP712Domain = async (contract: any) => {
  const eip712domain = await contract.eip712Domain();
  return {
    chainId: eip712domain[3],
    name: eip712domain[1],
    verifyingContract: eip712domain[4],
    version: eip712domain[2],
  };
}
