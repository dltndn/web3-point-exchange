'use client';

import { useState } from 'react';
import { usePoint } from '../hooks/usePoint';
import { useUser } from '../hooks/useUser';
import CurrentPointDisplay from './CurrentPointDisplay';
import PointHistoryList from './PointHistoryList';
import GrantOptionCard from './PointGrantSection/GrantOptionCard';
import GrantButton from './PointGrantSection/GrantButton';
import ConsumeOptionCard from './PointConsumeSection/ConsumeOptionCard';
import ConsumeButton from './PointConsumeSection/ConsumeButton';
import type { GrantOption, ConsumeOption } from '../hooks/usePoint';

export default function PointPanel() {
  const { userData } = useUser();
  const userPointId = userData?.userPointId;
  
  const {
    pointData,
    grantHistory,
    consumptionHistory,
    isPointLoading,
    isGrantHistoryLoading,
    isConsumptionHistoryLoading,
    grantStatus,
    consumeStatus,
    grantOptions,
    consumeOptions,
    handleGrantPoints,
    handleConsumePoints,
    resetGrantStatus,
    resetConsumeStatus
  } = usePoint(userPointId);

  const [selectedGrantOption, setSelectedGrantOption] = useState<GrantOption | null>(null);
  const [selectedConsumeOption, setSelectedConsumeOption] = useState<ConsumeOption | null>(null);

  // 사용자 정보가 없는 경우
  if (!userData) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-6 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200">
              사용자 정보 필요
            </h2>
          </div>
          <p className="text-yellow-700 dark:text-yellow-300 mt-2">
            포인트 기능을 사용하려면 먼저 &apos;유저&apos; 탭에서 사용자를 생성하세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          🪙 포인트 관리
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 현재 포인트 및 내역 */}
          <div className="space-y-4">
            <CurrentPointDisplay
              balance={pointData?.balance ? parseInt(pointData.balance) : undefined}
              isLoading={isPointLoading}
              error={pointData ? null : '포인트 정보를 불러올 수 없습니다'}
            />
            
            <PointHistoryList
              grantHistory={grantHistory}
              consumptionHistory={consumptionHistory}
              isGrantLoading={isGrantHistoryLoading}
              isConsumptionLoading={isConsumptionHistoryLoading}
            />
          </div>

          {/* 포인트 지급 및 사용 */}
          <div className="space-y-6">
            {/* 포인트 지급 섹션 */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-medium text-green-900 dark:text-green-100 mb-4">
                포인트 지급
              </h3>
              
              <div className="space-y-3">
                {grantOptions.map((option) => (
                  <GrantOptionCard
                    key={option.id}
                    option={option}
                    isSelected={selectedGrantOption?.id === option.id}
                    isDisabled={grantStatus.isLoading}
                    onClick={setSelectedGrantOption}
                  />
                ))}
              </div>
              
              <div className="mt-4">
                <GrantButton
                  selectedOption={selectedGrantOption}
                  status={grantStatus}
                  onGrant={handleGrantPoints}
                  onResetStatus={resetGrantStatus}
                />
              </div>
            </div>

            {/* 포인트 사용 섹션 */}
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <h3 className="font-medium text-red-900 dark:text-red-100 mb-4">
                포인트 사용
              </h3>
              
              <div className="space-y-3">
                {consumeOptions.map((option) => (
                  <ConsumeOptionCard
                    key={option.id}
                    option={option}
                    isSelected={selectedConsumeOption?.id === option.id}
                    isDisabled={consumeStatus.isLoading}
                    onClick={setSelectedConsumeOption}
                  />
                ))}
              </div>
              
              <div className="mt-4">
                <ConsumeButton
                  selectedOption={selectedConsumeOption}
                  status={consumeStatus}
                  onConsume={handleConsumePoints}
                  onResetStatus={resetConsumeStatus}
                  currentBalance={pointData?.balance ? parseInt(pointData.balance) : undefined}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
