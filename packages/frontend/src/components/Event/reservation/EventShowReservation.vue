<script setup lang="ts">
import type { ReservationDoc } from "@firetable/types";
import type { GuestSummary } from "src/stores/guests-store";

import { isPlannedReservation, ReservationState } from "@firetable/types";
import { useAsyncState } from "@vueuse/core";
import ReservationGeneralInfo from "src/components/Event/reservation/ReservationGeneralInfo.vue";
import ReservationLabelChips from "src/components/Event/reservation/ReservationLabelChips.vue";
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

const { buttonSize } = useScreenDetection();
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
    [ReservationState.ARRIVED]: "fa:fas fa-user-check",
    [ReservationState.CONFIRMED]: "fa:fas fa-check-circle",
    [ReservationState.PENDING]: "fa:fas fa-hourglass-empty",
    [ReservationState.WAITING_FOR_RESPONSE]: "fa:fas fa-hourglass-half",
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
        : `${base}99`; // Assuming hex color, append alpha
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
            emit("waitingForResponse", false); // Assuming PENDING means not waiting for response
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

    <v-card-text>
        <ReservationGeneralInfo :timezone="timezone" :reservation="reservation" />

        <v-list-item
            v-if="guestSummaryData && guestSummaryData.totalReservations > 0"
            link
            @click="emit('goToGuestProfile', guestSummaryData.guestId)"
            class="d-flex flex-column pa-0"
        >
            <v-divider />
            <div class="pt-2">{{ t("EventShowReservation.guestHistoryLabel") }}:</div>
            <div>
                <GuestSummaryChips :summary="guestSummaryData" />
            </div>
        </v-list-item>

        <template
            v-if="
                !isCancelled &&
                isPlannedReservation(reservation) &&
                permissionsStore.canConfirmReservation
            "
        >
            <v-divider class="mt-2" />
            <div class="state-grid mt-4 mb-6" role="radiogroup">
                <div
                    v-for="state in Object.values(ReservationState)"
                    :key="state"
                    class="state-card pa-4"
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
                    tabindex="0"
                >
                    <div class="d-flex align-center justify-center">
                        <v-icon :icon="iconMap[state]" />
                    </div>
                    <div class="text-caption mt-1 text-center">
                        {{ reservationStateWithTranslationMap[state] }}
                    </div>
                </div>
            </div>
            <v-divider class="mb-4" />
        </template>

        <div v-if="!isCancelled" class="d-flex pa-sm-0 pa-xs-0 ml-0 align-center" style="gap: 4px">
            <v-btn
                v-if="canEditReservation && !isCancelled"
                :aria-label="t('Global.edit')"
                icon="fa:fas fa-pencil"
                color="positive"
                variant="text"
                density="compact"
                @click="() => emit('edit')"
            />
            <v-btn
                v-if="canMoveToQueue"
                :aria-label="t('EventShowReservation.moveToQueueLabel')"
                icon="fa:fas fa-list-ol"
                color="secondary"
                variant="text"
                density="compact"
                @click="() => emit('queue')"
            />

            <v-spacer />

            <v-btn
                v-if="isLinkedReservation"
                :aria-label="t('EventShowReservation.unlinkTablesLabel')"
                icon="fa:fas fa-unlink"
                color="warning"
                variant="text"
                density="compact"
                @click="() => emit('unlink')"
            />
            <v-btn
                v-if="permissionsStore.canReserve && !isCancelled"
                :aria-label="t('EventShowReservation.linkTablesLabel')"
                icon="fa:fas fa-link"
                color="primary"
                variant="text"
                density="compact"
                @click="() => emit('link')"
            />

            <template v-if="permissionsStore.canReserve && !isCancelled">
                <v-btn
                    :aria-label="t('Global.transfer')"
                    icon="fa:fas fa-exchange-alt"
                    color="primary"
                    variant="text"
                    density="compact"
                    @click="() => emit('transfer')"
                />
                <v-btn
                    :aria-label="t('Global.copy')"
                    icon="fa:fas fa-copy"
                    color="primary"
                    variant="text"
                    density="compact"
                    @click="() => emit('copy')"
                />
            </template>
        </div>

        <v-divider class="my-4" v-if="canDeleteReservation || canCancel" />

        <div
            v-if="canDeleteReservation || canCancel"
            class="d-flex pa-sm-0 pa-xs-0 ml-0 align-center"
            style="gap: 4px"
        >
            <v-btn
                v-if="canDeleteReservation"
                :aria-label="t('Global.delete')"
                icon="fa:fas fa-trash"
                color="negative"
                variant="text"
                density="compact"
                @click="() => emit('delete')"
            />

            <v-spacer />

            <v-btn
                v-if="canCancel"
                @click="onReservationCancel"
                :size="buttonSize"
                :color="isCancelled ? 'positive' : 'warning'"
                variant="tonal"
            >
                {{ isCancelled ? t("Global.reactivate") : t("Global.cancel") }}
            </v-btn>
        </div>
    </v-card-text>
</template>

<style scoped>
.state-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}
.state-card {
    border-radius: 0.75rem; /* Vuetify uses 'rounded-lg' for 8px, 'rounded-xl' for 12px. This is 12px. */
    cursor: pointer;
    transition: 0.5s all;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center; /* Added for better content centering */
    min-height: 80px; /* Ensure cards have some min height */
}
.state-card:hover {
    transform: translateY(-2px);
}

/* Assuming ft-card provides border or specific background not covered by dynamic style */
.ft-card {
    border: 1px solid #e0e0e0; /* Example border, adjust as needed */
}
.v-theme--dark .ft-card {
    border: 1px solid #424242; /* Example dark theme border */
}
</style>
