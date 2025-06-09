<script setup lang="ts">
import { loginWithEmail } from "src/db";
import { minLength, noEmptyString } from "src/helpers/form-rules";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { useGlobalStore } from "src/stores/global";
import { computed, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n();

const firebaseErrorMessages = computed<Record<string, string>>(() => ({
    "auth/invalid-email": t("PageAuth.invalidEmailError"),
    "auth/user-not-found": t("PageAuth.userNotFoundError"),
    "auth/wrong-password": t("PageAuth.wrongPasswordError"),
}));

const globalStore = useGlobalStore();
const router = useRouter();
const username = ref("");
const password = ref("");
const isPwd = ref(true);
const authForm = useTemplateRef("authForm");
const usernameRule = [noEmptyString()];
const passwordRule = computed(() => [minLength(t("PageAuth.passwordMinLengthError"))]);

async function onSubmit(): Promise<void> {
    if (!(await authForm.value?.validate())) {
        return;
    }

    try {
        globalStore.setLoading(true);
        await loginWithEmail(username.value, password.value);
        await router.replace("/");
    } catch (e: any) {
        const errorCode = e.code;
        const userFriendlyMessage =
            firebaseErrorMessages.value[errorCode as string] ?? t("PageAuth.unexpectedError");
        showErrorMessage(userFriendlyMessage);
    } finally {
        globalStore.setLoading(false);
    }
}
</script>

<template>
    <div class="PageAuth">
        <v-container class="fill-height pa-md-4">
            <v-row align="center" justify="center" class="text-center">
                <v-col>
                    <v-img class="ft-logo mx-auto" src="/icons/icon-256x256.png" max-width="150" />
                    <v-form
                        ref="authForm"
                        class="PageAuth__auth-form limited-width mx-auto"
                        greedy
                        @submit.prevent="onSubmit"
                    >
                        <h1 class="text-h5 text-center my-4">{{ t("PageAuth.welcomeMessage") }}</h1>
                        <v-text-field
                            v-model="username"
                            class="mb-4"
                            variant="outlined"
                            :label="t('PageAuth.usernameLabel')"
                            :hint="t('PageAuth.usernameHint')"
                            lazy-rules
                            :rules="usernameRule"
                            autocomplete="username"
                        />

                        <v-text-field
                            v-model="password"
                            class="mb-4"
                            variant="outlined"
                            :label="t('PageAuth.passwordLabel')"
                            :type="isPwd ? 'password' : 'text'"
                            :hint="t('PageAuth.passwordHint')"
                            :rules="passwordRule"
                            autocomplete="current-password"
                        >
                            <template #append-inner>
                                <v-icon
                                    :icon="isPwd ? 'fa:fas fa-eye' : 'fa:fas fa-eye-slash'"
                                    class="cursor-pointer"
                                    @click="isPwd = !isPwd"
                                    :aria-label="t('PageAuth.togglePasswordVisibility')"
                                />
                            </template>
                        </v-text-field>

                        <v-btn rounded size="large" class="button-gradient ml-md-4" type="submit">
                            {{ t("PageAuth.loginButtonLabel") }}
                        </v-btn>
                    </v-form>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<style lang="scss" scoped>
.PageAuth {
    background-color: rgb(var(--v-theme-background));
    color: rgb(var(--v-theme-on-background));
    min-height: 100vh;
    display: flex;
}

.button-gradient {
    background-image: linear-gradient(
        to right,
        rgb(var(--v-theme-primary)),
        rgb(var(--v-theme-secondary))
    );

    color: rgb(var(--v-theme-on-primary));
}

.v-icon {
    color: currentColor;
}
</style>
