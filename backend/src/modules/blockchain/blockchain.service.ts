import { Injectable } from '@nestjs/common';
import {
  ethers,
  TransactionReceipt,
  TransactionResponse,
  TypedDataDomain,
  Signature,
} from 'ethers';
import { Config } from '../../config/environment/config';
import {
  BALANCE_OF_ABI,
  CURRENT_MANAGER_INDEX_KEY,
  CURRENT_RELAYER_INDEX_KEY,
  DEPOSIT_POINT_ABI,
  GET_EIP712_DOMAIN_ABI,
  GET_SIGNATURE_NONCE_ABI,
  MULTICALL_ABI,
  PERMIT_ABI,
  POINT_MANAGER_ABI,
  SET_VALID_USER_ABI,
  VALID_UNTIL_TIMESTAMP,
  WITHDRAW_POINT_ABI,
} from './constants';
import { RedisService } from '../redis/redis.service';

type EIP712Domain = TypedDataDomain;

/**
 * Blockchain service for handling blockchain operations
 */
@Injectable()
export class BlockchainService {
  private readonly provider: ethers.JsonRpcProvider;
  private eip712DomainCache: EIP712Domain | null;

  constructor(private readonly redisService: RedisService) {
    this.eip712DomainCache = null;
    this.provider = new ethers.JsonRpcProvider(
      Config.getEnvironment().BASE_SEPOLIA_RPC_URL,
    );
  }

  /**
   * Get provider instance
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  /**
   * Convert token amount to wei units
   */
  convertToWei(amount: string): string {
    return ethers.parseEther(amount).toString();
  }

  /**
   * Convert wei units to ether
   */
  convertFromWei(weiAmount: string): string {
    return ethers.formatEther(weiAmount);
  }

  /**
   * Estimate gas for transaction calldata
   */
  async estimateGas(calldata: string): Promise<string> {
    const contractAddress =
      Config.getEnvironment().POINT_MANAGER_CONTRACT_ADDRESS;

    if (!contractAddress) {
      throw new Error('Point Manager contract address is not configured');
    }

    try {
      const estimatedGas = await this.provider.estimateGas({
        to: contractAddress,
        data: calldata,
      });

      return estimatedGas.toString();
    } catch {
      throw new Error('Failed to estimate gas');
    }
  }

  async estimateGasWithMulticall(calldata: string): Promise<string> {
    const contractAddress =
      Config.getEnvironment().POINT_MANAGER_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('Point Manager contract address is not configured');
    }

    const contract = new ethers.Contract(
      contractAddress,
      POINT_MANAGER_ABI,
      this.provider,
    );

