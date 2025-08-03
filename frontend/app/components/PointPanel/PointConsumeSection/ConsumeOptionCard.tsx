'use client';

import type { ConsumeOption } from '../../hooks/usePoint';

interface ConsumeOptionCardProps {
  option: ConsumeOption;
  isSelected: boolean;
  isDisabled?: boolean;
  onClick: (option: ConsumeOption) => void;
}

export default function ConsumeOptionCard({
  option,
  isSelected,
  isDisabled = false,
  onClick
}: ConsumeOptionCardProps) {
  return (
    <button
      onClick={() => !isDisabled && onClick(option)}
      disabled={isDisabled}
      className={`
        w-full p-4 rounded-lg border-2 transition-all duration-200 text-left
        ${isSelected
          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md'
          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-red-300 dark:hover:border-red-600'
        }
        ${isDisabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-sm'
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className={`font-medium text-lg ${
            isSelected
              ? 'text-red-700 dark:text-red-300'
              : 'text-gray-900 dark:text-white'
          }`}>
            {option.name}
          </h4>
          <p className={`text-sm mt-1 ${
            isSelected
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {option.description}
          </p>
        </div>
        
        <div className="text-right ml-4">
          <div className={`text-xl font-bold ${
            isSelected
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            -{option.amount.toLocaleString()}
          </div>
          <div className={`text-sm ${
            isSelected
              ? 'text-red-500 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            Points
          </div>
        </div>
      </div>
      
      {isSelected && (
        <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-700">
          <div className="flex items-center text-red-600 dark:text-red-400">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">선택됨</span>
          </div>
        </div>
      )}
    </button>
  );
}
