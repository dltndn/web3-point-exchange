export class CreateSignatureDto {
  readonly message: string;
  readonly privateKey: string;
}

export class VerifySignatureDto {
  readonly message: string;
  readonly signature: string;
  readonly publicKey: string;
}

export class SignatureResDto {
  readonly signature: string;
  readonly publicKey: string;
  readonly address: string;
}

export class ManagerAccountDto {
  readonly address: string;
  readonly publicKey: string;
  readonly balance?: string;
}
