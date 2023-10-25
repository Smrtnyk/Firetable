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
import { isNumber } from "@firetable/utils";

interface Props {
    allReservedTables: BaseTable[];
}

const props = defineProps<Props>();
const emit = defineEmits(["found", "clear"]);

const searchTerm = ref("");
const { t } = useI18n();

function onTablesSearch(val: string | number | null) {
    if (!val || isNumber(val)) {
        emit("clear");
        return;
    }

    const tokens = val.toLowerCase().split(/\s+/);

    const found = props.allReservedTables.filter((table) => {
        if (!table.reservation) return false;
        const normalizedGuestName = table.reservation.guestName.toLowerCase();
        const guestNameTokens = normalizedGuestName.split(/\s+/);

        return tokens.every((token) => guestNameTokens.includes(token));
    });

    emit("found", found);
}
</script>
