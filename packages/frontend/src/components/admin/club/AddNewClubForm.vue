<script setup lang="ts">
import { ref } from "vue";
import { minLength } from "src/helpers/form-rules";
import { QForm } from "quasar";

const emit = defineEmits(["create"]);
const clubRules = [minLength("Club name needs to have at least 3 characters!", 3)];
const clubName = ref("");
const createClubForm = ref<null | QForm>(null);

async function submit(): Promise<void> {
    if (!(await createClubForm.value?.validate())) return;
    emit("create", clubName.value);
}
</script>

<template>
    <q-card-section>
        <q-form ref="createClubForm" class="q-gutter-md">
            <q-input v-model="clubName" rounded standout autofocus :rules="clubRules" />
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
