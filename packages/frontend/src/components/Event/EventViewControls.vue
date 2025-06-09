<script setup lang="ts">
import { computed } from "vue";

export interface EventViewControlsProps {
    activeFloor: undefined | { id: string; name: string };
    canExportReservations: boolean;
    canSeeAdminEvent: boolean;
    floors: { id: string; name: string }[];
    guestListCount: number;
    isActiveFloor: (floorId: string) => boolean;
    queuedReservationsCount: number;
}

const emit = defineEmits<{
    (
        e:
            | "export-reservations"
            | "navigate-to-admin-event"
            | "show-event-info"
            | "toggle-event-guest-list-drawer-visibility"
            | "toggle-queued-reservations-drawer-visibility",
    ): void;
    (e: "set-active-floor", value: { id: string; name: string }): void;
}>();

const {
    canExportReservations,
    canSeeAdminEvent,
    floors,
    guestListCount,
    isActiveFloor,
    queuedReservationsCount,
} = defineProps<EventViewControlsProps>();

const currentActiveIndex = computed(function () {
    return floors.findIndex(function (floor) {
        return isActiveFloor(floor.id);
    });
});

const previousFloor = computed(function () {
    const index = currentActiveIndex.value;
    if (index > 0) {
        return floors[index - 1];
    }
    return void 0;
});
const nextFloor = computed(function () {
    const index = currentActiveIndex.value;
    if (index < floors.length - 1 && index !== -1) {
        return floors[index + 1];
    }
    return void 0;
});

const shouldShowButtons = computed(function () {
    return floors.length > 1;
});

function showNextFloor(): void {
    if (nextFloor.value) {
        emit("set-active-floor", nextFloor.value);
    }
}

function showPrevFloor(): void {
    if (previousFloor.value) {
        emit("set-active-floor", previousFloor.value);
    }
}
</script>

<template>
    <div class="d-flex align-center mb-2" style="gap: 8px" aria-label="Toggle event controls menu">
        <v-btn
            density="compact"
            variant="outlined"
            color="grey"
            icon="fa:fas fa-bars"
            @click="emit('toggle-queued-reservations-drawer-visibility')"
            aria-label="Toggle queued reservations drawer visibility"
        >
            <v-badge
                floating
                color="red"
                v-if="queuedReservationsCount > 0"
                :content="queuedReservationsCount"
            />
        </v-btn>
        <v-btn
            density="compact"
            variant="outlined"
            color="grey"
            icon="fa:fas fa-users"
            @click="emit('toggle-event-guest-list-drawer-visibility')"
            aria-label="Toggle event guest list drawer visibility"
        >
            <v-badge floating color="red" v-if="guestListCount > 0" :content="guestListCount" />
        </v-btn>
        <v-btn
            density="compact"
            variant="outlined"
            color="grey"
            icon="fa:fas fa-info-circle"
            @click="() => emit('show-event-info')"
            aria-label="Show event info"
        />

        <v-btn
            v-if="canSeeAdminEvent"
            @click="() => emit('navigate-to-admin-event')"
            density="compact"
            variant="outlined"
            color="grey"
            icon="fa:fas fa-eye"
            aria-label="Navigate to admin event"
        />
        <v-btn
            v-if="canExportReservations"
            density="compact"
            variant="outlined"
            color="grey"
            icon="fa:fas fa-file-export"
            @click="() => emit('export-reservations')"
            aria-label="Export reservations"
        />

        <v-spacer />
        <template v-if="shouldShowButtons">
            <v-btn
                flat
                variant="outlined"
                color="grey"
                density="compact"
                icon="fa:fas fa-chevron-left"
                @click="showPrevFloor"
                :disabled="!previousFloor"
                aria-label="Show previous floor"
            />
            <v-btn
                flat
                variant="outlined"
                color="grey"
                density="compact"
                icon="fa:fas fa-chevron-right"
                @click="showNextFloor"
                :disabled="!nextFloor"
                aria-label="Show next floor"
            />
        </template>
    </div>
</template>
