import { computed, onBeforeUnmount, Ref, watch, ref, ShallowRef } from "vue";
import { EventDoc, Reservation, ReservationDoc, User } from "@firetable/types";
import {
    BaseTable,
    Floor,
    FloorEditorElement,
    type FloorViewer,
    isTable,
} from "@firetable/floor-creator";
import {
    addReservation,
    deleteReservation,
    EventOwner,
    updateReservationDoc,
} from "@firetable/backend";
import { DialogChainObject, useQuasar } from "quasar";
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

    const canReserve = computed(() => {
        return authStore.canReserve;
    });

    let currentOpenCreateReservationDialog: {
        label: string;
        dialog: DialogChainObject;
        floorId: string;
    } | null = null;

    watch(
        [reservations, floorInstances],
        ([newReservations, newFloorInstances]) => {
            checkIfReservedTableAndCloseCreateReservationDialog();
            for (const floor of newFloorInstances) {
                floor.clearAllReservations();
                for (const reservation of newReservations) {
                    if (reservation.floorId === floor.id) {
                        const table = floor.getTableByLabel(reservation.tableLabel);
                        table?.setReservation(reservation);
                    }
                }
            }
        },
        { immediate: true, deep: true },
    );

    function isOwnReservation(reservation: Reservation): boolean {
        return authStore.user?.id === reservation.creator?.id;
    }

    function canDeleteReservation(reservation: Reservation): boolean {
        return (
            authStore.canDeleteReservation ||
            (isOwnReservation(reservation) && authStore.canDeleteOwnReservation)
        );
    }

    function handleReservationCreation(reservationData: Reservation): void {
        void tryCatchLoadingWrapper({
            hook: async function () {
                await addReservation(eventOwner, reservationData);
                q.notify({
                    message: "Reservation created",
                    color: "positive",
                });
            },
        });
    }

    function handleReservationUpdate(reservationData: ReservationDoc): void {
        void tryCatchLoadingWrapper({
            hook: async function () {
                await updateReservationDoc(eventOwner, reservationData);
                q.notify({
                    message: "Reservation updated",
                    color: "positive",
                });
            },
        });
    }

    async function onDeleteReservation(reservation: ReservationDoc): Promise<void> {
        if (!(await showConfirm("Delete reservation?"))) return;

        await tryCatchLoadingWrapper({
            hook: () => deleteReservation(eventOwner, reservation),
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
        const isTableStillFree = reservations.value.find((reservation) => {
            return reservation.tableLabel === label && reservation.floorId === floorId;
        });

        if (!isTableStillFree) return;

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
                    title: `${t("EventCreateReservation.title")} ${label}`,
                    maximized: false,
                    componentPropsObject: {
                        users: filterUsersPerProperty(users.value, eventOwner.propertyId),
                        mode,
                        reservationData: mode === "edit" ? element.reservation : void 0,
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
                    canDeleteReservation: canDeleteReservation(reservation),
                    reservation,
                },
                listeners: {
                    delete: () => {
                        onDeleteReservation(reservation).catch(showErrorMessage);
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
                    confirm: onReservationConfirm(reservation),
                },
            },
        });
    }

    function onReservationConfirm(reservation: ReservationDoc) {
        return function (val: boolean) {
            return tryCatchLoadingWrapper({
                hook: () =>
                    updateReservationDoc(eventOwner, {
                        ...reservation,
                        id: reservation.id,
                        confirmed: val,
                    }),
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
            hook: () => Promise.all(promises),
        });
    }

    function checkReservationsForTimeAndMarkTableIfNeeded(): void {
        if (!event.value?.date) {
            return;
        }

        const baseEventDate = new Date(event.value.date);

        reservations.value.forEach((reservation) => {
            if (
                reservation.confirmed ||
                !shouldMarkReservationAsExpired(reservation.time, baseEventDate)
            ) {
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
        onDeleteReservation,
        handleReservationCreation,
        checkReservationsForTimeAndMarkTableIfNeeded,
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
