'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useUser } from './useUser';
import { type GrantType } from '../../api/point/v1/user-points/[userPointId]/grant-histories/dto';
import { type ConsumptionType } from '../../api/point/v1/user-points/[userPointId]/consumption-histories/dto';
import { type SwapType, type SwapStatus } from '../../api/point/v1/user-swap-histories/dto';

// 타입 정의 - API 응답 구조와 일치하도록 수정
interface GrantHistory {
  grant_history_id: string;
  user_point_id: number;
  type: GrantType;
  amount: string; // bigint를 string으로 받음
  status: number;
  resource_id: string;
  created_at: string;
  updated_at: string;
}

interface ConsumptionHistory {
  consumption_history_id: string;
  user_point_id: number;
  type: ConsumptionType;
  amount: string; // bigint를 string으로 받음
  status: number;
  resource_id: string;
  created_at: string;
  updated_at: string;
}

interface SwapHistory {
  user_swap_history_id: string;
  user_id: string;
  type: SwapType;
  amount_point: string; // bigint를 string으로 받음
  amount_token: string; // bigint를 string으로 받음
  status: SwapStatus;
  point_to_token_transaction_id?: number;
  token_to_point_transaction_id?: number;
  created_at: string;
  updated_at: string;
}

interface PaginationResponse<T> {
  data: T[];
  count: number;
}

// 포인트 지급 내역 조회 훅
export const useGrantHistory = () => {
  const { userData } = useUser();
  const userPointId = userData?.userPointId;

  return useInfiniteQuery<PaginationResponse<GrantHistory>>({
    // 다른 컴포넌트에서 같은 queryKey 로 일반 Query 를 사용하므로
    // InfiniteQuery 와 충돌하지 않도록 별도 Key 를 사용한다.
    queryKey: ['grantHistoryInfinite', userPointId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!userPointId) throw new Error('User point ID is required');
      
      const response = await fetch(
        `/api/point/v1/user-points/${userPointId}/grant-histories?page=${pageParam}&limit=10`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch grant history');
      }

      return response.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginationResponse<GrantHistory>, allPages: PaginationResponse<GrantHistory>[]) => {
      // 현재 API는 페이지네이션을 지원하지 않으므로 undefined 반환
      // allPages가 undefined이거나 빈 배열일 때 length 접근 오류를 방지한다.
      if (!lastPage || !allPages || allPages?.length === 0) return undefined;
      return undefined;
    },
    enabled: !!userPointId,
  });
};

// 포인트 사용 내역 조회 훅
export const useConsumptionHistory = () => {
  const { userData } = useUser();
  const userPointId = userData?.userPointId;

  return useInfiniteQuery<PaginationResponse<ConsumptionHistory>>({
    queryKey: ['consumptionHistoryInfinite', userPointId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!userPointId) throw new Error('User point ID is required');
      
      const response = await fetch(
        `/api/point/v1/user-points/${userPointId}/consumption-histories?page=${pageParam}&limit=10`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch consumption history');
      }

      return response.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginationResponse<ConsumptionHistory>, allPages: PaginationResponse<ConsumptionHistory>[]) => {
      // 현재 API는 페이지네이션을 지원하지 않으므로 undefined 반환
      if (!lastPage || !allPages || allPages.length === 0) return undefined;
      return undefined;
    },
    enabled: !!userPointId,
  });
};

// 포인트 교환 내역 조회 훅
export const useSwapHistory = () => {
  const { userData } = useUser();
  const userId = userData?.userId;

  return useInfiniteQuery<PaginationResponse<SwapHistory>>({
    // swapHistory 는 기존에 동일 key 로 일반 Query 가 없지만
    // 확장성을 위해 명시적으로 Infinite 접미사를 붙인다.
    queryKey: ['swapHistoryInfinite', userId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!userId) throw new Error('User ID is required');
      
      const response = await fetch(
        `/api/point/v1/user-swap-histories?page=${pageParam}&limit=10`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch swap history');
      }

      return response.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginationResponse<SwapHistory>, allPages: PaginationResponse<SwapHistory>[]) => {
      // 현재 API는 페이지네이션을 지원하지 않으므로 undefined 반환
      if (!lastPage || !allPages || allPages.length === 0) return undefined;
      return undefined;
    },
    enabled: !!userId,
  });
};

// 타입 export
export type { GrantHistory, ConsumptionHistory, SwapHistory }; 