<script setup lang="ts">
import { ref } from "vue";
import { minLength } from "src/helpers/form-rules";
import { QForm } from "quasar";

const emit = defineEmits(["create"]);
const propertyRules = [minLength("Property name needs to have at least 3 characters!", 3)];
const propertyName = ref("");
const createPropertyForm = ref<null | QForm>(null);

async function submit(): Promise<void> {
    if (!(await createPropertyForm.value?.validate())) return;
    emit("create", propertyName.value);
}
</script>

<template>
    <q-card-section>
        <q-form ref="createPropertyForm" class="q-gutter-md">
            <q-input v-model="propertyName" rounded standout autofocus :rules="propertyRules" />
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
