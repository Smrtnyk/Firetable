<script setup lang="ts">
import PropertyCardList from "src/components/Property/PropertyCardList.vue";
import { computed, onMounted, ref, watch } from "vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import { useRoute, useRouter } from "vue-router";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { ADMIN, PropertyDoc } from "@firetable/types";
import { useAuthStore } from "src/stores/auth-store";
import { query, where } from "firebase/firestore";
import { propertiesCollection } from "@firetable/backend";
import { usePropertiesStore } from "src/stores/usePropertiesStore";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const propertiesStore = usePropertiesStore();

const organisationId = route.params.organisationId as string;
const properties = ref<PropertyDoc[]>([]);
const pending = ref(false);

const computedQuery = computed(() => {
    const user = authStore.user;
    if (authStore.isAdmin) {
        return query(propertiesCollection(organisationId));
    }
    return query(
        propertiesCollection(organisationId),
        where("relatedUsers", "array-contains", user?.id),
    );
});

onMounted(() => {
    if (!organisationId) {
        router.replace("/");
    }

    if (authStore.user?.role === ADMIN) {
        const { pending: isLoadingProperties } = useFirestoreCollection<PropertyDoc[]>(
            createQuery(computedQuery.value),
            {
                once: true,
                target: properties,
            },
        );
        const unsubWatch = watch(isLoadingProperties, () => {
            pending.value = isLoadingProperties.value;
            if (!isLoadingProperties.value) {
                unsubWatch();
            }
        });
        return;
    }

    properties.value = propertiesStore.properties;
});
</script>

<template>
    <div class="PageHome">
        <PropertyCardList v-if="properties.length > 0" :properties="properties" />
        <FTCenteredText v-if="properties.length === 0 && !pending">
            You have no properties created
        </FTCenteredText>
    </div>
</template>
