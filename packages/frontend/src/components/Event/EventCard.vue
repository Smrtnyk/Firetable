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

const { aspectRatio, event, index, propertyTimezone } = defineProps<Props>();
const { locale, t } = useI18n();

const backgroundImageUrl = computed(function () {
    const imageIndex = (index % 3) + 1;
    return event.img || `/images/default-event-img-${imageIndex}.jpg`;
});
</script>
<template>
    <div
        class="EventCard ft-card"
        :style="{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
        }"
    >
        <router-link
            class="EventCard__link text-decoration-none"
            :to="{
                name: 'event',
                params: {
                    organisationId: event.organisationId,
                    propertyId: event.propertyId,
                    eventId: event.id,
                },
            }"
        >
            <v-responsive :aspect-ratio="aspectRatio">
                <div class="EventCard__content d-flex flex-column fill-height">
                    <div class="d-flex align-center">
                        <v-icon
                            icon="fa:fas fa-calendar"
                            color="white"
                            class="mr-1"
                            size="x-small"
                        />
                        {{ dateFromTimestamp(event.date, locale, propertyTimezone) }}
                        <v-spacer />
                        <v-icon icon="fa:fas fa-clock" color="white" class="mr-1" size="x-small" />
                        {{ hourFromTimestamp(event.date, locale, propertyTimezone) }}
                    </div>

                    <v-spacer />

                    <div class="d-flex align-center">
                        <v-icon
                            icon="fa:fas fa-euro-sign"
                            color="white"
                            class="mr-1"
                            size="x-small"
                        />
                        {{ event.entryPrice || t("EventCard.freeLabel") }}
                    </div>

                    <h4 class="text-h4 mb-1 ml-0 mt-0">{{ event.name }}</h4>
                </div>
            </v-responsive>
        </router-link>
    </div>
</template>

<style lang="scss">
.EventCard {
    border-radius: 0.5rem;

    &__link {
        text-decoration: none;
    }

    img {
        border-radius: 0.5rem;
    }

    &__content {
        color: white;
        padding: 1rem;
        border-radius: 0.5rem;
        background: rgba(0, 0, 0, 0.5);
        height: 100%;
    }
}
</style>
