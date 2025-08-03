// 지급 타입 정의
export const GRANT_TYPES = {
  PURCHASE_REWARD: 1,
  EVENT_PARTICIPATION: 2,
  ATTENDANCE_CHECK: 3,
} as const;

export type GrantType = typeof GRANT_TYPES[keyof typeof GRANT_TYPES];

// 상태 타입 정의
export const GRANT_STATUS = {
  PENDING: 1,
  COMPLETED: 2,
  FAILED: 3,
} as const;

export type GrantStatus = typeof GRANT_STATUS[keyof typeof GRANT_STATUS];

export interface GetGrantHistoriesReqQueryDto {
  type?: GrantType;
  status?: GrantStatus;
  lastId?: string;
  limit?: number;
  offset?: number;
  order?: string;
}

export interface GrantHistoryResDto {
  grant_history_id: string;
  user_point_id: number;
  amount: string; // bigint
  type: number;
  status: number;
  resource_id: string;
  created_at: string;
  updated_at: string;
}

export interface GrantHistoryListResDto {
  count: number;
  data: GrantHistoryResDto[];
} 