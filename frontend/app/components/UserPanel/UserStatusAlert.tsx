'use client';

import { useUser } from '../hooks/useUser';
import Alert from '../common/Alert';

export default function UserStatusAlert() {
  const { status, userError } = useUser();

  // 성공 메시지
  if (status.success) {
    return (
      <Alert
        type="success"
        title="사용자 생성 완료"
        message="새로운 사용자가 성공적으로 생성되었습니다. 이제 포인트 시스템을 이용할 수 있습니다."
        onClose={() => {
          // 필요시 성공 상태 초기화
        }}
      />
    );
  }

  // 에러 메시지
  if (status.error) {
    return (
      <Alert
        type="error"
        title="사용자 생성 실패"
        message={status.error}
        onClose={() => {
          // 필요시 에러 상태 초기화
        }}
      />
    );
  }

  // 사용자 조회 에러
  if (userError) {
    return (
      <Alert
        type="error"
        title="사용자 정보 조회 실패"
        message={userError instanceof Error ? userError.message : '사용자 정보를 불러올 수 없습니다.'}
        onClose={() => {
          // 필요시 에러 상태 초기화
        }}
      />
    );
  }

  // 로딩 중
  if (status.isLoading) {
    return (
      <Alert
        type="info"
        title="처리 중"
        message="사용자 생성 중입니다. 잠시만 기다려주세요..."
      />
    );
  }

  return null;
}
