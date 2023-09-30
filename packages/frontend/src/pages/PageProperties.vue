<script setup lang="ts">
import PushMessagesBanner from "components/PushMessagesBanner.vue";
import EventCardListSkeleton from "components/Event/EventCardListSkeleton.vue";
import { documentId, where } from "firebase/firestore";
import { PropertyDoc, Collection } from "@firetable/types";
import {
    createQuery,
    getFirestoreCollection,
    useFirestoreCollection,
} from "src/composables/useFirestore";
import PropertyCardList from "components/Property/PropertyCardList.vue";
import { useAuthStore } from "stores/auth-store";
import { takeProp } from "@firetable/utils";
import { computed, ref, watchEffect } from "vue";

const authStore = useAuthStore();
const isLoading = ref(true);
const propertyIds = computed(() => {
    return authStore.userPropertyMap.map(takeProp("propertyId"));
});
const properties = ref<PropertyDoc[]>([]);

watchEffect(async () => {
    if (propertyIds.value.length) {
        const res = useFirestoreCollection<PropertyDoc>(
            createQuery(
                getFirestoreCollection(Collection.PROPERTIES),
                where(documentId(), "in", propertyIds.value),
            ),
        );
        await res.promise.value;
        properties.value = res.data.value;
        isLoading.value = res.pending.value;
    } else {
        isLoading.value = false;
    }
});
</script>

<template>
    <div class="PageHome">
        <PushMessagesBanner />
        <PropertyCardList v-if="!!properties.length && !isLoading" :properties="properties" />
        <EventCardListSkeleton v-if="isLoading" />
        <div
            v-if="!isLoading && !properties.length"
            class="row justify-center items-center q-mt-md"
        >
            <h2 class="text-h4">You have no properties created</h2>
            <q-img src="/no-events.svg" />
        </div>
    </div>
</template>
