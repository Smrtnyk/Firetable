<script setup lang="ts">
import type { CreateUserPayload, OrganisationDoc, PropertyDoc } from "@firetable/types";
import type { VForm } from "vuetify/components";

import { AdminRole, Role } from "@firetable/types";
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
const userCreateForm = useTemplateRef<VForm>("userCreateForm");

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
    userCreateForm.value?.reset();
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
    if (!(await userCreateForm.value?.validate())?.valid) {
        return false;
    }
    const chosenRole = form.value.role;

    if (
        chosenRole !== Role.PROPERTY_OWNER &&
        props.properties.length > 0 &&
        chosenProperties.value.length === 0
    ) {
        showErrorMessage("You must select at least one property for this role!");
        return false;
    }

    return true;
}
</script>

<template>
    <div class="user-create-form">
        <v-form
            ref="userCreateForm"
            class="pa-4 d-flex flex-column"
            style="gap: 1.25rem"
            @submit.prevent="onSubmit"
            @reset.prevent="onReset"
            greedy
        >
            <v-text-field
                v-model="form.name"
                variant="outlined"
                :label="t('UserCreateForm.userNameInputLabel')"
                :hint="t('UserCreateForm.userNameInputHint')"
                :rules="stringRules"
            />

            <v-text-field
                v-model="form.username"
                variant="outlined"
                :label="t('UserCreateForm.userMailInputLabel')"
                :hint="t('UserCreateForm.userMailInputHint')"
                :rules="userNameRules"
                :suffix="emailSuffix"
                prepend-inner-icon="fas fa-at"
            />

            <v-text-field
                v-if="'password' in form"
                v-model="form.password"
                variant="outlined"
                :label="t('UserCreateForm.userPasswordInputLabel')"
                :hint="t('UserCreateForm.userPasswordInputHint')"
                :rules="passwordRules"
                type="password"
                prepend-inner-icon="fas fa-key"
            />

            <v-select
                v-model="form.role"
                :hint="t('UserCreateForm.userRoleSelectHint')"
                variant="outlined"
                :items="availableRoles"
                :label="t('UserCreateForm.userRoleSelectLabel')"
            />

            <div v-if="shouldShowPropertiesSelection" class="mb-4">
                <div class="text-subtitle-1 mb-2">
                    {{ t("UserCreateForm.usePropertiesCheckboxesTitle") }}
                </div>
                <div>
                    <v-checkbox
                        v-for="property in props.properties"
                        :key="property.id"
                        v-model="chosenProperties"
                        :value="property.id"
                        :label="property.name"
                        color="secondary"
                        density="compact"
                        hide-details
                    />
                </div>
            </div>

            <div class="d-flex" style="gap: 8px">
                <v-btn rounded="lg" size="large" type="submit" class="button-gradient">
                    {{ t("Global.submit") }}
                </v-btn>
                <v-btn rounded="lg" size="large" variant="outlined" type="reset" color="primary">
                    {{ t("Global.reset") }}
                </v-btn>
            </div>
        </v-form>
    </div>
</template>
