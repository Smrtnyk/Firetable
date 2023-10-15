<script setup lang="ts">
import { computed, ref } from "vue";
import { noEmptyString, noWhiteSpaces } from "src/helpers/form-rules";
import { PROJECT_MAIL } from "src/config";
import {
    ACTIVITY_STATUS,
    ADMIN,
    CreateUserPayload,
    PropertyDoc,
    Role,
    User,
} from "@firetable/types";
import { QForm } from "quasar";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useAuthStore } from "stores/auth-store";

interface Props {
    properties: PropertyDoc[];
    selectedProperties?: PropertyDoc[];
    user?: User;
}

type Emits = (event: "submit", payload: CreateUserPayload | User) => void;

const authStore = useAuthStore();
const emit = defineEmits<Emits>();
const props = defineProps<Props>();
const userCreateForm = ref<QForm>();
const stringRules = [noEmptyString()];
const userNameRules = [noEmptyString(), noWhiteSpaces];
const userSkeleton: CreateUserPayload = {
    id: "",
    name: "",
    username: "",
    email: "",
    password: "",
    role: Role.STAFF,
    status: ACTIVITY_STATUS.OFFLINE,
    relatedProperties: [],
};

const form = ref<CreateUserPayload | User>(props.user ? { ...props.user } : { ...userSkeleton });
const chosenProperties = ref<string[]>([]);
const isPropertyOwner = computed(() => form.value.role === Role.PROPERTY_OWNER);
const isAdmin = computed(() => {
    return authStore.user?.role === ADMIN;
});
const availableRoles = computed(() => {
    if (isAdmin.value) {
        return Object.values(Role);
    } else {
        return Object.values(Role).filter((role) => role !== Role.PROPERTY_OWNER);
    }
});

if (props.selectedProperties) {
    chosenProperties.value = props.selectedProperties.map((p) => p.id);
}

async function onSubmit() {
    if (!(await userCreateForm.value?.validate())) return;
    if (!chosenProperties.value.length) {
        showErrorMessage("You must select at least one property!");
        return;
    }

    if (props.user) {
        emit("submit", {
            ...form.value,
            relatedProperties: chosenProperties.value,
        });
    } else {
        emit("submit", {
            ...form.value,
            email: form.value.username + PROJECT_MAIL,
            relatedProperties: chosenProperties.value,
        });
    }
}

function onReset() {
    if (props.user) {
        form.value = { ...props.user };
    } else {
        form.value = { ...userSkeleton };
    }

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
                label="Name *"
                hint="Name of the person, e.g. Max Mustermann"
                lazy-rules
                :rules="stringRules"
            />

            <q-input
                v-if="!props.user"
                v-model="form.username"
                standout
                rounded
                label="Username *"
                hint="Username without spaces and special characters, e.g. max123"
                :rules="userNameRules"
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
            >
                <template #prepend>
                    <q-icon name="key" />
                </template>
            </q-input>

            <q-select
                v-model="form.role"
                hint="Assign role to user, default is Staff."
                standout
                rounded
                :options="availableRoles"
                label="Role"
            />
            <div v-if="!isPropertyOwner" class="q-gutter-sm q-mb-lg">
                <div>Properties:</div>
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
                <q-btn rounded size="md" label="Submit" type="submit" class="button-gradient" />
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
