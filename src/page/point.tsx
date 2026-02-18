import { useEffect, useMemo, useState } from 'react';

import Header from '../components/Header';
import Sidebar from '../components/SideBar';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { showConfirm, showError, showSuccess } from '../utils/alert';

import { getPointLedger } from '../api/point/get-point-ledger';
import { getPointMember } from '../api/point/get-point-member';
import { searchPointMembers } from '../api/point/search-point-members';
import { postPointGrant } from '../api/point/post-point-grant';
import { postPointBatchGrant } from '../api/point/post-point-batch-grant';

import type {
  AdminPointBatchGrantResult,
  AdminPointLedgerPage,
  AdminPointMemberPoint,
  AdminPointMemberSearch,
  PointTransactionType,
} from '../api/point/types';

type PointTransactionFilter = 'ALL' | PointTransactionType;

function mapErrorMessage(errorName?: string): string {
  switch (errorName) {
    case 'MEMBER_NOT_FOUND':
      return '회원을 찾을 수 없습니다.';
    case 'POINT_ACCOUNT_NOT_FOUND':
      return '포인트 계정을 찾을 수 없습니다.';
    case 'POINT_ACTION_AMOUNT_NOT_POSITIVE':
      return '포인트 금액은 0보다 커야 합니다.';
    case 'BAD_REQUEST':
      return '요청 값이 올바르지 않습니다.';
    default:
      return '요청 처리에 실패했습니다.';
  }
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }
  return parsed.toLocaleString('ko-KR', { hour12: false });
}

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

