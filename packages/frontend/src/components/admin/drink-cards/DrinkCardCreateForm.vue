<script setup lang="ts">
import type { CreateDrinkCardPayload, DrinkCardElement, InventoryItemDoc } from "@firetable/types";

import { isCustomDrinkCard, isPDFDrinkCard } from "@firetable/types";
import { noEmptyString } from "src/helpers/form-rules";
import { processImage } from "src/helpers/process-image";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { ref, useTemplateRef, watch } from "vue";
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
const formRef = useTemplateRef("formRef");
const fileInput = ref<HTMLInputElement | null>(null);
const form = ref<CreateDrinkCardPayload>(getInitialForm());
const emit = defineEmits<{
    submit: [FormSubmitData];
}>();
const pdfFile = ref<File[]>([]);

function getInitialForm(): CreateDrinkCardPayload {
    if (props.cardToEdit) {
        return { ...props.cardToEdit };
    }

    return {
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
    if (!(await formRef.value?.validate())?.valid) {
        return;
    }

    if (isCustomDrinkCard(form.value) && form.value.elements.length === 0) {
        showErrorMessage("Drink card should have at least one section!");
        return;
    }

    if (isPDFDrinkCard(form.value) && pdfFile.value.length === 0 && !form.value.pdfUrl) {
        showErrorMessage("PDF drink card requires PDF file to be uploaded!");
        return;
    }

    emit("submit", {
        card: form.value,
        pdfFile: pdfFile.value[0],
    });
}

const imageProcessingOptions = {
    acceptedTypes: ["image/jpeg", "image/png"],
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

watch(pdfFile, (newFiles) => {
    const file = newFiles[0];
    if (!file) {
        return;
    }

    if (file.type !== "application/pdf") {
        showErrorMessage(t("PageAdminPropertyDrinkCards.invalidFileType"));
        pdfFile.value = [];
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showErrorMessage("PDF file is too large, 5MB is maximum size limit!");
        pdfFile.value = [];
    }
});

function removeImage(): void {
    if (isCustomDrinkCard(form.value)) {
        form.value.backgroundImage = "";
    }
}

function triggerFileInput(): void {
    fileInput.value?.click();
}
</script>

<template>
    <v-form ref="formRef" @submit.prevent="onSubmit">
        <v-row>
            <v-col cols="12">
                <v-btn-toggle v-model="form.type" mandatory divided class="w-100">
                    <v-btn value="custom" class="flex-grow-1">
                        <v-icon start>fas fa-pencil-alt</v-icon>
                        Custom
                    </v-btn>
                    <v-btn value="pdf" class="flex-grow-1">
                        <v-icon start>fas fa-file-pdf</v-icon>
                        Pdf
                    </v-btn>
                </v-btn-toggle>
            </v-col>

            <v-col cols="12">
                <v-switch
                    v-model="form.isActive"
                    :label="t('PageAdminPropertyDrinkCards.isActiveLabel')"
                    color="primary"
                    hide-details
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
                        hide-details
                    />
                </v-col>

                <v-col cols="12">
                    <v-switch
                        v-model="form.showLogo"
                        label="Show venue logo if exists?"
                        color="primary"
                        hide-details
                    />
                </v-col>

                <v-col cols="12" md="6">
                    <div class="text-subtitle-2 mb-2">
                        {{ t("PageAdminPropertyDrinkCards.cardDescriptionLabel") }}
                    </div>
                    <v-textarea v-model="form.description" variant="outlined" auto-grow />
                </v-col>

                <v-col cols="12" md="6">
                    <div class="text-subtitle-2 mb-2">Optional background image</div>
                    <v-responsive class="preview-container ft-border" :aspect-ratio="16 / 9">
                        <template v-if="form.backgroundImage">
                            <v-img
                                :src="form.backgroundImage"
                                class="preview-image"
                                cover
                                alt="Background preview"
                            />
                            <v-btn
                                class="remove-btn"
                                variant="text"
                                icon="fas fa-times"
                                color="error"
                                @click="removeImage"
                            />
                        </template>
                        <template v-else>
                            <div class="upload-placeholder">
                                <v-btn
                                    color="secondary"
                                    variant="tonal"
                                    prepend-icon="fas fa-file-import"
                                    @click="triggerFileInput"
                                    >Click to upload</v-btn
                                >
                            </div>
                        </template>
                        <input
                            type="file"
                            ref="fileInput"
                            accept="image/jpeg,image/png"
                            class="hidden"
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
                        v-model="pdfFile"
                        accept=".pdf"
                        label="Choose a PDF file or drop it here"
                        variant="outlined"
                        chips
                        show-size
                    />

                    <div v-if="form.pdfUrl" class="current-pdf mt-2">
                        <v-btn
                            variant="text"
                            prepend-icon="fas fa-eye"
                            :href="form.pdfUrl"
                            target="_blank"
                            >View current PDF</v-btn
                        >
                    </div>
                </div>
            </v-col>

            <v-col cols="12" class="d-flex justify-end">
                <v-btn type="submit" rounded="lg" size="large" class="button-gradient">
                    {{ t("Global.submit") }}
                </v-btn>
            </v-col>
        </v-row>
    </v-form>
</template>

<style lang="scss" scoped>
.preview-container {
    position: relative;
    border-radius: 4px;
    overflow: hidden;

    .preview-image {
        width: 100%;
        height: 100%;
    }

    .remove-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        background-color: rgba(0, 0, 0, 0.3);
    }

    .upload-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
    }
}

.ft-border {
    border: 1px dashed rgba(0, 0, 0, 0.2);
}

.hidden {
    display: none;
}
</style>
