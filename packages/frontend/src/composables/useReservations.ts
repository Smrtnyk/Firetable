import type { Ref, ShallowRef } from "vue";
import type { BaseTable, Floor, FloorEditorElement, FloorViewer } from "@firetable/floor-creator";
import type { EventOwner } from "@firetable/backend";
import type { DialogChainObject } from "quasar";
import type { VueFirestoreDocumentData } from "vuefire";
import type {
    AnyFunction,
    EventDoc,
    GuestDataPayload,
    PlannedReservationDoc,
    QueuedReservationDoc,
    Reservation,
    ReservationDoc,
    User,
} from "@firetable/types";
import {
    moveReservationFromQueue,
    moveReservationToQueue,
    deleteGuestVisit,
    setGuestData,
    addLogToEvent,
    addReservation,
    deleteReservation,
    updateReservationDoc,
} from "@firetable/backend";
import { isTable } from "@firetable/floor-creator";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { Notify } from "quasar";
import { isPlannedReservation, ReservationStatus } from "@firetable/types";
import {
    notifyPositive,
    showConfirm,
    showErrorMessage,
    tryCatchLoadingWrapper,
} from "src/helpers/ui-helpers";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "src/stores/auth-store";

import FTDialog from "src/components/FTDialog.vue";
import EventCreateReservation from "src/components/Event/reservation/EventCreateReservation.vue";
import EventShowReservation from "src/components/Event/reservation/EventShowReservation.vue";

import { determineTableColor } from "src/helpers/floor";
import { usePropertiesStore } from "src/stores/properties-store";
import { AppLogger } from "src/logger/FTLogger.js";
import { storeToRefs } from "pinia";
import { matchesProperty } from "es-toolkit/compat";
import { HALF_HOUR, ONE_MINUTE } from "src/constants";
import { useDialog } from "src/composables/useDialog";
import { hashString } from "src/helpers/hash-string";
import { maskPhoneNumber } from "src/helpers/mask-phone-number";
import { plannedToQueuedReservation } from "src/helpers/reservation/planned-to-queued-reservation";
import { queuedToPlannedReservation } from "src/helpers/reservation/queued-to-planned-reservation";

type OpenDialog = {
    label: string;
    dialog: DialogChainObject;
    floorId: string;
};

const enum GuestDataMode {
    SET = "set",
    DELETE = "delete",
}

type UseReservations = {
    initiateTableOperation: (operation: TableOperation) => void;
};

export const enum TableOperationType {
    RESERVATION_COPY = 1,
    RESERVATION_TRANSFER = 2,
    RESERVATION_DEQUEUE = 3,
}

interface ReservationCopyOperation {
    type: TableOperationType.RESERVATION_COPY;
    sourceFloor: FloorViewer;
    sourceTable: BaseTable;
}

interface ReservationTransferOperation {
    type: TableOperationType.RESERVATION_TRANSFER;
    sourceFloor: FloorViewer;
    sourceTable: BaseTable;
}

interface ReservationDequeueOperation {
    type: TableOperationType.RESERVATION_DEQUEUE;
    reservation: QueuedReservationDoc;
}

type TableOperation =
    | ReservationCopyOperation
    | ReservationDequeueOperation
    | ReservationTransferOperation;

