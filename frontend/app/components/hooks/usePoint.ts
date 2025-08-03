'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPointResDto } from '../../api/point/v1/user-points/dto';
import type { 
  GrantReqDto as GrantApiReqDto,
  GrantHistoryListResDto,
  GrantType
} from '../../api/point/v1/user-points/[userPointId]/grant/dto';
import { GRANT_TYPES } from '../../api/point/v1/user-points/[userPointId]/grant/dto';
import type { 
  ConsumeReqDto as ConsumeApiReqDto,
  ConsumptionHistoryListResDto,
  ConsumeType
} from '../../api/point/v1/user-points/[userPointId]/consume/dto';
import { CONSUME_TYPES } from '../../api/point/v1/user-points/[userPointId]/consume/dto';

// 포인트 관련 타입 정의
export interface PointActionState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export interface GrantOption {
  id: string;
  name: string;
  amount: string;
  type: GrantType;
  description: string;
}

export interface ConsumeOption {
  id: string;
  name: string;
  amount: string;
  type: ConsumeType;
  description: string;
}

// 포인트 지급 옵션 (PRD 기반)
export const GRANT_OPTIONS: GrantOption[] = [
  {
    id: 'attendance',
    name: '출석',
    amount: 1000,
    type: GRANT_TYPES.ATTENDANCE_CHECK,
    description: '출석 포인트 지급'
  },
  {
    id: 'event',
    name: '이벤트 참여',
    amount: 10000,
    type: GRANT_TYPES.EVENT_PARTICIPATION,
    description: '이벤트 참여 포인트 지급'
  }
];

// 포인트 소비 옵션 (PRD 기반)
export const CONSUME_OPTIONS: ConsumeOption[] = [
  {
    id: 'purchase',
    name: '상품 구매',
    amount: 100,
    type: CONSUME_TYPES.SHOP_PURCHASE,
    description: '상품 구매로 포인트 사용'
  },
  {
    id: 'event_participation',
    name: '이벤트 참여',
    amount: 100,
    type: CONSUME_TYPES.EVENT_PARTICIPATION,
    description: '이벤트 참여로 포인트 사용'
  }
];

// API 호출 함수들
const getUserPoint = async (userPointId: number): Promise<UserPointResDto> => {
  const response = await fetch(`/api/point/v1/user-points/${userPointId}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '포인트 조회에 실패했습니다.');
  }

  return response.json();
};

const grantPoints = async (data: GrantApiReqDto): Promise<void> => {
  const response = await fetch(`/api/point/v1/user-points/${data.userPointId}/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '포인트 지급에 실패했습니다.');
  }

  return response.json();
};

