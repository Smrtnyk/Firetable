import { defineStore } from "pinia";

export const useEventsStore = defineStore("events", {
    state: () => ({
        showEventGuestListDrawer: false,
        showAddNewGuestForm: false,
    }),
    actions: {
        toggleEventGuestListDrawerVisibility() {
            this.showEventGuestListDrawer = !this.showEventGuestListDrawer;
        },
        toggleShowAddNewGuestFormVisibility() {
            this.showAddNewGuestForm = !this.showAddNewGuestForm;
        },
    },
});
