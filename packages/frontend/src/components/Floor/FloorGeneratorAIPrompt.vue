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
const aiFileInputRef = useTemplateRef("aiFileInputRef");
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
}
</script>

<template>
    <div class="ai-dialog-card">
        <q-card-section class="ai-dialog-content">
            <div v-if="!selectedAIFile" class="upload-area">
                <q-btn
                    flat
                    color="primary"
                    icon="fa fa-cloud-upload"
                    label="Choose Floor Plan Image"
                    @click="aiFileInputRef?.click()"
                    class="upload-btn"
                />
                <div class="upload-hint">
                    Upload a floor plan image (hand-drawn, professional plan, or photo)
                </div>
                <div class="upload-formats">Supported formats: JPG, PNG, GIF, WebP</div>
            </div>

            <div v-else class="preview-area">
                <img :src="aiImagePreview" alt="Floor plan preview" class="preview-image" />
                <q-btn
                    flat
                    color="negative"
                    icon="fa fa-times"
                    label="Remove"
                    @click="removeSelectedImage"
                    class="q-mt-md"
                />
            </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
            <q-btn
                unelevated
                color="primary"
                label="Generate Floor Plan"
                :loading="isProcessingAI"
                :disabled="!selectedAIFile || isProcessingAI"
                @click="processAIFloorPlan"
            >
                <template v-slot:loading>
                    <q-spinner-gears class="on-left" />
                    Processing...
                </template>
            </q-btn>
        </q-card-actions>

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
    border: 3px dashed $grey-4;
    border-radius: 16px;
    background: $grey-1;

    .body--dark & {
        border-color: $grey-8;
        background: $dark;
    }

    .upload-btn {
        font-size: 18px;
        padding: 16px 32px;
        margin-bottom: 24px;
    }

    .upload-hint {
        font-size: 16px;
        color: $grey-7;
        margin-bottom: 8px;

        .body--dark & {
            color: $grey-5;
        }
    }

    .upload-formats {
        font-size: 14px;
        color: $grey-6;

        .body--dark & {
            color: $grey-6;
        }
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

        .body--dark & {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }
    }
}
</style>
