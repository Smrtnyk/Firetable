<script setup lang="ts">
import { Loading, QForm } from "quasar";
import { loginWithEmail } from "src/db";
import { minLength, noEmptyString } from "src/helpers/form-rules";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { computed, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n();

const firebaseErrorMessages = computed<Record<string, string>>(() => ({
    "auth/invalid-email": t("PageAuth.invalidEmailError"),
    "auth/user-not-found": t("PageAuth.userNotFoundError"),
    "auth/wrong-password": t("PageAuth.wrongPasswordError"),
}));

const router = useRouter();
const username = ref("");
const password = ref("");
const isPwd = ref(true);
const authForm = useTemplateRef<QForm>("authForm");
const usernameRule = [noEmptyString()];
const passwordRule = computed(() => [minLength(t("PageAuth.passwordMinLengthError"))]);

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
            firebaseErrorMessages.value[errorCode as string] ?? t("PageAuth.unexpectedError");
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
                    <h1 class="text-h5 text-center">{{ t("PageAuth.welcomeMessage") }}</h1>
                    <q-input
                        v-model="username"
                        class="q-mb-md"
                        outlined
                        :label="t('PageAuth.usernameLabel')"
                        :hint="t('PageAuth.usernameHint')"
                        lazy-rules
                        :rules="usernameRule"
                    />

                    <q-input
                        v-model="password"
                        class="q-mb-md"
                        outlined
                        :label="t('PageAuth.passwordLabel')"
                        :type="isPwd ? 'password' : 'text'"
                        :hint="t('PageAuth.passwordHint')"
                        :rules="passwordRule"
                    >
                        <template #append>
                            <q-icon
                                :name="isPwd ? 'fa fa-eye' : 'fa fa-eye-slash'"
                                class-name="cursor-pointer"
                                @click="() => (isPwd = !isPwd)"
                                aria-label="Toggle password visibility"
                            />
                        </template>
                    </q-input>

                    <q-btn
                        rounded
                        size="lg"
                        :label="t('PageAuth.loginButtonLabel')"
                        class="button-gradient q-ml-md"
                        @click="onSubmit"
                    />
                </q-form>
            </div>
        </div>
    </div>
</template>
