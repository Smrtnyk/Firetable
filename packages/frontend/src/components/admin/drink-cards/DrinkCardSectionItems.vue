<script setup lang="ts">
import type {
    DrinkCardItem,
    DrinkCardSection,
    InventoryItemDoc,
    SpecialPrice,
} from "@firetable/types";
import type { SortableEvent } from "vue-draggable-plus";

import { isDrinkItem } from "@firetable/types";
import DrinkCardBuilderItemSelectionDialog from "src/components/admin/drink-cards/DrinkCardBuilderItemSelectionDialog.vue";
import DrinkCardBuilderSectionListItem from "src/components/admin/drink-cards/DrinkCardBuilderSectionListItem.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import { globalBottomSheet } from "src/composables/useBottomSheet";
import { globalDialog } from "src/composables/useDialog";
import { useScreenDetection } from "src/global-reactives/screen-detection";
import { computed } from "vue";
import { vDraggable } from "vue-draggable-plus";
import { useI18n } from "vue-i18n";

type Emits = (event: "update:items", items: DrinkCardItem[]) => void;

interface Props {
    inventoryItems: InventoryItemDoc[];
    section: DrinkCardSection;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useI18n();
const { buttonSize } = useScreenDetection();

const draggableItems = computed(() => props.section.items);
const draggableOptions = computed(function () {
    return {
        animation: 150,
        chosenClass: "draggable-chosen",
        dragClass: "draggable-drag",
        ghostClass: "draggable-ghost",
        onEnd: onDrop,
    };
});

function createEmptySpecialPrice(): DrinkCardItem["specialPrice"] {
    return {
        amount: 0,
        description: "",
        label: "",
    };
}

function formatItemName(item: DrinkCardItem): string {
    const displayName = item.servingSize.displayName;

    if (displayName) {
        return `${item.name} (${displayName})`;
    }
    return item.name;
}

function handleAddItem(inventoryItem: InventoryItemDoc): void {
    const servingSize = {
        amount: 0,
        displayName: "",
        unit: "ml" as const,
    };

    const newItem: DrinkCardItem = {
        brand: inventoryItem.brand,
        description: inventoryItem.description,
        displayAlcoholContent:
            isDrinkItem(inventoryItem) && inventoryItem.alcoholContent !== undefined,
        displayOrigin: inventoryItem.region !== undefined,
        inventoryItemId: inventoryItem.id,
        // Default display settings
        isHighlighted: false,
        isVisible: true,
        mainCategory: inventoryItem.mainCategory,
        // Copy relevant inventory fields
        name: inventoryItem.name,
        order: props.section.items.length,
        price: 0,
        servingSize,
        specialPrice: createEmptySpecialPrice(),
        style: inventoryItem.style,
        subCategory: inventoryItem.subCategory,
        tags: [],
        type: inventoryItem.type,
        volume: inventoryItem.volume,
    };

    if (isDrinkItem(inventoryItem)) {
        Object.assign(newItem, {
            alcoholContent: inventoryItem.alcoholContent,
        });
    }

    emit("update:items", [...props.section.items, newItem]);
}

function handleItemUpdate(index: number, updates: Partial<DrinkCardItem>): void {
    const newItems = Array.from(props.section.items);
    newItems[index] = {
        ...newItems[index],
        ...updates,
    };
    emit("update:items", newItems);
}

async function handleRemoveItem(index: number): Promise<void> {
    const confirm = await globalDialog.confirm({
        title: "Are you sure you want to remove this item?",
    });
    if (!confirm) return;

    const newItems = Array.from(props.section.items);
    newItems.splice(index, 1);
    emit("update:items", newItems);
}

function handleSpecialPriceUpdate<K extends keyof SpecialPrice>(
    index: number,
    { field, value }: { field: K; value: SpecialPrice[K] },
): void {
    const newItems = Array.from(props.section.items);
    const item = newItems[index];

    if (!item.specialPrice) {
        item.specialPrice = {
            amount: 0,
            description: "",
            label: "Happy Hour",
        };
    }

    item.specialPrice[field] = value;

    // Remove special price if amount is 0 or not set
    if (field === "amount" && !value) {
        item.specialPrice = createEmptySpecialPrice();
    }

    emit("update:items", newItems);
}

function onDrop(event: SortableEvent): void {
    const { newDraggableIndex, oldDraggableIndex } = event;
    if (
        oldDraggableIndex === newDraggableIndex ||
        oldDraggableIndex === undefined ||
        newDraggableIndex === undefined
    ) {
        return;
    }

    const newItems = Array.from(props.section.items);
    const [movedItem] = newItems.splice(oldDraggableIndex, 1);
    newItems.splice(newDraggableIndex, 0, movedItem);

    const reorderedItems = newItems.map(function (item, index) {
        return {
            ...item,
            order: index,
        };
    });

    emit("update:items", reorderedItems);
}

function showItemSelectionDialog(): void {
    const dialog = globalBottomSheet.openBottomSheet(DrinkCardBuilderItemSelectionDialog, {
        inventoryItems: props.inventoryItems,
        // @ts-expect-error -- FIXME - infer this type correctly
        onSelect(addedItem) {
            globalDialog.closeDialog(dialog);
            handleAddItem(addedItem);
        },
    });
}
</script>

<template>
    <div class="drink-card-section-items d-flex flex-column" style="gap: 8px">
        <div class="d-flex justify-end my-4">
            <v-btn
                variant="tonal"
                rounded="lg"
                :size="buttonSize"
                color="primary"
                prepend-icon="fas fa-plus"
                class="button-gradient"
                :disabled="props.inventoryItems.length === 0"
                @click="showItemSelectionDialog"
            >
                Add Item
            </v-btn>
        </div>

        <FTCenteredText v-if="section.items.length === 0">
            {{ t("PageAdminPropertyDrinkCards.noItemsMessage") }}
        </FTCenteredText>

        <div
            v-else
            v-draggable="[draggableItems, draggableOptions]"
            class="d-flex flex-column pa-2"
            style="gap: 8px"
        >
            <DrinkCardBuilderSectionListItem
                v-for="(item, index) in draggableItems"
                :key="item.inventoryItemId"
                :item="item"
                :formatted-name="formatItemName(item)"
                @update:price="(price) => handleItemUpdate(index, { price })"
                @update:serving-size="(servingSize) => handleItemUpdate(index, { servingSize })"
                @update:special-price="(updates) => handleSpecialPriceUpdate(index, updates)"
                @toggle-visibility="handleItemUpdate(index, { isVisible: !item.isVisible })"
                @remove="handleRemoveItem(index)"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.draggable-ghost {
    opacity: 0.5;
    background: rgb(var(--v-theme-primary));
}

.draggable-chosen {
    background: rgb(var(--v-theme-grey-lighten-4));
}

.draggable-drag {
    cursor: grabbing;
}

.dialog-pill {
    width: 36px;
    height: 4px;
    background-color: #e0e0e0;
    border-radius: 4px;
    transition: background-color 0.3s;
}

.dialog-pill:hover {
    background-color: #bdbdbd;
}

.item-selection-bottom-dialog {
    width: 100%;
}
</style>
