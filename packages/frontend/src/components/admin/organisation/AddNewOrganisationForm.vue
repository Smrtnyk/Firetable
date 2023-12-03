<script setup lang="ts">
import { ref } from "vue";
import { greaterThanZero, minLength, requireNumber } from "src/helpers/form-rules";
import { QForm } from "quasar";
import type { CreateOrganisationPayload } from "@firetable/backend";

const emit = defineEmits<{
    (eventName: "create", payload: CreateOrganisationPayload): void;
}>();
const organisationRules = [minLength("organisation name needs to have at least 3 characters!", 3)];
const maxAllowedPropertiesRules = [requireNumber(), greaterThanZero()];

const organisationName = ref("");
const maxAllowedProperties = ref<null | number>(null);
const createOrganisationForm = ref<null | QForm>(null);

async function submit(): Promise<void> {
    if (!(await createOrganisationForm.value?.validate())) return;

    emit("create", {
        name: organisationName.value,
        maxAllowedProperties: Number(maxAllowedProperties.value),
    });
}
</script>

<template>
    <q-card-section>
        <q-form ref="createOrganisationForm" class="q-gutter-md">
            <q-input
                v-model="organisationName"
                label="Enter organisation name..."
                rounded
                standout
                autofocus
                :rules="organisationRules"
            />

            <q-input
                v-model="maxAllowedProperties"
                label="Add maximum number of allowed properties..."
                rounded
                standout
                type="number"
                :rules="maxAllowedPropertiesRules"
            />
        </q-form>
    </q-card-section>

    <q-card-actions align="right">
        <q-btn
            rounded
            class="button-gradient"
            size="md"
            label="Create"
            @click="submit"
            v-close-popup
        />
    </q-card-actions>
</template>
