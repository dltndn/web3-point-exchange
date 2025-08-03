'use client';

interface CurrentPointDisplayProps {
  balance?: number;
  isLoading?: boolean;
  error?: string | null;
}

export default function CurrentPointDisplay({ 
  balance, 
  isLoading = false, 
  error 
}: CurrentPointDisplayProps) {
  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">
          현재 보유 포인트
        </h3>
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
        현재 보유 포인트
      </h3>
      
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-blue-600 dark:text-blue-400">로딩 중...</span>
        </div>
      ) : (
        <div className="flex items-baseline space-x-2">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {typeof balance === 'number' ? balance.toLocaleString() : '---'}
          </p>
          <span className="text-sm text-blue-500 dark:text-blue-300">Points</span>
        </div>
      )}
      
      {typeof balance === 'number' && !isLoading && (
        <p className="text-xs text-blue-500 dark:text-blue-300 mt-1">
          실시간 업데이트
        </p>
      )}
    </div>
  );
}
