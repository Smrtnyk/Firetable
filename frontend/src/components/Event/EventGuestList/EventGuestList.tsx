import {
    showConfirm,
    showErrorMessage,
    tryCatchLoadingWrapper,
} from "src/helpers/ui-helpers";
import { computed, defineComponent, PropType, ref } from "vue";
import { GuestData } from "src/types/event";
import {
    addGuestToGuestList,
    confirmGuestFromGuestList,
    deleteGuestFromGuestList,
} from "src/services/firebase/db-events";
import { useRoute } from "vue-router";

import {
    QLinearProgress,
    QBadge,
    QDialog,
    QList,
    QSlideItem,
    QItem,
    QItemSection,
    QItemLabel,
    QBtn,
    QIcon,
    QImg,
    QDrawer,
} from "quasar";

import { EventGuestListCreateGuestForm } from "src/components/Event/EventGuestListCreateGuestForm";
import { FTTitle } from "components/FTTitle";
import { useEventsStore } from "src/stores/events-store";

export default defineComponent({
    name: "EventGuestList",
    components: {
        FTTitle,
        EventGuestListCreateGuestForm,
        QLinearProgress,
        QBadge,
        QDialog,
        QList,
        QSlideItem,
        QItem,
        QItemLabel,
        QItemSection,
        QBtn,
        QIcon,
        QImg,
        QDrawer,
    },
    props: {
        guestListLimit: {
            type: Number,
            required: true,
        },
        guestList: {
            type: Array as PropType<GuestData[]>,
            default: () => [],
        },
    },
    setup(props) {
        const route = useRoute();
        const eventsStore = useEventsStore();

        const showAddNewGuestForm = ref(false);

        const eventID = computed(() => route.params.id as string);
        const reachedCapacity = computed(
            () => props.guestList.length / props.guestListLimit
        );

        function onCreate(newGuestData: GuestData) {
            showAddNewGuestForm.value = false;

            if (props.guestList.length >= props.guestListLimit) {
                showErrorMessage("Limit reached!");
                return;
            }

            void tryCatchLoadingWrapper(() =>
                addGuestToGuestList(eventID.value, newGuestData)
            );
        }

        async function deleteGuest(id: string, reset: () => void) {
            if (
                !(await showConfirm(
                    "Do you really want to delete this guest from the guestlist?"
                ))
            )
                return reset();

            await tryCatchLoadingWrapper(
                () => deleteGuestFromGuestList(eventID.value, id),
                void 0,
                reset
            );
        }

        function confirmGuest({ id, confirmed }: GuestData, reset: () => void) {
            void tryCatchLoadingWrapper(() => {
                return confirmGuestFromGuestList(eventID.value, id, !confirmed);
            }).then(reset);
        }

        return () => (
            <q-drawer
                model-value={eventsStore.showEventGuestListDrawer}
                {...{
                    "onUpdate:modelValue":
                        eventsStore.toggleEventGuestListDrawerVisibility,
                }}
                className="PageEvent__guest-list-drawer"
                side="right"
                content-class="PageEvent__guest-list-container"
            >
                <div class="EventGuestList">
                    <f-t-title title="Guestlist">
                        {{
                            right: () => (
                                <q-btn
                                    rounded
                                    icon="plus"
                                    class="button-gradient"
                                    onClick={() =>
                                        (showAddNewGuestForm.value =
                                            !showAddNewGuestForm.value)
                                    }
                                />
                            ),
                        }}
                    </f-t-title>

                    <q-linear-progress
                        stripe
                        value={reachedCapacity.value}
                        size="25px"
                    >
                        <div class="absolute-full flex flex-center">
                            <q-badge
                                color="white"
                                text-color="accent"
                                label={`${props.guestList.length} / ${props.guestListLimit}`}
                            />
                        </div>
                    </q-linear-progress>

                    <q-dialog v-model={showAddNewGuestForm.value}>
                        <event-guest-list-create-guest-form
                            onCreate={onCreate}
                        />
                    </q-dialog>

                    {!props.guestList.length && (
                        <div class="EventGuestList">
                            <div class="justify-center items-center q-pa-md">
                                <h6 class="text-h6">
                                    You should invite some people :)
                                </h6>
                                <q-img src="people-confirmation.svg" />
                            </div>
                        </div>
                    )}

                    {!!props.guestList.length && (
                        <q-list bordered separator>
                            {props.guestList.map((guest) => (
                                <q-slide-item
                                    key={guest.id}
                                    right-color="warning"
                                    left-color={
                                        guest.confirmed ? "red-5" : "green-5"
                                    }
                                    onRight={({
                                        reset,
                                    }: {
                                        reset: () => void;
                                    }) => deleteGuest(guest.id, reset)}
                                    onLeft={({
                                        reset,
                                    }: {
                                        reset: () => void;
                                    }) => confirmGuest(guest, reset)}
                                    v-slots={{
                                        right: () => <q-icon name="trash" />,
                                        left: () => (
                                            <q-icon
                                                color="white"
                                                name={
                                                    guest.confirmed
                                                        ? "close"
                                                        : "check"
                                                }
                                            />
                                        ),
                                    }}
                                >
                                    <q-item
                                        clickable
                                        class={
                                            guest.confirmed ? "bg-green-4" : ""
                                        }
                                    >
                                        <q-item-section>
                                            <q-item-label>
                                                {guest.name}
                                            </q-item-label>
                                        </q-item-section>
                                    </q-item>
                                </q-slide-item>
                            ))}
                        </q-list>
                    )}
                </div>
            </q-drawer>
        );
    },
});
