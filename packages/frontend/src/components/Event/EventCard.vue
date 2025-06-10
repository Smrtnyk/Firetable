<script setup lang="ts">
import type { EventDoc } from "@firetable/types";

import { dateFromTimestamp, hourFromTimestamp } from "src/helpers/date-utils";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

interface Props {
    aspectRatio: number;
    event: EventDoc;
    index: number;
    propertyTimezone: string;
}

const { event, index, propertyTimezone } = defineProps<Props>();
const { locale, t } = useI18n();

const backgroundImageUrl = computed(function () {
    const imageIndex = (index % 3) + 1;
    return event.img || `/images/default-event-img-${imageIndex}.jpg`;
});
</script>

<template>
    <div class="EventCard">
        <router-link
            class="EventCard__link"
            :to="{
                name: 'event',
                params: {
                    organisationId: event.organisationId,
                    propertyId: event.propertyId,
                    eventId: event.id,
                },
            }"
        >
            <div class="EventCard__container">
                <!-- Image Section -->
                <div class="EventCard__image-section">
                    <div
                        class="EventCard__image"
                        :style="{
                            backgroundImage: `url(${backgroundImageUrl})`,
                        }"
                    />
                    <div class="EventCard__price-tag">
                        <i class="fas fa-euro-sign" />
                        <span>{{ event.entryPrice || t("EventCard.freeLabel") }}</span>
                    </div>
                </div>

                <!-- Content Section -->
                <div class="EventCard__content">
                    <!-- Date & Time Info -->
                    <div class="EventCard__meta">
                        <div class="EventCard__date">
                            <i class="fas fa-calendar-alt" />
                            <span>{{
                                dateFromTimestamp(event.date, locale, propertyTimezone)
                            }}</span>
                        </div>
                        <div class="EventCard__time">
                            <i class="fas fa-clock" />
                            <span>{{
                                hourFromTimestamp(event.date, locale, propertyTimezone)
                            }}</span>
                        </div>
                    </div>

                    <!-- Title -->
                    <h3 class="EventCard__title">{{ event.name }}</h3>
                </div>
            </div>
        </router-link>
    </div>
</template>

<style lang="scss" scoped>
.EventCard {
    background: $surface-elevated;
    border-radius: $generic-border-radius;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-shadow: $box-shadow;

    &:hover {
        box-shadow:
            0 10px 20px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(0, 0, 0, 0.1);

        .EventCard__image {
            transform: scale(1.05);
        }
    }

    &__link {
        text-decoration: none;
        color: inherit;
        display: block;
    }

    &__container {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    &__image-section {
        position: relative;
        height: 200px;
        overflow: hidden;
    }

    &__image {
        width: 100%;
        height: 100%;
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    &__price-tag {
        position: absolute;
        top: 16px;
        right: 16px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: $button-border-radius;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        font-size: 14px;
        color: $text-primary;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

        i {
            color: $positive;
            font-size: 12px;
        }
    }

    &__content {
        padding: 24px;
        display: flex;
        flex-direction: column;
        flex: 1;
    }

    &__meta {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
    }

    &__date,
    &__time {
        display: flex;
        align-items: center;
        gap: 8px;
        color: $text-secondary;
        font-size: 14px;
        font-weight: 500;

        i {
            color: $accent;
            width: 16px;
            text-align: center;
        }
    }

    &__title {
        font-size: 20px;
        font-weight: 700;
        line-height: 1.3;
        margin: 0;
        flex: 1;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
}

.body--dark .EventCard {
    background: $surface-elevated-dark;
    box-shadow:
        0 2px 10px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.1);

    &:hover {
        box-shadow:
            0 20px 40px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.2);
    }

    .EventCard__price-tag {
        background: rgba($surface-elevated-dark, 0.95);
        color: $text-primary-dark;

        i {
            color: $positive;
        }
    }

    .EventCard__date,
    .EventCard__time {
        color: $text-secondary-dark;

        i {
            color: $accent;
        }
    }
}

@media (max-width: 768px) {
    .EventCard {
        &__image-section {
            height: 160px;
        }

        &__content {
            padding: 20px;
        }

        &__meta {
            flex-direction: row;
            gap: 16px;
        }

        &__title {
            font-size: 18px;
        }
    }
}

@media (max-width: 480px) {
    .EventCard {
        &__image-section {
            height: 140px;
        }

        &__content {
            padding: 16px;
        }

        &__title {
            font-size: 16px;
        }
    }
}
</style>
