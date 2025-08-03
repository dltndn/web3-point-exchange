import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSignEIP712 } from './useSignEIP712';
import { createPublicClient, http, parseAbi, parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';

interface SwapState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  lastSwapId?: string;
}

interface SwapHistoryItem {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW';
  amount: number;
  tokenAmount: number;
  timestamp: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  txHash?: string;
}

export function useSwap() {
  const [state, setState] = useState<SwapState>({
    isLoading: false,
    error: null,
    success: false
  });

  const [swapHistory, setSwapHistory] = useState<SwapHistoryItem[]>([]);
  const [eip712Domain, setEip712Domain] = useState<{
    name: string;
    version: string;
    chainId: number;
    verifyingContract: `0x${string}`;
  } | null>(null);
  const [userNonce, setUserNonce] = useState<bigint | null>(null);
  
  const { signEIP712, address } = useSignEIP712();

  const pointManagerAddress = process.env.NEXT_PUBLIC_POINT_MANAGER_ADDRESS as `0x${string}`;

  // Public client 생성 - useMemo로 한 번만 생성
  const publicClient = useMemo(() => {
    return createPublicClient({
      chain: baseSepolia,
      transport: http()
    });
  }, []);

  // 포인트 매니저 컨트랙트 ABI
  const pointManagerAbi = parseAbi([
    'function eip712Domain() view returns (bytes1, string, string, uint256, address, bytes32, uint256[])',
    'function nonces(address) view returns (uint256)'
  ]);

  // ERC20 토큰 컨트랙트 ABI
  const erc20Abi = parseAbi([
    'function allowance(address owner, address spender) view returns (uint256)',
    'function name() view returns (string)',
    'function version() view returns (string)',
    'function nonces(address owner) view returns (uint256)',
    'function DOMAIN_SEPARATOR() view returns (bytes32)',
    'function eip712Domain() view returns (bytes1, string, string, uint256, address, bytes32, uint256[])'
  ]);

  const bloomTokenAddress = process.env.NEXT_PUBLIC_BLOOM_TOKEN_ADDRESS as `0x${string}`;

  // EIP712 도메인과 nonce 조회
  const fetchContractInfo = useCallback(async () => {
    if (!pointManagerAddress || !address) return;

    try {
      // EIP712 도메인 조회
      const domainResult = await publicClient.readContract({
        address: pointManagerAddress,
        abi: pointManagerAbi,
        functionName: 'eip712Domain',
      });

      setEip712Domain({
        name: domainResult[1],
        version: domainResult[2],
        chainId: Number(domainResult[3]),
        verifyingContract: domainResult[4],
      });

      // 사용자 nonce 조회
      const nonceResult = await publicClient.readContract({
        address: pointManagerAddress,
        abi: pointManagerAbi,
        functionName: 'nonces',
        args: [address],
      });

      setUserNonce(nonceResult);
    } catch (error) {
      console.error('컨트랙트 정보 조회 실패:', error);
    }
  }, [pointManagerAddress, address, publicClient]);

  // 컨트랙트 정보 초기 로드
  useEffect(() => {
    fetchContractInfo();
  }, [fetchContractInfo]);

  // 포인트 -> 토큰 교환 (100 Points -> 1 BloomToken)
  const depositPoints = useCallback(async (userId: string, walletAddress: string, amount: number) => {
    if (!userId || !walletAddress || !amount || amount <= 0) {
      setState(prev => ({ ...prev, error: '올바른 포인트 수량을 입력해주세요.' }));
      return;
    }

    if (amount % 100 !== 0) {
      setState(prev => ({ ...prev, error: '포인트는 100 단위로만 교환 가능합니다.' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, success: false }));

    try {
      const response = await fetch('/api/point/v1/user-points/deposit-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          walletAddress,
          amount: amount.toString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '포인트 예치에 실패했습니다.');
      }

      const data = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        success: true, 
        lastSwapId: data.swapId 
      }));

      // 교환 내역 업데이트
      await fetchSwapHistory();
      
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : '예기치 못한 오류가 발생했습니다.' 
      }));
    }
  }, []);

  // 토큰 -> 포인트 교환 (1 BloomToken -> 100 Points)
  const withdrawPoints = useCallback(async (userId: string, amount: number) => {
    if (!userId || !amount || amount <= 0) {
      setState(prev => ({ ...prev, error: '올바른 포인트 수량을 입력해주세요.' }));
      return;
    }

    if (amount % 100 !== 0) {
      setState(prev => ({ ...prev, error: '포인트는 100 단위로만 교환 가능합니다.' }));
      return;
    }

    if (!address) {
      setState(prev => ({ ...prev, error: '지갑이 연결되지 않았습니다.' }));
      return;
    }

    if (!eip712Domain) {
      setState(prev => ({ ...prev, error: '컨트랙트 도메인을 불러올 수 없습니다.' }));
      return;
    }

    if (!bloomTokenAddress) {
      setState(prev => ({ ...prev, error: 'BloomToken 주소를 찾을 수 없습니다.' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, success: false }));

    try {
      // 필요한 토큰 양 계산 (amount는 포인트, 토큰은 1:100 비율)
      const requiredTokenAmount = BigInt(amount) / BigInt(100);
      
      // 현재 allowance 조회
      const currentAllowance: bigint = await publicClient.readContract({
        address: bloomTokenAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, pointManagerAddress],
      });

      let permitData = undefined;

      // allowance가 부족한 경우 permit 서명 요청
      if (currentAllowance < requiredTokenAmount) {
        // BloomToken 컨트랙트의 EIP712 도메인 정보 조회
        const tokenDomainResult = await publicClient.readContract({
          address: bloomTokenAddress,
          abi: erc20Abi,
          functionName: 'eip712Domain',
        });

        const tokenDomain = {
          name: tokenDomainResult[1],
          version: tokenDomainResult[2],
          chainId: Number(tokenDomainResult[3]),
          verifyingContract: tokenDomainResult[4],
        };

        // 토큰 nonce 조회
        const tokenNonce: bigint = await publicClient.readContract({
          address: bloomTokenAddress,
          abi: erc20Abi,
          functionName: 'nonces',
          args: [address],
        });

        // permit용 deadline 설정 (현재 시간 + 10분)
        const deadline = Math.floor(Date.now() / 1000) + 600;
        
        // permit할 양을 10,000,000 ether로 설정
        const permitAmount = parseEther('10000000');

        // permit EIP712 서명 요청
        const permitSignature = await signEIP712({
          domain: tokenDomain,
          types: {
            Permit: [
              { type: "address", name: "owner" },
              { type: "address", name: "spender" },
              { type: "uint256", name: "value" },
              { type: "uint256", name: "nonce" },
              { type: "uint256", name: "deadline" },
            ],
          },
          primaryType: 'Permit',
          message: {
            owner: address,
            spender: pointManagerAddress,
            value: permitAmount,
            nonce: tokenNonce,
            deadline: BigInt(deadline),
          },
        });

        if (!permitSignature) {
          throw new Error('Permit 서명이 취소되었습니다.');
        }

        permitData = {
          owner: address,
          value: permitAmount.toString(),
          deadline: deadline,
          signature: permitSignature,
        };
      }

      // 최신 nonce를 포인트 매니저 컨트랙트에서 직접 조회
      const latestNonce: bigint = await publicClient.readContract({
        address: pointManagerAddress,
        abi: pointManagerAbi,
        functionName: 'nonces',
        args: [address],
      });

      // validUntil 설정 (현재 시간 + 10분)
      const validUntilNumber = Math.floor(Date.now() / 1000) + 600;
      const validUntil = BigInt(validUntilNumber);

      // WithdrawPoint EIP712 서명 요청
      const signature = await signEIP712({
        domain: eip712Domain,
        types: {
          WithdrawPoint: [
            { type: "address", name: "account" },
            { type: "uint256", name: "amount" },
            { type: "uint256", name: "validUntil" },
            { type: "uint256", name: "nonce" },
          ],
        },
        primaryType: 'WithdrawPoint',
        message: {
          account: address,
          amount: BigInt(amount),
          validUntil: BigInt(validUntil),
          nonce: BigInt(latestNonce),
        },
      });

      if (!signature) {
        throw new Error('WithdrawPoint 서명이 취소되었습니다.');
      }

      const requestBody: {
        userId: string;
        walletAddress: string;
        amount: string;
        validUntil: number;
        signature: string;
        permitData?: {
          owner: string;
          value: string;
          deadline: number;
          signature: string;
        };
      } = {
        userId,
        walletAddress: address,
        amount: amount.toString(),
        validUntil: validUntilNumber,
        signature
      };

      // permitData가 있는 경우에만 추가
      if (permitData) {
        requestBody.permitData = permitData;
      }

      const response = await fetch('/api/point/v1/user-points/withdraw-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '포인트 출금에 실패했습니다.');
      }

      const data = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        success: true, 
        lastSwapId: data.swapId 
      }));

      // 교환 내역 업데이트
      await fetchSwapHistory();
      
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : '예기치 못한 오류가 발생했습니다.' 
      }));
    }
  }, [signEIP712, address, eip712Domain, publicClient, pointManagerAddress, pointManagerAbi, bloomTokenAddress, erc20Abi]);

  // 교환 내역 조회
  const fetchSwapHistory = useCallback(async (userPointId?: string) => {
    try {
      const url = userPointId 
        ? `/api/point/v1/user-swap-histories?userPointId=${userPointId}`
        : '/api/point/v1/user-swap-histories';
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('교환 내역을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setSwapHistory(data.histories || []);
    } catch (error) {
      console.error('교환 내역 조회 실패:', error);
    }
  }, []);

  // 상태 초기화
  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      success: false
    });
  }, []);

  return {
    ...state,
    swapHistory,
    depositPoints,
    withdrawPoints,
    fetchSwapHistory,
    resetState,
    eip712Domain,
    userNonce,
  };
}
