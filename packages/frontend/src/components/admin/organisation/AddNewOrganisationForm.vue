<script setup lang="ts">
import type { CreateOrganisationPayload } from "src/db";

import { OrganisationStatus } from "@firetable/types";
import { QForm } from "quasar";
import { greaterThanZero, minLength, requireNumber } from "src/helpers/form-rules";
import { ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const emit = defineEmits<(eventName: "create", payload: CreateOrganisationPayload) => void>();
const organisationRules = [minLength("organisation name needs to have at least 3 characters!", 3)];
const maxAllowedPropertiesRules = [requireNumber(), greaterThanZero()];

const organisationName = ref("");
const maxAllowedProperties = ref<null | number>(null);
const createOrganisationForm = useTemplateRef<QForm>("createOrganisationForm");

async function submit(): Promise<void> {
    if (!(await createOrganisationForm.value?.validate())) {
        return;
    }

    emit("create", {
        maxAllowedProperties: Number(maxAllowedProperties.value),
        name: organisationName.value,
        status: OrganisationStatus.PENDING,
    });
}
</script>

<template>
    <q-card-section>
        <q-form ref="createOrganisationForm" class="q-gutter-md">
            <q-input
                v-model="organisationName"
                label="Enter organisation name..."
                outlined
                autofocus
                :rules="organisationRules"
            />

            <q-input
                v-model.number="maxAllowedProperties"
                label="Add maximum number of allowed properties..."
                outlined
                type="number"
                :rules="maxAllowedPropertiesRules"
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
