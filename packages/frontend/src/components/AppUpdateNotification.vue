<template>
    <transition name="slide-down">
        <div v-if="updateAvailable && !updateDismissed" class="app-update-notification">
            <div class="notification-content">
                <div class="notification-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path
                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                        />
                    </svg>
                </div>
                <div class="notification-text">
                    <h4>App Update Available</h4>
                    <p>
                        A new version is ready. Restart to get the latest features and improvements.
                    </p>
                </div>
                <div class="notification-actions">
                    <button @click="handleUpdate" :disabled="isUpdating" class="update-btn">
                        {{ isUpdating ? "Updating..." : "Update Now" }}
                    </button>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { useAppUpdates } from "src/composables/useAppUpdates";
import { AppLogger } from "src/logger/FTLogger";
import { ref } from "vue";

const { applyUpdate, updateAvailable, updateDismissed } = useAppUpdates();
const isUpdating = ref(false);

async function handleUpdate(): Promise<void> {
    isUpdating.value = true;
    try {
        await applyUpdate();
    } catch (error) {
        AppLogger.error("Failed to apply update:", error);
        isUpdating.value = false;
    }
}
</script>

<style scoped>
.app-update-notification {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.notification-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
}

.notification-text {
    flex: 1;
    min-width: 0;
}

.notification-text h4 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
    color: white;
}

.notification-text p {
    margin: 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
    opacity: 0.9;
}

.notification-actions {
    display: flex;
    gap: 12px;
    flex-shrink: 0;
}

.update-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 80px;
}

.update-btn {
    background: white;
    color: #667eea;
}

.update-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
}

.update-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease-out;
}

.slide-down-enter-from {
    transform: translateY(-100%);
    opacity: 0;
}

.slide-down-leave-to {
    transform: translateY(-100%);
    opacity: 0;
}

@media (max-width: 768px) {
    .notification-content {
        flex-direction: column;
        text-align: center;
        gap: 12px;
        padding: 16px 20px;
    }

    .notification-actions {
        width: 100%;
        justify-content: center;
    }

    .update-btn {
        flex: 1;
        max-width: 120px;
    }
}
</style>
