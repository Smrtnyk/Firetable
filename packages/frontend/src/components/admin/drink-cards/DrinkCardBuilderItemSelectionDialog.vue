<script setup lang="ts">
import type { DrinkCardItem, InventoryItemDoc } from "@firetable/types";

import { uniq } from "es-toolkit";
import { property } from "es-toolkit/compat";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

interface Emits {
    (event: "update:modelValue", value: boolean): void;
    (event: "select", item: DrinkCardItem | InventoryItemDoc): void;
}

interface Props {
    inventoryItems: (DrinkCardItem | InventoryItemDoc)[];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const searchQuery = ref("");
const selectedCategories = ref<string[]>([]);

const categories = computed(function () {
    const mainCategories = props.inventoryItems.map(property("mainCategory"));
    return uniq(mainCategories);
});

const filteredItems = computed(function () {
    const query = searchQuery.value.toLowerCase().trim();
    const categoriesSelected = selectedCategories.value.length > 0;

    return props.inventoryItems.filter(function (item) {
        const matchesSearch =
            item.name.toLowerCase().includes(query) ||
            item.mainCategory.toLowerCase().includes(query);

        const matchesCategory = categoriesSelected
            ? selectedCategories.value.includes(item.mainCategory)
            : true;

        return matchesSearch && matchesCategory;
    });
});

function handleSelect(item: DrinkCardItem | InventoryItemDoc): void {
    emit("select", item);
}

function isCategorySelected(category: string): boolean {
    return selectedCategories.value.includes(category);
}

function toggleCategory(category: string): void {
    const index = selectedCategories.value.indexOf(category);
    if (index === -1) {
        selectedCategories.value.push(category);
    } else {
        selectedCategories.value.splice(index, 1);
    }
}
</script>

<template>
    <!-- Category Pills -->
    <q-card-section class="q-pa-none">
        <div class="q-gutter-sm q-mb-md flex-wrap justify-center">
            <q-chip
                clickable
                v-for="category in categories"
                :key="category"
                outline
                :color="isCategorySelected(category) ? 'primary' : ''"
                @click="toggleCategory(category)"
                class="cursor-pointer"
            >
                {{ category }}
            </q-chip>
        </div>
    </q-card-section>

    <q-card-section class="q-pa-none">
        <q-input
            v-model="searchQuery"
            standout
            rounded
            debounce="300"
            :placeholder="t('DrinkCardBuilderItemSelectionDialog.searchItemsPlaceholder')"
            class="q-mb-md"
        >
            <template #prepend>
                <q-icon name="fa fa-search" />
            </template>
        </q-input>

        <q-list separator>
            <q-item
                v-for="item in filteredItems"
                :key="'id' in item ? item.id : item.inventoryItemId"
                clickable
                @click="handleSelect(item)"
            >
                <q-item-section>
                    <q-item-label>{{ item.name }}</q-item-label>
                    <q-item-label caption>{{ item.mainCategory }}</q-item-label>
                </q-item-section>
            </q-item>

            <q-item v-if="filteredItems.length === 0">
                <q-item-section class="text-center text-grey"> {{ t('DrinkCardBuilderItemSelectionDialog.noItemsFoundText') }} </q-item-section>
            </q-item>
        </q-list>
    </q-card-section>
</template>

<style lang="scss" scoped>
.dialog-pill {
    width: 36px;
    height: 4px;
    background-color: #e0e0e0;
    border-radius: 4px;
    transition: background-color 0.3s;

    &:hover {
        background-color: #bdbdbd;
    }
}

.item-selection-bottom-dialog {
    width: 100%;
}
</style>
