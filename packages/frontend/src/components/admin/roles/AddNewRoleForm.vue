<script setup lang="ts">
import { ref } from "vue";
import { minLength } from "src/helpers/form-rules";
import { QForm } from "quasar";

const emit = defineEmits(["create"]);
const roleRules = [minLength("Role needs to have at least 3 characters!", 3)];
const roleName = ref("");
const createRoleForm = ref<null | QForm>(null);

async function submit(): Promise<void> {
    if (!(await createRoleForm.value?.validate())) return;
    emit("create", roleName.value);
}
</script>

<template>
    <q-card-section>
        <q-form ref="createRoleForm" class="q-gutter-md">
            <q-input v-model="roleName" rounded standout autofocus :rules="roleRules" />
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
