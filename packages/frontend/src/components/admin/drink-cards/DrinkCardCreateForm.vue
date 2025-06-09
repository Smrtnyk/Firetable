<script setup lang="ts">
import type { CreateDrinkCardPayload, DrinkCardElement, InventoryItemDoc } from "@firetable/types";
import type { VForm } from "vuetify/components/VForm";

import { isCustomDrinkCard, isPDFDrinkCard } from "@firetable/types";
import { noEmptyString, validateForm } from "src/helpers/form-rules";
import { processImage } from "src/helpers/process-image";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

import DrinkCardSectionManager from "./DrinkCardSectionManager.vue";

interface FormSubmitData {
    card: CreateDrinkCardPayload;
    pdfFile?: File | undefined;
}

interface Props {
    cardToEdit?: CreateDrinkCardPayload;
    inventoryItems: InventoryItemDoc[];
}

const props = defineProps<Props>();
const { t } = useI18n();
const formRef = useTemplateRef<VForm>("formRef");
const form = ref<CreateDrinkCardPayload>(getInitialForm());
const emit = defineEmits<{
    submit: [FormSubmitData];
}>();
const backgroundFile = ref<File | undefined>();
const fileInput = ref<HTMLInputElement | undefined>();
const pdfFile = ref<File>();

function getInitialForm(): CreateDrinkCardPayload {
    if (props.cardToEdit) {
        return { ...props.cardToEdit };
    }

    return {
        backgroundImage: "",
        description: "",
        elements: [],
        isActive: true,
        name: "",
        organisationId: "",
        propertyId: "",
        showItemDescription: false,
        showLogo: true,
        type: "custom",
    };
}

async function onSubmit(): Promise<void> {
    const isValid = await validateForm(formRef.value);
    if (!isValid) {
        return;
    }

    if (isCustomDrinkCard(form.value) && form.value.elements.length === 0) {
        showErrorMessage("Drink card should have at least one section!");
        return;
    }

    if (isPDFDrinkCard(form.value) && !pdfFile.value && !form.value.pdfUrl) {
        showErrorMessage("PDF drink card requires PDF file to be uploaded!");
        return;
    }

    emit("submit", {
        card: form.value,
        pdfFile: pdfFile.value,
    });
}

const imageProcessingOptions = {
    acceptedTypes: ["image/jpeg", "image/png"],
    // 300KB
    maxFileSize: 300 * 1024,
    maxHeight: 1080,
    maxWidth: 1920,
    quality: 0.8,
};

function handleElementAdd(element: DrinkCardElement): void {
    if (isCustomDrinkCard(form.value)) {
        form.value.elements.push(element);
    }
}

function handleElementRemove(index: number): void {
    if (isCustomDrinkCard(form.value)) {
        form.value.elements.splice(index, 1);
    }
}

async function handleImageUpload(event: Event): Promise<void> {
    if (!isCustomDrinkCard(form.value)) {
        return;
    }

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
        return;
    }

    try {
        form.value.backgroundImage = await processImage(file, imageProcessingOptions);
    } catch (error) {
        showErrorMessage(t("PageAdminPropertyDrinkCards.imageProcessingError"));
    } finally {
        input.value = "";
    }
}

function handlePDFUpload(file: File | File[]): void {
    if (!file) {
        return;
    }

    const fileValue = Array.isArray(file) ? file[0] : file;

    if (fileValue.type !== "application/pdf") {
        showErrorMessage(t("PageAdminPropertyDrinkCards.invalidFileType"));
        return;
    }

    if (fileValue.size > 5 * 1024 * 1024) {
        showErrorMessage("PDF file is too large, 5MB is maximum size limit!");
        return;
    }

    pdfFile.value = fileValue;
}

function removeImage(): void {
    if (isCustomDrinkCard(form.value)) {
        form.value.backgroundImage = "";
        backgroundFile.value = undefined;
    }
}

function triggerFileInput(): void {
    fileInput.value?.click();
}
</script>

