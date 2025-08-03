import { useEffect, useState, useCallback } from 'react';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

export interface TokenBalance {
  balance: string;
  decimals: number;
  formatted: string;
  raw: bigint;
}

export function useTokenBalance() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bloomTokenAddress = process.env.NEXT_PUBLIC_BLOOM_TOKEN_ADDRESS as `0x${string}`;

  // BloomToken 잔액 조회 (수동 조회만 가능)
  const { data: balance, isLoading: balanceLoading, error: balanceError, refetch } = useBalance({
    address,
    token: bloomTokenAddress,
    chainId: baseSepolia.id,
    query: {
      enabled: false, // 자동 조회 비활성화
      staleTime: 30_000, // 30초 간 새로 고침 방지
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    },
  });

  // 토큰 잔액 정보 업데이트
  useEffect(() => {
    if (balance) {
      setTokenBalance({
        balance: balance.value.toString(),
        decimals: balance.decimals,
        formatted: balance.formatted,
        raw: balance.value,
      });
      setError(null);
    } else if (balanceError) {
      setError(balanceError.message || '잔액 조회에 실패했습니다.');
      setTokenBalance(null);
    }
  }, [balance, balanceError]);

  // 잔액 새로고침
  const refreshBalance = useCallback(async () => {
    if (!isConnected || !address) {
      setError('지갑이 연결되지 않았습니다.');
      return;
    }

    if (chainId !== baseSepolia.id) {
      setError('Base Sepolia 네트워크로 전환해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : '잔액 조회에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, chainId, refetch]);

  // Base Sepolia 스캔 URL 생성
  const getExplorerUrl = useCallback((txHash?: string) => {
    const baseUrl = 'https://sepolia.basescan.org';
    
    if (txHash) {
      return `${baseUrl}/tx/${txHash}`;
    }
    
    if (address) {
      return `${baseUrl}/address/${address}`;
    }
    
    return baseUrl;
  }, [address]);

  // 토큰 컨트랙트 스캔 URL
  const getTokenContractUrl = useCallback(() => {
    if (!bloomTokenAddress) return '';
    return `https://sepolia.basescan.org/token/${bloomTokenAddress}`;
  }, [bloomTokenAddress]);

  return {
    tokenBalance,
    isLoading: isLoading || balanceLoading,
    error,
    refreshBalance,
    getExplorerUrl,
    getTokenContractUrl,
    isConnected,
    address,
  };
}
