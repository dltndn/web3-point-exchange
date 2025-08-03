export class CreateTransactionDto {
  readonly to: string;
  readonly amount: string;
  readonly data?: string;
}

export class SignTransactionDto {
  readonly transactionHash: string;
  readonly privateKey: string;
}

export class TransactionStatusDto {
  readonly transactionHash: string;
  readonly status: string;
  readonly blockNumber?: number;
  readonly gasUsed?: string;
  readonly confirmations?: number;
}

export class SendTransactionResDto {
  readonly transactionHash: string;
  readonly status: string;
  readonly message: string;
}
