<script setup lang="ts">
import type { CreateDrinkCardPayload, DrinkCardDoc, InventoryItemDoc } from "@firetable/types";

import { isPDFDrinkCard } from "@firetable/types";
import DrinkCardCreateForm from "src/components/admin/drink-cards/DrinkCardCreateForm.vue";
import DrinkCardGrid from "src/components/admin/drink-cards/DrinkCardGrid.vue";
import DrinkCardQRCode from "src/components/admin/drink-cards/DrinkCardQRCode.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTTitle from "src/components/FTTitle.vue";
import { globalDialog } from "src/composables/useDialog";
import { useFirestoreCollection } from "src/composables/useFirestore.js";
import {
    createDrinkCard,
    deleteDrinkCard,
    getDrinkCardsPath,
    getInventoryPath,
    updateDrinkCard,
    uploadPDF,
} from "src/db";
import { getPublicUrForDrinkCard } from "src/helpers/drink-card/drink-card";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers.js";
import { useGlobalStore } from "src/stores/global-store";
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

interface Props {
    organisationId: string;
    propertyId: string;
}

const props = defineProps<Props>();
const { t } = useI18n();
const router = useRouter();
const globalStore = useGlobalStore();

const { data: drinkCards, pending: isLoadingDrinkCards } = useFirestoreCollection<DrinkCardDoc>(
    getDrinkCardsPath(props.organisationId, props.propertyId),
);

const {
    data: inventoryData,
    error: inventoryDataError,
    pending: isLoadingInventory,
    promise: inventoryDataPromise,
} = useFirestoreCollection<InventoryItemDoc>(
    getInventoryPath(props.organisationId, props.propertyId),
    { wait: true },
);

function createNewDrinkCard(): void {
    const dialog = globalDialog.openDialog(
        DrinkCardCreateForm,
        {
            inventoryItems: inventoryData.value ?? [],
            async onSubmit({ card, pdfFile }: { card: CreateDrinkCardPayload; pdfFile?: File }) {
                await handleSubmit(card, pdfFile);
                dialog.hide();
            },
        },
        {
            title: t("PageAdminPropertyDrinkCards.createCardDialogTitle"),
        },
    );
}

async function handleDelete(card: DrinkCardDoc): Promise<void> {
    const confirmed = await globalDialog.confirm({
        message: "",
        title: t("PageAdminPropertyDrinkCards.deleteCardConfirmation"),
    });
    if (!confirmed) return;

    await tryCatchLoadingWrapper({
        async hook() {
            await deleteDrinkCard(props.organisationId, props.propertyId, card.id, card.type);
            globalStore.notify(t("PageAdminPropertyDrinkCards.cardDeletedMessage"));
        },
    });
}

function handleEdit(card: DrinkCardDoc): void {
    const dialog = globalDialog.openDialog(
        DrinkCardCreateForm,
        {
            cardToEdit: card,
            inventoryItems: inventoryData.value ?? [],
            async onSubmit({
                card: updatedCard,
                pdfFile,
            }: {
                card: CreateDrinkCardPayload;
                pdfFile?: File;
            }) {
                await handleUpdate(card.id, updatedCard, pdfFile);
                dialog.hide();
            },
        },
        {
            title: t("PageAdminPropertyDrinkCards.editCardDialogTitle"),
        },
    );
}

async function handleSubmit(card: CreateDrinkCardPayload, pdfFile?: File): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            const cardWithIds: CreateDrinkCardPayload = {
                ...card,
                organisationId: props.organisationId,
                propertyId: props.propertyId,
            };

            // If this new card is active, deactivate all others
            if (card.isActive && drinkCards.value) {
                const updatePromises = drinkCards.value
                    .filter(({ isActive }) => isActive)
                    .map(function ({ id }) {
                        return updateDrinkCard(props.organisationId, props.propertyId, id, {
                            isActive: false,
                        });
                    });

                await Promise.all(updatePromises);
            }

            await createDrinkCard(props.organisationId, props.propertyId, cardWithIds, pdfFile);
            globalStore.notify(t("PageAdminPropertyDrinkCards.cardCreatedMessage"));
        },
    });
}

async function handleUpdate(
    cardId: string,
    card: CreateDrinkCardPayload,
    pdfFile?: File,
): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            const cardWithIds: CreateDrinkCardPayload = {
                ...card,
                organisationId: props.organisationId,
                propertyId: props.propertyId,
            };

            // If activating this card, deactivate all others
            if (card.isActive && drinkCards.value) {
                const updatePromises = drinkCards.value
                    .filter(function ({ id, isActive }) {
                        return id !== cardId && isActive;
                    })
                    .map(function ({ id }) {
                        return updateDrinkCard(props.organisationId, props.propertyId, id, {
                            isActive: false,
                        });
                    });

                await Promise.all(updatePromises);
            }

            // If it's a PDF card and we have a new file
            if (isPDFDrinkCard(card) && pdfFile) {
                cardWithIds.pdfUrl = await uploadPDF(
                    props.organisationId,
                    props.propertyId,
                    cardId,
                    pdfFile,
                );
            }

            await updateDrinkCard(props.organisationId, props.propertyId, cardId, cardWithIds);
            globalStore.notify(t("PageAdminPropertyDrinkCards.cardUpdatedMessage"));
        },
    });
}

async function init(): Promise<void> {
    globalStore.setLoading(true);
    await inventoryDataPromise.value;
    globalStore.setLoading(false);

    if (!inventoryData.value) {
        showErrorMessage("Inventory data not found", function () {
            router.replace("/");
        });
        return;
    }

    if (inventoryDataError.value) {
        showErrorMessage(inventoryDataError.value, function () {
            router.replace("/");
        });
    }
}

function showQRCode(): void {
    globalDialog.openDialog(
        DrinkCardQRCode,
        {
            url: getPublicUrForDrinkCard(props.organisationId, props.propertyId),
        },
        {
            title: t("PageAdminPropertyDrinkCards.qrCodeTitle"),
        },
    );
}

onMounted(init);
</script>

<template>
    <div class="PageAdminPropertyDrinkCards">
        <FTTitle :title="t('PageAdminPropertyDrinkCards.title')">
            <template #right>
                <FTBtn icon="fa fa-plus" color="primary" @click="createNewDrinkCard" />
                <FTBtn icon="fa fa-qrcode" round @click="showQRCode" />
                <FTBtn
                    round
                    color="primary"
                    icon="fa fa-external-link-alt"
                    :href="getPublicUrForDrinkCard(props.organisationId, props.propertyId)"
                    target="_blank"
                />
            </template>
        </FTTitle>

        <FTCenteredText
            v-if="drinkCards.length === 0 && !isLoadingDrinkCards && !isLoadingInventory"
        >
            {{ t("PageAdminPropertyDrinkCards.noCardsMessage") }}
        </FTCenteredText>

        <DrinkCardGrid
            v-else
            :cards="drinkCards"
            :loading="isLoadingDrinkCards || isLoadingInventory"
            @edit="handleEdit"
            @delete="handleDelete"
        />
    </div>
</template>
