<script setup lang="ts">
import type { EventDoc, QueuedReservationDoc, Reservation, User } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import type { Ref } from "vue";
import { useEventsStore } from "src/stores/events-store";
import { useI18n } from "vue-i18n";
import { computed, inject } from "vue";

import FTTitle from "src/components/FTTitle.vue";
import ReservationVIPChip from "src/components/Event/reservation/ReservationVIPChip.vue";
import FTDialog from "src/components/FTDialog.vue";
import EventCreateReservation from "src/components/Event/reservation/EventCreateReservation.vue";
import { useDialog } from "src/composables/useDialog";
import { useAuthStore } from "src/stores/auth-store";
import { storeToRefs } from "pinia";
import { usePropertiesStore } from "src/stores/properties-store";
import { showErrorMessage } from "src/helpers/ui-helpers";

interface EventQueuedReservationsProps {
    data: QueuedReservationDoc[];
    error: unknown | undefined;
    eventOwner: EventOwner;
    users: User[];
}

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
                currentUser: nonNullableUser.value,
                users,
                eventStartTimestamp: eventData.value.date,
                eventDurationInHours: settings.value.event.eventDurationInHours,
            },
            listeners: {
                create(reservationData: Reservation) {
                    // FIXME: implement
                    dialog.hide();
                },
            },
        },
    });
}

function showReservation(reservation: QueuedReservationDoc): void {
    // FIXME: implement
}
</script>

<template>
    <q-drawer v-model="eventsStore.showQueuedReservationsDrawer">
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
                <h6 class="q-ma-sm text-weight-bolder underline">
                    {{ t("EventQueuedReservations.emptyMessage") }}
                </h6>
                <q-img src="/people-confirmation.svg" />
            </div>
        </div>

        <div v-if="data.length === 0 && error">
            <div class="row justify-center items-center q-mt-md">
                <h6 class="q-ma-sm text-weight-bolder underline">
                    {{ t("EventQueuedReservations.errorMessage") }}
                </h6>
            </div>
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
