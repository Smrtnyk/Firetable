<script setup lang="ts">
import { ACTIVITY_STATUS, Role, CreateUserPayload } from "src/types/auth";
import { ref } from "vue";
import { noEmptyString } from "src/helpers/form-rules";
import { PROJECT_MAIL } from "src/config";
import { useAuthStore } from "src/stores/auth-store";

interface Props {
    floors: string[];
}

const user: CreateUserPayload = {
    id: "",
    name: "",
    email: "",
    password: "",
    floors: [],
    role: Role.WAITER,
    status: ACTIVITY_STATUS.OFFLINE,
};
const emit = defineEmits(["submit"]);
const props = defineProps<Props>();
const authStore = useAuthStore();
const form = ref<CreateUserPayload>({ ...user });
const stringRules = [noEmptyString()];
const roles = Object.values(Role);

function onSubmit() {
    form.value.email = form.value.email + PROJECT_MAIL;
    emit("submit", form.value);
}

function onReset() {
    form.value = { ...user };
}
</script>

<template>
    <div class="UserCreateForm">
        <q-dialog
            class="no-padding"
            :model-value="authStore.showCreateUserDialog"
            @update:model-value="authStore.toggleCreateUserDialogVisibility"
        >
            <div class="limited-width">
                <q-card>
                    <q-banner inline-actions rounded class="bg-gradient text-white">
                        <template #avatar>
                            <q-btn round class="q-mr-sm" flat icon="close" v-close-popup />
                        </template>
                        Create new user
                    </q-banner>
                    <q-form class="q-gutter-md q-pt-md q-pa-md" @submit="onSubmit" @reset="onReset">
                        <q-input
                            v-model="form.name"
                            standout
                            rounded
                            label="Fill name *"
                            hint="Name of the person, e.g. Max Mustermann"
                            lazy-rules
                            :rules="stringRules"
                        />

                        <q-input
                            v-model="form.email"
                            standout
                            rounded
                            label="Username *"
                            hint="Username without spaces and special charactes, e.g. max123"
                            :rules="stringRules"
                        />

                        <q-input
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
                            hint="Assign areas to user, multiple areas are allowed."
                            standout
                            rounded
                            multiple
                            :options="props.floors"
                            label="Areas"
                        />

                        <div>
                            <q-btn
                                rounded
                                size="md"
                                label="Submit"
                                type="submit"
                                class="button-gradient"
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
                </q-card>
            </div>
        </q-dialog>
    </div>
</template>
