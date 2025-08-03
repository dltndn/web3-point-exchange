import { NextRequest, NextResponse } from 'next/server';
import { WithdrawPointsReqDto } from './dto';
import { UserSwapHistoryResDto } from '../../user-swap-histories/dto';
import { apiRequest, API_CONFIG } from '../../../../../utils/api-config';

export async function POST(request: NextRequest) {
  try {
    const body: WithdrawPointsReqDto = await request.json();
    
    // 요청 데이터 검증
    if (!body.userId || !body.walletAddress || !body.amount || !body.validUntil || !body.signature) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (parseInt(body.amount) <= 0) {
      return NextResponse.json(
        { error: '금액은 0보다 커야 합니다.' },
        { status: 400 }
      );
    }

    // validUntil 검증 (현재 시간보다 미래여야 함)
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (body.validUntil <= currentTimestamp) {
      return NextResponse.json(
        { error: 'validUntil은 현재 시간보다 미래여야 합니다.' },
        { status: 400 }
      );
    }

    // 실제 백엔드 API 호출
    const endpoint = `${API_CONFIG.ENDPOINTS.USER_POINTS}/withdraw-points`;
    const response = await apiRequest<UserSwapHistoryResDto>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Withdraw points error:', error);
    
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
