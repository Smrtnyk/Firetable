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
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { BaseTable } from "@firetable/floor-creator";
import { isNumber } from "@firetable/utils";

interface Props {
    allReservedTables: BaseTable[];
}

const props = defineProps<Props>();
const emit = defineEmits(["found", "clear"]);
const options = ref(tablesToNames(props.allReservedTables));

const searchTerm = ref("");
const { t } = useI18n();

function tablesToNames(tables: BaseTable[]) {
    return tables.map((table) => {
        return table.reservation!.guestName;
    });
}

function filterFn(val: string, update: any) {
    update(() => {
        if (!val || isNumber(val)) {
            options.value = tablesToNames(props.allReservedTables);
            emit("clear");
            return;
        }

        const tokens = val.toLowerCase().split(/\s+/);

        const found = props.allReservedTables.filter((table) => {
            const guestName = table.reservation!.guestName;
            const normalizedGuestName = guestName.toLowerCase();
            const guestNameTokens = normalizedGuestName.split(/\s+/);

            return tokens.some((token) =>
                guestNameTokens.some((nameToken) => nameToken.includes(token)),
            );
        });

        options.value = tablesToNames(found);
        emit("found", found);
    });
}

function setModel(val: string) {
    searchTerm.value = val;
}
</script>
