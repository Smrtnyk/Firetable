<script setup lang="ts">
import { storeToRefs } from "pinia";
import BuildInfoFooter from "src/components/BuildInfoFooter.vue";
import { submitNewPassword } from "src/db";
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
    } else {
        newPassword.value = "";
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
            newPassword.value = "";
            isInputEnabled.value = false;
        },
    });
}
</script>

<template>
    <div class="PageProfile" v-if="user">
        <div class="PageProfile__container">
            <!-- Header -->
            <div class="PageProfile__header">
                <h1 class="PageProfile__title">
                    {{ t("PageProfile.title", { name: user.name }) }}
                </h1>
                <p class="PageProfile__subtitle">{{ t("PageProfile.subtitle") }}</p>
            </div>

            <!-- Profile Section -->
            <div class="PageProfile__section">
                <div class="PageProfile__section-header">
                    <v-icon class="PageProfile__section-icon">fas fa-user</v-icon>
                    <h2 class="PageProfile__section-title">
                        {{ t("PageProfile.sections.profileInformation") }}
                    </h2>
                </div>

                <v-card class="PageProfile__card">
                    <v-card-text class="pa-6">
                        <div class="PageProfile__avatar-section">
                            <v-avatar size="80" class="PageProfile__avatar">
                                <span class="text-h4 font-weight-bold">{{ avatar }}</span>
                            </v-avatar>
                            <div class="PageProfile__user-info">
                                <h3
                                    class="PageProfile__user-name"
                                    :aria-label="t('PageProfile.nameLabel')"
                                >
                                    {{ user.name }}
                                </h3>
                                <p class="PageProfile__user-email">{{ user.email }}</p>
                                <v-chip
                                    class="PageProfile__user-role"
                                    :aria-label="t('PageProfile.roleLabel')"
                                    color="primary"
                                    variant="tonal"
                                    size="small"
                                    prepend-icon="fas fa-shield-alt"
                                >
                                    {{ user.role }}
                                </v-chip>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </div>

            <!-- Security Section -->
            <div class="PageProfile__section">
                <div class="PageProfile__section-header">
                    <v-icon class="PageProfile__section-icon">fas fa-lock</v-icon>
                    <h2 class="PageProfile__section-title">
                        {{ t("PageProfile.sections.security") }}
                    </h2>
                </div>

                <v-card class="PageProfile__card">
                    <v-card-text class="pa-6">
                        <div class="PageProfile__password-section">
                            <div class="PageProfile__field-header">
                                <h4 class="PageProfile__field-title">
                                    {{ t("PageProfile.fields.changePassword.title") }}
                                </h4>
                                <p class="PageProfile__field-description">
                                    {{ t("PageProfile.fields.changePassword.description") }}
                                </p>
                            </div>

                            <div class="PageProfile__password-input">
                                <div class="PageProfile__password-field">
                                    <v-text-field
                                        ref="passwordInput"
                                        v-model="newPassword"
                                        :disabled="!isInputEnabled"
                                        :placeholder="t('PageProfile.passwordInputPlaceholder')"
                                        type="password"
                                        variant="outlined"
                                        density="comfortable"
                                        class="PageProfile__input"
                                        clearable
                                        hide-details
                                    />
                                    <v-btn
                                        icon
                                        variant="text"
                                        density="comfortable"
                                        @click="toggleInput"
                                        :color="isInputEnabled ? 'error' : 'primary'"
                                        class="PageProfile__edit-btn"
                                    >
                                        <v-icon>{{
                                            isInputEnabled ? "fas fa-times" : "fas fa-edit"
                                        }}</v-icon>

                                        <v-tooltip activator="parent" location="top">
                                            {{
                                                isInputEnabled
                                                    ? t("PageProfile.passwordInputEnabledTitle")
                                                    : t("PageProfile.passwordInputDisabledTitle")
                                            }}
                                        </v-tooltip>
                                    </v-btn>
                                </div>
                            </div>

                            <div class="PageProfile__password-actions" v-if="isInputEnabled">
                                <v-btn
                                    @click="changePassword"
                                    color="primary"
                                    :disabled="!newPassword"
                                    prepend-icon="fas fa-save"
                                    class="PageProfile__save-btn"
                                >
                                    {{ t("PageProfile.updatePasswordButtonLabel") }}
                                </v-btn>
                                <v-btn
                                    @click="toggleInput"
                                    variant="text"
                                    color="grey-darken-1"
                                    class="ml-2"
                                >
                                    {{ t("PageProfile.buttons.cancel") }}
                                </v-btn>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </div>
        </div>

        <BuildInfoFooter />
    </div>
