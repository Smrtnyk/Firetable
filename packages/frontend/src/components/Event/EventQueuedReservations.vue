<script setup lang="ts">
import type { EventOwner } from "@firetable/backend";
import type {
    EventDoc,
    PlannedReservation,
    QueuedReservation,
    QueuedReservationDoc,
    User,
} from "@firetable/types";

import { storeToRefs } from "pinia";
import EventCreateReservation from "src/components/Event/reservation/EventCreateReservation.vue";
import EventShowQueuedReservation from "src/components/Event/reservation/EventShowQueuedReservation.vue";
import ReservationVIPChip from "src/components/Event/reservation/ReservationVIPChip.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTTitle from "src/components/FTTitle.vue";
import { useDialog } from "src/composables/useDialog";
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
const { createDialog } = useDialog();
const eventsStore = useEventsStore();
const propertiesStore = usePropertiesStore();

const propertiesSettings = computed(function () {
    return propertiesStore.getPropertySettingsById(eventOwner.propertyId);
});

function addNewQueuedReservation(): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: EventCreateReservation,
            componentPropsObject: {
                currentUser: nonNullableUser.value,
                eventDurationInHours: propertiesSettings.value.event.eventDurationInHours,
                eventStartTimestamp: eventData.date,
                mode: "create",
                onlyPlanned: true,
                timezone: propertiesSettings.value.timezone,
                users,
            },
            listeners: {
                create(reservationData: PlannedReservation) {
                    emit("create", plannedToQueuedReservation(reservationData));
                    dialog.hide();
                },
            },
            maximized: false,
            title: `${t("EventQueuedReservations.addNewReservation")}`,
        },
    });
}

function showReservation(reservation: QueuedReservationDoc): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: EventShowQueuedReservation,
            componentPropsObject: {
                reservation,
                timezone: propertiesSettings.value.timezone,
            },
            listeners: {
                delete() {
                    emit("delete", reservation);
                    dialog.hide();
                },
                unqueue() {
                    emit("unqueue", reservation);
                    dialog.hide();
                    eventsStore.toggleQueuedReservationsDrawerVisibility();
                },
            },
            maximized: false,
            title: "",
        },
    });
}
</script>

<template>
    <q-drawer
        no-swipe-open
        v-model="eventsStore.showQueuedReservationsDrawer"
        overlay
        behavior="mobile"
        side="left"
    >
        <div class="EventQueuedReservations">
            <FTTitle :title="t('EventQueuedReservations.title')">
                <template #right>
                    <FTBtn
                        aria-label="Add new reservation"
                        rounded
                        icon="plus"
                        class="button-gradient"
                        @click="addNewQueuedReservation"
                    />
                </template>
            </FTTitle>
        </div>

        <div v-if="data.length === 0">
            <div class="row justify-center items-center q-mt-md">
                <FTCenteredText>{{ t("EventQueuedReservations.emptyMessage") }}</FTCenteredText>
                <q-img src="/people-confirmation.svg" alt="Empty reservations image" />
            </div>
        </div>

        <div v-if="data.length === 0 && error">
            <FTCenteredText> {{ t("EventQueuedReservations.errorMessage") }}</FTCenteredText>
        </div>

        <div v-if="data.length > 0">
            <q-list>
                <q-item clickable v-for="res in data" @click="showReservation(res)">
                    <q-item-section>
                        <q-item-label>{{ res.guestName }}</q-item-label>
                        <q-item-label caption>{{ res.guestContact }}</q-item-label>
                    </q-item-section>
                    <q-item-section side v-if="res.isVIP">
                        <ReservationVIPChip />
                    </q-item-section>
                </q-item>
            </q-list>
        </div>
    </q-drawer>
</template>
