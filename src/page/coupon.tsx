import { Card, CardContent } from "@/components/ui/card"
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
      <CouponPageHeader searchText={state.searchText} onSearchTextChange={state.setSearchText} />

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
            filteredCoupons={state.filteredCoupons}
            couponNameDrafts={state.couponNameDrafts}
            onCouponNameDraftChange={state.handleCouponNameDraftChange}
            onUpdateCouponName={state.handleUpdateCouponName}
            onDeleteCoupon={state.handleDeleteCoupon}
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
            filteredCouponCodes={state.filteredCouponCodes}
            onDeleteCouponCode={state.handleDeleteCouponCode}
            formatDateTime={formatDateTime}
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
            filteredIssuedCoupons={state.filteredIssuedCoupons}
            onDeleteIssuedCoupon={state.handleDeleteIssuedCoupon}
            formatDateTime={formatDateTime}
          />
        </TabsContent>
      </Tabs>

      {state.isDataLoading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">데이터를 불러오는 중입니다.</CardContent>
        </Card>
      )}

      {!state.isDataLoading && state.currentRows.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">조건에 맞는 데이터가 없습니다.</CardContent>
        </Card>
      )}
    </div>
  )
}

export default CouponPage
