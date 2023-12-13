import { defineStore } from "pinia";
import { ref } from "vue";

export const useEventsStore = defineStore("events", () => {
    const showEventGuestListDrawer = ref(false);
    const currentEventName = ref("");

    function toggleEventGuestListDrawerVisibility(): void {
        showEventGuestListDrawer.value = !showEventGuestListDrawer.value;
    }

    function setCurrentEventName(eventName: string): void {
        currentEventName.value = eventName;
    }

    return {
        showEventGuestListDrawer,
        currentEventName,
        toggleEventGuestListDrawerVisibility,
        setCurrentEventName,
    };
});
