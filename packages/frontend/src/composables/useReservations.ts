import { computed, onBeforeUnmount, Ref, watch } from "vue";
import { EventDoc, Reservation, User } from "@firetable/types";
import {
    BaseTable,
    Floor,
    type FloorViewer,
    getFreeTables,
    getReservedTables,
} from "@firetable/floor-creator";
import { EventOwner, updateEventFloorData } from "@firetable/backend";
import { DialogChainObject, useQuasar } from "quasar";
import { takeProp } from "@firetable/utils";
import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import FTDialog from "components/FTDialog.vue";
import EventCreateReservation from "components/Event/EventCreateReservation.vue";
import EventShowReservation from "components/Event/EventShowReservation.vue";
import { VueFirestoreDocumentData } from "vuefire";

const HALF_HOUR = 30 * 60 * 1000; // 30 minutes in milliseconds

export function useReservations(
    users: Ref<User[]>,
    floorInstances: Set<FloorViewer>,
    eventOwner: EventOwner,
    event: Ref<VueFirestoreDocumentData<EventDoc> | undefined>,
    t: any,
) {
    // check every 1 minute
    const intervalID = setInterval(checkReservationsForTimeAndMarkTableIfNeeded, 60 * 1000);
    const q = useQuasar();

    let currentOpenCreateReservationDialog: {
        label: string;
        dialog: DialogChainObject;
        floorId: string;
    } | null = null;

    const allReservedTables = computed(() => {
        return Array.from(floorInstances).map(getReservedTables).flat();
    });

    const freeTablesPerFloor = computed(() => {
        const freeTablesMap = new Map<string, string[]>();

        for (const floor of floorInstances) {
            freeTablesMap.set(floor.id, getFreeTables(floor).map(takeProp("label")));
        }
        return freeTablesMap;
    });

    watch(freeTablesPerFloor, checkIfReservedTableAndCloseCreateReservationDialog);

    function handleReservationCreation(
        floor: Floor,
        reservationData: Reservation,
        table: BaseTable,
    ) {
        table?.setReservation(reservationData);
        void tryCatchLoadingWrapper({
            hook: () => updateEventFloorData(eventOwner, floor),
        });
    }

    async function onDeleteReservation(floor: Floor, element: BaseTable) {
        if (!(await showConfirm("Delete reservation?")) || !element.reservation) return;
        element?.setReservation(null);

        await tryCatchLoadingWrapper({
            hook: () => updateEventFloorData(eventOwner, floor),
        });
    }

    function onEditReservation(floor: Floor, element: BaseTable) {
        console.log(floor, element);
        showCreateReservationDialog(floor, element, "edit");
    }

    function resetCurrentOpenCreateReservationDialog() {
        currentOpenCreateReservationDialog = null;
    }

    function checkIfReservedTableAndCloseCreateReservationDialog() {
        if (!currentOpenCreateReservationDialog) return;

        const { dialog, label, floorId } = currentOpenCreateReservationDialog;
        const freeTables = freeTablesPerFloor.value.get(floorId);
        const isTableStillFree = freeTables?.includes(label);

        if (isTableStillFree) return;

        dialog.hide();
        currentOpenCreateReservationDialog = null;
        showErrorMessage(t("PageEvent.reservationAlreadyReserved"));
    }

    function showCreateReservationDialog(
        floor: Floor,
        element: BaseTable,
        mode: "create" | "edit",
    ) {
        const { label } = element;
        const dialog = q
            .dialog({
                component: FTDialog,
                componentProps: {
                    component: EventCreateReservation,
                    title: `${t("EventShowReservation.title")} ${label}`,
                    maximized: false,
                    componentPropsObject: {
                        users: users.value,
                        mode,
                        reservationData: mode === "edit" ? element.reservation : void 0,
                    },
                    listeners: {
                        create: (reservationData: Reservation) => {
                            resetCurrentOpenCreateReservationDialog();
                            handleReservationCreation(floor, reservationData, element);
                            dialog.hide();
                        },
                        update(reservationData: Reservation) {
                            handleReservationCreation(floor, reservationData, element);
                            dialog.hide();
                        },
                    },
                },
            })
            .onDismiss(resetCurrentOpenCreateReservationDialog);

        if (mode === "create") {
            currentOpenCreateReservationDialog = {
                label,
                dialog,
                floorId: floor.id,
            };
        }
    }

    function showReservation(floor: Floor, reservation: Reservation, element: BaseTable) {
        q.dialog({
            component: FTDialog,
            componentProps: {
                component: EventShowReservation,
                title: `${t("EventShowReservation.title")} ${element.label}`,
                maximized: false,
                componentPropsObject: {
                    reservation,
                },
                listeners: {
                    delete: () => {
                        onDeleteReservation(floor, element).catch(showErrorMessage);
                    },
                    edit() {
                        onEditReservation(floor, element);
                    },
                    confirm: onReservationConfirm(floor, element),
                },
            },
        });
    }

    function onReservationConfirm(floor: Floor, element: BaseTable) {
        return function (val: boolean) {
            const { reservation } = element;
            if (!reservation) return;
            element?.setReservation({
                ...reservation,
                confirmed: val,
            });
            return tryCatchLoadingWrapper({
                hook: () => updateEventFloorData(eventOwner, floor),
            });
        };
    }

    async function swapOrTransferReservations(floor: Floor, table1: BaseTable, table2: BaseTable) {
        if (!table1.reservation) {
            return;
        }
        const transferMessage = `This will transfer reservation from table ${table1.label} to table ${table2.label}`;
        const shouldTransfer = await showConfirm("Transfer reservation", transferMessage);

        console.log(shouldTransfer);
        console.log(table1.reservation, table2.reservation);
        if (!shouldTransfer) {
            return;
        }
        const table1Reservation = { ...table1.reservation };
        if (table2.reservation) {
            table1.setReservation({ ...table2.reservation });
        } else {
            table1.setReservation(null);
        }
        table2.setReservation(table1Reservation);

        await tryCatchLoadingWrapper({
            hook: () => updateEventFloorData(eventOwner, floor),
        });
    }

    function checkReservationsForTimeAndMarkTableIfNeeded() {
        if (!event.value?.date) {
            return;
        }

        const baseEventDate = new Date(event.value.date);
        const allReservedTables = Array.from(floorInstances).flatMap(getReservedTables);

        if (!allReservedTables.length) {
            return;
        }

        const currentDate = new Date();

        for (const table of allReservedTables) {
            // Only mark non-confirmed reservations
            if (table.reservation?.confirmed) {
                continue;
            }
            const [hours, minutes] = table.reservation!.time.split(":");
            const eventDateTime = new Date(baseEventDate);
            eventDateTime.setHours(parseInt(hours), parseInt(minutes));

            // Check if time is starting with "0", for example 01:00, it means it is next day in the morning,
            // so we need to adjust the date to the next day
            if (hours.startsWith("0")) {
                eventDateTime.setDate(eventDateTime.getDate() + 1);
            }

            if (currentDate.getTime() - eventDateTime.getTime() >= HALF_HOUR) {
                table.setFill("red");
            }
        }
    }

    onBeforeUnmount(() => {
        clearInterval(intervalID);
    });

    return {
        allReservedTables,
        freeTablesPerFloor,
        onDeleteReservation,
        handleReservationCreation,
        checkReservationsForTimeAndMarkTableIfNeeded,
        swapOrTransferReservations,
        showReservation,
        showCreateReservationDialog,
    };
}