</template>

<style lang="scss" scoped>
@use "src/css/variables.scss" as *;

.PageProfile {
    min-height: 100vh;
    padding: 16px;

    &__container {
        max-width: 800px;
        margin: 0 auto;
    }

    &__header {
        text-align: center;
        margin-bottom: 48px;
    }

    &__title {
        font-size: 32px;
        font-weight: 700;
        color: $text-primary;
        margin: 0 0 8px 0;
        line-height: 1.2;
    }

    &__subtitle {
        font-size: 16px;
        color: $text-tertiary;
        margin: 0;
    }

    &__section {
        margin-bottom: 32px;

        &-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
        }

        &-icon {
            color: $icon-primary;
            font-size: 20px;
        }

        &-title {
            font-size: 20px;
            font-weight: 600;
            color: $text-primary;
            margin: 0;
        }
    }

    &__avatar-section {
        display: flex;
        align-items: center;
        gap: 20px;
    }

    &__avatar {
        background: $avatar-bg;
        color: white;

        :deep(.v-avatar__content) {
            text-transform: uppercase;
        }
    }

    &__user-info {
        flex: 1;
    }

    &__user-name {
        font-size: 24px;
        font-weight: 700;
        color: $text-primary;
        margin: 0 0 4px 0;
    }

    &__user-email {
        font-size: 16px;
        color: $text-tertiary;
        margin: 0 0 12px 0;
    }

    &__user-role {
        font-size: 14px;
        font-weight: 500;

        :deep(.v-chip__prepend) {
            .v-icon {
                font-size: 12px;
            }
        }
    }

    &__field-header {
        margin-bottom: 20px;
    }

    &__field-title {
        font-size: 18px;
        font-weight: 600;
        color: $text-primary;
        margin: 0 0 4px 0;
    }

    &__field-description {
        font-size: 14px;
        color: $text-tertiary;
        margin: 0;
    }

    &__password-input {
        margin-bottom: 16px;
    }

    &__password-field {
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    &__input {
        flex: 1;

        :deep(.v-field__outline) {
            border-radius: 12px;
        }
    }

    &__edit-btn {
        flex-shrink: 0;
    }

    &__password-actions {
        display: flex;
        align-items: center;
    }

    &__save-btn {
        border-radius: 8px;
        font-weight: 600;
    }
}

// Dark mode support
.v-theme--dark .PageProfile {
    &__title {
        color: $text-primary-dark;
    }

    &__subtitle {
        color: $text-tertiary-dark;
    }

    &__section-title {
        color: $text-primary-dark;
    }

    &__section-icon {
        color: $icon-primary-dark;
    }

    &__avatar {
        background: $avatar-bg-dark;
    }

    &__user-name {
        color: $text-primary-dark;
    }

    &__user-email {
        color: $text-tertiary-dark;
    }

    &__field-title {
        color: $text-primary-dark;
    }

    &__field-description {
        color: $text-tertiary-dark;
    }
}

@media (max-width: 768px) {
    .PageProfile {
        padding: 10px;

        &__title {
            font-size: 24px;
        }

        &__avatar-section {
            flex-direction: column;
            text-align: center;
            gap: 16px;
        }

        &__user-info {
            text-align: center;
        }

        &__card {
            :deep(.v-card-text) {
                padding: 20px;
            }
        }

        &__password-actions {
            flex-direction: column;
            gap: 8px;

            .v-btn {
                width: 100%;
            }

            .ml-2 {
                margin-left: 0 !important;
            }
        }
    }
}

@media (max-width: 480px) {
    .PageProfile {
        &__user-name {
            font-size: 20px;
        }

        &__card {
            :deep(.v-card-text) {
                padding: 16px;
            }
        }
    }
}
</style>
