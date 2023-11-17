import { computed, onBeforeUnmount, Ref, watch, ref } from "vue";
import { EventDoc, Reservation, User } from "@firetable/types";
import {
    BaseTable,
    Floor,
    FloorEditorElement,
    type FloorViewer,
    getFreeTables,
    getReservedTables,
    isTable,
} from "@firetable/floor-creator";
import { EventOwner, updateEventFloorData } from "@firetable/backend";
import { DialogChainObject, useQuasar } from "quasar";
import { takeProp } from "@firetable/utils";
import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { VueFirestoreDocumentData } from "vuefire";
import { useI18n } from "vue-i18n";

import FTDialog from "src/components/FTDialog.vue";
import EventCreateReservation from "src/components/Event/EventCreateReservation.vue";
import EventShowReservation from "src/components/Event/EventShowReservation.vue";
import { useAuthStore } from "src/stores/auth-store";

const HALF_HOUR = 30 * 60 * 1000; // 30 minutes in milliseconds

export function useReservations(
    users: Ref<User[]>,
    floorInstances: Set<FloorViewer>,
    eventOwner: EventOwner,
    event: Ref<VueFirestoreDocumentData<EventDoc> | undefined>,
) {
    const authStore = useAuthStore();
    // check every 1 minute
    const q = useQuasar();
    const { t } = useI18n();

    const intervalID = setInterval(checkReservationsForTimeAndMarkTableIfNeeded, 60 * 1000);
    const crossFloorReservationTransferTable = ref<
        { table: BaseTable; floor: FloorViewer } | undefined
    >();

    const canReserve = computed(() => {
        return authStore.canReserve;
    });

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

    function isOwnReservation(reservation: Reservation): boolean {
        return authStore.user?.id === reservation.creator?.id;
    }

    function canDeleteReservation(reservation: Reservation): boolean {
        return (
            authStore.canDeleteReservation ||
            (isOwnReservation(reservation) && authStore.canDeleteOwnReservation)
        );
    }

    function handleReservationCreation(
        floor: Floor,
        reservationData: Reservation,
        table: BaseTable,
    ): void {
        table.setReservation(reservationData);
        void tryCatchLoadingWrapper({
            hook: () => updateEventFloorData(eventOwner, floor),
        });
    }

    async function onDeleteReservation(floor: Floor, element: BaseTable): Promise<void> {
        if (!(await showConfirm("Delete reservation?")) || !element.reservation) return;
        element.setReservation(null);

        await tryCatchLoadingWrapper({
            hook: () => updateEventFloorData(eventOwner, floor),
        });
    }

    function onEditReservation(floor: Floor, element: BaseTable): void {
        showCreateReservationDialog(floor, element, "edit");
    }

    function resetCurrentOpenCreateReservationDialog(): void {
        currentOpenCreateReservationDialog = null;
    }

    function checkIfReservedTableAndCloseCreateReservationDialog(): void {
        if (!currentOpenCreateReservationDialog) return;

        const { dialog, label, floorId } = currentOpenCreateReservationDialog;
        const freeTables = freeTablesPerFloor.value.get(floorId);
        const isTableStillFree = freeTables?.includes(label);

        if (isTableStillFree) return;

        dialog.hide();
        currentOpenCreateReservationDialog = null;
        showErrorMessage(t("PageEvent.reservationAlreadyReserved"));
    }

    function filterUsersPerProperty(usersArray: User[], propertyId: string): User[] {
        return usersArray.filter((user) => {
            return user.relatedProperties.includes(propertyId);
        });
    }

    function showCreateReservationDialog(
        floor: Floor,
        element: BaseTable,
        mode: "create" | "edit",
    ): void {
        const { label } = element;
        const dialog = q
            .dialog({
                component: FTDialog,
                componentProps: {
                    component: EventCreateReservation,
                    title: `${t("EventShowReservation.title")} ${label}`,
                    maximized: false,
                    componentPropsObject: {
                        users: filterUsersPerProperty(users.value, eventOwner.propertyId),
                        mode,
                        reservationData: mode === "edit" ? element.reservation : void 0,
                        eventStartTimestamp: event.value!.date,
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

    function showReservation(
        floor: FloorViewer,
        reservation: Reservation,
        element: BaseTable,
    ): void {
        q.dialog({
            component: FTDialog,
            componentProps: {
                component: EventShowReservation,
                title: `${t("EventShowReservation.title")} ${element.label}`,
                maximized: false,
                componentPropsObject: {
                    canDeleteReservation: canDeleteReservation(reservation),
                    reservation,
                    crossFloorReservationTransferEnabled: floorInstances.size > 1,
                },
                listeners: {
                    delete: () => {
                        onDeleteReservation(floor, element).catch(showErrorMessage);
                    },
                    edit() {
                        onEditReservation(floor, element);
                    },
                    transfer() {
                        crossFloorReservationTransferTable.value = {
                            table: element,
                            floor,
                        };
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
            element.setReservation({
                ...reservation,
                confirmed: val,
            });
            return tryCatchLoadingWrapper({
                hook: () => updateEventFloorData(eventOwner, floor),
            });
        };
    }

    async function swapOrTransferReservations(
        floor: Floor,
        table1: BaseTable,
        table2: BaseTable,
    ): Promise<void> {
        if (!authStore.canReserve) {
            return;
        }
        if (!table1.reservation) {
            return;
        }

        const transferMessage = `This will transfer reservation from table ${table1.label} to table ${table2.label}`;
        const shouldTransfer = await showConfirm("Transfer reservation", transferMessage);

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

    function checkReservationsForTimeAndMarkTableIfNeeded(): void {
        if (!event.value?.date) {
            return;
        }

        const baseEventDate = new Date(event.value.date);
        const allReservedTablesArr = allReservedTables.value;

        allReservedTablesArr.forEach((table: BaseTable) => {
            if (
                table.reservation &&
                !table.reservation.confirmed &&
                shouldMarkReservationAsExpired(table.reservation.time, baseEventDate)
            ) {
                table.setFill("red");
            }
        });
    }

    async function swapOrTransferReservationsBetweenFloorPlans(
        floor1: FloorViewer,
        table1: BaseTable,
        floor2: FloorViewer,
        table2: BaseTable,
    ): Promise<void> {
        const transferMessage = `This will transfer reservation between floor plans "${floor1.name}" table "${table1.label}" to floor plan "${floor2.name}" table "${table2.label}"`;
        const shouldTransfer = await showConfirm("Transfer reservation", transferMessage);

        if (!shouldTransfer) {
            return;
        }

        const table1Reservation: Reservation | null = table1.reservation
            ? { ...table1.reservation }
            : null;

        if (table2.reservation) {
            table1.setReservation({ ...table2.reservation });
        } else {
            table1.setReservation(null);
        }
        table2.setReservation(table1Reservation);

        await tryCatchLoadingWrapper({
            hook: () => {
                return Promise.all([
                    updateEventFloorData(eventOwner, floor1),
                    updateEventFloorData(eventOwner, floor2),
                ]);
            },
        });
    }

    async function tableClickHandler(
        floor: FloorViewer,
        element: FloorEditorElement | undefined,
    ): Promise<void> {
        if (!isTable(element)) return;

        if (await handleCrossFloorReservationTransfer(floor, element)) {
            crossFloorReservationTransferTable.value = undefined;
            return;
        }

        const { reservation } = element;
        if (reservation) {
            showReservation(floor, reservation, element);
        } else if (canReserve.value) {
            showCreateReservationDialog(floor, element, "create");
        }
    }

    async function handleCrossFloorReservationTransfer(
        floor: FloorViewer,
        element: BaseTable,
    ): Promise<boolean> {
        if (!crossFloorReservationTransferTable.value) {
            return false;
        }

        if (crossFloorReservationTransferTable.value.floor.id === floor.id) {
            // If it is the same table, do nothing
            if (crossFloorReservationTransferTable.value.table.label === element.label) {
                return true;
            }
            await swapOrTransferReservations(
                floor,
                crossFloorReservationTransferTable.value.table,
                element,
            );
        } else {
            await swapOrTransferReservationsBetweenFloorPlans(
                crossFloorReservationTransferTable.value.floor,
                crossFloorReservationTransferTable.value.table,
                floor,
                element,
            );
        }

        return true;
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
        tableClickHandler,
    };
}

function shouldMarkReservationAsExpired(reservationTime: string, eventDate: Date): boolean {
    const currentDate = new Date();
    const [hours, minutes] = reservationTime.split(":");
    const eventDateTime = new Date(eventDate);
    eventDateTime.setHours(Number.parseInt(hours, 10), Number.parseInt(minutes, 10));

    if (hours.startsWith("0")) {
        eventDateTime.setDate(eventDateTime.getDate() + 1);
    }

    return currentDate.getTime() - eventDateTime.getTime() >= HALF_HOUR;
}
