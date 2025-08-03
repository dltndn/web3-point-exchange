'use client';

import { useUser } from '../hooks/useUser';
import GrantHistoryList from './GrantHistoryList';
import ConsumptionHistoryList from './ConsumptionHistoryList';
import SwapHistoryList from './SwapHistoryList';

export default function HistoryPanel() {
  const { isUserExists, userData } = useUser();

  if (!isUserExists || !userData) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📜 거래 내역
          </h2>
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              사용자 정보가 없습니다. 먼저 사용자를 생성해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📜 거래 내역
        </h2>
        
        <div className="space-y-6">
          {/* 포인트 지급 내역 */}
          <GrantHistoryList />
          
          {/* 포인트 사용 내역 */}
          <ConsumptionHistoryList />
          
          {/* 교환 내역 */}
          <SwapHistoryList />
        </div>
      </div>
    </div>
  );
}
