import type { Ref, ShallowRef } from "vue";
import type { BaseTable, Floor, FloorEditorElement, FloorViewer } from "@firetable/floor-creator";
import type { EventOwner } from "@firetable/backend";
import type { DialogChainObject } from "quasar";
import type { VueFirestoreDocumentData } from "vuefire";
import type { EventDoc, Reservation, ReservationDoc, User } from "@firetable/types";
import {
    getFirestoreTimestamp,
    deleteGuestVisit,
    setGuestData,
    addLogToEvent,
    addReservation,
    deleteReservation,
    updateReservationDoc,
} from "@firetable/backend";
import { isTable } from "@firetable/floor-creator";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ReservationStatus } from "@firetable/types";
import { useQuasar } from "quasar";
import {
    notifyPositive,
    showConfirm,
    showErrorMessage,
    tryCatchLoadingWrapper,
} from "src/helpers/ui-helpers";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "src/stores/auth-store";
import { NOOP } from "@firetable/utils";

import FTDialog from "src/components/FTDialog.vue";
import EventCreateReservation from "src/components/Event/reservation/EventCreateReservation.vue";
import EventShowReservation from "src/components/Event/EventShowReservation.vue";
import { determineTableColor } from "src/helpers/floor";
import { isValidEuropeanPhoneNumber } from "src/helpers/utils";
import { isEventInProgress } from "src/helpers/events-utils";

const HALF_HOUR = 30 * 60 * 1000; // 30 minutes in milliseconds

const enum GuestDataMode {
    SET = "set",
    DELETE = "delete",
}

