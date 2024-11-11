<script setup lang="ts">
import type { OrganisationDoc } from "@firetable/types";
import { ref, useTemplateRef } from "vue";
import { QForm } from "quasar";
import { noEmptyString } from "src/helpers/form-rules";
import FTBtn from "src/components/FTBtn.vue";

const props = defineProps<{
    organisation: OrganisationDoc;
}>();

const emit = defineEmits<(event: "delete") => void>();

const organisationName = ref("");
const deleteForm = useTemplateRef<QForm>("deleteForm");

const nameRules = [
    noEmptyString("Organisation name is required"),
    (value: string) => {
        return value === props.organisation.name || "Organisation name doesn't match";
    },
];

async function onSubmit(): Promise<void> {
    if (!(await deleteForm.value?.validate())) {
        return;
    }
    emit("delete");
}
</script>

<template>
    <q-form ref="deleteForm" @submit="onSubmit">
        <p class="text-negative">
            This action cannot be undone. Please type "{{ organisation.name }}" to confirm.
        </p>
        <q-input
            lazy-rules
            v-model="organisationName"
            label="Organisation Name"
            :rules="nameRules"
            standout
            rounded
        />
        <div class="row justify-end q-mt-md">
            <FTBtn type="submit" color="negative">Delete Organisation</FTBtn>
        </div>
    </q-form>
</template>
