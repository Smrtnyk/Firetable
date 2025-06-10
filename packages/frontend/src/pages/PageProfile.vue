<script setup lang="ts">
import { storeToRefs } from "pinia";
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
                <p class="PageProfile__subtitle">Manage your account settings and preferences</p>
            </div>

            <!-- Profile Section -->
            <div class="PageProfile__section">
                <div class="PageProfile__section-header">
                    <i class="fas fa-user PageProfile__section-icon" />
                    <h2 class="PageProfile__section-title">Profile Information</h2>
                </div>

                <div class="PageProfile__card">
                    <div class="PageProfile__avatar-section">
                        <div class="PageProfile__avatar">
                            {{ avatar }}
                        </div>
                        <div class="PageProfile__user-info">
                            <h3
                                class="PageProfile__user-name"
                                :aria-label="t('PageProfile.nameLabel')"
                            >
                                {{ user.name }}
                            </h3>
                            <p class="PageProfile__user-email">{{ user.email }}</p>
                            <div
                                class="PageProfile__user-role"
                                :aria-label="t('PageProfile.roleLabel')"
                            >
                                <i class="fas fa-shield-alt" />
                                <span>{{ user.role }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Security Section -->
            <div class="PageProfile__section">
                <div class="PageProfile__section-header">
                    <i class="fas fa-lock PageProfile__section-icon" />
                    <h2 class="PageProfile__section-title">Security</h2>
                </div>

                <div class="PageProfile__card">
                    <div class="PageProfile__password-section">
                        <div class="PageProfile__field-header">
                            <h4 class="PageProfile__field-title">Change Password</h4>
                            <p class="PageProfile__field-description">
                                Update your password to keep your account secure
                            </p>
                        </div>

                        <div class="PageProfile__password-input">
                            <div class="PageProfile__password-field">
                                <q-input
                                    ref="passwordInput"
                                    v-model="newPassword"
                                    :disable="!isInputEnabled"
                                    :placeholder="t('PageProfile.passwordInputPlaceholder')"
                                    type="password"
                                    outlined
                                    class="PageProfile__input"
                                    clearable
                                />
                                <q-btn
                                    flat
                                    round
                                    dense
                                    :icon="isInputEnabled ? 'fas fa-times' : 'fas fa-edit'"
                                    @click="toggleInput"
                                    :color="isInputEnabled ? 'negative' : 'primary'"
                                    class="PageProfile__edit-btn"
                                >
                                    <q-tooltip>{{
                                        isInputEnabled
                                            ? t("PageProfile.passwordInputEnabledTitle")
                                            : t("PageProfile.passwordInputDisabledTitle")
                                    }}</q-tooltip>
                                </q-btn>
                            </div>
                        </div>

                        <div class="PageProfile__password-actions" v-if="isInputEnabled">
                            <q-btn
                                @click="changePassword"
                                :label="t('PageProfile.updatePasswordButtonLabel')"
                                color="primary"
                                :disable="!newPassword"
                                icon="fas fa-save"
                                class="PageProfile__save-btn"
                            />
                            <q-btn
                                @click="toggleInput"
                                label="Cancel"
                                flat
                                color="grey-7"
                                class="q-ml-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.PageProfile {
    min-height: 100vh;
    padding: 24px;

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

    &__card {
        background: $surface-elevated;
        border-radius: 16px;
        padding: 24px;
        box-shadow: $box-shadow;
        border: 1px solid $border-light;
    }

    &__avatar-section {
        display: flex;
        align-items: center;
        gap: 20px;
    }

    &__avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: $avatar-bg;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 32px;
        font-weight: 600;
        text-transform: uppercase;
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
        align-items: center;
        gap: 8px;
        background: $surface-secondary;
        padding: 8px 16px;
        border-radius: 20px;
        display: inline-flex;
        font-size: 14px;
        font-weight: 500;
        color: $text-secondary;

        i {
            color: $icon-primary;
            font-size: 12px;
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

        :deep(.q-field__control) {
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
.body--dark .PageProfile {
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

    &__card {
        background: $surface-secondary-dark;
        border-color: $border-light-dark;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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

    &__user-role {
        background: $surface-elevated-dark;
        color: $text-secondary-dark;

        i {
            color: $icon-primary-dark;
        }
    }

    &__field-title {
        color: $text-primary-dark;
    }

    &__field-description {
        color: $text-tertiary-dark;
    }
}

// Responsive adjustments
@media (max-width: 768px) {
    .PageProfile {
        padding: 16px;

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
            padding: 20px;
        }

        &__password-actions {
            flex-direction: column;
            gap: 8px;

            .q-btn {
                width: 100%;
            }

            .q-ml-sm {
                margin-left: 0 !important;
            }
        }
    }
}

@media (max-width: 480px) {
    .PageProfile {
        &__avatar {
            width: 64px;
            height: 64px;
            font-size: 24px;
        }

        &__user-name {
            font-size: 20px;
        }

        &__card {
            padding: 16px;
        }
    }
}
</style>
