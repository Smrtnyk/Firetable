<script setup lang="ts">
import type { EventDoc, VoidFunction } from "@firetable/types";

import { formatEventDate } from "src/helpers/date-utils";
import { useI18n } from "vue-i18n";

interface Props {
    event: EventDoc;
    timezone: string;
}
const { event, timezone } = defineProps<Props>();
const emit = defineEmits(["right", "left"]);
const { locale } = useI18n();

function emitEdit({ reset }: { reset: VoidFunction }): void {
    emit("left", { event, reset });
}

function emitOnRight({ reset }: { reset: VoidFunction }): void {
    emit("right", { event, reset });
}
</script>

<template>
    <div class="EventListItem">
        <q-slide-item
            right-color="negative"
            left-color="primary"
            @right="emitOnRight"
            @left="emitEdit"
            class="EventListItem__slide"
        >
            <template #right>
                <div class="EventListItem__action EventListItem__action--delete">
                    <i class="fas fa-trash" />
                    <span>Delete</span>
                </div>
            </template>
            <template #left>
                <div class="EventListItem__action EventListItem__action--edit">
                    <i class="fas fa-pencil" />
                    <span>Edit</span>
                </div>
            </template>

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
                            <i class="fas fa-calendar-day" />
                        </div>

                        <!-- Event Info -->
                        <div class="EventListItem__info">
                            <h4 class="EventListItem__title">{{ event.name }}</h4>
                            <div class="EventListItem__meta">
                                <div class="EventListItem__date">
                                    <i class="fas fa-clock" />
                                    <span>{{ formatEventDate(event.date, locale, timezone) }}</span>
                                </div>
                                <div class="EventListItem__status" v-if="event.entryPrice">
                                    <i class="fas fa-euro-sign" />
                                    <span>{{ event.entryPrice }}</span>
                                </div>
                                <div
                                    class="EventListItem__status EventListItem__status--free"
                                    v-else
                                >
                                    <i class="fas fa-gift" />
                                    <span>Free</span>
                                </div>
                            </div>
                        </div>

                        <!-- Arrow -->
                        <div class="EventListItem__arrow">
                            <i class="fas fa-chevron-right" />
                        </div>
                    </div>
                </router-link>
            </div>
        </q-slide-item>
    </div>
</template>

<style lang="scss" scoped>
.EventListItem {
    margin-bottom: 12px;

    &__slide {
        border-radius: $generic-border-radius;
        overflow: hidden;
    }

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

        i {
            font-size: 12px;
            color: $accent;
        }

        &--free i {
            color: $positive;
        }
    }

    &__arrow {
        color: $text-tertiary;
        font-size: 14px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
    }

    &__action {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;

        i {
            font-size: 16px;
        }

        &--edit {
            color: white;
        }

        &--delete {
            color: white;
        }
    }
}

.body--dark .EventListItem {
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

    .EventListItem__title {
        color: $text-primary-dark;
    }

    .EventListItem__date,
    .EventListItem__status {
        color: $text-secondary-dark;

        i {
            color: $accent;
        }

        &--free i {
            color: $positive;
        }
    }

    .EventListItem__arrow {
        color: $text-tertiary-dark;
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
            font-size: 18px;
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
    }
}
</style>
