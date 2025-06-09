<script setup lang="ts">
import type { VForm } from "vuetify/components";

import { minLength } from "src/helpers/form-rules";
import { ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const emit = defineEmits(["create"]);
const form = useTemplateRef<VForm>("form");
const guestName = ref("");

function onReset(): void {
    guestName.value = "";
    form.value?.resetValidation();
}

async function onSubmit(): Promise<void> {
    const { valid } = (await form.value?.validate()) ?? { valid: false };
    if (!valid) {
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
    <v-form
        ref="form"
        class="pa-4 d-flex flex-column"
        style="gap: 1.25rem"
        @submit.prevent="onSubmit"
        @reset.prevent="onReset"
    >
        <v-text-field
            v-model="guestName"
            variant="outlined"
            :label="t('EventGuestListCreateGuestForm.guestNameLabel')"
            :rules="[minLength(t('EventGuestListCreateGuestForm.guestNameValidationLength'), 3)]"
        />

        <div class="d-flex" style="gap: 8px">
            <v-btn rounded="lg" size="large" type="submit" color="primary" flat>
                {{ t("Global.submit") }}
            </v-btn>
            <v-btn rounded="lg" size="large" variant="outlined" type="reset" color="primary">
                {{ t("Global.reset") }}
            </v-btn>
        </div>
    </v-form>
</template>
