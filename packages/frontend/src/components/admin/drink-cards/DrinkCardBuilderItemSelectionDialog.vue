<script setup lang="ts">
import type { InventoryItemDoc } from "@firetable/types";
import { computed, ref } from "vue";

interface Props {
    modelValue: boolean;
    inventoryItems: InventoryItemDoc[];
    category: string;
}

interface Emits {
    (event: "update:modelValue", value: boolean): void;
    (event: "select", item: InventoryItemDoc): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchQuery = ref("");

const filteredItems = computed(function () {
    const query = searchQuery.value.toLowerCase().trim();
    const filtered = props.inventoryItems.filter((item) => item.mainCategory === props.category);

    if (!query) {
        return filtered;
    }

    return filtered.filter(function (item) {
        return (
            item.name.toLowerCase().includes(query) ||
            item.mainCategory.toLowerCase().includes(query)
        );
    });
});

function handleSelect(item: InventoryItemDoc): void {
    emit("select", item);
}
</script>

<template>
    <q-dialog
        :model-value="modelValue"
        position="bottom"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <q-card class="ft-card item-selection-bottom-dialog">
            <div class="row justify-center q-mb-md q-pt-md">
                <button
                    class="dialog-pill cursor-pointer"
                    aria-label="Close dialog"
                    @click="$emit('update:modelValue', false)"
                />
            </div>

            <q-card-section>
                <q-input
                    v-model="searchQuery"
                    standout
                    rounded
                    debounce="300"
                    placeholder="Search items"
                    class="q-mb-md"
                >
                    <template #prepend>
                        <q-icon name="search" />
                    </template>
                </q-input>

                <q-list separator>
                    <q-item
                        v-for="item in filteredItems"
                        :key="item.id"
                        clickable
                        @click="handleSelect(item)"
                    >
                        <q-item-section>
                            <q-item-label>{{ item.name }}</q-item-label>
                            <q-item-label caption>{{ item.mainCategory }}</q-item-label>
                        </q-item-section>
                    </q-item>

                    <q-item v-if="filteredItems.length === 0">
                        <q-item-section class="text-center text-grey">
                            No items found
                        </q-item-section>
                    </q-item>
                </q-list>
            </q-card-section>
        </q-card>
    </q-dialog>
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
