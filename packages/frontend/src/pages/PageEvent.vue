<script setup lang="ts">
import EventCreateReservation from "components/Event/EventCreateReservation.vue";
import EventShowReservation from "components/Event/EventShowReservation.vue";
import EventGuestList from "components/Event/EventGuestList.vue";
import FTAutocomplete from "components/Event/FTAutocomplete.vue";
import EventInfo from "components/Event/EventInfo.vue";
import FTDialog from "components/FTDialog.vue";

import { DialogChainObject, Loading, useQuasar } from "quasar";

import { useRouter } from "vue-router";
import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { useEventsStore } from "src/stores/events-store";
import { useI18n } from "vue-i18n";
import { useFirestoreCollection, useFirestoreDocument } from "src/composables/useFirestore";
import { useAuthStore } from "src/stores/auth-store";
import {
    BaseTable,
    Floor,
    FloorMode,
    getFreeTables,
    getReservedTables,
    getTables,
    isTable,
} from "@firetable/floor-creator";
import {
    Collection,
    CreateReservationPayload,
    EventDoc,
    FloorDoc,
    GuestData,
    Reservation,
} from "@firetable/types";
import { updateEventFloorData } from "@firetable/backend";
import { matchesValue, not, takeProp } from "@firetable/utils";

interface State {
    showMapsExpanded: boolean;
    activeFloor: { id: string; name: string } | undefined;
    floorInstances: Set<Floor>;
    activeTablesAnimationInterval: number | null;
}

interface Props {
    id: string;
}

let currentOpenCreateReservationDialog: {
    label: string;
    dialog: DialogChainObject;
    floorId: string;
} | null = null;

const props = defineProps<Props>();
const state = reactive<State>({
    showMapsExpanded: false,
    activeFloor: void 0,
    floorInstances: new Set<Floor>(),
    activeTablesAnimationInterval: null,
});
const eventsStore = useEventsStore();
const authStore = useAuthStore();
const router = useRouter();
const q = useQuasar();
const { t } = useI18n();
const canvases = reactive<Map<string, HTMLCanvasElement>>(new Map());
const pageRef = ref<HTMLDivElement>();
const currentUser = computed(() => authStore.user);
const guestList = useFirestoreCollection<GuestData>(`${Collection.EVENTS}/${props.id}/guestList`);
const { data: event, promise: eventDataPromise } = useFirestoreDocument<EventDoc>(
    `${Collection.EVENTS}/${props.id}`,
);
const { data: eventFloors } = useFirestoreCollection<FloorDoc>(
    `${Collection.EVENTS}/${props.id}/floors`,
);
const freeTablesPerFloor = computed(() => {
    const freeTablesMap = new Map<string, string[]>();

    for (const floor of state.floorInstances) {
        freeTablesMap.set(floor.id, getFreeTables(floor).map(takeProp("label")));
    }
    return freeTablesMap;
});
const allReservedTables = computed(() => {
    return Array.from(state.floorInstances).map(getReservedTables).flat();
});

function mapFloorToCanvas(floor: FloorDoc) {
    return function (el: HTMLCanvasElement) {
        canvases.set(floor.id, el);
    };
}

function onAutocompleteClear(): void {
    if (state.activeTablesAnimationInterval) {
        clearInterval(state.activeTablesAnimationInterval);
    }
    state.floorInstances.forEach((floor) => {
        const tables = getTables(floor);
        tables.forEach((table) => table.stopSmoothBlinking());
        floor.canvas.renderAll();
    });
}

function isActiveFloor(floorId: string): boolean {
    return state.activeFloor?.id === floorId;
}

function setActiveFloor(floor?: Floor): void {
    if (floor) {
        state.activeFloor = { id: floor.id, name: floor.name };
    }
}

function showActiveStaff(): void {
    // todo: implement
}

function showEventInfo(): void {
    q.dialog({
        component: FTDialog,
        componentProps: {
            component: EventInfo,
            title: "Event Info",
            maximized: false,
            componentPropsObject: {
                eventInfo: event.value?.info || "",
            },
            listeners: {},
        },
    });
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
            hook: () => updateEventFloorData(floor, props.id),
        });
    };
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
    tryCatchLoadingWrapper({
        hook: () => updateEventFloorData(floor, props.id),
    });
}

