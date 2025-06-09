<script setup lang="ts">
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
    availableTags: string[];
    currentSortDirection: SortDirection;
    currentSortOption: SortOption;
    selectedTags: string[];
}

const props = defineProps<GuestSortOptionsProps>();

const emit = defineEmits<{
    (e: "update:currentSortOption", value: SortOption): void;
    (e: "update:selectedTags", value: string[]): void;
    (e: "toggleDirection"): void;
}>();

const sortOptions = [
    { label: "Bookings", value: "bookings" },
    { label: "Percentage", value: "percentage" },
    { label: "Last Modified", value: "lastModified" },
    { label: "Name", value: "name" },
    { label: "Land", value: "land" },
] as const;
</script>

<template>
    <div class="pa-2">
        <template v-if="props.availableTags.length > 0">
            <v-select
                :model-value="props.selectedTags"
                :items="props.availableTags"
                clear-icon="fas fa-times"
                multiple
                chips
                closable-chips
                variant="outlined"
                density="compact"
                label="Filter by tags"
                aria-label="Filter by tags"
                @update:model-value="emit('update:selectedTags', $event as string[])"
            />
            <v-divider class="my-4" />
        </template>

        <div class="font-weight-bold mb-2">Sort by</div>
        <v-radio-group
            :model-value="props.currentSortOption"
            @update:model-value="emit('update:currentSortOption', $event as SortOption)"
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
                    {{ props.currentSortDirection === "desc" ? "Descending" : "Ascending" }}
                </v-list-item-title>
                <template #append>
                    <v-icon
                        :icon="
                            props.currentSortDirection === 'desc'
                                ? 'fas fa-sort-down'
                                : 'fas fa-sort-up'
                        "
                    />
                </template>
            </v-list-item>
        </v-list>
    </div>
</template>
