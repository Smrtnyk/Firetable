<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { minLength } from "src/helpers/form-rules";
import { QForm } from "quasar";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const emit = defineEmits(["create"]);
const roleRules = [minLength("Role needs to have at least 3 characters!", 3)];
const roleName = ref("");
const createRoleForm = useTemplateRef<QForm>("createRoleForm");

async function submit(): Promise<void> {
    if (!(await createRoleForm.value?.validate())) {
        return;
    }
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
            :label="t('Global.submit')"
            @click="submit"
            v-close-popup
        />
    </q-card-actions>
</template>
