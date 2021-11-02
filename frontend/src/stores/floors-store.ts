import { defineStore } from "pinia";

export const useFloorsStore = defineStore("floors", {
    state: () => ({
        showCreateFloorModal: false,
    }),
    actions: {
        toggleCreateFloorModalVisibility() {
            this.showCreateFloorModal = !this.showCreateFloorModal;
        },
    },
});
