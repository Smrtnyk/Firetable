<template>
    <div class="InventoryImportDialog">
        <q-card-section>
            <FTTabs v-model="activeTab" dense :disable="loading">
                <q-tab name="file" label="Import file" />
                <q-tab name="paste" label="Paste CSV as text" />
            </FTTabs>

            <q-separator />

            <FTTabPanels v-model="activeTab" animated class="q-mt-md">
                <q-tab-panel name="file">
                    <div
                        class="upload-area q-pa-sm text-center cursor-pointer"
                        :class="{ 'upload-area--dragging': isDragging }"
                        @dragenter.prevent="isDragging = true"
                        @dragleave.prevent="isDragging = false"
                        @dragover.prevent
                        @drop.prevent="handleFileDrop"
                        @click="$refs.fileInput?.click()"
                    >
                        <q-icon name="import" size="48px" color="primary" />
                        <div class="text-h6 q-mt-md">Drop your CSV file here</div>
                        <div class="text-caption q-mt-sm">Or click to upload</div>
                        <input
                            type="file"
                            ref="fileInput"
                            accept=".csv"
                            style="display: none"
                            @change="handleFileSelect"
                        />
                    </div>
                </q-tab-panel>

                <!-- Paste Content Panel -->
                <q-tab-panel name="paste" class="q-pa-none">
                    <q-input
                        v-model="pastedContent"
                        type="textarea"
                        standout
                        class="w-full"
                        placeholder="Paste your CSV text here"
                        :disable="loading"
                        :rows="10"
                    />
                </q-tab-panel>
            </FTTabPanels>
        </q-card-section>

        <q-card-actions align="right">
            <q-btn
                :label="t('Global.submit')"
                rounded
                class="button-gradient"
                :loading="loading"
                :disable="!canImport || loading"
                @click="handleImport"
            />
        </q-card-actions>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import FTTabs from "src/components/FTTabs.vue";
import FTTabPanels from "src/components/FTTabPanels.vue";

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
const fileInput = ref<HTMLInputElement>();
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
    border: 2px dashed var(--q-primary);
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
        background: rgba(var(--q-primary), 0.1);
    }

    &--dragging {
        background: rgba(var(--q-primary), 0.1);
        border-style: solid;
    }
}
</style>
