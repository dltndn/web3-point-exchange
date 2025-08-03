export interface BalanceReqDto {
  userId: string;
}

export interface BalanceResDto {
  balance: string; // bigint를 string으로 반환
}
