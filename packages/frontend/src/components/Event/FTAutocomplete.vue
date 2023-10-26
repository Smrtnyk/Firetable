<template>
    <div class="FTAutocomplete">
        <q-select
            fill-input
            hide-selected
            use-input
            v-model="searchTerm"
            :label="t(`FTAutocomplete.label`)"
            clearable
            clear-icon="close"
            dense
            standout
            rounded
            :debounce="300"
            @input-value="setModel"
            @filter="filterFn"
            @clear="() => emit('clear')"
            :options="options"
        >
            <template #prepend>
                <q-icon name="search" />
            </template>

            <template #no-option>
                <q-item>
                    <q-item-section class="text-grey"> No results </q-item-section>
                </q-item>
            </template>
        </q-select>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { BaseTable } from "@firetable/floor-creator";
import { isNumber } from "@firetable/utils";

interface Props {
    allReservedTables: BaseTable[];
}

const props = defineProps<Props>();
const emit = defineEmits(["found", "clear"]);
const { t } = useI18n();

const options = ref(getNamesFromTables(props.allReservedTables));
const searchTerm = ref("");

function getNamesFromTables(tables: BaseTable[]) {
    return tables.map((table) => table.reservation!.guestName);
}

function findSearchedTable(val: string) {
    const tokens = val.toLowerCase().split(/\s+/);

    return props.allReservedTables.filter((table) => {
        const { guestName } = table.reservation!;
        const normalizedGuestName = guestName.toLowerCase();
        const guestNameTokens = normalizedGuestName.split(/\s+/);

        return tokens.some((token) =>
            guestNameTokens.some((nameToken) => nameToken.includes(token)),
        );
    });
}

function filterFn(val: string, update: any) {
    update(() => {
        options.value =
            !val || isNumber(val)
                ? getNamesFromTables(props.allReservedTables)
                : getNamesFromTables(findSearchedTable(val));
    });
}

watch(searchTerm, (newTerm) => {
    if (newTerm) {
        const found = findSearchedTable(newTerm);
        emit("found", found);
    }
});

function setModel(val: string) {
    searchTerm.value = val;
}
</script>
