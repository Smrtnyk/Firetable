import { watch, reactive, computed, Ref, ref, nextTick } from "vue";
import { EventDoc, FloorDoc, Role } from "@firetable/types";
import {
    BaseTable,
    FloorViewer,
    FloorEditorElement,
    FloorMode,
    getTables,
    isTable,
    Floor,
} from "@firetable/floor-creator";
import { EventOwner } from "@firetable/backend";
import { useAuthStore } from "stores/auth-store";
import { VueFirestoreDocumentData } from "vuefire";
import { useUsers } from "src/composables/useUsers";
import { useReservations } from "src/composables/useReservations";

interface State {
    activeTablesAnimationInterval: number | null;
    activeFloor: { id: string; name: string } | undefined;
    floorInstances: Set<FloorViewer>;
}

export function useFloorsPageEvent(
    eventFloors: Ref<FloorDoc[]>,
    pageRef: Ref<HTMLDivElement | undefined>,
    eventOwner: EventOwner,
    event: Ref<VueFirestoreDocumentData<EventDoc> | undefined>,
) {
    const authStore = useAuthStore();
    const state = ref<State>({
        activeTablesAnimationInterval: null,
        floorInstances: new Set(),
        activeFloor: void 0,
    });
    const { users } = useUsers();
    const {
        showReservation,
        checkReservationsForTimeAndMarkTableIfNeeded,
        showCreateReservationDialog,
        swapOrTransferReservations,
        allReservedTables,
    } = useReservations(users, state.value.floorInstances, eventOwner, event);
    const currentUser = computed(() => authStore.user);
    const canvases = reactive<Map<string, HTMLCanvasElement>>(new Map());

    // For now, disable reservation ability for staff,
    // but it should be configurable in the future
    const canReserve = computed(() => {
        return currentUser.value?.role !== Role.STAFF;
    });

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
        const floorViewer = new FloorViewer({
            canvas,
            floorDoc,
            mode: FloorMode.LIVE,
            containerWidth: pageRef.value.clientWidth,
        });
        floorViewer.on("elementClicked", tableClickHandler);
        floorViewer.on("tableToTable", swapOrTransferReservations);
        state.value.floorInstances.add(floorViewer);
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

        showCreateReservationDialog(floor, element, "create");
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

    return {
        onTableFound,
        onAutocompleteClear,
        mapFloorToCanvas,
        isActiveFloor,
        setActiveFloor,
        useFloorsPageEventState: state,
        allReservedTables,
    };
}
