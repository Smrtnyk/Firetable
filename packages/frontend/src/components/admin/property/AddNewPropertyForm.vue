<script setup lang="ts">
import { ref } from "vue";
import { minLength, validOptionalURL } from "src/helpers/form-rules";
import { QForm } from "quasar";
import type { CreatePropertyPayload } from "@firetable/backend";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useI18n } from "vue-i18n";

interface Props {
    organisationId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    (eventName: "create", payload: CreatePropertyPayload): void;
}>();
const { t } = useI18n();
const propertyName = ref("");
const propertyImgUrl = ref("");
const createPropertyForm = ref<null | QForm>(null);

const propertyRules = [minLength(t("AddNewPropertyForm.propertyNameLengthValidationMessage"), 3)];

const imgUrlRules = [validOptionalURL()];

async function submit(): Promise<void> {
    if (!(await createPropertyForm.value?.validate())) return;

    if (!props.organisationId) {
        showErrorMessage("organisationId must be set for this property!");
        return;
    }

    emit("create", {
        name: propertyName.value,
        img: propertyImgUrl.value,
        organisationId: props.organisationId,
    });
}
</script>

<template>
    <q-card-section>
        <q-form ref="createPropertyForm" class="q-gutter-md">
            <q-input
                label="Property name"
                v-model="propertyName"
                rounded
                standout
                autofocus
                :rules="propertyRules"
            />
            <q-input
                label="Optional property image url"
                v-model="propertyImgUrl"
                rounded
                standout
                autofocus
                :rules="imgUrlRules"
            />
        </q-form>
    </q-card-section>

    <q-card-actions align="right">
        <q-btn
            rounded
            class="button-gradient"
            size="md"
            :label="t('AddNewPropertyForm.addPropertyButtonLabel')"
            @click="submit"
        />
    </q-card-actions>
</template>
