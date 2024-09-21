<script setup lang="ts">
import type {
    EditUserPayload,
    OrganisationDoc,
    PropertyDoc,
    User,
    UserCapability,
} from "@firetable/types";
import { computed, ref, useTemplateRef } from "vue";
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

const defaultCapabilitiesForRole = DEFAULT_CAPABILITIES_BY_ROLE[Role.STAFF];
const userCapabilities = {
    ...defaultCapabilitiesForRole,
    ...props.user.capabilities,
};

const isStaff = computed(function () {
    return props.user.role === Role.STAFF;
});

const form = ref<EditUserPayload["updatedUser"]>({
    ...props.user,
    password: "",
    capabilities: isStaff.value ? userCapabilities : undefined,
});
const chosenProperties = ref<string[]>(props.selectedProperties.map(property("id")));

const capabilitiesToDisplay = computed(function () {
    if (form.value.role !== Role.STAFF) {
        return [];
    }
    return Object.entries(form.value.capabilities ?? DEFAULT_CAPABILITIES_BY_ROLE[form.value.role]);
});

const isEditableRole = computed(function () {
    return [Role.MANAGER, Role.STAFF, Role.HOSTESS].includes(form.value.role as Role);
});

const emailSuffix = computed(function () {
    return `@${props.organisation.name}.at`;
});

async function onSubmit(): Promise<void> {
    if (await userEditForm.value?.validate()) {
        prepareAndEmitSubmission();
    }
}

function prepareAndEmitSubmission(): void {
    // Filter out empty or null values
    const filteredForm = Object.fromEntries(
        Object.entries(form.value).filter(function ([, value]) {
            return value !== "" && value !== null;
        }),
    );

    if (form.value.username) {
        filteredForm.email = `${form.value.username}${emailSuffix.value}`;
    }

    emit("submit", {
        ...filteredForm,
        relatedProperties: chosenProperties.value,
    });
}

function onReset(): void {
    form.value = {
        ...props.user,
        password: "",
        capabilities: isStaff.value ? userCapabilities : undefined,
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
                :options="[Role.MANAGER, Role.STAFF]"
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

            <div v-if="form.capabilities">
                <div>Capabilities:</div>
                <div v-for="[capability] in capabilitiesToDisplay" :key="capability">
                    <q-checkbox
                        v-model="form.capabilities[capability as UserCapability]"
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
