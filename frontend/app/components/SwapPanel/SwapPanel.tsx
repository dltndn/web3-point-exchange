'use client';

import { useState } from 'react';
import PointToTokenForm from './PointToTokenForm';
import TokenToPointForm from './TokenToPointForm';
import SwapStatusAlert from './SwapStatusAlert';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { useUser } from '../hooks/useUser';

export default function SwapPanel() {
  const { tokenBalance, refreshBalance, getTokenContractUrl, isLoading } = useTokenBalance();
  const { userData } = useUser();
  const [hasCheckedBalance, setHasCheckedBalance] = useState(false);

  const handleRefreshBalance = async () => {
    setHasCheckedBalance(true);
    await refreshBalance();
  };

  // 사용자가 로그인되지 않은 경우
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
            교환 기능을 사용하려면 먼저 &apos;유저&apos; 탭에서 사용자를 생성하세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          🔄 포인트 ↔ 토큰 교환
        </h2>
        
        {/* 현재 토큰 잔액 표시 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">BloomToken 잔액</h3>
              <p className="text-sm text-blue-600 dark:text-blue-300">버튼을 클릭하여 잔액을 조회하세요</p>
            </div>
            <div className="text-right">
              {hasCheckedBalance ? (
                <>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">
                    {isLoading ? '조회 중...' : tokenBalance ? parseFloat(tokenBalance.formatted).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">BloomToken</p>
                </>
              ) : (
                <p className="text-lg text-gray-500 dark:text-gray-400">잔액을 조회해주세요</p>
              )}
            </div>
          </div>
          
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleRefreshBalance}
              disabled={isLoading}
              className="text-sm bg-blue-600 dark:bg-blue-700 text-white px-3 py-1 rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '조회 중...' : hasCheckedBalance ? '잔액 새로고침' : '잔액 조회'}
            </button>
            <button
              onClick={() => window.open(getTokenContractUrl(), '_blank')}
              className="text-sm bg-gray-600 dark:bg-gray-700 text-white px-3 py-1 rounded-md hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors"
            >
              토큰 컨트랙트 보기
            </button>
          </div>
        </div>
      </div>

      {/* 교환 폼들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 포인트 → 토큰 */}
        <PointToTokenForm />
        
        {/* 토큰 → 포인트 */}
        <TokenToPointForm />
      </div>

      {/* 교환 정보 */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">교환 정보</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">포인트 → 토큰</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">• 100 Points = 1 BloomToken</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">• 서버에서 자동으로 처리</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">• 가스비 없음</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">토큰 → 포인트</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">• 1 BloomToken = 100 Points</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">• EIP712 서명 필요</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">• 메타마스크 서명 확인</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <span className="font-semibold">참고:</span> 
            모든 교환은 100 포인트 단위로만 가능합니다. 
            토큰 교환 시에는 충분한 토큰 잔액이 있는지 확인해주세요.
          </p>
        </div>
      </div>

      {/* 상태 알림 모달 */}
      <SwapStatusAlert />
    </div>
  );
}
