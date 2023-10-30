import { watch, reactive, computed, Ref, ref, nextTick, onBeforeUnmount } from "vue";
import { EventDoc, FloorDoc, Reservation, Role } from "@firetable/types";
import {
    BaseTable,
    FloorViewer,
    FloorEditorElement,
    FloorMode,
    getFreeTables,
    getReservedTables,
    getTables,
    isTable,
    Floor,
} from "@firetable/floor-creator";
import FTDialog from "components/FTDialog.vue";
import EventShowReservation from "components/Event/EventShowReservation.vue";
import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { EventOwner, updateEventFloorData } from "@firetable/backend";
import EventCreateReservation from "components/Event/EventCreateReservation.vue";
import { takeProp } from "@firetable/utils";
import { useAuthStore } from "stores/auth-store";
import { DialogChainObject, useQuasar } from "quasar";
import { useI18n } from "vue-i18n";
import { VueFirestoreDocumentData } from "vuefire";
import { useUsers } from "src/composables/useUsers";

interface State {
    activeTablesAnimationInterval: number | null;
    activeFloor: { id: string; name: string } | undefined;
    floorInstances: Set<FloorViewer>;
}

const HALF_HOUR = 30 * 60 * 1000; // 30 minutes in milliseconds

export default function useFloorsPageEvent(
    eventFloors: Ref<FloorDoc[]>,
    pageRef: Ref<HTMLDivElement | undefined>,
    eventOwner: EventOwner,
    event: Ref<VueFirestoreDocumentData<EventDoc> | undefined>,
) {
    const { t } = useI18n();
    const q = useQuasar();
    const authStore = useAuthStore();
    const { users } = useUsers();
    const currentUser = computed(() => authStore.user);
    const canvases = reactive<Map<string, HTMLCanvasElement>>(new Map());
    const state = ref<State>({
        activeTablesAnimationInterval: null,
        floorInstances: new Set(),
        activeFloor: void 0,
    });
    // check every 1 minute
    const intervalID = setInterval(checkReservationsForTimeAndMarkTableIfNeeded, 60 * 1000);

    const allReservedTables = computed(() => {
        return Array.from(state.value.floorInstances).map(getReservedTables).flat();
    });

    // For now, disable reservation ability for staff,
    // but it should be configurable in the future
    const canReserve = computed(() => {
        return currentUser.value?.role !== Role.STAFF;
    });

    let currentOpenCreateReservationDialog: {
        label: string;
        dialog: DialogChainObject;
        floorId: string;
    } | null = null;

    const freeTablesPerFloor = computed(() => {
        const freeTablesMap = new Map<string, string[]>();

        for (const floor of state.value.floorInstances) {
            freeTablesMap.set(floor.id, getFreeTables(floor).map(takeProp("label")));
        }
        return freeTablesMap;
    });

    watch(freeTablesPerFloor, checkIfReservedTableAndCloseCreateReservationDialog);

    watch(() => eventFloors.value, handleFloorInstancesData, { deep: true });

    function onTableFound(tables: BaseTable[]) {
        onAutocompleteClear();
        for (const table of tables) {
            table.startAnimation();
        }
        state.value.floorInstances.forEach((floor) => floor.canvas.renderAll());
    }

    function updateFloorInstancesData() {
        if (!eventFloors.value.length) return;

        for (const floorInstance of state.value.floorInstances) {
            const findFloor = eventFloors.value.find(({ id }) => id === floorInstance.id);
            if (!findFloor) return;
            floorInstance.renderData(findFloor.json);
        }

        checkReservationsForTimeAndMarkTableIfNeeded();
    }

    async function initFloorInstancesData() {
        await nextTick();
        instantiateFloors();
        setActiveFloor([...state.value.floorInstances][0]);
        checkReservationsForTimeAndMarkTableIfNeeded();
    }

    async function handleFloorInstancesData(newVal: FloorDoc[], old: FloorDoc[]) {
        if (!eventFloors.value) return;
        if ((!old.length && newVal.length) || state.value.floorInstances.size === 0) {
            await initFloorInstancesData();
            return;
        }
        updateFloorInstancesData();
    }

    function mapFloorToCanvas(floor: FloorDoc) {
        return function (el: HTMLCanvasElement) {
            canvases.set(floor.id, el);
        };
    }

    function instantiateFloors() {
        eventFloors.value.forEach(instantiateFloor);
    }

    function instantiateFloor(floorDoc: FloorDoc) {
        const canvas = canvases.get(floorDoc.id);

        if (!canvas || !pageRef.value) return;

        state.value.floorInstances.add(
            new FloorViewer({
                canvas,
                floorDoc,
                elementClickHandler: tableClickHandler,
                mode: FloorMode.LIVE,
                containerWidth: pageRef.value.clientWidth,
                tableToTableHandler: swapOrTransferReservations,
            }),
        );
    }

    function isActiveFloor(floorId: string): boolean {
        return state.value.activeFloor?.id === floorId;
    }

    function setActiveFloor(floor?: FloorViewer): void {
        if (floor) {
            state.value.activeFloor = { id: floor.id, name: floor.name };
        }
    }

    function tableClickHandler(floor: Floor, element: FloorEditorElement | undefined) {
        if (!isTable(element)) {
            return;
        }

        const { reservation } = element;

        if (reservation) {
            showReservation(floor, reservation, element);
            return;
        }

        if (!canReserve.value) {
            return;
        }

        showCreateReservationDialog(floor, element);
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

    function showCreateReservationDialog(floor: Floor, element: BaseTable) {
        console.log(users.value);
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
                    },
                    listeners: {
                        create: (reservationData: Reservation) => {
                            resetCurrentOpenCreateReservationDialog();
                            handleReservationCreation(floor, reservationData, element);
                            dialog.hide();
                        },
                    },
                },
            })
            .onDismiss(resetCurrentOpenCreateReservationDialog);

        currentOpenCreateReservationDialog = {
            label,
            dialog,
            floorId: floor.id,
        };
    }

    function resetCurrentOpenCreateReservationDialog() {
        currentOpenCreateReservationDialog = null;
    }

    async function onDeleteReservation(floor: Floor, element: BaseTable) {
        if (!(await showConfirm("Delete reservation?")) || !element.reservation) return;
        element?.setReservation(null);

        await tryCatchLoadingWrapper({
            hook: () => updateEventFloorData(eventOwner, floor),
        });
    }

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

    function onAutocompleteClear(): void {
        if (state.value.activeTablesAnimationInterval) {
            clearInterval(state.value.activeTablesAnimationInterval);
        }
        state.value.floorInstances.forEach((floor) => {
            const tables = getTables(floor);
            tables.forEach((table) => table.stopAnimation());
            floor.canvas.renderAll();
        });
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
        const allReservedTables = Array.from(state.value.floorInstances).flatMap(getReservedTables);

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
        onTableFound,
        onAutocompleteClear,
        mapFloorToCanvas,
        isActiveFloor,
        setActiveFloor,
        useFloorsPageEventState: state,
    };
}
