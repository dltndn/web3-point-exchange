/**
 * 교환 유형
 */
export enum SwapType {
  POINT_TO_TOKEN = 1,
  TOKEN_TO_POINT = 2,
}

/**
 * 교환 상태
 */
export enum SwapStatus {
  PENDING = 1,
  COMPLETED = 2,
  FAILED = 3,
}
