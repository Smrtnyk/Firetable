import { defineStore } from "pinia";

export const useEventsStore = defineStore("events", {
    state: () => ({
        showEventGuestListDrawer: false,
    }),
    actions: {
        toggleEventGuestListDrawerVisibility() {
            this.showEventGuestListDrawer = !this.showEventGuestListDrawer;
        },
    },
});
