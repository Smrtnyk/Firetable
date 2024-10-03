<script setup lang="ts">
import type { CreateGuestPayload } from "@firetable/types";
import { ref, useTemplateRef } from "vue";
import { minLength } from "src/helpers/form-rules";
import { QForm } from "quasar";

import TelNumberInput from "src/components/tel-number-input/TelNumberInput.vue";

export interface AddNewGuestFormProps {
    mode: "create" | "edit";
    initialData?: {
        name: string;
        contact: string;
    };
}

const { mode = "create", initialData } = defineProps<AddNewGuestFormProps>();
const emit = defineEmits<(eventName: "create" | "update", payload: CreateGuestPayload) => void>();

const guestName = ref("");
const guestContact = ref("");
const createGuestForm = useTemplateRef<QForm>("createGuestForm");
const guestNameRules = [minLength("Guest name must be at least 3 characters long", 3)];

if (mode === "edit" && initialData) {
    guestName.value = initialData.name;
    guestContact.value = initialData.contact;
}

async function submit(): Promise<void> {
    if (!(await createGuestForm.value?.validate())) {
        return;
    }

    const payload: CreateGuestPayload = {
        name: guestName.value,
        contact: guestContact.value,
        visitedProperties: {},
    };

    if (mode === "create") {
        emit("create", payload);
    } else if (mode === "edit") {
        emit("update", payload);
    }
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
            <TelNumberInput required v-model="guestContact" label="Guest Contact" />
        </q-form>
    </q-card-section>

    <q-card-actions align="right">
        <q-btn rounded class="button-gradient" size="md" label="Submit" @click="submit" />
    </q-card-actions>
</template>
