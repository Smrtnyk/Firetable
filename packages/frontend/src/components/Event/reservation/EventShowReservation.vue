<script setup lang="ts">
import type { ReservationDoc } from "@firetable/types";
import type { GuestSummary } from "src/stores/guests-store";
import { ReservationState, isPlannedReservation } from "@firetable/types";
import { toRef } from "vue";
import { useI18n } from "vue-i18n";
import { useAsyncState } from "@vueuse/core";
import { usePermissionsStore } from "src/stores/permissions-store";
import { buttonSize } from "src/global-reactives/screen-detection";
import { useReservationPermissions } from "src/composables/reservations/useReservationPermissions";

import ReservationGeneralInfo from "src/components/Event/reservation/ReservationGeneralInfo.vue";
import ReservationLabelChips from "src/components/Event/reservation/ReservationLabelChips.vue";
import FTBtn from "src/components/FTBtn.vue";
import GuestSummaryChips from "src/components/guest/GuestSummaryChips.vue";

export interface EventShowReservationProps {
    reservation: ReservationDoc;
    guestSummaryPromise: Promise<GuestSummary | undefined>;
    timezone: string;
}

const permissionsStore = usePermissionsStore();
const { reservation, guestSummaryPromise, timezone } = defineProps<EventShowReservationProps>();
const emit = defineEmits<{
    (e: "copy" | "delete" | "edit" | "link" | "queue" | "transfer" | "unlink"): void;
    (e: "goToGuestProfile", guestId: string): void;
    (e: "arrived" | "cancel" | "reservationConfirmed" | "waitingForResponse", value: boolean): void;
    (e: "stateChange", value: ReservationState): void;
}>();
const { t } = useI18n();

const { state: guestSummaryData } = useAsyncState(guestSummaryPromise, void 0);

const {
    reservationStateWithTranslationMap,
    canEditReservation,
    canDeleteReservation,
    canMoveToQueue,
    canCancel,
    reservationMappedState,
    isCancelled,
    isLinkedReservation,
} = useReservationPermissions(toRef(() => reservation));

function onReservationCancel(): void {
    emit("cancel", !isCancelled.value);
}

function onStateChange(newState: ReservationState): void {
    switch (newState) {
        case ReservationState.ARRIVED:
            emit("arrived", true);
            break;
        case ReservationState.CONFIRMED:
            emit("reservationConfirmed", true);
            break;
        case ReservationState.WAITING_FOR_RESPONSE:
            emit("waitingForResponse", true);
            break;
        case ReservationState.PENDING:
            emit("waitingForResponse", false);
            break;
    }
    emit("stateChange", newState);
}
</script>

<template>
    <ReservationLabelChips :reservation="reservation" />

    <q-card-section>
        <ReservationGeneralInfo :timezone="timezone" :reservation="reservation" />

        <q-item
            clickable
            @click="emit('goToGuestProfile', guestSummaryData.guestId)"
            class="column q-pa-none"
            v-if="guestSummaryData && guestSummaryData.totalReservations > 0"
            v-close-popup
        >
            <q-separator />
            <div>{{ t("EventShowReservation.guestHistoryLabel") }}:</div>
            <div>
                <GuestSummaryChips :summary="guestSummaryData" />
            </div>
        </q-item>

        <template
            v-if="
                !isCancelled &&
                isPlannedReservation(reservation) &&
                permissionsStore.canConfirmReservation
            "
        >
            <q-select
                class="q-mb-md"
                standout
                rounded
                :model-value="reservationMappedState"
                :options="Object.values(reservationStateWithTranslationMap)"
                option-label="label"
                option-value="value"
                emit-value
                @update:model-value="onStateChange"
                v-if="
                    !isCancelled &&
                    isPlannedReservation(reservation) &&
                    permissionsStore.canConfirmReservation
                "
                aria-label="Reservation state"
            />
        </template>

        <q-item v-if="!isCancelled" class="q-pa-sm-none q-pa-xs-none q-gutter-xs q-ml-none">
            <FTBtn
                v-if="canEditReservation && !isCancelled"
                :title="t('Global.edit')"
                icon="pencil"
                color="positive"
                @click="() => emit('edit')"
                v-close-popup
            />
            <FTBtn
                v-if="canMoveToQueue"
                :title="t('EventShowReservation.moveToQueueLabel')"
                icon="bookmark"
                color="secondary"
                @click="() => emit('queue')"
                v-close-popup
            />

            <q-space />

            <FTBtn
                v-if="isLinkedReservation"
                :title="t('EventShowReservation.unlinkTablesLabel')"
                icon="unlink"
                color="warning"
                @click="() => emit('unlink')"
                v-close-popup
            />
            <FTBtn
                v-if="permissionsStore.canReserve && !isCancelled"
                :title="t('EventShowReservation.linkTablesLabel')"
                icon="link"
                color="primary"
                @click="() => emit('link')"
                v-close-popup
            />

            <template v-if="permissionsStore.canReserve && !isCancelled">
                <FTBtn
                    :title="t('Global.transfer')"
                    icon="transfer"
                    color="primary"
                    @click="() => emit('transfer')"
                    v-close-popup
                />
                <FTBtn
                    :title="t('Global.copy')"
                    icon="copy"
                    color="primary"
                    @click="() => emit('copy')"
                    v-close-popup
                />
            </template>
        </q-item>

        <q-separator class="q-my-md" v-if="canDeleteReservation || canCancel" />

        <q-item class="q-pa-sm-none q-pa-xs-none q-gutter-xs q-ml-none">
            <FTBtn
                v-if="canDeleteReservation"
                :title="t('Global.delete')"
                icon="trash"
                color="negative"
                @click="() => emit('delete')"
                v-close-popup
            />

            <q-space />

            <FTBtn
                v-if="canCancel"
                @click="onReservationCancel"
                :size="buttonSize"
                :color="isCancelled ? 'positive' : 'warning'"
                v-close-popup
                >{{ isCancelled ? t("Global.reactivate") : t("Global.cancel") }}</FTBtn
            >
        </q-item>
    </q-card-section>
</template>
