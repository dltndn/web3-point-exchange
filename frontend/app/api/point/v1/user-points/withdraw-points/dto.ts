export interface PermitDataDto {
  owner: string; // 소유자 주소
  value: string; // 허용할 금액 (bigint string)
  deadline: number; // 만료 시간 (timestamp)
  signature: string; // 서명
}

export interface WithdrawPointsReqDto {
  userId: string; // 사용자 ID
  walletAddress: string; // 지갑 주소
  amount: string; // 출금할 금액 (bigint string)
  validUntil: number; // 유효 기간 (timestamp 초단위)
  signature: string; // EIP712 서명
  permitData?: PermitDataDto; // ERC20 permit 데이터 (선택적)
}
