<script setup lang="ts">
import type { GuestInGuestListData } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import {
    showConfirm,
    showErrorMessage,
    tryCatchLoadingWrapper,
    withLoading,
} from "src/helpers/ui-helpers";
import { computed } from "vue";
import { useEventsStore } from "src/stores/events-store";

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

const props = withDefaults(defineProps<Props>(), {
    guestList: () => [],
});
const quasar = useQuasar();
const eventsStore = useEventsStore();
const authStore = useAuthStore();
const { t } = useI18n();
const reachedCapacity = computed(() => props.guestList.length / props.guestListLimit);
const isGuestListFull = computed(() => props.guestList.length >= props.guestListLimit);

const canInteract = computed(() => {
    return [Role.PROPERTY_OWNER, Role.MANAGER, ADMIN].includes(authStore.nonNullableUser.role);
});

function onCreate(newGuestData: GuestInGuestListData): Promise<void> | void {
    if (props.guestList.length >= props.guestListLimit) {
        showErrorMessage(t("EventGuestList.guestLimitReached"));
        return;
    }

    tryCatchLoadingWrapper({
        hook: () => addGuestToGuestList(props.eventOwner, newGuestData),
    });
}

async function deleteGuest(id: string, reset: () => void): Promise<void> {
    if (!(await showConfirm(t("EventGuestList.deleteGuestTitle")))) return reset();

    await tryCatchLoadingWrapper({
        hook: () => deleteGuestFromGuestList(props.eventOwner, id),
        errorHook: reset,
    });
}

const confirmGuest = withLoading(function (
    { id, confirmed }: GuestInGuestListData,
    reset: () => void,
) {
    return confirmGuestFromGuestList(props.eventOwner, id, !confirmed).then(reset);
});

function showAddNewGuestForm(): void {
    const dialog = quasar.dialog({
        component: FTDialog,
        componentProps: {
            title: t("EventGuestList.addGuestLabel"),
            component: EventGuestListCreateGuestForm,
            maximized: false,
            componentPropsObject: {},
            listeners: {
                create: (newGuestData: GuestInGuestListData) => {
                    onCreate(newGuestData);
                    dialog.hide();
                },
            },
        },
    });
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
                        :label="`${props.guestList.length} / ${props.guestListLimit}`"
                    />
                </div>
            </q-linear-progress>

            <div class="EventGuestList" v-if="props.guestList.length === 0">
                <div class="row justify-center items-center q-mt-md">
                    <h6 class="q-ma-sm text-weight-bolder underline">
                        {{ t("EventGuestList.guestListEmptyMessage") }}
                    </h6>
                    <q-img src="/people-confirmation.svg" />
                </div>
            </div>

            <q-list v-else bordered separator>
                <q-slide-item
                    v-for="guest in guestList"
                    :key="guest.id"
                    right-color="warning"
                    :left-color="guest.confirmed ? 'red-5' : 'green-5'"
                    @right="({ reset }) => deleteGuest(guest.id, reset)"
                    @left="({ reset }) => confirmGuest(guest, reset)"
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
