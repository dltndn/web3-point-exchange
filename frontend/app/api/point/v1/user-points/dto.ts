export interface UserPointReqDto {
  userId: string;
  walletAddress?: string;
  amount?: string; // bigint
}

export interface UserPointResDto {
  user_point_id: number;
  user_id: string;
  balance: string; // bigint
  created_at: string;
  updated_at: string;
}

export interface UserPointListResDto {
  count: number;
  data: UserPointResDto[];
} 