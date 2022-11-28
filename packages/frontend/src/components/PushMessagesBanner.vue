<script setup lang="ts">
import { urlBase64ToUint8Array } from "src/helpers/utils";
import { onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { savePushSubscription } from "@firetable/backend";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";

const ICON_128 = "icons/icon-128x128.png";
const NOTIFICATIONS_GRANTED_OPTIONS: NotificationOptions = {
    body: "Thanks for subscribing!",
    icon: ICON_128,
    image: ICON_128,
    badge: ICON_128,
    dir: "ltr",
    lang: "en-UK",
    vibrate: [100, 50, 200],
    tag: "confirm-notification",
    renotify: true,
    actions: [
        {
            action: "hello",
            title: "Hello",
            icon: ICON_128,
        },
    ],
};

const q = useQuasar();
const showPushNotificationsBanner = ref<boolean>(false);

const pushNotificationsSupported = "PushManager" in window;
const serviceWorkerSupported = "serviceWorker" in window.navigator;

function initEnablePushNotificationsBanner() {
    const shouldNeverShow = q.localStorage.getItem("neverShowPushNotificationsBanner");
    showPushNotificationsBanner.value = !shouldNeverShow;
}

function neverShowPushNotificationsBanner() {
    showPushNotificationsBanner.value = false;
    q.localStorage.set("neverShowPushNotificationsBanner", true);
}

async function displayGrantedNotification(sw: ServiceWorkerRegistration) {
    await sw.showNotification("You're subscribed to notifications!", NOTIFICATIONS_GRANTED_OPTIONS);
}

async function checkForExistingPushSubscription() {
    if (!serviceWorkerSupported || !pushNotificationsSupported) return;

    const sw = await navigator.serviceWorker.ready;
    const subscription = await sw.pushManager.getSubscription();

    if (!subscription) await createAndSavePushSubscription(sw);
}

function createAndSavePushSubscription(sw: ServiceWorkerRegistration) {
    return tryCatchLoadingWrapper(async () => {
        const newSub = await sw.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(process.env.VAPID_PUBLIC_KEY),
        });

        await savePushSubscription(newSub.toJSON());
        await displayGrantedNotification(sw);
    });
}

async function enableNotifications() {
    if (!pushNotificationsSupported) return;

    const permission = await Notification.requestPermission();

    neverShowPushNotificationsBanner();

    if (permission === "granted") await checkForExistingPushSubscription();
}

onMounted(initEnablePushNotificationsBanner);
</script>

<template>
    <q-banner v-if="showPushNotificationsBanner && pushNotificationsSupported">
        Enable Push Notifications?
        <template #avatar>
            <q-icon name="img:bell.gif" />
        </template>
        <template #action>
            <q-btn
                rounded
                size="md"
                label="Yes"
                class="button-gradient q-ml-md"
                @click="enableNotifications"
            />
            <q-btn
                outline
                rounded
                size="md"
                color="primary"
                label="Later"
                @click="() => (showPushNotificationsBanner.value = false)"
            />
            <q-btn
                outline
                rounded
                size="md"
                color="primary"
                label="Never"
                @click="neverShowPushNotificationsBanner"
            />
        </template>
    </q-banner>
</template>
