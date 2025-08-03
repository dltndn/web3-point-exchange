'use client';

import { useUser } from '../hooks/useUser';
import Button from '../common/Button';

export default function UserInfoDisplay() {
  const { userData, refreshUserData, clearUserData, isLoadingUser } = useUser();

  if (!userData) {
    return null;
  }

  const handleRefresh = () => {
    refreshUserData();
  };

  const handleClearData = () => {
    if (confirm('사용자 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      clearUserData();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // toast.success('복사되었습니다.');
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-green-900 dark:text-green-100">
            ✅ 사용자 정보
          </h3>
          <div className="flex space-x-2">
            <Button
              onClick={handleRefresh}
              disabled={isLoadingUser}
              variant="outline"
              size="sm"
            >
              {isLoadingUser ? '새로고침 중...' : '새로고침'}
            </Button>
            <Button
              onClick={handleClearData}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
            >
              삭제
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                사용자 ID
              </label>
              <div className="flex items-center space-x-2">
                <code className="text-xs bg-green-100 dark:bg-green-800 px-2 py-1 rounded font-mono text-green-800 dark:text-green-200 flex-1">
                  {userData.userId}
                </code>
                <button
                  onClick={() => copyToClipboard(userData.userId)}
                  className="p-1 hover:bg-green-200 dark:hover:bg-green-700 rounded"
                  title="복사"
                >
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                지갑 주소
              </label>
              <div className="flex items-center space-x-2">
                <code className="text-xs bg-green-100 dark:bg-green-800 px-2 py-1 rounded font-mono text-green-800 dark:text-green-200 flex-1">
                  {userData.walletAddress}
                </code>
                <button
                  onClick={() => copyToClipboard(userData.walletAddress)}
                  className="p-1 hover:bg-green-200 dark:hover:bg-green-700 rounded"
                  title="복사"
                >
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                현재 포인트 잔액
              </label>
              <div className="text-lg font-semibold text-green-900 dark:text-green-100 bg-green-100 dark:bg-green-800 px-3 py-2 rounded">
                {userData.balance.toLocaleString()} P
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                생성일
              </label>
              <div className="text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-800 px-2 py-1 rounded">
                {formatDate(userData.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="font-medium mb-1">💡 사용자 정보 안내:</p>
        <ul className="space-y-1 ml-2">
          <li>• 사용자 ID는 포인트 시스템에서 고유 식별자로 사용됩니다</li>
          <li>• 지갑 주소는 토큰 교환 시 사용됩니다</li>
          <li>• 포인트 잔액은 지급/사용 시 실시간 업데이트됩니다</li>
          <li>• 데이터 삭제 시 포인트 및 교환 내역이 모두 초기화됩니다</li>
        </ul>
      </div>
    </div>
  );
}
