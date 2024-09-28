<script setup lang="ts">
import type {
    EditUserPayload,
    OrganisationDoc,
    PropertyDoc,
    User,
    UserCapabilities,
    UserCapability,
} from "@firetable/types";
import { computed, ref, useTemplateRef, watch } from "vue";
import { DEFAULT_CAPABILITIES_BY_ROLE, Role } from "@firetable/types";
import { QForm } from "quasar";
import { noEmptyString, noWhiteSpaces } from "src/helpers/form-rules";
import { property } from "es-toolkit/compat";

interface Props {
    user: User;
    properties: PropertyDoc[];
    selectedProperties: PropertyDoc[];
    organisation: OrganisationDoc;
}

type Emits = (event: "submit", payload: Partial<User>) => void;

const nameRules = [noEmptyString()];
const stringRules = [noWhiteSpaces];
const userNameRules = [noWhiteSpaces];

const emit = defineEmits<Emits>();
const props = defineProps<Props>();
const userEditForm = useTemplateRef<QForm>("userEditForm");

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
    password: "",
    capabilities: isStaff.value ? getUserCapabilities() : undefined,
});
const chosenProperties = ref<string[]>(props.selectedProperties.map(property("id")));

const capabilitiesToDisplay = computed(() => {
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
    return `@${props.organisation.name}.at`;
});

// Store custom capabilities per role
const previousCapabilities: Partial<Record<Role, UserCapabilities>> = {
    [props.user.role]: { ...form.value.capabilities },
};

watch(
    () => form.value.role,
    (newRole, oldRole) => {
        // Store the current capabilities for the old role
        previousCapabilities[oldRole] = { ...form.value.capabilities };

        // Set capabilities to the stored capabilities for the new role if they exist,
        // otherwise, use the default capabilities for the new role
        form.value.capabilities = previousCapabilities[newRole]
            ? { ...previousCapabilities[newRole] }
            : { ...DEFAULT_CAPABILITIES_BY_ROLE[newRole] };
    },
);

async function onSubmit(): Promise<void> {
    if (await userEditForm.value?.validate()) {
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

function onReset(): void {
    form.value = {
        ...props.user,
        password: "",
        capabilities: isStaff.value ? getUserCapabilities() : undefined,
    };
    resetProperties();
}

function resetProperties(): void {
    chosenProperties.value = props.selectedProperties.map(property("id"));
}
</script>

<template>
    <div class="UserEditForm">
        <q-form
            class="q-gutter-md q-pt-md q-pa-md"
            @submit="onSubmit"
            @reset="onReset"
            ref="userEditForm"
        >
            <q-input
                v-model="form.name"
                standout
                rounded
                label="Name *"
                hint="Name of the person, e.g. Max Mustermann"
                lazy-rules
                :rules="nameRules"
            />

            <q-input
                v-model="form.username"
                standout
                prefix="Email:"
                rounded
                label="Username *"
                hint="Username without spaces and special characters, e.g. max123"
                :rules="userNameRules"
                :suffix="emailSuffix"
            />

            <q-input
                v-if="'password' in form"
                v-model="form.password"
                standout
                rounded
                label="User password *"
                hint="Password of the user"
                lazy-rules
                :rules="stringRules"
            />

            <q-select
                v-if="isEditableRole"
                v-model="form.role"
                hint="Assign role to user, default is Staff."
                standout
                rounded
                :options="editableRoles"
                label="Role"
            />

            <div v-if="isEditableRole" class="q-gutter-sm q-mb-lg">
                <div>Properties:</div>
                <div v-if="properties.length > 0">
                    <q-checkbox
                        v-for="property in props.properties"
                        :key="property.id"
                        v-model="chosenProperties"
                        :val="property.id"
                        :label="property.name"
                        color="accent"
                    />
                </div>
                <div v-else><p>No properties available. Please create some.</p></div>
            </div>

            <div v-if="capabilitiesToDisplay.length > 0 && form.capabilities">
                <div>Capabilities:</div>
                <div v-for="[capability] in capabilitiesToDisplay" :key="capability">
                    <q-checkbox
                        v-model="form.capabilities[capability]"
                        :label="capability"
                        color="accent"
                    />
                </div>
            </div>

            <div>
                <q-btn rounded size="md" label="Update" type="submit" class="button-gradient" />
                <q-btn
                    rounded
                    size="md"
                    outline
                    label="Reset"
                    type="reset"
                    color="primary"
                    class="q-ml-sm"
                />
            </div>
        </q-form>
    </div>
</template>
