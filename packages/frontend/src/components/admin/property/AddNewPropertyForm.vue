<script setup lang="ts">
import type { CreatePropertyPayload, PropertyDoc, UpdatePropertyPayload } from "@firetable/types";
import type { VForm } from "vuetify/components";

import { isString } from "es-toolkit";
import FTBtn from "src/components/FTBtn.vue";
import { minLength, validOptionalURL } from "src/helpers/form-rules";
import { processImage } from "src/helpers/process-image";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { computed, ref, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";

const enum InputMethod {
    FILE = "file",
    URL = "url",
}

interface Emits {
    (eventName: "create", payload: CreatePropertyPayload): void;
    (eventName: "update", payload: UpdatePropertyPayload): void;
}

interface Props {
    organisationId: string;
    propertyDoc?: PropertyDoc | undefined;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useI18n();
const inputMethod = ref<InputMethod>(InputMethod.FILE);

const form = ref<CreatePropertyPayload>({
    img: "",
    name: "",
    organisationId: props.organisationId,
});
const imageUrl = computed({
    get() {
        return isString(form.value.img) ? form.value.img : "";
    },
    set(val: string) {
        form.value.img = val || "";
    },
});
const createPropertyForm = useTemplateRef<VForm>("createPropertyForm");
const fileInput = useTemplateRef<HTMLInputElement>("fileInput");

const imageProcessingOptions = {
    acceptedTypes: ["image/png", "image/jpeg", "image/svg+xml"],
    maxFileSize: 100 * 1024,
    maxHeight: 300,
    maxWidth: 300,
    preserveTransparency: true,
    quality: 0.9,
};

const propertyRules = [minLength(t("AddNewPropertyForm.propertyNameLengthValidationMessage"), 3)];
const imgUrlRules = [validOptionalURL()];

watch(
    () => props.propertyDoc,
    function (newVal) {
        if (!newVal) {
            return;
        }

        form.value = {
            // This will be a URL string for existing properties
            img: newVal.img ?? "",
            name: newVal.name,
            organisationId: props.organisationId,
        };
        // If an existing image URL is present, default to the URL input method
        if (newVal.img) {
            inputMethod.value = InputMethod.URL;
        }
    },
    { immediate: true },
);

function handleFileDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
        const file = files[0];
        processDroppedFile(file);
    }
}

async function handleImageUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
        const processedImage = await processImage(file, imageProcessingOptions);

        form.value.img = {
            dataUrl: processedImage,
            type: file.type,
        };
    } catch (error) {
        showErrorMessage(t("AddNewPropertyForm.imageProcessingError"));
    } finally {
        if (input) {
            input.value = "";
        }
    }
}

async function processDroppedFile(file: File): Promise<void> {
    try {
        const processedImage = await processImage(file, imageProcessingOptions);
        form.value.img = {
            dataUrl: processedImage,
            type: file.type,
        };
    } catch (error) {
        showErrorMessage(t("AddNewPropertyForm.imageProcessingError"));
    }
}

function removeImage(): void {
    form.value.img = "";
}

async function submit(): Promise<void> {
    const { valid } = (await createPropertyForm.value?.validate()) ?? { valid: false };
    if (!valid) {
        return;
    }

    if (props.propertyDoc) {
        emit("update", {
            ...form.value,
            id: props.propertyDoc.id,
        });
    } else {
        emit("create", form.value);
    }
}

function triggerFileInput(): void {
    fileInput.value?.click();
}
</script>

<template>
    <v-card-text>
        <v-form
            ref="createPropertyForm"
            greedy
            class="d-flex flex-column"
            style="gap: 1.25rem"
            @submit.prevent="submit"
        >
            <v-text-field
                v-model="form.name"
                :label="t('AddNewPropertyForm.propertyNameLabel')"
                variant="outlined"
                autofocus
                :rules="propertyRules"
            />

            <div class="brand-image">
                <div class="d-flex align-center mb-2">
                    <div class="text-subtitle-1">
                        {{ t("AddNewPropertyForm.propertyBrandImageLabel") }}
                    </div>
                    <v-tooltip location="top">
                        <template #activator="{ props: tooltipProps }">
                            <v-btn
                                v-bind="tooltipProps"
                                variant="text"
                                icon="fas fa-info-circle"
                                size="x-small"
                                class="ml-1"
                            />
                        </template>
                        <span>
                            {{ t("AddNewPropertyForm.brandImageTooltip") }}
                        </span>
                    </v-tooltip>
                </div>

                <v-btn-toggle v-model="inputMethod" mandatory divided class="w-100 mb-4">
                    <v-btn :value="InputMethod.FILE" class="flex-grow-1">
                        {{ t("AddNewPropertyForm.uploadFileButtonLabel") }}
                    </v-btn>
                    <v-btn :value="InputMethod.URL" class="flex-grow-1">
                        {{ t("AddNewPropertyForm.pasteUrlButtonLabel") }}
                    </v-btn>
                </v-btn-toggle>

                <v-text-field
                    v-if="inputMethod === InputMethod.URL"
                    v-model="imageUrl"
                    :label="t('AddNewPropertyForm.imageUrlLabel')"
                    variant="outlined"
                    :rules="imgUrlRules"
                    clearable
                    @click:clear="removeImage"
                />

                <div
                    v-if="inputMethod === InputMethod.FILE"
                    class="preview-container mt-4 ft-card"
                    @click="triggerFileInput"
                    @dragover.prevent
                    @drop.prevent="handleFileDrop"
                >
                    <v-responsive :aspect-ratio="1">
                        <v-img
                            v-if="form.img"
                            :src="isString(form.img) ? form.img : form.img.dataUrl"
                            class="preview-image"
                            cover
                        >
                            <div class="absolute-top-right">
                                <FTBtn
                                    variant="text"
                                    icon="fas fa-times"
                                    @click.stop="removeImage"
                                />
                            </div>
                        </v-img>
                        <div v-else class="upload-placeholder">
                            <v-icon icon="fas fa-file-import" size="large" class="mb-2" />
                            <div>{{ t("AddNewPropertyForm.imageUploadPlaceholder") }}</div>
                        </div>
                    </v-responsive>
                </div>

                <input
                    ref="fileInput"
                    type="file"
                    accept=".png,.svg,.jpeg,.jpg"
                    class="hidden"
                    @change="handleImageUpload"
                />
            </div>
        </v-form>
    </v-card-text>

    <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn rounded="lg" class="button-gradient" size="large" @click="submit">
            {{ t("Global.submit") }}
        </v-btn>
    </v-card-actions>
</template>

<style lang="scss" scoped>
.hidden {
    display: none;
}

.preview-container {
    cursor: pointer;
    border: 2px dashed rgba(0, 0, 0, 0.12);
    border-radius: 4px;
    position: relative;

    .upload-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
    }

    .absolute-top-right {
        position: absolute;
        top: 4px;
        right: 4px;
    }
}
</style>
