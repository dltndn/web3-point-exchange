'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import NetworkIndicator from './NetworkIndicator';
import TokenBalanceDisplay from './TokenBalanceDisplay';

export default function Header() {
  return (
    <div>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 로고 및 타이틀 */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BT</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Bloom Token Exchange
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  포인트 ↔ 토큰 교환 테스트
                </p>
              </div>
            </div>

            {/* 우측 상태 표시 및 연결 버튼 */}
            <div className="flex items-center gap-4">
              {/* 네트워크 상태 */}
              <NetworkIndicator />
              
              {/* BloomToken 잔액 */}
              <TokenBalanceDisplay />
              
              {/* 지갑 연결 버튼 */}
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>
      
      {/* 안내 문구 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
        <div className="container mx-auto px-4 py-2">
          <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
            ℹ️ 이 시스템은 EIP712 서명을 사용하여 서버에서 트랜잭션을 처리합니다. 
            계정에 이더리움(ETH)을 보유할 필요가 없습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
