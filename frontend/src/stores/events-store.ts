import { defineStore } from "pinia";

export const useEventsStore = defineStore("events", {
    state: () => ({
        showCreateEventModal: false,
        showEventGuestListDrawer: false,
        showAddNewGuestForm: false,
    }),
    actions: {
        toggleEventGuestListDrawerVisibility() {
            this.showEventGuestListDrawer = !this.showEventGuestListDrawer;
        },
        toggleEventCreateModalVisibility() {
            this.showCreateEventModal = !this.showCreateEventModal;
        },
        toggleShowAddNewGuestFormVisibility() {
            this.showAddNewGuestForm = !this.showAddNewGuestForm;
        },
    },
});
