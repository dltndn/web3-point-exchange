'use client';

import { useState } from 'react';
import { useSwap } from '../hooks/useSwap';
import { usePoint } from '../hooks/usePoint';
import { useUser } from '../hooks/useUser';
import SwapExecuteButton from './SwapExecuteButton';

export default function PointToTokenForm() {
  const [amount, setAmount] = useState<string>('');
  const { depositPoints, isLoading, error } = useSwap();
  const { userData, walletAddress } = useUser();
  const { pointData } = usePoint(userData?.userPointId);

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

    if (pointData && pointAmount > parseInt(pointData.balance)) {
      alert('보유 포인트가 부족합니다.');
      return;
    }

    await depositPoints(userData.userId, walletAddress || '', pointAmount);
  };

  const calculateTokenAmount = () => {
    const pointAmount = parseInt(amount);
    if (isNaN(pointAmount) || pointAmount <= 0) return 0;
    return pointAmount / 100;
  };

  const isFormValid = () => {
    const pointAmount = parseInt(amount);
    return (
      pointAmount > 0 &&
      pointAmount % 100 === 0 &&
      pointData &&
      pointAmount <= parseInt(pointData.balance)
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
        포인트 → 토큰 교환
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="pointAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            교환할 포인트 수량
          </label>
          <div className="relative">
            <input
              id="pointAmount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="100"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <span className="absolute right-3 top-2 text-gray-500 dark:text-gray-400">Points</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            * 100 포인트 단위로만 교환 가능합니다.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md border border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">보유 포인트:</span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {pointData ? parseInt(pointData.balance).toLocaleString() : '0'} Points
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">받을 토큰:</span>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              {calculateTokenAmount()} BloomToken
            </span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            교환 비율: 100 Points = 1 BloomToken
          </p>
          
          <SwapExecuteButton
            type="deposit"
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
