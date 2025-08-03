import { NextRequest, NextResponse } from 'next/server';
import { DepositPointsReqDto } from './dto';
import { UserSwapHistoryResDto } from '../../user-swap-histories/dto';
import { apiRequest, API_CONFIG } from '../../../../../utils/api-config';

export async function POST(request: NextRequest) {
  try {
    const body: DepositPointsReqDto = await request.json();
    
    // 요청 데이터 검증
    if (!body.userId || !body.walletAddress || !body.amount) {
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

    // 실제 백엔드 API 호출
    const endpoint = `${API_CONFIG.ENDPOINTS.USER_POINTS}/deposit-points`;
    const response = await apiRequest<UserSwapHistoryResDto>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Deposit points error:', error);
    
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
