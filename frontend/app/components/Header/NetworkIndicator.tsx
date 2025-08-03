'use client';

import { useAccount, useChainId } from 'wagmi';
import { baseSepolia, sepolia, polygonMumbai, arbitrumSepolia } from 'wagmi/chains';
import { useChainModal } from '@rainbow-me/rainbowkit';

const supportedChains = [baseSepolia, sepolia, polygonMumbai, arbitrumSepolia];

export default function NetworkIndicator() {
  const { isConnected, chain } = useAccount();
  const chainId = useChainId();
  const { openChainModal } = useChainModal();

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span className="text-sm text-gray-600 dark:text-gray-400">연결 안됨</span>
      </div>
    );
  }

  const isSupported = supportedChains.some(supportedChain => supportedChain.id === chainId);
  const currentChain = supportedChains.find(supportedChain => supportedChain.id === chainId);

  return (
    <button
      onClick={openChainModal}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:opacity-80 ${
        isSupported 
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${
        isSupported ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
      <span className="text-sm font-medium">
        {currentChain?.name || chain?.name || '알 수 없는 네트워크'}
      </span>
      {!isSupported && (
        <span className="text-xs opacity-75">(지원안됨)</span>
      )}
    </button>
  );
}
