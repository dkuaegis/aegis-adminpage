import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDateTime, useCouponPageState } from "@/page/coupon/hooks/useCouponPageState"
import { CouponCodeTabSection } from "@/page/coupon/sections/CouponCodeTabSection"
import { CouponPageHeader } from "@/page/coupon/sections/CouponPageHeader"
import { CouponIssuedTabSection } from "@/page/coupon/sections/CouponIssuedTabSection"
import { CouponTabSection } from "@/page/coupon/sections/CouponTabSection"

const CouponPage: React.FC = () => {
  const state = useCouponPageState()

  return (
    <div className="space-y-5">
      <CouponPageHeader
        searchDraft={state.searchDraft}
        appliedKeyword={state.appliedKeyword}
        isLoading={state.isDataLoading}
        onSearchDraftChange={state.setSearchDraft}
        onApplySearch={state.handleApplySearch}
      />

      <Tabs value={state.tab} onValueChange={(value) => state.setTab(value as typeof state.tab)}>
        <TabsList>
          <TabsTrigger value="coupon">쿠폰</TabsTrigger>
          <TabsTrigger value="code">쿠폰 코드</TabsTrigger>
          <TabsTrigger value="issued">발급된 쿠폰</TabsTrigger>
        </TabsList>

        <TabsContent value="coupon" className="space-y-4">
          <CouponTabSection
            newCouponName={state.newCouponName}
            onNewCouponNameChange={state.setNewCouponName}
            newDiscountAmount={state.newDiscountAmount}
            onNewDiscountAmountChange={state.setNewDiscountAmount}
            onCreateCoupon={state.handleCreateCoupon}
            couponPage={state.couponPage}
            couponNameDrafts={state.couponNameDrafts}
            onCouponNameDraftChange={state.handleCouponNameDraftChange}
            onUpdateCouponName={state.handleUpdateCouponName}
            onDeleteCoupon={state.handleDeleteCoupon}
            sorting={state.couponSorting}
            onSortingChange={state.handleCouponSortingChange}
            pagination={state.couponPagination}
            onPaginationChange={state.handleCouponPaginationChange}
            isLoading={state.isDataLoading}
          />
        </TabsContent>

        <TabsContent value="code" className="space-y-4">
          <CouponCodeTabSection
            coupons={state.coupons}
            selectedCouponIdForCode={state.selectedCouponIdForCode}
            onSelectedCouponIdForCodeChange={state.setSelectedCouponIdForCode}
            newCouponCodeDescription={state.newCouponCodeDescription}
            onNewCouponCodeDescriptionChange={state.setNewCouponCodeDescription}
            onCreateCouponCode={state.handleCreateCouponCode}
            couponCodePage={state.couponCodePage}
            onDeleteCouponCode={state.handleDeleteCouponCode}
            formatDateTime={formatDateTime}
            sorting={state.couponCodeSorting}
            onSortingChange={state.handleCouponCodeSortingChange}
            pagination={state.couponCodePagination}
            onPaginationChange={state.handleCouponCodePaginationChange}
            isLoading={state.isDataLoading}
          />
        </TabsContent>

        <TabsContent value="issued" className="space-y-4">
          <CouponIssuedTabSection
            coupons={state.coupons}
            selectedCouponIdForIssue={state.selectedCouponIdForIssue}
            onSelectedCouponIdForIssueChange={state.setSelectedCouponIdForIssue}
            onCreateIssuedCoupons={state.handleCreateIssuedCoupons}
            memberSearchText={state.memberSearchText}
            onMemberSearchTextChange={state.setMemberSearchText}
            filteredMembersForIssue={state.filteredMembersForIssue}
            selectedMemberIdSet={state.selectedMemberIdSet}
            isAllFilteredMembersSelected={state.isAllFilteredMembersSelected}
            selectedAmongFilteredCount={state.selectedAmongFilteredCount}
            selectedMemberIdsForIssue={state.selectedMemberIdsForIssue}
            onSelectAllFilteredMembers={state.handleSelectAllFilteredMembers}
            onClearFilteredMembers={state.handleClearFilteredMembers}
            onClearAllSelectedMembers={state.handleClearAllSelectedMembers}
            onToggleMemberForIssue={state.handleToggleMemberForIssue}
            issuedCouponPage={state.issuedCouponPage}
            onDeleteIssuedCoupon={state.handleDeleteIssuedCoupon}
            formatDateTime={formatDateTime}
            sorting={state.issuedSorting}
            onSortingChange={state.handleIssuedSortingChange}
            pagination={state.issuedPagination}
            onPaginationChange={state.handleIssuedPaginationChange}
            isLoading={state.isDataLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CouponPage
