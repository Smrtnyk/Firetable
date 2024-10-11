<script setup lang="ts">
import type { FloorViewer } from "@firetable/floor-creator";

interface EventViewControlsProps {
    activeFloor: { id: string; name: string } | undefined;
    floorInstances: FloorViewer[];
    hasMultipleFloorPlans: boolean;
    isAdmin: boolean;
}

const emit = defineEmits<{
    (
        e:
            | "navigate-to-admin-event"
            | "show-event-info"
            | "toggle-event-guest-list-drawer-visibility"
            | "toggle-queued-reservations-drawer-visibility",
    ): void;
    (e: "set-active-floor", value: FloorViewer): void;
}>();

const props = defineProps<EventViewControlsProps>();
</script>

<template>
    <q-btn-dropdown dense round outline>
        <q-list style="min-width: 50vw">
            <q-item v-if="hasMultipleFloorPlans" clickable>
                <q-item-section>
                    <q-item-label>{{ activeFloor?.name }}</q-item-label>
                    <q-item-label caption>Current floor</q-item-label>
                </q-item-section>
                <q-item-section side>
                    <q-icon name="chevron_right" />
                </q-item-section>

                <q-menu anchor="top end" self="top start">
                    <q-list>
                        <q-item
                            v-for="florInstance of floorInstances"
                            :key="florInstance.id"
                            clickable
                            @click.prevent="() => emit('set-active-floor', florInstance)"
                            :class="{
                                'button-gradient': activeFloor?.id === florInstance.id,
                            }"
                        >
                            <q-item-section>
                                {{ florInstance.name }}
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-menu>
            </q-item>
            <q-separator />

            <q-item
                clickable
                v-close-popup
                @click="emit('toggle-queued-reservations-drawer-visibility')"
            >
                <q-item-section avatar>
                    <q-icon name="list" color="secondary" />
                </q-item-section>
                <q-item-section>Table Waiting list</q-item-section>
            </q-item>

            <q-item
                clickable
                v-close-popup
                @click="emit('toggle-event-guest-list-drawer-visibility')"
            >
                <q-item-section avatar>
                    <q-icon name="users-list" color="tertiary" />
                </q-item-section>
                <q-item-section>Guestlist</q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="() => emit('show-event-info')">
                <q-item-section avatar>
                    <q-icon name="info" color="quaternary" />
                </q-item-section>
                <q-item-section>Event Info</q-item-section>
            </q-item>

            <q-item
                v-if="props.isAdmin"
                clickable
                v-close-popup
                @click="() => emit('navigate-to-admin-event')"
            >
                <q-item-section>Show Details</q-item-section>
            </q-item>
        </q-list>
    </q-btn-dropdown>
</template>
