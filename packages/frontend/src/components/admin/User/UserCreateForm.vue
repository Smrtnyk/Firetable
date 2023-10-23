<script setup lang="ts">
import { computed, ref } from "vue";
import {
    ACTIVITY_STATUS,
    ADMIN,
    CreateUserPayload,
    OrganisationDoc,
    PropertyDoc,
    Role,
    User,
} from "@firetable/types";
import { QForm } from "quasar";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useAuthStore } from "stores/auth-store";
import { noEmptyString, noWhiteSpaces } from "src/helpers/form-rules";
import { useI18n } from "vue-i18n";

interface Props {
    properties: PropertyDoc[];
    organisations: OrganisationDoc[];
}

type Emits = (event: "submit", payload: CreateUserPayload | User) => void;

const stringRules = [noEmptyString()];
const userNameRules = [noEmptyString(), noWhiteSpaces];

const { t } = useI18n();
const authStore = useAuthStore();
const emit = defineEmits<Emits>();
const props = defineProps<Props>();
const userCreateForm = ref<QForm>();

const form = ref<CreateUserPayload | User>({ ...userSkeleton() });
const chosenProperties = ref<string[]>([]);

const role = computed(() => authStore.user!.role);
const availableRoles = computed(() => availableRolesBasedOn(role.value));
const organisationOptions = computed(() => props.organisations);
const chosenOrganisation = ref<OrganisationDoc | null>(
    props.organisations.length === 1 ? props.organisations[0] : null,
);
const emailSuffix = computed(() => {
    if (chosenOrganisation.value) {
        return `@${chosenOrganisation.value.name}.at`;
    }
    return "";
});

async function onSubmit() {
    if (await validateForm()) {
        prepareAndEmitSubmission();
    }
}

function onReset() {
    form.value = { ...userSkeleton() };
    resetProperties();
}

// Utility functions
function userSkeleton(user?: User): CreateUserPayload {
    return {
        id: "",
        name: "",
        username: "",
        email: "",
        password: "",
        role: Role.STAFF,
        status: ACTIVITY_STATUS.OFFLINE,
        relatedProperties: [],
        organisationId: "",
        ...(user || {}),
    };
}

function availableRolesBasedOn(role: string) {
    if (role === ADMIN) {
        return Object.values(Role);
    }
    return Object.values(Role).filter((r) => r !== Role.PROPERTY_OWNER);
}

async function validateForm() {
    if (!(await userCreateForm.value?.validate())) return false;
    const chosenRole = form.value.role;

    if (chosenRole !== Role.PROPERTY_OWNER && !chosenProperties.value.length) {
        showErrorMessage("You must select at least one property!");
        return false;
    }

    if (chosenRole === Role.PROPERTY_OWNER && !chosenOrganisation.value) {
        showErrorMessage("You must select an organisation!");
        return false;
    }

    return true;
}

function prepareAndEmitSubmission() {
    if (!chosenOrganisation.value) {
        throw new Error("chosenOrganisation is required");
    }
    const submission = {
        ...form.value,
        email: `${form.value.username}${emailSuffix.value}`,
        organisationId: chosenOrganisation.value.id,
        relatedProperties: chosenProperties.value,
    };
    emit("submit", submission);
}

function resetProperties() {
    chosenProperties.value = [];
}
</script>

<template>
    <div class="UserCreateForm">
        <q-form
            class="q-gutter-md q-pt-md q-pa-md"
            @submit="onSubmit"
            @reset="onReset"
            ref="userCreateForm"
        >
            <q-input
                v-model="form.name"
                standout
                rounded
                :label="t('UserCreateForm.userNameInputLabel')"
                :hint="t('UserCreateForm.userNameInputHint')"
                lazy-rules
                :rules="stringRules"
            />

            <q-input
                v-model="form.username"
                standout
                prefix="Email:"
                rounded
                :label="t('UserCreateForm.userMailInputLabel')"
                :hint="t('UserCreateForm.userMailInputHint')"
                :rules="userNameRules"
                :suffix="emailSuffix"
            >
                <template #prepend>
                    <q-icon name="at-symbol" />
                </template>
            </q-input>

            <q-input
                v-if="'password' in form"
                v-model="form.password"
                standout
                rounded
                :label="t('UserCreateForm.userPasswordInputLabel')"
                :hint="t('UserCreateForm.userPasswordInputHint')"
                lazy-rules
                :rules="stringRules"
            >
                <template #prepend>
                    <q-icon name="key" />
                </template>
            </q-input>

            <q-select
                v-model="form.role"
                :hint="t('UserCreateForm.userRoleSelectHint')"
                standout
                rounded
                :options="availableRoles"
                :label="t('UserCreateForm.userRoleSelectLabel')"
            />

            <q-select
                v-if="form.role === Role.PROPERTY_OWNER && props.organisations.length"
                v-model="chosenOrganisation"
                :hint="t('UserCreateForm.userOrganisationSelectHint')"
                standout
                rounded
                :options="organisationOptions"
                label="t('UserCreateForm.userOrganisationSelectLabel')"
                option-label="name"
                option-value="value"
            />
            <div v-else-if="form.role === Role.PROPERTY_OWNER && !props.organisations.length">
                {{ t("UserCreateForm.noOrganisationsMessage") }}
            </div>

            <div v-if="props.properties.length" class="q-gutter-sm q-mb-lg">
                <div>{{ t("UserCreateForm.usePropertiesCheckboxesTitle") }}</div>
                <div>
                    <q-checkbox
                        v-for="property in props.properties"
                        :key="property.id"
                        v-model="chosenProperties"
                        :val="property.id"
                        :label="property.name"
                        color="accent"
                    />
                </div>
            </div>

            <div>
                <q-btn
                    rounded
                    size="md"
                    :label="t('UserCreateForm.buttonSubmitLabel')"
                    type="submit"
                    class="button-gradient"
                />
                <q-btn
                    rounded
                    size="md"
                    outline
                    :label="t('UserCreateForm.buttonResetLabel')"
                    type="reset"
                    color="primary"
                    class="q-ml-sm"
                />
            </div>
        </q-form>
    </div>
</template>
