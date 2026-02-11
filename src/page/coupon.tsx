import { useEffect, useMemo, useState } from 'react';

import Header from '../components/Header';
import Sidebar from '../components/SideBar';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { showError, showSuccess, showWarning } from '../utils/alert';

import { getCoupons } from '../api/coupon/get-coupons';
import { createCoupon } from '../api/coupon/post-coupon';
import { updateCouponName } from '../api/coupon/patch-coupon-name';
import { deleteCoupon } from '../api/coupon/delete-coupon';
import { getCouponCodes } from '../api/coupon/get-coupon-codes';
import { createCouponCode } from '../api/coupon/post-coupon-code';
import { deleteCouponCode } from '../api/coupon/delete-coupon-code';
import { getIssuedCoupons } from '../api/coupon/get-issued-coupons';
import { createIssuedCoupons } from '../api/coupon/post-issued-coupons';
import { deleteIssuedCoupon } from '../api/coupon/delete-issued-coupon';
import { getAdminMembers } from '../api/coupon/get-admin-members';

import type {
  AdminCoupon,
  AdminCouponCode,
  AdminIssuedCoupon,
  AdminMemberSummary,
} from '../api/coupon/types';

type CouponTab = 'coupon' | 'code' | 'issued';

function mapErrorMessage(errorName?: string): string {
  switch (errorName) {
    case 'COUPON_ALREADY_EXISTS':
      return '동일한 이름과 할인 금액을 가진 쿠폰이 이미 존재합니다.';
    case 'COUPON_NOT_FOUND':
      return '쿠폰을 찾을 수 없습니다.';
    case 'COUPON_ISSUED_COUPON_EXISTS':
      return '발급된 쿠폰이 남아 있어 쿠폰을 삭제할 수 없습니다.';
    case 'COUPON_CODE_ALREADY_USED_CANNOT_DELETE':
      return '이미 사용된 쿠폰 코드는 삭제할 수 없습니다.';
    case 'ISSUED_COUPON_ALREADY_USED':
      return '이미 사용된 쿠폰 발급 내역은 삭제할 수 없습니다.';
    case 'COUPON_CODE_CANNOT_ISSUE_CODE':
      return '쿠폰 코드 생성에 실패했습니다. 잠시 후 다시 시도해주세요.';
    default:
      return '요청 처리에 실패했습니다.';
  }
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return parsed.toLocaleString('ko-KR', {
    hour12: false,
  });
}

