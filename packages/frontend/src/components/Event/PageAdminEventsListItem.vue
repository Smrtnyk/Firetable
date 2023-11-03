<script setup lang="ts">
import { formatEventDate } from "src/helpers/date-utils";
import { EventDoc } from "@firetable/types";

interface Props {
    event: EventDoc;
}
const props = defineProps<Props>();
const emit = defineEmits(["right"]);

function emitOnRight({ reset }: { reset: () => void }): void {
    emit("right", { event: props.event, reset });
}
</script>

<template>
    <q-slide-item right-color="warning" @right="emitOnRight" class="fa-card">
        <template #right>
            <q-icon name="trash" />
        </template>
        <q-item
            :to="{
                name: 'adminEvent',
                params: {
                    eventId: props.event.id,
                    organisationId: props.event.organisationId,
                    propertyId: props.event.propertyId,
                },
            }"
        >
            <q-item-section>
                <q-item-label>{{ props.event.name }}</q-item-label>
            </q-item-section>

            <q-item-section side top>
                <q-item-label caption> {{ formatEventDate(props.event.date) }} </q-item-label>
            </q-item-section>
        </q-item>
    </q-slide-item>
</template>
