<script setup lang="ts">
import { Loading, QForm } from "quasar";
import { loginWithEmail } from "src/db";
import { minLength, noEmptyString } from "src/helpers/form-rules";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";

const firebaseErrorMessages: Record<string, string> = {
    "auth/invalid-email": "The email address you entered is invalid.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
};

const router = useRouter();
const username = ref("");
const password = ref("");
const isPwd = ref(true);
const authForm = useTemplateRef<QForm>("authForm");
const usernameRule = [noEmptyString()];
const passwordRule = [
    minLength("Please enter your password, it has to contain minimum 5 characters."),
];

async function onSubmit(): Promise<void> {
    if (!(await authForm.value?.validate())) {
        return;
    }

    try {
        Loading.show();
        await loginWithEmail(username.value, password.value);
        await router.replace("/");
    } catch (e: any) {
        const errorCode = e.code;
        const userFriendlyMessage =
            firebaseErrorMessages[errorCode] ?? "An unexpected error occurred. Please try again.";
        showErrorMessage(userFriendlyMessage);
    } finally {
        Loading.hide();
    }
}
</script>

<template>
    <div class="PageAuth">
        <div class="row window-height items-center q-pa-md justify-center text-center">
            <div class="col">
                <q-img class="ft-logo" src="/icons/icon-256x256.png" />
                <q-form ref="authForm" class="PageAuth__auth-form limited-width q-mx-auto" greedy>
                    <h1 class="text-h5 text-center">Welcome to Firetable</h1>
                    <q-input
                        v-model="username"
                        class="q-mb-md"
                        outlined
                        label="Username *"
                        hint="Enter username"
                        lazy-rules
                        :rules="usernameRule"
                    />

                    <q-input
                        v-model="password"
                        class="q-mb-md"
                        outlined
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
                                aria-label="Toggle password visibility"
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
