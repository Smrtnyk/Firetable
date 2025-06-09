<script setup lang="ts">
import type { CreateInventoryItemPayload } from "@firetable/types";
import type { VForm } from "vuetify/components";

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
const formRef = useTemplateRef<VForm>("formRef");
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
        isActive: true,
        mainCategory: DrinkMainCategory.SPIRITS,
        name: "",
        quantity: 0,
        subCategory: SpiritSubCategory.VODKA,
        supplier: "",
        type: InventoryItemType.DRINK,
        ...props.initialData,
    };
}

function onMainCategoryChange(): void {
    // Reset subCategory when mainCategory changes
    form.value.subCategory = subCategoryOptions.value[0];
}

function onReset(): void {
    form.value = { ...getInitialForm() };
    formRef.value?.resetValidation();
}

async function onSubmit(): Promise<void> {
    const { valid } = (await formRef.value?.validate()) ?? { valid: false };
    if (!valid) {
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
    <div class="inventory-item-create-form">
        <v-form
            ref="formRef"
            class="pa-4 d-flex flex-column"
            style="gap: 1rem"
            greedy
            @submit.prevent="onSubmit"
        >
            <v-text-field v-model="form.name" label="Name" variant="outlined" :rules="nameRules" />

            <v-select
                v-model="form.type"
                :items="typeOptions"
                label="Type"
                variant="outlined"
                :rules="typeRules"
            />

            <v-select
                v-model="form.mainCategory"
                :items="mainCategoryOptions"
                label="Main Category"
                variant="outlined"
                @update:model-value="onMainCategoryChange"
                :rules="mainCategoryRules"
            />

            <v-select
                v-model="form.subCategory"
                :items="subCategoryOptions"
                label="Sub Category"
                variant="outlined"
                :rules="subCategoryRules"
            />

            <v-text-field v-model="form.brand" label="Brand" variant="outlined" />

            <v-text-field v-model="form.style" label="Style" variant="outlined" />

            <v-text-field v-model="form.region" label="Region" variant="outlined" />

            <v-text-field
                v-model.number="form.quantity"
                label="Quantity"
                type="number"
                variant="outlined"
                :rules="quantityRules"
            />

            <v-text-field
                v-if="isDrinkItem(form)"
                v-model.number="form.alcoholContent"
                label="Alcohol Content (%)"
                type="number"
                variant="outlined"
                :rules="alcoholContentRules"
            />

            <v-text-field
                v-if="isDrinkItem(form)"
                v-model.number="form.volume"
                label="Volume (ml)"
                type="number"
                variant="outlined"
                :rules="volumeRules"
            />

            <v-text-field v-model="form.supplier" label="Supplier" variant="outlined" />

            <v-switch
                v-model="form.isActive as boolean"
                label="Active"
                color="primary"
                hide-details
            />

            <v-textarea v-model="form.description" label="Description" variant="outlined" />

            <div class="d-flex" style="gap: 8px">
                <v-btn rounded="lg" class="button-gradient" size="large" @click="onSubmit">
                    {{ t("Global.submit") }}
                </v-btn>
                <v-btn
                    rounded="lg"
                    size="large"
                    variant="outlined"
                    color="primary"
                    @click="onReset"
                >
                    {{ t("Global.reset") }}
                </v-btn>
            </div>
        </v-form>
    </div>
</template>
