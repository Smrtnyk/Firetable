<template>
    <q-list v-if="props.users">
        <q-item>
            <q-checkbox
                v-for="user in props.users"
                :key="user.id"
                :model-value="isInActiveStaff(user.id)"
                @update:model-value="(checked) => setUserAsActiveEventStaff(user, checked)"
                :label="user.name"
                size="lg"
            />
        </q-item>
    </q-list>
</template>

<script setup lang="ts">
import { User } from "@firetable/types";
import { updateEventProperty } from "@firetable/backend";

interface Props {
    eventId: string;
    users: User[];
    activeStaff: User["id"][];
}

const props = defineProps<Props>();

function setUserAsActiveEventStaff(user: User, checked: boolean) {
    let newActiveStaff = [...(props.activeStaff || [])];
    if (checked) {
        newActiveStaff.push(user.id);
    } else {
        newActiveStaff = newActiveStaff.filter((person) => person !== user.id);
    }
    updateEventProperty(props.eventId, "activeStaff", newActiveStaff);
}

function isInActiveStaff(userId: User["id"]): boolean {
    return Array.isArray(props.activeStaff) && props.activeStaff.includes(userId);
}
</script>
