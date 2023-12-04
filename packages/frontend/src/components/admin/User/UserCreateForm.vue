<script setup lang="ts">
import type { CreateUserPayload, OrganisationDoc, PropertyDoc, User } from "@firetable/types";
import { computed, ref } from "vue";
import { ADMIN, Role } from "@firetable/types";
import { QForm } from "quasar";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { noEmptyString, noWhiteSpaces } from "src/helpers/form-rules";
import { useI18n } from "vue-i18n";

interface Props {
    properties: PropertyDoc[];
    organisation: OrganisationDoc;
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
const emailSuffix = computed(() => {
    return `@${props.organisation.name}.at`;
});

async function onSubmit(): Promise<void> {
    if (await validateForm()) {
        prepareAndEmitSubmission();
    }
}

function onReset(): void {
    form.value = { ...userSkeleton() };
    resetProperties();
}

function userSkeleton(): CreateUserPayload {
    return {
        id: "",
        name: "",
        username: "",
        email: "",
        password: "",
        role: Role.STAFF,
        relatedProperties: [],
        organisationId: "",
    };
}

function availableRolesBasedOn(roleVal: string): Role[] {
    if (roleVal === ADMIN) {
        return Object.values(Role);
    }
    return Object.values(Role).filter((r) => r !== Role.PROPERTY_OWNER);
}

async function validateForm(): Promise<boolean> {
    if (!(await userCreateForm.value?.validate())) return false;
    const chosenRole = form.value.role;

    if (chosenRole !== Role.PROPERTY_OWNER && chosenProperties.value.length === 0) {
        showErrorMessage("You must select at least one property!");
        return false;
    }

    return true;
}

function prepareAndEmitSubmission(): void {
    const submission = {
        ...form.value,
        email: `${form.value.username}${emailSuffix.value}`,
        organisationId: props.organisation.id,
        relatedProperties: chosenProperties.value,
    };
    emit("submit", submission);
}

function resetProperties(): void {
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

            <div v-if="props.properties.length > 0" class="q-gutter-sm q-mb-lg">
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
