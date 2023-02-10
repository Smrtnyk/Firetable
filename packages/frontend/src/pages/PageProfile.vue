<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "src/stores/auth-store";
import FTTitle from "components/FTTitle.vue";
import { isNone, isSome } from "@firetable/types";

const authStore = useAuthStore();
const user = computed(() => authStore.user);

const avatar = computed(() => {
    if (isNone(user.value)) return "";
    const [first, last] = user.value.unwrap().name.split(" ");
    if (!last) {
        return first[0];
    }
    return `${first[0]}${last[0]}`;
});
</script>

<template>
    <div class="PageProfile" v-if="isSome(user)">
        <FTTitle :title="`Profile of ${user.unwrap().name}`" />
        <q-item>
            <q-item-section side>
                <q-avatar size="48px" class="ft-avatar">
                    {{ avatar }}
                </q-avatar>
            </q-item-section>
            <q-item-section>
                <q-card class="ft-card q-pa-md">
                    <q-item-label>{{ user.unwrap().email }}</q-item-label>
                    <q-separator class="q-my-sm" />
                    <q-item-label v-if="user.unwrap().name"
                        >Name: {{ user.unwrap().name }}</q-item-label
                    >
                    <q-item-label>Role: {{ user.unwrap().role }}</q-item-label>
                    <q-item-label>Region: {{ user.unwrap().region }}</q-item-label>
                    <q-item-label v-if="user.unwrap().address">{{
                        user.unwrap().address
                    }}</q-item-label>
                    <q-item-label v-if="user.unwrap().mobile">{{
                        user.unwrap().mobile
                    }}</q-item-label>
                </q-card>
            </q-item-section>
        </q-item>
    </div>
</template>
