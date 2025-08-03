'use client';

import { useConsumptionHistory, type ConsumptionHistory } from '../hooks/useHistory';
import Button from '../common/Button';
import { CONSUMPTION_TYPES } from '../../api/point/v1/user-points/[userPointId]/consumption-histories/dto';

interface ConsumptionHistoryListProps {
  className?: string;
}

const getConsumptionTypeLabel = (type: ConsumptionHistory['type']): string => {
  switch (type) {
    case CONSUMPTION_TYPES.SHOP_PURCHASE:
      return '상품 구매';
    case CONSUMPTION_TYPES.EVENT_PARTICIPATION:
      return '이벤트 참여';
    default:
      return '알 수 없음';
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return '날짜 오류';
  }
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  });
};

export default function ConsumptionHistoryList({ className = '' }: ConsumptionHistoryListProps) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useConsumptionHistory();

  if (isLoading) {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-900/20 rounded-lg ${className}`}>
        <h3 className="font-medium text-red-900 dark:text-red-100 mb-3">
          포인트 사용 내역
        </h3>
        <div className="flex justify-center items-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-900/20 rounded-lg ${className}`}>
        <h3 className="font-medium text-red-900 dark:text-red-100 mb-3">
          포인트 사용 내역
        </h3>
        <div className="text-red-600 dark:text-red-400">
          내역을 불러오는 중 오류가 발생했습니다.
        </div>
      </div>
    );
  }

  const allHistories = data?.pages.flatMap(page => page.data) || [];
  const totalCount = data?.pages[0]?.count || 0;

  return (
    <div className={`p-4 bg-red-50 dark:bg-red-900/20 rounded-lg ${className}`}>
      <h3 className="font-medium text-red-900 dark:text-red-100 mb-3">
        포인트 사용 내역
      </h3>
      
      {totalCount === 0 ? (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          내역이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {allHistories.map((history) => (
            <div
              key={history.consumption_history_id}
              className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-red-200 dark:border-red-700"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="inline-block bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 px-2 py-1 rounded-full text-xs font-medium">
                    {getConsumptionTypeLabel(history.type)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                    -{parseInt(history.amount).toLocaleString()}P
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(history.created_at)}
              </div>
            </div>
          ))}
          
          {hasNextPage && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-sm"
              >
                {isFetchingNextPage ? '로딩 중...' : '더 보기'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
