<script setup lang="ts">
import type { DrinkCardItem, DrinkBundle } from "@firetable/types";
import { ref, computed, watch } from "vue";
import { noEmptyString } from "src/helpers/form-rules";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { formatPrice } from "src/helpers/drink-card/drink-card";
import { isNotNil } from "es-toolkit/predicate";

interface Props {
    availableItems: DrinkCardItem[];
    bundleToEdit: DrinkBundle | undefined;
}

interface Emits {
    (event: "update:show", value: boolean): void;
    (event: "submit" | "update", bundle: DrinkBundle): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isEditMode = computed(() => isNotNil(props.bundleToEdit));

const bundle = ref({
    name: "",
    description: "",
    price: 0,
    items: [] as { drinkCardItemId: string; quantity: number }[],
});

const availableItemOptions = computed(() => {
    return props.availableItems.map((item) => ({
        label: `${item.name} (${formatPrice(item.price)})`,
        value: item.inventoryItemId,
        item,
    }));
});

watch(
    () => props.bundleToEdit,
    function (newBundle) {
        if (newBundle) {
            bundle.value = {
                name: newBundle.name,
                description: newBundle.description ?? "",
                price: newBundle.price,
                items: [...newBundle.items],
            };
        }
    },
    { immediate: true },
);

function calculateRegularPrice(items: typeof bundle.value.items): number {
    return items.reduce((total, bundleItem) => {
        const item = availableItemOptions.value.find((i) => i.value === bundleItem.drinkCardItemId);
        return total + (item?.item.price ?? 0) * bundleItem.quantity;
    }, 0);
}

function calculateSavings(bundleData: typeof bundle.value): string {
    const regularPrice = calculateRegularPrice(bundleData.items);
    if (regularPrice === 0 || bundleData.price === 0) return "0";

    const savings = ((regularPrice - bundleData.price) / regularPrice) * 100;
    return savings.toFixed(1);
}

function addBundleItem(): void {
    bundle.value.items.push({
        drinkCardItemId: "",
        quantity: 1,
    });
}

function removeBundleItem(index: number): void {
    bundle.value.items.splice(index, 1);
}

function handleBundleSubmit(): void {
    if (!bundle.value.name || bundle.value.items.length === 0) {
        showErrorMessage("Please fill in all required fields");
        return;
    }

    const regularPrice = calculateRegularPrice(bundle.value.items);

    if (isEditMode && props.bundleToEdit) {
        // Update existing bundle
        const updatedBundle: DrinkBundle = {
            ...props.bundleToEdit,
            name: bundle.value.name,
            description: bundle.value.description,
            items: bundle.value.items,
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
            id: crypto.randomUUID(),
            name: bundle.value.name,
            type: "bundle",
            items: bundle.value.items,
            price: bundle.value.price,
            savings: {
                amount: regularPrice - bundle.value.price,
                percentage: Number.parseFloat(calculateSavings(bundle.value)),
            },
            description: bundle.value.description,
            isVisible: true,
            isHighlighted: true,
        };
        emit("submit", newBundle);
    }
    closeDialog();
}

function closeDialog(): void {
    emit("update:show", false);
    // Reset form
    bundle.value = {
        name: "",
        description: "",
        price: 0,
        items: [],
    };
}
</script>

<template>
    <div>
        <q-card-section class="q-gutter-y-md">
            <q-input
                v-model="bundle.name"
                label="Bundle Name"
                :rules="[noEmptyString('Name is required')]"
                standout
                rounded
            />

            <q-input
                v-model="bundle.description"
                label="Description (Optional)"
                type="textarea"
                standout
                rounded
            />

            <!-- Item Selection -->
            <div class="text-subtitle2 q-mb-sm">Bundle Items</div>
            <div v-for="(item, index) in bundle.items" :key="index" class="q-mb-md">
                <div class="row q-col-gutter-sm items-center">
                    <div class="col">
                        <q-select
                            v-model="item.drinkCardItemId"
                            :options="availableItemOptions"
                            label="Select Drink"
                            standout
                            rounded
                            :rules="[(val) => !!val || 'Please select a drink']"
                            emit-value
                            map-options
                        />
                    </div>
                    <div class="col-3">
                        <q-input
                            v-model.number="item.quantity"
                            type="number"
                            label="Qty"
                            standout
                            rounded
                            :rules="[(val) => val > 0 || 'Quantity must be greater than 0']"
                        />
                    </div>
                    <div class="col-auto">
                        <q-btn
                            flat
                            round
                            color="negative"
                            icon="close"
                            @click="removeBundleItem(index)"
                        />
                    </div>
                </div>
            </div>

            <div class="text-center">
                <q-btn flat icon="add" label="Add Item" @click="addBundleItem" />
            </div>

            <q-separator />

            <div class="row q-col-gutter-sm items-center">
                <div class="col">
                    <q-input
                        v-model.number="bundle.price"
                        type="number"
                        label="Bundle Price"
                        prefix="€"
                        standout
                        rounded
                        :rules="[
                            (val) => val > 0 || 'Price is required',
                            (val) =>
                                val < calculateRegularPrice(bundle.items) ||
                                'Bundle price should be lower than regular price',
                        ]"
                    />
                </div>
                <div class="col-auto">
                    <div class="text-positive" v-if="bundle.price > 0">
                        Save {{ calculateSavings(bundle) }}%
                    </div>
                </div>
            </div>
        </q-card-section>

        <q-card-actions align="right">
            <q-btn flat label="Cancel" @click="closeDialog" />
            <q-btn
                rounded
                class="button-gradient"
                :label="isEditMode ? 'Save Changes' : 'Create Bundle'"
                @click="handleBundleSubmit"
            />
        </q-card-actions>
    </div>
</template>
