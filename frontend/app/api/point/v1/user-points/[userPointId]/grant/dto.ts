// 지급 타입 정의
export const GRANT_TYPES = {
  PURCHASE_REWARD: 1,
  EVENT_PARTICIPATION: 2,
  ATTENDANCE_CHECK: 3,
} as const;

export type GrantType = typeof GRANT_TYPES[keyof typeof GRANT_TYPES];

export interface GrantReqDto {
  amount: string; // bigint
  type: GrantType;
  resourceId?: string;
  force?: boolean;
}

export interface GrantHistoryResDto {
  grant_history_id: string;
  user_point_id: number;
  amount: string; // bigint
  type: number;
  status: number;
  resource_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GrantHistoryListResDto {
  count: number;
  data: GrantHistoryResDto[];
} 