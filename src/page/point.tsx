import { usePointPageState } from "./point/hooks/usePointPageState"
import { PointGrantSection } from "./point/sections/PointGrantSection"
import { PointPageHeaderSection } from "./point/sections/PointPageHeaderSection"
import { PointLedgerSection } from "./point/sections/PointLedgerSection"
import { PointMemberSection } from "./point/sections/PointMemberSection"

const PointPage: React.FC = () => {
  const state = usePointPageState()

  return (
    <div className="space-y-5">
      <PointPageHeaderSection />

      <PointLedgerSection
        isLedgerLoading={state.isLedgerLoading}
        ledgerData={state.ledgerData}
        ledgerPage={state.ledgerPage}
        ledgerMemberKeyword={state.ledgerMemberKeyword}
        ledgerTransactionType={state.ledgerTransactionType}
        ledgerSort={state.ledgerSort}
        ledgerFrom={state.ledgerFrom}
        ledgerTo={state.ledgerTo}
        onLedgerMemberKeywordChange={state.setLedgerMemberKeyword}
        onLedgerTransactionTypeChange={state.setLedgerTransactionType}
        onLedgerSortChange={state.setLedgerSort}
        onLedgerFromChange={state.setLedgerFrom}
        onLedgerToChange={state.setLedgerTo}
        onLedgerSearch={state.handleLedgerSearch}
        onMoveLedgerPage={state.moveLedgerPage}
        formatDateTime={state.formatDateTime}
      />

      <PointMemberSection
        memberSearchKeyword={state.memberSearchKeyword}
        isMemberSearchLoading={state.isMemberSearchLoading}
        memberSearchResults={state.memberSearchResults}
        selectedBatchMemberIdSet={state.selectedBatchMemberIdSet}
        isMemberPointLoading={state.isMemberPointLoading}
        memberPoint={state.memberPoint}
        onMemberSearchKeywordChange={state.setMemberSearchKeyword}
        onSearchMembers={state.handleSearchMembers}
        onToggleBatchMember={state.toggleBatchMember}
        onFetchMemberPoint={state.fetchMemberPoint}
        formatDateTime={state.formatDateTime}
      />

      <PointGrantSection
        memberSearchResults={state.memberSearchResults}
        singleMemberId={state.singleMemberId}
        singleAmount={state.singleAmount}
        singleReason={state.singleReason}
        isSingleSubmitting={state.isSingleSubmitting}
        selectedBatchMemberIds={state.selectedBatchMemberIds}
        selectedBatchMembers={state.selectedBatchMembers}
        batchAmount={state.batchAmount}
        batchReason={state.batchReason}
        isBatchSubmitting={state.isBatchSubmitting}
        batchResult={state.batchResult}
        onSingleMemberIdChange={state.setSingleMemberId}
        onSingleAmountChange={state.setSingleAmount}
        onSingleReasonChange={state.setSingleReason}
        onSingleGrant={state.handleSingleGrant}
        onBatchAmountChange={state.setBatchAmount}
        onBatchReasonChange={state.setBatchReason}
        onBatchGrant={state.handleBatchGrant}
      />
    </div>
  )
}

export default PointPage