const consumePoints = async (data: ConsumeApiReqDto): Promise<void> => {
  const response = await fetch(`/api/point/v1/user-points/${data.userPointId}/consume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '포인트 사용에 실패했습니다.');
  }

  return response.json();
};

const getGrantHistories = async (userPointId: number): Promise<GrantHistoryListResDto> => {
  const response = await fetch(`/api/point/v1/user-points/${userPointId}/grant-histories`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '지급 내역 조회에 실패했습니다.');
  }

  return response.json();
};

const getConsumptionHistories = async (userPointId: number): Promise<ConsumptionHistoryListResDto> => {
  const response = await fetch(`/api/point/v1/user-points/${userPointId}/consumption-histories`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '사용 내역 조회에 실패했습니다.');
  }

  return response.json();
};

export const usePoint = (userPointId?: number) => {
  const queryClient = useQueryClient();
  const [grantStatus, setGrantStatus] = useState<PointActionState>({
    isLoading: false,
    error: null,
    success: false,
  });
  const [consumeStatus, setConsumeStatus] = useState<PointActionState>({
    isLoading: false,
    error: null,
    success: false,
  });

  // 현재 포인트 조회
  const pointQuery = useQuery({
    queryKey: ['userPoint', userPointId],
    queryFn: () => getUserPoint(userPointId!),
    enabled: !!userPointId,
    refetchInterval: 5000, // 5초마다 자동 갱신
  });

  // 지급 내역 조회
  const grantHistoryQuery = useQuery({
    queryKey: ['grantHistory', userPointId],
    queryFn: () => getGrantHistories(userPointId!),
    enabled: !!userPointId,
  });

  // 사용 내역 조회
  const consumptionHistoryQuery = useQuery({
    queryKey: ['consumptionHistory', userPointId],
    queryFn: () => getConsumptionHistories(userPointId!),
    enabled: !!userPointId,
  });

  // 포인트 지급 mutation
  const grantMutation = useMutation({
    mutationFn: grantPoints,
    onMutate: () => {
      setGrantStatus({ isLoading: true, error: null, success: false });
    },
    onSuccess: () => {
      setGrantStatus({ isLoading: false, error: null, success: true });
      // 관련 데이터 재조회
      queryClient.invalidateQueries({ queryKey: ['userPoint', userPointId] });
      queryClient.invalidateQueries({ queryKey: ['grantHistory', userPointId] });
    },
    onError: (error: Error) => {
      setGrantStatus({ isLoading: false, error: error.message, success: false });
    },
  });

  // 포인트 소비 mutation
  const consumeMutation = useMutation({
    mutationFn: consumePoints,
    onMutate: () => {
      setConsumeStatus({ isLoading: true, error: null, success: false });
    },
    onSuccess: () => {
      setConsumeStatus({ isLoading: false, error: null, success: true });
      // 관련 데이터 재조회
      queryClient.invalidateQueries({ queryKey: ['userPoint', userPointId] });
      queryClient.invalidateQueries({ queryKey: ['consumptionHistory', userPointId] });
    },
    onError: (error: Error) => {
      setConsumeStatus({ isLoading: false, error: error.message, success: false });
    },
  });

  // 포인트 지급 함수
  const handleGrantPoints = (option: GrantOption) => {
    if (!userPointId) {
      setGrantStatus({ isLoading: false, error: '사용자 정보가 없습니다.', success: false });
      return;
    }

    grantMutation.mutate({
      userPointId,
      amount: option.amount.toString(),
      type: option.type,
      force: false,
    });
  };

  // 포인트 소비 함수
  const handleConsumePoints = (option: ConsumeOption) => {
    if (!userPointId) {
      setConsumeStatus({ isLoading: false, error: '사용자 정보가 없습니다.', success: false });
      return;
    }

    consumeMutation.mutate({
      userPointId,
      amount: option.amount,
      type: option.type,
      force: false,
    });
  };

  // 상태 초기화 함수
  const resetGrantStatus = () => {
    setGrantStatus({ isLoading: false, error: null, success: false });
  };

  const resetConsumeStatus = () => {
    setConsumeStatus({ isLoading: false, error: null, success: false });
  };

  return {
    // 데이터
    pointData: pointQuery.data,
    grantHistory: grantHistoryQuery.data?.data || [],
    consumptionHistory: consumptionHistoryQuery.data?.data || [],
    
    // 로딩 상태
    isPointLoading: pointQuery.isLoading,
    isGrantHistoryLoading: grantHistoryQuery.isLoading,
    isConsumptionHistoryLoading: consumptionHistoryQuery.isLoading,
    
    // 액션 상태
    grantStatus,
    consumeStatus,
    
    // 액션 함수
    handleGrantPoints,
    handleConsumePoints,
    resetGrantStatus,
    resetConsumeStatus,
    
    // 옵션 데이터
    grantOptions: GRANT_OPTIONS,
    consumeOptions: CONSUME_OPTIONS,
    
    // 리프레시 함수
    refetchPoint: pointQuery.refetch,
    refetchGrantHistory: grantHistoryQuery.refetch,
    refetchConsumptionHistory: consumptionHistoryQuery.refetch,
  };
};
