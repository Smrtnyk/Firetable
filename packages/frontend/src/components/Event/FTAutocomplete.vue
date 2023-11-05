<template>
    <div class="FTAutocomplete">
        <q-select
            fill-input
            hide-selected
            use-input
            v-model="searchTerm"
            :label="isMobile ? '' : t(`FTAutocomplete.label`)"
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
import { isMobile } from "src/global-reactives/is-mobile";

interface Props {
    allReservedTables: BaseTable[];
}

const props = defineProps<Props>();
const emit = defineEmits(["found", "clear"]);
const { t } = useI18n();

const options = ref(getNamesFromTables(props.allReservedTables));
const searchTerm = ref("");

function getNamesFromTables(tables: BaseTable[]): { label: string; value: string }[] {
    return tables.map((table) => {
        return {
            label: createTableLabel(table),
            value: table.reservation!.guestName,
        };
    });
}

function createTableLabel(table: BaseTable): string {
    // @ts-expect-error -- floor is custom prop on canvas set by us
    return `${table.reservation!.guestName} (${table.label} on ${table.canvas?.floor.name})`;
}

function findSearchedTable(inputVal: string | { value: string }): BaseTable[] {
    const val = typeof inputVal === "string" ? inputVal : inputVal.value;
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

function filterFn(val: string, update: any): void {
    update(() => {
        const loweredVal = val.toLowerCase();
        const filteredTables = findSearchedTable(val);
        options.value = filteredTables
            .map((table) => ({
                label: createTableLabel(table),
                value: table.reservation!.guestName,
            }))
            .filter((option) => option.value.toLowerCase().includes(loweredVal));
    });
}

watch(searchTerm, (newTerm) => {
    if (newTerm) {
        const found = findSearchedTable(newTerm);
        emit("found", found);
    }
});

function setModel(val: string): void {
    searchTerm.value = val;
}
</script>
