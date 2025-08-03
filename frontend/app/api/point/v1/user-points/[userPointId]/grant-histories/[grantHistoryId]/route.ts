import { NextRequest, NextResponse } from 'next/server';
import { GrantHistoryResDto } from '../../grant/dto';
import { apiRequest, API_CONFIG } from '../../../../../../../utils/api-config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userPointId: string; grantHistoryId: string }> }
) {
  try {
    const resolvedParams = await params;
    const userPointId = parseInt(resolvedParams.userPointId);
    const grantHistoryId = resolvedParams.grantHistoryId;
    
    if (isNaN(userPointId)) {
      return NextResponse.json(
        { error: '유효하지 않은 userPointId입니다.' },
        { status: 400 }
      );
    }

    if (!grantHistoryId) {
      return NextResponse.json(
        { error: 'grantHistoryId는 필수입니다.' },
        { status: 400 }
      );
    }

    // 실제 백엔드 API 호출
    const endpoint = `${API_CONFIG.ENDPOINTS.USER_POINTS}/${userPointId}/grant-histories/${grantHistoryId}`;
    const response = await apiRequest<GrantHistoryResDto>(endpoint);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get grant history error:', error);
    
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 