<template>
    <v-form ref="formRef" @submit.prevent="onSubmit">
        <v-row dense>
            <v-col cols="12">
                <v-btn-toggle v-model="form.type" mandatory color="primary" divided class="w-100">
                    <v-btn value="custom" class="flex-grow-1">
                        <v-icon start>fas fa-pencil</v-icon>
                        Custom
                    </v-btn>
                    <v-btn value="pdf" class="flex-grow-1">
                        <v-icon start>fas fa-file-pdf</v-icon>
                        PDF
                    </v-btn>
                </v-btn-toggle>
            </v-col>

            <v-col cols="12">
                <v-switch
                    v-model="form.isActive"
                    :label="t('PageAdminPropertyDrinkCards.isActiveLabel')"
                    color="primary"
                />
            </v-col>

            <v-col cols="12">
                <v-text-field
                    v-model="form.name"
                    :label="t('PageAdminPropertyDrinkCards.cardNameLabel')"
                    variant="outlined"
                    :rules="[noEmptyString('Drink card name is required')]"
                />
            </v-col>

            <template v-if="isCustomDrinkCard(form)">
                <v-col cols="12">
                    <v-switch
                        v-model="form.showItemDescription as boolean"
                        label="Show item description?"
                        color="primary"
                    />
                </v-col>

                <v-col cols="12">
                    <v-switch
                        v-model="form.showLogo"
                        label="Show venue logo if exists?"
                        color="primary"
                    />
                </v-col>

                <v-col cols="12" md="6">
                    <div class="text-subtitle-2 mb-2">
                        {{ t("PageAdminPropertyDrinkCards.cardDescriptionLabel") }}
                    </div>
                    <v-textarea
                        v-model="form.description"
                        variant="outlined"
                        rows="6"
                        placeholder="Enter description..."
                    />
                </v-col>

                <v-col cols="12" md="6">
                    <div class="text-subtitle-2 mb-2">Optional background image</div>
                    <v-responsive class="preview-container" :aspect-ratio="1">
                        <template v-if="form.backgroundImage">
                            <v-img :src="form.backgroundImage" class="preview-image" alt="" cover />
                            <div class="position-absolute" style="top: 8px; right: 8px">
                                <v-btn variant="text" icon color="error" @click="removeImage">
                                    <v-icon>fas fa-close</v-icon>
                                </v-btn>
                            </div>
                        </template>
                        <template v-else>
                            <div
                                class="upload-placeholder d-flex flex-column align-center justify-center h-100"
                            >
                                <v-btn color="secondary" rounded @click="triggerFileInput">
                                    <v-icon start>fas fa-file-import</v-icon>
                                    Click to upload
                                </v-btn>
                            </div>
                        </template>
                        <input
                            type="file"
                            ref="fileInput"
                            accept="image/jpeg,image/png"
                            class="d-none"
                            @change="handleImageUpload"
                        />
                    </v-responsive>
                </v-col>
            </template>

            <v-col cols="12">
                <v-divider />
            </v-col>

            <v-col cols="12" v-if="isCustomDrinkCard(form)">
                <DrinkCardSectionManager
                    v-model:elements="form.elements"
                    :inventory-items="inventoryItems"
                    @add="handleElementAdd"
                    @remove="handleElementRemove"
                />
            </v-col>

            <v-col cols="12" v-if="isPDFDrinkCard(form)">
                <div class="pdf-upload-container">
                    <v-file-input
                        v-model="pdfFile as File"
                        accept=".pdf"
                        label="Choose a PDF file"
                        variant="outlined"
                        show-size
                        @update:model-value="handlePDFUpload"
                    >
                        <template #prepend-inner>
                            <v-icon>fas fa-file-pdf</v-icon>
                        </template>
                    </v-file-input>

                    <div v-if="form.pdfUrl" class="current-pdf mt-2">
                        <v-btn variant="text" :href="form.pdfUrl" target="_blank">
                            <v-icon start>fas fa-eye</v-icon>
                            View current PDF
                        </v-btn>
                    </div>
                </div>
            </v-col>

            <v-col cols="12">
                <v-divider />
            </v-col>

            <v-col cols="12" class="d-flex justify-end">
                <v-btn type="submit" color="primary" rounded>
                    {{ t("Global.submit") }}
                </v-btn>
            </v-col>
        </v-row>
    </v-form>
</template>

<style lang="scss" scoped>
.preview-container {
    max-width: 500px;
    position: relative;
    min-height: 169px;
    border-radius: 8px;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));

    .preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .upload-placeholder {
        border: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity));
        border-radius: 8px;
    }
}
</style>
