<template>
    <div class="bottom-sheet-container">
        <template v-for="sheet in bottomSheets" :key="sheet.id">
            <v-bottom-sheet
                :model-value="getBottomSheetVisibility(sheet.id)"
                :persistent="sheet.persistent ?? false"
                :content-class="`bottom-sheet-z-${sheet.id}`"
                @update:model-value="handleBottomSheetVisibility(sheet.id, $event)"
            >
                <v-card :style="sheet.maxHeight ? `max-height: ${sheet.maxHeight}px` : ''">
                    <v-card-title class="d-flex align-center">
                        <span class="text-h6">{{ sheet.title ?? "" }}</span>
                        <v-spacer></v-spacer>
                        <v-btn
                            icon="fas fa-times"
                            @click="closeBottomSheet(sheet.id)"
                            variant="text"
                            aria-label="Close bottom sheet"
                        />
                    </v-card-title>

                    <component
                        :is="sheet.component"
                        v-bind="preparePropsForChild(sheet.props)"
                        @close="closeBottomSheet(sheet.id)"
                        v-on="extractEventHandlers(sheet.props)"
                    />
                </v-card>
            </v-bottom-sheet>
        </template>
    </div>
</template>

<script setup lang="ts">
import { globalBottomSheet } from "src/composables/useBottomSheet";
import { computed, isRef, ref, watch } from "vue";

const bottomSheets = computed(() => globalBottomSheet.bottomSheets.value);

const bottomSheetVisibilityMap = ref(new Map<string, boolean>());

function getBottomSheetVisibility(sheetId: string): boolean {
    return bottomSheetVisibilityMap.value.get(sheetId) ?? false;
}

function setBottomSheetVisibility(sheetId: string, value: boolean): void {
    bottomSheetVisibilityMap.value.set(sheetId, value);
}

watch(
    bottomSheets,
    function (newBottomSheets) {
        newBottomSheets.forEach((sheet) => {
            if (!bottomSheetVisibilityMap.value.has(sheet.id)) {
                bottomSheetVisibilityMap.value.set(sheet.id, true);
            }
        });

        const currentIds = new Set(newBottomSheets.map(({ id }) => id));
        bottomSheetVisibilityMap.value.forEach((isVisible, id) => {
            if (!currentIds.has(id) && !isVisible) {
                setTimeout(() => {
                    const updatedMap = new Map(bottomSheetVisibilityMap.value);
                    updatedMap.delete(id);
                    bottomSheetVisibilityMap.value = updatedMap;
                }, 300);
            }
        });
    },
    { immediate: true },
);

function closeBottomSheet(sheetId: string): void {
    setBottomSheetVisibility(sheetId, false);
    setTimeout(() => {
        globalBottomSheet.closeBottomSheet(sheetId);
    }, 300);
}

/**
 * Extracts event handlers (functions starting with "on") from the raw props.
 * These will be bound using v-on.
 */
function extractEventHandlers(rawProps?: Record<string, unknown>): Record<string, Function> {
    if (!rawProps) return {};
    const handlers: Record<string, Function> = {};
    for (const key in rawProps) {
        if (
            typeof rawProps[key] === "function" &&
            (key.startsWith("onUpdate:") || key.startsWith("onToggle") || key.startsWith("onClose"))
        ) {
            const eventName = key.startsWith("on")
                ? key.charAt(2).toLowerCase() + key.slice(3)
                : key;
            handlers[eventName] = rawProps[key];
        }
    }
    return handlers;
}

function handleBottomSheetVisibility(sheetId: string, isVisible: boolean): void {
    if (!isVisible) {
        const sheet = bottomSheets.value.find(({ id }) => id === sheetId);
        if (sheet && !sheet.persistent) {
            closeBottomSheet(sheetId);
        } else {
            setBottomSheetVisibility(sheetId, true);
        }
    }
}

/**
 * Prepares props for the child component by unwrapping refs and filtering out event handlers.
 */
function preparePropsForChild(rawProps?: Record<string, unknown>): Record<string, unknown> {
    if (!rawProps) return {};
    const resolvedProps: Record<string, unknown> = {};
    for (const key in rawProps) {
        if (
            (typeof rawProps[key] === "function" && key.startsWith("onUpdate:")) ||
            key.startsWith("onToggle")
        ) {
            continue;
        }
        const propValue = rawProps[key];
        resolvedProps[key] = isRef(propValue) ? propValue.value : propValue;
    }
    return resolvedProps;
}
</script>
