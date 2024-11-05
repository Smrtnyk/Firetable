<script setup lang="ts">
import type { ReservationDoc } from "@firetable/types";
import type { GuestSummary } from "src/stores/guests-store";
import { isPlannedReservation } from "@firetable/types";
import { ref, toRef } from "vue";
import { useI18n } from "vue-i18n";
import { useAsyncState } from "@vueuse/core";
import { usePermissionsStore } from "src/stores/permissions-store";
import { buttonSize } from "src/global-reactives/screen-detection";
import { useReservationPermissions } from "src/composables/useReservationPermissions";

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
}>();
const { t } = useI18n();

const reservationConfirmed = ref(
    isPlannedReservation(reservation) && reservation.reservationConfirmed,
);
const waitingForResponse = ref(
    isPlannedReservation(reservation) && Boolean(reservation.waitingForResponse),
);
const { state: guestSummaryData } = useAsyncState(guestSummaryPromise, void 0);

const {
    canEditReservation,
    canDeleteReservation,
    canMoveToQueue,
    canCancel,
    isGuestArrived,
    isCancelled,
    isLinkedReservation,
} = useReservationPermissions(toRef(() => reservation));

function onGuestArrived(): void {
    emit("arrived", !isGuestArrived.value);
}

function onReservationCancel(): void {
    emit("cancel", !isCancelled.value);
}

function onReservationConfirmed(): void {
    emit("reservationConfirmed", !reservationConfirmed.value);
}

function onWaitingForResponse(): void {
    emit("waitingForResponse", !waitingForResponse.value);
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
            <template v-if="!isGuestArrived && !reservationConfirmed">
                <q-separator />
                <!-- waiting for response -->
                <q-item tag="label" class="q-pa-none">
                    <q-item-section>
                        <q-item-label>
                            {{ t("EventShowReservation.waitingForResponse") }}
                        </q-item-label>
                    </q-item-section>
                    <q-item-section avatar>
                        <q-toggle
                            :model-value="waitingForResponse"
                            @update:model-value="onWaitingForResponse"
                            size="lg"
                            unchecked-icon="close"
                            checked-icon="check"
                            color="yellow"
                            v-close-popup
                        />
                    </q-item-section>
                </q-item>
            </template>

            <!-- reservation confirmed -->
            <template v-if="!isGuestArrived">
                <q-separator />
                <q-item tag="label" class="q-pa-none">
                    <q-item-section>
                        <q-item-label>
                            {{ t("EventShowReservation.reservationConfirmedLabel") }}
                        </q-item-label>
                    </q-item-section>
                    <q-item-section avatar>
                        <q-toggle
                            :model-value="reservationConfirmed"
                            @update:model-value="onReservationConfirmed"
                            size="lg"
                            unchecked-icon="close"
                            checked-icon="check"
                            color="primary"
                            v-close-popup
                        />
                    </q-item-section>
                </q-item>
            </template>

            <!-- guest arrived -->
            <q-separator class="q-ma-none" />
            <q-item tag="label" class="q-pa-none">
                <q-item-section>
                    <q-item-label>
                        {{ t("EventShowReservation.reservationGuestArrivedLabel") }}
                    </q-item-label>
                </q-item-section>
                <q-item-section avatar>
                    <q-toggle
                        :model-value="isGuestArrived"
                        @update:model-value="onGuestArrived"
                        size="lg"
                        unchecked-icon="close"
                        checked-icon="check"
                        color="green"
                        v-close-popup
                    />
                </q-item-section>
            </q-item>
        </template>

        <q-separator v-if="!isCancelled" class="q-mb-md" />

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
                title="Move to queue"
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
