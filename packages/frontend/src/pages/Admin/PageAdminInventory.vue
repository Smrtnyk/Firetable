<script setup lang="ts">
import type { CreateInventoryItemPayload, InventoryItemDoc } from "@firetable/types";

import { DrinkMainCategory, RetailMainCategory } from "@firetable/types";
import { omit } from "es-toolkit";
import InventoryImportDialog from "src/components/admin/inventory/InventoryImportDialog.vue";
import InventoryItemCreateForm from "src/components/admin/inventory/InventoryItemCreateForm.vue";
import InventoryTable from "src/components/admin/inventory/InventoryTable.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTTitle from "src/components/FTTitle.vue";
import { globalDialog } from "src/composables/useDialog";
import { useFirestoreCollection } from "src/composables/useFirestore.js";
import {
    addInventoryItem,
    deleteInventoryItem,
    getInventoryPath,
    updateInventoryItem,
} from "src/db";
import { getEnumValues } from "src/helpers/get-enum-values";
import { exportInventory } from "src/helpers/inventory/export-inventory";
import { importInventory } from "src/helpers/inventory/import-inventory";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers.js";
import { AppLogger } from "src/logger/FTLogger.js";
import { useGlobalStore } from "src/stores/global-store";
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

interface Props {
    organisationId: string;
    propertyId: string;
}

const { organisationId, propertyId } = defineProps<Props>();
const { t } = useI18n();
const router = useRouter();
const globalStore = useGlobalStore();

const {
    data: inventoryData,
    error: inventoryDataError,
    pending: isLoadingItems,
    promise: inventoryDataPromise,
} = useFirestoreCollection<InventoryItemDoc>(getInventoryPath(organisationId, propertyId), {
    wait: true,
});

const drinkMainCategoryEnumValues = getEnumValues({ ...DrinkMainCategory, ...RetailMainCategory });

const categorizedInventory = computed(function () {
    if (!inventoryData.value) {
        return {};
    }

    return inventoryData.value.reduce<
        Partial<Record<DrinkMainCategory | RetailMainCategory, InventoryItemDoc[]>>
    >(function (acc, item) {
        acc[item.mainCategory] ??= [];
        acc[item.mainCategory]?.push(item);
        return acc;
    }, {});
});

async function deleteItem(item: InventoryItemDoc): Promise<void> {
    if (
        !(await globalDialog.confirm({
            message: "",
            title: t("PageAdminInventory.deleteItemConfirmMessage", { name: item.name }),
        }))
    ) {
        return;
    }

    await tryCatchLoadingWrapper({
        async hook() {
            await deleteInventoryItem(organisationId, propertyId, item.id);
        },
    }).catch(AppLogger.error.bind(AppLogger));
}

// i18n-scan: "PageAdminInventory.itemMainCategory.beer"
// i18n-scan: "PageAdminInventory.itemMainCategory.wine"
// i18n-scan: "PageAdminInventory.itemMainCategory.spirits"
// i18n-scan: "PageAdminInventory.itemMainCategory.cocktail-components"
// i18n-scan: "PageAdminInventory.itemMainCategory.non-alcoholic"
// i18n-scan: "PageAdminInventory.itemMainCategory.tobacco"
function getCategoryTitle(category: InventoryItemDoc["mainCategory"]): string {
    return t(`PageAdminInventory.itemMainCategory.${category}`);
}

async function handleBulkDelete(items: InventoryItemDoc[]): Promise<void> {
    if (
        !(await globalDialog.confirm({
            message: "",
            title: t("PageAdminInventory.bulkDeleteConfirmMessage", {
                count: items.length,
            }),
        }))
    ) {
        return;
    }

    await tryCatchLoadingWrapper({
        async hook() {
            await Promise.all(
                items.map(function (item) {
                    return deleteInventoryItem(organisationId, propertyId, item.id);
                }),
            );
            globalStore.notify(
                t("PageAdminInventory.bulkDeleteSuccess", {
                    count: items.length,
                }),
            );
        },
    }).catch(AppLogger.error.bind(AppLogger));
}

function handleExport(): void {
    if (!inventoryData.value?.length) {
        showErrorMessage("There are no items to export!");
        return;
    }

    try {
        exportInventory(inventoryData.value);
        globalStore.notify("Inventory exported successfully!");
    } catch (error) {
        AppLogger.error(error);
        showErrorMessage("Failed to export inventory items!");
    }
}

