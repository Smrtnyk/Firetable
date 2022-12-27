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
    isNone,
    None,
    Option,
    Some,
    isSome,
} from "@firetable/types";
import { floorDoc, updateEventFloorData } from "@firetable/backend";

interface State {
    showMapsExpanded: boolean;
    activeFloor: Option<Floor>;
    floorInstances: Floor[];
    activeTablesAnimationInterval: Option<number>;
}

interface Props {
    id: string;
}

let currentOpenCreateReservationDialog: Option<{
    label: string;
    dialog: DialogChainObject;
    floor: string;
}> = None();

const props = defineProps<Props>();
const state = reactive<State>({
    showMapsExpanded: false,
    activeFloor: None(),
    floorInstances: [],
    activeTablesAnimationInterval: None(),
});
const eventsStore = useEventsStore();
const authStore = useAuthStore();
const router = useRouter();
const q = useQuasar();
const { t } = useI18n();
const canvases = ref<Record<string, HTMLCanvasElement>>({});
const pageRef = ref<HTMLDivElement | null>(null);
const currentUser = computed(() => authStore.user);
const eventFloorsRef = function (floor: FloorDoc, el: HTMLCanvasElement) {
    canvases.value[floor.id] = el;
};

const guestList = useFirestoreCollection<GuestData>(`${Collection.EVENTS}/${props.id}/guestList`);
const { data: event, promise: eventDataPromise } = useFirestoreDocument<EventDoc>(
    `${Collection.EVENTS}/${props.id}`
);
const { data: eventFloors } = useFirestoreCollection<FloorDoc>(
    `${Collection.EVENTS}/${props.id}/floors`
);
const freeTablesPerFloor = computed(() => {
    const freeTablesMap: Record<string, string[]> = {};

    for (const floor of state.floorInstances) {
        freeTablesMap[floor.id] = getFreeTables(floor).map(({ label }) => label);
    }
    return freeTablesMap;
});
const allReservedTables = computed(() => {
    return state.floorInstances.map(getReservedTables).flat();
});

function onAutocompleteClear() {
    if (isSome(state.activeTablesAnimationInterval)) {
        clearInterval(state.activeTablesAnimationInterval.value);
    }
    state.floorInstances.forEach((floor) => {
        const tables = getTables(floor);
        tables.forEach((table) => table.clearAnimation());
        floor.canvas.renderAll();
    });
}

function isActiveFloor(floor: Floor | FloorDoc) {
    return isSome(state.activeFloor) && state.activeFloor.value.id === floor.id;
}

