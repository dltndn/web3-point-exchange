import { useCallback } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';

export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: `0x${string}`;
}

export interface EIP712Types {
  [key: string]: Array<{
    name: string;
    type: string;
  }>;
}

export interface SignEIP712Params {
  domain: EIP712Domain;
  types: EIP712Types;
  primaryType: string;
  message: Record<string, string | number | bigint>;
}

export function useSignEIP712() {
  const { address, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const signEIP712 = useCallback(async (params: SignEIP712Params): Promise<string | null> => {
    if (!isConnected || !address) {
      throw new Error('지갑이 연결되지 않았습니다.');
    }

    try {
      const signature = await signTypedDataAsync({
        domain: params.domain,
        types: params.types,
        primaryType: params.primaryType,
        message: params.message,
      });

      return signature;
    } catch (error) {
      console.error('EIP712 서명 실패:', error);
      
      // 사용자가 서명을 취소한 경우
      if (error instanceof Error && error.message.includes('User rejected')) {
        return null;
      }
      
      throw error;
    }
  }, [isConnected, address, signTypedDataAsync]);

  return {
    signEIP712,
    address,
    isConnected,
  };
}
