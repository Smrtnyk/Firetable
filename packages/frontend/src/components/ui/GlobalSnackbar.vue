<template>
    <div class="global-snackbar-container">
        <v-snackbar
            v-for="notification in globalStore.notifications"
            :key="notification.id"
            v-model="notification.show"
            :color="notification.color"
            :timeout="notification.timeout === 0 ? -1 : notification.timeout"
            :location="notification.position"
            elevation="2"
            multi-line
            class="global-snackbar"
            :class="`global-snackbar--${notification.type}`"
            @update:model-value="
                (value) => !value && globalStore.dismissNotification(notification.id)
            "
        >
            <div class="global-snackbar__content">
                <v-icon
                    v-if="getNotificationIcon(notification.type)"
                    :icon="getNotificationIcon(notification.type)"
                    size="small"
                    class="global-snackbar__icon me-2"
                />
                <span class="global-snackbar__message">{{ notification.message }}</span>
            </div>

            <template v-slot:actions>
                <div v-if="notification.actions" class="global-snackbar__actions">
                    <v-btn
                        v-for="action in notification.actions"
                        :key="action.label"
                        :color="action.color || 'white'"
                        variant="text"
                        size="small"
                        @click="handleActionClick(action, notification.id)"
                    >
                        {{ action.label }}
                    </v-btn>
                </div>

                <v-btn
                    v-if="!hasNoDismissActions(notification)"
                    color="white"
                    variant="text"
                    icon="fas fa-times"
                    size="small"
                    @click="globalStore.dismissNotification(notification.id)"
                    class="global-snackbar__close"
                />
            </template>
        </v-snackbar>
    </div>
</template>

<script setup lang="ts">
import type { NotificationAction } from "src/stores/global-store";

import { useGlobalStore } from "src/stores/global-store";

const globalStore = useGlobalStore();

function getNotificationIcon(type: string): string {
    switch (type) {
        case "error":
            return "fas fa-exclamation-circle";
        case "info":
            return "fas fa-info-circle";
        case "ongoing":
            return "fas fa-clock";
        case "success":
            return "fas fa-check-circle";
        case "warning":
            return "fas fa-exclamation-triangle";
        default:
            return "";
    }
}

function handleActionClick(action: NotificationAction, notificationId: string): void {
    action.handler();

    if (!action.noDismiss) {
        globalStore.dismissNotification(notificationId);
    }
}

function hasNoDismissActions(notification: any): boolean {
    return (
        notification.actions?.some((action: NotificationAction) => action.noDismiss === true) ??
        false
    );
}
</script>

<style lang="scss" scoped>
.global-snackbar-container {
    position: fixed;
    z-index: 9999;
}

.global-snackbar {
    &__content {
        display: flex;
        align-items: center;
        flex: 1;
    }

    &__message {
        flex: 1;
        word-break: break-word;
    }

    &__icon {
        flex-shrink: 0;
    }

    &__actions {
        display: flex;
        gap: 8px;
        margin-right: 8px;
    }

    &__close {
        flex-shrink: 0;
    }

    // Type-specific styling
    &--success {
        :deep(.v-snackbar__content) {
            background-color: var(--v-theme-success);
        }
    }

    &--error {
        :deep(.v-snackbar__content) {
            background-color: var(--v-theme-error);
        }
    }

    &--warning {
        :deep(.v-snackbar__content) {
            background-color: var(--v-theme-warning);
        }
    }

    &--info {
        :deep(.v-snackbar__content) {
            background-color: var(--v-theme-info);
        }
    }

    &--ongoing {
        :deep(.v-snackbar__content) {
            background-color: var(--v-theme-primary);
        }
    }
}

// Ensure multiple snackbars stack properly
:deep(.v-snackbar__wrapper) {
    position: relative !important;
    margin-bottom: 8px;
}
</style>
