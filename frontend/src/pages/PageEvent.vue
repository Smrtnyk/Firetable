<template>
    <div v-if="event" class="PageEvent">
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
                    v-for="florInstance of state.floorInstances"
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
                icon="info"
                @click="eventsStore.toggleEventInfoModalVisibility"
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

        <f-t-autocomplete
            :all-reserved-tables="allReservedTables"
            @found="onTableFound"
            @clear="onAutocompleteClear"
            class="q-mb-sm"
        />

        <div
            v-for="floor of eventFloors"
            :ref="(el) => eventFloorsRef(floor, el)"
            :key="floor.id"
            :id="floor.id"
            class="eventFloor tab-pane ft-card"
            :class="{ 'active show': isActiveFloor(floor) }"
        />

        <event-guest-list
            :guest-list-limit="Number(event.guestListLimit)"
            :guest-list="guestList"
        />

        <event-info />
    </div>
</template>

<script setup lang="ts">
import { EventCreateReservation } from "components/Event/EventCreateReservation"; // NOSONAR
import { EventShowReservation } from "components/Event/EventShowReservation"; // NOSONAR
import { EventGuestList } from "components/Event/EventGuestList";
import { FTTitle } from "components/FTTitle";
import FTAutocomplete from "components/Event/FTAutocomplete.vue";
import EventInfo from "components/Event/EventInfo";

import { DialogChainObject, Loading, useQuasar } from "quasar";

import { useRouter } from "vue-router";
import { Floor } from "src/floor-manager/Floor";
import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";

import {
    computed,
    defineComponent,
    nextTick,
    onMounted,
    reactive,
    ref,
    watch,
    withModifiers,
} from "vue";
import { isTable } from "src/floor-manager/type-guards";
import { getFreeTables, getReservedTables } from "src/floor-manager/filters";
import { updateEventFloorData } from "src/services/firebase/db-events";
import { CreateReservationPayload, EventDoc, GuestData, Reservation } from "src/types/event";
import { useEventsStore } from "src/stores/events-store";
import { useI18n } from "vue-i18n";
import { useFirestore } from "src/composables/useFirestore";
import { whiteSpaceToUnderscore } from "src/helpers/utils";
import { Collection } from "src/types/firebase";
import { BaseFloorElement, FloorDoc, FloorMode, TableElement } from "src/types/floor";
import { useAuthStore } from "src/stores/auth-store";

interface State {
    showMapsExpanded: boolean;
    activeFloor: FloorDoc | null;
    floorInstances: Floor[];
}

interface Props {
    id: string;
}
// eslint-disable-next-line no-undef
const props = defineProps<Props>();
const state = reactive<State>({
    showMapsExpanded: false,
    activeFloor: null,
    floorInstances: [],
});

let currentOpenCreateReservationDialog: {
    tableId: string;
    dialog: DialogChainObject;
    floor: string;
} | null = null;

const eventsStore = useEventsStore();
const authStore = useAuthStore();
const router = useRouter();
const q = useQuasar();
const { t } = useI18n();

const floorSvgs = ref<Record<string, HTMLElement>>({});

const currentUser = computed(() => authStore.user);

const eventFloorsRef = function (floor: FloorDoc, el: any) {
    if (!el) {
        return;
    }
    floorSvgs.value[floor.id] = el;
};

const { data: guestList } = useFirestore<GuestData>({
    type: "watch",
    queryType: "collection",
    path: `${Collection.EVENTS}/${props.id}/guestList`,
});
const { data: event } = useFirestore<EventDoc>({
    type: "watch",
    queryType: "doc",
    path: `${Collection.EVENTS}/${props.id}`,
    onFinished() {
        Loading.hide();
    },
});
const { data: eventFloors } = useFirestore<FloorDoc>({
    type: "watch",
    queryType: "collection",
    path: `${Collection.EVENTS}/${props.id}/floors`,
});

const freeTablesPerFloor = computed(() => {
    const freeTablesMap: Record<string, string[]> = {};

    for (const floor of eventFloors.value) {
        freeTablesMap[floor.id] = getFreeTables(floor).map((table) => table.tableId);
    }

    return freeTablesMap;
});

const allReservedTables = computed(() => {
    return eventFloors.value.map((floor) => getReservedTables(floor)).flat();
});

function onAutocompleteClear() {
    document.querySelectorAll(".table__blink").forEach((el) => el.classList.remove("table__blink"));
}

function isActiveFloor(floor: FloorDoc) {
    return state.activeFloor?.id === floor.id;
}

function setActiveFloor(floor?: FloorDoc) {
    floor && (state.activeFloor = floor);
}

function showReservation(floor: Floor, reservation: Reservation, tableId: string) {
    const options = {
        component: EventShowReservation,
        componentProps: {
            eventId: props.id,
            floor,
            reservation,
            tableId,
        },
    };
    q.dialog(options).onCancel(onDeleteReservation(floor, reservation));
}

