<script setup lang="ts">
import type { FloorEditor } from "@firetable/floor-creator";
import type { FloorDoc, ReservationDoc } from "@firetable/types";
import type { EventOwner } from "src/db";

import { isActiveReservation } from "@firetable/types";
import { useLocalStorage } from "@vueuse/core";
import { matchesProperty } from "es-toolkit/compat";
import AdminEventEditInfo from "src/components/admin/event/AdminEventEditInfo.vue";
import AdminEventFloorManager from "src/components/admin/event/AdminEventFloorManager.vue";
import AdminEventFloorViewer from "src/components/admin/event/AdminEventFloorViewer.vue";
import AdminEventLogs from "src/components/admin/event/AdminEventLogs.vue";
import AdminEventReservationsByPerson from "src/components/admin/event/AdminEventReservationsByPerson.vue";
import AdminEventReservationsList from "src/components/admin/event/AdminEventReservationsList.vue";
import AdminEventReturningGuestsList from "src/components/admin/event/AdminEventReturningGuestsList.vue";
import AdminEventRTInfo from "src/components/admin/event/AdminEventRTInfo.vue";
import AppCardSection from "src/components/AppCardSection.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTTabPanels from "src/components/FTTabPanels.vue";
import FTTabs from "src/components/FTTabs.vue";
import FTTitle from "src/components/FTTitle.vue";
import { useAdminEvent } from "src/composables/useAdminEvent";
import { globalDialog } from "src/composables/useDialog";
import { useFloors } from "src/composables/useFloors";
import { useGuestsForEvent } from "src/composables/useGuestsForEvent";
import {
    addEventFloor,
    deleteEventFloor,
    deleteReservation,
    updateEventFloorData,
    updateEventFloorsOrder,
} from "src/db";
import { compressFloorDoc } from "src/helpers/compress-floor-doc";
import { formatEventDate } from "src/helpers/date-utils";
import { truncateText } from "src/helpers/string-utils";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { useGlobalStore } from "src/stores/global-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

interface Props {
    eventId: string;
    organisationId: string;
    propertyId: string;
}

const props = defineProps<Props>();
const router = useRouter();
const { locale, t } = useI18n();
const globalStore = useGlobalStore();
const propertiesStore = usePropertiesStore();

const tab = useLocalStorage<string>("admin-event-active-tab", "info");
const reservationsTab = useLocalStorage("admin-event-guests-active-tab", "arrivedReservations");

const propertySettings = computed(function () {
    return propertiesStore.getPropertySettingsById(props.propertyId);
});
const subscriptionSettings = computed(function () {
    return propertiesStore.getOrganisationSubscriptionSettingsById(props.organisationId);
});

const eventOwner: EventOwner = {
    id: props.eventId,
    organisationId: props.organisationId,
    propertyId: props.propertyId,
};

const authStore = useAuthStore();
const {
    allPlannedReservations,
    allReservations,
    arrivedReservations,
    cancelledReservations,
    event,
    eventFloors,
    isLoading,
    logs,
} = useAdminEvent(eventOwner);
const { returningGuests } = useGuestsForEvent(eventOwner, allReservations);
const logsLabelWithCount = computed(function () {
    const logsLength = logs.value?.logs.length ?? 0;
    return logsLength > 0
        ? t("PageAdminEvent.logsTabLabelWithCount", { count: logsLength })
        : t("PageAdminEvent.logsTabLabel");
});
const { floors } = useFloors(eventOwner.propertyId, eventOwner.organisationId);

watch(
    isLoading,
    function (newIsLoading) {
        if (newIsLoading) {
            globalStore.setLoading(true);
        } else {
            globalStore.setLoading(false);
        }
    },
    { immediate: true },
);

onUnmounted(function () {
    globalStore.setLoading(false);
});

async function addFloor(floor: FloorDoc): Promise<void> {
    await tryCatchLoadingWrapper({
        hook() {
            return addEventFloor(eventOwner, floor);
        },
    });
}

async function deleteReservationPermanently(reservation: ReservationDoc): Promise<void> {
    const shouldDeletePermanently = await globalDialog.confirm({
        message: t("PageAdminEvent.permanentlyDeleteReservationMessage"),
        title: t("PageAdminEvent.permanentlyDeleteReservationTitle"),
    });
    if (!shouldDeletePermanently) {
        return;
    }
    await tryCatchLoadingWrapper({
        hook() {
            return deleteReservation(eventOwner, reservation);
        },
    });
}

async function handleFloorReorder(reorderedFloors: FloorDoc[]): Promise<void> {
    await tryCatchLoadingWrapper({
        hook() {
            return updateEventFloorsOrder(eventOwner, reorderedFloors);
        },
    });
}

async function init(): Promise<void> {
    if (!props.eventId || !props.organisationId || !props.propertyId) {
        await router.replace("/");
    }
}

function isEventFinished(eventTime: number): boolean {
    const eventFinishedLimit = new Date(eventTime);
    eventFinishedLimit.setHours(
        eventFinishedLimit.getHours() + propertySettings.value.event.eventDurationInHours,
    );
    const currentTime = new Date().getTime();
    return currentTime > eventFinishedLimit.getTime();
}

async function removeFloor(index: number): Promise<void> {
    const floor = eventFloors.value[index];
    if (allReservations.value.some(matchesProperty("floorId", floor.id))) {
        showErrorMessage(t("PageAdminEvent.cannotRemoveFloorWithReservationsError"));
        return;
    }

    await tryCatchLoadingWrapper({
        hook() {
            return deleteEventFloor(eventOwner, floor.id);
        },
    });
}

async function saveFloor(floor: FloorEditor): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            const { id } = floor;
            const { height, json, width } = floor.export();
            await updateEventFloorData(eventOwner, {
                height,
                id,
                json: compressFloorDoc(json),
                width,
            });
            floor.markAsSaved();
        },
    });
}

