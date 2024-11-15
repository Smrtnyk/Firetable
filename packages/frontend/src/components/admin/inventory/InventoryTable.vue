<template>
    <div>
        <q-input
            standout
            rounded
            v-model="localFilter"
            placeholder="Search"
            class="q-mt-md q-mb-md"
        >
            <template #append>
                <q-icon name="search" />
            </template>
        </q-input>

        <q-table
            flat
            :rows="props.rows"
            :columns="columns"
            row-key="id"
            :filter="localFilter"
            :rows-per-page-options="[0]"
        >
            <template #body-cell-actions="{ row }">
                <q-td align="right">
                    <q-btn
                        flat
                        round
                        icon="pencil"
                        @click="emit('edit-item', row)"
                        :alt="`Edit ${row.name}`"
                    />
                    <q-btn
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
import { ref } from "vue";
import { InventoryItemType } from "@firetable/types";
import { useI18n } from "vue-i18n";

interface Props {
    rows: InventoryItemDoc[];
}

const props = defineProps<Props>();
const emit = defineEmits<(e: "delete-item" | "edit-item", item: InventoryItemDoc) => void>();

const { t } = useI18n();

const localFilter = ref("");

const columns = [
    { name: "name", label: t("Global.name"), field: "name", sortable: true },
    {
        name: "type",
        label: t("Global.type"),
        field: "type",
        sortable: true,
        format: getTypeLabel,
    },
    { name: "category", label: t("Global.category"), field: "category", sortable: true },
    {
        name: "price",
        label: t("Global.price"),
        field: "price",
        sortable: true,
        format: (val: number) => `$${val.toFixed(2)}`,
    },
    { name: "quantity", label: t("InventoryTable.quantity"), field: "quantity", sortable: true },
    { name: "actions", label: t("Global.actions"), field: "actions" },
];

function getTypeLabel(): InventoryItemType {
    return InventoryItemType.DRINK;
}
</script>
