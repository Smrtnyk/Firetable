<script setup lang="ts">
import type {
    EventDoc,
    PlannedReservation,
    QueuedReservation,
    QueuedReservationDoc,
    User,
} from "@firetable/types";
import type { EventOwner } from "src/db";

import { storeToRefs } from "pinia";
import EventCreateReservation from "src/components/Event/reservation/EventCreateReservation.vue";
import EventShowQueuedReservation from "src/components/Event/reservation/EventShowQueuedReservation.vue";
import ReservationVIPChip from "src/components/Event/reservation/ReservationVIPChip.vue";
// FTBtn will be replaced by v-btn
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTTitle from "src/components/FTTitle.vue";
import { globalDialog } from "src/composables/useDialog";
import { plannedToQueuedReservation } from "src/helpers/reservation/planned-to-queued-reservation";
import { useAuthStore } from "src/stores/auth-store";
import { useEventsStore } from "src/stores/events-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

export interface EventQueuedReservationsProps {
    data: QueuedReservationDoc[];
    error: undefined | unknown;
    eventData: EventDoc;
    eventOwner: EventOwner;
    users: User[];
}

interface Emits {
    (e: "create", reservation: QueuedReservation): void;
    (e: "delete" | "unqueue", reservation: QueuedReservationDoc): void;
}

const emit = defineEmits<Emits>();
const { data, error, eventData, eventOwner, users } = defineProps<EventQueuedReservationsProps>();

const { nonNullableUser } = storeToRefs(useAuthStore());
const { t } = useI18n();
const eventsStore = useEventsStore();
const propertiesStore = usePropertiesStore();

const propertiesSettings = computed(function () {
    return propertiesStore.getPropertySettingsById(eventOwner.propertyId);
});

function addNewQueuedReservation(): void {
    const dialog = globalDialog.openDialog(
        EventCreateReservation,
        {
            currentUser: nonNullableUser.value,
            eventDurationInHours: propertiesSettings.value.event.eventDurationInHours,
            eventStartTimestamp: eventData.date,
            mode: "create",
            onCreate(reservationData: PlannedReservation) {
                emit("create", plannedToQueuedReservation(reservationData));
                globalDialog.closeDialog(dialog);
            },
            onlyPlanned: true,
            timezone: propertiesSettings.value.timezone,
            users,
        },
        {
            title: `${t("EventQueuedReservations.addNewReservation")}`,
        },
    );
}

function showReservation(reservation: QueuedReservationDoc): void {
    const dialog = globalDialog.openDialog(EventShowQueuedReservation, {
        onDelete() {
            emit("delete", reservation);
            globalDialog.closeDialog(dialog);
        },
        onUnqueue() {
            emit("unqueue", reservation);
            globalDialog.closeDialog(dialog);
            eventsStore.toggleQueuedReservationsDrawerVisibility();
        },
        reservation,
        timezone: propertiesSettings.value.timezone,
    });
}
</script>

<template>
    <v-navigation-drawer
        temporary
        v-model="eventsStore.showQueuedReservationsDrawer"
        location="left"
    >
        <div class="EventQueuedReservations pa-2">
            <FTTitle :title="t('EventQueuedReservations.title')">
                <template #right>
                    <v-btn
                        aria-label="Add new reservation"
                        icon="fa:fas fa-plus"
                        class="button-gradient"
                        variant="elevated"
                        density="comfortable"
                        @click="addNewQueuedReservation"
                    />
                </template>
            </FTTitle>
        </div>

        <div v-if="data.length === 0" class="pa-2">
            <div class="d-flex flex-column justify-center align-center mt-4">
                <FTCenteredText>{{ t("EventQueuedReservations.emptyMessage") }}</FTCenteredText>
                <v-img
                    src="/people-confirmation.svg"
                    alt="Empty reservations image"
                    max-width="200"
                    class="mt-4"
                />
            </div>
        </div>

        <div v-if="data.length === 0 && error" class="pa-2">
            <FTCenteredText> {{ t("EventQueuedReservations.errorMessage") }}</FTCenteredText>
        </div>

        <div v-if="data.length > 0">
            <v-list lines="two">
                <v-list-item v-for="res in data" :key="res.id" @click="showReservation(res)" link>
                    <v-list-item-title>{{ res.guestName }}</v-list-item-title>
                    <v-list-item-subtitle>{{ res.guestContact }}</v-list-item-subtitle>
                    <template v-slot:append>
                        <ReservationVIPChip v-if="res.isVIP" />
                    </template>
                </v-list-item>
            </v-list>
        </div>
    </v-navigation-drawer>
</template>
