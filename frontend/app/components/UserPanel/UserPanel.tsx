'use client';

import { useUser } from '../hooks/useUser';
import UserCreateForm from './UserCreateForm';
import UserInfoDisplay from './UserInfoDisplay';
import UserStatusAlert from './UserStatusAlert';

export default function UserPanel() {
  const { isWalletConnected, isUserExists, status, createUser, walletAddress } = useUser();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          👤 사용자 관리
        </h2>
        
        {!isWalletConnected ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-2 text-lg font-medium">
              지갑 연결이 필요합니다
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              상단의 Connect Wallet 버튼을 클릭하여 MetaMask 지갑을 연결하세요.
            </p>
            <div className="text-xs text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <p className="font-medium mb-1">💡 지갑 연결 안내:</p>
              <ul className="text-left space-y-1 ml-2">
                <li>• MetaMask 또는 호환 지갑이 필요합니다</li>
                <li>• 지갑 연결 시 가스비는 발생하지 않습니다</li>
                <li>• 모든 거래는 서명으로만 처리됩니다</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 상태 알림 */}
            <UserStatusAlert />
            
            {/* 사용자 생성 또는 정보 표시 */}
            {isUserExists || status.success ? (
              <UserInfoDisplay />
            ) : (
              <UserCreateForm
                createUser={createUser}
                status={status}
                isWalletConnected={isWalletConnected}
                walletAddress={walletAddress}
              />
            )}
          </div>
        )}
      </div>

      {/* 추가 정보 패널 */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          📚 사용자 시스템 가이드
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              1️⃣ 지갑 연결
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              MetaMask 지갑을 연결하여 Web3 기능을 활성화하세요. 가스비 없이 서명만으로 모든 기능을 이용할 수 있습니다.
            </p>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
              2️⃣ 사용자 생성
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              지갑 연결 후 사용자를 생성하면 고유한 ID가 발급되고 포인트 시스템을 이용할 수 있습니다.
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
              3️⃣ 포인트 관리
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              포인트 패널에서 포인트 지급, 사용, 잔액 확인 등의 기능을 이용할 수 있습니다.
            </p>
          </div>
          
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
              4️⃣ 토큰 교환
            </h4>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              교환 패널에서 포인트를 BloomToken으로 교환하거나 반대로 교환할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
