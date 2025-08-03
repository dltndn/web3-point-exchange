import { NextRequest, NextResponse } from 'next/server';
import { UserSwapHistoryResDto } from '../dto';
import { apiRequest, API_CONFIG } from '../../../../../utils/api-config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userSwapHistoryId: string }> }
) {
  try {
    const resolvedParams = await params;
    const userSwapHistoryId = resolvedParams.userSwapHistoryId;
    
    if (!userSwapHistoryId) {
      return NextResponse.json(
        { error: 'userSwapHistoryId는 필수입니다.' },
        { status: 400 }
      );
    }

    // 실제 백엔드 API 호출
    const endpoint = `${API_CONFIG.ENDPOINTS.USER_SWAP_HISTORIES}/${userSwapHistoryId}`;
    const response = await apiRequest<UserSwapHistoryResDto>(endpoint);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get user swap history error:', error);
    
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 