const PointPage: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuthGuard();

  const [isLedgerLoading, setIsLedgerLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState<AdminPointLedgerPage | null>(null);
  const [ledgerPage, setLedgerPage] = useState(0);
  const [ledgerMemberKeyword, setLedgerMemberKeyword] = useState('');
  const [ledgerTransactionType, setLedgerTransactionType] = useState<PointTransactionFilter>('ALL');
  const [ledgerFrom, setLedgerFrom] = useState('');
  const [ledgerTo, setLedgerTo] = useState('');

  const [memberSearchKeyword, setMemberSearchKeyword] = useState('');
  const [isMemberSearchLoading, setIsMemberSearchLoading] = useState(false);
  const [memberSearchResults, setMemberSearchResults] = useState<AdminPointMemberSearch[]>([]);
  const [memberCache, setMemberCache] = useState<Record<number, AdminPointMemberSearch>>({});

  const [selectedDetailMemberId, setSelectedDetailMemberId] = useState<number | null>(null);
  const [isMemberPointLoading, setIsMemberPointLoading] = useState(false);
  const [memberPoint, setMemberPoint] = useState<AdminPointMemberPoint | null>(null);

  const [singleMemberId, setSingleMemberId] = useState<number | null>(null);
  const [singleAmount, setSingleAmount] = useState('');
  const [singleReason, setSingleReason] = useState('');
  const [isSingleSubmitting, setIsSingleSubmitting] = useState(false);

  const [selectedBatchMemberIds, setSelectedBatchMemberIds] = useState<number[]>([]);
  const [batchAmount, setBatchAmount] = useState('');
  const [batchReason, setBatchReason] = useState('');
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  const [batchResult, setBatchResult] = useState<AdminPointBatchGrantResult | null>(null);

  const fetchLedger = async (
    page: number,
    memberKeyword: string,
    transactionType: PointTransactionFilter,
    from: string,
    to: string,
  ): Promise<void> => {
    setIsLedgerLoading(true);
    const response = await getPointLedger({
      page,
      size: 50,
      memberKeyword,
      transactionType: transactionType === 'ALL' ? undefined : transactionType,
      from: from || undefined,
      to: to || undefined,
    });

    if (!response.ok || !response.data) {
      showError(mapErrorMessage(response.errorName));
      setIsLedgerLoading(false);
      return;
    }

    setLedgerData(response.data);
    setIsLedgerLoading(false);
  };

  const fetchMemberPoint = async (memberId: number): Promise<void> => {
    setIsMemberPointLoading(true);
    const response = await getPointMember(memberId);
    if (!response.ok || !response.data) {
      showError(mapErrorMessage(response.errorName));
      setIsMemberPointLoading(false);
      return;
    }

    setSelectedDetailMemberId(memberId);
    setMemberPoint(response.data);
    setSingleMemberId(memberId);
    setIsMemberPointLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    void fetchLedger(0, ledgerMemberKeyword, ledgerTransactionType, ledgerFrom, ledgerTo);
  }, [isAuthenticated]);

  const selectedBatchMembers = useMemo(() => {
    return selectedBatchMemberIds
      .map((memberId) => memberCache[memberId])
      .filter((member): member is AdminPointMemberSearch => Boolean(member));
  }, [memberCache, selectedBatchMemberIds]);

  const selectedBatchMemberIdSet = useMemo(() => {
    return new Set(selectedBatchMemberIds);
  }, [selectedBatchMemberIds]);

  const handleLedgerSearch = async (): Promise<void> => {
    if (ledgerFrom && ledgerTo && ledgerFrom > ledgerTo) {
      showError('조회 시작일은 종료일보다 늦을 수 없습니다.');
      return;
    }
    setLedgerPage(0);
    await fetchLedger(0, ledgerMemberKeyword, ledgerTransactionType, ledgerFrom, ledgerTo);
  };

  const moveLedgerPage = async (nextPage: number): Promise<void> => {
    if (nextPage < 0) {
      return;
    }
    setLedgerPage(nextPage);
    await fetchLedger(nextPage, ledgerMemberKeyword, ledgerTransactionType, ledgerFrom, ledgerTo);
  };

  const handleSearchMembers = async (): Promise<void> => {
    if (memberSearchKeyword.trim().length < 2) {
      showError('회원 검색어는 2글자 이상 입력해주세요.');
      return;
    }

    setIsMemberSearchLoading(true);
    const response = await searchPointMembers(memberSearchKeyword, 20);
    if (!response.ok || !response.data) {
      showError(mapErrorMessage(response.errorName));
      setIsMemberSearchLoading(false);
      return;
    }

    setMemberSearchResults(response.data);
    setMemberCache((prev) => {
      const next = { ...prev };
      response.data?.forEach((member) => {
        next[member.memberId] = member;
      });
      return next;
    });
    setIsMemberSearchLoading(false);
  };

  const toggleBatchMember = (member: AdminPointMemberSearch): void => {
    setSelectedBatchMemberIds((prev) => {
      if (prev.includes(member.memberId)) {
        return prev.filter((memberId) => memberId !== member.memberId);
      }
      return [...prev, member.memberId];
    });
  };

  const handleSingleGrant = async (): Promise<void> => {
    if (!singleMemberId) {
      showError('지급 대상 회원을 선택해주세요.');
      return;
    }

    const parsedAmount = Number(singleAmount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      showError('지급 포인트는 0보다 큰 정수여야 합니다.');
      return;
    }

    const trimmedReason = singleReason.trim();
    if (!trimmedReason) {
      showError('지급 사유를 입력해주세요.');
      return;
    }

    setIsSingleSubmitting(true);
    const response = await postPointGrant({
      requestId: createRequestId(),
      memberId: singleMemberId,
      amount: parsedAmount,
      reason: trimmedReason,
    });

    if (!response.ok || !response.data) {
      showError(mapErrorMessage(response.errorName));
      setIsSingleSubmitting(false);
      return;
    }

    if (response.data.created) {
      showSuccess('포인트를 지급했습니다.');
    } else {
      showSuccess('중복 요청으로 추가 지급되지 않았습니다.');
    }

    setSingleAmount('');
    await fetchLedger(ledgerPage, ledgerMemberKeyword, ledgerTransactionType, ledgerFrom, ledgerTo);
    if (selectedDetailMemberId !== null) {
      await fetchMemberPoint(selectedDetailMemberId);
    }
    setIsSingleSubmitting(false);
  };

  const handleBatchGrant = async (): Promise<void> => {
    if (selectedBatchMemberIds.length === 0) {
      showError('일괄 지급 대상을 1명 이상 선택해주세요.');
      return;
    }

    const parsedAmount = Number(batchAmount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      showError('지급 포인트는 0보다 큰 정수여야 합니다.');
      return;
    }

    const trimmedReason = batchReason.trim();
    if (!trimmedReason) {
      showError('지급 사유를 입력해주세요.');
      return;
    }

    const confirmed = await showConfirm(`선택된 ${selectedBatchMemberIds.length}명에게 일괄 지급하시겠습니까?`);
    if (!confirmed) {
      return;
    }

    setIsBatchSubmitting(true);
    const response = await postPointBatchGrant({
      requestId: createRequestId(),
      memberIds: selectedBatchMemberIds,
      amount: parsedAmount,
      reason: trimmedReason,
    });

    if (!response.ok || !response.data) {
      showError(mapErrorMessage(response.errorName));
      setIsBatchSubmitting(false);
      return;
    }

    setBatchResult(response.data);
    showSuccess(
      `일괄 지급 완료: 성공 ${response.data.successCount} / 중복 ${response.data.duplicateCount} / 실패 ${response.data.failureCount}`,
    );

    setBatchAmount('');
    await fetchLedger(ledgerPage, ledgerMemberKeyword, ledgerTransactionType, ledgerFrom, ledgerTo);
    if (selectedDetailMemberId !== null) {
      await fetchMemberPoint(selectedDetailMemberId);
    }
    setIsBatchSubmitting(false);
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
          <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-5">
            <section className="bg-white rounded-[12px] p-5 flex flex-col gap-2">
              <h1 className="font-size-24px font-weight-700">포인트 관리</h1>
              <p className="font-size-16px color-gray-60">
                통합 원장 조회, 회원별 조회, 수동 지급(단건/일괄)을 처리합니다.
              </p>
            </section>

            <section className="bg-white rounded-[12px] p-5 flex flex-col gap-4">
              <h2 className="font-size-20px font-weight-600">통합 포인트 원장</h2>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <input
                  value={ledgerMemberKeyword}
                  onChange={(event) => {
                    setLedgerMemberKeyword(event.target.value);
                  }}
                  className="h-10 rounded-[10px] border border-gray-30 px-3"
                  placeholder="회원명/학번"
                />
                <select
                  value={ledgerTransactionType}
                  onChange={(event) => {
                    setLedgerTransactionType(event.target.value as PointTransactionFilter);
                  }}
                  className="h-10 rounded-[10px] border border-gray-30 px-3 bg-white"
                >
                  <option value="ALL">전체 유형</option>
                  <option value="EARN">적립</option>
                  <option value="SPEND">차감</option>
                </select>
                <input
                  type="date"
                  value={ledgerFrom}
                  onChange={(event) => {
                    setLedgerFrom(event.target.value);
                  }}
                  className="h-10 rounded-[10px] border border-gray-30 px-3"
                />
                <input
                  type="date"
                  value={ledgerTo}
                  onChange={(event) => {
                    setLedgerTo(event.target.value);
                  }}
                  className="h-10 rounded-[10px] border border-gray-30 px-3"
                />
                <button
                  className="h-10 rounded-[10px] bg-black color-white cursor-pointer disabled:bg-gray-30"
                  onClick={() => {
                    void handleLedgerSearch();
                  }}
                  disabled={isLedgerLoading}
                >
                  조회
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-20 rounded-[10px]">
                <table className="w-full text-left">
                  <thead className="bg-gray-10">
                    <tr>
                      <th className="px-3 py-2">시간</th>
                      <th className="px-3 py-2">회원</th>
                      <th className="px-3 py-2">학번</th>
                      <th className="px-3 py-2">유형</th>
                      <th className="px-3 py-2">금액</th>
                      <th className="px-3 py-2">사유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerData?.content.map((row) => (
                      <tr key={row.pointTransactionId} className="border-t border-gray-20">
                        <td className="px-3 py-2">{formatDateTime(row.createdAt)}</td>
                        <td className="px-3 py-2">{row.memberName}</td>
                        <td className="px-3 py-2">{row.studentId ?? '-'}</td>
                        <td className="px-3 py-2">{row.transactionType === 'EARN' ? '적립' : '차감'}</td>
                        <td className="px-3 py-2">{row.amount}</td>
                        <td className="px-3 py-2">{row.reason}</td>
                      </tr>
                    ))}
                    {(ledgerData?.content.length ?? 0) === 0 && (
                      <tr>
                        <td className="px-3 py-8 text-center color-gray-60" colSpan={6}>
                          {isLedgerLoading ? '원장을 불러오는 중...' : '조회 결과가 없습니다.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-size-14px color-gray-60">
                  총 {ledgerData?.totalElements ?? 0}건 / {ledgerData ? ledgerData.page + 1 : 1}페이지
                </span>
                <div className="flex items-center gap-2">
                  <button
                    className="h-9 px-3 rounded-[10px] bg-gray-20 cursor-pointer disabled:cursor-not-allowed disabled:text-gray-60"
                    onClick={() => {
                      void moveLedgerPage(ledgerPage - 1);
                    }}
                    disabled={isLedgerLoading || ledgerPage <= 0}
                  >
                    이전
                  </button>
                  <button
                    className="h-9 px-3 rounded-[10px] bg-gray-20 cursor-pointer disabled:cursor-not-allowed disabled:text-gray-60"
                    onClick={() => {
                      void moveLedgerPage(ledgerPage + 1);
                    }}
                    disabled={isLedgerLoading || !(ledgerData?.hasNext ?? false)}
                  >
                    다음
                  </button>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[12px] p-5 flex flex-col gap-4">
              <h2 className="font-size-20px font-weight-600">회원별 조회 / 지급 대상 선택</h2>
              <div className="flex gap-2">
                <input
                  value={memberSearchKeyword}
                  onChange={(event) => {
                    setMemberSearchKeyword(event.target.value);
                  }}
                  className="h-10 flex-1 rounded-[10px] border border-gray-30 px-3"
                  placeholder="학번 또는 이름으로 검색 (2자 이상)"
                />
                <button
                  className="h-10 px-4 rounded-[10px] bg-black color-white cursor-pointer disabled:bg-gray-30"
                  onClick={() => {
                    void handleSearchMembers();
                  }}
                  disabled={isMemberSearchLoading}
                >
                  검색
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-20 rounded-[10px]">
                <table className="w-full text-left">
                  <thead className="bg-gray-10">
                    <tr>
                      <th className="px-3 py-2">선택</th>
                      <th className="px-3 py-2">회원명</th>
                      <th className="px-3 py-2">학번</th>
                      <th className="px-3 py-2">회원ID</th>
                      <th className="px-3 py-2">동작</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberSearchResults.map((member) => (
                      <tr key={member.memberId} className="border-t border-gray-20">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedBatchMemberIdSet.has(member.memberId)}
                            onChange={() => {
                              toggleBatchMember(member);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">{member.memberName}</td>
                        <td className="px-3 py-2">{member.studentId ?? '-'}</td>
                        <td className="px-3 py-2">{member.memberId}</td>
                        <td className="px-3 py-2">
                          <button
                            className="h-8 px-3 rounded-[10px] bg-gray-20 cursor-pointer"
                            onClick={() => {
                              void fetchMemberPoint(member.memberId);
                            }}
                          >
                            상세 조회
                          </button>
                        </td>
                      </tr>
                    ))}
                    {memberSearchResults.length === 0 && (
                      <tr>
                        <td className="px-3 py-8 text-center color-gray-60" colSpan={5}>
                          {isMemberSearchLoading ? '회원 검색 중...' : '검색 결과가 없습니다.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border border-gray-20 rounded-[10px] p-4 flex flex-col gap-3">
                <h3 className="font-size-18px font-weight-600">회원 상세</h3>
                {isMemberPointLoading && <div className="color-gray-60">회원 정보를 불러오는 중...</div>}
                {!isMemberPointLoading && memberPoint && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 font-size-16px">
                      <div>회원명: {memberPoint.memberName}</div>
                      <div>학번: {memberPoint.studentId ?? '-'}</div>
                      <div>회원ID: {memberPoint.memberId}</div>
                      <div>잔액: {memberPoint.balance}</div>
                      <div>누적 적립: {memberPoint.totalEarned}</div>
                    </div>
                    <div className="overflow-x-auto border border-gray-20 rounded-[10px]">
                      <table className="w-full text-left">
                        <thead className="bg-gray-10">
                          <tr>
                            <th className="px-3 py-2">시간</th>
                            <th className="px-3 py-2">유형</th>
                            <th className="px-3 py-2">금액</th>
                            <th className="px-3 py-2">사유</th>
                          </tr>
                        </thead>
                        <tbody>
                          {memberPoint.recentHistory.map((history) => (
                            <tr key={history.pointTransactionId} className="border-t border-gray-20">
                              <td className="px-3 py-2">{formatDateTime(history.createdAt)}</td>
                              <td className="px-3 py-2">
                                {history.transactionType === 'EARN' ? '적립' : '차감'}
                              </td>
                              <td className="px-3 py-2">{history.amount}</td>
                              <td className="px-3 py-2">{history.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                {!isMemberPointLoading && !memberPoint && (
                  <div className="color-gray-60">상세 조회할 회원을 선택해주세요.</div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-[12px] p-5 flex flex-col gap-5">
              <h2 className="font-size-20px font-weight-600">수동 지급</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border border-gray-20 rounded-[10px] p-4 flex flex-col gap-3">
                  <h3 className="font-size-18px font-weight-600">단건 지급</h3>
                  <select
                    value={singleMemberId ?? ''}
                    onChange={(event) => {
                      const nextMemberId = Number(event.target.value);
                      setSingleMemberId(Number.isNaN(nextMemberId) ? null : nextMemberId);
                    }}
                    className="h-10 rounded-[10px] border border-gray-30 px-3 bg-white"
                  >
                    <option value="">지급 대상 선택</option>
                    {memberSearchResults.map((member) => (
                      <option key={member.memberId} value={member.memberId}>
                        {member.memberName} ({member.studentId ?? '-'}, ID:{member.memberId})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={singleAmount}
                    onChange={(event) => {
                      setSingleAmount(event.target.value);
                    }}
                    className="h-10 rounded-[10px] border border-gray-30 px-3"
                    placeholder="지급 포인트"
                  />
                  <textarea
                    value={singleReason}
                    onChange={(event) => {
                      setSingleReason(event.target.value);
                    }}
                    className="min-h-[90px] rounded-[10px] border border-gray-30 px-3 py-2 resize-none"
                    placeholder="지급 사유"
                    maxLength={200}
                  />
                  <button
                    className="h-10 rounded-[10px] bg-black color-white cursor-pointer disabled:bg-gray-30 disabled:cursor-not-allowed"
                    onClick={() => {
                      void handleSingleGrant();
                    }}
                    disabled={isSingleSubmitting}
                  >
                    {isSingleSubmitting ? '지급 중...' : '단건 지급'}
                  </button>
                </div>

                <div className="border border-gray-20 rounded-[10px] p-4 flex flex-col gap-3">
                  <h3 className="font-size-18px font-weight-600">
                    일괄 지급 (선택 {selectedBatchMemberIds.length}명)
                  </h3>
                  <div className="max-h-[120px] overflow-auto border border-gray-20 rounded-[10px] p-2">
                    {selectedBatchMembers.length === 0 && (
                      <div className="font-size-14px color-gray-60">선택된 회원이 없습니다.</div>
                    )}
                    {selectedBatchMembers.map((member) => (
                      <div key={member.memberId} className="font-size-14px py-1">
                        {member.memberName} ({member.studentId ?? '-'}, ID:{member.memberId})
                      </div>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={batchAmount}
                    onChange={(event) => {
                      setBatchAmount(event.target.value);
                    }}
                    className="h-10 rounded-[10px] border border-gray-30 px-3"
                    placeholder="지급 포인트"
                  />
                  <textarea
                    value={batchReason}
                    onChange={(event) => {
                      setBatchReason(event.target.value);
                    }}
                    className="min-h-[90px] rounded-[10px] border border-gray-30 px-3 py-2 resize-none"
                    placeholder="지급 사유"
                    maxLength={200}
                  />
                  <button
                    className="h-10 rounded-[10px] bg-black color-white cursor-pointer disabled:bg-gray-30 disabled:cursor-not-allowed"
                    onClick={() => {
                      void handleBatchGrant();
                    }}
                    disabled={isBatchSubmitting}
                  >
                    {isBatchSubmitting ? '일괄 지급 중...' : '일괄 지급'}
                  </button>
                </div>
              </div>

              {batchResult && (
                <div className="border border-gray-20 rounded-[10px] p-4 flex flex-col gap-3">
                  <h3 className="font-size-18px font-weight-600">일괄 지급 결과</h3>
                  <div className="font-size-16px">
                    요청 {batchResult.totalRequested}건 / 성공 {batchResult.successCount} / 중복{' '}
                    {batchResult.duplicateCount} / 실패 {batchResult.failureCount}
                  </div>
                  <div className="overflow-x-auto border border-gray-20 rounded-[10px]">
                    <table className="w-full text-left">
                      <thead className="bg-gray-10">
                        <tr>
                          <th className="px-3 py-2">회원ID</th>
                          <th className="px-3 py-2">상태</th>
                          <th className="px-3 py-2">거래ID</th>
                          <th className="px-3 py-2">잔액</th>
                          <th className="px-3 py-2">오류</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchResult.results.map((result, index) => (
                          <tr key={`${result.memberId}-${index}`} className="border-t border-gray-20">
                            <td className="px-3 py-2">{result.memberId}</td>
                            <td className="px-3 py-2">{result.status}</td>
                            <td className="px-3 py-2">{result.pointTransactionId ?? '-'}</td>
                            <td className="px-3 py-2">{result.newBalance ?? '-'}</td>
                            <td className="px-3 py-2">{result.errorName ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default PointPage;
