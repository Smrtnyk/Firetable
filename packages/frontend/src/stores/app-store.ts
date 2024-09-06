import { defineStore } from "pinia";

export const useAppStore = defineStore("app", {
    state() {
        return {
            showAppDrawer: false,
        };
    },
    actions: {
        toggleAppDrawerVisibility() {
            this.showAppDrawer = !this.showAppDrawer;
        },
    },
});
