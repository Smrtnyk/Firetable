<script setup lang="ts">
import type { CreateDrinkCardPayload, DrinkCardElement, InventoryItemDoc } from "@firetable/types";
import DrinkCardSectionManager from "./DrinkCardSectionManager.vue";
import { isCustomDrinkCard, isPDFDrinkCard } from "@firetable/types";
import { ref } from "vue";
import { QForm } from "quasar";
import { useI18n } from "vue-i18n";
import { noEmptyString } from "src/helpers/form-rules";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { processImage } from "src/helpers/process-image";

interface Props {
    cardToEdit?: CreateDrinkCardPayload;
    inventoryItems: InventoryItemDoc[];
}

interface FormSubmitData {
    card: CreateDrinkCardPayload;
    pdfFile?: File | undefined;
}

const props = defineProps<Props>();
const { t } = useI18n();
const formRef = ref<QForm | undefined>();
const form = ref<CreateDrinkCardPayload>(getInitialForm());
const emit = defineEmits<{
    submit: [FormSubmitData];
}>();
const backgroundFile = ref<File | undefined>();
const fileInput = ref<HTMLInputElement | undefined>();
const pdfFile = ref<File | undefined>();

function getInitialForm(): CreateDrinkCardPayload {
    if (props.cardToEdit) {
        return { ...props.cardToEdit };
    }

    return {
        name: "",
        description: "",
        isActive: true,
        propertyId: "",
        organisationId: "",
        type: "custom",
        elements: [],
        showLogo: true,
    };
}

async function onSubmit(): Promise<void> {
    const isValid = await formRef.value?.validate();
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
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    // 300KB
    maxFileSize: 300 * 1024,
    acceptedTypes: ["image/jpeg", "image/png"],
};

function triggerFileInput(): void {
    fileInput.value?.click();
}

function removeImage(): void {
    if (isCustomDrinkCard(form.value)) {
        form.value.backgroundImage = "";
        backgroundFile.value = undefined;
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

function handlePDFUpload(file: File | null): void {
    if (!file) {
        return;
    }

    if (file.type !== "application/pdf") {
        showErrorMessage(t("PageAdminPropertyDrinkCards.invalidFileType"));
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showErrorMessage("PDF file is too large, 5MB is maximum size limit!");
        return;
    }

    pdfFile.value = file;
}

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
</script>

<template>
    <q-form ref="formRef" @submit.prevent="onSubmit" class="row q-col-gutter-md">
        <div class="col-12">
            <q-btn-toggle
                v-model="form.type"
                :options="[
                    { label: 'Custom', value: 'custom', icon: 'pencil' },
                    { label: 'Pdf', value: 'pdf', icon: 'pdf' },
                ]"
                no-caps
                rounded
                spread
                unelevated
            />
        </div>

        <div class="col-12">
            <q-toggle
                v-model="form.isActive"
                :label="t('PageAdminPropertyDrinkCards.isActiveLabel')"
            />
        </div>

        <div class="col-12">
            <q-input
                v-model="form.name"
                :label="t('PageAdminPropertyDrinkCards.cardNameLabel')"
                standout
                rounded
                :rules="[noEmptyString('Drink card name is required')]"
            />
        </div>

        <template v-if="isCustomDrinkCard(form)">
            <div class="col-12">
                <q-toggle v-model="form.showItemDescription" label="Show item description?" />
            </div>

            <div class="col-12">
                <q-toggle v-model="form.showLogo" label="Show venue logo if exists?" />
            </div>

            <div class="col-12 col-md-6">
                <div class="text-subtitle2 q-mb-sm">
                    {{ t("PageAdminPropertyDrinkCards.cardDescriptionLabel") }}
                </div>
                <q-editor
                    v-model="form.description"
                    :toolbar="[
                        ['bold', 'italic', 'underline'],
                        ['orderedList', 'unorderedList'],
                        ['undo', 'redo'],
                    ]"
                    content-class="editor-content"
                    standout
                    rounded
                />
            </div>

            <div class="col-12 col-md-6">
                <div class="text-subtitle2 q-mb-sm">Optional background image</div>
                <q-responsive class="preview-container col-12 ft-border" ratio="1">
                    <template v-if="form.backgroundImage">
                        <q-img :src="form.backgroundImage" class="preview-image" alt="" />
                        <div>
                            <q-btn flat round color="negative" icon="close" @click="removeImage" />
                        </div>
                    </template>
                    <template v-else>
                        <div class="upload-placeholder">
                            <q-btn color="secondary" rounded icon="import" @click="triggerFileInput"
                                >Click to upload</q-btn
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
                </q-responsive>
            </div>
        </template>

        <div class="col-12">
            <q-separator />
        </div>

        <div class="col-12" v-if="isCustomDrinkCard(form)">
            <DrinkCardSectionManager
                v-model:elements="form.elements"
                :inventory-items="inventoryItems"
                @add="handleElementAdd"
                @remove="handleElementRemove"
            />
        </div>

        <div class="col-12" v-if="isPDFDrinkCard(form)">
            <div class="pdf-upload-container col-12">
                <q-file
                    v-model="pdfFile"
                    accept=".pdf"
                    label="Choose a PDF file"
                    @update:model-value="handlePDFUpload"
                    standout
                    rounded
                    use-chips
                    drop-area
                >
                    <template #prepend>
                        <q-icon name="pdf" />
                    </template>
                </q-file>

                <div v-if="form.pdfUrl" class="current-pdf q-mt-sm">
                    <q-btn
                        flat
                        label="View current PDF"
                        icon="eye-open"
                        :href="form.pdfUrl"
                        target="_blank"
                    />
                </div>
            </div>
        </div>

        <div class="col-12">
            <q-separator />
        </div>

        <div class="col-12 justify-end">
            <q-btn type="submit" rounded class="button-gradient" :label="t('Global.submit')" />
        </div>
    </q-form>
</template>

<style lang="scss" scoped>
.preview-container {
    max-width: 500px;
    position: relative;
    min-height: 169px;
    border-radius: 8px;

    .preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .upload-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
    }
}

.hidden {
    display: none;
}
</style>
