<template>
    <div>
        <q-table
            flat
            :title="props.title"
            :rows="props.rows"
            :columns="columns"
            row-key="id"
            :filter="localFilter"
            :rows-per-page-options="[0]"
            hide-pagination
            wrap-cells
            :dense="isMobile"
            v-model:selected="selected"
            selection="multiple"
            class="ft-card"
        >
            <template #top-right>
                <div class="row items-center justify-between q-gutter-xs">
                    <div v-if="hasSelection">
                        <FTBtn color="negative" icon="trash" @click="handleBulkDelete" />
                    </div>

                    <q-input
                        clear-icon="close"
                        standout
                        rounded
                        v-model="localFilter"
                        clearable
                        placeholder="Search"
                        class="col-grow"
                        dense
                    >
                        <template #append>
                            <q-icon name="search" />
                        </template>
                    </q-input>
                </div>
            </template>

            <template #body-cell-actions="{ row }">
                <q-td align="right">
                    <FTBtn
                        flat
                        round
                        icon="pencil"
                        @click="emit('edit-item', row)"
                        :alt="`Edit ${row.name}`"
                    />
                    <FTBtn
                        flat
                        round
                        icon="copy"
                        color="primary"
                        @click="emit('copy-item', row)"
                        :alt="`Copy ${row.name}`"
                    />
                    <FTBtn
                        flat
                        round
                        icon="trash"
                        color="negative"
                        @click="emit('delete-item', row)"
                        :alt="`Delete ${row.name}`"
                    />
                </q-td>
            </template>
        </q-table>
    </div>
</template>

<script setup lang="ts">
import type { InventoryItemDoc } from "@firetable/types";

import FTBtn from "src/components/FTBtn.vue";
import { isMobile } from "src/global-reactives/screen-detection";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

interface Props {
    rows: InventoryItemDoc[];
    title: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    (e: "copy-item" | "delete-item" | "edit-item", item: InventoryItemDoc): void;
    (e: "bulk-delete", items: InventoryItemDoc[]): void;
}>();

const { t } = useI18n();
const localFilter = ref("");
const selected = ref<InventoryItemDoc[]>([]);

const hasSelection = computed(() => selected.value.length > 0);

const columns = [
    {
        field: "selection",
        label: "",
        name: "selection",
        sortable: false,
    },
    { field: "name", label: t("Global.name"), name: "name", sortable: true },
    {
        field: "mainCategory",
        label: t("InventoryTable.mainCategory"),
        name: "mainCategory",
        sortable: true,
    },
    {
        field: "subCategory",
        label: t("InventoryTable.subCategory"),
        name: "subCategory",
        sortable: true,
    },
    { field: "quantity", label: t("InventoryTable.quantity"), name: "quantity", sortable: true },
    {
        field: "volume",
        format(val: number) {
            return val ? `${val}ml` : "-";
        },
        label: t("InventoryTable.volume"),
        name: "volume",
        sortable: true,
    },
    { field: "supplier", label: t("InventoryTable.supplier"), name: "supplier", sortable: true },
    { field: "actions", label: t("Global.actions"), name: "actions" },
];

function handleBulkDelete(): void {
    emit("bulk-delete", selected.value);
    selected.value = [];
}
</script>
