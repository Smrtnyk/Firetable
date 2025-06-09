<script setup lang="ts">
import type { CreateGuestPayload } from "@firetable/types";
// Import VForm type for the template ref
import type { VForm } from "vuetify/components";

import TelNumberInput from "src/components/TelNumberInput/TelNumberInput.vue";
import { capitalizeName } from "src/helpers/capitalize-name";
import { minLength } from "src/helpers/form-rules";
import { hashString } from "src/helpers/hash-string";
import { maskPhoneNumber } from "src/helpers/mask-phone-number";
import { ref, watch } from "vue";
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
const createGuestForm = ref<null | VForm>(null);
const guestNameRules = [minLength("Guest name must be at least 3 characters long", 3)];

if (mode === "edit" && initialData) {
    guestName.value = initialData.name;
    guestContact.value = initialData.contact;
    guestTags.value = initialData.tags ?? [];
}

watch(
    guestTags,
    (currentTags, oldTags) => {
        if (currentTags.length <= oldTags.length) {
            return;
        }
        const newTagIndex = currentTags.length - 1;
        const newTag = currentTags[newTagIndex];

        if (typeof newTag === "string" && newTag.trim() !== "") {
            const processedTag = newTag.trim().toLowerCase();
            // Update the tag in the array if it has changed
            if (processedTag !== newTag) {
                guestTags.value[newTagIndex] = processedTag;
            }
            // Ensure uniqueness after processing
            const uniqueTags = [...new Set(guestTags.value)];
            if (uniqueTags.length !== guestTags.value.length) {
                guestTags.value = uniqueTags;
            }
        }
    },
    { deep: true },
);

function capitalizeGuestName(): void {
    guestName.value = capitalizeName(guestName.value);
}

async function submit(): Promise<void> {
    if (!(await createGuestForm.value?.validate())?.valid) {
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
        <v-form
            ref="createGuestForm"
            class="d-flex flex-column"
            style="gap: 1.25rem"
            greedy
            @submit.prevent="submit"
        >
            <v-text-field
                :label="t('AddNewGuestForm.guestNameInputLabel')"
                v-model="guestName"
                variant="outlined"
                autofocus
                @blur="capitalizeGuestName"
                :rules="guestNameRules"
            />
            <TelNumberInput required v-model="guestContact" />

            <v-combobox
                v-model="guestTags"
                :label="t('Global.tagsLabel')"
                variant="outlined"
                chips
                multiple
                clearable
                closable-chips
            />
        </v-form>
    </v-card-text>

    <v-card-actions>
        <v-spacer />
        <v-btn rounded class="button-gradient" size="large" @click="submit">
            {{ t("Global.submit") }}
        </v-btn>
    </v-card-actions>
</template>
