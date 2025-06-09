<template>
    <div class="InventoryImportDialog">
        <v-card-text>
            <FTTabs v-model="activeTab" density="compact" :disabled="loading">
                <v-tab value="file">Import file</v-tab>
                <v-tab value="paste">Paste CSV as text</v-tab>
            </FTTabs>

            <v-divider />

            <FTTabPanels v-model="activeTab" class="mt-4">
                <v-window-item value="file">
                    <div
                        class="upload-area pa-2 text-center"
                        style="cursor: pointer"
                        :class="{ 'upload-area--dragging': isDragging }"
                        @dragenter.prevent="isDragging = true"
                        @dragleave.prevent="isDragging = false"
                        @dragover.prevent
                        @drop.prevent="handleFileDrop"
                        @click="fileInput?.click()"
                    >
                        <v-icon icon="fas fa-file-import" size="48" color="primary" />
                        <div class="text-h6 mt-4">Drop your CSV file here</div>
                        <div class="text-caption mt-1">Or click to upload</div>
                        <input
                            type="file"
                            ref="fileInput"
                            accept=".csv"
                            style="display: none"
                            @change="handleFileSelect"
                        />
                    </div>
                </v-window-item>

                <v-window-item value="paste">
                    <v-textarea
                        v-model="pastedContent"
                        variant="outlined"
                        class="w-full"
                        placeholder="Paste your CSV text here"
                        :disabled="loading"
                        :rows="10"
                    />
                </v-window-item>
            </FTTabPanels>
        </v-card-text>

        <v-card-actions class="justify-end">
            <v-btn
                class="button-gradient"
                rounded="lg"
                :loading="loading"
                :disabled="!canImport || loading"
                @click="handleImport"
            >
                {{ t("Global.submit") }}
            </v-btn>
        </v-card-actions>
    </div>
</template>

<script setup lang="ts">
// Script content is untouched as per your instructions
import FTTabPanels from "src/components/FTTabPanels.vue";
import FTTabs from "src/components/FTTabs.vue";
import { computed, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

interface Props {
    loading?: boolean;
}

const { loading = false } = defineProps<Props>();

const emit = defineEmits<{
    (e: "hide"): void;
    (e: "import", content: string): void;
}>();

const { t } = useI18n();
const activeTab = ref("file");
const pastedContent = ref("");
const isDragging = ref(false);
const fileInput = useTemplateRef<HTMLInputElement>("fileInput");
const selectedFile = ref<File | null>(null);

const canImport = computed(function () {
    if (activeTab.value === "file") {
        return selectedFile.value !== null;
    }
    return pastedContent.value.trim().length > 0;
});

function handleFileDrop(event: DragEvent): void {
    isDragging.value = false;
    const file = event.dataTransfer?.files[0];
    if (file?.type === "text/csv" || file?.name.endsWith(".csv")) {
        selectedFile.value = file;
    }
}

function handleFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
        selectedFile.value = file;
    }
}

async function handleImport(): Promise<void> {
    let content = "";

    if (activeTab.value === "file" && selectedFile.value) {
        content = await selectedFile.value.text();
    } else if (activeTab.value === "paste") {
        content = pastedContent.value;
    }

    if (content.trim()) {
        emit("import", content);
    }
}
</script>

<style lang="scss" scoped>
.upload-area {
    border: 2px dashed rgb(var(--v-theme-primary));
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
        background: rgba(var(--v-theme-primary-rgb), 0.1);
    }

    &--dragging {
        background: rgba(var(--v-theme-primary-rgb), 0.1);
        border-style: solid;
    }
}
</style>
