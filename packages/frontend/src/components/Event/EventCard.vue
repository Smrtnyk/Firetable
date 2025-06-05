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
            <q-responsive :ratio="aspectRatio">
                <div class="EventCard__content column">
                    <div class="row items-center">
                        <q-icon name="calendar" color="white" class="q-mr-xs" size="xs" />

                        {{ dateFromTimestamp(event.date, locale, propertyTimezone) }}

                        <q-space />

                        <q-icon name="clock" color="white" class="q-mr-xs" size="xs" />

                        {{ hourFromTimestamp(event.date, locale, propertyTimezone) }}
                    </div>

                    <q-space />

                    <div class="row">
                        <q-icon name="euro" color="white" class="q-mr-xs" size="xs" />

                        {{ event.entryPrice || t("EventCard.freeLabel") }}
                    </div>

                    <h4 class="text-h4 q-mb-sm q-ml-none q-mt-none">{{ event.name }}</h4>
                </div>
            </q-responsive>
        </router-link>
    </div>
</template>

<style lang="scss">
.EventCard {
    border-radius: 0.5rem;

    img {
        border-radius: 0.5rem;
    }

    &__content {
        color: white;
        text-decoration: none !important;
        padding: 1rem;
        border-radius: 0.5rem;
        background: rgba(0, 0, 0, 0.5);
    }
}
</style>
