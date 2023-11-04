<script setup lang="ts">
import { computed, ref } from "vue";
import { minLength } from "src/helpers/form-rules";
import { QForm } from "quasar";
import { ADMIN, OrganisationDoc } from "@firetable/types";
import { CreatePropertyPayload } from "@firetable/backend";
import { useAuthStore } from "stores/auth-store";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useI18n } from "vue-i18n";

interface Props {
    organisations: OrganisationDoc[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
    (eventName: "create", payload: CreatePropertyPayload): void;
}>();
const { t } = useI18n();
const authStore = useAuthStore();
const propertyRules = [minLength(t("AddNewPropertyForm.propertyNameLengthValidationMessage"), 3)];
const propertyName = ref("");
const createPropertyForm = ref<null | QForm>(null);
const chosenOrganisation = ref<string | null>(null);

// If only one organisation is passed in, then it is never an ADMIN
const isSingleOrganisation = computed(() => {
    return props.organisations.length === 1 && authStore.user!.role !== ADMIN;
});

async function submit(): Promise<void> {
    if (!(await createPropertyForm.value?.validate())) return;

    const organisationId = isSingleOrganisation.value
        ? props.organisations[0].id
        : chosenOrganisation.value;

    if (!organisationId) {
        showErrorMessage("organisationId must be set for this property!");
        return;
    }

    emit("create", {
        name: propertyName.value,
        organisationId,
    });
}
</script>

<template>
    <q-card-section>
        <q-form ref="createPropertyForm" class="q-gutter-md">
            <q-input v-model="propertyName" rounded standout autofocus :rules="propertyRules" />

            <div v-if="!isSingleOrganisation" class="q-gutter-sm q-mb-lg">
                <div>{{ t("AddNewPropertyForm.organisationsRadioBoxLabel") }}</div>
                <div>
                    <q-radio
                        v-for="organisation in props.organisations"
                        :key="organisation.id"
                        v-model="chosenOrganisation"
                        :val="organisation.id"
                        :label="organisation.name"
                        color="accent"
                    />
                </div>
            </div>
        </q-form>
    </q-card-section>

    <q-card-actions align="right">
        <q-btn
            rounded
            class="button-gradient"
            size="md"
            :label="t('AddNewPropertyForm.addPropertyButtonLabel')"
            @click="submit"
            v-close-popup
        />
    </q-card-actions>
</template>
