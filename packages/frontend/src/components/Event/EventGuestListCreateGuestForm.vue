<script setup lang="ts">
import { ref } from "vue";
import { minLength } from "src/helpers/form-rules";
import { useI18n } from "vue-i18n";
import { QForm } from "quasar";

const { t } = useI18n();
const emit = defineEmits(["create"]);
const form = ref<QForm>();
const guestName = ref("");

function onSubmit() {
    if (!form.value?.validate()) {
        return;
    }
    emit("create", {
        confirmed: false,
        confirmedTime: null,
        name: guestName.value,
    });
}

function onReset() {
    guestName.value = "";
}
</script>

<template>
    <q-form ref="form" class="q-gutter-md q-pt-md q-pa-md" @submit="onSubmit" @reset="onReset">
        <q-input
            v-model="guestName"
            standout
            rounded
            :label="t('EventGuestListCreateGuestForm.guestNameLabel')"
            :hint="t('EventGuestListCreateGuestForm.guestNameHint')"
            lazy-rules
            :rules="[minLength(t('EventGuestListCreateGuestForm.guestNameValidationLength'), 3)]"
        />

        <div>
            <q-btn
                rounded
                size="md"
                :label="t('EventGuestListCreateGuestForm.guestNameAddSubmit')"
                type="submit"
                class="button-gradient"
            />
            <q-btn
                rounded
                size="md"
                outline
                :label="t('EventGuestListCreateGuestForm.guestNameReset')"
                type="reset"
                color="primary"
                class="q-ml-sm"
            />
        </div>
    </q-form>
</template>
