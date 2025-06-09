<script setup lang="ts">
import type {
    DrinkBundle,
    DrinkCardElement,
    DrinkCardHeader,
    DrinkCardHeaderEnd,
    DrinkCardItem,
    DrinkCardSection,
    InventoryItemDoc,
} from "@firetable/types";
import type { SortableEvent } from "vue-draggable-plus";

import { isNumber, matchesProperty } from "es-toolkit/compat";
import DrinkCardBuilderAddDragElementsDropdown from "src/components/admin/drink-cards/DrinkCardBuilderAddDragElementsDropdown.vue";
import {
    formatPrice,
    isBundle,
    isHeader,
    isHeaderEnd,
    isSection,
} from "src/helpers/drink-card/drink-card";
import { computed, ref } from "vue";
import { useDraggable } from "vue-draggable-plus";
import { useI18n } from "vue-i18n";

import DrinkCardSectionItems from "./DrinkCardSectionItems.vue";

interface Emits {
    (event: "update:elements", elements: DrinkCardElement[]): void;
    (event: "add", element: DrinkCardElement): void;
    (event: "remove", index: number): void;
}

interface Props {
    elements: DrinkCardElement[];
    inventoryItems: InventoryItemDoc[];
}

const { t } = useI18n();
const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const dropdownRef = ref<{ showBundleDialog: (bundle?: DrinkBundle) => void }>();
const draggableElements = ref(props.elements);
const draggableListRef = ref();

const availableItems = computed(() => {
    const items: DrinkCardItem[] = [];
    draggableElements.value.filter(isSection).forEach((element) => {
        items.push(...element.items);
    });
    return items;
});

useDraggable(draggableListRef, draggableElements, {
    animation: 150,
    draggable: ".drag-item",
    handle: ".drag-handle",
    onEnd(event: SortableEvent): void {
        const { item, newDraggableIndex, oldDraggableIndex } = event;
        if (
            !isNumber(oldDraggableIndex) ||
            !isNumber(newDraggableIndex) ||
            oldDraggableIndex === newDraggableIndex ||
            !item
        ) {
            return;
        }
        emitUpdatedElements();
    },
});

function emitUpdatedElements(): void {
    emit("update:elements", draggableElements.value);
}

function handleAddBundle(bundle: DrinkBundle): void {
    draggableElements.value.push(bundle);
    emitUpdatedElements();
}

function handleAddHeader(): void {
    const newHeader: DrinkCardHeader = {
        id: crypto.randomUUID(),
        name: "",
        type: "header",
    };
    draggableElements.value.push(newHeader);
    emitUpdatedElements();
}

function handleAddHeaderEnd(): void {
    const newHeaderEnd: DrinkCardHeaderEnd = {
        id: crypto.randomUUID(),
        name: "",
        type: "header-end",
    };
    draggableElements.value.push(newHeaderEnd);
    emitUpdatedElements();
}

function handleAddSection(section: DrinkCardSection): void {
    draggableElements.value.push(section);
    emitUpdatedElements();
}

function handleEditBundle(bundle: DrinkBundle): void {
    dropdownRef.value?.showBundleDialog(bundle);
}

function handleUpdateBundle(updatedBundle: DrinkBundle): void {
    const index = draggableElements.value.findIndex((e) => e.id === updatedBundle.id);
    if (index !== -1) {
        draggableElements.value[index] = updatedBundle;
        emitUpdatedElements();
    }
}

function removeElement(elementId: string): void {
    draggableElements.value = draggableElements.value.filter(function ({ id }) {
        return id !== elementId;
    });
    emitUpdatedElements();
}

function updateSectionItems(sectionId: string, items: DrinkCardItem[]): void {
    const elements = [...draggableElements.value];
    const rootSection = elements.filter(isSection).find(matchesProperty("id", sectionId));
    if (rootSection) {
        rootSection.items = items;
    }
    draggableElements.value = elements;
    emitUpdatedElements();
}
</script>

<template>
    <div class="drink-card-section-manager">
        <div class="d-flex align-center justify-space-between mb-4 pa-4">
            <div class="text-h6">{{ t("PageAdminPropertyDrinkCards.sectionsLabel") }}</div>
            <DrinkCardBuilderAddDragElementsDropdown
                ref="dropdownRef"
                :available-items="availableItems"
                @add-header="handleAddHeader"
                @add-header-end="handleAddHeaderEnd"
                @add-bundle="handleAddBundle"
                @update-bundle="handleUpdateBundle"
                @add-section="handleAddSection"
            />
        </div>

        <div ref="draggableListRef" class="d-flex flex-column" style="gap: 8px">
            <div v-for="element in draggableElements" :key="element.id" class="drag-item">
                <v-card v-if="isHeader(element)" variant="outlined">
                    <v-list-item class="pr-1">
                        <template #prepend>
                            <v-icon icon="fas fa-bars" class="drag-handle mr-4" />
                        </template>
                        <v-text-field
                            v-model="element.name"
                            @change="emitUpdatedElements()"
                            density="compact"
                            variant="outlined"
                            hide-details
                        />
                        <template #append>
                            <v-btn
                                variant="text"
                                icon="fas fa-trash-alt"
                                color="error"
                                size="small"
                                @click="removeElement(element.id)"
                            />
                        </template>
                    </v-list-item>
                </v-card>

                <v-card v-else-if="isHeaderEnd(element)" variant="outlined">
                    <v-list-item class="pr-1">
                        <template #prepend>
                            <v-icon icon="fas fa-bars" class="drag-handle mr-4" />
                        </template>
                        <v-list-item-title class="font-weight-medium">Header End</v-list-item-title>
                        <template #append>
                            <v-btn
                                variant="text"
                                icon="fas fa-trash-alt"
                                color="error"
                                size="small"
                                @click="removeElement(element.id)"
                            />
                        </template>
                    </v-list-item>
                </v-card>

                <v-card v-else-if="isBundle(element)" variant="outlined">
                    <v-list-item class="pr-1">
                        <template #prepend>
                            <v-icon icon="fas fa-bars" class="drag-handle mr-4" />
                        </template>
                        <div>
                            <v-list-item-title class="font-weight-medium">{{
                                element.name
                            }}</v-list-item-title>
                            <v-list-item-subtitle>
                                {{ element.items.length }} items • {{ formatPrice(element.price) }}
                            </v-list-item-subtitle>
                        </div>
                        <template #append>
                            <v-btn
                                variant="text"
                                icon="fas fa-pencil-alt"
                                color="primary"
                                size="small"
                                @click="handleEditBundle(element)"
                            />
                            <v-btn
                                variant="text"
                                icon="fas fa-trash-alt"
                                color="error"
                                size="small"
                                @click="removeElement(element.id)"
                            />
                        </template>
                    </v-list-item>
                </v-card>

                <v-expansion-panels v-else-if="isSection(element)" :key="element.id">
                    <v-expansion-panel class="ft-card ft-border">
                        <v-expansion-panel-title>
                            <v-icon icon="fas fa-bars" class="drag-handle mr-4" />
                            {{ element.name }}
                            <v-spacer />
                            <v-btn
                                variant="text"
                                icon="fas fa-trash-alt"
                                color="error"
                                size="small"
                                @click.stop="removeElement(element.id)"
                            />
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <DrinkCardSectionItems
                                :section="element"
                                :inventory-items="inventoryItems"
                                @update:items="updateSectionItems(element.id, $event)"
                            />
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </div>
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

.drag-handle {
    cursor: grab;
}

.drag-handle:active {
    cursor: grabbing;
}
</style>
