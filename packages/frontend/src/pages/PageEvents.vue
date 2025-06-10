<script setup lang="ts">
import type { EventDoc } from "@firetable/types";
import type { EventOwner } from "src/db";

import { limit, orderBy, where } from "firebase/firestore";
import { storeToRefs } from "pinia";
import { Loading } from "quasar";
import EventCardList from "src/components/Event/EventCardList.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTTitle from "src/components/FTTitle.vue";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { ONE_HOUR } from "src/constants";
import { eventsCollection } from "src/db";
import { parseAspectRatio } from "src/helpers/utils";
import { usePermissionsStore } from "src/stores/permissions-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";

interface Props {
    organisationId: string;
    propertyId: string;
}

const router = useRouter();
const { organisationId, propertyId } = defineProps<Props>();
const propertiesStore = usePropertiesStore();
const { canCreateEvents } = storeToRefs(usePermissionsStore());

const eventOwner: EventOwner = {
    id: "",
    organisationId,
    propertyId,
};

const propertySettings = computed(function () {
    return propertiesStore.getPropertySettingsById(propertyId);
});

const cardsAspectRatio = computed(function () {
    return parseAspectRatio(propertySettings.value.event.eventCardAspectRatio);
});

const { data: events, pending: isLoading } = useFirestoreCollection<EventDoc>(
    createQuery<EventDoc>(
        eventsCollection(eventOwner),
        where(
            "date",
            ">=",
            Date.now() - ONE_HOUR * propertySettings.value.event.eventDurationInHours,
        ),
        where("propertyId", "==", propertyId),
        orderBy("date"),
        limit(10),
    ),
);

watch(
    isLoading,
    function (newIsLoading) {
        if (newIsLoading) {
            Loading.show();
        } else {
            Loading.hide();
        }
    },
    { immediate: true },
);

onMounted(async function () {
    if (!organisationId || !propertyId) {
        await router.replace("/");
    }
});

function redirectToAdminEvents(): void {
    router.push({
        name: "adminEvents",
        params: { organisationId, propertyId },
    });
}
</script>

<template>
    <div class="PageHome">
        <FTTitle title="Upcoming Events">
            <template #right v-if="canCreateEvents">
                <FTBtn
                    class="button-gradient"
                    icon="fa fa-plus"
                    rounded
                    @click="redirectToAdminEvents"
                />
            </template>
        </FTTitle>

        <EventCardList
            v-if="events.length > 0 && !isLoading"
            :events="events"
            :aspect-ratio="cardsAspectRatio"
            :property-time-zone="propertySettings.timezone"
        />
        <FTCenteredText v-if="!isLoading && events.length === 0">
            There are no upcoming events
        </FTCenteredText>
    </div>
</template>
