/**
 * 사용자 상태
 */
export enum UserStatus {
  PENDING = 0,
  VALID = 1,
  INVALID = 2,
}

/**
 * 포인트 사용 유형
 */
export enum ConsumptionType {
  SHOP_PURCHASE = 1,
  EVENT_PARTICIPATION = 2,
}

/**
 * 포인트 사용 상태
 */
export enum ConsumptionStatus {
  PENDING = 1,
  COMPLETED = 2,
  FAILED = 3,
}

/**
 * 포인트 지급 유형
 */
export enum GrantType {
  PURCHASE_REWARD = 1,
  EVENT_PARTICIPATION = 2,
  ATTENDANCE_CHECK = 3,
}

/**
 * 포인트 지급 상태
 */
export enum GrantStatus {
  PENDING = 1,
  COMPLETED = 2,
  FAILED = 3,
}

export const POINT_BALANCE_KEY = (userId: string) => `point:balance:${userId}`;
