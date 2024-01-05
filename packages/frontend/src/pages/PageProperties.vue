<script setup lang="ts">
import PropertyCardList from "src/components/Property/PropertyCardList.vue";
import { computed, onMounted, ref } from "vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import { useRouter } from "vue-router";
import { usePropertiesStore } from "src/stores/properties-store";

interface Props {
    organisationId: string;
}

const props = defineProps<Props>();
const router = useRouter();
const propertiesStore = usePropertiesStore();

const pending = ref(false);

const properties = computed(() => {
    return propertiesStore.properties.filter((property) => {
        return property.organisationId === props.organisationId;
    });
});

onMounted(() => {
    if (!props.organisationId) {
        router.replace("/");
    }
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
