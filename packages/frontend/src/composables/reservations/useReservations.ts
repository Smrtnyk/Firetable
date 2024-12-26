import type { Ref, ShallowRef, ComputedRef } from "vue";
import type { EventOwner } from "../../backend-proxy";
import type { DialogChainObject } from "quasar";
import type { VueFirestoreDocumentData } from "vuefire";
import type { GuestSummary } from "src/stores/guests-store";
import type {
    BaseTable,
    Floor,
    FloorEditorElement,
    FloorElementClickHandler,
    FloorViewer,
} from "@firetable/floor-creator";
import type {
    ReservationCopyOperation,
    ReservationDequeueOperation,
    ReservationLinkOperation,
    ReservationTransferOperation,
    TableOperation,
} from "./useTableOperations.js";
import type {
    EventDoc,
    PlannedReservationDoc,
    Reservation,
    ReservationDoc,
    ReservationState,
    User,
} from "@firetable/types";
import { useReservationsLifecycle } from "./useReservationsLifecycle.js";
import { TableOperationType, useTableOperations } from "./useTableOperations.js";
import {
    moveReservationFromQueue,
    moveReservationToQueue,
    addReservation,
    deleteReservation,
    updateReservationDoc,
} from "../../backend-proxy";
import { isTable } from "@firetable/floor-creator";
import { computed, watch } from "vue";
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
import { AppLogger } from "src/logger/FTLogger";
import { storeToRefs } from "pinia";
import { useDialog } from "src/composables/useDialog";
import { plannedToQueuedReservation } from "src/helpers/reservation/planned-to-queued-reservation";
import { queuedToPlannedReservation } from "src/helpers/reservation/queued-to-planned-reservation";
import { isEventInProgress } from "src/helpers/event/is-event-in-progress";
import { eventEmitter } from "src/boot/event-emitter";
import { hashString } from "src/helpers/hash-string";
import { useGuestsStore } from "src/stores/guests-store";
import { useRouter } from "vue-router";
import { usePermissionsStore } from "src/stores/permissions-store";

type OpenDialog = {
    label: string;
    dialog: DialogChainObject;
    floorId: string;
};

type UseReservations = {
    initiateTableOperation: (operation: TableOperation) => void;
    tableClickHandler: FloorElementClickHandler;
    ongoingTableOperation: ComputedRef<TableOperation | undefined>;
};

