<script setup lang="ts">
import type { EventDoc } from "@firetable/types";

import { formatEventDate } from "src/helpers/date-utils";
import { useI18n } from "vue-i18n";

interface Props {
    event: EventDoc;
    timezone: string;
}
const { event, timezone } = defineProps<Props>();
const emit = defineEmits<(e: "left" | "right", value: { event: EventDoc }) => void>();
const { locale } = useI18n();

function emitEdit(): void {
    emit("left", { event });
}

function emitOnRight(): void {
    emit("right", { event });
}
</script>

<template>
    <v-list-item
        :to="{
            name: 'adminEvent',
            params: {
                eventId: event.id,
                organisationId: event.organisationId,
                propertyId: event.propertyId,
            },
        }"
        class="fa-card"
    >
        <div class="d-flex align-center justify-space-between w-100">
            <v-list-item-title>{{ event.name }}</v-list-item-title>
            <div class="text-caption ml-2 flex-shrink-0">
                {{ formatEventDate(event.date, locale, timezone) }}
            </div>
        </div>

        <template #append>
            <v-btn icon variant="text" size="small" @click.stop="emitEdit" class="ml-1">
                <v-icon icon="fa:fas fa-pencil" />
            </v-btn>
            <v-btn
                icon
                variant="text"
                size="small"
                color="warning"
                @click.stop="emitOnRight"
                class="ml-1"
            >
                <v-icon icon="fa fa-trash" />
            </v-btn>
        </template>
    </v-list-item>
</template>
