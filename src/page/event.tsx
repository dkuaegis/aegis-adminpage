import { useEventPageState } from "./event/hooks/useEventPageState"
import { EventDialogsSection } from "./event/sections/EventDialogsSection"
import { EventTableSection } from "./event/sections/EventTableSection"
import { EventToolbarSection } from "./event/sections/EventToolbarSection"

const Event = () => {
  const state = useEventPageState()

  return (
    <div className="space-y-5">
      <EventToolbarSection
        searchText={state.searchText}
        isSortAsc={state.isSortAsc}
        onSearchTextChange={state.setSearchText}
        onToggleSortOrder={state.toggleSortOrder}
        onOpenCreateDialog={state.handleOpenCreateDialog}
      />

      <EventTableSection
        isLoading={state.isLoading}
        rows={state.rows}
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
  )
}

export default Event
