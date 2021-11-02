import { defineStore } from "pinia";

export const useEventsStore = defineStore("events", {
    state: () => ({
        showCreateEventModal: false,
        showEventGuestListDrawer: false,
        showEventInfoModal: false,
    }),
    actions: {
        toggleEventGuestListDrawerVisibility() {
            this.showEventGuestListDrawer = !this.showEventGuestListDrawer;
        },
        toggleEventInfoModalVisibility() {
            this.showEventInfoModal = !this.showEventInfoModal;
        },
        toggleEventCreateModalVisibility() {
            this.showCreateEventModal = !this.showCreateEventModal;
        },
    },
});
