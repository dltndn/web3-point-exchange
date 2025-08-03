'use client';

import { useState } from 'react';
import { useSwap } from '../hooks/useSwap';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { useUser } from '../hooks/useUser';
import SwapExecuteButton from './SwapExecuteButton';

export default function TokenToPointForm() {
  const [amount, setAmount] = useState<string>('');
  const { withdrawPoints, isLoading, error } = useSwap();
  const { tokenBalance } = useTokenBalance();
  const { userData } = useUser();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 숫자만 입력 가능하도록 제한
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData?.userPointId) {
      alert('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    const pointAmount = parseInt(amount);
    if (pointAmount <= 0) {
      alert('올바른 포인트 수량을 입력해주세요.');
      return;
    }

    if (pointAmount % 100 !== 0) {
      alert('포인트는 100 단위로만 교환 가능합니다.');
      return;
    }

    const tokenAmount = pointAmount / 100;
    if (tokenBalance && tokenAmount > parseFloat(tokenBalance.formatted)) {
      alert('보유 토큰이 부족합니다.');
      return;
    }

    await withdrawPoints(userData.userId, pointAmount);
  };

  const calculateTokenAmount = () => {
    const pointAmount = parseInt(amount);
    if (isNaN(pointAmount) || pointAmount <= 0) return 0;
    return pointAmount / 100;
  };

  const isFormValid = () => {
    const pointAmount = parseInt(amount);
    const tokenAmount = pointAmount / 100;
    return (
      pointAmount > 0 &&
      pointAmount % 100 === 0 &&
      tokenBalance &&
      tokenAmount <= parseFloat(tokenBalance.formatted)
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
        토큰 → 포인트 교환
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tokenAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            교환할 포인트 수량
          </label>
          <div className="relative">
            <input
              id="tokenAmount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="100"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isLoading}
            />
            <span className="absolute right-3 top-2 text-gray-500 dark:text-gray-400">Points</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            * 100 포인트 단위로만 교환 가능합니다. (EIP712 서명 필요)
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md border border-gray-200 dark:border-gray-600">          
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">필요 토큰:</span>
            <span className="text-sm font-semibold text-red-600 dark:text-red-400">
              {calculateTokenAmount()} BloomToken
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">받을 포인트:</span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {amount || '0'} Points
            </span>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <span className="font-semibold">주의:</span> 이 교환은 EIP712 서명이 필요합니다. 
            토큰 허용량(allowance)이 부족한 경우 Permit 서명도 함께 요청됩니다.
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            교환 비율: 1 BloomToken = 100 Points
          </p>
          
          <SwapExecuteButton
            type="withdraw"
            disabled={!isFormValid() || isLoading}
            loading={isLoading}
            onClick={() => {}}
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
      </form>
    </div>
  );
}
