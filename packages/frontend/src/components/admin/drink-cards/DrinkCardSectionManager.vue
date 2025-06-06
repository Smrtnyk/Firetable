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
        <div class="row items-center justify-between q-mb-md q-pa-md">
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

        <!-- Root Elements List -->
        <q-list ref="draggableListRef" class="q-gutter-y-sm">
            <template v-for="element in draggableElements" :key="element.id">
                <!-- Header -->
                <template v-if="isHeader(element)">
                    <q-item class="ft-card ft-border drag-item">
                        <q-item-section avatar>
                            <q-icon name="fa fa-bars" class="cursor-move drag-handle" />
                        </q-item-section>
                        <q-item-section>
                            <q-input
                                v-model="element.name"
                                @change="emitUpdatedElements()"
                                dense
                                standout
                            />
                        </q-item-section>
                        <q-item-section side>
                            <q-btn
                                flat
                                round
                                color="negative"
                                icon="fa fa-trash"
                                size="sm"
                                @click="removeElement(element.id)"
                            />
                        </q-item-section>
                    </q-item>
                </template>

                <!-- Header End -->
                <template v-else-if="isHeaderEnd(element)">
                    <q-item class="ft-card ft-border drag-item">
                        <q-item-section avatar>
                            <q-icon name="fa fa-bars" class="cursor-move drag-handle" />
                        </q-item-section>
                        <q-item-section>
                            <div class="text-weight-medium">Header End</div>
                        </q-item-section>
                        <q-item-section side>
                            <q-btn
                                flat
                                round
                                color="negative"
                                icon="fa fa-trash"
                                size="sm"
                                @click="removeElement(element.id)"
                            />
                        </q-item-section>
                    </q-item>
                </template>

                <!-- Bundle -->
                <template v-else-if="isBundle(element)">
                    <q-item class="ft-card ft-border drag-item">
                        <q-item-section avatar>
                            <q-icon name="fa fa-bars" class="cursor-move drag-handle" />
                        </q-item-section>
                        <q-item-section>
                            <div class="text-weight-medium">{{ element.name }}</div>
                            <div class="text-caption">
                                {{ element.items.length }} items • {{ formatPrice(element.price) }}
                            </div>
                        </q-item-section>
                        <q-item-section side>
                            <q-btn
                                flat
                                round
                                color="primary"
                                icon="fa fa-pencil"
                                size="sm"
                                @click="handleEditBundle(element)"
                            />
                            <q-btn
                                flat
                                round
                                color="negative"
                                icon="fa fa-trash"
                                size="sm"
                                @click="removeElement(element.id)"
                            />
                        </q-item-section>
                    </q-item>
                </template>

                <!-- Root Level Section -->
                <template v-else-if="isSection(element)">
                    <q-expansion-item
                        class="ft-card ft-border drag-item"
                        :data-section-id="element.id"
                    >
                        <template #header>
                            <q-item-section avatar>
                                <q-icon name="fa fa-bars" class="cursor-move drag-handle" />
                            </q-item-section>
                            <q-item-section>{{ element.name }}</q-item-section>
                            <q-item-section side>
                                <q-btn
                                    flat
                                    round
                                    color="negative"
                                    icon="fa fa-trash"
                                    size="sm"
                                    @click.stop="removeElement(element.id)"
                                />
                            </q-item-section>
                        </template>

                        <!-- Section Items -->
                        <DrinkCardSectionItems
                            :section="element"
                            :inventory-items="inventoryItems"
                            @update:items="updateSectionItems(element.id, $event)"
                        />
                    </q-expansion-item>
                </template>
            </template>
        </q-list>
    </div>
</template>

<style lang="scss" scoped>
.draggable-ghost {
    opacity: 0.5;
    background: var(--q-primary);
}

.draggable-chosen {
    background: var(--q-grey-2);
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
