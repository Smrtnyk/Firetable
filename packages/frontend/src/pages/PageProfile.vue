<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "src/stores/auth-store";
import FTTitle from "components/FTTitle.vue";
import { isNone, isSome } from "@firetable/types";

const authStore = useAuthStore();
const user = computed(() => authStore.user);

const avatar = computed(() => {
    if (isNone(user.value)) return "";
    const [first, last] = user.value.value.name.split(" ");
    if (!last) {
        return first[0];
    }
    return `${first[0]}${last[0]}`;
});
</script>

<template>
    <div class="PageProfile" v-if="isSome(user)">
        <FTTitle :title="`Profile of ${user.value.name}`" />
        <q-item>
            <q-item-section side>
                <q-avatar size="48px" class="ft-avatar">
                    {{ avatar }}
                </q-avatar>
            </q-item-section>
            <q-item-section>
                <q-card class="ft-card q-pa-md">
                    <q-item-label>{{ user.value.email }}</q-item-label>
                    <q-separator class="q-my-sm" />
                    <q-item-label v-if="user.value.name">Name: {{ user.value.name }}</q-item-label>
                    <q-item-label>Role: {{ user.value.role }}</q-item-label>
                    <q-item-label>Region: {{ user.value.region }}</q-item-label>
                    <q-item-label v-if="user.value.address">{{ user.value.address }}</q-item-label>
                    <q-item-label v-if="user.value.mobile">{{ user.value.mobile }}</q-item-label>
                </q-card>
            </q-item-section>
        </q-item>
    </div>
</template>