async function handleItemCopy(item: InventoryItemDoc): Promise<void> {
    const copyConfirmed = await globalDialog.confirm({
        message: "",
        title: `Are you sure you want to copy ${item.name}?`,
    });

    if (!copyConfirmed) {
        return;
    }

    await tryCatchLoadingWrapper({
        async hook() {
            // omitting id and modifying name
            const newItem: CreateInventoryItemPayload = {
                ...omit(item, ["id"]),
                name: `${item.name}_copy`,
                quantity: 0,
            };

            await addInventoryItem(organisationId, propertyId, newItem);
            globalStore.notify(`Copied ${item.name}`);
        },
    }).catch(AppLogger.error.bind(AppLogger));
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
        showErrorMessage(inventoryDataError, function () {
            router.replace("/");
        });
    }
}

async function onInventoryItemCreateSubmit(
    inventoryItemPayload: CreateInventoryItemPayload,
): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await addInventoryItem(organisationId, propertyId, inventoryItemPayload);
        },
    }).catch(AppLogger.error.bind(AppLogger));
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

function showCreateInventoryItemDialog(initialData?: CreateInventoryItemPayload): void {
    const dialog = globalDialog.openDialog(
        InventoryItemCreateForm,
        {
            initialData,
            onSubmit(inventoryItemPayload: CreateInventoryItemPayload) {
                onInventoryItemCreateSubmit(inventoryItemPayload);
                dialog.hide();
            },
        },
        {
            title: t("PageAdminInventory.createNewInventoryItemDialogTitle"),
        },
    );
}

function showEditInventoryItemForm(item: InventoryItemDoc): void {
    const dialog = globalDialog.openDialog(
        InventoryItemCreateForm,
        {
            itemToEdit: omit(item, ["id"]),
            onSubmit(updatedItem: CreateInventoryItemPayload) {
                onInventoryItemEditSubmit(item.id, updatedItem);
                dialog.hide();
            },
        },
        {
            title: t("PageAdminInventory.editInventoryItemDialogTitle", {
                name: item.name,
            }),
        },
    );
}

function showImportDialog(): void {
    let isLoading = false;

    const dialog = globalDialog.openDialog(
        InventoryImportDialog,
        {
            loading: isLoading,
            async onImport(content: string) {
                isLoading = true;
                try {
                    globalStore.setLoading(true);
                    if (!inventoryData.value) {
                        throw new Error("Inventory data not available");
                    }

                    const result = await importInventory({
                        existingItems: inventoryData.value,
                        fileContent: content,
                        organisationId,
                        propertyId,
                    });

                    globalStore.notify(
                        t("PageAdminInventory.importMergeSuccess", {
                            added: result.newCount,
                            updated: result.updatedCount,
                        }),
                    );
                    dialog.hide();
                } catch (error) {
                    AppLogger.error(error);
                    showErrorMessage(t("PageAdminInventory.importError"));
                } finally {
                    globalStore.setLoading(false);
                    isLoading = false;
                }
            },
        },
        {
            title: "Import Inventory",
        },
    );
}

onMounted(init);
</script>

<template>
    <div class="PageAdminInventory pa-1 pa-sm-1 pa-md-4">
        <FTTitle :title="t('PageAdminInventory.title')">
            <template #right>
                <div class="d-flex" style="gap: 8px">
                    <FTBtn
                        rounded
                        icon="fas fa-download"
                        color="primary"
                        @click="handleExport"
                        :disabled="!inventoryData?.length"
                    />
                    <FTBtn
                        rounded
                        icon="fas fa-file-import"
                        color="primary"
                        @click="showImportDialog"
                    />
                    <FTBtn
                        rounded
                        icon="fas fa-plus"
                        color="primary"
                        @click="showCreateInventoryItemDialog()"
                    />
                </div>
            </template>
        </FTTitle>

        <FTCenteredText v-if="inventoryData && inventoryData.length === 0 && !isLoadingItems">
            {{ t("PageAdminInventory.noItemsMessage") }}
        </FTCenteredText>

        <div v-if="inventoryData && inventoryData.length > 0" class="mt-4">
            <div v-for="category in drinkMainCategoryEnumValues" :key="category" class="mb-16">
                <InventoryTable
                    v-if="
                        categorizedInventory[category] && categorizedInventory[category].length > 0
                    "
                    :title="getCategoryTitle(category)"
                    :rows="categorizedInventory[category] ?? []"
                    @edit-item="showEditInventoryItemForm"
                    @copy-item="handleItemCopy"
                    @delete-item="deleteItem"
                    @bulk-delete="handleBulkDelete"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.PageAdminInventory {
    width: 100%;
}
</style>
