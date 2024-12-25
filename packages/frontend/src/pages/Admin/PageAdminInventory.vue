<script setup lang="ts">
import type { CreateInventoryItemPayload, InventoryItemDoc } from "@firetable/types";
import { DrinkMainCategory, RetailMainCategory } from "@firetable/types";
import { useI18n } from "vue-i18n";
import { useFirestoreCollection } from "src/composables/useFirestore.js";
import {
    addInventoryItem,
    deleteInventoryItem,
    getInventoryPath,
    updateInventoryItem,
} from "@firetable/backend";
import { Loading } from "quasar";
import {
    notifyPositive,
    showConfirm,
    showErrorMessage,
    tryCatchLoadingWrapper,
} from "src/helpers/ui-helpers.js";
import { onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useDialog } from "src/composables/useDialog.js";
import { AppLogger } from "src/logger/FTLogger.js";
import { omit } from "es-toolkit";
import { exportInventory } from "src/helpers/inventory/export-inventory";
import { importInventory } from "src/helpers/inventory/import-inventory";

import FTTitle from "src/components/FTTitle.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import InventoryTable from "src/components/admin/inventory/InventoryTable.vue";
import FTDialog from "src/components/FTDialog.vue";
import InventoryItemCreateForm from "src/components/admin/inventory/InventoryItemCreateForm.vue";
import FTBtn from "src/components/FTBtn.vue";
import InventoryImportDialog from "src/components/admin/inventory/InventoryImportDialog.vue";
import { getEnumValues } from "src/helpers/get-enum-values";

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

const drinkMainCategoryEnumValues = getEnumValues({ ...DrinkMainCategory, ...RetailMainCategory });

const categorizedInventory = computed(function () {
    if (!inventoryData.value) {
        return {};
    }

    return inventoryData.value.reduce<
        Partial<Record<DrinkMainCategory | RetailMainCategory, InventoryItemDoc[]>>
    >(function (acc, item) {
        if (!acc[item.mainCategory]) {
            acc[item.mainCategory] = [];
        }
        acc[item.mainCategory]?.push(item);
        return acc;
    }, {});
});

function getCategoryTitle(category: InventoryItemDoc["mainCategory"]): string {
    return t(`PageAdminInventory.itemMainCategory.${category}`);
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

async function handleItemCopy(item: InventoryItemDoc): Promise<void> {
    const copyConfirmed = await showConfirm(`Are you sure you want to copy ${item.name}?`);

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
            notifyPositive(`Copied ${item.name}`);
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

async function handleBulkDelete(items: InventoryItemDoc[]): Promise<void> {
    if (
        !(await showConfirm(
            t("PageAdminInventory.bulkDeleteConfirmMessage", {
                count: items.length,
            }),
        ))
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
            notifyPositive(
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
        notifyPositive("Inventory exported successfully!");
    } catch (error) {
        AppLogger.error(error);
        showErrorMessage("Failed to export inventory items!");
    }
}

function showImportDialog(): void {
    let isLoading = false;

    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: InventoryImportDialog,
            componentPropsObject: {
                loading: isLoading,
            },
            maximized: false,
            title: "Import Inventory",
            listeners: {
                async import(content: string) {
                    isLoading = true;
                    try {
                        Loading.show();
                        if (!inventoryData.value) {
                            throw new Error("Inventory data not available");
                        }

                        const result = await importInventory({
                            fileContent: content,
                            existingItems: inventoryData.value,
                            organisationId,
                            propertyId,
                        });

                        notifyPositive(
                            t("PageAdminInventory.importMergeSuccess", {
                                updated: result.updatedCount,
                                added: result.newCount,
                            }),
                        );
                        dialog.hide();
                    } catch (error) {
                        AppLogger.error(error);
                        showErrorMessage(t("PageAdminInventory.importError"));
                    } finally {
                        Loading.hide();
                        isLoading = false;
                    }
                },
            },
        },
    });
}

onMounted(init);
</script>

<template>
    <div class="PageAdminInventory q-pa-xs-xs q-pa-sm-xs q-pa-md-md">
        <FTTitle :title="t('PageAdminInventory.title')">
            <template #right>
                <div class="row q-gutter-sm">
                    <FTBtn
                        rounded
                        icon="download"
                        class="button-gradient"
                        @click="handleExport"
                        :disable="!inventoryData?.length"
                    />
                    <FTBtn
                        rounded
                        icon="import"
                        class="button-gradient"
                        @click="showImportDialog"
                    />
                    <FTBtn
                        rounded
                        icon="plus"
                        class="button-gradient"
                        @click="showCreateInventoryItemDialog()"
                    />
                </div>
            </template>
        </FTTitle>

        <FTCenteredText v-if="inventoryData.length === 0 && !isLoadingItems">
            {{ t("PageAdminInventory.noItemsMessage") }}
        </FTCenteredText>

        <div v-if="inventoryData.length > 0" class="q-mt-md">
            <div v-for="category in drinkMainCategoryEnumValues" :key="category" class="q-mb-xl">
                <InventoryTable
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
