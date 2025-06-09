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
import { useScreenDetection } from "src/global-reactives/screen-detection";
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
    (e: "close" | "copy" | "delete" | "edit" | "link" | "queue" | "transfer" | "unlink"): void;
    (e: "goToGuestProfile", guestId: string): void;
    (e: "arrived" | "cancel" | "reservationConfirmed" | "waitingForResponse", value: boolean): void;
    (e: "stateChange", value: ReservationState): void;
}>();
const { t } = useI18n();
const { buttonSize } = useScreenDetection();

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
    emit("close");
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
    <div class="EventShowReservation">
        <v-card-text class="pa-4 pt-0">
            <ReservationLabelChips class="mb-4" :reservation="reservation" />

            <!-- State Selection Grid -->
            <template
                v-if="
                    !isCancelled &&
                    isPlannedReservation(reservation) &&
                    permissionsStore.canConfirmReservation
                "
            >
                <div class="state-grid mb-6" role="radiogroup">
                    <div
                        v-for="state in Object.values(ReservationState)"
                        :key="state"
                        class="state-card pa-4"
                        role="radio"
                        :aria-checked="reservationMappedState === state"
                        :aria-label="`Set reservation to ${state}`"
                        :class="{
                            'text-white': reservationMappedState === state,
                            'ft-card': true,
                            'state-card--active': reservationMappedState === state,
                        }"
                        :style="{
                            background:
                                reservationMappedState === state
                                    ? getStateGradient(state)
                                    : 'transparent',
                        }"
                        @click="onStateSelect(state)"
                    >
                        <div class="d-flex align-center justify-center">
                            <v-icon :icon="iconMap[state]" />
                        </div>
                        <div class="text-caption mt-2 text-center">
                            {{ reservationStateWithTranslationMap[state] }}
                        </div>
                    </div>
                </div>
                <v-divider class="mb-4" />
            </template>

            <!-- Reservation General Info -->
            <ReservationGeneralInfo :timezone="timezone" :reservation="reservation" />

            <div class="mb-4">
                <v-divider />
            </div>

            <!-- Guest History Section -->
            <v-list-item
                v-if="guestSummaryData && guestSummaryData.totalReservations > 0"
                @click="emit('goToGuestProfile', guestSummaryData.guestId)"
                class="px-0 flex-column align-start"
                density="comfortable"
            >
                <v-divider class="mb-3" />
                <div class="text-body-2 mb-2">
                    {{ t("EventShowReservation.guestHistoryLabel") }}:
                </div>
                <div>
                    <GuestSummaryChips :summary="guestSummaryData" />
                </div>
            </v-list-item>

            <!-- Action Buttons Section -->
            <div v-if="!isCancelled" class="d-flex flex-wrap ga-2 mb-4">
                <FTBtn
                    v-if="canEditReservation && !isCancelled"
                    :title="t('Global.edit')"
                    icon="fas fa-pencil"
                    color="success"
                    variant="text"
                    @click="() => emit('edit')"
                />
                <FTBtn
                    v-if="canMoveToQueue"
                    :title="t('EventShowReservation.moveToQueueLabel')"
                    icon="fas fa-list-ol"
                    color="secondary"
                    @click="() => emit('queue')"
                />

                <v-spacer />

                <FTBtn
                    v-if="isLinkedReservation"
                    :title="t('EventShowReservation.unlinkTablesLabel')"
                    icon="fas fa-unlink"
                    color="warning"
                    @click="() => emit('unlink')"
                />
                <FTBtn
                    v-if="permissionsStore.canReserve && !isCancelled"
                    :title="t('EventShowReservation.linkTablesLabel')"
                    icon="fas fa-link"
                    color="primary"
                    @click="() => emit('link')"
                />

                <template v-if="permissionsStore.canReserve && !isCancelled">
                    <FTBtn
                        :title="t('Global.transfer')"
                        icon="fas fa-exchange-alt"
                        color="primary"
                        @click="() => emit('transfer')"
                    />
                    <FTBtn
                        :title="t('Global.copy')"
                        icon="fas fa-copy"
                        color="primary"
                        @click="() => emit('copy')"
                    />
                </template>
            </div>

            <!-- Delete/Cancel Section -->
            <template v-if="canDeleteReservation || canCancel">
                <v-divider class="my-4" />

                <div class="d-flex flex-wrap ga-2">
                    <FTBtn
                        v-if="canDeleteReservation"
                        :title="t('Global.delete')"
                        icon="fas fa-trash"
                        color="error"
                        variant="text"
                        @click="() => emit('delete')"
                    />

                    <v-spacer />

                    <FTBtn
                        v-if="canCancel"
                        @click="onReservationCancel"
                        :size="buttonSize"
                        :color="isCancelled ? 'positive' : 'warning'"
                    >
                        {{ isCancelled ? t("Global.reactivate") : t("Global.cancel") }}
                    </FTBtn>
                </div>
            </template>
        </v-card-text>
    </div>
</template>

<style lang="scss" scoped>
.state-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

.state-card {
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.5s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 2px solid transparent;

    &:hover {
        transform: translateY(-2px);
        border-color: rgba(var(--v-theme-primary), 0.3);
    }

    &--active {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
}

// Dark mode support
.v-theme--dark .state-card {
    &:hover {
        border-color: rgba(var(--v-theme-primary), 0.5);
    }

    &--active {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
}

@media (max-width: 768px) {
    .state-grid {
        gap: 0.5rem;
    }

    .state-card {
        padding: 12px !important;
    }
}
</style>
