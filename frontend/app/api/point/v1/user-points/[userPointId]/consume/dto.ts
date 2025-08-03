// 소비 타입 정의
export const CONSUME_TYPES = {
  SHOP_PURCHASE: 1,
  EVENT_PARTICIPATION: 2,
} as const;

export type ConsumeType = typeof CONSUME_TYPES[keyof typeof CONSUME_TYPES];

export interface ConsumeReqDto {
  amount: string; // bigint
  type: ConsumeType;
  resourceId?: string;
  force?: boolean;
}

export interface ConsumptionHistoryResDto {
  consumption_history_id: string;
  user_point_id: number;
  amount: string; // bigint
  type: number;
  status: number;
  resource_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsumptionHistoryListResDto {
  count: number;
  data: ConsumptionHistoryResDto[];
} 