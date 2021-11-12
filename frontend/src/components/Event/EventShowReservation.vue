<script setup lang="ts">
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { ref } from "vue";
import { Reservation } from "src/types/event";
import { updateEventFloorData } from "src/services/firebase/db-events";
import type { Floor } from "src/floor-manager/Floor";
import { useI18n } from "vue-i18n";

import { useDialogPluginComponent } from "quasar";

interface Props {
    eventId: string;
    floor: Floor;
    reservation: Reservation;
    tableId: string;
}

const props = defineProps<Props>();
// eslint-disable-next-line vue/valid-define-emits
const emit = defineEmits(useDialogPluginComponent.emits);

const { t } = useI18n();

const checked = ref<boolean>(props.reservation.confirmed);
const confirmGuestSwitchDisabled = ref(false);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

function onReservationConfirm(val: boolean) {
    const { floor, reservation, eventId } = props;
    const { groupedWith } = reservation;
    const { tables } = floor;

    for (const tableId of groupedWith) {
        const table = tables.find((element) => element.tableId === tableId);

        if (!table?.reservation) continue;

        table.reservation.confirmed = val;
    }

    tryCatchLoadingWrapper(async () => {
        await updateEventFloorData(floor, eventId);
        checked.value = !checked.value;
    }).catch(showErrorMessage);
}
</script>

<template>
    <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
        <q-card class="ft-card limited-width">
            <q-banner inline-actions rounded class="shadow-light">
                <template #avatar>
                    <q-btn round class="q-mr-sm" flat icon="close" @click="onDialogOK" />
                </template>
                <template #action> </template>
                <h6 class="text-h6 q-ma-none">
                    {{ t("EventShowReservation.title") }} {{ props.tableId }}
                </h6>
            </q-banner>

            <q-separator dark inset />

            <q-card-section>
                <div class="row">
                    <div class="col-6">{{ t("EventShowReservation.guestNameLabel") }}</div>
                    <div class="col-6 font-black">{{ props.reservation.guestName }}</div>

                    <div class="col-6">{{ t("EventShowReservation.paxLabel") }}</div>
                    <div class="col-6 font-black">
                        {{ props.reservation.numberOfGuests }}
                    </div>

                    <template v-if="props.reservation.guestContact">
                        <div class="col-6">{{ t("EventShowReservation.contactLabel") }}</div>
                        <div class="col-6 font-black">{{ props.reservation.guestContact }}</div>
                    </template>

                    <template v-if="props.reservation.reservationNote">
                        <div class="col-6">{{ t("EventShowReservation.noteLabel") }}</div>
                        <div class="col-6 font-black">{{ props.reservation.reservationNote }}</div>
                    </template>

                    <div class="col-6">{{ t("EventShowReservation.reservedByLabel") }}</div>
                    <div class="col-6 font-black">
                        {{ props.reservation.reservedBy.email }}
                    </div>
                </div>

                <div class="row items-center" v-if="props.reservation.groupedWith?.length > 1">
                    <q-separator dark class="q-my-md col-12" />
                    <div class="col-6">{{ t("EventShowReservation.groupedWithLabel") }}</div>
                    <div class="col-6">
                        <q-chip
                            v-for="table in props.reservation.groupedWith"
                            :key="table"
                            square
                            class="bg-gradient"
                            text-color="white"
                        >
                            {{ table }}
                        </q-chip>
                    </div>
                </div>

                <q-separator class="q-my-md" />

                <q-item tag="label" class="q-pa-none">
                    <q-item-section>
                        <q-item-label>
                            {{ t("EventShowReservation.guestArrivedLabel") }}
                        </q-item-label>
                    </q-item-section>
                    <q-item-section avatar>
                        <q-toggle
                            :model-value="checked"
                            @update:model-value="onReservationConfirm"
                            :disable="confirmGuestSwitchDisabled"
                            size="lg"
                            unchecked-icon="close"
                            checked-icon="check"
                            color="green"
                        />
                    </q-item-section>
                </q-item>
                <q-item>
                    <q-item-section>
                        <q-btn
                            label="Delete Reservation"
                            outline
                            icon="trash"
                            color="negative"
                            @click="onDialogCancel"
                        />
                    </q-item-section>
                </q-item>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>
