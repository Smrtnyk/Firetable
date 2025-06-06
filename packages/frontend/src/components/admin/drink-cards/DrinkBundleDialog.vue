<script setup lang="ts">
import type { DrinkBundle, DrinkCardItem } from "@firetable/types";

import { isNotNil } from "es-toolkit/predicate";
import DrinkCardBuilderItemSelectionDialog from "src/components/admin/drink-cards/DrinkCardBuilderItemSelectionDialog.vue";
import FTBottomDialog from "src/components/FTBottomDialog.vue";
import FTBtn from "src/components/FTBtn.vue";
import { useDialog } from "src/composables/useDialog";
import { formatPrice } from "src/helpers/drink-card/drink-card";
import { greaterThanZero, noEmptyString, numberInRange } from "src/helpers/form-rules";
import { showConfirm, showErrorMessage } from "src/helpers/ui-helpers";
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

const { createDialog } = useDialog();
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
    if (regularPrice === 0 || bundleData.price === 0) {
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
    return item?.name ?? t('DrinkBundleDialog.unknownItemText');
}

function handleBundleSubmit(): void {
    if (!bundle.value.name || bundle.value.items.length === 0) {
        showErrorMessage(t('DrinkBundleDialog.fillRequiredFieldsError'));
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
    const dialog = createDialog({
        component: FTBottomDialog,
        componentProps: {
            component: DrinkCardBuilderItemSelectionDialog,
            componentPropsObject: {
                inventoryItems: props.availableItems,
            },
            listeners: {
                select(selectedItem) {
                    dialog.hide();

                    handleItemSelect(selectedItem, index);
                },
            },
        },
    });
}

async function removeBundleItem(index: number): Promise<void> {
    const confirmed = await showConfirm(t('DrinkBundleDialog.removeItemConfirmMsg'));

    if (!confirmed) return;

    bundle.value.items.splice(index, 1);
}
</script>

<template>
    <div>
        <q-card-section class="q-gutter-y-md">
            <q-input
                v-model="bundle.name"
                :label="t('DrinkBundleDialog.bundleNameLabel')"
                :rules="[noEmptyString(t('DrinkBundleDialog.nameIsRequiredError'))]"
                standout
                rounded
            />

            <q-input
                v-model="bundle.description"
                :label="t('DrinkBundleDialog.descriptionOptionalLabel')"
                type="textarea"
                standout
                rounded
            />

            <!-- Item Selection -->
            <div class="text-subtitle2 q-mb-sm">{{ t('DrinkBundleDialog.bundleItemsLabel', { count: bundle.items.length }) }}</div>
            <div v-for="(item, index) in bundle.items" :key="index" class="q-mb-md">
                <div class="row q-col-gutter-sm items-center">
                    <div class="col">
                        <q-input
                            :label="t('DrinkBundleDialog.selectDrinkLabel')"
                            :model-value="getItemName(item.inventoryItemId)"
                            readonly
                            @click="openItemSelectionDialog(index)"
                            standout
                            rounded
                            :rules="[noEmptyString(t('DrinkBundleDialog.pleaseSelectDrinkError'))]"
                            class="cursor-pointer"
                        />
                    </div>
                    <div class="col-3">
                        <q-input
                            v-model.number="item.quantity"
                            type="number"
                            :label="t('DrinkBundleDialog.qtyLabel')"
                            standout
                            rounded
                            :rules="[greaterThanZero(t('DrinkBundleDialog.quantityGreaterThanZeroError'))]"
                        />
                    </div>
                    <div class="col-auto">
                        <q-btn
                            flat
                            round
                            color="negative"
                            icon="fa fa-close"
                            @click="removeBundleItem(index)"
                        />
                    </div>
                </div>
            </div>

            <div class="text-center">
                <FTBtn class="button-gradient" icon="fa fa-plus" rounded @click="addBundleItem" />
            </div>

            <q-separator />

            <div class="row q-col-gutter-sm items-center">
                <div class="col">
                    <q-input
                        v-model.number="bundle.price"
                        type="number"
                        :label="t('DrinkBundleDialog.bundlePriceLabel')"
                        prefix="€"
                        standout
                        rounded
                        :rules="[
                            greaterThanZero(t('DrinkBundleDialog.priceGreaterThanZeroError')),
                            numberInRange(
                                0,
                                calculateRegularPrice(bundle.items),
                                t('DrinkBundleDialog.bundlePriceLowerThanRegularError'),
                            ),
                        ]"
                    />
                </div>
                <div class="col-auto">
                    <div class="text-positive" v-if="bundle.price > 0">
                        {{ t('DrinkBundleDialog.savePercentageText', { percentage: calculateSavings(bundle) }) }}
                    </div>
                </div>
            </div>
        </q-card-section>

        <q-card-actions align="right">
            <q-btn flat :label="t('DrinkBundleDialog.cancelButtonLabel')" @click="closeDialog" />
            <q-btn
                rounded
                class="button-gradient"
                :label="isEditMode ? t('Global.submit') : t('DrinkBundleDialog.createBundleButtonLabel')"
                @click="handleBundleSubmit"
            />
        </q-card-actions>
    </div>
</template>