function resetCurrentOpenCreateReservationDialog() {
    currentOpenCreateReservationDialog = null;
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

function tableClickHandler(floor: Floor, element: BaseTable | null) {
    if (!isTable(element)) return;
    const { reservation } = element;
    if (reservation) {
        showReservation(floor, reservation, element);
    } else {
        showCreateReservationDialog(floor, element);
    }
}

function onTableFound(tables: BaseTable[]) {
    onAutocompleteClear();
    function animate() {
        for (const table of tables) {
            table.startSmoothBlinking();
        }
        state.floorInstances.forEach((floor) => floor.canvas.renderAll());
    }
    state.activeTablesAnimationInterval = window.setInterval(animate, 100);
}

function instantiateFloor(floorDoc: FloorDoc) {
    const canvas = canvases.get(floorDoc.id);

    if (!canvas || !pageRef.value) return;

    state.floorInstances.add(
        new Floor({
            canvas,
            floorDoc,
            elementClickHandler: tableClickHandler,
            mode: FloorMode.LIVE,
            containerWidth: pageRef.value.clientWidth,
        }),
    );
}

function instantiateFloors() {
    eventFloors.value.forEach(instantiateFloor);
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

function updateFloorInstancesData() {
    if (!eventFloors.value.length) return;

    for (const floorInstance of state.floorInstances) {
        const findFloor = eventFloors.value.find(({ id }) => id === floorInstance.id);
        if (!findFloor) return;
        floorInstance.renderData(findFloor.json);
    }
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
        hook: () => updateEventFloorData(floor, props.id),
    });
}

async function initFloorInstancesData() {
    await nextTick();
    instantiateFloors();
    setActiveFloor([...state.floorInstances][0]);
}

async function handleFloorInstancesData(newVal: FloorDoc[], old: FloorDoc[]) {
    if (!eventFloors.value) return;
    if ((!old.length && newVal.length) || state.floorInstances.size === 0) {
        await initFloorInstancesData();
        return;
    }
    updateFloorInstancesData();
}

async function init() {
    if (!props.id) {
        await router.replace("/");
    }
    Loading.show();
    await eventDataPromise.value;
    Loading.hide();
}

watch(() => eventFloors.value, handleFloorInstancesData, { deep: true });
watch(freeTablesPerFloor, checkIfReservedTableAndCloseCreateReservationDialog);

onMounted(init);
</script>

<template>
    <div v-if="event" class="PageEvent" ref="pageRef">
        <div class="row items-center q-mb-sm">
            <q-fab
                v-if="state.floorInstances.size"
                :model-value="state.showMapsExpanded"
                :label="state.activeFloor ? state.activeFloor.name : ''"
                padding="xs"
                vertical-actions-align="left"
                icon="chevron_down"
                direction="down"
                class="button-gradient"
            >
                <q-fab-action
                    :key="florInstance.id"
                    v-for="florInstance of state.floorInstances"
                    class="text-white"
                    :class="{ 'button-gradient': isActiveFloor(florInstance.id) }"
                    @click.prevent="() => setActiveFloor(florInstance)"
                    :label="florInstance.name"
                />
            </q-fab>

            <q-space />
            <q-btn
                class="button-gradient q-mr-sm"
                rounded
                size="md"
                icon="check"
                @click="showActiveStaff"
                v-if="event.activeStaff"
            />
            <q-btn
                class="button-gradient q-mr-sm"
                rounded
                size="md"
                icon="info"
                @click="showEventInfo"
                v-if="event.info"
            />
            <q-btn
                class="button-gradient"
                @click="eventsStore.toggleEventGuestListDrawerVisibility"
                icon="users"
                rounded
                size="md"
            />
        </div>
        <q-separator class="q-mx-auto q-my-xs-xs q-my-sm-sm q-my-md-md" inset />
        <FTAutocomplete
            :all-reserved-tables="allReservedTables"
            @found="onTableFound"
            @clear="onAutocompleteClear"
            class="q-mb-sm"
        />

        <div
            v-for="floor in eventFloors"
            :key="floor.id"
            class="ft-tab-pane"
            :class="{ 'active show': isActiveFloor(floor.id) }"
        >
            <canvas :id="floor.id" class="shadow-3" :ref="mapFloorToCanvas(floor)"></canvas>
        </div>

        <EventGuestList :guest-list-limit="event.guestListLimit" :guest-list="guestList" />
    </div>
</template>
