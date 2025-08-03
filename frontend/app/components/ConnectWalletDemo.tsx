'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';

export default function ConnectWalletDemo() {
  const { address, chain, isConnected } = useAccount();
  const { data: balance, isLoading } = useBalance({
    address,
  });

  return (
    <div className="flex flex-col items-center gap-8 p-8 max-w-md mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">RainbowKit 연결 데모</h1>
        <p className="text-gray-600 dark:text-gray-300">
          아래 버튼을 클릭하여 지갑을 연결하세요
        </p>
      </div>

      <ConnectButton />

      {isConnected && (
        <div className="w-full space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold">계정 정보</h2>
          
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">주소:</span>
              <p className="font-mono text-sm break-all">{address}</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">네트워크:</span>
              <p className="font-medium">{chain?.name}</p>
            </div>
            
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">잔액:</span>
              {isLoading ? (
                <p className="text-sm text-gray-500">로딩 중...</p>
              ) : balance ? (
                <p className="font-medium">
                  {Number(balance.formatted).toFixed(4)} {balance.symbol}
                </p>
              ) : (
                <p className="text-sm text-gray-500">잔액 정보 없음</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>지갑을 연결하면 계정 정보가 표시됩니다.</p>
        </div>
      )}
    </div>
  );
} 