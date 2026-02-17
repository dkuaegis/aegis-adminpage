import { useEffect, useState } from 'react';

import Header from '../components/Header';
import Sidebar from '../components/SideBar';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { showError, showSuccess } from '../utils/alert';

import { getFeatureFlags } from '../api/feature-flag/get-feature-flags';
import { updateMemberSignupFlag } from '../api/feature-flag/put-member-signup';
import { updateStudyCreationFlag } from '../api/feature-flag/put-study-creation';
import { updateStudyEnrollWindowFlag } from '../api/feature-flag/put-study-enroll-window';
import type { AdminFeatureFlags } from '../api/feature-flag/types';

function toDateTimeLocalValue(value: string | null): string {
  if (!value) {
    return '';
  }

  if (value.length >= 16) {
    return value.slice(0, 16);
  }

  return '';
}

function toRequestLocalDateTime(value: string): string {
  return value.length === 16 ? `${value}:00` : value;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('ko-KR', {
    hour12: false,
  });
}

function mapErrorMessage(errorName?: string): string {
  switch (errorName) {
    case 'INVALID_INPUT_VALUE':
      return '입력값이 올바르지 않습니다.';
    case 'INVALID_STUDY_ENROLL_WINDOW':
      return '신청 시작 시각은 종료 시각보다 빨라야 합니다.';
    default:
      return '요청 처리에 실패했습니다.';
  }
}

