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
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { isMobile } from "src/global-reactives/screen-detection";
import FTBtn from "src/components/FTBtn.vue";

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
        name: "selection",
        label: "",
        field: "selection",
        sortable: false,
    },
    { name: "name", label: t("Global.name"), field: "name", sortable: true },
    {
        name: "mainCategory",
        label: t("InventoryTable.mainCategory"),
        field: "mainCategory",
        sortable: true,
    },
    {
        name: "subCategory",
        label: t("InventoryTable.subCategory"),
        field: "subCategory",
        sortable: true,
    },
    { name: "quantity", label: t("InventoryTable.quantity"), field: "quantity", sortable: true },
    {
        name: "volume",
        label: t("InventoryTable.volume"),
        field: "volume",
        sortable: true,
        format: (val: number) => (val ? `${val}ml` : "-"),
    },
    { name: "supplier", label: t("InventoryTable.supplier"), field: "supplier", sortable: true },
    { name: "actions", label: t("Global.actions"), field: "actions" },
];

function handleBulkDelete(): void {
    emit("bulk-delete", selected.value);
    selected.value = [];
}
</script>
