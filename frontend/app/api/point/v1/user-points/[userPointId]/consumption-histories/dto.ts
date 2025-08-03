// 소비 타입 정의
export const CONSUMPTION_TYPES = {
  SHOP_PURCHASE: 1,
  EVENT_PARTICIPATION: 2,
} as const;

export type ConsumptionType = typeof CONSUMPTION_TYPES[keyof typeof CONSUMPTION_TYPES];

// 상태 타입 정의
export const CONSUMPTION_STATUS = {
  PENDING: 1,
  COMPLETED: 2,
  FAILED: 3,
} as const;

export type ConsumptionStatus = typeof CONSUMPTION_STATUS[keyof typeof CONSUMPTION_STATUS];

export interface GetConsumptionHistoriesReqQueryDto {
  type?: ConsumptionType;
  status?: ConsumptionStatus;
  lastId?: string;
  limit?: number;
  offset?: number;
  order?: string;
}

export interface ConsumptionHistoryResDto {
  consumption_history_id: string;
  user_point_id: number;
  amount: string; // bigint
  type: number;
  status: number;
  resource_id: string;
  created_at: string;
  updated_at: string;
}

export interface ConsumptionHistoryListResDto {
  count: number;
  data: ConsumptionHistoryResDto[];
} 