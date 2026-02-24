import { useEventPageState } from "./event/hooks/useEventPageState";
import { EventDialogsSection } from "./event/sections/EventDialogsSection";
import { EventTableSection } from "./event/sections/EventTableSection";
import { EventToolbarSection } from "./event/sections/EventToolbarSection";

const Event = () => {
  const state = useEventPageState();

  return (
    <div className="space-y-5">
      <EventToolbarSection
        searchDraft={state.searchDraft}
        appliedKeyword={state.appliedKeyword}
        isLoading={state.isLoading}
        onSearchTextChange={state.setSearchDraft}
        onApplySearch={state.handleApplySearch}
        onOpenCreateDialog={state.handleOpenCreateDialog}
      />

      <EventTableSection
        isLoading={state.isLoading}
        rows={state.rows}
        sorting={state.sorting}
        onSortingChange={state.handleSortingChange}
        pagination={state.pagination}
        onPaginationChange={state.handlePaginationChange}
        totalPages={state.pageData?.totalPages ?? 1}
        totalElements={state.pageData?.totalElements ?? 0}
        onOpenEditDialog={state.handleOpenEditDialog}
        onDelete={state.handleDelete}
        onOpenQR={state.handleOpenQR}
      />

      <EventDialogsSection
        showEditDialog={state.showEditDialog}
        onShowEditDialogChange={state.setShowEditDialog}
        editingActivityId={state.editingActivityId}
        eventName={state.eventName}
        onEventNameChange={state.setEventName}
        pointAmount={state.pointAmount}
        onPointAmountChange={state.setPointAmount}
        onSubmitEvent={state.handleSubmitEvent}
        qrActivityId={state.qrActivityId}
        onCloseQR={state.handleCloseQR}
      />
    </div>
  );
};

export default Event;