const CouponPage: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuthGuard();

  const [tab, setTab] = useState<CouponTab>('coupon');
  const [isDataLoading, setIsDataLoading] = useState(false);

  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [couponCodes, setCouponCodes] = useState<AdminCouponCode[]>([]);
  const [issuedCoupons, setIssuedCoupons] = useState<AdminIssuedCoupon[]>([]);
  const [members, setMembers] = useState<AdminMemberSummary[]>([]);

  const [searchText, setSearchText] = useState('');
  const [memberSearchText, setMemberSearchText] = useState('');

  const [newCouponName, setNewCouponName] = useState('');
  const [newDiscountAmount, setNewDiscountAmount] = useState('5000');

  const [couponNameDrafts, setCouponNameDrafts] = useState<Record<number, string>>({});

  const [selectedCouponIdForCode, setSelectedCouponIdForCode] = useState<number>(0);
  const [newCouponCodeDescription, setNewCouponCodeDescription] = useState('');
  const [selectedCouponIdForIssue, setSelectedCouponIdForIssue] = useState<number>(0);
  const [selectedMemberIdsForIssue, setSelectedMemberIdsForIssue] = useState<number[]>([]);

  const loadAll = async (): Promise<void> => {
    setIsDataLoading(true);
    const [couponsRes, codesRes, issuedRes, membersRes] = await Promise.all([
      getCoupons(),
      getCouponCodes(),
      getIssuedCoupons(),
      getAdminMembers(),
    ]);

    if (couponsRes.ok && couponsRes.data) {
      const orderedCoupons = [...couponsRes.data].sort((a, b) => a.couponId - b.couponId);
      setCoupons(orderedCoupons);
      setCouponNameDrafts((prevDrafts) => {
        const nextDrafts: Record<number, string> = {};
        orderedCoupons.forEach((coupon) => {
          nextDrafts[coupon.couponId] = prevDrafts[coupon.couponId] ?? coupon.couponName;
        });
        return nextDrafts;
      });
    } else {
      showError(mapErrorMessage(couponsRes.errorName));
    }

    if (codesRes.ok && codesRes.data) {
      setCouponCodes([...codesRes.data].sort((a, b) => a.codeCouponId - b.codeCouponId));
    } else {
      showError(mapErrorMessage(codesRes.errorName));
    }

    if (issuedRes.ok && issuedRes.data) {
      setIssuedCoupons([...issuedRes.data].sort((a, b) => a.issuedCouponId - b.issuedCouponId));
    } else {
      showError(mapErrorMessage(issuedRes.errorName));
    }

    if (membersRes.ok && membersRes.data) {
      setMembers([...membersRes.data].sort((a, b) => a.memberId - b.memberId));
    } else {
      showError('회원 목록을 가져오지 못했습니다.');
    }

    setIsDataLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    void loadAll();
  }, [isAuthenticated]);

  useEffect(() => {
    if (coupons.length === 0) {
      setSelectedCouponIdForCode(0);
      setSelectedCouponIdForIssue(0);
      return;
    }

    if (!coupons.some((coupon) => coupon.couponId === selectedCouponIdForCode)) {
      setSelectedCouponIdForCode(coupons[0].couponId);
    }

    if (!coupons.some((coupon) => coupon.couponId === selectedCouponIdForIssue)) {
      setSelectedCouponIdForIssue(coupons[0].couponId);
    }
  }, [coupons, selectedCouponIdForCode, selectedCouponIdForIssue]);

  const keyword = searchText.trim().toLowerCase();

  const filteredCoupons = useMemo(() => {
    if (!keyword) {
      return coupons;
    }

    return coupons.filter((coupon) => {
      return (
        coupon.couponName.toLowerCase().includes(keyword)
        || String(coupon.couponId).includes(keyword)
        || String(coupon.discountAmount).includes(keyword)
      );
    });
  }, [coupons, keyword]);

  const filteredCouponCodes = useMemo(() => {
    if (!keyword) {
      return couponCodes;
    }

    return couponCodes.filter((couponCode) => {
      return (
        couponCode.couponName.toLowerCase().includes(keyword)
        || couponCode.code.toLowerCase().includes(keyword)
        || (couponCode.description ?? '').toLowerCase().includes(keyword)
        || String(couponCode.codeCouponId).includes(keyword)
        || String(couponCode.couponId).includes(keyword)
      );
    });
  }, [couponCodes, keyword]);

  const studentIdByMemberId = useMemo(() => {
    return new Map(
      members.map((member) => [member.memberId, member.studentId?.toLowerCase() ?? '']),
    );
  }, [members]);

  const filteredIssuedCoupons = useMemo(() => {
    if (!keyword) {
      return issuedCoupons;
    }

    return issuedCoupons.filter((issuedCoupon) => {
      const studentId = studentIdByMemberId.get(issuedCoupon.memberId) ?? '';
      return (
        issuedCoupon.couponName.toLowerCase().includes(keyword)
        || issuedCoupon.memberName.toLowerCase().includes(keyword)
        || issuedCoupon.memberEmail.toLowerCase().includes(keyword)
        || studentId.includes(keyword)
        || String(issuedCoupon.issuedCouponId).includes(keyword)
        || String(issuedCoupon.memberId).includes(keyword)
      );
    });
  }, [issuedCoupons, keyword, studentIdByMemberId]);

  const memberKeyword = memberSearchText.trim().toLowerCase();

  const filteredMembersForIssue = useMemo(() => {
    if (!memberKeyword) {
      return members;
    }

    return members.filter((member) => {
      return (
        member.name.toLowerCase().includes(memberKeyword)
        || member.email.toLowerCase().includes(memberKeyword)
        || (member.studentId ?? '').toLowerCase().includes(memberKeyword)
        || member.role.toLowerCase().includes(memberKeyword)
        || String(member.memberId).includes(memberKeyword)
      );
    });
  }, [members, memberKeyword]);

  const selectedMemberIdSet = useMemo(() => {
    return new Set(selectedMemberIdsForIssue);
  }, [selectedMemberIdsForIssue]);

  const filteredMemberIdSet = useMemo(() => {
    return new Set(filteredMembersForIssue.map((member) => member.memberId));
  }, [filteredMembersForIssue]);

  const isAllFilteredMembersSelected = filteredMembersForIssue.length > 0
    && filteredMembersForIssue.every((member) => selectedMemberIdSet.has(member.memberId));

  const handleCreateCoupon = async (): Promise<void> => {
    if (!newCouponName.trim()) {
      showError('쿠폰 이름을 입력해주세요.');
      return;
    }

    const parsedDiscountAmount = Number(newDiscountAmount);
    if (!Number.isFinite(parsedDiscountAmount) || parsedDiscountAmount <= 0) {
      showError('할인 금액은 0보다 커야 합니다.');
      return;
    }

    const response = await createCoupon(newCouponName, parsedDiscountAmount);
    if (!response.ok) {
      showError(mapErrorMessage(response.errorName));
      return;
    }

    showSuccess('쿠폰을 생성했습니다.');
    setNewCouponName('');
    await loadAll();
  };

  const handleUpdateCouponName = async (couponId: number): Promise<void> => {
    const draftName = couponNameDrafts[couponId] ?? '';
    if (!draftName.trim()) {
      showError('쿠폰 이름을 입력해주세요.');
      return;
    }

    const response = await updateCouponName(couponId, draftName);
    if (!response.ok) {
      showError(mapErrorMessage(response.errorName));
      return;
    }

    showSuccess('쿠폰 이름을 수정했습니다.');
    await loadAll();
  };

  const handleDeleteCoupon = async (couponId: number): Promise<void> => {
    const confirmed = await showWarning('쿠폰을 삭제하시겠습니까?');
    if (!confirmed) {
      return;
    }

    const response = await deleteCoupon(couponId);
    if (!response.ok) {
      showError(mapErrorMessage(response.errorName));
      return;
    }

    showSuccess('쿠폰을 삭제했습니다.');
    await loadAll();
  };

  const handleCreateCouponCode = async (): Promise<void> => {
    if (!selectedCouponIdForCode) {
      showError('코드를 생성할 쿠폰을 선택해주세요.');
      return;
    }

    const normalizedDescription = newCouponCodeDescription.trim() || null;
    const response = await createCouponCode(selectedCouponIdForCode, normalizedDescription);
    if (!response.ok) {
      showError(mapErrorMessage(response.errorName));
      return;
    }

    showSuccess('쿠폰 코드를 생성했습니다.');
    setNewCouponCodeDescription('');
    await loadAll();
  };

  const handleDeleteCouponCode = async (codeCouponId: number): Promise<void> => {
    const confirmed = await showWarning('쿠폰 코드를 삭제하시겠습니까?');
    if (!confirmed) {
      return;
    }

    const response = await deleteCouponCode(codeCouponId);
    if (!response.ok) {
      showError(mapErrorMessage(response.errorName));
      return;
    }

    showSuccess('쿠폰 코드를 삭제했습니다.');
    await loadAll();
  };

  const handleCreateIssuedCoupons = async (): Promise<void> => {
    if (!selectedCouponIdForIssue) {
      showError('발급할 쿠폰을 선택해주세요.');
      return;
    }

    if (selectedMemberIdsForIssue.length === 0) {
      showError('발급할 회원을 선택해주세요.');
      return;
    }

    const response = await createIssuedCoupons(selectedCouponIdForIssue, selectedMemberIdsForIssue);
    if (!response.ok) {
      showError(mapErrorMessage(response.errorName));
      return;
    }

    showSuccess(`${response.data?.length ?? 0}건의 쿠폰 발급을 완료했습니다.`);
    setSelectedMemberIdsForIssue([]);
    await loadAll();
  };

  const handleDeleteIssuedCoupon = async (issuedCouponId: number): Promise<void> => {
    const confirmed = await showWarning('발급된 쿠폰을 삭제하시겠습니까?');
    if (!confirmed) {
      return;
    }

    const response = await deleteIssuedCoupon(issuedCouponId);
    if (!response.ok) {
      showError(mapErrorMessage(response.errorName));
      return;
    }

    showSuccess('발급된 쿠폰을 삭제했습니다.');
    await loadAll();
  };

  const handleToggleMemberForIssue = (memberId: number): void => {
    setSelectedMemberIdsForIssue((prevIds) => {
      if (prevIds.includes(memberId)) {
        return prevIds.filter((id) => id !== memberId);
      }

      return [...prevIds, memberId];
    });
  };

  const handleSelectAllFilteredMembers = (): void => {
    setSelectedMemberIdsForIssue((prevIds) => {
      const nextIds = new Set(prevIds);
      filteredMembersForIssue.forEach((member) => {
        nextIds.add(member.memberId);
      });

      return Array.from(nextIds);
    });
  };

  const handleClearAllSelectedMembers = (): void => {
    setSelectedMemberIdsForIssue([]);
  };

  const handleClearFilteredMembers = (): void => {
    setSelectedMemberIdsForIssue((prevIds) => {
      return prevIds.filter((memberId) => !filteredMemberIdSet.has(memberId));
    });
  };

  const renderActionPanel = (): React.ReactNode => {
    if (tab === 'coupon') {
      return (
        <div className="flex flex-wrap items-end gap-3 p-4 rounded-[12px] bg-white">
          <div className="flex flex-col gap-1 min-w-[220px]">
            <label className="font-size-16px font-weight-500">쿠폰 이름</label>
            <input
              value={newCouponName}
              onChange={(event) => setNewCouponName(event.target.value)}
              placeholder="예) 2026 신입생 환영 쿠폰"
              className="h-10 px-3 border border-gray-30 rounded-[10px]"
            />
          </div>
          <div className="flex flex-col gap-1 w-[200px]">
            <label className="font-size-16px font-weight-500">할인 금액</label>
            <input
              type="number"
              min={1}
              value={newDiscountAmount}
              onChange={(event) => setNewDiscountAmount(event.target.value)}
              className="h-10 px-3 border border-gray-30 rounded-[10px]"
            />
          </div>
          <button
            onClick={() => {
              void handleCreateCoupon();
            }}
            className="h-10 px-4 rounded-[10px] bg-black color-white cursor-pointer"
          >
            쿠폰 생성
          </button>
        </div>
      );
    }

    if (tab === 'code') {
      return (
        <div className="flex flex-wrap items-end gap-3 p-4 rounded-[12px] bg-white">
          <div className="flex flex-col gap-1 min-w-[260px]">
            <label className="font-size-16px font-weight-500">코드 생성 대상 쿠폰</label>
            <select
              value={selectedCouponIdForCode}
              onChange={(event) => setSelectedCouponIdForCode(Number(event.target.value))}
              className="h-10 px-3 border border-gray-30 rounded-[10px]"
            >
              {coupons.map((coupon) => (
                <option key={coupon.couponId} value={coupon.couponId}>
                  [{coupon.couponId}] {coupon.couponName} ({Number(coupon.discountAmount).toLocaleString('ko-KR')}원)
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[340px]">
            <label className="font-size-16px font-weight-500">설명 (선택)</label>
            <input
              value={newCouponCodeDescription}
              onChange={(event) => setNewCouponCodeDescription(event.target.value)}
              placeholder="예) 26학번 단톡방 공지용 / 운영진 DM 전달"
              maxLength={255}
              className="h-10 px-3 border border-gray-30 rounded-[10px]"
            />
          </div>
          <button
            onClick={() => {
              void handleCreateCouponCode();
            }}
            className="h-10 px-4 rounded-[10px] bg-black color-white cursor-pointer"
          >
            코드 생성
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3 p-4 rounded-[12px] bg-white">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 min-w-[280px]">
            <label className="font-size-16px font-weight-500">발급할 쿠폰</label>
            <select
              value={selectedCouponIdForIssue}
              onChange={(event) => setSelectedCouponIdForIssue(Number(event.target.value))}
              className="h-10 px-3 border border-gray-30 rounded-[10px]"
            >
              {coupons.map((coupon) => (
                <option key={coupon.couponId} value={coupon.couponId}>
                  [{coupon.couponId}] {coupon.couponName} ({Number(coupon.discountAmount).toLocaleString('ko-KR')}원)
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              void handleCreateIssuedCoupons();
            }}
            className="h-10 px-4 rounded-[10px] bg-black color-white cursor-pointer"
          >
            선택 회원 쿠폰 발급
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-size-16px font-weight-500">발급 대상 회원</label>
          <input
            value={memberSearchText}
            onChange={(event) => setMemberSearchText(event.target.value)}
            placeholder="회원 ID, 이름, 학번, 이메일, 권한 검색"
            className="h-10 px-3 border border-gray-30 rounded-[10px]"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSelectAllFilteredMembers}
              className="h-9 px-3 rounded-[10px] bg-blue-100 text-blue-700 cursor-pointer disabled:bg-gray-20 disabled:text-gray-60"
              disabled={filteredMembersForIssue.length === 0 || isAllFilteredMembersSelected}
            >
              검색 결과 전체 선택
            </button>
            <button
              onClick={handleClearFilteredMembers}
              className="h-9 px-3 rounded-[10px] bg-gray-20 color-black cursor-pointer disabled:text-gray-60"
              disabled={filteredMembersForIssue.length === 0}
            >
              검색 결과 선택 해제
            </button>
            <button
              onClick={handleClearAllSelectedMembers}
              className="h-9 px-3 rounded-[10px] bg-gray-20 color-black cursor-pointer disabled:text-gray-60"
              disabled={selectedMemberIdsForIssue.length === 0}
            >
              전체 선택 해제
            </button>
            <span className="font-size-14px color-gray-60">
              총 {filteredMembersForIssue.length}명 중 {selectedMemberIdsForIssue.length}명 선택
            </span>
          </div>

          <div className="h-[220px] p-2 border border-gray-30 rounded-[10px] overflow-auto bg-white">
            {filteredMembersForIssue.length === 0 ? (
              <div className="h-full flex items-center justify-center color-gray-60 font-size-14px">
                검색 조건에 맞는 회원이 없습니다.
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredMembersForIssue.map((member) => (
                  <label
                    key={member.memberId}
                    className="flex items-start gap-2 px-2 py-1 rounded-[8px] hover:bg-gray-10 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMemberIdSet.has(member.memberId)}
                      onChange={() => {
                        handleToggleMemberForIssue(member.memberId);
                      }}
                      className="mt-[2px]"
                    />
                    <span className="font-size-14px leading-5">
                      [{member.memberId}] {member.name} ({member.studentId ?? '학번 미입력'}, {member.email}) - {member.role}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTable = (): React.ReactNode => {
    if (tab === 'coupon') {
      return (
        <section className="w-full rounded-[12px] bg-white overflow-hidden">
          <div className="grid grid-cols-[120px_1fr_180px_260px_110px] h-[50px] table-header border-b border-gray-30">
            <div className="flex items-center justify-center">ID</div>
            <div className="flex items-center justify-center">쿠폰 이름</div>
            <div className="flex items-center justify-center">할인 금액</div>
            <div className="flex items-center justify-center">이름 수정</div>
            <div className="flex items-center justify-center">삭제</div>
          </div>
          <div className="max-h-[480px] overflow-auto">
            {filteredCoupons.map((coupon) => (
              <div
                key={coupon.couponId}
                className="grid grid-cols-[120px_1fr_180px_260px_110px] h-[56px] table-data border-b border-gray-20"
              >
                <div className="flex items-center justify-center">{coupon.couponId}</div>
                <div className="flex items-center justify-center px-4">{coupon.couponName}</div>
                <div className="flex items-center justify-center">{Number(coupon.discountAmount).toLocaleString('ko-KR')}원</div>
                <div className="flex items-center justify-center gap-2 px-2">
                  <input
                    value={couponNameDrafts[coupon.couponId] ?? coupon.couponName}
                    onChange={(event) => {
                      setCouponNameDrafts((prev) => ({
                        ...prev,
                        [coupon.couponId]: event.target.value,
                      }));
                    }}
                    className="h-9 px-2 border border-gray-30 rounded-[10px] w-[160px]"
                  />
                  <button
                    onClick={() => {
                      void handleUpdateCouponName(coupon.couponId);
                    }}
                    className="h-9 px-3 rounded-[10px] bg-blue-100 text-blue-700 cursor-pointer"
                  >
                    저장
                  </button>
                </div>
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => {
                      void handleDeleteCoupon(coupon.couponId);
                    }}
                    className="h-9 px-3 rounded-[10px] bg-red-100 text-red-600 cursor-pointer"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (tab === 'code') {
      return (
        <section className="w-full rounded-[12px] bg-white overflow-hidden">
          <div className="grid grid-cols-[120px_120px_1fr_220px_200px_140px_110px] h-[50px] table-header border-b border-gray-30">
            <div className="flex items-center justify-center">코드 ID</div>
            <div className="flex items-center justify-center">쿠폰 ID</div>
            <div className="flex items-center justify-center">코드</div>
            <div className="flex items-center justify-center">설명</div>
            <div className="flex items-center justify-center">상태</div>
            <div className="flex items-center justify-center">사용 시각</div>
            <div className="flex items-center justify-center">삭제</div>
          </div>
          <div className="max-h-[480px] overflow-auto">
            {filteredCouponCodes.map((couponCode) => (
              <div
                key={couponCode.codeCouponId}
                className="grid grid-cols-[120px_120px_1fr_220px_200px_140px_110px] h-[56px] table-data border-b border-gray-20"
              >
                <div className="flex items-center justify-center">{couponCode.codeCouponId}</div>
                <div className="flex items-center justify-center">{couponCode.couponId}</div>
                <div className="flex items-center justify-center px-3">{couponCode.code}</div>
                <div className="flex items-center px-3 truncate" title={couponCode.description ?? ''}>
                  {couponCode.description ?? '-'}
                </div>
                <div className="flex items-center justify-center">
                  {couponCode.isValid ? '사용 가능' : `사용 완료 (${couponCode.couponName})`}
                </div>
                <div className="flex items-center justify-center text-[14px]">{formatDateTime(couponCode.usedAt)}</div>
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => {
                      void handleDeleteCouponCode(couponCode.codeCouponId);
                    }}
                    className="h-9 px-3 rounded-[10px] bg-red-100 text-red-600 cursor-pointer disabled:bg-gray-20 disabled:text-gray-60"
                    disabled={!couponCode.isValid}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    return (
      <section className="w-full rounded-[12px] bg-white overflow-hidden">
        <div className="grid grid-cols-[110px_1fr_1fr_100px_120px_140px_110px] h-[50px] table-header border-b border-gray-30">
          <div className="flex items-center justify-center">발급 ID</div>
          <div className="flex items-center justify-center">쿠폰</div>
          <div className="flex items-center justify-center">회원</div>
          <div className="flex items-center justify-center">상태</div>
          <div className="flex items-center justify-center">결제 ID</div>
          <div className="flex items-center justify-center">사용 시각</div>
          <div className="flex items-center justify-center">삭제</div>
        </div>
        <div className="max-h-[480px] overflow-auto">
          {filteredIssuedCoupons.map((issuedCoupon) => (
            <div
              key={issuedCoupon.issuedCouponId}
              className="grid grid-cols-[110px_1fr_1fr_100px_120px_140px_110px] h-[56px] table-data border-b border-gray-20"
            >
              <div className="flex items-center justify-center">{issuedCoupon.issuedCouponId}</div>
              <div className="flex items-center justify-center px-3 text-center">
                [{issuedCoupon.couponId}] {issuedCoupon.couponName} ({Number(issuedCoupon.discountAmount).toLocaleString('ko-KR')}원)
              </div>
              <div className="flex flex-col items-center justify-center text-[14px] leading-4 px-3">
                <div>
                  [{issuedCoupon.memberId}] {issuedCoupon.memberName}
                </div>
                <div className="color-gray-60">{issuedCoupon.memberEmail}</div>
              </div>
              <div className="flex items-center justify-center">{issuedCoupon.isValid ? '미사용' : '사용됨'}</div>
              <div className="flex items-center justify-center">{issuedCoupon.paymentId ?? '-'}</div>
              <div className="flex items-center justify-center text-[14px]">{formatDateTime(issuedCoupon.usedAt)}</div>
              <div className="flex items-center justify-center">
                <button
                  onClick={() => {
                    void handleDeleteIssuedCoupon(issuedCoupon.issuedCouponId);
                  }}
                  className="h-9 px-3 rounded-[10px] bg-red-100 text-red-600 cursor-pointer disabled:bg-gray-20 disabled:text-gray-60"
                  disabled={!issuedCoupon.isValid}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderEmpty = (rows: unknown[]): React.ReactNode => {
    if (rows.length > 0) {
      return null;
    }

    return (
      <div className="w-full h-[120px] rounded-[12px] bg-white flex items-center justify-center color-gray-60 font-size-18px">
        조건에 맞는 데이터가 없습니다.
      </div>
    );
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

  const currentRows = tab === 'coupon'
    ? filteredCoupons
    : tab === 'code'
      ? filteredCouponCodes
      : filteredIssuedCoupons;

  return (
    <>
      <Header />
      <div className="flex min-h-screen pt-[85px]">
        <Sidebar />
        <div className="flex-1 flex flex-col py-6 px-8 ml-60 gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-2">
              <h1 className="font-size-32px font-weight-700 color-black">쿠폰 관리</h1>
              <p className="font-size-16px color-gray-60">쿠폰, 쿠폰 코드, 발급된 쿠폰을 한 화면에서 관리합니다.</p>
            </div>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="ID, 쿠폰명, 회원명, 학번, 이메일, 코드, 설명 검색"
              className="h-10 w-[360px] px-3 border border-gray-30 rounded-[10px] bg-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTab('coupon')}
              className={`h-10 px-4 rounded-[10px] cursor-pointer ${tab === 'coupon' ? 'bg-black color-white' : 'bg-white color-black border border-gray-30'}`}
            >
              쿠폰
            </button>
            <button
              onClick={() => setTab('code')}
              className={`h-10 px-4 rounded-[10px] cursor-pointer ${tab === 'code' ? 'bg-black color-white' : 'bg-white color-black border border-gray-30'}`}
            >
              쿠폰 코드
            </button>
            <button
              onClick={() => setTab('issued')}
              className={`h-10 px-4 rounded-[10px] cursor-pointer ${tab === 'issued' ? 'bg-black color-white' : 'bg-white color-black border border-gray-30'}`}
            >
              발급된 쿠폰
            </button>
          </div>

          {renderActionPanel()}

          {isDataLoading ? (
            <div className="w-full h-[280px] rounded-[12px] bg-white flex items-center justify-center color-gray-60 font-size-18px">
              데이터를 불러오는 중입니다.
            </div>
          ) : (
            <>
              {renderTable()}
              {renderEmpty(currentRows)}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CouponPage;
