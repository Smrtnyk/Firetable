<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useQuasar, LocalStorage } from "quasar";
import { useAuthStore } from "src/stores/auth-store";
import { useAppStore } from "src/stores/app-store";
import { logoutUser, updateUserField } from "@firetable/backend";
import { showErrorMessage, tryCatchLoadingWrapper } from "@firetable/utils";

interface Props {
    showAdminLinks: boolean;
}
const props = defineProps<Props>();
const appStore = useAppStore();
const authStore = useAuthStore();
const q = useQuasar();
const { t, locale } = useI18n();

const lang = ref(locale);
const langOptions = [
    { value: "en-GB", label: "English" },
    { value: "de", label: "German" },
];

const adminLinks = computed(() => [
    {
        icon: "calendar",
        routeName: "adminEvents",
        text: t("AppDrawer.links.manageEvents"),
    },
    {
        icon: "users",
        routeName: "adminUsers",
        text: t("AppDrawer.links.manageUsers"),
    },
    {
        icon: "arrow-expand",
        routeName: "adminFloors",
        text: t("AppDrawer.links.manageFloors"),
    },
    {
        icon: "arrow-expand",
        routeName: "adminRoles",
        text: t("AppDrawer.links.manageRoles"),
    },
]);
const user = computed(() => authStore.user);
const adminLinksCollection = computed(() => (props.showAdminLinks ? adminLinks.value : []));
const avatar = computed(() => {
    if (!user.value) return "";
    const [first, last] = user.value.name.split(" ");
    if (!last) {
        return first[0];
    }
    return `${first[0]}${last[0]}`;
});

function setDarkMode(newValue: boolean) {
    q.dark.set(newValue);
    q.localStorage.set("FTDarkMode", newValue);
}

function toggleUserActivityStatus(newValue: boolean) {
    if (!user.value) return;

    updateUserField(user.value.id, "status", Number(newValue)).catch(showErrorMessage);
}

function onLogoutUser() {
    tryCatchLoadingWrapper(() => logoutUser().then(authStore.unsubscribeUserWatch)).catch(
        showErrorMessage
    );
}

function setAppLanguage(val: string) {
    LocalStorage.set("FTLang", val);
    locale.value = val;
}
</script>

<template>
    <q-drawer
        :model-value="appStore.showAppDrawer"
        @update:model-value="appStore.toggleAppDrawerVisibility"
        elevated
        side="right"
        overlay
        behavior="mobile"
    >
        <q-list>
            <q-item header class="column items-center q-pt-xl q-pb-lg">
                <q-avatar size="6rem" class="ft-avatar">
                    <div
                        :class="{
                            green: user.status,
                        }"
                        class="status-dot"
                    />
                    {{ avatar }}
                </q-avatar>
                <div class="q-mt-md text-center">
                    <div class="text-subtitle1">{{ user.name }}</div>
                    <div class="text-caption text-grey">{{ user.email }}</div>
                    <div class="text-caption text-grey">
                        {{ user.status ? "Online" : "Offline" }}
                    </div>
                </div>
            </q-item>

            <q-separator v-if="adminLinksCollection.length" />

            <q-item
                v-for="(link, index) in adminLinksCollection"
                :key="index"
                :to="{ name: link.routeName }"
                clickable
            >
                <q-item-section avatar>
                    <q-icon :name="link.icon" />
                </q-item-section>
                <q-item-section>{{ link.text }}</q-item-section>
            </q-item>

            <q-separator spaced />

            <q-item clickable @click="onLogoutUser">
                <q-item-section avatar>
                    <q-icon name="logout" />
                </q-item-section>

                <q-item-section>{{ t("AppDrawer.links.logout") }}</q-item-section>
            </q-item>

            <q-separator spaced />
            <q-item>
                <q-select
                    :model-value="lang"
                    :options="langOptions"
                    label="Language"
                    dense
                    borderless
                    emit-value
                    map-options
                    options-dense
                    @update:model-value="setAppLanguage"
                />
            </q-item>
            <q-separator spaced />
            <q-item>
                <q-toggle
                    :model-value="q.dark.isActive"
                    @update:model-value="setDarkMode"
                    checked-icon="moon"
                    color="red"
                    label="Toggle dark mode"
                    unchecked-icon="sun"
                    size="lg"
                />
            </q-item>
            <q-item>
                <q-toggle
                    :model-value="!!user.status"
                    checked-icon="status-online"
                    color="green"
                    label="Toggle online status"
                    unchecked-icon="status-offline"
                    size="lg"
                    @update:model-value="toggleUserActivityStatus"
                />
            </q-item>
        </q-list>
    </q-drawer>
</template>

<style lang="scss">
.status-dot {
    height: 0.8rem;
    width: 0.8rem;
    position: absolute;
    top: 80%;
    left: 80%;
    border-radius: 100%;
    background-color: gray;

    &.green {
        background-color: green;
    }
}
.q-item.q-router-link--active {
    width: 95%;
    margin: auto;
    background: $gradient-primary;
    box-shadow: 0 0 10px 1px rgba($primary, 0.7);
    color: white;
    border-radius: $border-radius;
}
</style>
