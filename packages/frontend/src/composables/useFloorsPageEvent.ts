import type { Ref } from "vue";
import type { EventDoc, EventFloorDoc, Reservation, ReservationDoc } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import type { VueFirestoreDocumentData } from "vuefire";
import { FloorViewer, getTables } from "@firetable/floor-creator";
import {
    watch,
    reactive,
    computed,
    ref,
    nextTick,
    onMounted,
    onBeforeUnmount,
    shallowRef,
} from "vue";
import { useUsers } from "src/composables/useUsers";
import { useReservations } from "src/composables/useReservations";
import { debounce } from "quasar";
import { decompressFloorDoc } from "src/helpers/compress-floor-doc";

const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

export function useFloorsPageEvent(
    eventFloors: Ref<EventFloorDoc[]>,
    reservations: Ref<ReservationDoc[]>,
    pageRef: Ref<HTMLDivElement | undefined>,
    eventOwner: EventOwner,
    event: Ref<VueFirestoreDocumentData<EventDoc> | undefined>,
) {
    const activeTablesAnimationInterval = ref<number | undefined>();
    const activeFloor = ref<{ id: string; name: string } | undefined>();
    const floorInstances = shallowRef<FloorViewer[]>([]);
    const { users } = useUsers(eventOwner.organisationId);
    const { tableClickHandler, checkReservationsForTimeAndMarkTableIfNeeded } = useReservations(
        users,
        reservations,
        floorInstances,
        eventOwner,
        event,
    );
    const canvases = reactive<Map<string, HTMLCanvasElement>>(new Map());

    const hasMultipleFloorPlans = computed(() => {
        return eventFloors.value.length > 1;
    });

    onMounted(() => {
        if (isTouchDevice) {
            return;
        }
        window.addEventListener("resize", resizeFloor);
    });

    onBeforeUnmount(() => {
        window.removeEventListener("resize", resizeFloor);
        floorInstances.value.forEach((floorInstance) => {
            floorInstance.destroy();
        });
    });

    watch(eventFloors, handleFloorInstancesData);

    const resizeFloor = debounce((): void => {
        floorInstances.value.forEach((floor) => {
            if (!pageRef.value) {
                return;
            }
            floor.resize(pageRef.value.clientWidth);
        });
    }, 100);

    function onTableFound(foundReservations: Reservation[]): void {
        onAutocompleteClear();
        for (const reservation of foundReservations) {
            const floor = floorInstances.value.find(({ id }) => reservation.floorId === id);
            const table = floor?.getTableByLabel(reservation.tableLabel);
            table?.startAnimation();
        }
    }

    async function initFloorInstancesData(): Promise<void> {
        await nextTick();
        await instantiateFloors();
        setActiveFloor(floorInstances.value[0] as FloorViewer);
        checkReservationsForTimeAndMarkTableIfNeeded();
    }

    async function handleFloorInstancesData(
        newVal: EventFloorDoc[],
        old: EventFloorDoc[],
    ): Promise<void> {
        if (!eventFloors.value) return;
        if ((old.length === 0 && newVal.length > 0) || floorInstances.value.length === 0) {
            await initFloorInstancesData();
        }
    }

    function mapFloorToCanvas(floor: EventFloorDoc) {
        return function (el: any) {
            canvases.set(floor.id, el);
        };
    }

    async function instantiateFloors(): Promise<void> {
        await Promise.all(eventFloors.value.map(instantiateFloor));
    }

    async function instantiateFloor(floorDoc: EventFloorDoc): Promise<void> {
        const canvas = canvases.get(floorDoc.id);

        if (!canvas || !pageRef.value) return;
        const floorViewer = new FloorViewer({
            canvas,
            floorDoc: await decompressFloorDoc(floorDoc),
            containerWidth: pageRef.value.clientWidth,
        });
        floorViewer.on("elementClicked", tableClickHandler);
        floorInstances.value.push(floorViewer);
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
            const tables = getTables(floor as FloorViewer);
            tables.forEach((table) => table.stopAnimation());
        });
    }

    return {
        onTableFound,
        onAutocompleteClear,
        mapFloorToCanvas,
        isActiveFloor,
        setActiveFloor,
        resizeFloor,
        hasMultipleFloorPlans,
        activeFloor,
        floorInstances,
    };
}
