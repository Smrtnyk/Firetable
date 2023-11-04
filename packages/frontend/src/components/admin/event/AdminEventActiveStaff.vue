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
import { reactive } from "vue";

interface Props {
    eventId: string;
    users: User[];
    activeStaff: Set<User["id"]>;
}

const props = defineProps<Props>();
const activeStaff = reactive(props.activeStaff);
const emit = defineEmits(["updateActiveStaff"]);

function setUserAsActiveEventStaff(id: User["id"], active: boolean): void {
    if (active) {
        activeStaff.add(id);
    } else {
        activeStaff.delete(id);
    }
    emit("updateActiveStaff", Array.from(activeStaff));
}

function isInActiveStaff(userId: User["id"]): boolean {
    return activeStaff.has(userId);
}
</script>