export function useReservations(
    users: Ref<User[]>,
    reservations: Ref<ReservationDoc[]>,
    floorInstances: ShallowRef<FloorViewer[]>,
    eventOwner: EventOwner,
    event: Ref<VueFirestoreDocumentData<EventDoc> | undefined>,
) {
    const authStore = useAuthStore();
    const q = useQuasar();
    const { t } = useI18n();

    // check every 1 minute
    const intervalID = setInterval(checkReservationsForTimeAndMarkTableIfNeeded, 60 * 1000);
    const crossFloorReservationTransferTable = ref<
        { table: BaseTable; floor: FloorViewer } | undefined
    >();
    const crossFloorReservationCopyTable = ref<
        { table: BaseTable; floor: FloorViewer } | undefined
    >();

    const canReserve = computed(() => {
        return authStore.canReserve;
    });

    let currentOpenCreateReservationDialog:
        | {
              label: string;
              dialog: DialogChainObject;
              floorId: string;
          }
        | undefined;

    watch([reservations, floorInstances], handleFloorUpdates, {
        immediate: true,
        deep: true,
    });

    function handleGuestDataForReservation(
        reservationData: Reservation,
        mode: GuestDataMode,
    ): void {
        if (!event.value) {
            return;
        }

        if (!isValidEuropeanPhoneNumber(reservationData.guestContact)) {
            return;
        }

        const data = {
            reservation: reservationData,
            propertyId: eventOwner.propertyId,
            organisationId: eventOwner.organisationId,
            eventId: eventOwner.id,
            eventName: event.value.name,
            eventDate: event.value.date,
        };

        if (mode === GuestDataMode.SET) {
            setGuestData(data).catch(console.error);
        } else {
            deleteGuestVisit(data).catch(console.error);
        }
    }

    async function handleFloorUpdates([newReservations, newFloorInstances]: [
        ReservationDoc[],
        FloorViewer[],
    ]): Promise<void> {
        checkIfReservedTableAndCloseCreateReservationDialog();
        for (const floor of newFloorInstances) {
            floor.clearAllReservations();
            for (const reservation of newReservations) {
                if (reservation.floorId === floor.id) {
                    const table = floor.getTableByLabel(reservation.tableLabel);
                    if (table) {
                        setReservation(table, reservation);
                    }
                }
            }
        }
        checkReservationsForTimeAndMarkTableIfNeeded();
    }

    function setReservation(table: BaseTable, reservation: ReservationDoc): void {
        table.setReservation(reservation);
        const fill = determineTableColor(reservation);
        if (fill) {
            table.setFill(fill);
        }
    }

    function createEventLog(message: string): void {
        addLogToEvent(eventOwner, message, authStore.user!).catch(NOOP);
    }

    function handleReservationCreation(reservationData: Reservation): void {
        void tryCatchLoadingWrapper({
            hook: async function () {
                await addReservation(eventOwner, reservationData);
                notifyPositive("Reservation created");
                createEventLog(`Reservation created on table ${reservationData.tableLabel}`);
                handleGuestDataForReservation(reservationData, GuestDataMode.SET);
            },
        });
    }

    function handleReservationUpdate(reservationData: ReservationDoc): void {
        void tryCatchLoadingWrapper({
            hook: async function () {
                await updateReservationDoc(eventOwner, reservationData);
                notifyPositive("Reservation updated");
                createEventLog(`Reservation edited on table ${reservationData.tableLabel}`);
            },
        });
    }

    async function onDeleteReservation(reservation: ReservationDoc): Promise<void> {
        if (!(await showConfirm("Delete reservation?"))) {
            return;
        }

        await tryCatchLoadingWrapper({
            async hook() {
                if (!event.value) {
                    return;
                }
                // If reservation is cancelled or event is in progress, soft delete it
                // otherwise just delete it permanently
                // we soft delete these, so they can be used in analytics
                // reservations deleted during event are probably deleted to free up the table for the next guest
                if (isEventInProgress(event.value.date) || reservation.cancelled) {
                    await updateReservationDoc(eventOwner, {
                        status: ReservationStatus.DELETED,
                        id: reservation.id,
                        clearedAt: getFirestoreTimestamp(),
                    });
                    createEventLog(`Reservation soft deleted on table ${reservation.tableLabel}`);
                } else {
                    await deleteReservation(eventOwner, reservation);
                    createEventLog(`Reservation deleted on table ${reservation.tableLabel}`);
                    handleGuestDataForReservation(reservation, GuestDataMode.DELETE);
                }
            },
        });
    }

    function resetCurrentOpenCreateReservationDialog(): void {
        currentOpenCreateReservationDialog = undefined;
    }

    function checkIfReservedTableAndCloseCreateReservationDialog(): void {
        if (!currentOpenCreateReservationDialog) return;
        const { dialog, label, floorId } = currentOpenCreateReservationDialog;
        const isTableStillFree = reservations.value.find((reservation) => {
            return reservation.tableLabel === label && reservation.floorId === floorId;
        });

        if (!isTableStillFree) return;

        dialog.hide();
        currentOpenCreateReservationDialog = undefined;
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
                    title: `${t("EventCreateReservation.title")} ${label}`,
                    maximized: false,
                    componentPropsObject: {
                        users: filterUsersPerProperty(users.value, eventOwner.propertyId),
                        mode,
                        reservationData:
                            mode === "edit" && element.reservation
                                ? { ...element.reservation, id: element.reservation.id }
                                : void 0,
                        eventStartTimestamp: event.value!.date,
                        floor: floor,
                        table: element,
                    },
                    listeners: {
                        create: (reservationData: Reservation) => {
                            resetCurrentOpenCreateReservationDialog();
                            handleReservationCreation(reservationData);
                            dialog.hide();
                        },
                        update(reservationData: ReservationDoc) {
                            handleReservationUpdate(reservationData);
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
        reservation: ReservationDoc,
        element: BaseTable,
    ): void {
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
                    delete() {
                        onDeleteReservation(reservation).catch(showErrorMessage);
                    },
                    edit() {
                        showCreateReservationDialog(floor, element, "edit");
                    },
                    transfer() {
                        crossFloorReservationTransferTable.value = {
                            table: element,
                            floor,
                        };
                    },
                    copy() {
                        crossFloorReservationCopyTable.value = {
                            table: element,
                            floor,
                        };
                    },
                    confirm: onGuestArrived(reservation),
                    reservationConfirmed: reservationConfirmed(reservation),
                    cancel: onReservationCancelled(reservation),
                },
            },
        });
    }

    function onGuestArrived(reservation: ReservationDoc) {
        return function (val: boolean) {
            return tryCatchLoadingWrapper({
                async hook() {
                    await updateReservationDoc(eventOwner, {
                        id: reservation.id,
                        arrived: val,
                    });
                    handleGuestDataForReservation(
                        {
                            ...reservation,
                            arrived: val,
                        },
                        GuestDataMode.SET,
                    );
                },
            });
        };
    }

    function reservationConfirmed(reservation: ReservationDoc) {
        return function (val: boolean) {
            return tryCatchLoadingWrapper({
                hook: () =>
                    updateReservationDoc(eventOwner, {
                        id: reservation.id,
                        reservationConfirmed: val,
                    }),
            });
        };
    }

    function onReservationCancelled(reservation: ReservationDoc) {
        return function (val: boolean) {
            return tryCatchLoadingWrapper({
                async hook() {
                    await updateReservationDoc(eventOwner, {
                        id: reservation.id,
                        cancelled: val,
                    });
                    handleGuestDataForReservation(
                        {
                            ...reservation,
                            cancelled: val,
                        },
                        GuestDataMode.SET,
                    );
                },
            });
        };
    }

    async function copyReservation(
        sourceReservation: Reservation,
        targetTable: BaseTable,
        targetFloor: Floor,
    ): Promise<void> {
        const newReservation = {
            ...sourceReservation,
            tableLabel: targetTable.label,
            floorId: targetFloor.id,
        };

        await tryCatchLoadingWrapper({
            hook: async function () {
                await addReservation(eventOwner, newReservation);
                createEventLog(
                    `Reservation copied from table ${sourceReservation.tableLabel} to table ${targetTable.label}`,
                );
            },
        });
    }

    async function swapOrTransferReservations(
        floor: Floor,
        table1: BaseTable,
        table2: BaseTable,
    ): Promise<void> {
        if (!authStore.canReserve) {
            return;
        }

        const reservationTable1 = reservations.value.find((reservation) => {
            return reservation.floorId === floor.id && reservation.tableLabel === table1.label;
        });

        if (!reservationTable1) {
            return;
        }

        const transferMessage = `This will transfer reservation from table ${table1.label} to table ${table2.label}`;
        const shouldTransfer = await showConfirm("Transfer reservation", transferMessage);

        if (!shouldTransfer) {
            return;
        }

        const reservationTable2 = reservations.value.find((reservation) => {
            return reservation.floorId === floor.id && reservation.tableLabel === table2.label;
        });

        const reservation1 = { ...reservationTable1 };

        reservationTable1.tableLabel = table2.label;

        const promises: Promise<void>[] = [];
        promises.push(
            updateReservationDoc(eventOwner, {
                ...reservationTable1,
                id: reservationTable1.id,
            }),
        );

        if (reservationTable2) {
            reservationTable2.tableLabel = reservation1.tableLabel;
            promises.push(
                updateReservationDoc(eventOwner, {
                    ...reservationTable2,
                    id: reservationTable2.id,
                }),
            );
        }

        await tryCatchLoadingWrapper({
            hook: async function () {
                await Promise.all(promises);
                createEventLog(
                    `Reservation transferred from table ${table1.label} to table ${table2.label}`,
                );
            },
        });
    }

    function checkReservationsForTimeAndMarkTableIfNeeded(): void {
        if (!event.value?.date) {
            return;
        }

        const baseEventDate = new Date(event.value.date);

        reservations.value.forEach((reservation) => {
            if (reservation.arrived) {
                return;
            }

            if (!shouldMarkReservationAsExpired(reservation.time, baseEventDate)) {
                return;
            }

            const floor = floorInstances.value.find(({ id }) => id === reservation.floorId);
            const table = floor?.getTableByLabel(reservation.tableLabel);
            table?.setFill("red");
        });
    }

    async function swapOrTransferReservationsBetweenFloorPlans(
        floor1: FloorViewer,
        table1: BaseTable,
        floor2: FloorViewer,
        table2: BaseTable,
    ): Promise<void> {
        const reservationTable1 = reservations.value.find((reservation) => {
            return reservation.floorId === floor1.id && reservation.tableLabel === table1.label;
        });

        if (!reservationTable1) {
            return;
        }

        const reservationTable2 = reservations.value.find((reservation) => {
            return reservation.floorId === floor2.id && reservation.tableLabel === table2.label;
        });

        const transferMessage = `This will transfer reservation between floor plans "${floor1.name}" table "${table1.label}" to floor plan "${floor2.name}" table "${table2.label}"`;
        const shouldTransfer = await showConfirm("Transfer reservation", transferMessage);

        if (!shouldTransfer) {
            return;
        }

        const reservation1 = { ...reservationTable1 };

        reservationTable1.tableLabel = table2.label;
        reservationTable1.floorId = floor2.id;

        const promises: Promise<void>[] = [];
        promises.push(
            updateReservationDoc(eventOwner, {
                ...reservationTable1,
                id: reservationTable1.id,
            }),
        );
        if (reservationTable2) {
            reservationTable2.tableLabel = reservation1.tableLabel;
            reservationTable2.floorId = reservation1.floorId;
            promises.push(
                updateReservationDoc(eventOwner, {
                    ...reservationTable2,
                    id: reservationTable2.id,
                }),
            );
        }

        await tryCatchLoadingWrapper({
            hook: () => Promise.all(promises),
        });
    }

    async function handleCrossFloorReservationCopy(
        targetFloor: FloorViewer,
        targetTable: BaseTable,
    ): Promise<void> {
        if (!crossFloorReservationCopyTable.value) {
            return;
        }

        const { table, floor } = crossFloorReservationCopyTable.value;

        if (table.label === targetTable.label && floor.id === targetFloor.id) {
            showErrorMessage("Cannot copy reservation to the same table!");
            return;
        }

        if (targetTable.reservation) {
            showErrorMessage("Cannot copy reservation to an already reserved table!");
            return;
        }

        const transferMessage = `This will copy reservation from table ${table.label} to table ${targetTable.label}`;
        const shouldTransfer = await showConfirm("Transfer reservation", transferMessage);

        if (!shouldTransfer) {
            return;
        }

        const reservation = reservations.value.find((res) => {
            return res.tableLabel === table.label && res.floorId === floor.id;
        });

        if (!reservation) {
            return;
        }

        await copyReservation(reservation, targetTable, targetFloor);
    }

    async function tableClickHandler(
        floor: FloorViewer,
        element: FloorEditorElement | undefined,
    ): Promise<void> {
        if (!isTable(element)) return;

        if (crossFloorReservationCopyTable.value) {
            await handleCrossFloorReservationCopy(floor, element);
            crossFloorReservationCopyTable.value = undefined;
            return;
        }

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
        tableClickHandler,
        // Used in unit test
        onDeleteReservation,
        handleReservationCreation,
    };
}

function shouldMarkReservationAsExpired(reservationTime: string, eventDate: Date): boolean {
    const currentDate = new Date();
    const [hours, minutes] = reservationTime.split(":");
    const eventDateTime = new Date(eventDate);
    eventDateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes));

    if (hours.startsWith("0")) {
        eventDateTime.setDate(eventDateTime.getDate() + 1);
    }

    return currentDate.getTime() - eventDateTime.getTime() >= HALF_HOUR;
}
