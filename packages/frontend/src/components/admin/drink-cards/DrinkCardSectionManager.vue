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
    <div class="DrinkCardSectionManager">
        <!-- Add Buttons -->
        <div class="d-flex align-center justify-space-between mb-4 pa-4">
            <h6 class="text-h6">{{ t("PageAdminPropertyDrinkCards.sectionsLabel") }}</h6>
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

        <!-- Root Elements List -->
        <div ref="draggableListRef" class="d-flex flex-column ga-2">
            <template v-for="element in draggableElements" :key="element.id">
                <!-- Header -->
                <template v-if="isHeader(element)">
                    <v-card class="ft-card drag-item">
                        <v-card-text class="pa-4">
                            <div class="d-flex align-center ga-3">
                                <v-icon class="drag-handle" style="cursor: grab"
                                    >fas fa-bars</v-icon
                                >
                                <v-text-field
                                    v-model="element.name"
                                    @change="emitUpdatedElements()"
                                    variant="outlined"
                                    density="compact"
                                    hide-details
                                    class="flex-grow-1"
                                />
                                <v-btn
                                    variant="text"
                                    icon
                                    color="error"
                                    size="small"
                                    @click="removeElement(element.id)"
                                >
                                    <v-icon>fas fa-trash</v-icon>
                                </v-btn>
                            </div>
                        </v-card-text>
                    </v-card>
                </template>

                <!-- Header End -->
                <template v-else-if="isHeaderEnd(element)">
                    <v-card class="ft-card drag-item">
                        <v-card-text class="pa-4">
                            <div class="d-flex align-center ga-3">
                                <v-icon class="drag-handle" style="cursor: grab"
                                    >fas fa-bars</v-icon
                                >
                                <div class="font-weight-medium flex-grow-1">Header End</div>
                                <v-btn
                                    variant="text"
                                    icon
                                    color="error"
                                    size="small"
                                    @click="removeElement(element.id)"
                                >
                                    <v-icon>fas fa-trash</v-icon>
                                </v-btn>
                            </div>
                        </v-card-text>
                    </v-card>
                </template>

                <!-- Bundle -->
                <template v-else-if="isBundle(element)">
                    <v-card class="ft-card drag-item">
                        <v-card-text class="pa-4">
                            <div class="d-flex align-center ga-3">
                                <v-icon class="drag-handle" style="cursor: grab"
                                    >fas fa-bars</v-icon
                                >
                                <div class="flex-grow-1">
                                    <div class="font-weight-medium">{{ element.name }}</div>
                                    <div class="text-caption">
                                        {{ element.items.length }} items •
                                        {{ formatPrice(element.price) }}
                                    </div>
                                </div>
                                <v-btn
                                    variant="text"
                                    icon
                                    color="primary"
                                    size="small"
                                    @click="handleEditBundle(element)"
                                >
                                    <v-icon>fas fa-pencil</v-icon>
                                </v-btn>
                                <v-btn
                                    variant="text"
                                    icon
                                    color="error"
                                    size="small"
                                    @click="removeElement(element.id)"
                                >
                                    <v-icon>fas fa-trash</v-icon>
                                </v-btn>
                            </div>
                        </v-card-text>
                    </v-card>
                </template>

                <!-- Root Level Section -->
                <template v-else-if="isSection(element)">
                    <v-expansion-panels>
                        <v-expansion-panel class="ft-card drag-item" :data-section-id="element.id">
                            <v-expansion-panel-title>
                                <div class="d-flex align-center ga-3 w-100">
                                    <v-icon class="drag-handle" style="cursor: grab"
                                        >fas fa-bars</v-icon
                                    >
                                    <span class="flex-grow-1">{{ element.name }}</span>
                                    <v-btn
                                        variant="text"
                                        icon
                                        color="error"
                                        size="small"
                                        @click.stop="removeElement(element.id)"
                                    >
                                        <v-icon>fas fa-trash</v-icon>
                                    </v-btn>
                                </div>
                            </v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <!-- Section Items -->
                                <DrinkCardSectionItems
                                    :section="element"
                                    :inventory-items="inventoryItems"
                                    @update:items="updateSectionItems(element.id, $event)"
                                />
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </template>
            </template>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.draggable-ghost {
    opacity: 0.5;
    background: rgb(var(--v-theme-primary));
}

.draggable-chosen {
    background: rgb(var(--v-theme-surface-variant));
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
