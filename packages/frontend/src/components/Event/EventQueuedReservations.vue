<script setup lang="ts">
import type { EventDoc, PlannedReservation, QueuedReservationDoc, User } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import type { Ref } from "vue";
import { saveQueuedReservation } from "@firetable/backend";
import { useEventsStore } from "src/stores/events-store";
import { useI18n } from "vue-i18n";
import { computed, inject } from "vue";

import FTTitle from "src/components/FTTitle.vue";
import ReservationVIPChip from "src/components/Event/reservation/ReservationVIPChip.vue";
import FTDialog from "src/components/FTDialog.vue";
import EventCreateReservation from "src/components/Event/reservation/EventCreateReservation.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import EventShowQueuedReservation from "src/components/Event/reservation/EventShowQueuedReservation.vue";

import { useDialog } from "src/composables/useDialog";
import { useAuthStore } from "src/stores/auth-store";
import { storeToRefs } from "pinia";
import { usePropertiesStore } from "src/stores/properties-store";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { plannedToQueuedReservation } from "src/helpers/reservation/planned-to-queued-reservation";

interface EventQueuedReservationsProps {
    data: QueuedReservationDoc[];
    error: unknown | undefined;
    eventOwner: EventOwner;
    users: User[];
}

type Emits = (e: "unqueue", reservation: QueuedReservationDoc) => void;

const emit = defineEmits<Emits>();
const { data, error, eventOwner, users } = defineProps<EventQueuedReservationsProps>();

const { nonNullableUser } = storeToRefs(useAuthStore());
const { t } = useI18n();
const { createDialog } = useDialog();
const eventsStore = useEventsStore();
const propertiesStore = usePropertiesStore();
const eventData = inject<Ref<EventDoc>>("eventData");
const settings = computed(function () {
    return propertiesStore.getOrganisationSettingsById(eventOwner.organisationId);
});

function addNewQueuedReservation(): void {
    if (!eventData) {
        showErrorMessage("Event data not found");
        return;
    }

    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: EventCreateReservation,
            title: `${t("EventQueuedReservations.addNewReservation")}`,
            maximized: false,
            componentPropsObject: {
                mode: "create",
                currentUser: nonNullableUser.value,
                users,
                eventStartTimestamp: eventData.value.date,
                eventDurationInHours: settings.value.event.eventDurationInHours,
                onlyPlanned: true,
            },
            listeners: {
                async create(reservationData: PlannedReservation) {
                    dialog.hide();

                    await tryCatchLoadingWrapper({
                        hook() {
                            return saveQueuedReservation(
                                eventOwner,
                                plannedToQueuedReservation(reservationData),
                            );
                        },
                    });
                },
            },
        },
    });
}

function showReservation(reservation: QueuedReservationDoc): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: EventShowQueuedReservation,
            title: "",
            maximized: false,
            componentPropsObject: {
                reservation,
            },
            listeners: {
                unqueue() {
                    emit("unqueue", reservation);
                    dialog.hide();
                    eventsStore.toggleQueuedReservationsDrawerVisibility();
                },
            },
        },
    });
}
</script>

<template>
    <q-drawer no-swipe-open v-model="eventsStore.showQueuedReservationsDrawer">
        <div class="EventQueuedReservations">
            <FTTitle :title="t('EventQueuedReservations.title')">
                <template #right>
                    <q-btn
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
                <q-img src="/people-confirmation.svg" />
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
