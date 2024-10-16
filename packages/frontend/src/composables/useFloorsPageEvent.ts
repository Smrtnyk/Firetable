import type { Ref, ShallowRef } from "vue";
import type { EventDoc, FloorDoc, Reservation, ReservationDoc, User } from "@firetable/types";
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
import { useReservations } from "src/composables/useReservations";
import { debounce } from "quasar";
import { decompressFloorDoc } from "src/helpers/compress-floor-doc";
import { isTouchDevice } from "src/helpers/is-touch-device";
import { AppLogger } from "src/logger/FTLogger.js";
import { matchesProperty } from "es-toolkit/compat";

type ActiveFloor = { id: string; name: string };

// eslint-disable-next-line @typescript-eslint/max-params -- FIXME fix this
export function useFloorsPageEvent(
    eventFloors: Ref<FloorDoc[]>,
    reservations: Ref<ReservationDoc[]>,
    pageRef: ShallowRef<HTMLDivElement | null>,
    eventOwner: EventOwner,
    event: Ref<VueFirestoreDocumentData<EventDoc> | undefined>,
    users: Ref<User[]>,
) {
    const activeFloor = ref<ActiveFloor | undefined>();
    const floorInstances = shallowRef<FloorViewer[]>([]);
    const { tableClickHandler, initiateTableOperation } = useReservations(
        users,
        reservations,
        floorInstances,
        eventOwner,
        event,
    );
    const canvases = reactive<Map<string, HTMLCanvasElement>>(new Map());

    const hasMultipleFloorPlans = computed(function () {
        return eventFloors.value.length > 1;
    });

    onMounted(function () {
        if (isTouchDevice) {
            return;
        }
        window.addEventListener("resize", resizeFloor);
    });

    onBeforeUnmount(function () {
        window.removeEventListener("resize", resizeFloor);
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

    function onTableFound(foundReservations: Reservation[]): void {
        onAutocompleteClear();
        // If it is only 1 table, we can set the active floor to that floor
        // but first check if current active floor is already the same floor
        const isSingleReservation = foundReservations.length === 1;
        if (isSingleReservation && isActiveFloor(foundReservations[0].floorId)) {
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
        await Promise.all(eventFloors.value.map(instantiateFloor));
    }

    function instantiateFloor(floorDoc: FloorDoc): void {
        const canvas = canvases.get(floorDoc.id);

        if (!canvas || !pageRef.value) {
            return;
        }
        const floorViewer = new FloorViewer({
            canvas,
            floorDoc: decompressFloorDoc(floorDoc),
            containerWidth: pageRef.value.clientWidth,
        });
        floorViewer.on("elementClicked", tableClickHandler);
        floorInstances.value.push(floorViewer);
    }

    function isActiveFloor(floorId: string): boolean {
        return activeFloor.value?.id === floorId;
    }

    function setActiveFloor(floor?: ActiveFloor): void {
        if (floor) {
            activeFloor.value = { id: floor.id, name: floor.name };
        }
    }

    function onAutocompleteClear(): void {
        floorInstances.value.forEach(function (floor) {
            const tables = getTables(floor as FloorViewer);
            tables.forEach(function (table) {
                table.stopAnimation();
            });
        });
    }

    return {
        initiateTableOperation,
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
