import type {
    BaseTable,
    Floor,
    FloorEditorElement,
    FloorElementClickHandler,
    FloorViewer,
} from "@firetable/floor-creator";
import type {
    EventDoc,
    PlannedReservationDoc,
    Reservation,
    ReservationDoc,
    ReservationState,
    User,
} from "@firetable/types";
import type { DialogController } from "src/composables/useDialog";
import type { EventOwner } from "src/db";
import type { GuestSummary } from "src/stores/guests-store";
import type { ComputedRef, Ref, ShallowRef } from "vue";
import type { VueFirestoreDocumentData } from "vuefire";

import { isTable } from "@firetable/floor-creator";
import { isPlannedReservation, ReservationStatus } from "@firetable/types";
import { storeToRefs } from "pinia";
import { eventEmitter } from "src/boot/event-emitter";
import EventCreateReservation from "src/components/Event/reservation/EventCreateReservation.vue";
import EventShowReservation from "src/components/Event/reservation/EventShowReservation.vue";
import { globalDialog } from "src/composables/useDialog";
import {
    addReservation,
    deleteReservation,
    moveReservationFromQueue,
    moveReservationToQueue,
    updateReservationDoc,
} from "src/db";
import { isEventInProgress } from "src/helpers/event/is-event-in-progress";
import { determineTableColor } from "src/helpers/floor";
import { hashString } from "src/helpers/hash-string";
import { plannedToQueuedReservation } from "src/helpers/reservation/planned-to-queued-reservation";
import { queuedToPlannedReservation } from "src/helpers/reservation/queued-to-planned-reservation";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { AppLogger } from "src/logger/FTLogger";
import { useAuthStore } from "src/stores/auth-store";
import { useGlobalStore } from "src/stores/global-store";
import { useGuestsStore } from "src/stores/guests-store";
import { usePermissionsStore } from "src/stores/permissions-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import type {
    ReservationCopyOperation,
    ReservationDequeueOperation,
    ReservationLinkOperation,
    ReservationTransferOperation,
    TableOperation,
} from "./useTableOperations.js";

import { useReservationsLifecycle } from "./useReservationsLifecycle.js";
import { TableOperationType, useTableOperations } from "./useTableOperations.js";

type OpenDialog = {
    dialog: DialogController;
    floorId: string;
    label: string;
};

type UseReservations = {
    initiateTableOperation: (operation: TableOperation) => void;
    ongoingTableOperation: ComputedRef<TableOperation | undefined>;
    tableClickHandler: FloorElementClickHandler;
};

