<script setup lang="ts">
import EventCreateReservation from "components/Event/EventCreateReservation.vue";
import EventShowReservation from "components/Event/EventShowReservation.vue";
import EventGuestList from "components/Event/EventGuestList.vue";
import FTAutocomplete from "components/Event/FTAutocomplete.vue";
import EventInfo from "components/Event/EventInfo.vue";
import FTDialog from "components/FTDialog.vue";

import { DialogChainObject, Loading, useQuasar } from "quasar";

import { useRouter } from "vue-router";
import { showConfirm } from "src/helpers/ui-helpers";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { useEventsStore } from "src/stores/events-store";
import { useI18n } from "vue-i18n";
import { useFirestore } from "src/composables/useFirestore";
import { useAuthStore } from "src/stores/auth-store";
import { useFirestoreDoc } from "src/composables/useFirestoreDoc";
import {
    BaseTable,
    Floor,
    FloorMode,
    getFreeTables,
    getReservedTables,
    getTables,
    isTable,
} from "@firetable/floorcreator";
import {
    Collection,
    CreateReservationPayload,
    EventDoc,
    FloorDoc,
    GuestData,
    Reservation,
} from "@firetable/types";
import { showErrorMessage, tryCatchLoadingWrapper } from "@firetable/utils";
import { updateEventFloorData } from "@firetable/backend";

interface State {
    showMapsExpanded: boolean;
    activeFloor: Floor | null;
    floorInstances: Floor[];
}

interface Props {
    id: string;
}

let currentOpenCreateReservationDialog: {
    label: string;
    dialog: DialogChainObject;
    floor: string;
} | null = null;

const props = defineProps<Props>();
const state = reactive<State>({
    showMapsExpanded: false,
    activeFloor: null,
    floorInstances: [],
});
const eventsStore = useEventsStore();
const authStore = useAuthStore();
const router = useRouter();
const q = useQuasar();
const { t } = useI18n();
const canvases = ref<Record<string, HTMLCanvasElement>>({});
const pageRef = ref<HTMLDivElement | null>(null);
const currentUser = computed(() => authStore.user);
const eventFloorsRef = function (floor: FloorDoc, el: HTMLCanvasElement | null) {
    if (!el) {
        return;
    }
    canvases.value[floor.id] = el;
};
const { data: guestList } = useFirestore<GuestData>({
    type: "watch",
    path: `${Collection.EVENTS}/${props.id}/guestList`,
});
const { data: event } = useFirestoreDoc<EventDoc>({
    type: "watch",
    path: `${Collection.EVENTS}/${props.id}`,
    onReceive() {
        Loading.hide();
    },
});
const { data: eventFloors } = useFirestore<FloorDoc>({
    type: "watch",
    path: `${Collection.EVENTS}/${props.id}/floors`,
});
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
    // Implement
}

function isActiveFloor(floor: Floor | FloorDoc) {
    return state.activeFloor?.id === floor.id;
}

function setActiveFloor(floor?: Floor) {
    if (floor) {
        state.activeFloor = floor;
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
        return tryCatchLoadingWrapper(() => updateEventFloorData(floor, props.id));
    };
}

function handleReservationCreation(floor: Floor, reservationData: CreateReservationPayload) {
    if (!currentUser.value) return;

    const { groupedWith } = reservationData;
    const { email, name, role, id } = currentUser.value;
    const reservedBy = { email, name, role, id };

    for (const idInGroup of groupedWith) {
        const table = getTables(floor).find(({ label }) => label === idInGroup);
        if (table) {
            floor.setReservationOnTable(table, {
                ...reservationData,
                confirmed: false,
                reservedBy,
            });
        }
    }
    tryCatchLoadingWrapper(() => updateEventFloorData(floor, props.id)).catch(showErrorMessage);
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

    currentOpenCreateReservationDialog = {
        label,
        dialog,
        floor: floor.id,
    };
}

function tableClickHandler(floor: Floor, element: BaseTable | null) {
    if (!element || !isTable(element)) return;
    const { reservation } = element;
    if (reservation) {
        showReservation(floor, reservation, element);
    } else {
        showCreateReservationDialog(floor, element);
    }
}

function onTableFound(/* tables: BaseTable[] */) {
    onAutocompleteClear();
    // for (const table of tables) {
    // do something
    // }

    // for (const table of tables) {

    //
    //     const { groupedWith } = reservation;
    //
    //     await nextTick();
    //
    //     for (const label of groupedWith) {
    //         const floorName = whiteSpaceToUnderscore(table.floor);
    //         const element = document.querySelector(
    //             `.PageEvent .eventFloor .${floorName} .table__${id}`
    //         );
    //         element?.classList.add("table__blink"); // NOSONAR
    //     }
    // }
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
    if (!currentOpenCreateReservationDialog) return;

    const { dialog, label, floor } = currentOpenCreateReservationDialog;
    const freeTables = freeTablesPerFloor.value[floor];
    const isTableStillFree = freeTables.includes(label);

    if (isTableStillFree) return;

    dialog.hide();
    currentOpenCreateReservationDialog = null;
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
    if (!reservation) return;
    const { groupedWith } = reservation;
    for (const tableId of groupedWith) {
        const table = getTables(floor).find(({ label }) => label === tableId);
        if (table) {
            floor.setReservationOnTable(table, null);
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
    if (!old.length && newVal.length) {
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
}

watch(eventFloors, handleFloorInstancesData);
watch(freeTablesPerFloor, checkIfReservedTableAndCloseCreateReservationDialog);

onMounted(init);
</script>

<template>
    <div v-if="event" class="PageEvent" ref="pageRef">
        <div class="row items-center q-mb-sm">
            <q-fab
                v-if="state.floorInstances.length"
                :model-value="state.showMapsExpanded"
                :label="state.activeFloor?.name ?? ''"
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
                :ref="(el) => eventFloorsRef(floor, el)"
            ></canvas>
        </div>

        <EventGuestList :guest-list-limit="event.guestListLimit" :guest-list="guestList" />
    </div>
</template>
