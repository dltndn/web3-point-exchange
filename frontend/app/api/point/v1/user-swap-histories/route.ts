import { NextRequest, NextResponse } from 'next/server';
import { UserSwapHistoryListResDto } from './dto';
import { apiRequest, API_CONFIG } from '../../../../utils/api-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 쿼리 파라미터 구성
    const queryParams = new URLSearchParams();
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    
    if (userId) queryParams.append('userId', userId);
    if (type) queryParams.append('type', type);
    if (status) queryParams.append('status', status);
    // TODO: 페이지네이션 파라미터들도 추가 가능
    // const lastId = searchParams.get('lastId');
    // const limit = searchParams.get('limit');
    // const offset = searchParams.get('offset');
    // const order = searchParams.get('order');

    // 실제 백엔드 API 호출
    const endpoint = `${API_CONFIG.ENDPOINTS.USER_SWAP_HISTORIES}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest<UserSwapHistoryListResDto>(endpoint);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get user swap histories error:', error);
    
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
