<script setup lang="ts">
import type { GuestInGuestListData, VoidFunction } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { computed } from "vue";
import { useEventsStore } from "src/stores/events-store";
import { storeToRefs } from "pinia";

import FTCenteredText from "src/components/FTCenteredText.vue";
import EventGuestListCreateGuestForm from "src/components/Event/EventGuestListCreateGuestForm.vue";
import FTTitle from "src/components/FTTitle.vue";
import FTDialog from "src/components/FTDialog.vue";
import { useQuasar } from "quasar";
import { ADMIN, Role } from "@firetable/types";
import {
    addGuestToGuestList,
    confirmGuestFromGuestList,
    deleteGuestFromGuestList,
} from "@firetable/backend";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "src/stores/auth-store";

interface Props {
    guestListLimit: number;
    guestList: GuestInGuestListData[];
    eventOwner: EventOwner;
}

const { guestListLimit, eventOwner, guestList = [] } = defineProps<Props>();
const quasar = useQuasar();
const eventsStore = useEventsStore();
const { nonNullableUser } = storeToRefs(useAuthStore());
const { t } = useI18n();
const reachedCapacity = computed(function () {
    return guestList.length / guestListLimit;
});
const isGuestListFull = computed(function () {
    return guestList.length >= guestListLimit;
});

const canInteract = computed(function () {
    return [Role.PROPERTY_OWNER, Role.MANAGER, ADMIN, Role.HOSTESS].includes(
        nonNullableUser.value.role,
    );
});

function onCreate(newGuestData: GuestInGuestListData): Promise<void> | void {
    if (guestList.length >= guestListLimit) {
        showErrorMessage(t("EventGuestList.guestLimitReached"));
        return;
    }

    tryCatchLoadingWrapper({
        hook() {
            return addGuestToGuestList(eventOwner, newGuestData);
        },
    });
}

function showAddNewGuestForm(): void {
    const dialog = quasar.dialog({
        component: FTDialog,
        componentProps: {
            title: t("EventGuestList.addGuestLabel"),
            component: EventGuestListCreateGuestForm,
            maximized: false,
            componentPropsObject: {},
            listeners: {
                create(newGuestData: GuestInGuestListData) {
                    onCreate(newGuestData);
                    dialog.hide();
                },
            },
        },
    });
}

async function onSwipeRightDeleteGuest(
    { reset }: { reset: VoidFunction },
    id: string,
): Promise<void> {
    if (!(await showConfirm(t("EventGuestList.deleteGuestTitle")))) {
        return reset();
    }

    await tryCatchLoadingWrapper({
        hook() {
            return deleteGuestFromGuestList(eventOwner, id);
        },
        // Reset only on error hook, since deleting the guest causes the rerender of the list anyway
        errorHook: reset,
    });
}

async function onSwipeLeftConfirmGuest(
    { reset }: { reset: VoidFunction },
    guest: GuestInGuestListData,
): Promise<void> {
    await tryCatchLoadingWrapper({
        hook() {
            return confirmGuestFromGuestList(eventOwner, guest.id, !guest.confirmed);
        },
    }).finally(reset);
}
</script>

<template>
    <q-drawer
        :model-value="eventsStore.showEventGuestListDrawer"
        @update:model-value="eventsStore.toggleEventGuestListDrawerVisibility"
        class-name="PageEvent__guest-list-drawer"
        side="right"
        content-class="PageEvent__guest-list-container"
        overlay
        behavior="mobile"
    >
        <div class="EventGuestList">
            <FTTitle :title="t('EventGuestList.title')">
                <template #right>
                    <q-btn
                        v-if="canInteract"
                        rounded
                        icon="plus"
                        class="button-gradient"
                        @click="showAddNewGuestForm"
                        :disabled="isGuestListFull"
                    />
                </template>
            </FTTitle>

            <q-linear-progress stripe :value="reachedCapacity" size="25px">
                <div class="absolute-full flex flex-center">
                    <q-badge
                        color="white"
                        text-color="accent"
                        :label="`${guestList.length} / ${guestListLimit}`"
                    />
                </div>
            </q-linear-progress>

            <div class="EventGuestList" v-if="guestList.length === 0">
                <FTCenteredText>{{ t("EventGuestList.guestListEmptyMessage") }}</FTCenteredText>
                <q-img src="/people-confirmation.svg" />
            </div>

            <q-list v-else bordered separator>
                <q-slide-item
                    v-for="guest in guestList"
                    :key="guest.id"
                    right-color="warning"
                    :left-color="guest.confirmed ? 'red-5' : 'green-5'"
                    @right="onSwipeRightDeleteGuest($event, guest.id)"
                    @left="onSwipeLeftConfirmGuest($event, guest)"
                >
                    <template v-if="canInteract" #right>
                        <q-icon name="trash" />
                    </template>
                    <template v-if="canInteract" #left>
                        <q-icon color="white" :name="guest.confirmed ? 'close' : 'check'" />
                    </template>
                    <q-item
                        clickable
                        :class="{
                            'bg-green-4': guest.confirmed,
                        }"
                    >
                        <q-item-section>
                            <q-item-label>{{ guest.name }}</q-item-label>
                        </q-item-section>
                    </q-item>
                </q-slide-item>
            </q-list>
        </div>
    </q-drawer>
</template>
