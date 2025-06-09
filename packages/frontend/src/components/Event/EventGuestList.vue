<script setup lang="ts">
import type { GuestInGuestListData } from "@firetable/types";
import type { EventOwner } from "src/db";

import { AdminRole, Role } from "@firetable/types";
import { storeToRefs } from "pinia";
import EventGuestListCreateGuestForm from "src/components/Event/EventGuestListCreateGuestForm.vue";
// FTBtn will be replaced by v-btn
// FTTitle is already migrated
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTTitle from "src/components/FTTitle.vue";
import { globalDialog } from "src/composables/useDialog";
import { addGuestToGuestList, confirmGuestFromGuestList, deleteGuestFromGuestList } from "src/db";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { useEventsStore } from "src/stores/events-store";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

interface Props {
    eventOwner: EventOwner;
    guestList: GuestInGuestListData[];
    guestListLimit: number;
}

const { eventOwner, guestList = [], guestListLimit } = defineProps<Props>();
const eventsStore = useEventsStore();
const { nonNullableUser } = storeToRefs(useAuthStore());
const { t } = useI18n();

const reachedCapacityPercentage = computed(function () {
    if (guestListLimit === 0) return 0;
    return (guestList.length / guestListLimit) * 100;
});

const isGuestListFull = computed(function () {
    return guestList.length >= guestListLimit;
});

const canInteract = computed(function () {
    return [AdminRole.ADMIN, Role.HOSTESS, Role.MANAGER, Role.PROPERTY_OWNER].includes(
        nonNullableUser.value.role,
    );
});

async function deleteGuest(id: string): Promise<void> {
    if (!(await globalDialog.confirm({ title: t("EventGuestList.deleteGuestTitle") }))) {
        return;
    }

    await tryCatchLoadingWrapper({
        hook() {
            return deleteGuestFromGuestList(eventOwner, id);
        },
    });
}

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
    const dialog = globalDialog.openDialog(
        EventGuestListCreateGuestForm,
        {
            onCreate(newGuestData: GuestInGuestListData) {
                onCreate(newGuestData);
                globalDialog.closeDialog(dialog);
            },
        },
        {
            title: t("EventGuestList.addGuestLabel"),
        },
    );
}

async function toggleGuestConfirmation(guest: GuestInGuestListData): Promise<void> {
    await tryCatchLoadingWrapper({
        hook() {
            return confirmGuestFromGuestList(eventOwner, guest.id, !guest.confirmed);
        },
    });
}
</script>

<template>
    <v-navigation-drawer
        temporary
        :model-value="eventsStore.showEventGuestListDrawer"
        @update:model-value="
            eventsStore.toggleEventGuestListDrawerVisibility(!eventsStore.showEventGuestListDrawer)
        "
        location="right"
        class="PageEvent__guest-list-drawer"
        width="400"
    >
        <div class="EventGuestList pa-2 d-flex flex-column fill-height">
            <FTTitle :title="t('EventGuestList.title')">
                <template #right>
                    <v-btn
                        v-if="canInteract"
                        rounded="pill"
                        icon="fa:fas fa-plus"
                        class="button-gradient"
                        variant="elevated"
                        density="comfortable"
                        @click="showAddNewGuestForm"
                        :disabled="isGuestListFull"
                        aria-label="Add new guest"
                    />
                </template>
            </FTTitle>

            <v-progress-linear
                striped
                :model-value="reachedCapacityPercentage"
                height="25"
                class="mb-2"
            >
                <div
                    class="d-flex justify-center align-center"
                    style="position: absolute; width: 100%; height: 100%"
                >
                    <span class="text-white font-weight-bold">
                        {{ guestList.length }} / {{ guestListLimit }}
                    </span>
                </div>
            </v-progress-linear>

            <div v-if="guestList.length === 0" class="text-center mt-4">
                <FTCenteredText>{{ t("EventGuestList.guestListEmptyMessage") }}</FTCenteredText>
                <v-img src="/people-confirmation.svg" class="mx-auto mt-4" />
            </div>

            <v-list v-else lines="one" class="flex-grow-1 overflow-y-auto">
                <v-list-item
                    v-for="guest in guestList"
                    :key="guest.id"
                    :class="{ 'bg-green-lighten-3': guest.confirmed }"
                >
                    <v-list-item-title>{{ guest.name }}</v-list-item-title>
                    <template v-if="canInteract" #append>
                        <v-btn
                            icon
                            size="small"
                            variant="text"
                            @click="toggleGuestConfirmation(guest)"
                            :aria-label="guest.confirmed ? 'Unconfirm guest' : 'Confirm guest'"
                        >
                            <v-icon
                                :color="guest.confirmed ? 'red' : 'green'"
                                :icon="
                                    guest.confirmed ? 'far fa-times-circle' : 'far fa-check-circle'
                                "
                            />
                        </v-btn>
                        <v-btn
                            icon
                            size="small"
                            variant="text"
                            color="warning"
                            @click="deleteGuest(guest.id)"
                            aria-label="Delete guest"
                        >
                            <v-icon>fa:fas fa-trash</v-icon>
                        </v-btn>
                    </template>
                </v-list-item>
            </v-list>
        </div>
    </v-navigation-drawer>
</template>
