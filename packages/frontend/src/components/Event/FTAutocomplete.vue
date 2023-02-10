<template>
    <div class="FTAutocomplete">
        <q-input
            v-model="searchTerm"
            :label="t(`FTAutocomplete.label`)"
            clearable
            clear-icon="close"
            dense
            standout
            rounded
            :debounce="500"
            @update:model-value="onTablesSearch"
            @clearlear="() => emit('clear')"
        >
            <template #prepend>
                <q-icon name="search" />
            </template>
        </q-input>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { BaseTable } from "@firetable/floor-creator";

interface Props {
    allReservedTables: BaseTable[];
}

const props = defineProps<Props>();
const emit = defineEmits(["found", "clear"]);

const searchTerm = ref("");
const { t } = useI18n();

function onTablesSearch(val: string) {
    if (!val) {
        emit("clear");
        return;
    }

    const found = props.allReservedTables.filter((table) => {
        if (!table.reservation) return false;
        const normalizedGuestName = table.reservation.guestName; // NOSONAR
        const normalizedVal = val.toLowerCase();
        return normalizedGuestName.startsWith(normalizedVal);
    });

    emit("found", found);
}
</script>
