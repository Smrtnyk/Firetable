<script setup lang="ts">
import type {
    EditUserPayload,
    OrganisationDoc,
    PropertyDoc,
    User,
    UserCapabilities,
    UserCapability,
} from "@firetable/types";
import type { VForm } from "vuetify/components";

import { DEFAULT_CAPABILITIES_BY_ROLE, Role } from "@firetable/types";
import { property } from "es-toolkit/compat";
import { noEmptyString, noWhiteSpaces, validateForm } from "src/helpers/form-rules";
import { computed, ref, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";

export interface UserEditFormProps {
    organisation: OrganisationDoc;
    properties: PropertyDoc[];
    selectedProperties: PropertyDoc[];
    user: User;
}

type Emits = (event: "submit", payload: Partial<User>) => void;

const nameRules = [noEmptyString()];
const stringRules = [noWhiteSpaces];
const userNameRules = [noWhiteSpaces];

const { t } = useI18n();
const emit = defineEmits<Emits>();
const props = defineProps<UserEditFormProps>();
const userEditForm = useTemplateRef("userEditForm");

function getUserCapabilities(): UserCapabilities {
    return {
        ...DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF],
        ...props.user.capabilities,
    };
}

const isStaff = computed(function () {
    return props.user.role === Role.STAFF;
});

const form = ref<EditUserPayload["updatedUser"]>({
    ...props.user,
    capabilities: isStaff.value ? getUserCapabilities() : undefined,
    password: "",
});
const chosenProperties = ref<string[]>(props.selectedProperties.map(property("id")));

const capabilitiesToDisplay = computed(function () {
    if (form.value.role === Role.STAFF) {
        return Object.entries(form.value.capabilities ?? {}) as [UserCapability, boolean][];
    }
    return [];
});

const editableRoles = [Role.MANAGER, Role.STAFF, Role.HOSTESS];
const isEditableRole = computed(function () {
    return editableRoles.includes(form.value.role as Role);
});

const emailSuffix = computed(function () {
    return `@${props.organisation.name}.org`;
});

const previousCapabilities: Partial<Record<Role, UserCapabilities>> = {
    [props.user.role]: { ...form.value.capabilities },
};

watch(
    () => form.value.role,
    function (newRole, oldRole) {
        // Store the current capabilities for the old role
        previousCapabilities[oldRole] = { ...form.value.capabilities };

        // Set capabilities to the stored capabilities for the new role if they exist,
        // otherwise, use the default capabilities for the new role
        form.value.capabilities = previousCapabilities[newRole]
            ? { ...previousCapabilities[newRole] }
            : { ...DEFAULT_CAPABILITIES_BY_ROLE[newRole] };
    },
);

function onReset(): void {
    form.value = {
        ...props.user,
        capabilities: isStaff.value ? getUserCapabilities() : undefined,
        password: "",
    };
    resetProperties();
}

async function onSubmit(): Promise<void> {
    if (await validateForm(userEditForm.value)) {
        prepareAndEmitSubmission();
    }
}

function prepareAndEmitSubmission(): void {
    const valuesToEmit = {
        ...form.value,
        relatedProperties: chosenProperties.value,
    };
    // Filter out empty or null values
    const filteredForm = Object.fromEntries(
        Object.entries(valuesToEmit).filter(function ([, value]) {
            return value !== "" && value != null;
        }),
    );

    if (filteredForm.username) {
        filteredForm.email = `${form.value.username}${emailSuffix.value}`;
    }

    emit("submit", filteredForm);
}

function resetProperties(): void {
    chosenProperties.value = props.selectedProperties.map(property("id"));
}
</script>

<template>
    <div class="UserEditForm">
        <v-form
            class="pa-4 d-flex flex-column"
            style="gap: 1.25rem"
            @submit.prevent="onSubmit"
            @reset.prevent="onReset"
            ref="userEditForm"
        >
            <v-text-field
                v-model="form.name"
                variant="outlined"
                label="Name *"
                aria-label="Name *"
                hint="Name of the person, e.g. Max Mustermann"
                :rules="nameRules"
            />

            <v-text-field
                v-model="form.username"
                variant="outlined"
                label="Username *"
                hint="Username without spaces and special characters, e.g. max123"
                :rules="userNameRules"
                :suffix="emailSuffix"
            />

            <v-text-field
                v-if="'password' in form"
                v-model="form.password"
                variant="outlined"
                label="User password *"
                hint="Password of the user"
                :rules="stringRules"
            />

            <v-select
                v-if="isEditableRole"
                v-model="form.role"
                hint="Assign role to user, default is Staff."
                variant="outlined"
                :items="editableRoles"
                label="Role"
                aria-label="Role"
            />

            <div v-if="isEditableRole">
                <div class="text-subtitle-1 mb-2">Properties:</div>
                <div v-if="properties.length > 0">
                    <v-checkbox
                        v-for="{ id, name } in props.properties"
                        :key="id"
                        v-model="chosenProperties"
                        :value="id"
                        :label="name"
                        color="secondary"
                        density="compact"
                        hide-details
                    />
                </div>
                <div v-else><p>No properties available. Please create some.</p></div>
            </div>

            <div v-if="capabilitiesToDisplay.length > 0 && form.capabilities">
                <div class="text-subtitle-1 mb-2">Capabilities:</div>
                <div v-for="[capability] in capabilitiesToDisplay" :key="capability">
                    <v-checkbox
                        v-model="form.capabilities[capability] as boolean"
                        :label="capability"
                        color="secondary"
                        density="compact"
                        hide-details
                    />
                </div>
            </div>

            <div>
                <v-btn flat rounded size="large" type="submit" color="primary">
                    {{ t("Global.submit") }}
                </v-btn>
                <v-btn
                    rounded
                    size="large"
                    variant="outlined"
                    type="reset"
                    color="primary"
                    class="ml-4"
                >
                    {{ t("Global.reset") }}
                </v-btn>
            </div>
        </v-form>
    </div>
</template>