    try {
      // POINT_MANAGER_ABI에 정의된 커스텀 에러를 디코딩하기 위해
      // contract.runner.estimateGas()를 사용
      if (!contract.runner) {
        throw new Error('Contract runner is not available');
      }

      const runner = contract.runner as ethers.JsonRpcProvider;
      const estimatedGas = await runner.estimateGas({
        to: contractAddress,
        data: calldata,
      });

      return estimatedGas.toString();
    } catch (error: unknown) {
      const revertData =
        (error as { data?: unknown; error?: { data?: unknown } }).data ??
        (error as { error?: { data?: unknown } }).error?.data;

      if (revertData) {
        try {
          /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
          const decoded = contract.interface.parseError(revertData as string);
          throw new Error(
            `Gas estimation reverted: ${decoded?.name ?? 'Unknown'}`,
          );
        } catch (parseError) {
          console.log('Failed to parse error:', parseError);
          throw new Error(
            `Gas estimation reverted with data: ${JSON.stringify(revertData)}`,
          );
        }
      }
      throw new Error('Failed to estimate gas');
    }
  }

  async setValidUser(walletAddress: string, isValid: boolean): Promise<string> {
    const contractAddress =
      Config.getEnvironment().POINT_MANAGER_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('Point Manager contract address is not configured');
    }

    const ownerPrivateKey =
      Config.getEnvironment().POINT_MANAGER_OWNER_PRIVATE_KEY;
    if (!ownerPrivateKey) {
      throw new Error('Point Manager owner private key is not configured');
    }
    const signer = new ethers.Wallet(ownerPrivateKey, this.provider);

    const contract = new ethers.Contract(
      contractAddress,
      SET_VALID_USER_ABI,
      signer,
    );

    const tx: TransactionResponse = await contract.setValidUser(
      walletAddress,
      isValid,
    );

    const receipt: TransactionReceipt | null = await tx.wait();
    if (!receipt) {
      throw new Error('Transaction receipt is null');
    }

    return receipt.hash;
  }

  async sendMulticallTransaction(
    calldatas: string[],
    relayerIndex: number,
  ): Promise<{ rawTransaction: string; transactionHash: string }> {
    const relayerPrivateKey = this.getRelayerPrivateKey(relayerIndex);
    if (!relayerPrivateKey) {
      throw new Error('Relayer private key is not configured');
    }

    const relayer = new ethers.Wallet(relayerPrivateKey, this.provider);

    const contractAddress =
      Config.getEnvironment().POINT_MANAGER_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('Point Manager contract address is not configured');
    }

    const contract = new ethers.Contract(
      contractAddress,
      MULTICALL_ABI,
      this.provider,
    );

    // Populate transaction without sending
    const populatedTx = await contract.multicall.populateTransaction(calldatas);

    // Add gas limit and gas price
    const gasLimit = await this.provider.estimateGas(populatedTx);
    const feeData = await this.provider.getFeeData();

    const transactionRequest = {
      ...populatedTx,
      gasLimit,
      gasPrice: feeData.gasPrice,
      nonce: await this.provider.getTransactionCount(relayer.address),
      chainId: (await this.provider.getNetwork()).chainId,
    };

    // Sign transaction to get rawTransaction
    const signedTx = await relayer.signTransaction(transactionRequest);

    // Calculate transaction hash from signed transaction
    const transactionHash = ethers.keccak256(signedTx);

    return {
      rawTransaction: signedTx,
      transactionHash,
    };
  }

  /**
   * Send raw transaction to the blockchain
   */
  async sendRawTransaction(rawTransaction: string): Promise<string> {
    const txResponse = await this.provider.broadcastTransaction(rawTransaction);
    const receipt = await txResponse.wait();

    if (!receipt) {
      throw new Error('Transaction receipt is null');
    }

    return receipt.hash;
  }

  getDepositPointCalldata(
    walletAddress: string,
    amount: string,
    validUntil: number,
    managerIndex: number,
    managerSignature: string,
  ): string {
    const managerAddress = this.getManagerAddress(managerIndex);

    const contractAddress =
      Config.getEnvironment().POINT_MANAGER_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('Point Manager contract address is not configured');
    }

    const contract = new ethers.Contract(
      contractAddress,
      DEPOSIT_POINT_ABI,
      this.provider,
    );

    const calldata = contract.interface.encodeFunctionData('depositPoint', [
      walletAddress,
      amount,
      validUntil,
      managerAddress,
      managerSignature,
    ]);

    return calldata;
  }

  getWithdrawPointCalldata(
    walletAddress: string,
    amount: string,
    validUntil: number,
    userSignature: string,
  ): string {
    const contractAddress =
      Config.getEnvironment().POINT_MANAGER_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('Point Manager contract address is not configured');
    }

    const contract = new ethers.Contract(
      contractAddress,
      WITHDRAW_POINT_ABI,
      this.provider,
    );

    const calldata = contract.interface.encodeFunctionData('withdrawPoint', [
      walletAddress,
      amount,
      validUntil,
      userSignature,
    ]);

    return calldata;
  }

  getMulticallCalldata(calldatas: string[]): string {
    const contractAddress =
      Config.getEnvironment().POINT_MANAGER_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('Point Manager contract address is not configured');
    }

    const contract = new ethers.Contract(
      contractAddress,
      MULTICALL_ABI,
      this.provider,
    );

    const calldata = contract.interface.encodeFunctionData('multicall', [
      calldatas,
    ]);

    return calldata;
  }

  async getDepositPointManagerSignature(
    domain: EIP712Domain,
    walletAddress: string,
    amount: string,
    signatureNonce: string,
    managerIndex: number,
  ): Promise<string> {
    const managerPrivateKey = this.getManagerPrivateKey(managerIndex);
    const managerAddress = this.getManagerAddress(managerIndex);
    if (!managerPrivateKey) {
      throw new Error('Manager private key is not configured');
    }

    const signer = new ethers.Wallet(managerPrivateKey, this.provider);

    const types = {
      DepositPoint: [
        { type: 'address', name: 'account' },
        { type: 'uint256', name: 'amount' },
        { type: 'uint256', name: 'validUntil' },
        { type: 'address', name: 'manager' },
        { type: 'uint256', name: 'nonce' },
      ],
    };

    const data = {
      account: walletAddress,
      amount,
      validUntil: VALID_UNTIL_TIMESTAMP,
      manager: managerAddress,
      nonce: signatureNonce,
    };

    return await signer.signTypedData(domain, types, data);
  }

  async getEip712Domain(): Promise<EIP712Domain> {
    if (this.eip712DomainCache) {
      return this.eip712DomainCache;
    }

    const contractAddress =
      Config.getEnvironment().POINT_MANAGER_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('Point Manager contract address is not configured');
    }

    const contract = new ethers.Contract(
      contractAddress,
      GET_EIP712_DOMAIN_ABI,
      this.provider,
    );

    // Retrieve full tuple from the smart contract.
    // The tuple structure is: [fields, name, version, chainId, verifyingContract, salt, extensions]
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
    const rawDomain = (await contract.eip712Domain()) as unknown;
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
    const domainTuple = rawDomain as [
      string, // fields
      string, // name
      string, // version
      bigint, // chainId
      string, // verifyingContract
      unknown, // salt
      unknown, // extensions
    ];

    const name = domainTuple[1];
    const version = domainTuple[2];
    const chainId = domainTuple[3];
    const verifyingContract = domainTuple[4];

    this.eip712DomainCache = {
      name,
      version,
      chainId,
      verifyingContract,
    } as EIP712Domain;

    return this.eip712DomainCache;
  }

  async getCurrentManagerIndex(): Promise<number> {
    const currentManagerIndex = await this.redisService.get(
      CURRENT_MANAGER_INDEX_KEY,
    );
    if (!currentManagerIndex) {
      await this.redisService.setWithoutTTL(CURRENT_MANAGER_INDEX_KEY, '0');
      return 0;
    }

    return Number(currentManagerIndex);
  }

  async setCurrentManagerIndex(index: number): Promise<void> {
    await this.redisService.setWithoutTTL(
      CURRENT_MANAGER_INDEX_KEY,
      index.toString(),
    );
  }

  async getCurrentRelayerIndex(): Promise<number> {
    const currentRelayerIndex = await this.redisService.get(
      CURRENT_RELAYER_INDEX_KEY,
    );
    if (!currentRelayerIndex) {
      await this.redisService.setWithoutTTL(CURRENT_RELAYER_INDEX_KEY, '0');
      return 0;
    }

    return Number(currentRelayerIndex);
  }

  async setCurrentRelayerIndex(index: number): Promise<void> {
    await this.redisService.setWithoutTTL(
      CURRENT_RELAYER_INDEX_KEY,
      index.toString(),
    );
  }

  async getSignatureNonce(walletAddress: string): Promise<string> {
    const contractAddress =
      Config.getEnvironment().POINT_MANAGER_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('Point Manager contract address is not configured');
    }

    const contract = new ethers.Contract(
      contractAddress,
      GET_SIGNATURE_NONCE_ABI,
      this.provider,
    );

    const nonce: bigint = await contract.nonces(walletAddress);

    return nonce.toString();
  }

  /**
   * Get Manager Private Key
   * 임시 구현 메서드
   */
  getManagerPrivateKey(index: number): string | undefined {
    switch (index) {
      case 0:
        return Config.getEnvironment().MANAGER_WALLET1_PRIVATE_KEY;
      case 1:
        return Config.getEnvironment().MANAGER_WALLET2_PRIVATE_KEY;
      case 2:
        return Config.getEnvironment().MANAGER_WALLET3_PRIVATE_KEY;
      default:
        return undefined;
    }
  }

  getManagerAddress(index: number): string | undefined {
    switch (index) {
      case 0:
        return Config.getEnvironment().MANAGER_WALLET1_ADDRESS;
      case 1:
        return Config.getEnvironment().MANAGER_WALLET2_ADDRESS;
      case 2:
        return Config.getEnvironment().MANAGER_WALLET3_ADDRESS;
      default:
        return undefined;
    }
  }

  /**
   * Get Relayer Private Key
   * 임시 구현 메서드
   */
  getRelayerPrivateKey(index: number): string | undefined {
    switch (index) {
      case 0:
        return Config.getEnvironment().RELAYER_WALLET1_PRIVATE_KEY;
      case 1:
        return Config.getEnvironment().RELAYER_WALLET2_PRIVATE_KEY;
      case 2:
        return Config.getEnvironment().RELAYER_WALLET3_PRIVATE_KEY;
      default:
        return undefined;
    }
  }

  getAddressFromPrivateKey(privateKey: string): string {
    return new ethers.Wallet(privateKey).address;
  }

  /**
   * Split signature into v, r, s components
   * @param signature - The signature string to split
   * @returns Object containing v, r, s values
   */
  splitSignature(signature: string): { v: number; r: string; s: string } {
    try {
      const sig = Signature.from(signature);
      return {
        v: sig.v,
        r: sig.r,
        s: sig.s,
      };
    } catch (error) {
      throw new Error(
        `Failed to split signature: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get permit calldata for withdraw point transaction
   * @param owner - Token owner address
   * @param value - Token amount to permit
   * @param deadline - Permit deadline timestamp
   * @param signature - Permit signature
   * @returns Permit calldata string
   */
  getPermitCalldata(
    owner: string,
    value: string,
    deadline: number,
    signature: string,
  ): string {
    const tokenAddress = Config.getEnvironment().POINT_TOKEN_ADDRESS;
    if (!tokenAddress) {
      throw new Error('Point token address is not configured');
    }

    const spender = Config.getEnvironment().POINT_MANAGER_CONTRACT_ADDRESS;
    if (!spender) {
      throw new Error('Point Manager contract address is not configured');
    }

    // Split signature into v, r, s components
    const { v, r, s } = this.splitSignature(signature);

    const contract = new ethers.Contract(
      tokenAddress,
      PERMIT_ABI,
      this.provider,
    );

    const calldata = contract.interface.encodeFunctionData('permit', [
      owner,
      spender,
      value,
      deadline,
      v,
      r,
      s,
    ]);

    return calldata;
  }

  /**
   * Send permit transaction to POINT_TOKEN_ADDRESS contract
   * @param calldata - Permit calldata
   * @param relayerIndex - Relayer index to use for transaction
   * @returns Transaction hash
   */
  async sendPermitTransaction(
    calldata: string,
    relayerIndex: number,
  ): Promise<string> {
    const tokenAddress = Config.getEnvironment().POINT_TOKEN_ADDRESS;
    if (!tokenAddress) {
      throw new Error('Point token address is not configured');
    }

    const relayerPrivateKey = this.getRelayerPrivateKey(relayerIndex);
    if (!relayerPrivateKey) {
      throw new Error('Relayer private key is not configured');
    }

    const relayer = new ethers.Wallet(relayerPrivateKey, this.provider);

    // Estimate gas for the transaction
    const gasLimit = await this.provider.estimateGas({
      to: tokenAddress,
      data: calldata,
    });

    const feeData = await this.provider.getFeeData();

    const transactionRequest = {
      to: tokenAddress,
      data: calldata,
      gasLimit,
      gasPrice: feeData.gasPrice,
      nonce: await this.provider.getTransactionCount(relayer.address),
      chainId: (await this.provider.getNetwork()).chainId,
    };

    // Send transaction
    const tx: TransactionResponse =
      await relayer.sendTransaction(transactionRequest);

    // Wait for transaction confirmation
    const receipt: TransactionReceipt | null = await tx.wait();
    if (!receipt) {
      throw new Error('Transaction receipt is null');
    }

    return receipt.hash;
  }

  /**
   * Get token contract instance
   */
  async getTokenBalance(walletAddress: string): Promise<string> {
    const tokenAddress = Config.getEnvironment().POINT_TOKEN_ADDRESS;
    if (!tokenAddress) {
      throw new Error('Point token address is not configured');
    }

    const contract = new ethers.Contract(
      tokenAddress,
      BALANCE_OF_ABI,
      this.provider,
    );

    const balance = await contract.balanceOf(walletAddress);
    return balance.toString();
  }
}
