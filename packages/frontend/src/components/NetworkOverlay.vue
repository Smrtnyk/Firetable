<template>
    <v-dialog :model-value="!isOnline" persistent fullscreen>
        <v-card class="d-flex flex-column justify-center align-center h-100">
            <div class="text-h6 mb-4">
                <FTCenteredText>
                    <v-progress-circular
                        indeterminate
                        color="primary"
                        class="mr-2"
                    ></v-progress-circular>
                    {{ t("NetworkOverlay.noInternetConnectionText") }}
                </FTCenteredText>
            </div>
            <p class="text-subtitle1">{{ t("NetworkOverlay.waitOrReloadText") }}</p>
            <p>
                <v-btn rounded="lg" class="button-gradient" @click="refreshApp">{{
                    t("NetworkOverlay.reloadButtonLabel")
                }}</v-btn>
            </p>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import FTCenteredText from "src/components/FTCenteredText.vue";
import { useNetworkStatus } from "src/composables/useNetworkStatus";
import { refreshApp } from "src/helpers/utils";
import { useI18n } from "vue-i18n";

const { isOnline } = useNetworkStatus();
const { t } = useI18n();
</script>
