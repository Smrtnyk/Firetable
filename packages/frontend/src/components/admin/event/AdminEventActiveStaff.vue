<template>
    <q-list v-if="props.users">
        <q-item>
            <q-checkbox
                v-for="user in props.users"
                :key="user.id"
                :model-value="false"
                @update:model-value="() => setUserAsActiveEventStaff(user)"
                :label="user.name"
                size="lg"
            />
        </q-item>
    </q-list>
</template>

<script setup lang="ts">
import { User } from "@firetable/types";

interface Props {
    eventId: string;
    users: User[];
}
const props = defineProps<Props>();

function setUserAsActiveEventStaff(user: User) {
    console.log(user);
}
</script>
