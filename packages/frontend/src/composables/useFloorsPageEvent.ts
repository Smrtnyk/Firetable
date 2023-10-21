import { watch, reactive, computed, Ref, ref, nextTick } from "vue";
import { CreateReservationPayload, FloorDoc, Reservation } from "@firetable/types";
import {
    BaseTable,
    Floor,
    FloorEditorElement,
    FloorMode,
    getFreeTables,
    getReservedTables,
    getTables,
    isTable,
} from "@firetable/floor-creator";
import FTDialog from "components/FTDialog.vue";
import EventShowReservation from "components/Event/EventShowReservation.vue";
import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { updateEventFloorData } from "@firetable/backend";
import EventCreateReservation from "components/Event/EventCreateReservation.vue";
import { matchesValue, not, takeProp } from "@firetable/utils";
import { useAuthStore } from "stores/auth-store";
import { DialogChainObject, useQuasar } from "quasar";
import { useI18n } from "vue-i18n";

interface State {
    activeTablesAnimationInterval: number | null;
    activeFloor: { id: string; name: string } | undefined;
    floorInstances: Set<Floor>;
}

export default function useFloorsPageEvent(
    eventFloors: Ref<FloorDoc[]>,
    pageRef: Ref<HTMLDivElement | undefined>,
    eventId: string,
) {
    const { t } = useI18n();
    const q = useQuasar();
    const authStore = useAuthStore();
    const currentUser = computed(() => authStore.user);
    const canvases = reactive<Map<string, HTMLCanvasElement>>(new Map());
    const state = ref<State>({
        activeTablesAnimationInterval: null,
        floorInstances: new Set(),
        activeFloor: void 0,
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
        function animate() {
            for (const table of tables) {
                table.startSmoothBlinking();
            }
            state.value.floorInstances.forEach((floor) => floor.canvas.renderAll());
        }
        state.value.activeTablesAnimationInterval = window.setInterval(animate, 100);
    }

    function updateFloorInstancesData() {
        if (!eventFloors.value.length) return;

        for (const floorInstance of state.value.floorInstances) {
            const findFloor = eventFloors.value.find(({ id }) => id === floorInstance.id);
            if (!findFloor) return;
            floorInstance.renderData(findFloor.json);
        }
    }

    async function initFloorInstancesData() {
        await nextTick();
        instantiateFloors();
        setActiveFloor([...state.value.floorInstances][0]);
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
            new Floor({
                canvas,
                floorDoc,
                elementClickHandler: tableClickHandler,
                mode: FloorMode.LIVE,
                containerWidth: pageRef.value.clientWidth,
            }),
        );
    }

    function isActiveFloor(floorId: string): boolean {
        return state.value.activeFloor?.id === floorId;
    }

    function setActiveFloor(floor?: Floor): void {
        if (floor) {
            state.value.activeFloor = { id: floor.id, name: floor.name };
        }
    }

    function tableClickHandler(floor: Floor, element: FloorEditorElement | undefined) {
        if (!isTable(element)) return;
        const { reservation } = element;
        if (reservation) {
            showReservation(floor, reservation, element);
        } else {
            showCreateReservationDialog(floor, element);
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
                    confirm: onReservationConfirm(floor, element),
                },
            },
        });
    }

    function onReservationConfirm(floor: Floor, element: BaseTable) {
        return function (val: boolean) {
            const { reservation } = element;
            if (!reservation) return;
            const { groupedWith } = reservation;
            for (const tableLabel of groupedWith) {
                const table = getTables(floor).find(({ label }) => label === tableLabel);
                if (table) {
                    floor.setReservationOnTable(table, {
                        ...reservation,
                        confirmed: val,
                    });
                }
            }
            return tryCatchLoadingWrapper({
                hook: () => updateEventFloorData(floor, eventId),
            });
        };
    }

    function showCreateReservationDialog(floor: Floor, element: BaseTable) {
        const { label } = element;
        const dialog = q
            .dialog({
                component: FTDialog,
                componentProps: {
                    component: EventCreateReservation,
                    title: `${t("EventShowReservation.title")} ${label}`,
                    maximized: false,
                    componentPropsObject: {
                        freeTables: getFreeTables(floor)
                            .map(takeProp("label"))
                            .filter(not(matchesValue(label))),
                        label,
                    },
                    listeners: {
                        create: (reservationData: CreateReservationPayload) => {
                            resetCurrentOpenCreateReservationDialog();
                            handleReservationCreation(floor, reservationData);
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

        const { groupedWith } = element.reservation;
        const allFloorTables = getTables(floor);
        for (const tableId of groupedWith) {
            const table = allFloorTables.find(({ label }) => label === tableId);
            if (table) {
                floor.setReservationOnTable(table, null);
            }
        }

        await tryCatchLoadingWrapper({
            hook: () => updateEventFloorData(floor, eventId),
        });
    }

    function handleReservationCreation(floor: Floor, reservationData: CreateReservationPayload) {
        if (!currentUser.value) return;

        const { groupedWith } = reservationData;
        const { email, name, role, id } = currentUser.value;
        const reservedBy = { email, name, role, id };

        for (const idInGroup of groupedWith) {
            const table = getTables(floor).find(function ({ label }) {
                return label === idInGroup;
            });
            if (table) {
                floor.setReservationOnTable(table, {
                    ...reservationData,
                    confirmed: false,
                    reservedBy,
                });
            }
        }
        void tryCatchLoadingWrapper({
            hook: () => updateEventFloorData(floor, eventId),
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

    const allReservedTables = computed(() => {
        return Array.from(state.value.floorInstances).map(getReservedTables).flat();
    });

    function onAutocompleteClear(): void {
        if (state.value.activeTablesAnimationInterval) {
            clearInterval(state.value.activeTablesAnimationInterval);
        }
        state.value.floorInstances.forEach((floor) => {
            const tables = getTables(floor);
            tables.forEach((table) => table.stopSmoothBlinking());
            floor.canvas.renderAll();
        });
    }

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
