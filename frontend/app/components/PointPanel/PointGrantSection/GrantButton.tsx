'use client';

import { useEffect } from 'react';
import type { GrantOption, PointActionState } from '../../hooks/usePoint';

interface GrantButtonProps {
  selectedOption: GrantOption | null;
  status: PointActionState;
  onGrant: (option: GrantOption) => void;
  onResetStatus: () => void;
}

export default function GrantButton({
  selectedOption,
  status,
  onGrant,
  onResetStatus
}: GrantButtonProps) {
  // 성공 상태를 3초 후 자동으로 리셋
  useEffect(() => {
    if (status.success) {
      const timer = setTimeout(() => {
        onResetStatus();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status.success, onResetStatus]);

  const handleGrant = () => {
    if (selectedOption && !status.isLoading) {
      onGrant(selectedOption);
    }
  };

  const isDisabled = !selectedOption || status.isLoading;

  // 상태에 따른 버튼 텍스트
  const getButtonText = () => {
    if (status.isLoading) return '지급 중...';
    if (status.success) return '지급 완료!';
    if (status.error) return '다시 시도';
    if (!selectedOption) return '옵션을 선택하세요';
    return `${selectedOption.name} 포인트 지급`;
  };

  // 상태에 따른 버튼 스타일
  const getButtonStyle = () => {
    if (status.success) {
      return 'bg-green-600 hover:bg-green-700 text-white border-green-600';
    }
    if (status.error) {
      return 'bg-red-600 hover:bg-red-700 text-white border-red-600';
    }
    if (isDisabled) {
      return 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed';
    }
    return 'bg-green-600 hover:bg-green-700 text-white border-green-600 hover:shadow-lg';
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleGrant}
        disabled={isDisabled}
        className={`
          w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 border-2
          ${getButtonStyle()}
          ${status.isLoading ? 'cursor-wait' : ''}
        `}
      >
        <div className="flex items-center justify-center space-x-2">
          {status.isLoading && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          )}
          {status.success && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {status.error && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span>{getButtonText()}</span>
        </div>
      </button>

      {selectedOption && !status.isLoading && !status.success && !status.error && (
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
          <span className="font-medium text-green-600 dark:text-green-400">
            +{selectedOption.amount.toLocaleString()} Points
          </span>
          {' '}가 지급됩니다
        </div>
      )}

      {status.error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">지급 실패</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{status.error}</p>
            </div>
          </div>
        </div>
      )}

      {status.success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-green-800 dark:text-green-200">
              포인트가 성공적으로 지급되었습니다!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
