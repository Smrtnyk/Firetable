<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

export interface EventViewControlsProps {
    activeFloor: undefined | { id: string; name: string };
    canExportReservations: boolean;
    canSeeAdminEvent: boolean;
    floors: { id: string; name: string }[];
    guestListCount: number;
    isActiveFloor: (floorId: string) => boolean;
    queuedReservationsCount: number;
}

const emit = defineEmits<{
    (
        e:
            | "export-reservations"
            | "navigate-to-admin-event"
            | "show-event-info"
            | "toggle-event-guest-list-drawer-visibility"
            | "toggle-queued-reservations-drawer-visibility",
    ): void;
    (e: "set-active-floor", value: { id: string; name: string }): void;
}>();

const {
    canExportReservations,
    canSeeAdminEvent,
    floors,
    guestListCount,
    isActiveFloor,
    queuedReservationsCount,
} = defineProps<EventViewControlsProps>();

const hasMultipleFloors = computed(() => floors.length > 1);
const totalNotifications = computed(() => queuedReservationsCount + guestListCount);

function setActiveFloor(floor: { id: string; name: string }): void {
    emit("set-active-floor", floor);
}

const { t } = useI18n();
</script>

<template>
    <div class="EventViewControls">
        <v-menu location="bottom end" origin="top end" class="EventViewControls__menu">
            <template v-slot:activator="{ props: menuProps }">
                <v-badge
                    v-if="totalNotifications > 0"
                    :content="totalNotifications"
                    color="error"
                    :aria-label="`${totalNotifications} notifications`"
                >
                    <v-btn
                        v-bind="menuProps"
                        variant="text"
                        density="comfortable"
                        color="grey-darken-1"
                        icon="fas fa-ellipsis-v"
                        class="EventViewControls__menu-btn"
                        aria-label="Event controls menu"
                    />
                </v-badge>
                <v-btn
                    v-else
                    v-bind="menuProps"
                    variant="text"
                    density="comfortable"
                    color="grey-darken-1"
                    icon="fas fa-ellipsis-v"
                    class="EventViewControls__menu-btn"
                    aria-label="Event controls menu"
                />
            </template>

            <v-list class="EventViewControls__menu-list">
                <!-- Floor Selection (if multiple floors) -->
                <template v-if="hasMultipleFloors">
                    <v-list-subheader class="EventViewControls__section-header">
                        <v-icon size="small" class="me-1">fas fa-layer-group</v-icon>
                        {{ t("EventViewControls.sections.floors") }}
                    </v-list-subheader>

                    <!-- Radio group for floors -->
                    <div role="radiogroup" aria-label="Select floor">
                        <v-list-item
                            v-for="floor in floors"
                            :key="floor.id"
                            @click="setActiveFloor(floor)"
                            class="EventViewControls__menu-item"
                            :class="{
                                'EventViewControls__menu-item--active': isActiveFloor(floor.id),
                            }"
                            role="radio"
                            :aria-checked="isActiveFloor(floor.id)"
                            :aria-label="`${floor.name}${isActiveFloor(floor.id) ? ' (current floor)' : ''}`"
                            tabindex="0"
                        >
                            <template v-slot:prepend>
                                <v-icon
                                    :icon="
                                        isActiveFloor(floor.id)
                                            ? 'fas fa-check-circle'
                                            : 'fas fa-circle'
                                    "
                                    class="EventViewControls__menu-icon"
                                    :class="{
                                        'EventViewControls__menu-icon--active': isActiveFloor(
                                            floor.id,
                                        ),
                                    }"
                                    aria-hidden="true"
                                />
                            </template>

                            <v-list-item-title class="EventViewControls__menu-label">
                                {{ floor.name }}
                            </v-list-item-title>
                        </v-list-item>
                    </div>

                    <v-divider class="EventViewControls__separator" />
                </template>

                <!-- Actions Section -->
                <v-list-subheader class="EventViewControls__section-header">
                    <v-icon size="small" class="me-1">fas fa-cog</v-icon>
                    {{ t("EventViewControls.sections.actions") }}
                </v-list-subheader>

                <!-- Queued Reservations -->
                <v-list-item
                    @click="emit('toggle-queued-reservations-drawer-visibility')"
                    class="EventViewControls__menu-item"
                    aria-label="Toggle queued reservations drawer"
                    role="menuitem"
                >
                    <template v-slot:prepend>
                        <v-icon
                            icon="fas fa-bars"
                            class="EventViewControls__menu-icon"
                            aria-hidden="true"
                        />
                    </template>

                    <v-list-item-title class="EventViewControls__menu-label">
                        {{ t("EventViewControls.menuItems.queuedReservations") }}
                    </v-list-item-title>

                    <template v-slot:append v-if="queuedReservationsCount > 0">
                        <v-badge
                            :content="queuedReservationsCount"
                            color="error"
                            :aria-label="`${queuedReservationsCount} queued reservations`"
                        />
                    </template>
                </v-list-item>

                <!-- Guest List -->
                <v-list-item
                    @click="emit('toggle-event-guest-list-drawer-visibility')"
                    class="EventViewControls__menu-item"
                    aria-label="Toggle guest list drawer"
                    role="menuitem"
                >
                    <template v-slot:prepend>
                        <v-icon
                            icon="fas fa-users"
                            class="EventViewControls__menu-icon"
                            aria-hidden="true"
                        />
                    </template>

                    <v-list-item-title class="EventViewControls__menu-label">
                        {{ t("EventViewControls.menuItems.guestList") }}
                    </v-list-item-title>

                    <template v-slot:append v-if="guestListCount > 0">
                        <v-badge
                            :content="guestListCount"
                            color="info"
                            :aria-label="`${guestListCount} guests`"
                        />
                    </template>
                </v-list-item>

                <v-divider class="EventViewControls__separator" />

                <!-- Event Info -->
                <v-list-item
                    @click="emit('show-event-info')"
                    class="EventViewControls__menu-item"
                    aria-label="Show event info"
                    role="menuitem"
                >
                    <template v-slot:prepend>
                        <v-icon
                            icon="fas fa-info-circle"
                            class="EventViewControls__menu-icon"
                            aria-hidden="true"
                        />
                    </template>

                    <v-list-item-title class="EventViewControls__menu-label">
                        {{ t("EventViewControls.menuItems.eventInfo") }}
                    </v-list-item-title>
                </v-list-item>

                <!-- Admin View -->
                <v-list-item
                    v-if="canSeeAdminEvent"
                    @click="emit('navigate-to-admin-event')"
                    class="EventViewControls__menu-item"
                    aria-label="Navigate to admin view"
                    role="menuitem"
                >
                    <template v-slot:prepend>
                        <v-icon
                            icon="fas fa-eye"
                            class="EventViewControls__menu-icon"
                            aria-hidden="true"
                        />
                    </template>

                    <v-list-item-title class="EventViewControls__menu-label">
                        {{ t("EventViewControls.menuItems.adminView") }}
                    </v-list-item-title>
                </v-list-item>

                <!-- Export Reservations -->
                <v-list-item
                    v-if="canExportReservations"
                    @click="emit('export-reservations')"
                    class="EventViewControls__menu-item"
                    aria-label="Export reservations"
                    role="menuitem"
                >
                    <template v-slot:prepend>
                        <v-icon
                            icon="fas fa-file-export"
                            class="EventViewControls__menu-icon"
                            aria-hidden="true"
                        />
                    </template>

                    <v-list-item-title class="EventViewControls__menu-label">
                        {{ t("EventViewControls.menuItems.exportReservations") }}
                    </v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>
    </div>
