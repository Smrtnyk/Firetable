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
                        guestId: guest.contact,
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

interface Props {
    organisationId: string;
    returningGuests: {
        name: string;
        contact: string;
        visits: (Visit | null)[];
        tableLabels: any[];
    }[];
}

const { organisationId, returningGuests } = defineProps<Props>();
</script>
