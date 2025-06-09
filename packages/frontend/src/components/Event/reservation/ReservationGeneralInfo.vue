<template>
    <div class="ReservationGeneralInfo">
        <!-- Guest Information Section -->
        <div class="ReservationGeneralInfo__section" v-if="reservation.guestName">
            <h4 class="ReservationGeneralInfo__section-title">
                <v-icon size="small">fas fa-user</v-icon>
                Guest Information
            </h4>
            <div class="ReservationGeneralInfo__fields">
                <div class="ReservationGeneralInfo__field">
                    <span class="ReservationGeneralInfo__label">
                        {{ t("EventShowReservation.guestNameLabel") }}
                    </span>
                    <span
                        class="ReservationGeneralInfo__value ReservationGeneralInfo__value--primary"
                    >
                        {{ reservation.guestName }}
                    </span>
                </div>

                <div
                    class="ReservationGeneralInfo__field"
                    v-if="reservation.guestContact && permissionsStore.canSeeGuestContact"
                >
                    <span class="ReservationGeneralInfo__label">
                        {{ t("EventShowReservation.contactLabel") }}
                    </span>
                    <span class="ReservationGeneralInfo__value">
                        <v-icon size="x-small" class="ReservationGeneralInfo__icon"
                            >fas fa-phone</v-icon
                        >
                        {{ reservation.guestContact }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Reservation Details Section -->
        <div class="ReservationGeneralInfo__section">
            <h4 class="ReservationGeneralInfo__section-title">
                <v-icon size="small">fas fa-calendar-check</v-icon>
                Reservation Details
            </h4>
            <div class="ReservationGeneralInfo__fields">
                <div
                    class="ReservationGeneralInfo__field ReservationGeneralInfo__field--highlight-row"
                >
                    <span class="ReservationGeneralInfo__label">
                        {{ t("EventShowReservation.timeLabel") }}
                    </span>
                    <span
                        class="ReservationGeneralInfo__value ReservationGeneralInfo__value--highlight"
                    >
                        <v-icon size="x-small" class="ReservationGeneralInfo__icon"
                            >fas fa-clock</v-icon
                        >
                        {{ reservation.time }}
                    </span>
                </div>

                <div
                    class="ReservationGeneralInfo__field ReservationGeneralInfo__field--highlight-row"
                >
                    <span class="ReservationGeneralInfo__label">
                        {{ t("EventShowReservation.numberOfPeopleLabel") }}
                    </span>
                    <span
                        class="ReservationGeneralInfo__value ReservationGeneralInfo__value--highlight"
                    >
                        <v-icon size="x-small" class="ReservationGeneralInfo__icon"
                            >fas fa-users</v-icon
                        >
                        {{ reservation.numberOfGuests }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Additional Information Section -->
        <div
            class="ReservationGeneralInfo__section"
            v-if="reservation.consumption || reservation.reservationNote"
        >
            <h4 class="ReservationGeneralInfo__section-title">
                <v-icon size="small">fas fa-info-circle</v-icon>
                Additional Information
            </h4>
            <div class="ReservationGeneralInfo__fields">
                <div
                    class="ReservationGeneralInfo__field ReservationGeneralInfo__field--highlight-row"
                    v-if="reservation.consumption"
                >
                    <span class="ReservationGeneralInfo__label">
                        {{ t("EventShowReservation.reservationConsumption") }}
                    </span>
                    <span
                        class="ReservationGeneralInfo__value ReservationGeneralInfo__value--highlight"
                    >
                        <v-icon size="x-small" class="ReservationGeneralInfo__icon"
                            >fas fa-euro-sign</v-icon
                        >
                        {{ reservation.consumption }}
                    </span>
                </div>

                <div class="ReservationGeneralInfo__field" v-if="reservation.reservationNote">
                    <span class="ReservationGeneralInfo__label">
                        {{ t("EventShowReservation.noteLabel") }}
                    </span>
                    <span class="ReservationGeneralInfo__value ReservationGeneralInfo__value--note">
                        <v-icon size="x-small" class="ReservationGeneralInfo__icon"
                            >fas fa-sticky-note</v-icon
                        >
                        {{ reservation.reservationNote }}
                    </span>
                </div>
            </div>
        </div>

        <!-- System Information Section -->
        <div
            class="ReservationGeneralInfo__section ReservationGeneralInfo__section--system"
            v-if="!isAWalkInReservation(reservation) || permissionsStore.canSeeReservationCreator"
        >
            <h4 class="ReservationGeneralInfo__section-title">
                <v-icon size="small">fas fa-cog</v-icon>
                System Information
            </h4>
            <div class="ReservationGeneralInfo__fields">
                <div
                    class="ReservationGeneralInfo__field ReservationGeneralInfo__field--system-inline"
                    v-if="!isAWalkInReservation(reservation)"
                >
                    <span class="ReservationGeneralInfo__label">
                        {{ t("EventShowReservation.reservedByLabel") }}
                    </span>
                    <span
                        class="ReservationGeneralInfo__value ReservationGeneralInfo__value--ellipsis"
                    >
                        {{ reservedByText(reservation.reservedBy) }}
                    </span>
                </div>

                <template v-if="permissionsStore.canSeeReservationCreator">
                    <div
                        class="ReservationGeneralInfo__field ReservationGeneralInfo__field--system-inline"
                    >
                        <span class="ReservationGeneralInfo__label">
                            {{ t("EventShowReservation.createdByLabel") }}
                        </span>
                        <span
                            class="ReservationGeneralInfo__value ReservationGeneralInfo__value--ellipsis"
                        >
                            {{ createdByText(reservation.creator) }}
                        </span>
                    </div>

                    <div
                        class="ReservationGeneralInfo__field ReservationGeneralInfo__field--system-inline"
                    >
                        <span class="ReservationGeneralInfo__label">
                            {{ t("EventShowReservation.createdAtLabel") }}
                        </span>
                        <span class="ReservationGeneralInfo__value">
                            {{ createdAt }}
                        </span>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { PlannedReservation, QueuedReservation, Reservation } from "@firetable/types";

import { isAWalkInReservation } from "@firetable/types";
import { getFormatedDateFromTimestamp } from "src/helpers/date-utils";
import { usePermissionsStore } from "src/stores/permissions-store";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
    reservation: QueuedReservation | Reservation;
    timezone: string;
}>();
const { locale, t } = useI18n();
const permissionsStore = usePermissionsStore();

const createdAt = computed(function () {
    const createdAtValue = props.reservation.creator.createdAt;
    return getFormatedDateFromTimestamp(createdAtValue, locale.value, props.timezone);
});

function createdByText(creator: Reservation["creator"]): string {
    const { email, name } = creator;
    return `${name} - ${email}`;
}

function reservedByText(reservedBy: PlannedReservation["reservedBy"]): string {
    const { email, name } = reservedBy;
    const isSocial = email.startsWith("social");
    return isSocial ? name : `${name} - ${email}`;
}
</script>

<style lang="scss" scoped>
@use "src/css/variables.scss" as *;

.ReservationGeneralInfo {
    display: flex;
    flex-direction: column;
    gap: 24px;

    &__section {
        &:not(:last-child) {
            border-bottom: 1px solid $border-light;
            padding-bottom: 20px;
        }

        &--system {
            opacity: 0.8;
        }
    }

    &__section-title {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 700;
        color: $text-primary;
        display: flex;
        align-items: center;
        gap: 8px; // Match the original gap
        text-transform: uppercase;
        letter-spacing: 0.5px;

        :deep(.v-icon) {
            color: $primary;
            font-size: 14px;
            width: 16px;
        }
    }

    &__fields {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    &__field {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        padding: 8px 0;

        &--system-inline {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            gap: 16px;

            .ReservationGeneralInfo__label {
                flex-shrink: 0;
            }
        }

        // Fixed the selector to match the original behavior
        &--highlight-row {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            gap: 16px;

            .ReservationGeneralInfo__label {
                flex-shrink: 0;
            }

            .ReservationGeneralInfo__value--highlight {
                margin-left: auto;
                align-self: center;
            }
        }
    }

    &__label {
        font-size: 14px;
        font-weight: 600;
        color: $text-secondary;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        line-height: 1.4;
    }

    &__value {
        font-size: 15px;
        font-weight: 600;
        color: $text-primary;
        line-height: 1.4;
        display: flex;
        align-items: center;
        gap: 6px;

        &--primary {
            font-weight: 700;
            font-size: 16px;
        }

        &--highlight {
            color: $accent;
            font-weight: 700;
            background: rgba($accent, 0.1);
            padding: 4px 8px;
            border-radius: $button-border-radius;
            align-self: flex-start;
        }

        &--note {
            font-style: italic;
            white-space: pre-wrap;
            word-break: break-word;
        }

        &--ellipsis {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            min-width: 0;
            text-align: right;
        }
    }

    &__icon {
        font-size: 12px;
        color: $text-tertiary;
        flex-shrink: 0;
    }
}

// Dark mode support - keep the original selector structure
.body--dark .ReservationGeneralInfo {
    &__section {
        border-color: $border-light-dark;
    }

    &__section-title {
        color: $text-primary-dark;

        :deep(.v-icon) {
            color: $primary;
        }
    }

    &__label {
        color: $text-secondary-dark;
    }

    &__value {
        color: $text-primary-dark;

        &--highlight {
            color: $accent;
            background: rgba($accent, 0.15);
        }
    }

    &__icon {
        color: $text-tertiary-dark;
    }
}

// Also add Vuetify dark mode support
.v-theme--dark .ReservationGeneralInfo {
    &__section {
        border-color: $border-light-dark;
    }

    &__section-title {
        color: $text-primary-dark;

        :deep(.v-icon) {
            color: $primary;
        }
    }

    &__label {
        color: $text-secondary-dark;
    }

    &__value {
        color: $text-primary-dark;

        &--highlight {
            color: $accent;
            background: rgba($accent, 0.15);
        }
    }

    &__icon {
        color: $text-tertiary-dark;
    }
}

@media (max-width: 768px) {
    .ReservationGeneralInfo {
        gap: 20px;

        &__section {
            padding-bottom: 16px;
        }

        &__section-title {
            font-size: 15px;
            margin-bottom: 12px;
        }

        &__fields {
            gap: 10px;
        }

        &__field {
            padding: 6px 0;
        }

        &__label {
            font-size: 13px;
        }

        &__value {
            font-size: 14px;
        }
    }
}

@media (max-width: 480px) {
    .ReservationGeneralInfo {
        gap: 16px;

        &__section-title {
            font-size: 14px;
        }

        &__label {
            font-size: 12px;
        }

        &__value {
            font-size: 13px;
        }
    }
}
</style>
