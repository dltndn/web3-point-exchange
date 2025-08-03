'use client';

import { http, createStorage, cookieStorage } from 'wagmi';
import { baseSepolia, sepolia } from 'wagmi/chains';
import { Chain, getDefaultConfig } from '@rainbow-me/rainbowkit';

// WalletConnect 프로젝트 ID - 환경 변수에서 가져옵니다
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

// 지원하는 체인들을 정의
const supportedChains: Chain[] = [
  baseSepolia,
  sepolia,
];

// Wagmi 설정 생성
export const config = getDefaultConfig({
  appName: 'Bloom Token Exchange',
  projectId,
  chains: supportedChains,
  ssr: true, // SSR 지원 활성화
  storage: createStorage({
    storage: cookieStorage, // 쿠키 저장소 사용
  }),
  transports: supportedChains.reduce(
    (obj, chain) => ({ ...obj, [chain.id]: http() }),
    {}
  ),
});

export { supportedChains };
