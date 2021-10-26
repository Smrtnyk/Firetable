import PageAdminEventsListItem from "components/Event/PageAdminEventsListItem";
import { EventCreateForm } from "src/components/Event/EventCreateForm";

import {
    showConfirm,
    showErrorMessage,
    tryCatchLoadingWrapper,
} from "src/helpers/ui-helpers";
import { defineComponent, onMounted, ref } from "vue";
import { DocumentData, QueryDocumentSnapshot } from "@firebase/firestore";
import {
    createNewEvent,
    deleteEvent,
    getEvents,
} from "src/services/firebase/db-events";
import {
    useQuasar,
    QBtn,
    QList,
    QInfiniteScroll,
    QSeparator,
    QSpinnerDots,
    QImg,
} from "quasar";
import { useRouter } from "vue-router";
import { useFirestore } from "src/composables/useFirestore";
import { FTTitle } from "components/FTTitle";
import { Collection } from "src/types/firebase";
import { FloorDoc } from "src/types/floor";
import { CreateEventPayload, EventDoc } from "src/types/event";
import { useEventsStore } from "src/stores/events-store";

export default defineComponent({
    name: "PageAdminEvents",

    components: {
        FTTitle,
        PageAdminEventsListItem,
        EventCreateForm,
        QBtn,
        QList,
        QInfiniteScroll,
        QSeparator,
        QSpinnerDots,
        QImg,
    },

    setup() {
        const q = useQuasar();
        const router = useRouter();
        const eventsStore = useEventsStore();

        const isLoading = ref(true);
        const events = ref<EventDoc[]>([]);
        const hasMoreEventsToFetch = ref(true);
        const paginator = ref<QInfiniteScroll | null>(null);

        const { data: floors } = useFirestore<FloorDoc>({
            type: "get",
            queryType: "collection",
            path: Collection.FLOORS,
        });

        async function init() {
            isLoading.value = true;
            await tryCatchLoadingWrapper(
                fetchMoreEvents.bind(null, null),
                [],
                () => {
                    router.replace("/").catch(showErrorMessage);
                }
            );
            isLoading.value = false;
        }

        async function fetchMoreEvents(
            lastDoc: QueryDocumentSnapshot<DocumentData> | null
        ) {
            if (!hasMoreEventsToFetch.value) return;

            const eventsDocs = await getEvents(lastDoc);

            if (!eventsDocs.length || eventsDocs.length < 20)
                hasMoreEventsToFetch.value = false;

            events.value.push(...eventsDocs);
        }

        function onCreateEvent(eventData: CreateEventPayload) {
            eventsStore.toggleEventCreateModalVisiblity();

            tryCatchLoadingWrapper(async () => {
                const { data: id } = await createNewEvent(eventData);
                q.notify("Event created!");
                await router.replace({
                    name: "adminEvent",
                    // @ts-ignore - fix this
                    params: { id },
                });
            }).catch(showErrorMessage);
        }

        async function onEventItemSlideRight({
            event,
            reset,
        }: {
            event: EventDoc;
            reset: () => void;
        }) {
            if (!(await showConfirm("Delete Event?"))) return reset();

            await tryCatchLoadingWrapper(
                async () => {
                    await deleteEvent(event.id);
                    events.value = events.value.filter(
                        ({ id }) => id !== event.id
                    );
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

        onMounted(init);

        return () => (
            <div class="PageAdminEvents">
                <event-create-form
                    floors={floors.value}
                    onCreate={onCreateEvent}
                />

                <f-t-title title="Events">
                    {{
                        right: () => (
                            <q-btn
                                rounded
                                icon="plus"
                                class="button-gradient"
                                onClick={
                                    eventsStore.toggleEventCreateModalVisiblity
                                }
                                label="new event"
                            />
                        ),
                    }}
                </f-t-title>

                {!!events.value.length && !isLoading.value && (
                    <q-list>
                        <q-infinite-scroll
                            ref={paginator}
                            onLoad={onLoad}
                            offset={50}
                        >
                            {{
                                default: () => (
                                    <>
                                        {events.value.map((event) => (
                                            <page-admin-events-list-item
                                                key={event.id}
                                                event={event}
                                                onRight={onEventItemSlideRight}
                                            />
                                        ))}
                                        <q-separator spaced inset={true} />
                                    </>
                                ),
                                loading: () => (
                                    <div class="row justify-center q-my-md">
                                        <q-spinner-dots
                                            color="primary"
                                            size="40px"
                                        />
                                    </div>
                                ),
                            }}
                        </q-infinite-scroll>
                    </q-list>
                )}

                {!events.value.length && !isLoading.value && (
                    <div class="row justify-center items-center q-mt-md">
                        <div style="position: relative">
                            <h6 class="q-ma-sm text-weight-bolder underline">
                                There are no events, you should create one
                            </h6>
                        </div>
                        <q-img src="no-events.svg" />
                    </div>
                )}
            </div>
        );
    },
});
