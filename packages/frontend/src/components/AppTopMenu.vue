<script setup lang="ts">
import { refreshApp } from "src/helpers/utils";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const emit = defineEmits<(e: "toggle-drawer") => void>();
const menuLinks = [
    {
        icon: "fa:fas fa-home",
        routeName: "home",
    },
    {
        icon: "fa:fas fa-user-circle",
        routeName: "userProfile",
    },
];
</script>

<template>
    <v-app-bar class="AppTopMenu" color="primary" height="48">
        <v-btn icon variant="text" @click="refreshApp">
            <v-icon icon="fa:fas fa-redo" />
        </v-btn>
        <v-spacer />

        <v-tabs hide-slider align-tabs="center">
            <v-tab v-for="menu in menuLinks" :key="menu.icon" :to="{ name: menu.routeName }" exact>
                <v-icon :icon="menu.icon" />
            </v-tab>
        </v-tabs>

        <v-spacer />
        <v-btn
            variant="text"
            :aria-label="t('AppTopMenu.menuAriaLabel')"
            @click="emit('toggle-drawer')"
        >
            <v-icon size="large" icon="fa:fas fa-bars" />
        </v-btn>
    </v-app-bar>
</template>
