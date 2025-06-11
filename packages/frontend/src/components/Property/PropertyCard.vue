<script setup lang="ts">
import type { PropertyDoc } from "@firetable/types";

import { computed } from "vue";
import { useI18n } from "vue-i18n";

interface Props {
    property: PropertyDoc;
}

const props = defineProps<Props>();
const { t } = useI18n();

const backgroundImageUrl = computed(function () {
    return props.property.img || `/images/default-property-img.jpg`;
});
</script>

<template>
    <div class="PropertyCard">
        <router-link
            class="PropertyCard__link"
            :to="{
                name: 'events',
                params: {
                    propertyId: props.property.id,
                    organisationId: props.property.organisationId,
                },
            }"
        >
            <q-responsive :ratio="16 / 9">
                <div class="PropertyCard__container">
                    <!-- Background Image -->
                    <div
                        class="PropertyCard__image"
                        :style="{
                            backgroundImage: `url(${backgroundImageUrl})`,
                        }"
                    />

                    <!-- Content -->
                    <div class="PropertyCard__content">
                        <h2 class="PropertyCard__title">{{ props.property.name }}</h2>

                        <div class="PropertyCard__action">
                            <span>{{ t("PropertyCard.viewEventsAction") }}</span>
                            <i class="fas fa-arrow-right" />
                        </div>
                    </div>
                </div>
            </q-responsive>
        </router-link>
    </div>
</template>

<style lang="scss" scoped>
.PropertyCard {
    background: $surface-elevated;
    border-radius: $generic-border-radius;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-shadow: $box-shadow;

    &:hover {
        box-shadow:
            0 10px 20px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(0, 0, 0, 0.1);

        .PropertyCard__image {
            transform: scale(1.01);
        }

        .PropertyCard__action {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);

            i {
                transform: translateX(4px);
            }
        }
    }

    &__link {
        text-decoration: none;
        color: inherit;
        display: block;
    }

    &__container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: $generic-border-radius;
    }

    &__image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    &__content {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        padding: 24px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        color: white;
        z-index: 2;
    }

    &__info {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        opacity: 0.9;
    }

    &__icon {
        color: $accent;
        font-size: 16px;
    }

    &__label {
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    &__title {
        font-size: 28px;
        font-weight: 700;
        line-height: 1.2;
        margin: 0;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    &__action {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: $button-border-radius;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        font-weight: 600;
        font-size: 14px;

        i {
            transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            font-size: 14px;
        }
    }
}

// Dark mode support
.body--dark .PropertyCard {
    background: $surface-elevated-dark;
    box-shadow:
        0 2px 10px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.1);

    &:hover {
        box-shadow:
            0 10px 20px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.2);
    }

    .PropertyCard__icon {
        color: $accent;
    }
}

// Responsive adjustments
@media (max-width: 768px) {
    .PropertyCard {
        &__content {
            padding: 20px;
        }

        &__title {
            font-size: 24px;
        }

        &__action {
            padding: 10px 16px;
            font-size: 13px;
        }
    }
}

@media (max-width: 480px) {
    .PropertyCard {
        &__content {
            padding: 16px;
        }

        &__title {
            font-size: 20px;
        }

        &__info {
            font-size: 12px;
        }

        &__action {
            padding: 8px 12px;
            font-size: 12px;
        }
    }
}
</style>