export function useReservations(
    users: Ref<User[]>,
    reservations: Ref<ReservationDoc[]>,
    floorInstances: ShallowRef<FloorViewer[]>,
    eventOwner: EventOwner,
    event: Ref<undefined | VueFirestoreDocumentData<EventDoc>>,
): UseReservations {
    const { t } = useI18n();
    const { nonNullableUser } = storeToRefs(useAuthStore());
    const { canReserve, canSeeGuestbook } = storeToRefs(usePermissionsStore());

    const router = useRouter();
    const propertiesStore = usePropertiesStore();
    const guestsStore = useGuestsStore();
    const globalStore = useGlobalStore();

    const propertySettings = computed(function () {
        return propertiesStore.getPropertySettingsById(eventOwner.propertyId);
    });
    const eventDate = computed(function () {
        return event.value?.date;
    });

    let currentOpenCreateReservationDialog: OpenDialog | undefined;

    const {
        cancelCurrentOperation,
        initiateReservationCopy,
        initiateReservationLink,
        initiateReservationTransfer,
        initiateTableOperation,
        ongoingTableOperation,
    } = useTableOperations();
    useReservationsLifecycle(eventDate, reservations, floorInstances, eventOwner);

    watch([reservations, floorInstances], handleFloorUpdates, {
        deep: true,
    });

    function handleFloorUpdates([newReservations, newFloorInstances]: [
        ReservationDoc[],
        FloorViewer[],
    ]): void {
        checkIfReservedTableAndCloseCreateReservationDialog();
        registerTableClickHandlers(newFloorInstances);
        for (const floor of newFloorInstances) {
            updateFloorReservations(floor, newReservations);
        }
    }

    function updateFloorReservations(floor: FloorViewer, newReservations: ReservationDoc[]): void {
        floor.clearAllReservations();
        for (const reservation of newReservations) {
            if (reservation.floorId !== floor.id) {
                continue;
            }
            const tableLabels = Array.isArray(reservation.tableLabel)
                ? reservation.tableLabel
                : [reservation.tableLabel];

            for (const label of tableLabels) {
                const table = floor.getTableByLabel(label);
                if (table) {
                    setReservation(table, reservation);
                }
            }
        }
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

        const fill = determineTableColor(reservation, propertySettings.value.event);
        if (fill) {
            table.setFill(fill);
        }
    }

    async function handleReservationLink(
        operation: ReservationLinkOperation,
        targetTable: BaseTable,
        targetReservation: ReservationDoc | undefined,
        targetFloor: FloorViewer,
    ): Promise<void> {
        if (targetReservation) {
            showErrorMessage(t("useReservations.linkToReservedTableErrorMsg"));
            return;
        }

        const { sourceFloor, sourceReservation } = operation;
        const currentLabels = Array.isArray(sourceReservation.tableLabel)
            ? sourceReservation.tableLabel
            : [sourceReservation.tableLabel];

        if (currentLabels.includes(targetTable.label)) {
            showErrorMessage(t("useReservations.tableAlreadyLinkedErrorMsg"));
            return;
        }

        // cross floor linking not supported
        if (sourceFloor.id !== targetFloor.id) {
            showErrorMessage(t("useReservations.crossFloorLinkErrorMsg"));
            return;
        }

        const confirm = await globalDialog.confirm({
            message: t("useReservations.linkTableConfirmMsg", {
                tablesToLink: [...currentLabels, targetTable.label].join(", "),
            }),
            title: t("useReservations.linkTableTitle"),
        });

        if (!confirm) return;

        await tryCatchLoadingWrapper({
            async hook() {
                await updateReservationDoc(eventOwner, {
                    ...sourceReservation,
                    id: sourceReservation.id,
                    tableLabel: [...currentLabels, targetTable.label],
                });

                eventEmitter.emit("reservation:linked", {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
                    event: event.value!,
                    eventOwner,
                    linkedTableLabel: targetTable.label,
                    sourceReservation,
                });
            },
        });
    }

    async function handleReservationCreation(reservationData: Reservation): Promise<void> {
        await tryCatchLoadingWrapper({
            async hook() {
                await addReservation(eventOwner, reservationData);
                globalStore.notify("Reservation created");

                eventEmitter.emit("reservation:created", {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
                    event: event.value!,
                    eventOwner,
                    reservation: reservationData,
                });
            },
        });
    }

    async function handleReservationUpdate(
        reservationData: ReservationDoc,
        oldReservation: ReservationDoc,
    ): Promise<void> {
        await tryCatchLoadingWrapper({
            async hook() {
                await updateReservationDoc(eventOwner, reservationData);
                globalStore.notify(t("useReservations.reservationUpdatedMsg"));

                eventEmitter.emit("reservation:updated", {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
                    event: event.value!,
                    eventOwner,
                    oldReservation,
                    reservation: reservationData,
                });
            },
        });
    }

    async function onUnlinkTables(
        reservation: ReservationDoc,
        tableToUnlink: BaseTable,
    ): Promise<void> {
        if (!Array.isArray(reservation.tableLabel)) {
            return;
        }

        const confirm = await globalDialog.confirm({
            message: t("useReservations.unlinkConfirmMessage", {
                table: tableToUnlink.label,
            }),
            title: t("useReservations.unlinkConfirmTitle"),
        });

        if (!confirm) {
            return;
        }

        const updatedTableLabels = reservation.tableLabel.filter(function (label) {
            return label !== tableToUnlink.label;
        });

        await tryCatchLoadingWrapper({
            async hook() {
                await updateReservationDoc(eventOwner, {
                    ...reservation,
                    tableLabel: updatedTableLabels,
                });
                eventEmitter.emit("reservation:unlinked", {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
                    event: event.value!,
                    eventOwner,
                    sourceReservation: reservation,
                    unlinkedTableLabels: [tableToUnlink.label],
                });
            },
        });
    }

    async function onDeleteReservation(reservation: ReservationDoc): Promise<void> {
        const shouldDelete = await globalDialog.confirm({
            title: t("useReservations.deleteReservationTitle"),
        });
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
                if (
                    isEventInProgress(event.value.date) ||
                    (isPlannedReservation(reservation) && reservation.cancelled)
                ) {
                    await updateReservationDoc(eventOwner, {
                        clearedAt: Date.now(),
                        id: reservation.id,
                        status: ReservationStatus.DELETED,
                    });
                    eventEmitter.emit("reservation:deleted:soft", {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
                        event: event.value!,
                        eventOwner,
                        reservation,
                    });
                } else {
                    await deleteReservation(eventOwner, reservation);
                    eventEmitter.emit("reservation:deleted", {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
                        event: event.value!,
                        eventOwner,
                        reservation,
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

        const { dialog, floorId, label } = currentOpenCreateReservationDialog;
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

    function showCreateReservationDialog(
        floor: Floor,
        element: BaseTable,
        reservation: ReservationDoc | undefined,
        mode: "create" | "update",
    ): void {
        const { label } = element;

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
        const eventStartTimestamp = event.value!.date;

        const dialog = globalDialog.openDialog(
            EventCreateReservation,
            {
                currentUser: nonNullableUser.value,
                eventDurationInHours: propertySettings.value.event.eventDurationInHours,
                eventStartTimestamp,
                mode,
                async onCreate(reservationData: Omit<Reservation, "floorId" | "tableLabel">) {
                    resetCurrentOpenCreateReservationDialog();
                    await handleReservationCreation({
                        ...reservationData,
                        floorId: floor.id,
                        tableLabel: label,
                    } as Reservation);
                    dialog.hide();
                },
                async onUpdate(reservationData: ReservationDoc) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if reservation was undefined
                    await handleReservationUpdate(reservationData, reservation!);
                    dialog.hide();
                },
                reservationData:
                    mode === "update" && reservation
                        ? { ...reservation, id: reservation.id }
                        : void 0,
                timezone: propertySettings.value.timezone,
                users: users.value,
            },
            {
                title: `${t("EventCreateReservation.title")} ${label}`,
            },
        );
        dialog.onDismiss(resetCurrentOpenCreateReservationDialog);

        if (mode === "create") {
            currentOpenCreateReservationDialog = {
                dialog,
                floorId: floor.id,
                label,
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
        const tableLabels = Array.isArray(reservation.tableLabel)
            ? reservation.tableLabel
            : [reservation.tableLabel];

        const dialog = globalDialog.openDialog(
            EventShowReservation,
            {
                guestSummaryPromise: getGuestSummary(reservation),
                onArrived(val: boolean) {
                    dialog.hide();
                    if (!isPlannedReservation(reservation)) {
                        return;
                    }
                    onGuestArrived(reservation, val).catch(showErrorMessage);
                },
                onCancel(val: boolean) {
                    dialog.hide();
                    if (!isPlannedReservation(reservation)) {
                        return;
                    }
                    onReservationCancelled(reservation, val).catch(showErrorMessage);
                },
                onCopy() {
                    dialog.hide();
                    initiateReservationCopy(floor, element);
                },
                onDelete() {
                    dialog.hide();
                    onDeleteReservation(reservation).catch(showErrorMessage);
                },
                onEdit() {
                    dialog.hide();
                    showCreateReservationDialog(floor, element, reservation, "update");
                },
                onGoToGuestProfile(guestId: string) {
                    dialog.hide();
                    router.push({
                        name: "adminGuest",
                        params: {
                            guestId,
                            organisationId: eventOwner.organisationId,
                        },
                    });
                },
                onLink() {
                    dialog.hide();
                    initiateReservationLink(floor, reservation);
                },
                onQueue() {
                    dialog.hide();
                    if (!isPlannedReservation(reservation)) {
                        return;
                    }
                    onMoveReservationToQueue(reservation).catch(showErrorMessage);
                },
                onReservationConfirmed(val: boolean) {
                    dialog.hide();
                    if (!isPlannedReservation(reservation)) {
                        return;
                    }
                    reservationConfirmed(val, reservation).catch(showErrorMessage);
                },
                onStateChange(newState: ReservationState) {
                    dialog.hide();
                    return tryCatchLoadingWrapper({
                        async hook() {
                            await updateReservationDoc(eventOwner, {
                                id: reservation.id,
                                state: newState,
                            });
                        },
                    });
                },
                onTransfer() {
                    dialog.hide();
                    initiateReservationTransfer(floor, element);
                },
                onUnlink() {
                    dialog.hide();
                    onUnlinkTables(reservation, element).catch(showErrorMessage);
                },
                onWaitingForResponse(val: boolean) {
                    dialog.hide();
                    if (!isPlannedReservation(reservation)) {
                        return;
                    }

                    reservationWaitingForResponse(val, reservation).catch(showErrorMessage);
                },
                reservation,
                tableColors: propertySettings.value.event,
                timezone: propertySettings.value.timezone,
            },
            {
                title: `${t("EventShowReservation.title")} ${tableLabels.join(", ")}`,
            },
        );
    }

    function onGuestArrived(reservation: PlannedReservationDoc, val: boolean): Promise<void> {
        return tryCatchLoadingWrapper({
            async hook() {
                await updateReservationDoc(eventOwner, {
                    arrived: val,
                    id: reservation.id,
                    reservationConfirmed: false,
                    waitingForResponse: false,
                });

                eventEmitter.emit("reservation:arrived", {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
                    event: event.value!,
                    eventOwner,
                    reservation: {
                        ...reservation,
                        arrived: val,
                    },
                });
            },
        });
    }

    function reservationConfirmed(val: boolean, reservation: PlannedReservationDoc): Promise<void> {
        return tryCatchLoadingWrapper({
            hook() {
                return updateReservationDoc(eventOwner, {
                    arrived: false,
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
                    arrived: false,
                    id: reservation.id,
                    reservationConfirmed: false,
                    waitingForResponse: val,
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
                    cancelled: val,
                    id: reservation.id,
                    waitingForResponse: false,
                });

                eventEmitter.emit("reservation:cancelled", {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
                    event: event.value!,
                    eventOwner,
                    reservation: {
                        ...reservation,
                        cancelled: val,
                    },
                });
            },
        });
    }

    async function onMoveReservationToQueue(reservation: PlannedReservationDoc): Promise<void> {
        const shouldMove = await globalDialog.confirm({
            title: t("useReservations.moveReservationToQueueConfirmTitle"),
        });
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
            floorId: targetFloor.id,
            tableLabel: targetTable.label,
        };

        await tryCatchLoadingWrapper({
            async hook() {
                await addReservation(eventOwner, newReservation);
                eventEmitter.emit("reservation:copied", {
                    eventOwner,
                    sourceReservation,
                    targetTable,
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

        const reservationTable1 = reservations.value.find(function (reservation) {
            return (
                reservation.floorId === floor.id &&
                (Array.isArray(reservation.tableLabel)
                    ? reservation.tableLabel.includes(table1.label)
                    : reservation.tableLabel === table1.label)
            );
        });

        if (!reservationTable1) {
            return;
        }

        const transferMessage = t("useReservations.transferReservationConfirmMessage", {
            table1Label: table1.label,
            table2Label: table2.label,
        });
        const shouldTransfer = await globalDialog.confirm({
            message: transferMessage,
            title: t("useReservations.transferReservationConfirmTitle"),
        });

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
                    eventOwner,
                    fromTable: table1,
                    targetReservation: reservationTable2,
                    toTable: table2,
                });
            },
        });
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
        const shouldTransfer = await globalDialog.confirm({
            message: transferMessage,
            title: t("useReservations.transferReservationConfirmTitle"),
        });

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
            async hook() {
                await Promise.all(promises);
                eventEmitter.emit("reservation:transferred", {
                    eventOwner,
                    fromFloor: floor1.name,
                    fromTable: table1,
                    targetReservation: reservationTable2,
                    toFloor: floor2.name,
                    toTable: table2,
                });
            },
        });
    }

    async function handleTableOperation(
        targetFloor: FloorViewer,
        targetTable: BaseTable,
        targetReservation: ReservationDoc | undefined,
    ): Promise<void> {
        const operation = ongoingTableOperation.value;
        if (!operation) {
            return;
        }

        switch (operation.type) {
            case TableOperationType.RESERVATION_COPY:
                await handleReservationCopy(operation, targetFloor, targetTable, targetReservation);
                break;
            case TableOperationType.RESERVATION_DEQUEUE:
                await handleReservationDequeue(operation, targetFloor.id, targetTable.label);
                break;
            case TableOperationType.RESERVATION_LINK:
                await handleReservationLink(operation, targetTable, targetReservation, targetFloor);
                break;
            case TableOperationType.RESERVATION_TRANSFER:
                await handleReservationTransfer(operation, targetFloor, targetTable);
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

        const confirm = await globalDialog.confirm({
            message: t("useReservations.copyReservationConfirmMsg", {
                sourceTableLabel: sourceTable.label,
                targetTableLabel: targetTable.label,
            }),
            title: "",
        });
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

    async function tableClickHandler(
        floor: FloorViewer,
        element: FloorEditorElement | undefined,
    ): Promise<void> {
        if (!isTable(element)) {
            return;
        }

        const reservation = reservations.value.find(function (res) {
            if (res.floorId !== floor.id) {
                return false;
            }

            const tableLabels = Array.isArray(res.tableLabel) ? res.tableLabel : [res.tableLabel];

            return tableLabels.includes(element.label);
        });

        if (ongoingTableOperation.value) {
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

    return {
        initiateTableOperation,
        ongoingTableOperation,
        tableClickHandler,
    };
}
