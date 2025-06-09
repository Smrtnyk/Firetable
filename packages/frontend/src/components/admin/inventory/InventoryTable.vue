<template>
    <div>
        <v-data-table
            :headers="headers"
            :items="props.rows"
            item-value="id"
            :search="localFilter"
            :items-per-page="-1"
            hide-default-footer
            :density="isMobile ? 'compact' : 'default'"
            v-model="selected"
            show-select
            class="ft-card"
            elevation="0"
        >
            <template #top>
                <v-toolbar flat dense class="mb-2">
                    <v-toolbar-title>{{ props.title }}</v-toolbar-title>
                    <v-spacer />
                    <div class="d-flex align-center ga-2" style="min-width: 300px">
                        <FTBtn
                            v-if="hasSelection"
                            color="negative"
                            icon="fa fa-trash"
                            @click="handleBulkDelete"
                        />
                        <v-text-field
                            v-model="localFilter"
                            clearable
                            clear-icon="fas fa-times"
                            placeholder="Search"
                            density="compact"
                            variant="outlined"
                            hide-details
                            append-inner-icon="fas fa-search"
                            class="flex-grow-1"
                        />
                    </div>
                </v-toolbar>
            </template>

            <template #item.volume="{ item }">
                {{ item.volume ? `${item.volume}ml` : "-" }}
            </template>

            <template #item.actions="{ item }">
                <div class="text-end">
                    <FTBtn
                        round
                        icon="fa fa-pencil"
                        @click="emit('edit-item', item)"
                        :alt="`Edit ${item.name}`"
                    />
                    <FTBtn
                        round
                        icon="fa fa-copy"
                        color="primary"
                        @click="emit('copy-item', item)"
                        :alt="`Copy ${item.name}`"
                    />
                    <FTBtn
                        round
                        icon="fa fa-trash"
                        color="negative"
                        @click="emit('delete-item', item)"
                        :alt="`Delete ${item.name}`"
                    />
                </div>
            </template>

            <template #no-data>
                <div class="text-center py-4">No data available.</div>
            </template>
        </v-data-table>
    </div>
</template>

<script setup lang="ts">
import type { InventoryItemDoc } from "@firetable/types";

import FTBtn from "src/components/FTBtn.vue";
import { useScreenDetection } from "src/global-reactives/screen-detection";
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

const { isMobile } = useScreenDetection();

const { t } = useI18n();
const localFilter = ref("");
const selected = ref<InventoryItemDoc[]>([]);

const hasSelection = computed(() => selected.value.length > 0);

const headers = computed(() => [
    { align: "start" as const, key: "name", sortable: true, title: t("Global.name") },
    {
        align: "start" as const,
        key: "mainCategory",
        sortable: true,
        title: t("InventoryTable.mainCategory"),
    },
    {
        align: "start" as const,
        key: "subCategory",
        sortable: true,
        title: t("InventoryTable.subCategory"),
    },
    {
        align: "start" as const,
        key: "quantity",
        sortable: true,
        title: t("InventoryTable.quantity"),
    },
    {
        align: "start" as const,
        key: "volume",
        sortable: true,
        title: t("InventoryTable.volume"),
    },
    {
        align: "start" as const,
        key: "supplier",
        sortable: true,
        title: t("InventoryTable.supplier"),
    },
    {
        align: "end" as const,
        key: "actions",
        sortable: false,
        title: t("Global.actions"),
    },
]);

function handleBulkDelete(): void {
    emit("bulk-delete", selected.value);
    selected.value = [];
}
</script>
