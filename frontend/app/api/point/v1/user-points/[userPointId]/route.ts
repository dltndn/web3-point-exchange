import { NextRequest, NextResponse } from 'next/server';
import { UserPointResDto } from '../dto';
import { apiRequest, API_CONFIG } from '../../../../../utils/api-config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userPointId: string }> }
) {
  try {
    const resolvedParams = await params;
    const userPointId = parseInt(resolvedParams.userPointId);
    
    if (isNaN(userPointId)) {
      return NextResponse.json(
        { error: '유효하지 않은 userPointId입니다.' },
        { status: 400 }
      );
    }

    // 실제 백엔드 API 호출
    const endpoint = `${API_CONFIG.ENDPOINTS.USER_POINTS}/${userPointId}`;
    const response = await apiRequest<UserPointResDto>(endpoint);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get user point error:', error);
    
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 