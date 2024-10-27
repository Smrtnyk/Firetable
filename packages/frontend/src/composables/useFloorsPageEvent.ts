import type { Ref, ShallowRef } from "vue";
import type { FloorDoc, Reservation } from "@firetable/types";
import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    reactive,
    ref,
    shallowRef,
    watch,
} from "vue";
import { FloorViewer, getTables } from "@firetable/floor-creator";
import { debounce } from "quasar";
import { decompressFloorDoc } from "src/helpers/compress-floor-doc";
import { isTouchDevice } from "src/helpers/is-touch-device";
import { AppLogger } from "src/logger/FTLogger.js";
import { matchesProperty } from "es-toolkit/compat";
import { useEventListener } from "@vueuse/core";

type ActiveFloor = { id: string; name: string };
type UseFloorsPageEvent = {
    animateTables: (foundReservations: Reservation[]) => void;
    stopAllTableAnimations: () => void;
    mapFloorToCanvas: (floor: FloorDoc) => (element: any) => void;
    isActiveFloor: (floorId: string) => boolean;
    setActiveFloor: (floor?: ActiveFloor) => void;
    resizeFloor: () => void;
    hasMultipleFloorPlans: Ref<boolean>;
    activeFloor: Ref<ActiveFloor | undefined>;
    floorInstances: ShallowRef<FloorViewer[]>;
};

export function useFloorsPageEvent(
    eventFloors: Ref<FloorDoc[]>,
    pageRef: ShallowRef<HTMLDivElement | null>,
): UseFloorsPageEvent {
    const activeFloor = ref<ActiveFloor | undefined>();
    const floorInstances = shallowRef<FloorViewer[]>([]);

    const canvases = reactive<Map<string, HTMLCanvasElement>>(new Map());

    const hasMultipleFloorPlans = computed(function () {
        return eventFloors.value.length > 1;
    });

    onMounted(function () {
        if (isTouchDevice) {
            return;
        }
        useEventListener("resize", resizeFloor);
    });

    onBeforeUnmount(function () {
        floorInstances.value.forEach(function (floorInstance) {
            floorInstance.destroy().catch(AppLogger.error.bind(AppLogger));
        });
    });

    watch(eventFloors, handleFloorInstancesData);

    const resizeFloor = debounce(function () {
        floorInstances.value.forEach(function (floor) {
            if (!pageRef.value) {
                return;
            }
            floor.resize(pageRef.value.clientWidth);
        });
    }, 100);

    function animateTables(foundReservations: Reservation[]): void {
        stopAllTableAnimations();
        // If it is only 1 table, we can set the active floor to that floor
        // but first check if current active floor is already the same floor
        const isSingleReservation = foundReservations.length === 1;
        if (isSingleReservation && !isActiveFloor(foundReservations[0].floorId)) {
            const floor = floorInstances.value.find(
                matchesProperty("id", foundReservations[0].floorId),
            );
            setActiveFloor(floor);
        }
        for (const reservation of foundReservations) {
            const floor = floorInstances.value.find(matchesProperty("id", reservation.floorId));
            const table = floor?.getTableByLabel(reservation.tableLabel);
            table?.startAnimation();
        }
    }

    async function initFloorInstancesData(): Promise<void> {
        await nextTick();
        await instantiateFloors();
        setActiveFloor(floorInstances.value[0]);
    }

    async function handleFloorInstancesData(newVal: FloorDoc[], old: FloorDoc[]): Promise<void> {
        if (!eventFloors.value) {
            return;
        }
        if ((old.length === 0 && newVal.length > 0) || floorInstances.value.length === 0) {
            await initFloorInstancesData();
        }
    }

    function mapFloorToCanvas(floor: FloorDoc) {
        return function (element: any) {
            canvases.set(floor.id, element);
        };
    }

    async function instantiateFloors(): Promise<void> {
        const floors = await Promise.all(eventFloors.value.map(instantiateFloor));
        floorInstances.value = floors.filter(Boolean) as FloorViewer[];
    }

    function instantiateFloor(floorDoc: FloorDoc): FloorViewer | undefined {
        const canvas = canvases.get(floorDoc.id);

        if (!canvas || !pageRef.value) {
            return;
        }
        return new FloorViewer({
            canvas,
            floorDoc: decompressFloorDoc(floorDoc),
            containerWidth: pageRef.value.clientWidth,
        });
    }

    function isActiveFloor(floorId: string): boolean {
        return activeFloor.value?.id === floorId;
    }

    function setActiveFloor(floor?: ActiveFloor): void {
        if (floor) {
            activeFloor.value = { id: floor.id, name: floor.name };
        }
    }

    function stopAllTableAnimations(): void {
        floorInstances.value.forEach(function (floor) {
            const tables = getTables(floor as FloorViewer);
            tables.forEach(function (table) {
                table.stopAnimation();
            });
        });
    }

    return {
        animateTables,
        stopAllTableAnimations,
        mapFloorToCanvas,
        isActiveFloor,
        setActiveFloor,
        resizeFloor,
        hasMultipleFloorPlans,
        activeFloor,
        floorInstances,
    };
}
