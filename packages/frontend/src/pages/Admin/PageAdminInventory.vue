<script setup lang="ts">
import type { CreateInventoryItemPayload, InventoryItemDoc } from "@firetable/types";
import { InventoryItemType } from "@firetable/types";
import FTTitle from "src/components/FTTitle.vue";
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
import FTDialog from "src/components/FTDialog.vue";
import InventoryItemCreateForm from "src/components/inventory/InventoryItemCreateForm.vue";
import { useDialog } from "src/composables/useDialog.js";
import { AppLogger } from "src/logger/FTLogger.js";
import { omit } from "es-toolkit";

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
                itemToEdit: omit(item, ["id", "_doc"]),
            },
            maximized: false,
            title: t("PageAdminInventory.editInventoryItemDialogTitle"),
            listeners: {
                submit(updatedItem: CreateInventoryItemPayload) {
                    onInventoryItemEditSubmit(item.id, updatedItem);
                    dialog.hide();
                },
            },
        },
    });
}

function showCreateInventoryItemDialog(): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: InventoryItemCreateForm,
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
    if (!(await showConfirm(t("PageAdminInventory.deleteItemConfirmMessage")))) {
        return;
    }

    await tryCatchLoadingWrapper({
        async hook() {
            await deleteInventoryItem(organisationId, propertyId, item.id);
        },
    }).catch(AppLogger.error.bind(AppLogger));
}

function getTypeLabel(type: InventoryItemType): string {
    switch (type) {
        case InventoryItemType.DRINK:
            return "Drink";
        case InventoryItemType.FOOD:
            return "Food";
        case InventoryItemType.OTHER:
            return "Other";
        default:
            return type;
    }
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
            </template>
        </FTTitle>

        <!-- Inventory Table -->
        <div v-if="inventoryData.length > 0" class="q-mt-md">
            <div class="row q-col-gutter-md q-mt-md">
                <div
                    class="col-xs-12 col-sm-6 col-md-4"
                    v-for="item in inventoryData"
                    :key="item.id"
                >
                    <q-card>
                        <q-card-section>
                            <div class="text-h6">{{ item.name }}</div>
                            <div>{{ getTypeLabel(item.type) }}</div>
                            <div>{{ item.category }}</div>
                        </q-card-section>
                        <q-card-section>
                            <div>Price: ${{ item.price.toFixed(2) }}</div>
                            <div>Quantity: {{ item.quantity }}</div>
                            <div>Unit: {{ item.unit }}</div>
                        </q-card-section>
                        <q-card-actions align="right">
                            <q-btn flat icon="pencil" @click="showEditInventoryItemForm(item)" />
                            <q-btn flat icon="trash" color="negative" @click="deleteItem(item)" />
                        </q-card-actions>
                    </q-card>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss"></style>