function setActiveFloor(floor?: Floor) {
    if (floor) {
        state.activeFloor = Some(floor);
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
    const { label } = element;
    const options = {
        component: FTDialog,
        componentProps: {
            component: EventShowReservation,
            title: `${t("EventShowReservation.title")} ${label}`,
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
    };
    q.dialog(options);
}

function onReservationConfirm(floor: Floor, element: BaseTable) {
    return function (val: boolean) {
        const { reservation } = element;
        if (isNone(reservation)) return;
        const { groupedWith } = reservation.value;
        for (const tableLabel of groupedWith) {
            const table = getTables(floor).find(({ label }) => label === tableLabel);
            if (table) {
                floor.setReservationOnTable(
                    table,
                    Some({
                        ...reservation.value,
                        confirmed: val,
                    })
                );
            }
        }
        return tryCatchLoadingWrapper(() => updateEventFloorData(floor, props.id));
    };
}

function handleReservationCreation(floor: Floor, reservationData: CreateReservationPayload) {
    if (isNone(currentUser.value)) return;

    const { groupedWith } = reservationData;
    const { email, name, role, id } = currentUser.value.value;
    const reservedBy = { email, name, role, id };

    for (const idInGroup of groupedWith) {
        const table = getTables(floor).find(({ label }) => label === idInGroup);
        if (table) {
            floor.setReservationOnTable(
                table,
                Some({
                    ...reservationData,
                    confirmed: false,
                    reservedBy,
                })
            );
        }
    }
    tryCatchLoadingWrapper(() => updateEventFloorData(floor, props.id)).catch(showErrorMessage);
}

function resetCurrentOpenCreateReservationDialog() {
    currentOpenCreateReservationDialog = None();
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
                        .filter((table) => label !== table.label)
                        .map(({ label }) => label),
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

    currentOpenCreateReservationDialog = Some({
        label,
        dialog,
        floor: floor.id,
    });
}

function tableClickHandler(floor: Floor, element: Option<BaseTable>) {
    if (isNone(element) || !isTable(element.value)) return;
    const { reservation } = element.value;
    if (isSome(reservation)) {
        showReservation(floor, reservation.value, element.value);
    } else {
        showCreateReservationDialog(floor, element.value);
    }
}

function onTableFound(tables: BaseTable[]) {
    onAutocompleteClear();
    function animate() {
        for (const table of tables) {
            table.animateWidthAndHeight();
        }
        state.floorInstances.forEach((floor) => floor.canvas.renderAll());
    }
    state.activeTablesAnimationInterval = Some(window.setInterval(animate, 100));
}

function instantiateFloor(floorDoc: FloorDoc) {
    const canvas = canvases.value[floorDoc.id];

    if (!canvas || !pageRef.value) return;

    state.floorInstances.push(
        new Floor({
            canvas,
            floorDoc,
            elementClickHandler: tableClickHandler,
            mode: FloorMode.LIVE,
            containerWidth: pageRef.value.clientWidth,
        })
    );
}

function instantiateFloors() {
    eventFloors.value.forEach(instantiateFloor);
}

function checkIfReservedTableAndCloseCreateReservationDialog() {
    if (isNone(currentOpenCreateReservationDialog)) return;

    const { dialog, label, floor } = currentOpenCreateReservationDialog.value;
    const freeTables = freeTablesPerFloor.value[floor];
    const isTableStillFree = freeTables.includes(label);

    if (isTableStillFree) return;

    dialog.hide();
    currentOpenCreateReservationDialog = None();
    showErrorMessage(t("PageEvent.reservationAlreadyReserved"));
}

function updateFloorInstancesData() {
    if (!eventFloors.value.length) return;

    for (const floorInstance of state.floorInstances) {
        const findFloor = eventFloors.value.find(({ id }) => id === floorInstance.id);

        if (!findFloor) {
            return;
        }

        floorInstance.renderData(findFloor.json);
    }
}

async function onDeleteReservation(floor: Floor, element: BaseTable) {
    if (!(await showConfirm("Delete reservation?"))) return;
    const { reservation } = element;
    if (isNone(reservation)) return;
    const { groupedWith } = reservation.value;
    for (const tableId of groupedWith) {
        const table = getTables(floor).find(({ label }) => label === tableId);
        if (table) {
            floor.setReservationOnTable(table, None());
        }
    }

    await tryCatchLoadingWrapper(() => updateEventFloorData(floor, props.id));
}

async function initFloorInstancesData() {
    await nextTick();
    instantiateFloors();
    setActiveFloor(state.floorInstances[0]);
}

async function handleFloorInstancesData(newVal: FloorDoc[], old: FloorDoc[]) {
    if (!eventFloors.value) return;
    if ((!old.length && newVal.length) || state.floorInstances.length === 0) {
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
                v-if="state.floorInstances.length"
                :model-value="state.showMapsExpanded"
                :label="isSome(state.activeFloor) ? state.activeFloor.value.name : ''"
                padding="xs"
                vertical-actions-align="left"
                icon="chevron_down"
                direction="down"
                class="button-gradient"
            >
                <q-fab-action
                    :key="florInstance.id"
                    v-for="florInstance in state.floorInstances"
                    class="text-white"
                    :class="{ 'button-gradient': isActiveFloor(florInstance) }"
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
            :class="{ 'active show': isActiveFloor(floor) }"
        >
            <canvas
                :id="floor.id"
                class="shadow-3"
                :ref="(el: any) => eventFloorsRef(floor, el)"
            ></canvas>
        </div>

        <EventGuestList :guest-list-limit="event.guestListLimit" :guest-list="guestList" />
    </div>
</template>
