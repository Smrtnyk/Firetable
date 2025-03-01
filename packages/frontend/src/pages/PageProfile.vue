<script setup lang="ts">
import { submitNewPassword } from "@firetable/backend";
import { storeToRefs } from "pinia";
import FTTitle from "src/components/FTTitle.vue";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { computed, nextTick, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const { user } = storeToRefs(useAuthStore());
const isInputEnabled = ref(false);
const newPassword = ref("");
const passwordInput = useTemplateRef<HTMLElement>("passwordInput");

function toggleInput(): void {
    isInputEnabled.value = !isInputEnabled.value;
    if (isInputEnabled.value) {
        nextTick(function () {
            passwordInput.value?.focus();
        });
    }
}

const avatar = computed(function () {
    if (!user.value) {
        return "";
    }

    const [first, last] = user.value.name.split(" ");
    if (!last) {
        return first[0];
    }
    return `${first[0]}${last[0]}`;
});

async function changePassword(): Promise<void> {
    if (!newPassword.value) {
        return;
    }

    await tryCatchLoadingWrapper({
        async hook() {
            await submitNewPassword(newPassword.value);
        },
    });
}
</script>

<template>
    <div class="PageProfile" v-if="user">
        <FTTitle :title="t('PageProfile.title', { name: user.name })" />
        <q-item>
            <q-item-section side>
                <q-avatar size="48px" class="ft-avatar">
                    {{ avatar }}
                </q-avatar>
            </q-item-section>
            <q-item-section>
                <q-card class="ft-card q-pa-md">
                    <q-item-label>{{ user.email }}</q-item-label>
                    <q-separator class="q-my-sm" />
                    <q-item-label v-if="user.name">{{
                        t("PageProfile.nameLabel", { name: user.name })
                    }}</q-item-label>
                    <q-item-label>{{
                        t("PageProfile.roleLabel", { role: user.role })
                    }}</q-item-label>
                </q-card>
            </q-item-section>
        </q-item>

        <q-item class="q-mt-md">
            <q-item-section>
                <div style="position: relative">
                    <q-input
                        ref="passwordInput"
                        v-model="newPassword"
                        :disable="!isInputEnabled"
                        :placeholder="t('PageProfile.passwordInputPlaceholder')"
                        clearable
                    ></q-input>
                    <q-btn
                        flat
                        dense
                        icon="pencil"
                        @click="toggleInput"
                        :color="isInputEnabled ? 'primary' : 'grey'"
                        :title="
                            isInputEnabled
                                ? t('PageProfile.passwordInputEnabledTitle')
                                : t('PageProfile.passwordInputDisabledTitle')
                        "
                        style="
                            position: absolute;
                            right: 8px;
                            top: 50%;
                            transform: translateY(-50%);
                        "
                    />
                </div>

                <q-btn
                    @click="changePassword"
                    :label="t('PageProfile.updatePasswordButtonLabel')"
                    class="q-mt-sm button-gradient"
                    :disable="!newPassword"
                />
            </q-item-section>
        </q-item>
    </div>
</template>
