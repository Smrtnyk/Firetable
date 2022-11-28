<template>
    <q-list v-if="props.users">
        <q-item>
            <q-checkbox
                v-for="user in props.users"
                :key="user.id"
                :model-value="isInActiveStaff(user.id)"
                @update:model-value="setUserAsActiveEventStaff.bind(user.id)"
                :label="user.name"
                size="lg"
            />
        </q-item>
    </q-list>
</template>

<script setup lang="ts">
import { User } from "@firetable/types";
import { ref } from "vue";

interface Props {
    eventId: string;
    users: User[];
    activeStaff: User["id"][];
}

const props = defineProps<Props>();
const activeStaff = ref(props.activeStaff);
const emit = defineEmits(["updateActiveStaff"]);

function setUserAsActiveEventStaff(id: User["id"], active: boolean) {
    let newActiveStaff = [...(activeStaff.value || [])];
    if (active) {
        newActiveStaff.push(id);
    } else {
        newActiveStaff = newActiveStaff.filter((person) => person !== id);
    }
    emit("updateActiveStaff", newActiveStaff);
    activeStaff.value = newActiveStaff;
}

function isInActiveStaff(userId: User["id"]): boolean {
    return Array.isArray(activeStaff.value) && activeStaff.value.includes(userId);
}
</script>
