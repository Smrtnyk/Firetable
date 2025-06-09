<script setup lang="ts">
import type { CreateOrganisationPayload } from "src/db";
import type { VForm } from "vuetify/components";

import { OrganisationStatus } from "@firetable/types";
import { greaterThanZero, minLength, requireNumber } from "src/helpers/form-rules";
import { ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const emit = defineEmits<(eventName: "create", payload: CreateOrganisationPayload) => void>();
const organisationRules = [minLength(t("AddNewOrganisationForm.organisationNameError"), 3)];
const maxAllowedPropertiesRules = [requireNumber(), greaterThanZero()];

const organisationName = ref("");
const maxAllowedProperties = ref<null | number>(null);
const createOrganisationForm = useTemplateRef("createOrganisationForm");

async function submit(): Promise<void> {
    if (!(await createOrganisationForm.value?.validate())?.valid) {
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
    <v-card-text>
        <v-form
            ref="createOrganisationForm"
            class="d-flex flex-column"
            style="gap: 1rem"
            @submit.prevent="submit"
        >
            <v-text-field
                v-model="organisationName"
                :label="t('AddNewOrganisationForm.organisationNameLabel')"
                variant="outlined"
                autofocus
                :rules="organisationRules"
            />

            <v-text-field
                v-model.number="maxAllowedProperties"
                :label="t('AddNewOrganisationForm.maxPropertiesLabel')"
                variant="outlined"
                type="number"
                :rules="maxAllowedPropertiesRules"
            />
        </v-form>
    </v-card-text>

    <v-card-actions>
        <v-spacer />
        <v-btn rounded="lg" class="button-gradient" size="large" @click="submit">
            {{ t("Global.submit") }}
        </v-btn>
    </v-card-actions>
</template>
