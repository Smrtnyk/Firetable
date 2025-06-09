<script setup lang="ts">
import type { DrinkBundle, DrinkCardItem } from "@firetable/types";

import { isNotNil } from "es-toolkit/predicate";
import DrinkCardBuilderItemSelectionDialog from "src/components/admin/drink-cards/DrinkCardBuilderItemSelectionDialog.vue";
import FTBtn from "src/components/FTBtn.vue";
import { globalBottomSheet } from "src/composables/useBottomSheet";
import { globalDialog } from "src/composables/useDialog";
import { formatPrice } from "src/helpers/drink-card/drink-card";
import { greaterThanZero, noEmptyString, numberInRange } from "src/helpers/form-rules";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

interface Emits {
    (event: "update:show", value: boolean): void;
    (event: "submit" | "update", bundle: DrinkBundle): void;
}

interface Props {
    availableItems: DrinkCardItem[];
    bundleToEdit: DrinkBundle | undefined;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

const isEditMode = computed(() => isNotNil(props.bundleToEdit));

const bundle = ref({
    description: "",
    items: [] as DrinkBundle["items"],
    name: "",
    price: 0,
});

const availableItemOptions = computed(function () {
    return props.availableItems.map(function (item) {
        return {
            item,
            label: `${item.name} (${formatPrice(item.price)})`,
            value: item.inventoryItemId,
        };
    });
});

watch(
    () => props.bundleToEdit,
    function (newBundle) {
        if (newBundle) {
            bundle.value = {
                description: newBundle.description ?? "",
                items: [...newBundle.items],
                name: newBundle.name,
                price: newBundle.price,
            };
        }
    },
    { immediate: true },
);

function addBundleItem(): void {
    bundle.value.items.push({
        inventoryItemId: "",
        quantity: 1,
    });
}

function calculateRegularPrice(items: typeof bundle.value.items): number {
    return items.reduce(function (total, bundleItem) {
        const item = availableItemOptions.value.find(function (i) {
            return i.value === bundleItem.inventoryItemId;
        });
        return total + (item?.item.price ?? 0) * bundleItem.quantity;
    }, 0);
}

function calculateSavings(bundleData: typeof bundle.value): string {
    const regularPrice = calculateRegularPrice(bundleData.items);
    if (regularPrice === 0 || bundleData.price === 0 || regularPrice <= bundleData.price) {
        return "0";
    }

    const savings = ((regularPrice - bundleData.price) / regularPrice) * 100;
    return savings.toFixed(1);
}

function closeDialog(): void {
    emit("update:show", false);
    bundle.value = {
        description: "",
        items: [],
        name: "",
        price: 0,
    };
}

function getItemName(itemId: string): string {
    const item = props.availableItems.find(function ({ inventoryItemId }) {
        return inventoryItemId === itemId;
    });
    return item?.name ?? t("DrinkBundleDialog.unknownItemText");
}

function handleBundleSubmit(): void {
    if (!bundle.value.name || bundle.value.items.length === 0) {
        showErrorMessage(t("DrinkBundleDialog.fillRequiredFieldsError"));
        return;
    }

    const regularPrice = calculateRegularPrice(bundle.value.items);

    if (isEditMode && props.bundleToEdit) {
        // Update existing bundle
        const updatedBundle: DrinkBundle = {
            ...props.bundleToEdit,
            description: bundle.value.description,
            items: bundle.value.items,
            name: bundle.value.name,
            price: bundle.value.price,
            savings: {
                amount: regularPrice - bundle.value.price,
                percentage: Number.parseFloat(calculateSavings(bundle.value)),
            },
        };
        emit("update", updatedBundle);
    } else {
        // Create new bundle
        const newBundle: DrinkBundle = {
            description: bundle.value.description,
            id: crypto.randomUUID(),
            isHighlighted: true,
            isVisible: true,
            items: bundle.value.items,
            name: bundle.value.name,
            price: bundle.value.price,
            savings: {
                amount: regularPrice - bundle.value.price,
                percentage: Number.parseFloat(calculateSavings(bundle.value)),
            },
            type: "bundle",
        };
        emit("submit", newBundle);
    }
    closeDialog();
}

function handleItemSelect(selectedItem: DrinkCardItem, index: number): void {
    if (index !== null) {
        bundle.value.items[index].inventoryItemId = selectedItem.inventoryItemId;
    }
}

function openItemSelectionDialog(index: number): void {
    const dialog = globalBottomSheet.openBottomSheet(DrinkCardBuilderItemSelectionDialog, {
        inventoryItems: props.availableItems,
        // @ts-expect-error -- FIXME: inference error
        onSelect(selectedItem) {
            globalDialog.closeDialog(dialog);

            handleItemSelect(selectedItem, index);
        },
    });
}

async function removeBundleItem(index: number): Promise<void> {
    const confirmed = await globalDialog.confirm({
        title: t("DrinkBundleDialog.removeItemConfirmMsg"),
    });

    if (!confirmed) return;

    bundle.value.items.splice(index, 1);
}
</script>

<template>
    <div>
        <v-card-text class="d-flex flex-column" style="gap: 1.25rem">
            <v-text-field
                v-model="bundle.name"
                :label="t('DrinkBundleDialog.bundleNameLabel')"
                :rules="[noEmptyString(t('DrinkBundleDialog.nameIsRequiredError'))]"
                variant="outlined"
            />

