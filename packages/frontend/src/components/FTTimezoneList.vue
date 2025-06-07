<script setup lang="ts">
import { timezones } from "src/helpers/date-utils";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const searchQuery = ref("");
const emit = defineEmits<(event: "timezoneSelected", timezone: string) => void>();

function emitTimezoneSelected(timezone: string): void {
    emit("timezoneSelected", timezone);
}

function getFilteredTimezones(): string[] {
    const query = searchQuery.value.toLowerCase();
    return timezones().filter(function (timezone) {
        return timezone.toLowerCase().includes(query);
    });
}
</script>

<template>
    <div class="timezone-selector">
        <q-input
            v-model="searchQuery"
            :placeholder="t('FTTimezoneList.searchTimezonesPlaceholder')"
            outlined
            dense
            class="q-mb-md"
            :debounce="300"
            :aria-label="t('FTTimezoneList.searchTimezonesAriaLabel')"
        >
            <template #prepend>
                <q-icon name="fa fa-search" />
            </template>
        </q-input>

        <q-virtual-scroll
            :items="getFilteredTimezones()"
            style="height: 300px"
            :virtual-scroll-item-size="48"
        >
            <template #default="{ item: timezone, index }">
                <q-item :key="index" clickable v-ripple @click="emitTimezoneSelected(timezone)">
                    <q-item-section>
                        <q-item-label>{{ timezone }}</q-item-label>
                    </q-item-section>
                </q-item>
            </template>
        </q-virtual-scroll>
    </div>
</template>
