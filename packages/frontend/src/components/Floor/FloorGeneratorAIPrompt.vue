<script setup lang="ts">
import type { FloorEditor } from "@firetable/floor-creator";

import { generateFloorPlanFromImage } from "src/ai-services/floor-plan-generator";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { AppLogger } from "src/logger/FTLogger";
import { ref, useTemplateRef } from "vue";

const { floorInstance } = defineProps<{
    floorInstance: FloorEditor;
}>();

const emit = defineEmits<(e: "done") => void>();
const selectedAIFile = ref<File | null>(null);
const aiFileInputRef = useTemplateRef<HTMLInputElement>("aiFileInputRef");
const aiImagePreview = ref("");
const isProcessingAI = ref(false);

function onAIFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (file?.type.startsWith("image/")) {
        selectedAIFile.value = file;
        const reader = new FileReader();
        reader.addEventListener("load", function (e) {
            aiImagePreview.value = e.target?.result as string;
        });
        reader.readAsDataURL(file);
    }
}

async function processAIFloorPlan(): Promise<void> {
    if (!selectedAIFile.value) {
        return;
    }

    isProcessingAI.value = true;

    try {
        const result = await generateFloorPlanFromImage(selectedAIFile.value);
        floorInstance.clear();
        floorInstance.updateDimensions(result.floorDimensions.width, result.floorDimensions.height);

        for (const element of result.elements) {
            try {
                const { angle = 0, height, label = "", width, x, y } = element.properties;
                const elementData = {
                    angle,
                    height,
                    label,
                    tag: element.type,
                    width,
                    x,
                    y,
                };

                floorInstance.addElement(elementData);
            } catch (err) {
                AppLogger.error("Failed to add element:", element, err);
            }
        }

        selectedAIFile.value = null;
        aiImagePreview.value = "";
        emit("done");
    } catch (error) {
        showErrorMessage("Failed to process floor plan image. Please try again.");
        AppLogger.error("AI floor plan generation failed:", error);
    } finally {
        isProcessingAI.value = false;
    }
}

function removeSelectedImage(): void {
    selectedAIFile.value = null;
    aiImagePreview.value = "";
    // Reset file input so the same file can be selected again if removed
    if (aiFileInputRef.value) {
        aiFileInputRef.value.value = "";
    }
}
</script>

<template>
    <div class="ai-dialog-card">
        <v-card-text class="ai-dialog-content">
            <div v-if="!selectedAIFile" class="upload-area">
                <v-btn
                    variant="text"
                    color="primary"
                    prepend-icon="fas fa-cloud-upload-alt"
                    @click="aiFileInputRef?.click()"
                    class="upload-btn"
                    size="large"
                >
                    Choose Floor Plan Image
                </v-btn>
                <div class="upload-hint">
                    Upload a floor plan image (hand-drawn, professional plan, or photo)
                </div>
                <div class="upload-formats">Supported formats: JPG, PNG, GIF, WebP</div>
            </div>

            <div v-else class="preview-area">
                <img :src="aiImagePreview" alt="Floor plan preview" class="preview-image" />
                <v-btn
                    variant="text"
                    color="error"
                    prepend-icon="fas fa-times"
                    @click="removeSelectedImage"
                    class="mt-4"
                >
                    Remove
                </v-btn>
            </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="justify-end pa-4">
            <v-btn
                variant="flat"
                color="primary"
                :loading="isProcessingAI"
                :disabled="!selectedAIFile || isProcessingAI"
                @click="processAIFloorPlan"
            >
                <template #loader>
                    <v-progress-circular indeterminate size="20" width="2" class="mr-2" />
                    Processing...
                </template>
                Generate Floor Plan
            </v-btn>
        </v-card-actions>

        <input
            ref="aiFileInputRef"
            type="file"
            @change="onAIFileSelected"
            style="display: none"
            accept="image/*"
        />
    </div>
</template>

<style scoped lang="scss">
.ai-dialog-card {
    height: 90vh;
    display: flex;
    flex-direction: column;
}

.ai-dialog-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
}

.upload-area {
    text-align: center;
    padding: 60px;
    border: 3px dashed rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 16px;

    .v-theme--dark & {
        background-color: rgb(var(--v-theme-surface));
    }

    .upload-btn {
        margin-bottom: 24px;
    }

    .upload-hint {
        font-size: 16px;
        color: rgb(var(--v-theme-on-surface-variant));
        margin-bottom: 8px;
    }

    .upload-formats {
        font-size: 14px;
        color: rgb(var(--v-theme-on-surface-variant));
    }
}

.preview-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100%;

    .preview-image {
        max-width: 100%;
        max-height: calc(100% - 60px);
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

        .v-theme--dark & {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }
    }
}

.v-card-actions.justify-end {
    padding: 16px;
}
</style>
