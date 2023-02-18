<script setup lang="ts">
import PageAdminEventsListItem from "components/Event/PageAdminEventsListItem.vue";
import EventCreateForm from "components/admin/event/EventCreateForm.vue";
import FTTitle from "components/FTTitle.vue";
import FTDialog from "components/FTDialog.vue";

import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { onMounted, reactive, ref } from "vue";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { useQuasar, QInfiniteScroll } from "quasar";
import { useRouter } from "vue-router";
import { Collection, CreateEventPayload, EventDoc, FloorDoc } from "@firetable/types";
import { createNewEvent, deleteEvent, getEvents } from "@firetable/backend";
import { useFirestoreCollection } from "src/composables/useFirestore";
import { takeLast } from "@firetable/utils";

const EVENTS_PER_PAGE = 20;

const quasar = useQuasar();
const router = useRouter();
const isLoading = ref(true);
const events = reactive<Set<EventDoc>>(new Set());
const hasMoreEventsToFetch = ref(true);
const paginator = ref<QInfiniteScroll | null>(null);
const { data: floors } = useFirestoreCollection<FloorDoc>(Collection.FLOORS, { once: true });

async function init() {
    isLoading.value = true;
    await tryCatchLoadingWrapper({
        hook: () => fetchMoreEvents(null),
        errorHook: () => router.replace("/").catch(showErrorMessage),
    });
    isLoading.value = false;
}

async function fetchMoreEvents(lastDoc: QueryDocumentSnapshot | null) {
    if (!hasMoreEventsToFetch.value) return;
    const eventsDocs = await getEvents(lastDoc, EVENTS_PER_PAGE);
    if (!eventsDocs.length || eventsDocs.length < EVENTS_PER_PAGE) {
        hasMoreEventsToFetch.value = false;
    }
    eventsDocs.forEach(events.add, events);
}

function onCreateEvent(eventData: CreateEventPayload) {
    tryCatchLoadingWrapper({
        hook: async () => {
            const { data: id } = await createNewEvent(eventData);
            quasar.notify("Event created!");
            await router.replace({
                name: "adminEvent",
                params: { id },
            });
        },
    });
}

async function onEventItemSlideRight({ event, reset }: { event: EventDoc; reset: () => void }) {
    if (!(await showConfirm("Delete Event?"))) return reset();

    await tryCatchLoadingWrapper({
        hook: async () => {
            await deleteEvent(event.id);
            events.delete(event);
        },
        errorHook: reset,
    });
}

async function onLoad(_: number, done: () => void) {
    if (!hasMoreEventsToFetch.value) return paginator.value?.stop();
    const lastDoc = takeLast([...events])._doc;
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

        <q-list v-if="events.size > 0 && !isLoading">
            <q-infinite-scroll ref="paginator" @load="onLoad" :offset="50">
                <PageAdminEventsListItem
                    v-for="event of events"
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

        <div
            v-if="events.length === 0 && !isLoading"
            class="row justify-center items-center q-mt-md"
        >
            <div style="position: relative">
                <h6 class="q-ma-sm text-weight-bolder underline">
                    There are no events, you should create one
                </h6>
            </div>
            <q-img src="/no-events.svg" />
        </div>
    </div>
</template>
