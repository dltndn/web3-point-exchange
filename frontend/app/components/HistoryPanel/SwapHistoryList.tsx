'use client';

import { useSwapHistory, type SwapHistory } from '../hooks/useHistory';
import Button from '../common/Button';
import { SWAP_TYPES, SWAP_STATUS } from '../../api/point/v1/user-swap-histories/dto';

interface SwapHistoryListProps {
  className?: string;
}

// wei 단위를 토큰 단위로 변환하는 함수 (decimal 18 기준)
const formatTokenAmount = (weiAmount: string): string => {
  const wei = BigInt(weiAmount);
  const divisor = BigInt(10 ** 18);
  const tokenAmount = Number(wei) / Number(divisor);
  
  // 소수점 6자리까지 표시하되, 불필요한 0은 제거
  return tokenAmount.toFixed(6).replace(/\.?0+$/, '');
};

const getSwapTypeLabel = (type: SwapHistory['type']): string => {
  switch (type) {
    case SWAP_TYPES.POINT_TO_TOKEN:
      return '포인트 → 토큰';
    case SWAP_TYPES.TOKEN_TO_POINT:
      return '토큰 → 포인트';
    default:
      return '알 수 없음';
  }
};

const getStatusLabel = (status: SwapHistory['status']): string => {
  switch (status) {
    case SWAP_STATUS.PENDING:
      return '처리 중';
    case SWAP_STATUS.COMPLETED:
      return '완료';
    case SWAP_STATUS.FAILED:
      return '실패';
    default:
      return '알 수 없음';
  }
};

const getStatusColor = (status: SwapHistory['status']): string => {
  switch (status) {
    case SWAP_STATUS.PENDING:
      return 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100';
    case SWAP_STATUS.COMPLETED:
      return 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100';
    case SWAP_STATUS.FAILED:
      return 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100';
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

export default function SwapHistoryList({ className = '' }: SwapHistoryListProps) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSwapHistory();

  if (isLoading) {
    return (
      <div className={`p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg ${className}`}>
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
          포인트 ↔ 토큰 교환 내역
        </h3>
        <div className="flex justify-center items-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg ${className}`}>
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
          포인트 ↔ 토큰 교환 내역
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
    <div className={`p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg ${className}`}>
      <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
        포인트 ↔ 토큰 교환 내역
      </h3>
      
      {totalCount === 0 ? (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          내역이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {allHistories.map((history) => (
            <div
              key={history.user_swap_history_id}
              className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-200 dark:border-blue-700"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-2 py-1 rounded-full text-xs font-medium">
                      {getSwapTypeLabel(history.type)}
                    </span>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(history.status)}`}>
                      {getStatusLabel(history.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {parseInt(history.amount_point).toLocaleString()}P ↔ {history.amount_token}BT
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {history.type === SWAP_TYPES.POINT_TO_TOKEN ? '+' : '-'}{history.amount_token}BT
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
