<script setup lang="ts">
import { QForm } from "quasar";
import { minLength } from "src/helpers/form-rules";
import { ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const emit = defineEmits(["create"]);
const form = useTemplateRef<QForm>("form");
const guestName = ref("");

function onReset(): void {
    guestName.value = "";
}

function onSubmit(): void {
    if (!form.value?.validate()) {
        return;
    }
    emit("create", {
        confirmed: false,
        confirmedTime: null,
        name: guestName.value,
    });
}
</script>

<template>
    <q-form ref="form" class="q-gutter-md q-pt-md q-pa-md" @submit="onSubmit" @reset="onReset">
        <q-input
            v-model="guestName"
            standout
            rounded
            :label="t('EventGuestListCreateGuestForm.guestNameLabel')"
            lazy-rules
            :rules="[minLength(t('EventGuestListCreateGuestForm.guestNameValidationLength'), 3)]"
        />

        <div>
            <q-btn
                rounded
                size="md"
                :label="t('Global.submit')"
                type="submit"
                class="button-gradient"
            />
            <q-btn
                rounded
                size="md"
                outline
                :label="t('Global.reset')"
                type="reset"
                color="primary"
                class="q-ml-sm"
            />
        </div>
    </q-form>
</template>
