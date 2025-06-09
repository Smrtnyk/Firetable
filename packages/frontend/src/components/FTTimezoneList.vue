<script setup lang="ts">
import { refDebounced } from "@vueuse/core";
import { timezones } from "src/helpers/date-utils";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const VIRTUAL_SCROLL_HEIGHT = 300;
const VIRTUAL_SCROLL_ITEM_HEIGHT = 48;
const SEARCH_DEBOUNCE_MS = 300;

const { t } = useI18n();
const searchQuery = ref("");
const debouncedSearchQuery = refDebounced(searchQuery, SEARCH_DEBOUNCE_MS);

const emit = defineEmits<(event: "timezoneSelected", timezone: string) => void>();

const filteredTimezones = computed(function () {
    const query = debouncedSearchQuery.value.toLowerCase();
    return timezones().filter(function (timezone) {
        return timezone.toLowerCase().includes(query);
    });
});

function emitTimezoneSelected(timezone: string): void {
    emit("timezoneSelected", timezone);
}
</script>

<template>
    <div class="timezone-selector">
        <v-text-field
            v-model="searchQuery"
            :placeholder="t('FTTimezoneList.searchTimezonesPlaceholder')"
            variant="outlined"
            density="compact"
            class="mb-4"
            clearable
            hide-details
            :aria-label="t('FTTimezoneList.searchTimezonesAriaLabel')"
        >
            <template #prepend-inner>
                <v-icon icon="fa fa-search" />
            </template>
        </v-text-field>

        <v-virtual-scroll
            :items="filteredTimezones"
            :height="VIRTUAL_SCROLL_HEIGHT"
            :item-height="VIRTUAL_SCROLL_ITEM_HEIGHT"
        >
            <template #default="{ item, index }">
                <v-list-item :key="index" :value="item" @click="emitTimezoneSelected(item)">
                    <v-list-item-title>{{ item }}</v-list-item-title>
                </v-list-item>
                <v-divider v-if="index < filteredTimezones.length - 1" />
            </template>
        </v-virtual-scroll>
    </div>
</template>

<style scoped>
.timezone-selector {
    width: 100%;
}
</style>