export function useReservations(
    users: Ref<User[]>,
    reservations: Ref<ReservationDoc[]>,
    floorInstances: ShallowRef<FloorViewer[]>,
    eventOwner: EventOwner,
    event: Ref<VueFirestoreDocumentData<EventDoc> | undefined>,
): UseReservations {
    const { createDialog } = useDialog();
    const { t } = useI18n();
    const { nonNullableUser } = storeToRefs(useAuthStore());
    const { canReserve, canSeeGuestbook } = storeToRefs(usePermissionsStore());

    const router = useRouter();
    const propertiesStore = usePropertiesStore();
    const guestsStore = useGuestsStore();

    const propertySettings = computed(function () {
        return propertiesStore.getPropertySettingsById(eventOwner.propertyId);
    });
    const eventDate = computed(function () {
        return event.value?.date;
    });

    let currentOpenCreateReservationDialog: OpenDialog | undefined;

    const {
        ongoingTableOperation,
        initiateTableOperation,
        cancelCurrentOperation,
        initiateReservationLink,
        initiateReservationTransfer,
        initiateReservationCopy,
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

        const { sourceReservation, sourceFloor } = operation;
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

        const confirm = await showConfirm(
            t("useReservations.linkTableTitle"),
            t("useReservations.linkTableConfirmMsg", {
                tablesToLink: [...currentLabels, targetTable.label].join(", "),
            }),
        );

        if (!confirm) return;

        await tryCatchLoadingWrapper({
            async hook() {
                await updateReservationDoc(eventOwner, {
                    ...sourceReservation,
                    id: sourceReservation.id,
                    tableLabel: [...currentLabels, targetTable.label],
                });

                eventEmitter.emit("reservation:linked", {
                    sourceReservation,
                    linkedTableLabel: targetTable.label,
                    eventOwner,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
                    event: event.value!,
                });
            },
        });
    }

    async function handleReservationCreation(reservationData: Reservation): Promise<void> {
        await tryCatchLoadingWrapper({
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

    async function handleReservationUpdate(
        reservationData: ReservationDoc,
        oldReservation: ReservationDoc,
    ): Promise<void> {
        await tryCatchLoadingWrapper({
            async hook() {
                await updateReservationDoc(eventOwner, reservationData);
                notifyPositive(t("useReservations.reservationUpdatedMsg"));

                eventEmitter.emit("reservation:updated", {
                    reservation: reservationData,
                    oldReservation,
                    eventOwner,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
                    event: event.value!,
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

        const confirm = await showConfirm(
            t("useReservations.unlinkConfirmTitle"),
            t("useReservations.unlinkConfirmMessage", {
                table: tableToUnlink.label,
            }),
        );

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
                    eventOwner,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if event was undefined
                    event: event.value!,
                    sourceReservation: reservation,
                    unlinkedTableLabels: [tableToUnlink.label],
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
                    users: users.value,
                    mode,
                    reservationData:
                        mode === "update" && reservation
                            ? { ...reservation, id: reservation.id }
                            : void 0,
                    eventStartTimestamp,
                    eventDurationInHours: propertySettings.value.event.eventDurationInHours,
                },
                listeners: {
                    async create(reservationData: Omit<Reservation, "floorId" | "tableLabel">) {
                        resetCurrentOpenCreateReservationDialog();
                        await handleReservationCreation({
                            ...reservationData,
                            floorId: floor.id,
                            tableLabel: label,
                        } as Reservation);
                        dialog.hide();
                    },
                    async update(reservationData: ReservationDoc) {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we wouldn't be here if reservation was undefined
                        await handleReservationUpdate(reservationData, reservation!);
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
        const tableLabels = Array.isArray(reservation.tableLabel)
            ? reservation.tableLabel
            : [reservation.tableLabel];

        const dialog = createDialog({
            component: FTDialog,
            componentProps: {
                component: EventShowReservation,
                title: `${t("EventShowReservation.title")} ${tableLabels.join(", ")}`,
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
                    stateChange(newState: ReservationState) {
                        return tryCatchLoadingWrapper({
                            async hook() {
                                await updateReservationDoc(eventOwner, {
                                    id: reservation.id,
                                    state: newState,
                                });
                            },
                        });
                    },
                    link() {
                        initiateReservationLink(floor, reservation);
                    },
                    unlink() {
                        onUnlinkTables(reservation, element).catch(showErrorMessage);
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
                        dialog.hide();
                        if (!isPlannedReservation(reservation)) {
                            return;
                        }
                        onGuestArrived(reservation, val).catch(showErrorMessage);
                    },
                    waitingForResponse(val: boolean) {
                        dialog.hide();
                        if (!isPlannedReservation(reservation)) {
                            return;
                        }

                        reservationWaitingForResponse(val, reservation).catch(showErrorMessage);
                    },
                    reservationConfirmed(val: boolean) {
                        dialog.hide();
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
                    reservationConfirmed: false,
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
                    arrived: false,
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
                    arrived: false,
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
                    targetReservation: reservationTable2,
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
            async hook() {
                await Promise.all(promises);
                eventEmitter.emit("reservation:transferred", {
                    fromTable: table1,
                    toTable: table2,
                    eventOwner,
                    fromFloor: floor1.name,
                    toFloor: floor2.name,
                    targetReservation: reservationTable2,
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
            case TableOperationType.RESERVATION_LINK:
                await handleReservationLink(operation, targetTable, targetReservation, targetFloor);
                break;
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
        ongoingTableOperation,
        tableClickHandler,
        initiateTableOperation,
    };
}
