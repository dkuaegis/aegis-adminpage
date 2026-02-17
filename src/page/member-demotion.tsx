import { useState } from 'react';

import Header from '../components/Header';
import Sidebar from '../components/SideBar';
import { demoteMembersForCurrentSemester } from '../api/member/post-demote-members';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { showConfirm, showError, showSuccess } from '../utils/alert';

function mapErrorMessage(errorName?: string): string {
  switch (errorName) {
    case 'INVALID_INPUT_VALUE':
      return '요청 값이 올바르지 않습니다.';
    default:
      return '요청 처리에 실패했습니다.';
  }
}

const MemberDemotionPage: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuthGuard();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastDemotedStudentIds, setLastDemotedStudentIds] = useState<string[]>([]);

  const handleDemoteMembers = async (): Promise<void> => {
    const firstConfirmed = await showConfirm(
      '위험한 작업입니다. 현재 학기 회비 미납 회원을 게스트로 강등하시겠습니까?',
    );
    if (!firstConfirmed) {
      return;
    }

    const secondConfirmed = await showConfirm(
      '최종 확인: 강등 작업은 즉시 반영되며 되돌리기 어렵습니다. 정말 실행하시겠습니까?',
    );
    if (!secondConfirmed) {
      return;
    }

    setIsSubmitting(true);
    const response = await demoteMembersForCurrentSemester();

    if (!response.ok || !response.data) {
      showError(mapErrorMessage(response.errorName));
      setIsSubmitting(false);
      return;
    }

    const demotedIds = response.data.demotedMemberStudentIds ?? [];
    setLastDemotedStudentIds(demotedIds);

    if (demotedIds.length === 0) {
      showSuccess('강등 대상 회원이 없습니다.');
    } else {
      showSuccess(`${demotedIds.length}명의 회원을 강등했습니다.`);
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="flex min-h-screen pt-[85px]">
        <Sidebar />
        <div className="flex-1 py-8 px-8 ml-60">
          <div className="w-full max-w-[1120px] mx-auto flex flex-col gap-5">
            <section className="bg-white rounded-[12px] p-5 flex flex-col gap-2">
              <h1 className="font-size-24px font-weight-700">회원 강등</h1>
              <p className="font-size-16px color-gray-60">
                현재 학기 회비 미납 회원을 게스트(ROLE_GUEST)로 강등합니다.
              </p>
              <p className="font-size-16px color-gray-60">
                관리자(ROLE_ADMIN)는 강등 대상에서 제외됩니다.
              </p>
            </section>

            <section className="bg-white rounded-[12px] p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-size-20px font-weight-600">강등 실행</h2>
                  <p className="font-size-16px color-gray-60">
                    실행 시 되돌리기 어렵습니다. 대상자 검토 후 진행하세요.
                  </p>
                </div>
                <button
                  onClick={() => {
                    void handleDemoteMembers();
                  }}
                  className="h-10 px-4 rounded-[10px] bg-black color-white cursor-pointer disabled:bg-gray-30 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '강등 실행 중...' : '회원 강등 실행'}
                </button>
              </div>

              <div className="font-size-16px color-gray-60 leading-7">
                <div>
                  마지막 강등 인원: <span className="color-black">{lastDemotedStudentIds.length}명</span>
                </div>
                <div className="break-all">
                  마지막 강등 학번:
                  <span className="color-black ml-2">
                    {lastDemotedStudentIds.length > 0 ? lastDemotedStudentIds.join(', ') : '-'}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default MemberDemotionPage;
