import { watch, reactive, computed, Ref, ref, nextTick, onMounted, onBeforeUnmount } from "vue";
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
import { useAuthStore } from "src/stores/auth-store";
import { VueFirestoreDocumentData } from "vuefire";
import { useUsers } from "src/composables/useUsers";
import { useReservations } from "src/composables/useReservations";
import { debounce } from "quasar";

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

    onMounted(() => {
        window.addEventListener("resize", resizeFloor);
    });

    onBeforeUnmount(() => {
        window.removeEventListener("resize", resizeFloor);
    });

    watch(() => eventFloors.value, handleFloorInstancesData, { deep: true });

    const resizeFloor = debounce((): void => {
        state.value.floorInstances.forEach((floor) => {
            if (!pageRef.value) {
                return;
            }
            floor.resize(pageRef.value.clientWidth);
        });
    }, 100);

    function onTableFound(tables: BaseTable[]): void {
        onAutocompleteClear();
        for (const table of tables) {
            table.startAnimation();
        }
    }

    function updateFloorInstancesData(): void {
        if (!eventFloors.value.length) return;

        for (const floorInstance of state.value.floorInstances) {
            const findFloor = eventFloors.value.find(({ id }) => id === floorInstance.id);
            if (!findFloor) return;
            floorInstance.renderData(findFloor.json);
        }

        checkReservationsForTimeAndMarkTableIfNeeded();
    }

    async function initFloorInstancesData(): Promise<void> {
        await nextTick();
        instantiateFloors();
        setActiveFloor([...state.value.floorInstances][0]);
        checkReservationsForTimeAndMarkTableIfNeeded();
    }

    async function handleFloorInstancesData(newVal: FloorDoc[], old: FloorDoc[]): Promise<void> {
        if (!eventFloors.value) return;
        if ((!old.length && newVal.length) || state.value.floorInstances.size === 0) {
            await initFloorInstancesData();
            return;
        }
        updateFloorInstancesData();
    }

    function mapFloorToCanvas(floor: FloorDoc) {
        return function (el: any) {
            canvases.set(floor.id, el);
        };
    }

    function instantiateFloors(): void {
        eventFloors.value.forEach(instantiateFloor);
    }

    function instantiateFloor(floorDoc: FloorDoc): void {
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

    function tableClickHandler(floor: Floor, element: FloorEditorElement | undefined): void {
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
