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
import { defineComponent, ref, PropType } from "vue";
import { TableElement } from "src/types/floor";
import { useI18n } from "vue-i18n";

interface Props {
    allReservedTables: TableElement[];
}

// eslint-disable-next-line no-undef
const props = defineProps<Props>();
// eslint-disable-next-line no-undef
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
