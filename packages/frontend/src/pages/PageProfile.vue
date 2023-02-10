<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "src/stores/auth-store";
import FTTitle from "components/FTTitle.vue";

const authStore = useAuthStore();
const user = computed(() => authStore.user);

const avatar = computed(() => {
    if (!user.value) return "";
    const [first, last] = user.value.name.split(" ");
    if (!last) {
        return first[0];
    }
    return `${first[0]}${last[0]}`;
});
</script>

<template>
    <div class="PageProfile" v-if="user">
        <FTTitle :title="`Profile of ${user.name}`" />
        <q-item>
            <q-item-section side>
                <q-avatar size="48px" class="ft-avatar">
                    {{ avatar }}
                </q-avatar>
            </q-item-section>
            <q-item-section>
                <q-card class="ft-card q-pa-md">
                    <q-item-label>{{ user.email }}</q-item-label>
                    <q-separator class="q-my-sm" />
                    <q-item-label v-if="user.name">Name: {{ user.name }}</q-item-label>
                    <q-item-label>Role: {{ user.role }}</q-item-label>
                    <q-item-label>Region: {{ user.region }}</q-item-label>
                    <q-item-label v-if="user.address">{{ user.address }}</q-item-label>
                    <q-item-label v-if="user.mobile">{{ user.mobile }}</q-item-label>
                </q-card>
            </q-item-section>
        </q-item>
    </div>
</template>