function showEventInfoEditDialog(): void {
    if (event.value) {
        globalDialog.openDialog(
            AdminEventEditInfo,
            {
                eventInfo: event.value.info ?? "",
                eventOwner,
            },
            {
                title: t("PageAdminEvent.editEventInfoDialogTitle"),
            },
        );
    }
}

function showFloorEditDialog(floor: FloorDoc): void {
    if (event.value) {
        globalDialog.openDialog(
            AdminEventFloorViewer,
            {
                eventId: event.value.id,
                floor,
                onSave: saveFloor,
            },
            {
                title: t("PageAdminEvent.editingFloorDialogTitle", { floorName: floor.name }),
            },
        );
    }
}

onMounted(init);
</script>

<template>
    <div v-if="event && !isLoading" class="PageAdminEvent">
        <FTTitle
            :title="event.name"
            :subtitle="formatEventDate(event.date, locale, propertySettings.timezone)"
        >
            <template #right>
                <FTBtn
                    rounded
                    :to="{
                        name: 'event',
                        params: {
                            organisationId: eventOwner.organisationId,
                            propertyId: eventOwner.propertyId,
                            eventId: eventOwner.id,
                        },
                    }"
                    color="primary"
                    >{{ t("PageAdminEvent.viewButtonLabel") }}
                </FTBtn>
            </template>
        </FTTitle>
        <FTTabs v-model="tab">
            <v-tab value="info">{{ t("PageAdminEvent.infoTabLabel") }}</v-tab>
            <v-tab value="edit" v-if="!isEventFinished(event.date)">
                {{ t("PageAdminEvent.editTabLabel") }}
            </v-tab>
            <v-tab value="logs">{{ logsLabelWithCount }}</v-tab>
        </FTTabs>
        <FTTabPanels v-model="tab" class="bg-transparent">
            <!-- General info area -->
            <v-window-item value="info" class="pa-0">
                <AppCardSection>
                    <AdminEventRTInfo
                        :floors="eventFloors"
                        :active-reservations="allReservations.filter(isActiveReservation)"
                        :returning-guests="returningGuests"
                    />
                </AppCardSection>

                <AppCardSection :title="t('PageAdminEvent.reservedByStatusTitle')">
                    <AdminEventReservationsByPerson :reservations="allPlannedReservations" />
                </AppCardSection>

                <AppCardSection :title="t('PageAdminEvent.guestsTitle')">
                    <FTTabs v-model="reservationsTab">
                        <v-tab value="arrivedReservations">
                            {{
                                t("PageAdminEvent.arrivedReservationsTabLabel", {
                                    count: arrivedReservations.length,
                                })
                            }}
                        </v-tab>
                        <v-tab value="cancelledReservations">
                            {{
                                t("PageAdminEvent.cancelledReservationsTabLabel", {
                                    count: cancelledReservations.length,
                                })
                            }}
                        </v-tab>
                        <v-tab value="returningGuests">
                            {{
                                t("PageAdminEvent.returningGuestsTabLabel", {
                                    count: returningGuests.length,
                                })
                            }}
                        </v-tab>
                    </FTTabs>
                    <FTTabPanels v-model="reservationsTab">
                        <v-window-item value="arrivedReservations" class="pa-0">
                            <AdminEventReservationsList
                                :timezone="propertySettings.timezone"
                                :empty-message="t('PageAdminEvent.noArrivedReservationsMessage')"
                                @delete="deleteReservationPermanently"
                                :reservations="arrivedReservations"
                            />
                        </v-window-item>
                        <v-window-item value="cancelledReservations" class="pa-0">
                            <AdminEventReservationsList
                                :timezone="propertySettings.timezone"
                                :empty-message="t('PageAdminEvent.noCancelledReservationsMessage')"
                                @delete="deleteReservationPermanently"
                                :reservations="cancelledReservations"
                            />
                        </v-window-item>
                        <v-window-item value="returningGuests" class="pa-0">
                            <AdminEventReturningGuestsList
                                :organisation-id="organisationId"
                                :returning-guests="returningGuests"
                            />
                        </v-window-item>
                    </FTTabPanels>
                </AppCardSection>
            </v-window-item>

            <!-- Edit area -->
            <v-window-item value="edit" v-if="!isEventFinished(event.date)" class="pa-0">
                <AppCardSection :title="t('PageAdminEvent.eventInfoCardTitle')">
                    <div class="d-flex align-center pa-4">
                        <div class="flex-grow-1 mr-2">
                            <p class="text-caption mb-0">
                                {{ truncateText(event.info || "", 100) }}
                            </p>
                        </div>
                        <div>
                            <FTBtn
                                rounded
                                icon="fa:fas fa-pencil"
                                color="primary"
                                @click="showEventInfoEditDialog"
                            />
                        </div>
                    </div>
                </AppCardSection>

                <AppCardSection :title="t('PageAdminEvent.eventFloorsCardTitle')">
                    <AdminEventFloorManager
                        :max-floors="subscriptionSettings.maxFloorPlansPerEvent"
                        :floors="eventFloors"
                        :available-floors="floors"
                        :reservations="allReservations"
                        :show-edit-button="true"
                        @add="addFloor"
                        @remove="removeFloor"
                        @edit="showFloorEditDialog"
                        @reorder="handleFloorReorder"
                    />
                </AppCardSection>
            </v-window-item>

            <!-- Logs -->
            <v-window-item value="logs" class="pa-0">
                <AdminEventLogs
                    :timezone="propertySettings.timezone"
                    :logs-doc="logs"
                    :is-admin="authStore.isAdmin"
                />
            </v-window-item>
        </FTTabPanels>
    </div>
</template>
