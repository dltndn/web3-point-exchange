export interface DepositPointsReqDto {
  userId: string;
  walletAddress: string;
  amount: string; // bigint
} 