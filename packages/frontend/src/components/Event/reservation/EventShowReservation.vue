<script setup lang="ts">
import type { ReservationDoc } from "@firetable/types";
import type { GuestSummary } from "src/stores/guests-store";

import { isPlannedReservation, ReservationState } from "@firetable/types";
import { useAsyncState } from "@vueuse/core";
import ReservationGeneralInfo from "src/components/Event/reservation/ReservationGeneralInfo.vue";
import ReservationLabelChips from "src/components/Event/reservation/ReservationLabelChips.vue";
import FTBtn from "src/components/FTBtn.vue";
import GuestSummaryChips from "src/components/guest/GuestSummaryChips.vue";
import { useReservationPermissions } from "src/composables/reservations/useReservationPermissions";
import { buttonSize } from "src/global-reactives/screen-detection";
import { usePermissionsStore } from "src/stores/permissions-store";
import { toRef } from "vue";
import { useI18n } from "vue-i18n";

export interface EventShowReservationProps {
    guestSummaryPromise: Promise<GuestSummary | undefined>;
    reservation: ReservationDoc;
    tableColors: {
        reservationArrivedColor: string;
        reservationCancelledColor: string;
        reservationConfirmedColor: string;
        reservationPendingColor: string;
        reservationWaitingForResponseColor: string;
    };
    timezone: string;
}

const permissionsStore = usePermissionsStore();
const { guestSummaryPromise, reservation, tableColors, timezone } =
    defineProps<EventShowReservationProps>();
const emit = defineEmits<{
    (e: "copy" | "delete" | "edit" | "link" | "queue" | "transfer" | "unlink"): void;
    (e: "goToGuestProfile", guestId: string): void;
    (e: "arrived" | "cancel" | "reservationConfirmed" | "waitingForResponse", value: boolean): void;
    (e: "stateChange", value: ReservationState): void;
}>();
const { t } = useI18n();

const { state: guestSummaryData } = useAsyncState(guestSummaryPromise, void 0);

const {
    canCancel,
    canDeleteReservation,
    canEditReservation,
    canMoveToQueue,
    isCancelled,
    isLinkedReservation,
    reservationMappedState,
    reservationStateWithTranslationMap,
} = useReservationPermissions(toRef(() => reservation));

function onReservationCancel(): void {
    emit("cancel", !isCancelled.value);
}

const iconMap: Record<ReservationState, string> = {
    [ReservationState.ARRIVED]: "fas fa-user-check",
    [ReservationState.CONFIRMED]: "fas fa-check-circle",
    [ReservationState.PENDING]: "fas fa-hourglass-empty",
    [ReservationState.WAITING_FOR_RESPONSE]: "fas fa-hourglass-half",
};

function getStateGradient(state: ReservationState): string {
    const base = (() => {
        switch (state) {
            case ReservationState.ARRIVED:
                return tableColors.reservationArrivedColor;
            case ReservationState.CONFIRMED:
                return tableColors.reservationConfirmedColor;
            case ReservationState.WAITING_FOR_RESPONSE:
                return tableColors.reservationWaitingForResponseColor;
            default:
                return tableColors.reservationPendingColor;
        }
    })();
    const overlay = base.endsWith(")")
        ? base.replace(/rgba?\(([^)]+)\)/, "rgba($1, 0.6)")
        : `${base}99`;
    return `linear-gradient(135deg, ${base}, ${overlay})`;
}

function onStateSelect(newState: ReservationState): void {
    if (newState === reservationMappedState.value) return;
    switch (newState) {
        case ReservationState.ARRIVED:
            emit("arrived", true);
            break;
        case ReservationState.CONFIRMED:
            emit("reservationConfirmed", true);
            break;
        case ReservationState.PENDING:
            emit("waitingForResponse", false);
            break;
        case ReservationState.WAITING_FOR_RESPONSE:
            emit("waitingForResponse", true);
            break;
    }
    emit("stateChange", newState);
}
</script>

<template>
    <ReservationLabelChips :reservation="reservation" />

    <q-card-section>
        <template
            v-if="
                !isCancelled &&
                isPlannedReservation(reservation) &&
                permissionsStore.canConfirmReservation
            "
        >
            <div class="state-grid q-mb-lg" role="radiogroup">
                <div
                    v-for="state in Object.values(ReservationState)"
                    :key="state"
                    class="state-card q-pa-md"
                    role="radio"
                    :aria-checked="reservationMappedState === state"
                    :aria-label="`Set reservation to ${state}`"
                    :class="{ 'text-white': reservationMappedState === state, 'ft-card': true }"
                    :style="{
                        background:
                            reservationMappedState === state
                                ? getStateGradient(state)
                                : 'transparent',
                    }"
                    @click="onStateSelect(state)"
                >
                    <div class="flex items-center justify-center">
                        <q-icon :name="iconMap[state]" />
                    </div>
                    <div class="text-caption q-mt-xs text-center">
                        {{ reservationStateWithTranslationMap[state] }}
                    </div>
                </div>
            </div>
            <q-separator class="q-mb-md" />
        </template>

        <ReservationGeneralInfo :timezone="timezone" :reservation="reservation" />

        <div class="q-mb-md">
            <q-separator />
        </div>

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

        <q-item v-if="!isCancelled" class="q-pa-sm-none q-pa-xs-none q-gutter-xs q-ml-none">
            <FTBtn
                v-if="canEditReservation && !isCancelled"
                :title="t('Global.edit')"
                icon="fa fa-pencil"
                color="positive"
                @click="() => emit('edit')"
                v-close-popup
            />
            <FTBtn
                v-if="canMoveToQueue"
                :title="t('EventShowReservation.moveToQueueLabel')"
                icon="fa fa-list-ol"
                color="secondary"
                @click="() => emit('queue')"
                v-close-popup
            />

            <q-space />

            <FTBtn
                v-if="isLinkedReservation"
                :title="t('EventShowReservation.unlinkTablesLabel')"
                icon="fa fa-unlink"
                color="warning"
                @click="() => emit('unlink')"
                v-close-popup
            />
            <FTBtn
                v-if="permissionsStore.canReserve && !isCancelled"
                :title="t('EventShowReservation.linkTablesLabel')"
                icon="fa fa-link"
                color="primary"
                @click="() => emit('link')"
                v-close-popup
            />

            <template v-if="permissionsStore.canReserve && !isCancelled">
                <FTBtn
                    :title="t('Global.transfer')"
                    icon="fa fa-exchange-alt"
                    color="primary"
                    @click="() => emit('transfer')"
                    v-close-popup
                />
                <FTBtn
                    :title="t('Global.copy')"
                    icon="fa fa-copy"
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
                icon="fa fa-trash"
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

<style scoped>
.state-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}
.state-card {
    border-radius: 0.75rem;
    cursor: pointer;
    transition: 0.5s all;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.state-card:hover {
    transform: translateY(-2px);
}
</style>
