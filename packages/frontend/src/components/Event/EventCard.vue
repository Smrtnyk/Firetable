<script setup lang="ts">
import type { EventDoc } from "@firetable/types";
import { dateFromTimestamp, hourFromTimestamp } from "src/helpers/date-utils";
import { useI18n } from "vue-i18n";
import { computed } from "vue";

interface Props {
    event: EventDoc;
    index: number;
    aspectRatio: number;
}

const props = defineProps<Props>();
const { t } = useI18n();

const backgroundImageUrl = computed(function () {
    const imageIndex = (props.index % 3) + 1;
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- it can be empty string
    return props.event.img || `/images/default-event-img-${imageIndex}.jpg`;
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
                    organisationId: props.event.organisationId,
                    propertyId: props.event.propertyId,
                    eventId: props.event.id,
                },
            }"
        >
            <q-responsive :ratio="props.aspectRatio">
                <div class="EventCard__content column">
                    <div class="row items-center">
                        <q-icon name="calendar" color="white" class="q-mr-xs" size="xs" />

                        {{ dateFromTimestamp(props.event.date) }}

                        <q-space />

                        <q-icon name="clock" color="white" class="q-mr-xs" size="xs" />

                        {{ hourFromTimestamp(props.event.date) }}
                    </div>

                    <q-space />

                    <div class="row">
                        <q-icon name="euro" color="white" class="q-mr-xs" size="xs" />

                        {{ props.event.entryPrice || t("EventCard.freeLabel") }}
                    </div>

                    <h4 class="text-h4 q-mb-sm q-ml-none q-mt-none">{{ props.event.name }}</h4>
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
