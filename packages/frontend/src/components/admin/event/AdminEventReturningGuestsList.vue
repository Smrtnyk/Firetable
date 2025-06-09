<template>
    <div>
        <v-list v-if="returningGuests.length > 0" lines="two">
            <v-list-item
                v-for="guest in returningGuests"
                :key="guest.contact"
                :to="{
                    name: 'adminGuest',
                    params: {
                        organisationId,
                        guestId: guest.id,
                    },
                }"
            >
                <div class="text-overline">{{ guest.visits.length }} previous visits</div>

                <v-list-item-title>
                    {{ guest.name }} on {{ guest.tableLabels.join(", ") }}
                </v-list-item-title>
            </v-list-item>
        </v-list>

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
