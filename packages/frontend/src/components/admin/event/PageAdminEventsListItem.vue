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
    <q-slide-item right-color="warning" @right="emitOnRight" @left="emitEdit" class="fa-card">
        <template #right>
            <q-icon name="fa fa-trash" />
        </template>
        <template #left>
            <q-icon name="fa fa-pencil" />
        </template>
        <q-item
            :to="{
                name: 'adminEvent',
                params: {
                    eventId: event.id,
                    organisationId: event.organisationId,
                    propertyId: event.propertyId,
                },
            }"
        >
            <q-item-section>
                <q-item-label>{{ event.name }}</q-item-label>
            </q-item-section>

            <q-item-section side top>
                <q-item-label caption>
                    {{ formatEventDate(event.date, locale, timezone) }}
                </q-item-label>
            </q-item-section>
        </q-item>
    </q-slide-item>
</template>
