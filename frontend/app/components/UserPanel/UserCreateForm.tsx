'use client';

import { useState } from 'react';
import type { UserStatusState } from '../hooks/useUser';
import Button from '../common/Button';

interface UserCreateFormProps {
  createUser: () => Promise<void>;
  status: UserStatusState;
  isWalletConnected: boolean;
  walletAddress?: string | null;
}

export default function UserCreateForm({
  createUser,
  status,
  isWalletConnected,
  walletAddress,
}: UserCreateFormProps) {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateUser = async () => {
    if (!isWalletConnected) {
      return;
    }

    setIsCreating(true);
    try {
      await createUser();
      // createUser가 완료되면 userData가 설정되어 isUserExists가 true가 됨
      console.log('UserCreateForm: createUser() completed');
    } catch (error) {
      console.error('UserCreateForm: createUser() failed:', error);
    } finally {
      console.log('UserCreateForm: setIsCreating(false)');
      setIsCreating(false);
    }
  };

  if (!isWalletConnected) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              지갑 연결 필요
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              사용자를 생성하려면 먼저 지갑을 연결해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          새 사용자 생성
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
          연결된 지갑 주소: <span className="font-mono text-xs">{walletAddress}</span>
        </p>
        <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
          이 지갑 주소로 새로운 사용자를 생성하고 포인트 시스템을 시작하세요.
        </p>
        
        <Button
          onClick={handleCreateUser}
          disabled={isCreating || status.isLoading}
          className="w-full"
        >
          {isCreating || status.isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              생성 중...
            </div>
          ) : (
            '사용자 생성하기'
          )}
        </Button>
      </div>
    </div>
  );
}
