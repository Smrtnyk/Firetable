<script setup lang="ts">
import type { DrinkCardDoc, PropertyDoc } from "@firetable/types";
import { isCustomDrinkCard, isPDFDrinkCard } from "@firetable/types";
import {
    useFirestoreCollection,
    createQuery,
    useFirestoreDocument,
} from "src/composables/useFirestore.js";
import { getDrinkCardsPath, getPropertyPath } from "@firetable/backend";
import { computed, onMounted, ref } from "vue";
import { Loading } from "quasar";
import { where } from "firebase/firestore";
import CustomDrinkCardDisplay from "src/components/admin/drink-cards/CustomDrinkCardDisplay.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";

interface Props {
    organisationId: string;
    propertyId: string;
}

const props = defineProps<Props>();

const {
    data: drinkCards,
    pending: isLoadingDrinkCards,
    promise: drinkCardsPromise,
} = useFirestoreCollection<DrinkCardDoc>(
    createQuery(
        getDrinkCardsPath(props.organisationId, props.propertyId),
        where("isActive", "==", true),
    ),
    { wait: true },
);
const { data: propertyDoc } = useFirestoreDocument<PropertyDoc>(
    getPropertyPath(props.organisationId, props.propertyId),
);

const logoImgUrl = computed(() => {
    return propertyDoc.value?.img ?? "";
});

const activeCard = computed(() => {
    return drinkCards.value?.[0];
});

const pdfHeight = ref(window.innerHeight);

async function init(): Promise<void> {
    Loading.show();
    await drinkCardsPromise.value;
    Loading.hide();
}

onMounted(init);
</script>

<template>
    <div class="PagePublicDrinkCards">
        <template v-if="!isLoadingDrinkCards && activeCard">
            <template v-if="isPDFDrinkCard(activeCard) && activeCard.pdfUrl">
                <iframe
                    title="Drink Card"
                    :src="activeCard.pdfUrl"
                    :style="{ height: `${pdfHeight}px` }"
                    class="pdf-viewer"
                    allowfullscreen
                    loading="lazy"
                    referrerpolicy="no-referrer"
                />
            </template>
            <template v-if="isCustomDrinkCard(activeCard)">
                <CustomDrinkCardDisplay :card="activeCard" :logo-img-url="logoImgUrl" />
            </template>
        </template>
        <FTCenteredText v-if="!isLoadingDrinkCards && !activeCard">
            No active drink cards found.
        </FTCenteredText>
    </div>
</template>

<style lang="scss" scoped>
.pdf-viewer {
    width: 100%;
    border: none;
    border: 0;
}
</style>
