<script setup lang="ts">
import { Role, CreateUserPayload, User, ACTIVITY_STATUS } from "src/types/auth";
import { ref } from "vue";
import { noEmptyString, noWhiteSpaces } from "src/helpers/form-rules";
import { PROJECT_MAIL } from "src/config";
import { useAuthStore } from "src/stores/auth-store";

interface Props {
    floors: string[];
    user?: User;
}

const userSkeleton: CreateUserPayload = {
    id: "",
    name: "",
    username: "",
    email: "",
    password: "",
    floors: [],
    role: Role.WAITER,
    status: ACTIVITY_STATUS.OFFLINE,
};
const emit = defineEmits(["submit"]);
const props = defineProps<Props>();
const authStore = useAuthStore();
const form = ref<CreateUserPayload | User>(props.user ? { ...props.user } : { ...userSkeleton });
const stringRules = [noEmptyString()];
const userNameRules = [noEmptyString(), noWhiteSpaces];
const roles = Object.values(Role);

function onSubmit() {
    if (props.user) {
        emit("submit", {
            ...form.value,
        });
    } else {
        emit("submit", {
            ...form.value,
            email: form.value.username + PROJECT_MAIL,
        });
    }
}

function onReset() {
    if (props.user) {
        form.value = { ...props.user };
    } else {
        form.value = { ...userSkeleton };
    }
}
</script>

<template>
    <div class="UserCreateForm">
        <q-form class="q-gutter-md q-pt-md q-pa-md" @submit="onSubmit" @reset="onReset">
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
                v-if="!props.user"
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
                hint="Assign role to user, default is waiter."
                standout
                rounded
                :options="roles"
                label="Role"
            />
            <q-select
                v-model="form.floors"
                hint="Assign Floors to user, multiple Floors are allowed."
                standout
                rounded
                multiple
                :options="props.floors"
                label="Floors"
            />

            <div>
                <q-btn
                    rounded
                    size="md"
                    label="Submit"
                    type="submit"
                    class="button-gradient"
                    v-close-popup
                />
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
