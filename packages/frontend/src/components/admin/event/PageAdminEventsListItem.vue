<script setup lang="ts">
import type { EventDoc } from "@firetable/types";

import { formatEventDate } from "src/helpers/date-utils";
import { useI18n } from "vue-i18n";

interface Props {
    event: EventDoc;
    timezone: string;
}
const { event, timezone } = defineProps<Props>();
const emit = defineEmits(["edit", "delete"]);
const { locale } = useI18n();

function onDelete(): void {
    emit("delete", event);
}

function onEdit(): void {
    emit("edit", event);
}
</script>

<template>
    <div class="EventListItem">
        <div class="EventListItem__card">
            <router-link
                class="EventListItem__link"
                :to="{
                    name: 'adminEvent',
                    params: {
                        eventId: event.id,
                        organisationId: event.organisationId,
                        propertyId: event.propertyId,
                    },
                }"
            >
                <div class="EventListItem__content">
                    <!-- Event Icon -->
                    <div class="EventListItem__icon">
                        <v-icon icon="fas fa-calendar-day" />
                    </div>

                    <!-- Event Info -->
                    <div class="EventListItem__info">
                        <h4 class="EventListItem__title">{{ event.name }}</h4>
                        <div class="EventListItem__meta">
                            <div class="EventListItem__date">
                                <v-icon icon="fas fa-clock" />
                                <span>{{ formatEventDate(event.date, locale, timezone) }}</span>
                            </div>
                            <div class="EventListItem__status" v-if="event.entryPrice">
                                <v-icon icon="fas fa-euro-sign" />
                                <span>{{ event.entryPrice }}</span>
                            </div>
                            <div class="EventListItem__status EventListItem__status--free" v-else>
                                <v-icon icon="fas fa-gift" />
                                <span>Free</span>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons (replacing arrow) -->
                    <div class="EventListItem__actions">
                        <v-btn
                            variant="text"
                            size="small"
                            color="primary"
                            @click.prevent="onEdit"
                            class="EventListItem__action-btn"
                        >
                            <v-icon size="14">fas fa-pencil</v-icon>
                        </v-btn>
                        <v-btn
                            variant="text"
                            size="small"
                            color="error"
                            @click.prevent="onDelete"
                            class="EventListItem__action-btn"
                        >
                            <v-icon size="14">fas fa-trash</v-icon>
                        </v-btn>
                    </div>
                </div>
            </router-link>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use "src/css/variables.scss" as *;

.EventListItem {
    margin-bottom: 12px;

    &__card {
        background: $surface-elevated;
        border-radius: $generic-border-radius;
        box-shadow: $box-shadow;
        border: 1px solid $border-light;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
            box-shadow:
                0 4px 16px rgba(0, 0, 0, 0.12),
                0 0 0 1px rgba($primary, 0.2);
            border-color: rgba($primary, 0.2);
        }
    }

    &__link {
        text-decoration: none;
        color: inherit;
        display: block;
    }

    &__content {
        display: flex;
        align-items: center;
        padding: 20px;
        gap: 16px;
    }

    &__icon {
        width: 48px;
        height: 48px;
        background: $gradient-primary;
        border-radius: $generic-border-radius;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        flex-shrink: 0;

        :deep(.v-icon) {
            color: white;
            font-size: 20px;
        }
    }

    &__info {
        flex: 1;
        min-width: 0;
    }

    &__title {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 700;
        color: $text-primary;
        line-height: 1.3;
    }

    &__meta {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
    }

    &__date,
    &__status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 500;
        color: $text-secondary;

        :deep(.v-icon) {
            font-size: 12px;
            color: $accent;
        }

        &--free :deep(.v-icon) {
            color: $positive;
        }
    }

    &__actions {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex-shrink: 0;
    }

    &__action-btn {
        min-width: 32px !important;
        width: 32px;
        height: 32px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
            transform: scale(1.1);
        }
    }
}

.v-theme--dark .EventListItem {
    &__card {
        background: $surface-elevated-dark;
        border-color: $border-light-dark;
        box-shadow:
            0 2px 12px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1);

        &:hover {
            box-shadow:
                0 4px 16px rgba(0, 0, 0, 0.4),
                0 0 0 1px rgba($primary, 0.4);
            border-color: rgba($primary, 0.4);
        }
    }

    &__title {
        color: $text-primary-dark;
    }

    &__date,
    &__status {
        color: $text-secondary-dark;

        :deep(.v-icon) {
            color: $accent;
        }

        &--free :deep(.v-icon) {
            color: $positive;
        }
    }
}

// Responsive adjustments
@media (max-width: 768px) {
    .EventListItem {
        &__content {
            padding: 16px;
            gap: 12px;
        }

        &__icon {
            width: 40px;
            height: 40px;

            :deep(.v-icon) {
                font-size: 18px;
            }
        }

        &__title {
            font-size: 16px;
        }

        &__meta {
            gap: 12px;
        }

        &__date,
        &__status {
            font-size: 13px;
        }

        &__action-btn {
            min-width: 28px !important;
            width: 28px;
            height: 28px;
        }
    }
}

@media (max-width: 480px) {
    .EventListItem {
        &__meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }

        &__title {
            font-size: 15px;
            margin-bottom: 6px;
        }

        &__action-btn {
            min-width: 26px !important;
            width: 26px;
            height: 26px;

            :deep(.v-icon) {
                font-size: 12px;
            }
        }
    }
}
</style>
