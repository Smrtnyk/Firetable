<script setup lang="ts">
import type { FloorDoc, ReservationDoc } from "@firetable/types";

import AdminEventRTInfo from "src/components/admin/event/AdminEventRTInfo.vue";

interface Props {
    activeReservations: ReservationDoc[];
    eventInfo: string | undefined;
    floors: FloorDoc[];
    returningGuests: { id: string }[];
}

const props = defineProps<Props>();
</script>

<template>
    <div>
        <!-- Event Info -->
        <q-card v-if="props.eventInfo" class="q-mt-md ft-card">
            <div>{{ props.eventInfo }}</div>
        </q-card>

        <!-- Overview Stats -->
        <AdminEventRTInfo
            :floors="props.floors"
            :active-reservations="props.activeReservations"
            :returning-guests="props.returningGuests"
        />
    </div>
</template>
