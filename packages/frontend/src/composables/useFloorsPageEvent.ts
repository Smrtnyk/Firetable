import { watch, reactive, computed, Ref, ref, nextTick, onMounted, onBeforeUnmount } from "vue";
import { EventDoc, FloorDoc } from "@firetable/types";
import { BaseTable, FloorViewer, FloorMode, getTables } from "@firetable/floor-creator";
import { EventOwner } from "@firetable/backend";
import { VueFirestoreDocumentData } from "vuefire";
import { useUsers } from "src/composables/useUsers";
import { useReservations } from "src/composables/useReservations";
import { debounce } from "quasar";

export function useFloorsPageEvent(
    eventFloors: Ref<FloorDoc[]>,
    pageRef: Ref<HTMLDivElement | undefined>,
    eventOwner: EventOwner,
    event: Ref<VueFirestoreDocumentData<EventDoc> | undefined>,
) {
    const activeTablesAnimationInterval = ref<number | undefined>();
    const activeFloor = ref<{ id: string; name: string } | undefined>();
    const floorInstances = ref<Set<FloorViewer>>(new Set());
    const { users } = useUsers();
    const {
        tableClickHandler,
        checkReservationsForTimeAndMarkTableIfNeeded,
        swapOrTransferReservations,
        allReservedTables,
    } = useReservations(users, floorInstances.value, eventOwner, event);
    const canvases = reactive<Map<string, HTMLCanvasElement>>(new Map());

    const hasMultipleFloorPlans = computed(() => {
        return floorInstances.value.size > 1;
    });

    onMounted(() => {
        window.addEventListener("resize", resizeFloor);
    });

    onBeforeUnmount(() => {
        window.removeEventListener("resize", resizeFloor);
    });

    watch(() => eventFloors.value, handleFloorInstancesData, { deep: true });

    const resizeFloor = debounce((): void => {
        floorInstances.value.forEach((floor) => {
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

        for (const floorInstance of floorInstances.value) {
            const findFloor = eventFloors.value.find(({ id }) => id === floorInstance.id);
            if (!findFloor) return;
            floorInstance.renderData(findFloor.json);
        }

        checkReservationsForTimeAndMarkTableIfNeeded();
    }

    async function initFloorInstancesData(): Promise<void> {
        await nextTick();
        instantiateFloors();
        setActiveFloor([...floorInstances.value][0]);
        checkReservationsForTimeAndMarkTableIfNeeded();
    }

    async function handleFloorInstancesData(newVal: FloorDoc[], old: FloorDoc[]): Promise<void> {
        if (!eventFloors.value) return;
        if ((!old.length && newVal.length) || floorInstances.value.size === 0) {
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
        floorInstances.value.add(floorViewer);
    }

    function isActiveFloor(floorId: string): boolean {
        return activeFloor.value?.id === floorId;
    }

    function setActiveFloor(floor?: FloorViewer): void {
        if (floor) {
            activeFloor.value = { id: floor.id, name: floor.name };
        }
    }

    function onAutocompleteClear(): void {
        if (activeTablesAnimationInterval.value) {
            clearInterval(activeTablesAnimationInterval.value);
        }
        floorInstances.value.forEach((floor) => {
            const tables = getTables(floor);
            tables.forEach((table) => table.stopAnimation());
        });
    }

    return {
        onTableFound,
        onAutocompleteClear,
        mapFloorToCanvas,
        isActiveFloor,
        setActiveFloor,
        allReservedTables,
        hasMultipleFloorPlans,
        activeFloor,
        floorInstances,
    };
}
