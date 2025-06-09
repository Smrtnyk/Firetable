<script setup lang="ts">
import { storeToRefs } from "pinia";
import FTTitle from "src/components/FTTitle.vue";
import { submitNewPassword } from "src/db";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { computed, nextTick, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const { user } = storeToRefs(useAuthStore());
const isInputEnabled = ref(false);
const newPassword = ref("");
const passwordInput = useTemplateRef("passwordInput");

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
        return first[0].toUpperCase();
    }
    return `${first[0]}${last[0]}`.toUpperCase();
});

async function changePassword(): Promise<void> {
    if (!newPassword.value) {
        return;
    }

    await tryCatchLoadingWrapper({
        async hook() {
            await submitNewPassword(newPassword.value);
            newPassword.value = "";
            isInputEnabled.value = false;
        },
    });
}
</script>

<template>
    <div class="PageProfile" v-if="user">
        <FTTitle :title="t('PageProfile.title', { name: user.name })" />

        <v-list-item class="mb-4 px-0">
            <template #prepend>
                <v-avatar size="48" color="primary" class="ft-avatar mr-4">
                    <span class="text-h6">{{ avatar }}</span>
                </v-avatar>
            </template>

            <v-card class="ft-card">
                <v-card-text class="pa-4">
                    <div class="text-subtitle-1">{{ user.email }}</div>
                    <v-divider class="my-2" />
                    <div v-if="user.name" class="text-body-1">
                        {{ t("PageProfile.nameLabel", { name: user.name }) }}
                    </div>
                    <div class="text-body-1">
                        {{ t("PageProfile.roleLabel", { role: user.role }) }}
                    </div>
                </v-card-text>
            </v-card>
        </v-list-item>

        <v-card class="ft-card mt-4">
            <v-card-text class="pa-4">
                <v-text-field
                    ref="passwordInput"
                    v-model="newPassword"
                    :disabled="!isInputEnabled"
                    :label="t('PageProfile.passwordInputPlaceholder')"
                    clearable
                    :type="isInputEnabled ? 'text' : 'password'"
                    variant="outlined"
                    class="mb-3"
                >
                    <template #append-inner>
                        <v-icon
                            icon="fa:fas fa-pencil"
                            @click="toggleInput"
                            :color="isInputEnabled ? 'primary' : 'grey'"
                            :aria-label="
                                isInputEnabled
                                    ? t('PageProfile.passwordInputEnabledTitle')
                                    : t('PageProfile.passwordInputDisabledTitle')
                            "
                            class="cursor-pointer"
                        />
                    </template>
                </v-text-field>

                <v-btn
                    @click="changePassword"
                    :disabled="!newPassword || !isInputEnabled"
                    class="button-gradient"
                    color="primary"
                    block
                >
                    {{ t("PageProfile.updatePasswordButtonLabel") }}
                </v-btn>
            </v-card-text>
        </v-card>
    </div>
</template>
