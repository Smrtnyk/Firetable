<script setup lang="ts">
import type { CreateGuestPayload } from "@firetable/types";
import type { VForm } from "vuetify/components/VForm";

import TelNumberInput from "src/components/TelNumberInput/TelNumberInput.vue";
import { capitalizeName } from "src/helpers/capitalize-name";
import { minLength, validateForm } from "src/helpers/form-rules";
import { hashString } from "src/helpers/hash-string";
import { maskPhoneNumber } from "src/helpers/mask-phone-number";
import { ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

export interface AddNewGuestFormProps {
    initialData?: {
        contact: string;
        name: string;
        tags?: string[];
    };
    mode?: "create" | "edit";
}

const { initialData, mode = "create" } = defineProps<AddNewGuestFormProps>();
const emit = defineEmits<(eventName: "create" | "update", payload: CreateGuestPayload) => void>();

const { t } = useI18n();

const guestName = ref("");
const guestContact = ref("");
const guestTags = ref<string[]>([]);
const createGuestForm = useTemplateRef<VForm>("createGuestForm");
const guestNameRules = [minLength(t("AddNewGuestForm.validation.nameMinLength"), 3)];

if (mode === "edit" && initialData) {
    guestName.value = initialData.name;
    guestContact.value = initialData.contact;
    guestTags.value = initialData.tags ?? [];
}

function capitalizeGuestName(): void {
    guestName.value = capitalizeName(guestName.value);
}

// Handle custom tag creation properly
function handleTagsUpdate(newTags: string[]): void {
    // Filter out empty strings and ensure uniqueness
    guestTags.value = newTags
        .map((tag) => (typeof tag === "string" ? tag.trim().toLowerCase() : ""))
        .filter((tag, index, arr) => tag !== "" && arr.indexOf(tag) === index);
}

async function submit(): Promise<void> {
    if (!(await validateForm(createGuestForm.value))) {
        return;
    }

    const payload: CreateGuestPayload = {
        contact: guestContact.value,
        hashedContact: await hashString(guestContact.value),
        maskedContact: maskPhoneNumber(guestContact.value),
        name: guestName.value,
        tags: guestTags.value,
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
    <v-card-text>
        <v-form ref="createGuestForm" class="d-flex flex-column ga-4">
            <v-text-field
                v-model="guestName"
                :label="t('AddNewGuestForm.guestNameInputLabel')"
                variant="outlined"
                autofocus
                :rules="guestNameRules"
                @blur="capitalizeGuestName"
            />

            <TelNumberInput v-model="guestContact" required />

            <v-combobox
                :model-value="guestTags"
                @update:model-value="handleTagsUpdate"
                :label="t('Global.tagsLabel')"
                variant="outlined"
                multiple
                chips
                closable-chips
                :items="[]"
                hide-no-data
            />
        </v-form>
    </v-card-text>

    <v-card-actions class="justify-end">
        <v-btn rounded class="button-gradient" size="default" @click="submit">
            {{ t("Global.submit") }}
        </v-btn>
    </v-card-actions>
</template>
