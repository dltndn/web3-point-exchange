import { useSwap } from '../hooks/useSwap';
import { useTokenBalance } from '../hooks/useTokenBalance';

interface SwapStatusAlertProps {
  onClose?: () => void;
}

export default function SwapStatusAlert({ onClose }: SwapStatusAlertProps) {
  const { isLoading, error, success, lastSwapId, resetState } = useSwap();
  const { getExplorerUrl } = useTokenBalance();

  const handleClose = () => {
    resetState();
    onClose?.();
  };

  // 아무 상태도 없으면 렌더링하지 않음
  if (!isLoading && !error && !success) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">교환 처리 중...</h3>
            <p className="text-sm text-gray-600">
              트랜잭션을 처리하고 있습니다. 잠시만 기다려주세요.
            </p>
          </div>
        )}

        {/* 성공 상태 */}
        {success && (
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">교환 완료!</h3>
            <p className="text-sm text-gray-600 mb-4">
              포인트와 토큰 교환이 성공적으로 완료되었습니다.
            </p>
            {lastSwapId && (
              <div className="bg-gray-50 p-3 rounded-md text-sm">
                <p className="text-gray-600">교환 ID: {lastSwapId}</p>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleClose}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                확인
              </button>
              <button
                onClick={() => window.open(getExplorerUrl(), '_blank')}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                탐색기 보기
              </button>
            </div>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="text-center">
            <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">교환 실패</h3>
            <p className="text-sm text-gray-600 mb-4">
              교환 처리 중 오류가 발생했습니다.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