function handleReservationCreation(floor: Floor) {
    return function (reservationData: CreateReservationPayload) {
        if (!currentUser.value) return;

        const { groupedWith } = reservationData;
        const { email, name, role, id } = currentUser.value;
        const reservedBy = { email, name, role, id };

        for (const idInGroup of groupedWith) {
            const findTableToReserve = floor.tables.find((table) => table.tableId === idInGroup);
            if (findTableToReserve) {
                findTableToReserve.reservation = {
                    ...reservationData,
                    confirmed: false,
                    reservedBy,
                };
            }
        }
        tryCatchLoadingWrapper(() => updateEventFloorData(floor, props.id)).catch(showErrorMessage);
    };
}

function resetCurrentOpenCreateReservationDialog() {
    currentOpenCreateReservationDialog = null;
}

function showCreateReservationDialog(floor: Floor, tableId: string) {
    const options = {
        component: EventCreateReservation,
        componentProps: {
            freeTables: floor.freeTables
                .filter((table) => tableId !== table.tableId)
                .map((table) => table.tableId),
            tableId,
        },
    };

    const dialog = q
        .dialog(options)
        .onOk(handleReservationCreation(floor))
        .onDismiss(resetCurrentOpenCreateReservationDialog);

    currentOpenCreateReservationDialog = {
        tableId,
        dialog,
        floor: floor.id,
    };
}

function tableClickHandler(floor: Floor | null, d: BaseFloorElement | null) {
    if (!d || !floor || !isTable(d)) return;
    const { reservation, tableId } = d;
    if (reservation) {
        showReservation(floor, reservation, tableId);
    } else {
        showCreateReservationDialog(floor, tableId);
    }
}

function onDeleteReservation(floor: Floor, { groupedWith }: Reservation) {
    return async function () {
        if (!(await showConfirm("Delete reservation?"))) return;

        for (const tableId of groupedWith) {
            const findReservationToDelete = floor.tables.find((table) => table.tableId === tableId);
            if (findReservationToDelete) {
                delete findReservationToDelete.reservation;
            }
        }

        await tryCatchLoadingWrapper(() => updateEventFloorData(floor, props.id));
    };
}

async function onTableFound(tables: TableElement[]) {
    onAutocompleteClear();

    for (const table of tables) {
        const { reservation } = table;
        if (!reservation) continue;

        const { groupedWith } = reservation;

        await nextTick();

        for (const id of groupedWith) {
            const floorName = whiteSpaceToUnderscore(table.floor);
            const element = document.querySelector(
                `.PageEvent .eventFloor .${floorName} .table__${id}`
            );
            element?.classList.add("table__blink"); // NOSONAR
        }
    }
}

function instantiateFloor(floor: FloorDoc) {
    const container = floorSvgs.value[floor.id];

    if (!container) return;

    const floorInstance = new Floor.Builder()
        .setFloorDocument(floor)
        .setMode(FloorMode.LIVE)
        .setContainer(container)
        .setElementClickHander(tableClickHandler)
        .build();

    state.floorInstances.push(floorInstance);
}

function instantiateFloors() {
    eventFloors.value.forEach(instantiateFloor);
}

function checkIfReservedTableAndCloseCreateReservationDialog() {
    if (!currentOpenCreateReservationDialog) return;

    const { dialog, tableId, floor } = currentOpenCreateReservationDialog;
    const freeTables = freeTablesPerFloor.value[floor];
    const isTableStillFree = freeTables.includes(tableId);

    if (isTableStillFree) return;

    dialog.hide();
    currentOpenCreateReservationDialog = null;
    showErrorMessage(t("PageEvent.reservationAlreadyReserved"));
}

function updateFloorInstancesData() {
    try {
        if (!eventFloors.value.length) return;

        for (const floorInstance of state.floorInstances) {
            const findFloor = eventFloors.value.find(({ id }) => id === floorInstance.id);

            if (!findFloor) {
                return;
            }

            floorInstance.data = findFloor.data;
            floorInstance.renderTableElements();
        }
    } catch (e) {
        // Seems like there is an issue with rendering the instances before the refs are even created
        // I guess at the begining the updated lifecycle hook still fires but there is nothing to render into
    }
}

async function initFloorInstancesData() {
    await nextTick();
    instantiateFloors();
    setActiveFloor(eventFloors.value[0]);
}

async function handleFloorInstancesData(newVal: FloorDoc[], old: FloorDoc[]) {
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

<style lang="scss">
.PageEvent {
    padding-left: 2px;
    padding-right: 2px;
}

.eventFloor {
    svg {
        cursor: default;
        user-select: none;
        background-color: #333;
        border-radius: $border-radius;
        max-height: 100vh;
    }

    rect.table__blink,
    circle.table__blink {
        animation: blink 500ms linear infinite;
    }

    @keyframes blink {
        0% {
            opacity: 100%;
        }
        50% {
            opacity: 0;
        }
    }
}
</style>
