<script setup lang="ts">
import type { CreateGuestPayload } from "@firetable/types";
import { ref } from "vue";
import { minLength } from "src/helpers/form-rules";
import { QForm } from "quasar";
import { isValidEuropeanPhoneNumber } from "src/helpers/utils";

const emit = defineEmits<{
    (eventName: "create", payload: CreateGuestPayload): void;
}>();
const guestName = ref("");
const guestContact = ref("");
const createGuestForm = ref<null | QForm>(null);
const guestNameRules = [minLength("Guest name must be at least 3 characters long", 3)];
const guestContactRules = [
    function (value: string) {
        return isValidEuropeanPhoneNumber(value) || "Invalid phone number";
    },
];

async function submit(): Promise<void> {
    if (!(await createGuestForm.value?.validate())) return;

    emit("create", {
        name: guestName.value,
        contact: guestContact.value,
        visitedProperties: {},
    });
}
</script>

<template>
    <q-card-section>
        <q-form ref="createGuestForm" class="q-gutter-md">
            <q-input
                label="Guest name"
                v-model="guestName"
                rounded
                standout
                autofocus
                :rules="guestNameRules"
            />
            <q-input
                label="Guest contact"
                v-model="guestContact"
                rounded
                standout
                autofocus
                :rules="guestContactRules"
            />
        </q-form>
    </q-card-section>

    <q-card-actions align="right">
        <q-btn rounded class="button-gradient" size="md" label="Submit" @click="submit" />
    </q-card-actions>
</template>