const FeatureFlagsPage: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuthGuard();

  const [isDataLoading, setIsDataLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [flags, setFlags] = useState<AdminFeatureFlags | null>(null);

  const [memberSignupEnabled, setMemberSignupEnabled] = useState(true);
  const [studyCreationEnabled, setStudyCreationEnabled] = useState(true);
  const [enrollOpenAt, setEnrollOpenAt] = useState('');
  const [enrollCloseAt, setEnrollCloseAt] = useState('');

  const applyFlags = (nextFlags: AdminFeatureFlags): void => {
    setFlags(nextFlags);
    setMemberSignupEnabled(nextFlags.memberSignup.enabled ?? nextFlags.memberSignup.signupAllowed);
    setStudyCreationEnabled(nextFlags.studyCreation.enabled ?? nextFlags.studyCreation.studyCreationAllowed);
    setEnrollOpenAt(toDateTimeLocalValue(nextFlags.studyEnrollWindow.openAtRaw ?? nextFlags.studyEnrollWindow.openAt));
    setEnrollCloseAt(toDateTimeLocalValue(nextFlags.studyEnrollWindow.closeAtRaw ?? nextFlags.studyEnrollWindow.closeAt));
  };

  const loadFlags = async (): Promise<void> => {
    setIsDataLoading(true);
    const response = await getFeatureFlags();

    if (!response.ok || !response.data) {
      showError(mapErrorMessage(response.errorName));
      setIsDataLoading(false);
      return;
    }

    applyFlags(response.data);
    setIsDataLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void loadFlags();
  }, [isAuthenticated]);

  const handleSaveMemberSignup = async (): Promise<void> => {
    setSavingKey('member-signup');
    const response = await updateMemberSignupFlag(memberSignupEnabled);

    if (!response.ok || !response.data) {
      showError(mapErrorMessage(response.errorName));
      setSavingKey(null);
      return;
    }

    applyFlags(response.data);
    showSuccess('회원가입 허용 플래그를 저장했습니다.');
    setSavingKey(null);
  };

  const handleSaveStudyCreation = async (): Promise<void> => {
    setSavingKey('study-creation');
    const response = await updateStudyCreationFlag(studyCreationEnabled);

    if (!response.ok || !response.data) {
      showError(mapErrorMessage(response.errorName));
      setSavingKey(null);
      return;
    }

    applyFlags(response.data);
    showSuccess('스터디 개설 허용 플래그를 저장했습니다.');
    setSavingKey(null);
  };

  const handleSaveStudyEnrollWindow = async (): Promise<void> => {
    if (!enrollOpenAt || !enrollCloseAt) {
      showError('신청 시작/종료 시각을 모두 입력해주세요.');
      return;
    }

    const openTime = new Date(enrollOpenAt).getTime();
    const closeTime = new Date(enrollCloseAt).getTime();

    if (!Number.isFinite(openTime) || !Number.isFinite(closeTime)) {
      showError('신청 기간 시각 형식이 올바르지 않습니다.');
      return;
    }

    if (openTime >= closeTime) {
      showError('신청 시작 시각은 종료 시각보다 빨라야 합니다.');
      return;
    }

    setSavingKey('study-enroll-window');
    const response = await updateStudyEnrollWindowFlag({
      openAt: toRequestLocalDateTime(enrollOpenAt),
      closeAt: toRequestLocalDateTime(enrollCloseAt),
    });

    if (!response.ok || !response.data) {
      showError(mapErrorMessage(response.errorName));
      setSavingKey(null);
      return;
    }

    applyFlags(response.data);
    showSuccess('스터디 신청 기간 플래그를 저장했습니다.');
    setSavingKey(null);
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
            <section className="bg-white rounded-[12px] p-5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h1 className="font-size-24px font-weight-700">피처 플래그 관리</h1>
                <p className="font-size-16px color-gray-60">회원가입/스터디 개설/스터디 신청 기간 운영 플래그를 관리합니다.</p>
              </div>
              <button
                onClick={() => {
                  void loadFlags();
                }}
                className="h-10 px-4 rounded-[10px] bg-gray-20 color-black cursor-pointer disabled:cursor-not-allowed"
                disabled={isDataLoading}
              >
                {isDataLoading ? '새로고침 중...' : '새로고침'}
              </button>
            </section>

            <section className="bg-white rounded-[12px] p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-size-20px font-weight-600">회원가입 허용</h2>
                  <p className="font-size-16px color-gray-60">회원가입 API 호출 허용 여부를 제어합니다.</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={memberSignupEnabled ? 'true' : 'false'}
                    onChange={(event) => setMemberSignupEnabled(event.target.value === 'true')}
                    className="h-10 px-3 border border-gray-30 rounded-[10px]"
                  >
                    <option value="true">허용</option>
                    <option value="false">차단</option>
                  </select>
                  <button
                    onClick={() => {
                      void handleSaveMemberSignup();
                    }}
                    className="h-10 px-4 rounded-[10px] bg-black color-white cursor-pointer disabled:bg-gray-30 disabled:cursor-not-allowed"
                    disabled={savingKey !== null}
                  >
                    {savingKey === 'member-signup' ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
              <div className="font-size-16px color-gray-60">
                현재 적용 상태: <span className="color-black">{flags?.memberSignup.signupAllowed ? '허용' : '차단'}</span>
                <span className="ml-3">유효성: {flags?.memberSignup.valid ? '정상' : '비정상(기본 허용 적용)'}</span>
                <span className="ml-3">원시값: {flags?.memberSignup.rawValue ?? '-'}</span>
              </div>
            </section>

            <section className="bg-white rounded-[12px] p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-size-20px font-weight-600">스터디 개설 허용</h2>
                  <p className="font-size-16px color-gray-60">스터디 개설 API 호출 허용 여부를 제어합니다.</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={studyCreationEnabled ? 'true' : 'false'}
                    onChange={(event) => setStudyCreationEnabled(event.target.value === 'true')}
                    className="h-10 px-3 border border-gray-30 rounded-[10px]"
                  >
                    <option value="true">허용</option>
                    <option value="false">차단</option>
                  </select>
                  <button
                    onClick={() => {
                      void handleSaveStudyCreation();
                    }}
                    className="h-10 px-4 rounded-[10px] bg-black color-white cursor-pointer disabled:bg-gray-30 disabled:cursor-not-allowed"
                    disabled={savingKey !== null}
                  >
                    {savingKey === 'study-creation' ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
              <div className="font-size-16px color-gray-60">
                현재 적용 상태: <span className="color-black">{flags?.studyCreation.studyCreationAllowed ? '허용' : '차단'}</span>
                <span className="ml-3">유효성: {flags?.studyCreation.valid ? '정상' : '비정상(기본 허용 적용)'}</span>
                <span className="ml-3">원시값: {flags?.studyCreation.rawValue ?? '-'}</span>
              </div>
            </section>

            <section className="bg-white rounded-[12px] p-5 flex flex-col gap-4">
              <div>
                <h2 className="font-size-20px font-weight-600">스터디 신청 기간</h2>
                <p className="font-size-16px color-gray-60">스터디 신청 가능 시작/종료 시각을 지정합니다.</p>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1 min-w-[260px]">
                  <label className="font-size-16px font-weight-500">신청 시작</label>
                  <input
                    type="datetime-local"
                    value={enrollOpenAt}
                    onChange={(event) => setEnrollOpenAt(event.target.value)}
                    className="h-10 px-3 border border-gray-30 rounded-[10px]"
                  />
                </div>
                <div className="flex flex-col gap-1 min-w-[260px]">
                  <label className="font-size-16px font-weight-500">신청 종료</label>
                  <input
                    type="datetime-local"
                    value={enrollCloseAt}
                    onChange={(event) => setEnrollCloseAt(event.target.value)}
                    className="h-10 px-3 border border-gray-30 rounded-[10px]"
                  />
                </div>
                <button
                  onClick={() => {
                    void handleSaveStudyEnrollWindow();
                  }}
                  className="h-10 px-4 rounded-[10px] bg-black color-white cursor-pointer disabled:bg-gray-30 disabled:cursor-not-allowed"
                  disabled={savingKey !== null}
                >
                  {savingKey === 'study-enroll-window' ? '저장 중...' : '저장'}
                </button>
              </div>

              <div className="font-size-16px color-gray-60 leading-7">
                <div>
                  현재 적용 시작 시각: <span className="color-black">{formatDateTime(flags?.studyEnrollWindow.openAt ?? null)}</span>
                </div>
                <div>
                  현재 적용 종료 시각: <span className="color-black">{formatDateTime(flags?.studyEnrollWindow.closeAt ?? null)}</span>
                </div>
                <div>
                  현재 신청 가능 여부: <span className="color-black">{flags?.studyEnrollWindow.enrollmentAllowedNow ? '가능' : '불가'}</span>
                </div>
                <div>
                  기간 유효성: <span className="color-black">{flags?.studyEnrollWindow.valid ? '정상' : '비정상(기본 허용 적용)'}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeatureFlagsPage;
