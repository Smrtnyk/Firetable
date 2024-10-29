import type { Ref, ShallowRef } from "vue";
import type { BaseTable, Floor, FloorEditorElement, FloorViewer } from "@firetable/floor-creator";
import type { EventOwner } from "@firetable/backend";
import type { DialogChainObject } from "quasar";
import type { VueFirestoreDocumentData } from "vuefire";
import type {
    AnyFunction,
    EventDoc,
    PlannedReservationDoc,
    QueuedReservationDoc,
    Reservation,
    ReservationDoc,
    User,
} from "@firetable/types";
import type { GuestSummary } from "src/stores/guests-store";
import {
    moveReservationFromQueue,
    moveReservationToQueue,
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
import { ONE_MINUTE } from "src/constants";
import { useDialog } from "src/composables/useDialog";
import { plannedToQueuedReservation } from "src/helpers/reservation/planned-to-queued-reservation";
import { queuedToPlannedReservation } from "src/helpers/reservation/queued-to-planned-reservation";
import { shouldMarkReservationAsExpired } from "src/helpers/reservation/should-mark-reservation-as-expired";
import { isEventInProgress } from "src/helpers/event/is-event-in-progress";
import { eventEmitter } from "src/boot/event-emitter";
import { hashString } from "src/helpers/hash-string";
import { useGuestsStore } from "src/stores/guests-store";
import { useRouter } from "vue-router";

type OpenDialog = {
    label: string;
    dialog: DialogChainObject;
    floorId: string;
};

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
    const { createDialog } = useDialog();
    const { t } = useI18n();
    const { canReserve, nonNullableUser, canSeeGuestbook } = storeToRefs(useAuthStore());
    const router = useRouter();
    const propertiesStore = usePropertiesStore();
    const guestsStore = useGuestsStore();

    const currentTableOperation = ref<TableOperation | undefined>();
    let operationNotification: AnyFunction | undefined;

    const settings = computed(function () {
        return propertiesStore.getOrganisationSettingsById(eventOwner.organisationId);
    });
    const propertySettings = computed(function () {
        return propertiesStore.getPropertySettingsById(eventOwner.propertyId);
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

    function cancelCurrentOperation(): void {
        currentTableOperation.value = undefined;
    }

    function initiateTableOperation(operation: TableOperation): void {
        currentTableOperation.value = operation;
    }

    function showOperationNotification(operation: TableOperation): void {
        let message;
        switch (operation.type) {
            case TableOperationType.RESERVATION_DEQUEUE:
                message = t("useReservations.movingReservationOperationMsg");
                break;
            case TableOperationType.RESERVATION_COPY:
                message = t("useReservations.copyingReservationOperationMsg", {
                    tableLabel: operation.sourceTable.label,
                });
                break;
            case TableOperationType.RESERVATION_TRANSFER:
                message = t("useReservations.transferringReservationOperationMsg", {
                    tableLabel: operation.sourceTable.label,
                });
                break;
            default:
                throw new Error("Invalid table operation type!");
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
            t("useReservations.cancelTableOperationTitle"),
            t("useReservations.cancelTableOperationMsg"),
        );

        if (confirm) {
            // This will also dismiss the notification
            cancelCurrentOperation();
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

    function handleReservationCreation(reservationData: Reservation): void {
        void tryCatchLoadingWrapper({
            async hook() {
                await addReservation(eventOwner, reservationData);
                notifyPositive("Reservation created");

                eventEmitter.emit("reservation:created", {
                    reservation: reservationData,
                    eventOwner,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
                    event: event.value!,
                });
            },
        });
    }

    function handleReservationUpdate(reservationData: ReservationDoc): void {
        void tryCatchLoadingWrapper({
            async hook() {
                await updateReservationDoc(eventOwner, reservationData);
                notifyPositive(t("useReservations.reservationUpdatedMsg"));
                eventEmitter.emit("reservation:updated", {
                    reservation: reservationData,
                    eventOwner,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
                    event: event.value!,
                });
            },
        });
    }

    async function onDeleteReservation(reservation: ReservationDoc): Promise<void> {
        const shouldDelete = await showConfirm(t("useReservations.deleteReservationTitle"));
        if (!shouldDelete) {
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
                // FIXME: We should probably add a button to end the visit though and not delete the reservation
                if (
                    isEventInProgress(event.value.date) ||
                    (isPlannedReservation(reservation) && reservation.cancelled)
                ) {
                    await updateReservationDoc(eventOwner, {
                        status: ReservationStatus.DELETED,
                        id: reservation.id,
                        clearedAt: Date.now(),
                    });
                    eventEmitter.emit("reservation:deleted:soft", {
                        reservation,
                        eventOwner,
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
                        event: event.value!,
                    });
                } else {
                    await deleteReservation(eventOwner, reservation);
                    eventEmitter.emit("reservation:deleted", {
                        reservation,
                        eventOwner,
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
                        event: event.value!,
                    });
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
        showErrorMessage(t("useReservations.reservationAlreadyReserved"));
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

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
        const eventStartTimestamp = event.value!.date;

        const dialog = createDialog({
            component: FTDialog,
            componentProps: {
                component: EventCreateReservation,
                title: `${t("EventCreateReservation.title")} ${label}`,
                maximized: false,
                componentPropsObject: {
                    timezone: propertySettings.value.timezone,
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

    async function getGuestSummary(reservation: ReservationDoc): Promise<GuestSummary | undefined> {
        if (!reservation.guestContact) {
            return undefined;
        }

        if (!canSeeGuestbook.value) {
            return;
        }

        try {
            return await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                eventOwner.organisationId,
                await hashString(reservation.guestContact),
                eventOwner.propertyId,
                eventOwner.id,
            );
        } catch (error) {
            AppLogger.error("Error fetching guest data", error);
        }

        return undefined;
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
                    timezone: propertySettings.value.timezone,
                    guestSummaryPromise: getGuestSummary(reservation),
                },
                listeners: {
                    goToGuestProfile(guestId: string) {
                        router.push({
                            name: "adminGuest",
                            params: {
                                organisationId: eventOwner.organisationId,
                                guestId,
                            },
                        });
                    },
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

                eventEmitter.emit("reservation:arrived", {
                    reservation: {
                        ...reservation,
                        arrived: val,
                    },
                    eventOwner,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
                    event: event.value!,
                });
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

                eventEmitter.emit("reservation:cancelled", {
                    reservation: {
                        ...reservation,
                        cancelled: val,
                    },
                    eventOwner,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
                    event: event.value!,
                });
            },
        });
    }

    async function onMoveReservationToQueue(reservation: PlannedReservationDoc): Promise<void> {
        const shouldMove = await showConfirm(
            t("useReservations.moveReservationToQueueConfirmTitle"),
        );
        if (!shouldMove) {
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
                eventEmitter.emit("reservation:copied", {
                    sourceReservation,
                    targetTable,
                    eventOwner,
                });
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

        const transferMessage = t("useReservations.transferReservationConfirmMessage", {
            table1Label: table1.label,
            table2Label: table2.label,
        });
        const shouldTransfer = await showConfirm(
            t("useReservations.transferReservationConfirmTitle"),
            transferMessage,
        );

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
                eventEmitter.emit("reservation:transferred", {
                    fromTable: table1,
                    toTable: table2,
                    eventOwner,
                });
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
                    shouldMarkReservationAsExpired(
                        reservation.time,
                        baseEventDate,
                        propertySettings.value.timezone,
                    )
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

        const transferMessage = t("useReservations.crossFloorTransferReservationConfirmMessage", {
            floor1Name: floor1.name,
            floor2Name: floor2.name,
            table1Label: table1.label,
            table2Label: table2.label,
        });
        const shouldTransfer = await showConfirm(
            t("useReservations.transferReservationConfirmTitle"),
            transferMessage,
        );

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
            showErrorMessage(t("useReservations.copyToSameTableErrorMsg"));
            return;
        }

        if (targetReservation) {
            showErrorMessage(t("useReservations.copyToReservedTableErrorMsg"));
            return;
        }

        const confirm = await showConfirm(
            "",
            t("useReservations.copyReservationConfirmMsg", {
                sourceTableLabel: sourceTable.label,
                targetTableLabel: targetTable.label,
            }),
        );
        if (!confirm) return;

        const reservation = reservations.value.find(
            (res) => res.tableLabel === sourceTable.label && res.floorId === sourceFloor.id,
        );
        if (!reservation) {
            showErrorMessage(t("useReservations.reservationCopyErrorMsg"));
            AppLogger.error("Source reservation not found.");
            cancelCurrentOperation();
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
            showErrorMessage(t("useReservations.transferToSameTableErrorMsg"));
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
            cancelCurrentOperation();
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
