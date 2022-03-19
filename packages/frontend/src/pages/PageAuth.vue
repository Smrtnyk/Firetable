<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { PROJECT_MAIL } from "src/config";
import { minLength, noEmptyString } from "src/helpers/form-rules";
import { QForm } from "quasar";
import { tryCatchLoadingWrapper } from "@firetable/utils";
import { loginWithEmail } from "@firetable/backend";

const router = useRouter();
const username = ref("");
const password = ref("");
const isPwd = ref(true);
const authForm = ref<QForm | null>(null);
const usernameRule = [noEmptyString()];
const passwordRule = [
    minLength("Please enter your password, it has to contain minimum 5 characters."),
];

async function onSubmit() {
    if (!(await authForm.value?.validate())) return;
    const validEmail = `${username.value}${PROJECT_MAIL}`;

    await tryCatchLoadingWrapper(async () => {
        await loginWithEmail(validEmail, password.value);
        await router.replace("/");
    });
}
</script>

<template>
    <div class="PageAuth">
        <div class="row window-height items-center q-pa-md justify-center text-center">
            <div class="col">
                <q-img class="ft-logo" src="/icons/icon-256x256.png" />
                <q-form ref="authForm" class="PageAuth__auth-form limited-width q-mx-auto">
                    <h1 class="text-h5 text-center">Welcome to Firetable</h1>
                    <q-input
                        v-model="username"
                        rounded
                        class="q-mb-md"
                        standout
                        label="Username *"
                        hint="Enter username"
                        lazy-rules
                        :rules="usernameRule"
                    />

                    <q-input
                        v-model="password"
                        class="q-mb-md"
                        rounded
                        standout
                        label="Password *"
                        :type="isPwd ? 'password' : 'text'"
                        hint="Enter your password"
                        :rules="passwordRule"
                    >
                        <template #append>
                            <q-icon
                                :name="isPwd ? 'eye-open' : 'eye-off'"
                                class-name="cursor-pointer"
                                @click="() => (isPwd = !isPwd)"
                            />
                        </template>
                    </q-input>

                    <q-btn
                        rounded
                        size="lg"
                        label="Login"
                        class="button-gradient q-ml-md"
                        @click="onSubmit"
                    />
                </q-form>
            </div>
        </div>
    </div>
</template>
