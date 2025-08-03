import { NextRequest, NextResponse } from 'next/server';
import { apiRequest, API_CONFIG } from '../../../../../utils/api-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // userId 검증
    if (!userId) {
      return NextResponse.json(
        { error: 'userId는 필수 파라미터입니다.' },
        { status: 400 }
      );
    }

    // UUID 형식 검증 (간단한 형태)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: '유효하지 않은 userId 형식입니다.' },
        { status: 400 }
      );
    }

    // 실제 백엔드 API 호출
    const endpoint = `${API_CONFIG.ENDPOINTS.USER_POINTS}/balance?userId=${encodeURIComponent(userId)}`;
    const balance = await apiRequest<string>(endpoint);

    return NextResponse.json(balance, { status: 200 });
  } catch (error) {
    console.error('Get balance error:', error);
    
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
