<script setup lang="ts">
import type { CreateInventoryItemPayload } from "@firetable/types";

import {
    BeerSubCategory,
    CocktailComponentCategory,
    DrinkMainCategory,
    InventoryItemType,
    isDrinkItem,
    isRetailItem,
    NonAlcoholicCategory,
    RetailMainCategory,
    SpiritSubCategory,
    TobaccoSubCategory,
    WineSubCategory,
} from "@firetable/types";
import { QForm } from "quasar";
import { noEmptyString, noNegativeNumber, optionalNumberInRange } from "src/helpers/form-rules";
import { getEnumValues } from "src/helpers/get-enum-values";
import { computed, ref, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";

export interface InventoryItemCreateFormProps {
    initialData?: CreateInventoryItemPayload | undefined;
    itemToEdit?: CreateInventoryItemPayload;
}

const { t } = useI18n();
const props = defineProps<InventoryItemCreateFormProps>();
const formRef = useTemplateRef<QForm>("formRef");
const form = ref<CreateInventoryItemPayload>(getInitialForm());
const emit = defineEmits<(e: "submit", item: CreateInventoryItemPayload) => void>();

const typeOptions = getEnumValues(InventoryItemType);

const mainCategoryOptions = computed(function () {
    if (isDrinkItem(form.value)) {
        return getEnumValues(DrinkMainCategory);
    }

    if (isRetailItem(form.value)) {
        return getEnumValues(RetailMainCategory);
    }

    return [];
});

const subCategoryOptions = computed(function () {
    if (form.value.type === InventoryItemType.DRINK) {
        switch (form.value.mainCategory) {
            case DrinkMainCategory.BEER:
                return getEnumValues(BeerSubCategory);
            case DrinkMainCategory.COCKTAIL_COMPONENTS:
                return getEnumValues(CocktailComponentCategory);
            case DrinkMainCategory.NON_ALCOHOLIC:
                return getEnumValues(NonAlcoholicCategory);
            case DrinkMainCategory.SPIRITS:
                return getEnumValues(SpiritSubCategory);
            case DrinkMainCategory.WINE:
                return getEnumValues(WineSubCategory);
            default:
                return [];
        }
    }

    if (form.value.type === InventoryItemType.RETAIL) {
        if (form.value.mainCategory === RetailMainCategory.TOBACCO) {
            return getEnumValues(TobaccoSubCategory);
        }
        return [];
    }
    return [];
});

const nameRules = [noEmptyString(t("validation.nameRequired"))];
const typeRules = [noEmptyString(t("validation.typeRequired"))];
const mainCategoryRules = [noEmptyString(t("InventoryItemCreateForm.mainCategoryRequired"))];
const subCategoryRules = [noEmptyString(t("InventoryItemCreateForm.subCategoryRequired"))];
const quantityRules = [noNegativeNumber(t("InventoryItemCreateForm.quantityNonNegative"))];
const alcoholContentRules = [
    optionalNumberInRange(0, 100, t("InventoryItemCreateForm.alcoholContentRange")),
];
const volumeRules = [noNegativeNumber(t("InventoryItemCreateForm.volumePositive"))];

watch(
    () => form.value.type,
    function (newType) {
        if (newType === InventoryItemType.DRINK) {
            form.value.mainCategory = DrinkMainCategory.SPIRITS;
        }
        if (newType === InventoryItemType.RETAIL) {
            form.value.mainCategory = RetailMainCategory.TOBACCO;
        }

        onMainCategoryChange();
    },
);

function getInitialForm(): CreateInventoryItemPayload {
    if (props.itemToEdit) {
        return { ...props.itemToEdit };
    }
    return {
        brand: "",
        customProperties: {},
        description: "",
        isActive: true,
        mainCategory: DrinkMainCategory.SPIRITS,
        name: "",
        quantity: 0,
        region: "",
        style: null,
        subCategory: SpiritSubCategory.VODKA,
        supplier: "",
        type: InventoryItemType.DRINK,
        volume: null,
        ...props.initialData,
    };
}

function onMainCategoryChange(): void {
    // Reset subCategory when mainCategory changes
    form.value.subCategory = subCategoryOptions.value[0];
}

function onReset(): void {
    form.value = { ...getInitialForm() };
}

async function onSubmit(): Promise<void> {
    if (!(await formRef.value?.validate())) {
        return;
    }

    emit("submit", form.value);
    onReset();
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
            <q-input v-model="form.name" label="Name" outlined required :rules="nameRules" />

            <q-select
                v-model="form.type"
                :options="typeOptions"
                label="Type"
                outlined
                required
                emit-value
                :rules="typeRules"
            />

            <q-select
                v-model="form.mainCategory"
                :options="mainCategoryOptions"
                label="Main Category"
                outlined
                required
                emit-value
                @update:model-value="onMainCategoryChange"
                :rules="mainCategoryRules"
            />

            <q-select
                v-model="form.subCategory"
                :options="subCategoryOptions"
                label="Sub Category"
                outlined
                required
                emit-value
                :rules="subCategoryRules"
            />

            <q-input v-model="form.brand" label="Brand" outlined />

            <q-input v-model="form.style" label="Style" outlined />

            <q-input v-model="form.region" label="Region" outlined />

            <q-input
                v-model.number="form.quantity"
                label="Quantity"
                type="number"
                outlined
                required
                :rules="quantityRules"
            />

            <q-input
                v-if="isDrinkItem(form)"
                v-model.number="form.alcoholContent"
                label="Alcohol Content (%)"
                type="number"
                outlined
                :rules="alcoholContentRules"
            />

            <q-input
                v-if="isDrinkItem(form)"
                v-model.number="form.volume"
                label="Volume (ml)"
                type="number"
                outlined
                :rules="volumeRules"
            />

            <q-input v-model="form.supplier" label="Supplier" outlined />

            <q-toggle v-model="form.isActive" label="Active" />

            <q-input v-model="form.description" label="Description" type="textarea" outlined />

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
