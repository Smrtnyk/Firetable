import type { Ref, ShallowRef } from "vue";
import type { BaseTable, Floor, FloorEditorElement, FloorViewer } from "@firetable/floor-creator";
import type { EventOwner } from "@firetable/backend";
import type { DialogChainObject } from "quasar";
import type { VueFirestoreDocumentData } from "vuefire";
import type {
    EventDoc,
    GuestDataPayload,
    PlannedReservationDoc,
    Reservation,
    ReservationDoc,
    User,
} from "@firetable/types";
import {
    moveReservationToQueue,
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
import EventShowReservation from "src/components/Event/EventShowReservation.vue";
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

type OpenDialog = {
    label: string;
    dialog: DialogChainObject;
    floorId: string;
};

type CrossFloorTable = {
    table: BaseTable;
    floor: FloorViewer;
};

const enum GuestDataMode {
    SET = "set",
    DELETE = "delete",
}

type UseReservations = {
    tableClickHandler: (
        floor: FloorViewer,
        element: FloorEditorElement | undefined,
    ) => Promise<void>;
    onDeleteReservation: (reservation: ReservationDoc) => Promise<void>;
    handleReservationCreation: (reservationData: Reservation) => void;
};

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

    const settings = computed(function () {
        return propertiesStore.getOrganisationSettingsById(eventOwner.organisationId);
    });

    const intervalID = setInterval(checkReservationsForTimeAndMarkTableIfNeeded, ONE_MINUTE);
    const crossFloorReservationTransferTable = ref<CrossFloorTable | undefined>();
    const crossFloorReservationCopyTable = ref<CrossFloorTable | undefined>();

    let currentOpenCreateReservationDialog: OpenDialog | undefined;

    watch([reservations, floorInstances], handleFloorUpdates, {
        deep: true,
    });

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
                        clearedAt: getFirestoreTimestamp(),
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

    async function handleCrossFloorReservationCopy(
        targetFloor: FloorViewer,
        targetTable: BaseTable,
        targetReservation: ReservationDoc | undefined,
    ): Promise<void> {
        if (!crossFloorReservationCopyTable.value) {
            return;
        }

        const { table, floor } = crossFloorReservationCopyTable.value;

        if (table.label === targetTable.label && floor.id === targetFloor.id) {
            showErrorMessage("Cannot copy reservation to the same table!");
            return;
        }

        if (targetReservation) {
            showErrorMessage("Cannot copy reservation to an already reserved table!");
            return;
        }

        const transferMessage = `This will copy reservation from table ${table.label} to table ${targetTable.label}`;
        const shouldTransfer = await showConfirm("Transfer reservation", transferMessage);

        if (!shouldTransfer) {
            return;
        }

        const reservation = reservations.value.find(function (res) {
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
        if (!isTable(element)) {
            return;
        }

        // Check if table has reservation
        const reservation = reservations.value.find(function (res) {
            return res.tableLabel === element.label && res.floorId === floor.id;
        });

        if (crossFloorReservationCopyTable.value) {
            await handleCrossFloorReservationCopy(floor, element, reservation);
            crossFloorReservationCopyTable.value = undefined;
            return;
        }

        if (await handleCrossFloorReservationTransfer(floor, element)) {
            crossFloorReservationTransferTable.value = undefined;
            return;
        }

        if (reservation) {
            showReservation(floor, reservation, element);
        } else if (canReserve.value) {
            showCreateReservationDialog(floor, element, reservation, "create");
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

    onBeforeUnmount(function () {
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

function isEventInProgress(eventDate: number): boolean {
    const currentDateInUTC = Date.now();

    return currentDateInUTC >= eventDate;
}
