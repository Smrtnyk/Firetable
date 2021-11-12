<script setup lang="ts">
import PageAdminEventsListItem from "components/Event/PageAdminEventsListItem.vue";
import EventCreateForm from "components/admin/event/EventCreateForm.vue";
import FTTitle from "components/FTTitle.vue";
import FTDialog from "components/FTDialog.vue";

import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { onMounted, ref } from "vue";
import { QueryDocumentSnapshot } from "@firebase/firestore";
import { createNewEvent, deleteEvent, getEvents } from "src/services/firebase/db-events";
import { useQuasar, QInfiniteScroll } from "quasar";
import { useRouter } from "vue-router";
import { useFirestore } from "src/composables/useFirestore";
import { Collection } from "src/types/firebase";
import { FloorDoc } from "src/types/floor";
import { CreateEventPayload, EventDoc } from "src/types/event";

const quasar = useQuasar();
const router = useRouter();
const isLoading = ref(true);
const events = ref<EventDoc[]>([]);
const hasMoreEventsToFetch = ref(true);
const paginator = ref<QInfiniteScroll | null>(null);
const { data: floors } = useFirestore<FloorDoc>({
    type: "get",
    path: Collection.FLOORS,
});

async function init() {
    isLoading.value = true;
    await tryCatchLoadingWrapper(fetchMoreEvents.bind(null, null), [], () => {
        router.replace("/").catch(showErrorMessage);
    });
    isLoading.value = false;
}

async function fetchMoreEvents(lastDoc: QueryDocumentSnapshot | null) {
    if (!hasMoreEventsToFetch.value) return;
    const eventsDocs = await getEvents(lastDoc);
    if (!eventsDocs.length || eventsDocs.length < 20) {
        hasMoreEventsToFetch.value = false;
    }
    events.value.push(...eventsDocs);
}

function onCreateEvent(eventData: CreateEventPayload) {
    tryCatchLoadingWrapper(async () => {
        const { data: id } = await createNewEvent(eventData);
        quasar.notify("Event created!");
        await router.replace({
            name: "adminEvent",
            params: { id },
        });
    }).catch(showErrorMessage);
}

async function onEventItemSlideRight({ event, reset }: { event: EventDoc; reset: () => void }) {
    if (!(await showConfirm("Delete Event?"))) return reset();

    await tryCatchLoadingWrapper(
        async () => {
            await deleteEvent(event.id);
            events.value = events.value.filter(({ id }) => id !== event.id);
        },
        [],
        reset
    );
}

async function onLoad(_: number, done: () => void) {
    if (!hasMoreEventsToFetch.value) return paginator.value?.stop();

    const lastDoc = events.value[events.value.length - 1]._doc;
    await fetchMoreEvents(lastDoc);

    done();
}

function showCreateEventForm(): void {
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            title: "Create new event",
            maximized: false,
            component: EventCreateForm,
            componentPropsObject: {
                floors: floors.value,
            },
            listeners: {
                create: onCreateEvent,
            },
        },
    });
}

onMounted(init);
</script>

<template>
    <div class="PageAdminEvents">
        <FTTitle title="Events">
            <template #right>
                <q-btn
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="showCreateEventForm"
                    label="new event"
                />
            </template>
        </FTTitle>

        <q-list v-if="!!events.length && !isLoading">
            <q-infinite-scroll ref="paginator" @load="onLoad" :offset="50">
                <page-admin-events-list-item
                    v-for="event in events"
                    :key="event.id"
                    :event="event"
                    @right="onEventItemSlideRight"
                />

                <q-separator spaced inset />
                <template #loading>
                    <div class="row justify-center q-my-md">
                        <q-spinner-dots color="primary" size="40px" />
                    </div>
                </template>
            </q-infinite-scroll>
        </q-list>

        <div v-if="!events.length && !isLoading" class="row justify-center items-center q-mt-md">
            <div style="position: relative">
                <h6 class="q-ma-sm text-weight-bolder underline">
                    There are no events, you should create one
                </h6>
            </div>
            <q-img src="no-events.svg" />
        </div>
    </div>
</template>
