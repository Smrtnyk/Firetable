<script setup lang="ts">
import type { Ref } from "vue";

export type SortDirection = "asc" | "desc";

export type SortOption =
    /**
     * When sorting by bookings try to prioritize guests with the highest percentage of fulfilled visits.
     */
    | "bookings"
    /**
     * When sorting by land, sort by the landcode in the maskedContact
     */
    | "land"
    /**
     * When sorting by last modified try to prioritize guests with the highest number of bookings.
     */
    | "lastModified"
    /**
     * When sorting by name, sort alphabetically by guest name
     */
    | "name"
    /**
     * When sorting by percentage try to prioritize guests with the highest number of bookings.
     */
    | "percentage";

interface GuestSortOptionsProps {
    availableTags: Ref<string[]>;
    currentSortDirection: Ref<SortDirection>;
    currentSortOption: Ref<SortOption>;
    selectedTags: Ref<string[]>;
}

const props = defineProps<GuestSortOptionsProps>();

const emit = defineEmits<{
    (e: "update:sortOption", value: SortOption): void;
    (e: "update:selectedTags", value: string[]): void;
    (e: "close" | "toggleDirection"): void;
}>();

const sortOptions = [
    { label: "Bookings", value: "bookings" },
    { label: "Percentage", value: "percentage" },
    { label: "Last Modified", value: "lastModified" },
    { label: "Name", value: "name" },
    { label: "Land", value: "land" },
] as const;

function updateSelectedTags(value: string[]): void {
    emit("update:selectedTags", value);
}
</script>

<template>
    <div class="pa-2">
        <template v-if="props.availableTags.value.length > 0">
            <v-select
                :model-value="selectedTags.value"
                :items="props.availableTags.value"
                clear-icon="fas fa-times"
                multiple
                chips
                closable-chips
                variant="outlined"
                density="compact"
                label="Filter by tags"
                @update:model-value="updateSelectedTags"
            />
            <v-divider class="my-4" />
        </template>

        <div class="font-weight-bold mb-2">Sort by</div>
        <v-radio-group
            :model-value="currentSortOption.value"
            @update:model-value="emit('update:sortOption', $event![0] as SortOption)"
            hide-details
            class="mt-n2"
        >
            <v-radio
                v-for="option in sortOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
                color="primary"
            ></v-radio>
        </v-radio-group>

        <v-divider class="my-4" />

        <div class="font-weight-bold mb-2">Direction</div>
        <v-list class="py-0">
            <v-list-item @click="emit('toggleDirection')" class="px-1">
                <v-list-item-title>
                    {{ currentSortDirection.value === "desc" ? "Descending" : "Ascending" }}
                </v-list-item-title>
                <template #append>
                    <v-icon
                        :icon="
                            currentSortDirection.value === 'desc'
                                ? 'fas fa-sort-down'
                                : 'fas fa-sort-up'
                        "
                    />
                </template>
            </v-list-item>
        </v-list>
    </div>
</template>
