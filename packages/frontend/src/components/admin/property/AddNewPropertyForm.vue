<script setup lang="ts">
import type { CreatePropertyPayload, UpdatePropertyPayload } from "@firetable/backend";
import type { PropertyDoc } from "@firetable/types";
import { ref, watch, useTemplateRef } from "vue";
import { minLength, validOptionalURL } from "src/helpers/form-rules";
import { QForm } from "quasar";
import { useI18n } from "vue-i18n";

interface Props {
    organisationId: string;
    propertyDoc?: PropertyDoc;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    (eventName: "create", payload: CreatePropertyPayload): void;
    (eventName: "update", payload: UpdatePropertyPayload): void;
}>();
const { t } = useI18n();
const propertyName = ref("");
const propertyImgUrl = ref("");
const createPropertyForm = useTemplateRef<QForm>("createPropertyForm");
const propertyRules = [minLength(t("AddNewPropertyForm.propertyNameLengthValidationMessage"), 3)];
const imgUrlRules = [validOptionalURL()];

watch(
    () => props.propertyDoc,
    function (newVal) {
        if (newVal) {
            propertyName.value = newVal.name;
            propertyImgUrl.value = newVal.img ?? "";
        }
    },
    { immediate: true },
);

async function submit(): Promise<void> {
    if (!(await createPropertyForm.value?.validate())) {
        return;
    }

    const payload = {
        name: propertyName.value,
        img: propertyImgUrl.value,
        organisationId: props.organisationId,
    };

    if (props.propertyDoc) {
        emit("update", {
            ...payload,
            id: props.propertyDoc.id,
        });
    } else {
        emit("create", payload);
    }
}
</script>

<template>
    <q-card-section>
        <q-form ref="createPropertyForm" greedy class="q-gutter-md">
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
            :label="t('Global.submit')"
            @click="submit"
        />
    </q-card-actions>
</template>
