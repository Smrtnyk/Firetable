<script setup lang="ts">
import { ref } from "vue";
import { minLength } from "src/helpers/form-rules";
import { QForm } from "quasar";

const emit = defineEmits(["create"]);
const organisationRules = [minLength("organisation name needs to have at least 3 characters!", 3)];
const organisationName = ref("");
const createOrganisationForm = ref<null | QForm>(null);

async function submit(): Promise<void> {
    if (!(await createOrganisationForm.value?.validate())) return;
    emit("create", organisationName.value);
}
</script>

<template>
    <q-card-section>
        <q-form ref="createOrganisationForm" class="q-gutter-md">
            <q-input
                v-model="organisationName"
                rounded
                standout
                autofocus
                :rules="organisationRules"
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
