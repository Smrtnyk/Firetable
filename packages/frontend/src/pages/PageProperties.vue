<script setup lang="ts">
import PropertyCardList from "src/components/Property/PropertyCardList.vue";
import { computed, onMounted, ref } from "vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import { useRouter } from "vue-router";
import { usePropertiesStore } from "src/stores/properties-store";
import { parseAspectRatio } from "src/helpers/utils";

interface Props {
    organisationId: string;
}

const props = defineProps<Props>();
const router = useRouter();
const propertiesStore = usePropertiesStore();

const pending = ref(false);

const properties = computed(function () {
    return propertiesStore.getPropertiesByOrganisationId(props.organisationId);
});

const settings = computed(function () {
    return propertiesStore.getOrganisationSettingsById(props.organisationId);
});

const cardsAspectRatio = computed(function () {
    return parseAspectRatio(settings.value.property.propertyCardAspectRatio);
});

onMounted(function () {
    if (!props.organisationId) {
        router.replace("/");
    }
});
</script>

<template>
    <div class="PageHome">
        <PropertyCardList
            v-if="properties.length > 0"
            :properties="properties"
            :aspect-ratio="cardsAspectRatio"
        />
        <FTCenteredText v-if="properties.length === 0 && !pending">
            You have no properties created
        </FTCenteredText>
    </div>
</template>
