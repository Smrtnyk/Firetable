<script setup lang="ts">
import { computed } from "vue";

import FTBtn from "src/components/FTBtn.vue";

export interface EventViewControlsProps {
    activeFloor: { id: string; name: string } | undefined;
    floors: { id: string; name: string }[];
    canSeeAdminEvent: boolean;
    isActiveFloor: (floorId: string) => boolean;
    queuedReservationsCount: number;
    guestListCount: number;
    canExportReservations: boolean;
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
    floors,
    isActiveFloor,
    canSeeAdminEvent,
    queuedReservationsCount,
    guestListCount,
    canExportReservations,
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

function showPrevFloor(): void {
    if (previousFloor.value) {
        emit("set-active-floor", previousFloor.value);
    }
}

// Handle "Show Next Floor" button click
function showNextFloor(): void {
    if (nextFloor.value) {
        emit("set-active-floor", nextFloor.value);
    }
}
</script>

<template>
    <div class="row q-mb-sm q-gutter-sm" aria-label="Toggle event controls menu">
        <FTBtn
            dense
            outline
            color="grey"
            icon="list"
            v-close-popup
            @click="emit('toggle-queued-reservations-drawer-visibility')"
            aria-label="Toggle queued reservations drawer visibility"
        >
            <q-badge floating color="red" v-if="queuedReservationsCount > 0">
                {{ queuedReservationsCount }}
            </q-badge>
        </FTBtn>
        <FTBtn
            dense
            outline
            color="grey"
            icon="users-list"
            v-close-popup
            @click="emit('toggle-event-guest-list-drawer-visibility')"
            aria-label="Toggle event guest list drawer visibility"
        >
            <q-badge floating color="red" v-if="guestListCount > 0">
                {{ guestListCount }}
            </q-badge>
        </FTBtn>
        <FTBtn
            dense
            outline
            color="grey"
            icon="info"
            v-close-popup
            @click="() => emit('show-event-info')"
            aria-label="Show event info"
        />

        <FTBtn
            v-if="canSeeAdminEvent"
            clickable
            v-close-popup
            @click="() => emit('navigate-to-admin-event')"
            dense
            outline
            color="grey"
            icon="eye-open"
            aria-label="Navigate to admin event"
        />
        <FTBtn
            v-if="canExportReservations"
            dense
            outline
            color="grey"
            icon="download"
            v-close-popup
            @click="() => emit('export-reservations')"
            aria-label="Export reservations"
        />

        <q-space />
        <template v-if="shouldShowButtons">
            <FTBtn
                unelevated
                outline
                color="grey"
                dense
                icon="chevron_left"
                @click="showPrevFloor"
                :disabled="!previousFloor"
                aria-label="Show previous floor"
            />
            <FTBtn
                unelevated
                outline
                color="grey"
                dense
                icon="chevron_right"
                @click="showNextFloor"
                :disabled="!nextFloor"
                aria-label="Show next floor"
            />
        </template>
    </div>
</template>
