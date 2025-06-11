<script setup lang="ts">
import { computed } from "vue";

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
</script>

<template>
    <div class="EventViewControls">
        <q-btn
            flat
            dense
            color="grey-7"
            icon="fa fa-ellipsis-v"
            class="EventViewControls__menu-btn"
            aria-label="Event controls menu"
        >
            <q-badge
                v-if="totalNotifications > 0"
                color="red"
                floating
                class="EventViewControls__badge"
                :aria-label="`${totalNotifications} notifications`"
            >
                {{ totalNotifications }}
            </q-badge>

            <q-menu class="EventViewControls__menu" anchor="bottom right" self="top right">
                <q-list>
                    <!-- Floor Selection (if multiple floors) -->
                    <template v-if="hasMultipleFloors">
                        <q-item-label header class="EventViewControls__section-header">
                            <q-icon name="fa fa-layer-group" class="q-mr-xs" />
                            Floors
                        </q-item-label>

                        <!-- Radio group for floors -->
                        <div role="radiogroup" aria-label="Select floor">
                            <q-item
                                v-for="floor in floors"
                                :key="floor.id"
                                clickable
                                v-close-popup
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
                                <q-item-section avatar>
                                    <q-icon
                                        :name="
                                            isActiveFloor(floor.id)
                                                ? 'fa fa-check-circle'
                                                : 'fa fa-circle'
                                        "
                                        class="EventViewControls__menu-icon"
                                        :class="{
                                            'EventViewControls__menu-icon--active': isActiveFloor(
                                                floor.id,
                                            ),
                                        }"
                                        aria-hidden="true"
                                    />
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label class="EventViewControls__menu-label">
                                        {{ floor.name }}
                                    </q-item-label>
                                </q-item-section>
                            </q-item>
                        </div>

                        <q-separator class="EventViewControls__separator" />
                    </template>

                    <!-- Actions Section -->
                    <q-item-label header class="EventViewControls__section-header">
                        <q-icon name="fa fa-cog" class="q-mr-xs" />
                        Actions
                    </q-item-label>

                    <!-- Queued Reservations -->
                    <q-item
                        clickable
                        v-close-popup
                        @click="emit('toggle-queued-reservations-drawer-visibility')"
                        class="EventViewControls__menu-item"
                        aria-label="Toggle queued reservations drawer"
                        role="menuitem"
                    >
                        <q-item-section avatar>
                            <q-icon
                                name="fa fa-bars"
                                class="EventViewControls__menu-icon"
                                aria-hidden="true"
                            />
                        </q-item-section>
                        <q-item-section>
                            <q-item-label class="EventViewControls__menu-label">
                                Queued Reservations
                            </q-item-label>
                        </q-item-section>
                        <q-item-section side v-if="queuedReservationsCount > 0">
                            <q-badge
                                color="red"
                                :label="queuedReservationsCount"
                                :aria-label="`${queuedReservationsCount} queued reservations`"
                            />
                        </q-item-section>
                    </q-item>

                    <!-- Guest List -->
                    <q-item
                        clickable
                        v-close-popup
                        @click="emit('toggle-event-guest-list-drawer-visibility')"
                        class="EventViewControls__menu-item"
                        aria-label="Toggle guest list drawer"
                        role="menuitem"
                    >
                        <q-item-section avatar>
                            <q-icon
                                name="fa fa-users"
                                class="EventViewControls__menu-icon"
                                aria-hidden="true"
                            />
                        </q-item-section>
                        <q-item-section>
                            <q-item-label class="EventViewControls__menu-label">
                                Guest List
                            </q-item-label>
                        </q-item-section>
                        <q-item-section side v-if="guestListCount > 0">
                            <q-badge
                                color="blue"
                                :label="guestListCount"
                                :aria-label="`${guestListCount} guests`"
                            />
                        </q-item-section>
                    </q-item>

                    <q-separator class="EventViewControls__separator" />

                    <!-- Event Info -->
                    <q-item
                        clickable
                        v-close-popup
                        @click="emit('show-event-info')"
                        class="EventViewControls__menu-item"
                        aria-label="Show event info"
                        role="menuitem"
                    >
                        <q-item-section avatar>
                            <q-icon
                                name="fa fa-info-circle"
                                class="EventViewControls__menu-icon"
                                aria-hidden="true"
                            />
                        </q-item-section>
                        <q-item-section>
                            <q-item-label class="EventViewControls__menu-label">
                                Event Info
                            </q-item-label>
                        </q-item-section>
                    </q-item>

                    <!-- Admin View -->
                    <q-item
                        v-if="canSeeAdminEvent"
                        clickable
                        v-close-popup
                        @click="emit('navigate-to-admin-event')"
                        class="EventViewControls__menu-item"
                        aria-label="Navigate to admin view"
                        role="menuitem"
                    >
                        <q-item-section avatar>
                            <q-icon
                                name="fa fa-eye"
                                class="EventViewControls__menu-icon"
                                aria-hidden="true"
                            />
                        </q-item-section>
                        <q-item-section>
                            <q-item-label class="EventViewControls__menu-label">
                                Admin View
                            </q-item-label>
                        </q-item-section>
                    </q-item>

                    <!-- Export Reservations -->
                    <q-item
                        v-if="canExportReservations"
                        clickable
                        v-close-popup
                        @click="emit('export-reservations')"
                        class="EventViewControls__menu-item"
                        aria-label="Export reservations"
                        role="menuitem"
                    >
                        <q-item-section avatar>
                            <q-icon
                                name="fa fa-file-export"
                                class="EventViewControls__menu-icon"
                                aria-hidden="true"
                            />
                        </q-item-section>
                        <q-item-section>
                            <q-item-label class="EventViewControls__menu-label">
                                Export Reservations
                            </q-item-label>
                        </q-item-section>
                    </q-item>
                </q-list>
            </q-menu>
        </q-btn>
    </div>
</template>

<style lang="scss" scoped>
.EventViewControls {
    display: flex;
    align-items: center;
    justify-content: flex-end;

    &__menu-btn {
        position: relative;
        min-width: 36px;
        min-height: 36px;
        border-radius: $button-border-radius;
        transition: all 0.2s ease;

        &:hover {
            background: rgba($primary, 0.08);
            transform: translateY(-1px);
        }
    }

    &__badge {
        position: absolute;
        top: -6px;
        right: -6px;
        z-index: 1;
        font-size: 10px;
        min-width: 16px;
        height: 16px;
        animation: pulse 2s infinite;
    }

    &__menu {
        min-width: 240px;
        max-height: 400px;
        border-radius: $button-border-radius;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: 1px solid $border-light;
    }

    &__section-header {
        padding: 12px 16px 8px 16px;
        font-weight: 600;
        color: $text-secondary;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
    }

    &__menu-item {
        padding: 10px 16px;
        transition: all 0.2s ease;

        &:hover {
            background: rgba($primary, 0.05);
        }

        &--active {
            background: rgba($primary, 0.1);
        }

        .q-item__section--avatar {
            min-width: 36px;
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

.body--dark .EventViewControls {
    &__menu-btn {
        &:hover {
            background: rgba($primary, 0.15);
        }
    }

    &__menu {
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

        &__menu {
            min-width: 220px;
        }

        &__section-header {
            padding: 10px 12px 6px 12px;
            font-size: 11px;
        }

        &__menu-item {
            padding: 8px 12px;

            .q-item__section--avatar {
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
