<script setup lang="ts">
import { noEmptyString } from "src/helpers/form-rules";
import { ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

interface Props {
    allFloorNames: Set<string>;
}

const { t } = useI18n();
const props = defineProps<Props>();
const emit = defineEmits<(event: "create", floorName: string) => void>();

const floorName = ref("");
const formRef = useTemplateRef("formRef");

function noSameFloorName(val: string): boolean | string {
    return !props.allFloorNames.has(val) || t("AddNewFloorForm.floorNameExistsError");
}

function onReset(): void {
    floorName.value = "";
    formRef.value?.resetValidation();
}

async function onSubmit(): Promise<void> {
    if ((await formRef.value?.validate())?.valid) {
        emit("create", floorName.value);
    }
}

function validateFloorName(value: string): boolean | string {
    const emptyValidation = noEmptyString()(value);
    if (emptyValidation !== true) {
        return emptyValidation;
    }
    return noSameFloorName(value);
}
</script>

<template>
    <v-form ref="formRef" class="pa-4" @submit.prevent="onSubmit">
        <v-text-field
            v-model="floorName"
            variant="outlined"
            :label="t('AddNewFloorForm.floorNameLabel')"
            :rules="[validateFloorName]"
            validate-on="blur"
            class="mb-4"
        />

        <div class="d-flex ga-2">
            <v-btn rounded color="primary" type="submit" flat>
                {{ t("Global.submit") }}
            </v-btn>
            <v-btn rounded variant="outlined" color="primary" @click="onReset">
                {{ t("Global.reset") }}
            </v-btn>
        </div>
    </v-form>
</template>
