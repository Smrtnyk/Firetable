<script setup lang="ts">
import type { DrinkCardItem, InventoryItemDoc } from "@firetable/types";

import { refDebounced } from "@vueuse/core";
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
const { t } = useI18n();
const selectedCategories = ref<string[]>([]);

const immediateSearchQuery = ref("");
const searchQuery = refDebounced(immediateSearchQuery, 300);

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
    <div>
        <v-card-text>
            <div class="d-flex flex-wrap justify-center mb-4" style="gap: 8px">
                <v-chip
                    v-for="category in categories"
                    :key="category"
                    :variant="isCategorySelected(category) ? 'elevated' : 'outlined'"
                    :color="isCategorySelected(category) ? 'primary' : 'default'"
                    @click="toggleCategory(category)"
                    style="cursor: pointer"
                >
                    {{ category }}
                </v-chip>
            </div>
        </v-card-text>

        <v-card-text class="pt-0">
            <v-text-field
                v-model="immediateSearchQuery"
                variant="outlined"
                :placeholder="t('DrinkCardBuilderItemSelectionDialog.searchItemsPlaceholder')"
                class="mb-4"
                prepend-inner-icon="fas fa-search"
                clearable
                hide-details
            />

            <v-list lines="two" style="max-height: 400px; overflow-y: auto">
                <v-list-item
                    v-for="item in filteredItems"
                    :key="'id' in item ? item.id : item.inventoryItemId"
                    @click="handleSelect(item)"
                >
                    <v-list-item-title>{{ item.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.mainCategory }}</v-list-item-subtitle>
                </v-list-item>

                <div v-if="filteredItems.length === 0" class="text-center text-grey-darken-1 pa-4">
                    {{ t("DrinkCardBuilderItemSelectionDialog.noItemsFoundText") }}
                </div>
            </v-list>
        </v-card-text>
    </div>
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
