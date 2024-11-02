<script setup lang="ts">
import type { CreateGuestPayload } from "@firetable/types";
import { ref, useTemplateRef } from "vue";
import { minLength } from "src/helpers/form-rules";
import { QForm } from "quasar";

import TelNumberInput from "src/components/TelNumberInput/TelNumberInput.vue";
import { hashString } from "src/helpers/hash-string";
import { maskPhoneNumber } from "src/helpers/mask-phone-number";
import { useI18n } from "vue-i18n";
import { capitalizeName } from "src/helpers/capitalize-name";

export interface AddNewGuestFormProps {
    mode: "create" | "edit";
    initialData?: {
        name: string;
        contact: string;
        tags?: string[];
    };
}

const { mode = "create", initialData } = defineProps<AddNewGuestFormProps>();
const emit = defineEmits<(eventName: "create" | "update", payload: CreateGuestPayload) => void>();

const { t } = useI18n();

const guestName = ref("");
const guestContact = ref("");
const guestTags = ref<string[]>([]);
const createGuestForm = useTemplateRef<QForm>("createGuestForm");
const guestNameRules = [minLength("Guest name must be at least 3 characters long", 3)];

if (mode === "edit" && initialData) {
    guestName.value = initialData.name;
    guestContact.value = initialData.contact;
    guestTags.value = initialData.tags ?? [];
}

function capitalizeGuestName(): void {
    guestName.value = capitalizeName(guestName.value);
}

async function submit(): Promise<void> {
    if (!(await createGuestForm.value?.validate())) {
        return;
    }

    const payload: CreateGuestPayload = {
        name: guestName.value,
        contact: guestContact.value,
        hashedContact: await hashString(guestContact.value),
        maskedContact: maskPhoneNumber(guestContact.value),
        visitedProperties: {},
        tags: guestTags.value,
    };

    if (mode === "create") {
        emit("create", payload);
    } else if (mode === "edit") {
        emit("update", payload);
    }
}

function onNewTag(inputValue: string, done: (item?: any) => void): void {
    const trimmedValue = inputValue.trim();
    if (trimmedValue === "") {
        done();
        return;
    }
    done(trimmedValue.toLowerCase());
}
</script>

<template>
    <q-card-section>
        <q-form ref="createGuestForm" class="q-gutter-md" greedy>
            <q-input
                :label="t('AddNewGuestForm.guestNameInputLabel')"
                v-model="guestName"
                rounded
                standout
                autofocus
                @blur="capitalizeGuestName"
                :rules="guestNameRules"
            />
            <TelNumberInput required v-model="guestContact" />

            <q-select
                v-model="guestTags"
                :label="t('Global.tagsLabel')"
                rounded
                standout
                use-input
                use-chips
                multiple
                emit-value
                map-options
                input-debounce="0"
                hide-dropdown-icon
                fill-input
                clear-icon="close"
                @new-value="onNewTag"
                new-value-mode="add-unique"
                :options="[]"
            />
        </q-form>
    </q-card-section>

    <q-card-actions align="right">
        <q-btn
            rounded
            class="button-gradient"
            size="md"
            :label="t('Global.submit')"
            @click="submit"
        />
    </q-card-actions>
</template>
