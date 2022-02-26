<script setup lang="ts">
import { formatEventDate } from "src/helpers/utils";
import { EventDoc } from "@firetable/types";

interface Props {
    event: EventDoc;
}
const props = defineProps<Props>();
const emit = defineEmits(["right"]);
</script>

<template>
    <q-slide-item
        right-color="warning"
        @right="({ reset }) => emit('right', { event: props.event, reset })"
        class="fa-card"
    >
        <template #right>
            <q-icon name="trash" />
        </template>
        <q-item :to="{ name: 'adminEvent', params: { id: props.event.id } }">
            <q-item-section>
                <q-item-label>{{ props.event.name }}</q-item-label>
            </q-item-section>

            <q-item-section side top>
                <q-item-label caption> {{ formatEventDate(props.event.date) }} </q-item-label>
            </q-item-section>
        </q-item>
    </q-slide-item>
</template>
