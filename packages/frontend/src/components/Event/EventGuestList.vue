<script setup lang="ts">
import { showConfirm } from "src/helpers/ui-helpers";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useEventsStore } from "src/stores/events-store";

import EventGuestListCreateGuestForm from "components/Event/EventGuestListCreateGuestForm.vue";
import FTTitle from "components/FTTitle.vue";
import FTDialog from "components/FTDialog.vue";
import { useQuasar } from "quasar";
import { GuestData } from "@firetable/types";
import { showErrorMessage, tryCatchLoadingWrapper } from "@firetable/utils";
import {
    addGuestToGuestList,
    confirmGuestFromGuestList,
    deleteGuestFromGuestList,
} from "@firetable/backend";

interface Props {
    guestListLimit: number;
    guestList: GuestData[];
}

const props = withDefaults(defineProps<Props>(), {
    guestList: () => [],
});
const quasar = useQuasar();
const route = useRoute();
const eventsStore = useEventsStore();
const eventID = computed(() => route.params.id as string);
const reachedCapacity = computed(() => props.guestList.length / props.guestListLimit);

function onCreate(newGuestData: GuestData) {
    if (props.guestList.length >= props.guestListLimit) {
        showErrorMessage("Limit reached!");
        return;
    }

    tryCatchLoadingWrapper(() => addGuestToGuestList(eventID.value, newGuestData)).catch(
        showErrorMessage
    );
}

async function deleteGuest(id: string, reset: () => void) {
    if (!(await showConfirm("Do you really want to delete this guest from the guestlist?")))
        return reset();

    await tryCatchLoadingWrapper(() => deleteGuestFromGuestList(eventID.value, id), void 0, reset);
}

function confirmGuest({ id, confirmed }: GuestData, reset: () => void) {
    tryCatchLoadingWrapper(() => {
        return confirmGuestFromGuestList(eventID.value, id, !confirmed);
    })
        .then(reset)
        .catch(showErrorMessage);
}

function showAddNewGuestForm(): void {
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            title: "Add Guest",
            component: EventGuestListCreateGuestForm,
            maximized: false,
            componentPropsObject: {},
            listeners: {
                create: onCreate,
            },
        },
    });
}
</script>

<template>
    <q-drawer
        :model-value="eventsStore.showEventGuestListDrawer"
        @update:model-value="eventsStore.toggleEventGuestListDrawerVisibility"
        class-name="PageEvent__guest-list-drawer"
        side="right"
        content-class="PageEvent__guest-list-container"
        overlay
        behavior="mobile"
    >
        <div class="EventGuestList">
            <FTTitle title="Guestlist">
                <template #right>
                    <q-btn
                        rounded
                        icon="plus"
                        class="button-gradient"
                        @click="showAddNewGuestForm"
                    />
                </template>
            </FTTitle>

            <q-linear-progress stripe :value="reachedCapacity" size="25px">
                <div class="absolute-full flex flex-center">
                    <q-badge
                        color="white"
                        text-color="accent"
                        :label="`${props.guestList.length} / ${props.guestListLimit}`"
                    />
                </div>
            </q-linear-progress>

            <div class="EventGuestList" v-if="!props.guestList.length">
                <div class="justify-center items-center q-pa-md">
                    <h6 class="text-h6">You should invite some people :)</h6>
                    <q-img src="people-confirmation.svg" />
                </div>
            </div>

            <q-list v-else bordered separator>
                <q-slide-item
                    v-for="guest in guestList"
                    :key="guest.id"
                    right-color="warning"
                    :left-color="guest.confirmed ? 'red-5' : 'green-5'"
                    @right="({ reset }: { reset: () => void }) => deleteGuest(guest.id, reset)"
                    @left="({ reset }: { reset: () => void }) => confirmGuest(guest, reset)"
                >
                    <template #right>
                        <q-icon name="trash" />
                    </template>
                    <template #left>
                        <q-icon color="white" :name="guest.confirmed ? 'close' : 'check'" />
                    </template>
                    <q-item
                        clickable
                        :class="{
                            'bg-green-4': guest.confirmed,
                        }"
                    >
                        <q-item-section>
                            <q-item-label>{{ guest.name }}</q-item-label>
                        </q-item-section>
                    </q-item>
                </q-slide-item>
            </q-list>
        </div>
    </q-drawer>
</template>