            <v-textarea
                v-model="bundle.description"
                :label="t('DrinkBundleDialog.descriptionOptionalLabel')"
                variant="outlined"
                rows="3"
                auto-grow
            />

            <div class="text-subtitle-1 mb-2">
                {{ t("DrinkBundleDialog.bundleItemsLabel", { count: bundle.items.length }) }}
            </div>
            <div v-for="(item, index) in bundle.items" :key="index" class="mb-4">
                <v-row align="center">
                    <v-col>
                        <v-text-field
                            :label="t('DrinkBundleDialog.selectDrinkLabel')"
                            :model-value="getItemName(item.inventoryItemId)"
                            readonly
                            @click="openItemSelectionDialog(index)"
                            variant="outlined"
                            :rules="[noEmptyString(t('DrinkBundleDialog.pleaseSelectDrinkError'))]"
                            class="cursor-pointer"
                            hide-details
                        />
                    </v-col>
                    <v-col cols="3">
                        <v-text-field
                            v-model.number="item.quantity"
                            type="number"
                            :label="t('DrinkBundleDialog.qtyLabel')"
                            variant="outlined"
                            :rules="[
                                greaterThanZero(
                                    t('DrinkBundleDialog.quantityGreaterThanZeroError'),
                                ),
                            ]"
                            hide-details
                        />
                    </v-col>
                    <v-col cols="auto">
                        <v-btn
                            variant="text"
                            icon="fas fa-times"
                            color="error"
                            @click="removeBundleItem(index)"
                        />
                    </v-col>
                </v-row>
            </div>

            <div class="text-center">
                <FTBtn class="button-gradient" icon="fas fa-plus" rounded @click="addBundleItem" />
            </div>

            <v-divider />

            <v-row align="center">
                <v-col>
                    <v-text-field
                        v-model.number="bundle.price"
                        type="number"
                        :label="t('DrinkBundleDialog.bundlePriceLabel')"
                        prefix="€"
                        variant="outlined"
                        :rules="[
                            greaterThanZero(t('DrinkBundleDialog.priceGreaterThanZeroError')),
                            numberInRange(
                                0,
                                calculateRegularPrice(bundle.items),
                                t('DrinkBundleDialog.bundlePriceLowerThanRegularError'),
                            ),
                        ]"
                    />
                </v-col>
                <v-col cols="auto">
                    <div class="text-success" v-if="bundle.price > 0">
                        {{
                            t("DrinkBundleDialog.savePercentageText", {
                                percentage: calculateSavings(bundle),
                            })
                        }}
                    </div>
                </v-col>
            </v-row>
        </v-card-text>

        <v-card-actions class="pa-4">
            <v-btn variant="text" @click="closeDialog">{{
                t("DrinkBundleDialog.cancelButtonLabel")
            }}</v-btn>
            <v-spacer />
            <v-btn rounded="lg" class="button-gradient" @click="handleBundleSubmit" size="large">
                {{
                    isEditMode ? t("Global.submit") : t("DrinkBundleDialog.createBundleButtonLabel")
                }}
            </v-btn>
        </v-card-actions>
    </div>
</template>
