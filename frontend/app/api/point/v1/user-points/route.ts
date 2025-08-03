import { NextRequest, NextResponse } from 'next/server';
import { UserPointReqDto, UserPointResDto, UserPointListResDto } from './dto';
import { apiRequest, API_CONFIG } from '../../../../utils/api-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // 쿼리 파라미터 구성
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('userId', userId);
    
    const endpoint = `${API_CONFIG.ENDPOINTS.USER_POINTS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    // 실제 백엔드 API 호출
    const response = await apiRequest<UserPointListResDto>(endpoint);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Get user points error:', error);
    
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: UserPointReqDto = await request.json();
    
    // 요청 데이터 검증
    if (!body.userId) {
      return NextResponse.json(
        { error: 'userId는 필수입니다.' },
        { status: 400 }
      );
    }

    // 실제 백엔드 API 호출
    const response = await apiRequest<UserPointResDto>(API_CONFIG.ENDPOINTS.USER_POINTS, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Create user point error:', error);
    
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
