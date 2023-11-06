<script setup lang="ts">
import { dateFromTimestamp, hourFromTimestamp } from "src/helpers/date-utils";
import { EventDoc } from "@firetable/types";
import { useI18n } from "vue-i18n";

interface Props {
    event: EventDoc;
}

const props = defineProps<Props>();
const { t } = useI18n();
</script>
<template>
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
        <q-card class="EventCard">
            <q-img :src="event.img || '/images/default-event-img.jpg'" />

            <q-card-section class="EventCard__content">
                <h4 class="text-h4 q-mb-sm q-ml-none q-mt-none">{{ props.event.name }}</h4>
                <q-icon
                    name="calendar"
                    color="white"
                    class="gradient-warning q-pa-xs rounded"
                    size="xs"
                />
                {{ dateFromTimestamp(props.event.date) }}

                <q-icon
                    name="clock"
                    color="white"
                    class="q-ml-sm gradient-positive q-pa-xs rounded"
                    size="xs"
                />
                {{ hourFromTimestamp(props.event.date) }}

                <q-icon
                    name="euro"
                    color="white"
                    class="q-ml-sm gradient-pink q-pa-xs rounded"
                    size="xs"
                />
                {{ props.event.entryPrice || t("EventCard.freeLabel") }}
            </q-card-section>
        </q-card>
    </router-link>
</template>

<style lang="scss">
.EventCard {
    box-shadow:
        0 0.25rem 0.25rem rgba(0, 0, 0, 0.2),
        0 0 1rem rgba(0, 0, 0, 0.2);

    &__link {
        text-decoration: none !important;
        color: currentColor;
        &:visited {
            color: currentColor;
        }
    }

    &__content {
        text-decoration: none !important;
        padding: 1rem;
        width: 100%;
        background: inherit;
        position: absolute;
        bottom: 0;
    }
}
</style>
