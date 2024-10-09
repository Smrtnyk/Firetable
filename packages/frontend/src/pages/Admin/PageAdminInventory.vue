<script setup lang="ts">
import type { CreateInventoryItemPayload, InventoryItemDoc } from "@firetable/types";
import { useI18n } from "vue-i18n";
import { useFirestoreCollection } from "src/composables/useFirestore.js";
import {
    addInventoryItem,
    deleteInventoryItem,
    getInventoryPath,
    updateInventoryItem,
} from "@firetable/backend";
import { Loading } from "quasar";
import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers.js";
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDialog } from "src/composables/useDialog.js";
import { AppLogger } from "src/logger/FTLogger.js";
import { omit } from "es-toolkit";
import { parseProductData } from "src/helpers/inventory/parse-product-data";

import FTTitle from "src/components/FTTitle.vue";
import BarcodeScanner from "src/components/admin/inventory/BarcodeScanner.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import InventoryTable from "src/components/admin/inventory/InventoryTable.vue";
import FTDialog from "src/components/FTDialog.vue";
import InventoryItemCreateForm from "src/components/admin/inventory/InventoryItemCreateForm.vue";

interface Props {
    organisationId: string;
    propertyId: string;
}

const { propertyId, organisationId } = defineProps<Props>();
const { t } = useI18n();
const { createDialog } = useDialog();
const router = useRouter();

const {
    data: inventoryData,
    promise: inventoryDataPromise,
    error: inventoryDataError,
    pending: isLoadingItems,
} = useFirestoreCollection<InventoryItemDoc>(getInventoryPath(organisationId, propertyId), {
    wait: true,
});

async function onInventoryItemCreateSubmit(
    inventoryItemPayload: CreateInventoryItemPayload,
): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await addInventoryItem(organisationId, propertyId, inventoryItemPayload);
        },
    }).catch(AppLogger.error.bind(AppLogger));
}

function showEditInventoryItemForm(item: InventoryItemDoc): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: InventoryItemCreateForm,
            componentPropsObject: {
                itemToEdit: omit(item, ["id"]),
            },
            maximized: false,
            title: t("PageAdminInventory.editInventoryItemDialogTitle", {
                name: item.name,
            }),
            listeners: {
                submit(updatedItem: CreateInventoryItemPayload) {
                    onInventoryItemEditSubmit(item.id, updatedItem);
                    dialog.hide();
                },
            },
        },
    });
}

function showCreateInventoryItemDialog(initialData = {}): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: InventoryItemCreateForm,
            componentPropsObject: {
                initialData,
            },
            maximized: false,
            title: t("PageAdminInventory.createNewInventoryItemDialogTitle"),
            listeners: {
                submit(inventoryItemPayload: CreateInventoryItemPayload) {
                    onInventoryItemCreateSubmit(inventoryItemPayload);
                    dialog.hide();
                },
            },
        },
    });
}

async function onInventoryItemEditSubmit(
    itemId: string,
    updatedItem: CreateInventoryItemPayload,
): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await updateInventoryItem(organisationId, propertyId, itemId, updatedItem);
        },
    }).catch(AppLogger.error.bind(AppLogger));
}

async function deleteItem(item: InventoryItemDoc): Promise<void> {
    if (
        !(await showConfirm(t("PageAdminInventory.deleteItemConfirmMessage", { name: item.name })))
    ) {
        return;
    }

    await tryCatchLoadingWrapper({
        async hook() {
            await deleteInventoryItem(organisationId, propertyId, item.id);
        },
    }).catch(AppLogger.error.bind(AppLogger));
}

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
        showErrorMessage(inventoryDataError, function () {
            router.replace("/");
        });
    }
}

function scanBarcode(): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: BarcodeScanner,
            maximized: false,
            title: t("PageAdminInventory.scanBarcodeDialogTitle"),
            listeners: {
                barcodeScanned(barcode: string) {
                    dialog.hide();
                    fetchProductDetails(barcode);
                },
            },
        },
    });
}

async function fetchProductDetails(barcode: string): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            const url = `https://world.openfoodfacts.net/api/v2/product/${barcode}.json`;
            const response = await fetch(url, {
                mode: "cors",
            });

            if (!response.ok) {
                throw new Error(
                    "There was an error fetching the product, please enter the details manually.",
                );
            }

            const { product, status } = await response.json();

            if (status !== 1) {
                throw new Error("Product not found, please enter the details manually.");
            }

            populateProductForm(product);
            AppLogger.info(product);
        },
        errorHook() {
            showCreateInventoryItemDialog();
        },
    });
}

function populateProductForm(product: Record<string, any>): void {
    showCreateInventoryItemDialog(parseProductData(product));
}

onMounted(init);
</script>

<template>
    <div class="PageAdminInventory">
        <FTTitle :title="t('PageAdminInventory.title')">
            <template #right>
                <q-btn
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="showCreateInventoryItemDialog"
                />
                <q-btn rounded icon="camera" @click="scanBarcode" />
            </template>
        </FTTitle>

        <FTCenteredText v-if="inventoryData.length === 0 && !isLoadingItems">
            {{ t("PageAdminInventory.noItemsMessage") }}
        </FTCenteredText>

        <div v-if="inventoryData.length > 0" class="q-mt-md">
            <InventoryTable
                :rows="inventoryData"
                @edit-item="showEditInventoryItemForm"
                @delete-item="deleteItem"
            />
        </div>
    </div>
</template>

<style scoped lang="scss"></style>
