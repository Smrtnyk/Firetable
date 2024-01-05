<script setup lang="ts">
import { useAuthStore } from "src/stores/auth-store";
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

const redirectLink = computed(() => {
    return authStore.isAdmin
        ? {
              name: "organisations",
          }
        : {
              name: "properties",
              params: {
                  organisationId: authStore.user?.organisationId,
              },
          };
});

onMounted(() => {
    router.replace(redirectLink.value);
});
</script>

<template>
    <div></div>
</template>
