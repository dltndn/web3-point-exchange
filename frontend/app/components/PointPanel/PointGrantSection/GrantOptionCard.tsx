'use client';

import type { GrantOption } from '../../hooks/usePoint';

interface GrantOptionCardProps {
  option: GrantOption;
  isSelected: boolean;
  isDisabled?: boolean;
  onClick: (option: GrantOption) => void;
}

export default function GrantOptionCard({
  option,
  isSelected,
  isDisabled = false,
  onClick
}: GrantOptionCardProps) {
  return (
    <button
      onClick={() => !isDisabled && onClick(option)}
      disabled={isDisabled}
      className={`
        w-full p-4 rounded-lg border-2 transition-all duration-200 text-left
        ${isSelected
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md'
          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-green-300 dark:hover:border-green-600'
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
              ? 'text-green-700 dark:text-green-300'
              : 'text-gray-900 dark:text-white'
          }`}>
            {option.name}
          </h4>
          <p className={`text-sm mt-1 ${
            isSelected
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {option.description}
          </p>
        </div>
        
        <div className="text-right ml-4">
          <div className={`text-xl font-bold ${
            isSelected
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            +{option.amount.toLocaleString()}
          </div>
          <div className={`text-sm ${
            isSelected
              ? 'text-green-500 dark:text-green-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            Points
          </div>
        </div>
      </div>
      
      {isSelected && (
        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
          <div className="flex items-center text-green-600 dark:text-green-400">
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
