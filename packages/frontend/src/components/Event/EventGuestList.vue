<script setup lang="ts">
import type { GuestInGuestListData, VoidFunction } from "@firetable/types";

import { AdminRole, Role } from "@firetable/types";
import { storeToRefs } from "pinia";
import EventGuestListCreateGuestForm from "src/components/Event/EventGuestListCreateGuestForm.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTTitle from "src/components/FTTitle.vue";
import { useDialog } from "src/composables/useDialog";
import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { useEventsStore } from "src/stores/events-store";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import type { EventOwner } from "../../backend-proxy";

import {
    addGuestToGuestList,
    confirmGuestFromGuestList,
    deleteGuestFromGuestList,
} from "../../backend-proxy";

interface Props {
    eventOwner: EventOwner;
    guestList: GuestInGuestListData[];
    guestListLimit: number;
}

const { eventOwner, guestList = [], guestListLimit } = defineProps<Props>();
const { createDialog } = useDialog();
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
    return [AdminRole.ADMIN, Role.HOSTESS, Role.MANAGER, Role.PROPERTY_OWNER].includes(
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

async function onSwipeRightDeleteGuest(
    { reset }: { reset: VoidFunction },
    id: string,
): Promise<void> {
    if (!(await showConfirm(t("EventGuestList.deleteGuestTitle")))) {
        return reset();
    }

    await tryCatchLoadingWrapper({
        // Reset only on error hook, since deleting the guest causes the rerender of the list anyway
        errorHook: reset,
        hook() {
            return deleteGuestFromGuestList(eventOwner, id);
        },
    });
}

function showAddNewGuestForm(): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: EventGuestListCreateGuestForm,
            componentPropsObject: {},
            listeners: {
                create(newGuestData: GuestInGuestListData) {
                    onCreate(newGuestData);
                    dialog.hide();
                },
            },
            maximized: false,
            title: t("EventGuestList.addGuestLabel"),
        },
    });
}
</script>

<template>
    <q-drawer
        no-swipe-open
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
                    <FTBtn
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