export function useReservations(
    users: Ref<User[]>,
    reservations: Ref<ReservationDoc[]>,
    floorInstances: ShallowRef<FloorViewer[]>,
    eventOwner: EventOwner,
    event: Ref<VueFirestoreDocumentData<EventDoc> | undefined>,
): UseReservations {
    const { canReserve, nonNullableUser } = storeToRefs(useAuthStore());
    const { createDialog } = useDialog();
    const { t } = useI18n();
    const propertiesStore = usePropertiesStore();

    const currentTableOperation = ref<TableOperation | undefined>();
    let operationNotification: AnyFunction | undefined;

    const settings = computed(function () {
        return propertiesStore.getOrganisationSettingsById(eventOwner.organisationId);
    });

    const intervalID = setInterval(checkReservationsForTimeAndMarkTableIfNeeded, ONE_MINUTE);

    let currentOpenCreateReservationDialog: OpenDialog | undefined;

    watch(currentTableOperation, (newOperation) => {
        if (newOperation) {
            showOperationNotification(newOperation);
        } else if (operationNotification) {
            // Dismiss the notification if the operation is cleared
            operationNotification();
            operationNotification = undefined;
        }
    });

    watch([reservations, floorInstances], handleFloorUpdates, {
        deep: true,
    });

    function initiateTableOperation(operation: TableOperation): void {
        currentTableOperation.value = operation;
    }

    function showOperationNotification(operation: TableOperation): void {
        let message = "";
        switch (operation.type) {
            case TableOperationType.RESERVATION_DEQUEUE:
                message = `Moving reservation from on-hold`;
                break;
            case TableOperationType.RESERVATION_COPY:
                message = `Copying reservation from table ${operation.sourceTable.label}`;
                break;
            case TableOperationType.RESERVATION_TRANSFER:
                message = `Transferring reservation from table ${operation.sourceTable.label}`;
                break;
        }

        operationNotification = Notify.create({
            message,
            type: "ongoing",
            timeout: 0,
            position: "top",
            actions: [
                {
                    label: t("Global.cancel"),
                    color: "white",
                    noDismiss: true,
                    handler: onCancelOperation,
                },
            ],
        });
    }

    async function onCancelOperation(): Promise<void> {
        const confirm = await showConfirm(
            "Cancel Operation",
            "Are you sure you want to cancel the current operation?",
        );

        if (confirm) {
            // This will also dismiss the notification
            currentTableOperation.value = undefined;
        }
    }

    async function handleGuestDataForReservation(
        reservationData: Reservation,
        mode: GuestDataMode,
    ): Promise<void> {
        if (!event.value) {
            return;
        }

        if (!settings.value.guest.collectGuestData) {
            return;
        }

        if (!reservationData.guestContact || !reservationData.guestName) {
            return;
        }

        const data: GuestDataPayload = {
            preparedGuestData: {
                contact: reservationData.guestContact,
                hashedContact: await hashString(reservationData.guestContact),
                maskedContact: maskPhoneNumber(reservationData.guestContact),
                guestName: reservationData.guestName,
                arrived: reservationData.arrived,
                cancelled: isPlannedReservation(reservationData)
                    ? reservationData.cancelled
                    : false,
                isVIP: reservationData.isVIP,
            },
            propertyId: eventOwner.propertyId,
            organisationId: eventOwner.organisationId,
            eventId: eventOwner.id,
            eventName: event.value.name,
            eventDate: event.value.date,
        };

        if (mode === GuestDataMode.SET) {
            setGuestData(data).catch(AppLogger.error.bind(AppLogger));
        } else {
            deleteGuestVisit(data).catch(AppLogger.error.bind(AppLogger));
        }
    }

    function handleFloorUpdates([newReservations, newFloorInstances]: [
        ReservationDoc[],
        FloorViewer[],
    ]): void {
        checkIfReservedTableAndCloseCreateReservationDialog();
        registerTableClickHandlers(newFloorInstances);
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

    function registerTableClickHandlers(floorInstancesArray: FloorViewer[]): void {
        for (const floorViewer of floorInstancesArray) {
            // De-register the old handler first
            floorViewer.off("elementClicked", tableClickHandler);
            floorViewer.on("elementClicked", tableClickHandler);
        }
    }

    function setReservation(table: BaseTable, reservation: ReservationDoc): void {
        if (reservation.isVIP) {
            table.setVIPStatus(true);
        }

        const fill = determineTableColor(reservation, settings.value.event);
        if (fill) {
            table.setFill(fill);
        }
    }

    function createEventLog(message: string): void {
        addLogToEvent(eventOwner, message, nonNullableUser.value).catch(
            AppLogger.error.bind(AppLogger),
        );
    }

    function handleReservationCreation(reservationData: Reservation): void {
        void tryCatchLoadingWrapper({
            async hook() {
                await addReservation(eventOwner, reservationData);
                notifyPositive("Reservation created");
                createEventLog(`Reservation created on table ${reservationData.tableLabel}`);
                handleGuestDataForReservation(reservationData, GuestDataMode.SET).catch(
                    AppLogger.error.bind(AppLogger),
                );
            },
        });
    }

    function handleReservationUpdate(reservationData: ReservationDoc): void {
        void tryCatchLoadingWrapper({
            async hook() {
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
                if (
                    isEventInProgress(event.value.date) ||
                    (isPlannedReservation(reservation) && reservation.cancelled)
                ) {
                    await updateReservationDoc(eventOwner, {
                        status: ReservationStatus.DELETED,
                        id: reservation.id,
                        clearedAt: Date.now(),
                    });
                    createEventLog(`Reservation soft deleted on table ${reservation.tableLabel}`);
                } else {
                    await deleteReservation(eventOwner, reservation);
                    createEventLog(`Reservation deleted on table ${reservation.tableLabel}`);
                    handleGuestDataForReservation(reservation, GuestDataMode.DELETE).catch(
                        AppLogger.error.bind(AppLogger),
                    );
                }
            },
        });
    }

    function resetCurrentOpenCreateReservationDialog(): void {
        currentOpenCreateReservationDialog = undefined;
    }

    function checkIfReservedTableAndCloseCreateReservationDialog(): void {
        if (!currentOpenCreateReservationDialog) {
            return;
        }

        const { dialog, label, floorId } = currentOpenCreateReservationDialog;
        const isTableStillFree = reservations.value.find((reservation) => {
            return reservation.tableLabel === label && reservation.floorId === floorId;
        });

        if (!isTableStillFree) {
            return;
        }

        dialog.hide();
        currentOpenCreateReservationDialog = undefined;
        showErrorMessage(t("PageEvent.reservationAlreadyReserved"));
    }

    function filterUsersPerProperty(usersArray: User[], propertyId: string): User[] {
        return usersArray.filter(function (user) {
            return user.relatedProperties.includes(propertyId);
        });
    }

    function showCreateReservationDialog(
        floor: Floor,
        element: BaseTable,
        reservation: ReservationDoc | undefined,
        mode: "create" | "update",
    ): void {
        const { label } = element;
        const eventStartTimestamp = event.value?.date;
        if (!eventStartTimestamp) {
            showErrorMessage("An error occurred, please refresh the page.");
            throw new Error("Event start timestamp is not defined");
        }
        const dialog = createDialog({
            component: FTDialog,
            componentProps: {
                component: EventCreateReservation,
                title: `${t("EventCreateReservation.title")} ${label}`,
                maximized: false,
                componentPropsObject: {
                    currentUser: nonNullableUser.value,
                    users: filterUsersPerProperty(users.value, eventOwner.propertyId),
                    mode,
                    reservationData:
                        mode === "update" && reservation
                            ? { ...reservation, id: reservation.id }
                            : void 0,
                    eventStartTimestamp,
                    eventDurationInHours: settings.value.event.eventDurationInHours,
                },
                listeners: {
                    create(reservationData: Omit<Reservation, "floorId" | "tableLabel">) {
                        resetCurrentOpenCreateReservationDialog();
                        handleReservationCreation({
                            ...reservationData,
                            floorId: floor.id,
                            tableLabel: label,
                        } as Reservation);
                        dialog.hide();
                    },
                    update(reservationData: ReservationDoc) {
                        handleReservationUpdate(reservationData);
                        dialog.hide();
                    },
                },
            },
        }).onDismiss(resetCurrentOpenCreateReservationDialog);

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
        createDialog({
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
                        showCreateReservationDialog(floor, element, reservation, "update");
                    },
                    transfer() {
                        initiateReservationTransfer(floor, element);
                    },
                    copy() {
                        initiateReservationCopy(floor, element);
                    },
                    arrived(val: boolean) {
                        if (!isPlannedReservation(reservation)) {
                            return;
                        }
                        onGuestArrived(reservation, val).catch(showErrorMessage);
                    },
                    waitingForResponse(val: boolean) {
                        if (!isPlannedReservation(reservation)) {
                            return;
                        }

                        reservationWaitingForResponse(val, reservation).catch(showErrorMessage);
                    },
                    reservationConfirmed(val: boolean) {
                        if (!isPlannedReservation(reservation)) {
                            return;
                        }
                        reservationConfirmed(val, reservation).catch(showErrorMessage);
                    },
                    cancel(val: boolean) {
                        if (!isPlannedReservation(reservation)) {
                            return;
                        }
                        onReservationCancelled(reservation, val).catch(showErrorMessage);
                    },
                    queue() {
                        if (!isPlannedReservation(reservation)) {
                            return;
                        }
                        onMoveReservationToQueue(reservation).catch(showErrorMessage);
                    },
                },
            },
        });
    }

    function onGuestArrived(reservation: PlannedReservationDoc, val: boolean): Promise<void> {
        return tryCatchLoadingWrapper({
            async hook() {
                await updateReservationDoc(eventOwner, {
                    id: reservation.id,
                    arrived: val,
                    waitingForResponse: false,
                });
                handleGuestDataForReservation(
                    {
                        ...reservation,
                        arrived: val,
                    },
                    GuestDataMode.SET,
                ).catch(AppLogger.error.bind(AppLogger));
            },
        });
    }

    function reservationConfirmed(val: boolean, reservation: PlannedReservationDoc): Promise<void> {
        return tryCatchLoadingWrapper({
            hook() {
                return updateReservationDoc(eventOwner, {
                    id: reservation.id,
                    reservationConfirmed: val,
                    waitingForResponse: false,
                });
            },
        });
    }

    function reservationWaitingForResponse(
        val: boolean,
        reservation: ReservationDoc,
    ): Promise<void> {
        return tryCatchLoadingWrapper({
            hook() {
                return updateReservationDoc(eventOwner, {
                    id: reservation.id,
                    waitingForResponse: val,
                    reservationConfirmed: false,
                });
            },
        });
    }

    function onReservationCancelled(
        reservation: PlannedReservationDoc,
        val: boolean,
    ): Promise<void> {
        return tryCatchLoadingWrapper({
            async hook() {
                await updateReservationDoc(eventOwner, {
                    id: reservation.id,
                    cancelled: val,
                    waitingForResponse: false,
                });
                handleGuestDataForReservation(
                    {
                        ...reservation,
                        cancelled: val,
                    },
                    GuestDataMode.SET,
                ).catch(AppLogger.error.bind(AppLogger));
            },
        });
    }

    async function onMoveReservationToQueue(reservation: PlannedReservationDoc): Promise<void> {
        if (!(await showConfirm("Are you sure you want to move this reservation to queue?"))) {
            return;
        }

        const toQueuedReservation = plannedToQueuedReservation(reservation);
        await tryCatchLoadingWrapper({
            hook() {
                return moveReservationToQueue(eventOwner, reservation.id, toQueuedReservation);
            },
        });
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
            async hook() {
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
        if (!canReserve.value) {
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
            async hook() {
                await Promise.all(promises);
                createEventLog(
                    `Reservation transferred from table ${table1.label} to table ${table2.label}`,
                );
            },
        });
    }

    function markReservationAsExpired(reservation: ReservationDoc): void {
        const floor = floorInstances.value.find(matchesProperty("id", reservation.floorId));
        floor?.getTableByLabel(reservation.tableLabel)?.setFill("red");
    }

    function checkReservationsForTimeAndMarkTableIfNeeded(): void {
        if (!event.value?.date) {
            return;
        }

        const baseEventDate = new Date(event.value.date);

        reservations.value
            .filter(function (reservation) {
                return (
                    !reservation.arrived &&
                    shouldMarkReservationAsExpired(reservation.time, baseEventDate)
                );
            })
            .forEach(markReservationAsExpired);
    }

    async function swapOrTransferReservationsBetweenFloorPlans(
        floor1: FloorViewer,
        table1: BaseTable,
        floor2: FloorViewer,
        table2: BaseTable,
    ): Promise<void> {
        const reservationTable1 = reservations.value.find(function (reservation) {
            return reservation.floorId === floor1.id && reservation.tableLabel === table1.label;
        });

        if (!reservationTable1) {
            return;
        }

        const reservationTable2 = reservations.value.find(function (reservation) {
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
            hook() {
                return Promise.all(promises);
            },
        });
    }

    async function handleTableOperation(
        targetFloor: FloorViewer,
        targetTable: BaseTable,
        targetReservation: ReservationDoc | undefined,
    ): Promise<void> {
        const operation = currentTableOperation.value;
        if (!operation) {
            return;
        }

        switch (operation.type) {
            case TableOperationType.RESERVATION_COPY:
                await handleReservationCopy(operation, targetFloor, targetTable, targetReservation);
                break;
            case TableOperationType.RESERVATION_TRANSFER:
                await handleReservationTransfer(operation, targetFloor, targetTable);
                break;
            case TableOperationType.RESERVATION_DEQUEUE:
                await handleReservationDequeue(operation, targetFloor.id, targetTable.label);
                break;
        }
    }

    async function handleReservationDequeue(
        operation: ReservationDequeueOperation,
        floorId: string,
        tableLabel: string,
    ): Promise<void> {
        await tryCatchLoadingWrapper({
            hook() {
                return moveReservationFromQueue(
                    eventOwner,
                    operation.reservation.id,
                    queuedToPlannedReservation(operation.reservation, floorId, tableLabel),
                );
            },
        });
    }

    async function handleReservationCopy(
        operation: ReservationCopyOperation,
        targetFloor: FloorViewer,
        targetTable: BaseTable,
        targetReservation: ReservationDoc | undefined,
    ): Promise<void> {
        const { sourceFloor, sourceTable } = operation;

        if (sourceFloor.id === targetFloor.id && sourceTable.label === targetTable.label) {
            showErrorMessage("Cannot copy reservation to the same table!");
            return;
        }

        if (targetReservation) {
            showErrorMessage("Cannot copy reservation to an already reserved table!");
            return;
        }

        const confirm = await showConfirm(
            "Confirm Copy",
            `Copy reservation from table ${sourceTable.label} to table ${targetTable.label}?`,
        );
        if (!confirm) return;

        const reservation = reservations.value.find(
            (res) => res.tableLabel === sourceTable.label && res.floorId === sourceFloor.id,
        );
        if (!reservation) {
            showErrorMessage("Source reservation not found.");
            return;
        }

        await copyReservation(reservation, targetTable, targetFloor);
    }

    async function handleReservationTransfer(
        operation: ReservationTransferOperation,
        targetFloor: FloorViewer,
        targetTable: BaseTable,
    ): Promise<void> {
        const { sourceFloor, sourceTable } = operation;

        if (sourceFloor.id === targetFloor.id && sourceTable.label === targetTable.label) {
            showErrorMessage("Cannot transfer reservation to the same table!");
            return;
        }

        const confirm = await showConfirm(
            "Confirm Transfer",
            `Transfer reservation from table ${sourceTable.label} to table ${targetTable.label}?`,
        );

        if (!confirm) {
            return;
        }

        const isSameFloor = sourceFloor.id === targetFloor.id;
        await (isSameFloor
            ? swapOrTransferReservations(sourceFloor, sourceTable, targetTable)
            : swapOrTransferReservationsBetweenFloorPlans(
                  sourceFloor,
                  sourceTable,
                  targetFloor,
                  targetTable,
              ));
    }

    function initiateReservationCopy(floor: FloorViewer, table: BaseTable): void {
        currentTableOperation.value = {
            type: TableOperationType.RESERVATION_COPY,
            sourceFloor: floor,
            sourceTable: table,
        };
    }

    function initiateReservationTransfer(floor: FloorViewer, table: BaseTable): void {
        currentTableOperation.value = {
            type: TableOperationType.RESERVATION_TRANSFER,
            sourceFloor: floor,
            sourceTable: table,
        };
    }

    async function tableClickHandler(
        floor: FloorViewer,
        element: FloorEditorElement | undefined,
    ): Promise<void> {
        if (!isTable(element)) {
            return;
        }

        const reservation = reservations.value.find(
            (res) => res.tableLabel === element.label && res.floorId === floor.id,
        );

        if (currentTableOperation.value) {
            await handleTableOperation(floor, element, reservation);
            currentTableOperation.value = undefined;
            return;
        }

        if (reservation) {
            showReservation(floor, reservation, element);
        } else if (canReserve.value) {
            showCreateReservationDialog(floor, element, reservation, "create");
        }
    }

    onBeforeUnmount(function () {
        clearInterval(intervalID);
    });

    return {
        initiateTableOperation,
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

function isEventInProgress(eventDate: number): boolean {
    const currentDateInUTC = Date.now();

    return currentDateInUTC >= eventDate;
}
