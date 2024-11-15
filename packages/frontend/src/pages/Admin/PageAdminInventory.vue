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

import FTTitle from "src/components/FTTitle.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import InventoryTable from "src/components/admin/inventory/InventoryTable.vue";
import FTDialog from "src/components/FTDialog.vue";
import InventoryItemCreateForm from "src/components/admin/inventory/InventoryItemCreateForm.vue";
import FTBtn from "src/components/FTBtn.vue";

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

function showCreateInventoryItemDialog(initialData?: CreateInventoryItemPayload): void {
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

onMounted(init);
</script>

<template>
    <div class="PageAdminInventory">
        <FTTitle :title="t('PageAdminInventory.title')">
            <template #right>
                <FTBtn
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="showCreateInventoryItemDialog()"
                />
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
