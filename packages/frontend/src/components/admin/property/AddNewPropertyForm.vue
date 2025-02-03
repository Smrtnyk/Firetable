<script setup lang="ts">
import type { CreatePropertyPayload, PropertyDoc, UpdatePropertyPayload } from "@firetable/types";

import { isString } from "es-toolkit";
import { QForm } from "quasar";
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
const createPropertyForm = useTemplateRef<QForm>("createPropertyForm");
const fileInput = ref<HTMLInputElement>();
const showUrlInput = ref(false);

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
        showUrlInput.value = Boolean(newVal.img);
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
        showUrlInput.value = false;
    } catch (error) {
        showErrorMessage("Error processing image. Please try another file.");
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
        showErrorMessage("Error processing image. Please try another file.");
    }
}

function removeImage(): void {
    form.value.img = "";
    showUrlInput.value = false;
}

async function submit(): Promise<void> {
    if (!(await createPropertyForm.value?.validate())) {
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
    <q-card-section>
        <q-form ref="createPropertyForm" greedy class="q-gutter-md">
            <q-input
                v-model="form.name"
                label="Property name"
                rounded
                standout
                autofocus
                :rules="propertyRules"
            />

            <div class="brand-image q-mt-md">
                <div class="text-subtitle2 q-mb-sm">
                    Property Brand Image
                    <q-btn flat round dense icon="help" class="q-ml-xs">
                        <q-tooltip>
                            For best results, use a PNG or SVG with transparent background. Maximum
                            dimensions: 300x300px
                        </q-tooltip>
                    </q-btn>
                </div>

                <div class="row q-gutter-sm q-mb-md">
                    <q-btn-toggle
                        class="full-width"
                        v-model="inputMethod"
                        no-caps
                        rounded
                        spread
                        unelevated
                        :options="[
                            { label: 'Upload File', value: InputMethod.FILE },
                            { label: 'Paste external URL', value: InputMethod.URL },
                        ]"
                    />
                </div>

                <!-- URL Input -->
                <q-input
                    v-if="inputMethod === InputMethod.URL"
                    v-model="imageUrl"
                    label="Image URL"
                    rounded
                    standout
                    :rules="imgUrlRules"
                >
                    <template v-if="imageUrl" #append>
                        <q-icon name="clear" class="cursor-pointer" @click="removeImage" />
                    </template>
                </q-input>

                <!-- Image Preview and Drop Area -->
                <div
                    v-if="inputMethod === InputMethod.FILE"
                    class="preview-container q-mt-md ft-border ft-card"
                    @click="triggerFileInput"
                    @dragover.prevent
                    @drop.prevent="handleFileDrop"
                >
                    <q-responsive :ratio="1">
                        <q-img
                            v-if="form.img"
                            :src="isString(form.img) ? form.img : form.img.dataUrl"
                            class="preview-image"
                        >
                            <div class="absolute-top-right">
                                <FTBtn flat round icon="close" @click.stop="removeImage" />
                            </div>
                        </q-img>
                        <div
                            v-else
                            class="row upload-placeholder text-center align-center content-center justify-center"
                        >
                            <q-icon name="import" size="md" />
                            <div>Click or drag and drop to upload an image</div>
                        </div>
                    </q-responsive>
                </div>

                <input
                    ref="fileInput"
                    type="file"
                    accept=".png,.svg"
                    class="hidden"
                    @change="handleImageUpload"
                />
            </div>
        </q-form>
    </q-card-section>

    <q-card-actions align="right">
        <q-btn
            rounded
            class="button-gradient"
            size="md"
            :label="t('Global.submit')"
            @click="submit"
        />
    </q-card-actions>
</template>

<style lang="scss" scoped>
.hidden {
    display: none;
}

.preview-container {
    max-width: 200px;
    cursor: pointer;

    .upload-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        border: 2px dashed var(--q-separator-color);
        border-radius: 8px;
        text-align: center;

        q-icon {
            margin-bottom: 10px;
        }
    }
}
</style>
