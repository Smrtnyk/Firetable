import { isBoolean } from "es-toolkit/predicate";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useEventsStore = defineStore("events", function () {
    const showEventGuestListDrawer = ref(false);
    const showQueuedReservationsDrawer = ref(false);
    const currentEventName = ref("");

    function toggleEventGuestListDrawerVisibility(value?: boolean): void {
        if (isBoolean(value)) {
            showEventGuestListDrawer.value = value;
            return;
        }
        showEventGuestListDrawer.value = !showEventGuestListDrawer.value;
    }

    function toggleQueuedReservationsDrawerVisibility(value?: boolean): void {
        if (isBoolean(value)) {
            showQueuedReservationsDrawer.value = value;
            return;
        }
        showQueuedReservationsDrawer.value = !showQueuedReservationsDrawer.value;
    }

    function setCurrentEventName(eventName: string): void {
        currentEventName.value = eventName;
    }

    return {
        currentEventName,
        setCurrentEventName,
        showEventGuestListDrawer,
        showQueuedReservationsDrawer,
        toggleEventGuestListDrawerVisibility,
        toggleQueuedReservationsDrawerVisibility,
    };
});
