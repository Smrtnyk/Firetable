<script setup lang="ts">
import type { CreateInventoryItemPayload } from "@firetable/types";
import { DrinkCategory, InventoryItemType } from "@firetable/types";
import { computed, ref, useTemplateRef, watch } from "vue";
import { QForm } from "quasar";
import { useI18n } from "vue-i18n";

export interface InventoryItemCreateFormProps {
    itemToEdit?: CreateInventoryItemPayload;
    initialData?: CreateInventoryItemPayload | undefined;
}

const { t } = useI18n();
const props = defineProps<InventoryItemCreateFormProps>();
const formRef = useTemplateRef<QForm>("formRef");
const form = ref<CreateInventoryItemPayload>(getInitialForm());
const typeOptions = [InventoryItemType.DRINK];
const emit = defineEmits<(e: "submit", item: CreateInventoryItemPayload) => void>();
const isDrinkType = computed(function () {
    return form.value.type === InventoryItemType.DRINK;
});

function getInitialForm(): CreateInventoryItemPayload {
    if (props.itemToEdit) {
        return { ...props.itemToEdit };
    }
    return {
        name: "",
        type: InventoryItemType.DRINK,
        category: DrinkCategory.SPIRIT,
        price: 0,
        quantity: 0,
        supplier: "",
        ...props.initialData,
    };
}

async function onSubmit(): Promise<void> {
    if (!(await formRef.value?.validate())) {
        return;
    }

    emit("submit", form.value);

    onReset();
}

function onReset(): void {
    form.value = { ...getInitialForm() };
}

watch(
    () => props.itemToEdit,
    function () {
        form.value = { ...getInitialForm() };
    },
);
</script>

<template>
    <div class="InventoryItemCreateForm">
        <q-form greedy class="q-gutter-md q-pt-md q-pa-md" ref="formRef">
            <!-- Name -->
            <q-input
                v-model="form.name"
                label="Name"
                standout
                rounded
                required
                :rules="[(val) => !!val || 'Name is required']"
                aria-label="Name"
            />

            <!-- Type -->
            <q-select
                v-model="form.type"
                :options="typeOptions"
                emit-value
                label="Type"
                standout
                rounded
                required
                :rules="[(val) => !!val || 'Type is required']"
                aria-label="Type"
            />

            <!-- Category -->
            <q-input
                v-model="form.category"
                label="Category"
                standout
                rounded
                aria-label="Category"
            />

            <!-- Price -->
            <q-input
                v-model.number="form.price"
                label="Price"
                type="number"
                standout
                rounded
                required
                :rules="[(val) => val > 0 || 'Price must be positive']"
                aria-label="Price"
            />

            <!-- Quantity -->
            <q-input
                v-model.number="form.quantity"
                label="Quantity"
                type="number"
                standout
                rounded
                required
                :rules="[(val) => val > 0 || 'Quantity must be positive']"
                aria-label="Quantity"
            />

            <!-- Alcohol Content (only for drinks) -->
            <q-input
                v-if="isDrinkType"
                v-model.number="form.alcoholContent"
                label="Alcohol Content (%)"
                type="number"
                standout
                rounded
                :rules="[
                    (val) =>
                        val === undefined ||
                        (val >= 0 && val <= 100) ||
                        'Must be between 0 and 100',
                ]"
                aria-label="Alcohol Content"
            />

            <!-- Volume (only for drinks) -->
            <q-input
                v-if="isDrinkType"
                v-model.number="form.volume"
                label="Volume (ml)"
                type="number"
                standout
                rounded
                :rules="[(val) => val === undefined || val >= 0 || 'Volume must be positive']"
                aria-label="Volume"
            />

            <q-input
                v-model="form.supplier"
                label="Supplier"
                standout
                rounded
                aria-label="Supplier"
            />

            <!-- Buttons -->
            <div class="row q-gutter-md">
                <q-btn
                    rounded
                    class="button-gradient"
                    size="md"
                    :label="t('Global.submit')"
                    @click="onSubmit"
                />
                <q-btn
                    rounded
                    size="md"
                    outline
                    :label="t('Global.reset')"
                    type="reset"
                    color="primary"
                    class="q-ml-sm"
                    @click="onReset"
                />
            </div>
        </q-form>
    </div>
</template>
