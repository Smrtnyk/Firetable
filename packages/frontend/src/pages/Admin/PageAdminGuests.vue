<script setup lang="ts">
import type { CreateGuestPayload, GuestDoc, VoidFunction } from "@firetable/types";
import { useFirestoreCollection } from "src/composables/useFirestore";
import { createGuest, deleteGuest, getGuestsPath } from "@firetable/backend";
import { useI18n } from "vue-i18n";
import { showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { usePropertiesStore } from "src/stores/properties-store";
import { storeToRefs } from "pinia";
import { useQuasar } from "quasar";

import AddNewGuestForm from "src/components/admin/guest/AddNewGuestForm.vue";
import FTTitle from "src/components/FTTitle.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import { matchesProperty } from "es-toolkit/compat";

interface Props {
    organisationId: string;
}

const q = useQuasar();
const { t } = useI18n();
const props = defineProps<Props>();
const { data: guests } = useFirestoreCollection<GuestDoc>(getGuestsPath(props.organisationId), {
    wait: true,
});
const { properties } = storeToRefs(usePropertiesStore());

async function onDeleteGuest(guest: GuestDoc, reset: VoidFunction): Promise<void> {
    reset();
    if (!(await showConfirm(t("PageAdminGuests.deleteGuestConfirmationMessage")))) {
        return;
    }
    return tryCatchLoadingWrapper({
        hook() {
            return deleteGuest(props.organisationId, guest.id);
        },
    });
}

async function editGuest(_: GuestDoc, reset: VoidFunction): Promise<void> {
    reset();
    if (!(await showConfirm(t("PageAdminGuests.editGuestConfirmationMessage")))) {
        // eslint-disable-next-line no-useless-return -- needed when todo will be resolved
        return;
    }
    // TODO: implement edit guest
}

function showCreateGuestDialog(): void {
    const dialog = q.dialog({
        component: FTDialog,
        componentProps: {
            title: "Add new Guest",
            maximized: false,
            component: AddNewGuestForm,
            listeners: {
                create(payload: CreateGuestPayload) {
                    dialog.hide();

                    tryCatchLoadingWrapper({
                        hook() {
                            return createGuest(props.organisationId, payload);
                        },
                    });
                },
            },
        },
    });
}

function guestVisitsToReadable(guest: GuestDoc): string {
    if (!guest.visitedProperties) {
        return "No visits recorded";
    }

    const res = Object.entries(guest.visitedProperties).map(function ([propertyId, visits]) {
        const property = properties.value.find(matchesProperty("id", propertyId));
        if (!property) {
            return "";
        }
        const visitsCount = Object.values(visits).filter(Boolean).length;
        if (!visitsCount) {
            return "";
        }
        return `${property.name} visits: ${visitsCount}`;
    });
    return res.join(", ");
}
</script>

<template>
    <div class="PageAdminUsers">
        <FTTitle :title="t('PageAdminGuests.title')">
            <template #right>
                <q-btn rounded icon="plus" class="button-gradient" @click="showCreateGuestDialog" />
            </template>
        </FTTitle>

        <q-list v-if="guests.length > 0">
            <q-slide-item
                v-for="guest in guests"
                :key="guest.contact"
                clickable
                right-color="warning"
                @right="({ reset }) => onDeleteGuest(guest, reset)"
                @left="({ reset }) => editGuest(guest, reset)"
                class="fa-card"
            >
                <template #right>
                    <q-icon name="trash" />
                </template>

                <template #left>
                    <q-icon name="pencil" />
                </template>

                <q-item
                    clickable
                    class="ft-card"
                    :to="{
                        name: 'adminGuest',
                        params: {
                            organisationId: props.organisationId,
                            guestId: guest.id,
                        },
                    }"
                >
                    <q-item-section>
                        <q-item-label>{{ guest.name }} - {{ guest.contact }}</q-item-label>
                        <q-item-label caption>{{ guestVisitsToReadable(guest) }}</q-item-label>
                    </q-item-section>
                </q-item>
            </q-slide-item>
        </q-list>

        <FTCenteredText v-else>No guests data</FTCenteredText>
    </div>
</template>
