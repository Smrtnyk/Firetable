<script setup lang="ts">
import type { CreateDrinkCardPayload, InventoryItemDoc } from "@firetable/types";
import { isPDFDrinkCard } from "@firetable/types";
import { ref } from "vue";
import { QForm } from "quasar";
import { useI18n } from "vue-i18n";
import { noEmptyString } from "src/helpers/form-rules";
import { showErrorMessage } from "src/helpers/ui-helpers";

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
        type: "pdf",
    };
}

async function onSubmit(): Promise<void> {
    const isValid = await formRef.value?.validate();
    if (!isValid) {
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
</script>

<template>
    <q-form ref="formRef" @submit.prevent="onSubmit" class="row q-col-gutter-md">
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

        <div class="col-12">
            <q-separator />
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