</template>

<style lang="scss" scoped>
@use "src/css/variables.scss" as *;

.EventViewControls {
    display: flex;
    align-items: center;
    justify-content: flex-end;

    &__menu-btn {
        min-width: 36px;
        min-height: 36px;
        border-radius: $button-border-radius;
        transition: all 0.2s ease;

        &:hover {
            background: rgba($primary, 0.08);
            transform: translateY(-1px);
        }
    }

    &__menu-list {
        min-width: 240px;
        max-height: 400px;
        border-radius: $button-border-radius;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: 1px solid $border-light;
    }

    &__section-header {
        padding: 12px 16px 8px 16px !important;
        font-weight: 600;
        color: $text-secondary;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
    }

    &__menu-item {
        :deep(.v-list-item__prepend) {
            min-width: 36px;
        }

        &:hover {
            background: rgba($primary, 0.05);
        }

        &--active {
            background: rgba($primary, 0.1);
        }
    }

    &__menu-icon {
        font-size: 16px;
        color: $text-secondary;

        &--active {
            color: $primary;
        }
    }

    &__menu-label {
        font-weight: 500;
        color: $text-primary;
        font-size: 14px;
    }

    &__separator {
        margin: 8px 0;
        background: $border-light;
    }
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.1);
        opacity: 0.7;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.v-theme--dark .EventViewControls {
    &__menu-btn {
        &:hover {
            background: rgba($primary, 0.15);
        }
    }

    &__menu-list {
        background: $surface-elevated-dark;
        border-color: $border-light-dark;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    &__section-header {
        color: $text-secondary-dark;
    }

    &__menu-item {
        &:hover {
            background: rgba($primary, 0.1);
        }

        &--active {
            background: rgba($primary, 0.15);
        }
    }

    &__menu-icon {
        color: $text-secondary-dark;

        &--active {
            color: $primary;
        }
    }

    &__menu-label {
        color: $text-primary-dark;
    }

    &__separator {
        background: $border-light-dark;
    }
}

@media (max-width: 768px) {
    .EventViewControls {
        &__menu-btn {
            min-width: 32px;
            min-height: 32px;
        }

        &__menu-list {
            min-width: 220px;
        }

        &__section-header {
            padding: 10px 12px 6px 12px !important;
            font-size: 11px;
        }

        &__menu-item {
            :deep(.v-list-item__prepend) {
                min-width: 32px;
            }
        }

        &__menu-icon {
            font-size: 14px;
        }

        &__menu-label {
            font-size: 13px;
        }
    }
}
</style>
