<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
const router = useRouter();
const { t } = useI18n();
</script>

<template>
    <div class="fixed-center text-center">
        <p class="text-faded">
            {{ t("Error404.message") }}<strong>{{ t("Error404.code") }}</strong>
        </p>
        <v-btn flat rounded color="primary" style="width: 200px" @click="() => router.push('/')">
            {{ t("Error404.goBackButtonLabel") }}
        </v-btn>
    </div>
</template>
