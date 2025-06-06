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
    <template v-if="props.availableTags.value.length > 0">
        <q-select
            :model-value="selectedTags.value"
            :options="props.availableTags.value"
            clear-icon="fa fa-close"
            multiple
            use-chips
            outlined
            dense
            label="Filter by tags"
            @update:model-value="updateSelectedTags"
        />

        <q-separator class="q-my-md" />
    </template>

    <div class="text-weight-bolder q-mb-sm">Sort by</div>
    <q-list>
        <q-item
            tag="label"
            v-for="option in sortOptions"
            :key="option.value"
            clickable
            @click="emit('update:sortOption', option.value)"
            class="q-pa-none"
        >
            <q-item-section avatar>
                <q-radio
                    :model-value="currentSortOption.value"
                    :val="option.value"
                    color="primary"
                    @update:model-value="emit('update:sortOption', option.value)"
                />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ option.label }}</q-item-label>
            </q-item-section>

            <q-item-section> </q-item-section>
        </q-item>
    </q-list>

    <q-separator class="q-my-md" />

    <div class="text-weight-bolder q-mb-sm">Direction</div>
    <q-item clickable @click="emit('toggleDirection')">
        <q-item-section>
            {{ currentSortDirection.value === "desc" ? "Descending" : "Ascending" }}
        </q-item-section>
        <q-item-section side>
            <q-icon
                :name="currentSortDirection.value === 'desc' ? 'fa fa-sort-down' : 'fa fa-sort-up'"
            />
        </q-item-section>
    </q-item>
</template>
