import { NextRequest, NextResponse } from 'next/server';
import { GrantHistoryListResDto } from '../grant/dto';
import { apiRequest, API_CONFIG } from '../../../../../../utils/api-config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userPointId: string }> }
) {
  try {
    const resolvedParams = await params;
    const userPointId = parseInt(resolvedParams.userPointId);
    const { searchParams } = new URL(request.url);
    
    if (isNaN(userPointId)) {
      return NextResponse.json(
        { error: '유효하지 않은 userPointId입니다.' },
        { status: 400 }
      );
    }

    // 쿼리 파라미터 구성
    const queryParams = new URLSearchParams();
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    
    if (type) queryParams.append('type', type);
    if (status) queryParams.append('status', status);
    // TODO: 페이지네이션 파라미터들도 추가 가능
    // const lastId = searchParams.get('lastId');
    // const limit = searchParams.get('limit');
    // const offset = searchParams.get('offset');
    // const order = searchParams.get('order');

    // 실제 백엔드 API 호출
    const endpoint = `${API_CONFIG.ENDPOINTS.USER_POINTS}/${userPointId}/grant-histories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest<GrantHistoryListResDto>(endpoint);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get grant histories error:', error);
    
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
