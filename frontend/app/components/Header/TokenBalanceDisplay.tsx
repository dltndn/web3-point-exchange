'use client';

import { useAccount, useBalance, useChainId } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { useCallback, useState, useEffect } from 'react';

// BloomToken 계약 주소 (Base Sepolia 기준)
const BLOOM_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_BLOOM_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';

export default function TokenBalanceDisplay() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [isBaseSepolia, setIsBaseSepolia] = useState(false);

  // BloomToken 잔액 조회 (watch 비활성화, 수동 새로고침 가능)
  const { data: tokenBalance, isLoading, error, refetch } = useBalance({
    address,
    token: BLOOM_TOKEN_ADDRESS as `0x${string}`,
    chainId: baseSepolia.id,
    query: {
      enabled: Boolean(isConnected && address),
      staleTime: 30_000,
      gcTime: 30_000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    },
  });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  useEffect(() => {
    setIsBaseSepolia(chainId === baseSepolia.id);
  }, [chainId]);

  const getExplorerLink = () => {
    if (address) {
      return `https://sepolia.basescan.org/address/${address}`;
    }
    return `https://sepolia.basescan.org/token/${BLOOM_TOKEN_ADDRESS}`;
  };

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">BT</span>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          지갑 연결 필요
        </span>
      </div>
    );
  }

  if (!isBaseSepolia) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
        <div className="w-6 h-6 bg-orange-300 dark:bg-orange-600 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-orange-700 dark:text-orange-400">BT</span>
        </div>
        <span className="text-sm text-orange-700 dark:text-orange-400">
          Base Sepolia 전환 필요
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-white">BT</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
            {isLoading || refreshing ? (
              <span className="animate-pulse">로딩...</span>
            ) : error ? (
              <span className="text-red-600 dark:text-red-400">오류</span>
            ) : tokenBalance ? (
              `${Number(tokenBalance.formatted).toFixed(4)} ${tokenBalance.symbol || 'BLOOM'}`
            ) : (
              '0.0000 BLOOM'
            )}
          </span>
          <span className="text-xs text-blue-600 dark:text-blue-500">BloomToken</span>
        </div>
      </div>
      <button onClick={handleRefresh} disabled={refreshing} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
        {refreshing ? '...' : '새로고침'}
      </button>
      
      <a
        href={getExplorerLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Base Sepolia 익스플로러에서 보기"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd"/>
          <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd"/>
        </svg>
      </a>
    </div>
  );
}
