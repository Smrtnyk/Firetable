<script setup lang="ts">
import type { DrinkCardDoc } from "@firetable/types";
import { isPDFDrinkCard } from "@firetable/types";
import { useFirestoreCollection, createQuery } from "src/composables/useFirestore.js";
import { getDrinkCardsPath } from "@firetable/backend";
import { computed, onMounted, ref } from "vue";
import { Loading } from "quasar";
import { where } from "firebase/firestore";
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
