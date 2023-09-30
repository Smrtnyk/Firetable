<script setup lang="ts">
import { ref } from "vue";
import { noEmptyString, noWhiteSpaces } from "src/helpers/form-rules";
import { PROJECT_MAIL } from "src/config";
import { ACTIVITY_STATUS, CreateUserPayload, Role, User, UserClubs } from "@firetable/types";

interface Props {
    clubs: UserClubs[];
    user?: User;
}

const emit = defineEmits(["submit"]);
const props = defineProps<Props>();
const stringRules = [noEmptyString()];
const userNameRules = [noEmptyString(), noWhiteSpaces];
const userSkeleton: CreateUserPayload = {
    id: "",
    name: "",
    username: "",
    email: "",
    password: "",
    clubs: [],
    role: Role.WAITER,
    status: ACTIVITY_STATUS.OFFLINE,
};
const form = ref<CreateUserPayload | User>(props.user ? { ...props.user } : { ...userSkeleton });

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
                hint="Assign role to user, default is waiter."
                standout
                rounded
                :options="Object.values(Role)"
                label="Role"
            />
            <div class="q-gutter-sm q-mb-lg">
                <div>Clubs:</div>
                <div>
                    <q-checkbox
                        v-for="club in props.clubs"
                        :key="club.id"
                        v-model="form.clubs"
                        :val="club.id"
                        :label="club.name"
                        color="accent"
                    />
                </div>
            </div>

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
