<script setup lang="ts">
import type { FloorDoc, ReservationDoc } from "@firetable/types";

import AdminEventRTInfo from "src/components/admin/event/AdminEventRTInfo.vue";
import FTCard from "src/components/FTCard.vue";

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
        <FTCard v-if="props.eventInfo" class="mt-md">
            <div>{{ props.eventInfo }}</div>
        </FTCard>

        <!-- Overview Stats -->
        <AdminEventRTInfo
            :floors="props.floors"
            :active-reservations="props.activeReservations"
            :returning-guests="props.returningGuests"
        />
    </div>
</template>
