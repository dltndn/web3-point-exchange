'use client';

import { useGrantHistory, type GrantHistory } from '../hooks/useHistory';
import Button from '../common/Button';
import { GRANT_TYPES } from '../../api/point/v1/user-points/[userPointId]/grant-histories/dto';

interface GrantHistoryListProps {
  className?: string;
}

const getGrantTypeLabel = (type: GrantHistory['type']): string => {
  switch (type) {
    case GRANT_TYPES.ATTENDANCE_CHECK:
      return '출석';
    case GRANT_TYPES.EVENT_PARTICIPATION:
      return '이벤트 참여';
    case GRANT_TYPES.PURCHASE_REWARD:
      return '구매 보상';
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

export default function GrantHistoryList({ className = '' }: GrantHistoryListProps) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGrantHistory();

  if (isLoading) {
    return (
      <div className={`p-4 bg-green-50 dark:bg-green-900/20 rounded-lg ${className}`}>
        <h3 className="font-medium text-green-900 dark:text-green-100 mb-3">
          포인트 지급 내역
        </h3>
        <div className="flex justify-center items-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-green-50 dark:bg-green-900/20 rounded-lg ${className}`}>
        <h3 className="font-medium text-green-900 dark:text-green-100 mb-3">
          포인트 지급 내역
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
    <div className={`p-4 bg-green-50 dark:bg-green-900/20 rounded-lg ${className}`}>
      <h3 className="font-medium text-green-900 dark:text-green-100 mb-3">
        포인트 지급 내역
      </h3>
      
      {totalCount === 0 ? (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          내역이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {allHistories.map((history) => (
            <div
              key={history.grant_history_id}
              className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-green-200 dark:border-green-700"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="inline-block bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 px-2 py-1 rounded-full text-xs font-medium">
                    {getGrantTypeLabel(history.type)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    +{parseInt(history.amount).toLocaleString()}P
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
