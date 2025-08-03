'use client';

import type { GrantHistoryListResDto } from '../../api/point/v1/user-points/[userPointId]/grant/dto';
import type { ConsumptionHistoryListResDto } from '../../api/point/v1/user-points/[userPointId]/consume/dto';

interface PointHistoryListProps {
  grantHistory: GrantHistoryListResDto['data'];
  consumptionHistory: ConsumptionHistoryListResDto['data'];
  isGrantLoading?: boolean;
  isConsumptionLoading?: boolean;
  error?: string | null;
}

// 내역 타입 정의
interface HistoryItem {
  id: string;
  type: 'grant' | 'consume';
  amount: number;
  description: string;
  createdAt: string;
  status: number;
}

// 타입별 설명 매핑
const getGrantDescription = (type: number): string => {
  switch (type) {
    case 1: return '출석 포인트';
    case 2: return '이벤트 참여 포인트';
    default: return '포인트 지급';
  }
};

const getConsumeDescription = (type: number): string => {
  switch (type) {
    case 3: return '상품 구매';
    case 4: return '이벤트 참여';
    default: return '포인트 사용';
  }
};

// 상태별 표시
const getStatusText = (status: number): { text: string; className: string } => {
  switch (status) {
    case 1:
      return { text: '완료', className: 'text-green-600 dark:text-green-400' };
    case 0:
      return { text: '대기', className: 'text-yellow-600 dark:text-yellow-400' };
    case -1:
      return { text: '실패', className: 'text-red-600 dark:text-red-400' };
    default:
      return { text: '알 수 없음', className: 'text-gray-600 dark:text-gray-400' };
  }
};

export default function PointHistoryList({
  grantHistory = [],
  consumptionHistory = [],
  isGrantLoading = false,
  isConsumptionLoading = false,
  error
}: PointHistoryListProps) {
  // 지급 내역과 사용 내역을 합쳐서 최신순으로 정렬
  const combinedHistory: HistoryItem[] = [
    ...grantHistory.map((item) => ({
      id: item.grant_history_id,
      type: 'grant' as const,
      amount: item.amount,
      description: getGrantDescription(item.type),
      createdAt: item.created_at,
      status: item.status,
    })),
    ...consumptionHistory.map((item) => ({
      id: item.consumption_history_id,
      type: 'consume' as const,
      amount: item.amount,
      description: getConsumeDescription(item.type),
      createdAt: item.created_at,
      status: item.status,
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
   .slice(0, 5); // 최근 5개만 표시

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">
          최근 내역
        </h3>
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      </div>
    );
  }

  const isLoading = isGrantLoading || isConsumptionLoading;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
      <h3 className="font-medium text-gray-900 dark:text-white mb-3">
        최근 내역
      </h3>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">로딩 중...</span>
        </div>
      ) : combinedHistory.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
          아직 내역이 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {combinedHistory.map((item) => {
            const statusInfo = getStatusText(item.status);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${
                      item.type === 'grant' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {item.type === 'grant' ? '+' : '-'}{item.amount.toLocaleString()}P
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${statusInfo.className} bg-opacity-10`}>
                      {statusInfo.text}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {item.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(item.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            );
          })}
          
          {combinedHistory.length === 5 && (
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                                 더 많은 내역은 &apos;내역&apos; 탭에서 확인하세요
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
