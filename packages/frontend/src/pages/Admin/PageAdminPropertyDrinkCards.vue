<script setup lang="ts">
import type { CreateDrinkCardPayload, DrinkCardDoc, InventoryItemDoc } from "@firetable/types";
import { isPDFDrinkCard } from "@firetable/types";
import { useI18n } from "vue-i18n";
import { useFirestoreCollection } from "src/composables/useFirestore.js";
import {
    createDrinkCard,
    deleteDrinkCard,
    getDrinkCardsPath,
    getInventoryPath,
    updateDrinkCard,
    uploadPDF,
} from "@firetable/backend";
import { Loading } from "quasar";
import {
    notifyPositive,
    showConfirm,
    showErrorMessage,
    tryCatchLoadingWrapper,
} from "src/helpers/ui-helpers.js";
import { useDialog } from "src/composables/useDialog.js";
import { getPublicUrForDrinkCard } from "src/helpers/drink-card/drink-card";
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import FTTitle from "src/components/FTTitle.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import DrinkCardCreateForm from "src/components/admin/drink-cards/DrinkCardCreateForm.vue";
import FTDialog from "src/components/FTDialog.vue";
import DrinkCardGrid from "src/components/admin/drink-cards/DrinkCardGrid.vue";
import DrinkCardQRCode from "src/components/admin/drink-cards/DrinkCardQRCode.vue";

interface Props {
    organisationId: string;
    propertyId: string;
}

const props = defineProps<Props>();
const { t } = useI18n();
const router = useRouter();
const { createDialog } = useDialog();

const { data: drinkCards, pending: isLoadingDrinkCards } = useFirestoreCollection<DrinkCardDoc>(
    getDrinkCardsPath(props.organisationId, props.propertyId),
);

const {
    data: inventoryData,
    promise: inventoryDataPromise,
    error: inventoryDataError,
    pending: isLoadingInventory,
} = useFirestoreCollection<InventoryItemDoc>(
    getInventoryPath(props.organisationId, props.propertyId),
    { wait: true },
);

async function init(): Promise<void> {
    Loading.show();
    await inventoryDataPromise.value;
    Loading.hide();

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

async function handleSubmit(card: CreateDrinkCardPayload, pdfFile?: File): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            const cardWithIds: CreateDrinkCardPayload = {
                ...card,
                propertyId: props.propertyId,
                organisationId: props.organisationId,
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
            notifyPositive(t("PageAdminPropertyDrinkCards.cardCreatedMessage"));
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
                propertyId: props.propertyId,
                organisationId: props.organisationId,
            };

            // If activating this card, deactivate all others
            if (card.isActive && drinkCards.value) {
                const updatePromises = drinkCards.value
                    .filter(function ({ isActive, id }) {
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
            notifyPositive(t("PageAdminPropertyDrinkCards.cardUpdatedMessage"));
        },
    });
}

function createNewDrinkCard(): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: DrinkCardCreateForm,
            componentPropsObject: {
                inventoryItems: inventoryData.value || [],
            },
            maximized: true,
            title: t("PageAdminPropertyDrinkCards.createCardDialogTitle"),
            listeners: {
                async submit({ card, pdfFile }: { card: CreateDrinkCardPayload; pdfFile?: File }) {
                    await handleSubmit(card, pdfFile);
                    dialog.hide();
                },
            },
        },
    });
}

function handleEdit(card: DrinkCardDoc): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: DrinkCardCreateForm,
            componentPropsObject: {
                cardToEdit: card,
                inventoryItems: inventoryData.value || [],
            },
            maximized: true,
            title: t("PageAdminPropertyDrinkCards.editCardDialogTitle"),
            listeners: {
                async submit({
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
        },
    });
}

async function handleDelete(card: DrinkCardDoc): Promise<void> {
    const confirmed = await showConfirm(t("PageAdminPropertyDrinkCards.deleteCardConfirmation"));
    if (!confirmed) return;

    await tryCatchLoadingWrapper({
        async hook() {
            await deleteDrinkCard(props.organisationId, props.propertyId, card.id, card.type);
            notifyPositive(t("PageAdminPropertyDrinkCards.cardDeletedMessage"));
        },
    });
}

function showQRCode(): void {
    createDialog({
        component: FTDialog,
        componentProps: {
            maximized: false,
            component: DrinkCardQRCode,
            title: t("PageAdminPropertyDrinkCards.qrCodeTitle"),
            componentPropsObject: {
                url: getPublicUrForDrinkCard(props.organisationId, props.propertyId),
            },
        },
    });
}

onMounted(init);
</script>

<template>
    <div class="PageAdminPropertyDrinkCards">
        <FTTitle :title="t('PageAdminPropertyDrinkCards.title')">
            <template #right>
                <FTBtn rounded icon="plus" class="button-gradient" @click="createNewDrinkCard" />
                <FTBtn rounded icon="qr-code" flat round @click="showQRCode" />
                <FTBtn
                    flat
                    round
                    color="primary"
                    icon="external-link"
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
