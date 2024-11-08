<script setup lang="ts">
export type SortOption =
    /**
     * When sorting by bookings try to prioritize guests with the highest percentage of fulfilled visits.
     */
    | "bookings"
    /**
     * When sorting by last modified try to prioritize guests with the highest number of bookings.
     */
    | "lastModified"
    /**
     * When sorting by percentage try to prioritize guests with the highest number of bookings.
     */
    | "percentage";

export type SortDirection = "asc" | "desc";

interface GuestSortOptionsProps {
    currentSortOption: SortOption;
    currentSortDirection: SortDirection;
    availableTags: string[];
    selectedTags: string[];
}

const {
    currentSortOption,
    currentSortDirection,
    availableTags = [],
    selectedTags = [],
} = defineProps<GuestSortOptionsProps>();

const emit = defineEmits<{
    (e: "update:sortOption", value: SortOption): void;
    (e: "update:selectedTags", value: string[]): void;
    (e: "close" | "toggleDirection"): void;
}>();

const sortOptions = [
    { label: "Bookings", value: "bookings" },
    { label: "Percentage", value: "percentage" },
    { label: "Last Modified", value: "lastModified" },
] as const;

function updateSelectedTags(value: string[]): void {
    emit("update:selectedTags", value);
}
</script>

<template>
    <q-card class="q-pa-md">
        <div class="row justify-center q-mb-md">
            <div
                class="dialog-pill cursor-pointer"
                role="button"
                aria-label="Close dialog"
                @click="$emit('close')"
            />
        </div>

        <template v-if="availableTags.length > 0">
            <q-select
                :model-value="selectedTags"
                :options="availableTags"
                clear-icon="close"
                multiple
                use-chips
                standout
                rounded
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
                        :model-value="currentSortOption"
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
                {{ currentSortDirection === "desc" ? "Descending" : "Ascending" }}
            </q-item-section>
            <q-item-section side>
                <q-icon
                    :name="currentSortDirection === 'desc' ? 'arrow-sort-down' : 'arrow-sort-up'"
                />
            </q-item-section>
        </q-item>
    </q-card>
</template>

<style scoped>
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
</style>
