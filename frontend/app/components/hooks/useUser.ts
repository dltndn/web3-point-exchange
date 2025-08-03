'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  saveToStorage, 
  loadFromStorage, 
  removeFromStorage, 
  StorageKeys 
} from '../../utils/storage/local-storage';

// 사용자 데이터 타입 정의
interface UserData {
  userId: string;
  userPointId: number;
  balance: number;
  walletAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStatusState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

// 사용자 데이터 관련 헬퍼 함수들
const saveUserData = (data: UserData): void => {
  saveToStorage(StorageKeys.USER_DATA, data);
};

const loadUserData = (): UserData | null => {
  return loadFromStorage<UserData>(StorageKeys.USER_DATA);
};

const removeUserData = (): void => {
  removeFromStorage(StorageKeys.USER_DATA);
};

const getUserDataByWallet = (walletAddress: string): UserData | null => {
  const userData = loadUserData();
  if (userData && userData.walletAddress === walletAddress) {
    return userData;
  }
  return null;
};



// UUID 생성 함수
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// API 호출 함수
const createUserPoint = async (userData: { userId: string; walletAddress: string; amount?: number }) => {
  const response = await fetch('/api/point/v1/user-points', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '사용자 생성에 실패했습니다.');
  }

  return response.json();
};

const getUserPoints = async (userId: string) => {
  const response = await fetch(`/api/point/v1/user-points?userId=${userId}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '사용자 조회에 실패했습니다.');
  }

  return response.json();
};

export const useUser = () => {
  const { address, isConnected } = useAccount();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [status, setStatus] = useState<UserStatusState>({
    isLoading: false,
    error: null,
    success: false,
  });

  // 지갑 연결 시 로컬 스토리지에서 사용자 데이터 로드
  useEffect(() => {
    if (isConnected && address) {
      const savedData = getUserDataByWallet(address);
      if (savedData) {
        setUserData(savedData);
      } else {
        // 다른 지갑 주소면 기존 데이터 클리어
        removeUserData();
        setUserData(null);
      }
    } else {
      setUserData(null);
    }
  }, [isConnected, address]);

  // 사용자 생성 mutation
  const createUserMutation = useMutation({
    mutationFn: createUserPoint,
    onMutate: () => {
      setStatus({ isLoading: true, error: null, success: false });
    },
    onSuccess: (data) => {
      const newUserData: UserData = {
        userId: data.user_id,
        userPointId: data.user_point_id,
        balance: data.balance,
        walletAddress: address || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      
      setUserData(newUserData);
      saveUserData(newUserData);
      setStatus({ isLoading: false, error: null, success: true });
    },
    onError: (error: Error) => {
      setStatus({ isLoading: false, error: error.message, success: false });
    },
  });

  // 사용자 조회 query
  const userQuery = useQuery({
    queryKey: ['user', userData?.userId],
    queryFn: () => getUserPoints(userData!.userId),
    enabled: !!userData?.userId,
    retry: false,
  });

  // API 응답 데이터 처리
  useEffect(() => {
    if (userQuery.data && userQuery.data.data && userQuery.data.data.length > 0) {
      const latestData = userQuery.data.data[0];
      const updatedUserData: UserData = {
        userId: latestData.user_id,
        userPointId: latestData.user_point_id,
        balance: latestData.balance,
        walletAddress: address || '',
        createdAt: latestData.created_at,
        updatedAt: latestData.updated_at,
      };
      setUserData(updatedUserData);
      saveUserData(updatedUserData);
    }
  }, [userQuery.data, address]);

  // 사용자 생성 함수
  const createUser = async () => {
    if (!address) {
      setStatus({ isLoading: false, error: '지갑이 연결되지 않았습니다.', success: false });
      return;
    }

    const userId = generateUUID();
    await createUserMutation.mutateAsync({ 
      userId, 
      walletAddress: address, 
      amount: 0 
    });
  };

  // 사용자 데이터 새로고침
  const refreshUserData = () => {
    if (userData?.userId) {
      userQuery.refetch();
    }
  };

  // 사용자 데이터 클리어
  const clearUserData = () => {
    removeUserData();
    setUserData(null);
    setStatus({ isLoading: false, error: null, success: false });
  };

  // 포인트 잔액 업데이트 (다른 컴포넌트에서 사용할 수 있도록)
  const updateBalance = (newBalance: number) => {
    if (userData) {
      const updatedData = { ...userData, balance: newBalance };
      setUserData(updatedData);
      saveUserData(updatedData);
    }
  };

  return {
    // 상태
    userData,
    status,
    isUserExists: !!userData,
    isWalletConnected: isConnected,
    walletAddress: address,
    
    // 액션
    createUser,
    refreshUserData,
    clearUserData,
    updateBalance,
    
    // 쿼리 상태
    isLoadingUser: userQuery.isLoading,
    userError: userQuery.error,
  };
};

// 타입 export
export type { UserData };
