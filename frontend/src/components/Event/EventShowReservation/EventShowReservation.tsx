import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { defineComponent, ref, PropType } from "vue";
import { Reservation } from "src/types";
import { updateEventFloorData } from "src/services/firebase/db-events";
import type { Floor } from "src/floor-manager/Floor";
import { useI18n } from "vue-i18n";
import { useDialogPluginComponent } from "quasar";

import {
    QDialog,
    QCard,
    QCardSection,
    QBanner,
    QSeparator,
    QItem,
    QItemSection,
    QItemLabel,
    QToggle,
    QBtn,
    QChip,
} from "quasar";

export default defineComponent({
    name: "EventShowReservation",

    components: {
        QItem,
        QDialog,
        QCard,
        QCardSection,
        QBanner,
        QSeparator,
        QItemSection,
        QItemLabel,
        QToggle,
        QBtn,
        QChip,
    },

    props: {
        eventId: {
            type: String,
            required: true,
        },
        floor: {
            type: Object as PropType<Floor>,
            required: true,
        },
        reservation: {
            type: Object as PropType<Reservation>,
            required: true,
        },
        tableId: {
            type: String,
            required: true,
        },
    },

    emits: [...useDialogPluginComponent.emits],

    setup(props) {
        const { t } = useI18n();

        const checked = ref<boolean>(props.reservation.confirmed);
        const confirmGuestSwitchDisabled = ref(false);

        const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
            useDialogPluginComponent();

        function setConfirmButtonDisabledTimer() {
            confirmGuestSwitchDisabled.value = true;
            setTimeout(() => {
                confirmGuestSwitchDisabled.value = false;
            }, 1000 * 60);
        }

        function onReservationConfirm(val: boolean) {
            const { floor, reservation, eventId } = props;
            const { groupedWith } = reservation;
            const { tables } = floor;

            for (const tableId of groupedWith) {
                const table = tables.find(
                    (element) => element.tableId === tableId
                );

                if (!table?.reservation) continue;

                table.reservation.confirmed = val;
            }

            void tryCatchLoadingWrapper(async () => {
                await updateEventFloorData(floor, eventId);
                setConfirmButtonDisabledTimer();
                checked.value = !checked.value;
            });
        }

        return () => {
            const bannerSlots = {
                default: () => (
                    <h6 class="text-h6 q-ma-none">
                        {t("EventShowReservation.title")} {props.tableId}
                    </h6>
                ),
                avatar: () => (
                    <q-btn
                        round
                        class="q-mr-sm"
                        flat
                        icon="close"
                        onClick={onDialogOK}
                    />
                ),
                action: () => (
                    <q-btn
                        round
                        flat
                        icon="trash"
                        color="negative"
                        onClick={onDialogCancel}
                    />
                ),
            };
            return (
                <q-dialog ref={dialogRef} persistent onHide={onDialogHide}>
                    <q-card class="q-dialog-plugin AddTableDialog ft-card">
                        <q-banner
                            inline-actions
                            rounded
                            class="shadow-light"
                            v-slots={bannerSlots}
                        />

                        <q-separator dark inset />

                        <q-card-section>
                            <div class="row">
                                <div class="col-6">
                                    {t("EventShowReservation.guestNameLabel")}
                                </div>
                                <div class="col-6 font-black">
                                    {props.reservation.guestName}
                                </div>

                                <div class="col-6">
                                    {t("EventShowReservation.paxLabel")}
                                </div>
                                <div class="col-6 font-black">
                                    {props.reservation.numberOfGuests}
                                </div>

                                {props.reservation.guestContact && (
                                    <>
                                        <div class="col-6">
                                            {t(
                                                "EventShowReservation.contactLabel"
                                            )}
                                        </div>
                                        <div class="col-6 font-black">
                                            {props.reservation.guestContact}
                                        </div>
                                    </>
                                )}

                                {props.reservation.reservationNote && (
                                    <>
                                        <div class="col-6">
                                            {t(
                                                "EventShowReservation.noteLabel"
                                            )}
                                        </div>
                                        <div class="col-6 font-black">
                                            {props.reservation.reservationNote}
                                        </div>
                                    </>
                                )}

                                <div class="col-6">
                                    {t("EventShowReservation.reservedByLabel")}
                                </div>
                                <div class="col-6 font-black">
                                    {props.reservation.reservedBy.email}
                                </div>
                            </div>

                            {props.reservation.groupedWith?.length > 1 && (
                                <div class="row items-center">
                                    <q-separator dark class="q-my-md col-12" />
                                    <div class="col-6">
                                        {t(
                                            "EventShowReservation.groupedWithLabel"
                                        )}
                                    </div>
                                    <div class="col-6">
                                        {props.reservation.groupedWith.map(
                                            (table) => (
                                                <q-chip
                                                    key={table}
                                                    square
                                                    class="bg-gradient"
                                                    text-color="white"
                                                >
                                                    {table}
                                                </q-chip>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            <q-separator class="q-my-md" />

                            <q-item tag="label" class="q-pa-none">
                                <q-item-section>
                                    <q-item-label>
                                        {t(
                                            "EventShowReservation.guestArrivedLabel"
                                        )}
                                    </q-item-label>
                                </q-item-section>
                                <q-item-section avatar>
                                    <q-toggle
                                        {...{
                                            modelValue: checked.value,
                                            "onUpdate:modelValue":
                                                onReservationConfirm,
                                            disable:
                                                confirmGuestSwitchDisabled.value,
                                            size: "lg",
                                            uncheckedIcon: "close",
                                            checkedIcon: "check",
                                            color: "green",
                                        }}
                                    />
                                </q-item-section>
                            </q-item>

                            {confirmGuestSwitchDisabled.value && (
                                <q-item>
                                    <q-item-section>
                                        <span>
                                            You need to wait a minute until you
                                            are able to change the status again!
                                        </span>
                                    </q-item-section>
                                </q-item>
                            )}
                        </q-card-section>
                    </q-card>
                </q-dialog>
            );
        };
    },
});
