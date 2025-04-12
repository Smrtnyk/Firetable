<script setup lang="ts">
import type { CreateInventoryItemPayload, InventoryItemDoc } from "@firetable/types";

import {
    addInventoryItem,
    deleteInventoryItem,
    getInventoryPath,
    updateInventoryItem,
} from "@firetable/backend";
import { DrinkMainCategory, RetailMainCategory } from "@firetable/types";
import { omit } from "es-toolkit";
import { Loading } from "quasar";
import InventoryImportDialog from "src/components/admin/inventory/InventoryImportDialog.vue";
import InventoryItemCreateForm from "src/components/admin/inventory/InventoryItemCreateForm.vue";
import InventoryTable from "src/components/admin/inventory/InventoryTable.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTTitle from "src/components/FTTitle.vue";
import { useDialog } from "src/composables/useDialog.js";
import { useFirestoreCollection } from "src/composables/useFirestore.js";
import { getEnumValues } from "src/helpers/get-enum-values";
import { exportInventory } from "src/helpers/inventory/export-inventory";
import { importInventory } from "src/helpers/inventory/import-inventory";
import {
    notifyPositive,
    showConfirm,
    showErrorMessage,
    tryCatchLoadingWrapper,
} from "src/helpers/ui-helpers.js";
import { AppLogger } from "src/logger/FTLogger.js";
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

interface Props {
    organisationId: string;
    propertyId: string;
}

const { organisationId, propertyId } = defineProps<Props>();
const { t } = useI18n();
const { createDialog } = useDialog();
const router = useRouter();

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

function getCategoryTitle(category: InventoryItemDoc["mainCategory"]): string {
    return t(`PageAdminInventory.itemMainCategory.${category}`);
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
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: InventoryItemCreateForm,
            componentPropsObject: {
                initialData,
            },
            listeners: {
                submit(inventoryItemPayload: CreateInventoryItemPayload) {
                    onInventoryItemCreateSubmit(inventoryItemPayload);
                    dialog.hide();
                },
            },
            maximized: false,
            title: t("PageAdminInventory.createNewInventoryItemDialogTitle"),
        },
    });
}

function showEditInventoryItemForm(item: InventoryItemDoc): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: InventoryItemCreateForm,
            componentPropsObject: {
                itemToEdit: omit(item, ["id"]),
            },
            listeners: {
                submit(updatedItem: CreateInventoryItemPayload) {
                    onInventoryItemEditSubmit(item.id, updatedItem);
                    dialog.hide();
                },
            },
            maximized: false,
            title: t("PageAdminInventory.editInventoryItemDialogTitle", {
                name: item.name,
            }),
        },
    });
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
            listeners: {
                async import(content: string) {
                    isLoading = true;
                    try {
                        Loading.show();
                        if (!inventoryData.value) {
                            throw new Error("Inventory data not available");
                        }

                        const result = await importInventory({
                            existingItems: inventoryData.value,
                            fileContent: content,
                            organisationId,
                            propertyId,
                        });

                        notifyPositive(
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
                        Loading.hide();
                        isLoading = false;
                    }
                },
            },
            maximized: false,
            title: "Import Inventory",
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
