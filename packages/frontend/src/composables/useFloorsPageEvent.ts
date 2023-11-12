import { watch, reactive, computed, Ref, ref, nextTick, onMounted, onBeforeUnmount } from "vue";
import { EventDoc, EventFloorDoc } from "@firetable/types";
import { BaseTable, FloorViewer, FloorMode, getTables } from "@firetable/floor-creator";
import { EventOwner } from "@firetable/backend";
import { VueFirestoreDocumentData } from "vuefire";
import { useUsers } from "src/composables/useUsers";
import { useReservations } from "src/composables/useReservations";
import { debounce } from "quasar";

export function useFloorsPageEvent(
    eventFloors: Ref<EventFloorDoc[]>,
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
        floorInstances.value.forEach((floorInstance) => {
            floorInstance.destroy();
        });
    });

    watch(eventFloors, handleFloorInstancesData);

    watch(
        () => eventFloors.value.map((floor) => floor.lastModified),
        async (newTimestamps, oldTimestamps) => {
            if (oldTimestamps.length === 0) return;

            for (let i = 0; i < newTimestamps.length; i++) {
                if (newTimestamps[i] !== oldTimestamps[i]) {
                    updateFloorInstanceData(eventFloors.value[i].id, eventFloors.value[i].json);
                }
            }
        },
        { deep: true },
    );

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

    function updateFloorInstanceData(floorId: string, json: Record<string, unknown>): void {
        const maybeFloorViewer = Array.from(floorInstances.value).find(({ id }) => id === floorId);
        if (!maybeFloorViewer) {
            return;
        }
        maybeFloorViewer.renderData(json);

        checkReservationsForTimeAndMarkTableIfNeeded();
    }

    async function initFloorInstancesData(): Promise<void> {
        await nextTick();
        instantiateFloors();
        setActiveFloor([...floorInstances.value][0]);
        checkReservationsForTimeAndMarkTableIfNeeded();
    }

    async function handleFloorInstancesData(
        newVal: EventFloorDoc[],
        old: EventFloorDoc[],
    ): Promise<void> {
        if (!eventFloors.value) return;
        if ((old.length === 0 && newVal.length > 0) || floorInstances.value.size === 0) {
            await initFloorInstancesData();
        }
    }

    function mapFloorToCanvas(floor: EventFloorDoc) {
        return function (el: any) {
            canvases.set(floor.id, el);
        };
    }

    function instantiateFloors(): void {
        eventFloors.value.forEach(instantiateFloor);
    }

    function instantiateFloor(floorDoc: EventFloorDoc): void {
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
