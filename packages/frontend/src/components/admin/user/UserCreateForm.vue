<script setup lang="ts">
import type { CreateUserPayload, OrganisationDoc, PropertyDoc } from "@firetable/types";

import { AdminRole, Role } from "@firetable/types";
import { QForm } from "quasar";
import {
    hasNumbers,
    hasSymbols,
    hasUpperCase,
    minLength,
    noEmptyString,
    noWhiteSpaces,
} from "src/helpers/form-rules";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { computed, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

export interface UserCreateFormProps {
    organisation: OrganisationDoc;
    properties: PropertyDoc[];
}

type Emits = (event: "submit", payload: CreateUserPayload) => void;

const { t } = useI18n();
const authStore = useAuthStore();
const emit = defineEmits<Emits>();
const props = defineProps<UserCreateFormProps>();
const userCreateForm = useTemplateRef<QForm>("userCreateForm");

const form = ref<CreateUserPayload>(userSkeleton());
const chosenProperties = ref<string[]>([]);

const stringRules = [noEmptyString()];
const userNameRules = [noEmptyString(), noWhiteSpaces];
const passwordRules = [
    noEmptyString(t("validation.passwordRequired")),
    minLength(t("validation.passwordMinLength"), 6),
    hasUpperCase(t("validation.passwordHasUpperCase")),
    hasNumbers(t("validation.passwordHasNumbers")),
    hasSymbols(t("validation.passwordHasSymbols")),
];

const currUserRole = computed(function () {
    return authStore.nonNullableUser.role;
});
const availableRoles = computed(function () {
    return availableRolesBasedOn(currUserRole.value);
});
const emailSuffix = computed(function () {
    return `@${props.organisation.name}.org`;
});
const shouldShowPropertiesSelection = computed(function () {
    return props.properties.length > 0 && form.value.role !== Role.PROPERTY_OWNER;
});

function onReset(): void {
    form.value = { ...userSkeleton() };
    resetProperties();
}

async function onSubmit(): Promise<void> {
    if (await validateForm()) {
        prepareAndEmitSubmission();
    }
}

function userSkeleton(): CreateUserPayload {
    return {
        capabilities: undefined,
        email: "",
        id: "",
        name: "",
        organisationId: "",
        password: "",
        relatedProperties: [],
        role: Role.STAFF,
        username: "",
    };
}

const roleValues: Role[] = [Role.PROPERTY_OWNER, Role.STAFF, Role.HOSTESS, Role.MANAGER];
function availableRolesBasedOn(roleVal: string): Role[] {
    if (roleVal === AdminRole.ADMIN) {
        return roleValues;
    }
    return roleValues.filter(function (role) {
        return role !== Role.PROPERTY_OWNER;
    });
}

function prepareAndEmitSubmission(): void {
    const submission = {
        ...form.value,
        email: `${form.value.username}${emailSuffix.value}`,
        organisationId: props.organisation.id,
        relatedProperties: chosenProperties.value || [],
    };
    emit("submit", submission);
}

function resetProperties(): void {
    chosenProperties.value = [];
}

async function validateForm(): Promise<boolean> {
    if (!(await userCreateForm.value?.validate())) {
        return false;
    }
    const chosenRole = form.value.role;

    if (chosenRole !== Role.PROPERTY_OWNER && chosenProperties.value.length === 0) {
        showErrorMessage("You must select at least one property!");
        return false;
    }

    return true;
}
</script>

<template>
    <div class="UserCreateForm">
        <q-form
            class="q-gutter-md q-pt-md q-pa-md"
            @submit="onSubmit"
            @reset="onReset"
            ref="userCreateForm"
            greedy
        >
            <q-input
                v-model="form.name"
                outlined
                :label="t('UserCreateForm.userNameInputLabel')"
                :hint="t('UserCreateForm.userNameInputHint')"
                lazy-rules
                :rules="stringRules"
            />

            <q-input
                v-model="form.username"
                outlined
                prefix="Email:"
                :label="t('UserCreateForm.userMailInputLabel')"
                :hint="t('UserCreateForm.userMailInputHint')"
                :rules="userNameRules"
                :suffix="emailSuffix"
            >
                <template #prepend>
                    <q-icon name="fa fa-at" />
                </template>
            </q-input>

            <q-input
                v-if="'password' in form"
                v-model="form.password as string"
                outlined
                :label="t('UserCreateForm.userPasswordInputLabel')"
                :hint="t('UserCreateForm.userPasswordInputHint')"
                lazy-rules
                :rules="passwordRules"
            >
                <template #prepend>
                    <q-icon name="fa fa-key" />
                </template>
            </q-input>

            <q-select
                v-model="form.role"
                :hint="t('UserCreateForm.userRoleSelectHint')"
                outlined
                :options="availableRoles"
                :label="t('UserCreateForm.userRoleSelectLabel')"
            />

            <div v-if="shouldShowPropertiesSelection" class="q-gutter-sm q-mb-lg">
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
                    :label="t('Global.submit')"
                    type="submit"
                    class="button-gradient"
                />
                <q-btn
                    rounded
                    size="md"
                    outline
                    :label="t('Global.reset')"
                    type="reset"
                    color="primary"
                    class="q-ml-sm"
                />
            </div>
        </q-form>
    </div>
</template>
