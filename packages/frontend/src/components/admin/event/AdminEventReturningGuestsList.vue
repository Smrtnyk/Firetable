<template>
    <div>
        <q-list v-if="returningGuests.length > 0">
            <q-item
                v-for="guest in returningGuests"
                :key="guest.contact"
                clickable
                v-ripple
                :to="{
                    name: 'adminGuest',
                    params: {
                        organisationId,
                        guestId: guest.id,
                    },
                }"
            >
                <q-item-section>
                    <q-item-label overline>{{ guest.visits.length }} previous visits</q-item-label>
                    <q-item-label>
                        {{ guest.name }} on {{ guest.tableLabels.join(", ") }}</q-item-label
                    >
                </q-item-section>
            </q-item>
        </q-list>
        <FTCenteredText v-else> No returning guests </FTCenteredText>
    </div>
</template>

<script setup lang="ts">
import type { Visit } from "@firetable/types";

import FTCenteredText from "src/components/FTCenteredText.vue";

export interface AdminEventReturningGuestsListProps {
    organisationId: string;
    returningGuests: {
        contact: string;
        id: string;
        name: string;
        tableLabels: any[];
        visits: (null | Visit)[];
    }[];
}

const { organisationId, returningGuests } = defineProps<AdminEventReturningGuestsListProps>();
</script>
