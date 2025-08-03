// 교환 타입 정의
export const SWAP_TYPES = {
  POINT_TO_TOKEN: 1,
  TOKEN_TO_POINT: 2,
} as const;

export type SwapType = typeof SWAP_TYPES[keyof typeof SWAP_TYPES];

// 상태 타입 정의
export const SWAP_STATUS = {
  PENDING: 1,
  COMPLETED: 2,
  FAILED: 3,
} as const;

export type SwapStatus = typeof SWAP_STATUS[keyof typeof SWAP_STATUS];

export interface GetUserSwapHistoriesReqQueryDto {
  userId?: string;
  type?: SwapType;
  status?: SwapStatus;
  lastId?: string;
  limit?: number;
  offset?: number;
  order?: string;
}

export interface UserSwapHistoryResDto {
  user_swap_history_id: string;
  user_id: string;
  type: number;
  amount_point: string; // bigint
  amount_token: string; // bigint
  status: number;
  point_to_token_transaction_id?: number;
  token_to_point_transaction_id?: number;
  created_at: string;
  updated_at: string;
}

export interface UserSwapHistoryListResDto {
  count: number;
  data: UserSwapHistoryResDto[];
} 