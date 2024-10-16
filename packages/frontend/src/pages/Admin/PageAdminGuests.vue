<script setup lang="ts">
import type { CreateGuestPayload, GuestDoc } from "@firetable/types";
import { useFirestoreCollection } from "src/composables/useFirestore";
import { createGuest, getGuestsPath } from "@firetable/backend";
import { useI18n } from "vue-i18n";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { usePropertiesStore } from "src/stores/properties-store";
import { storeToRefs } from "pinia";

import AddNewGuestForm from "src/components/admin/guest/AddNewGuestForm.vue";
import FTTitle from "src/components/FTTitle.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import { matchesProperty } from "es-toolkit/compat";
import { useDialog } from "src/composables/useDialog";
import { computed } from "vue";

export interface PageAdminGuestsProps {
    organisationId: string;
}

const { createDialog } = useDialog();
const { t } = useI18n();
const props = defineProps<PageAdminGuestsProps>();
const { data: guests } = useFirestoreCollection<GuestDoc>(getGuestsPath(props.organisationId), {
    wait: true,
});
const { properties } = storeToRefs(usePropertiesStore());

const sortedGuests = computed(() => {
    if (!guests.value) {
        return [];
    }
    return [...guests.value].sort(function (a, b) {
        const aVisits = getGuestVisitsCount(a);
        const bVisits = getGuestVisitsCount(b);
        // Sort in descending order
        return bVisits - aVisits;
    });
});

function showCreateGuestDialog(): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            title: t("PageAdminGuests.createNewGuestDialogTitle"),
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
    if (Object.keys(guest.visitedProperties).length === 0) {
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

function getGuestVisitsCount(guest: GuestDoc): number {
    if (!guest.visitedProperties) {
        return 0;
    }
    return Object.values(guest.visitedProperties).reduce((sum, visits) => {
        return sum + Object.values(visits).filter(Boolean).length;
    }, 0);
}
</script>

<template>
    <div class="PageAdminUsers">
        <FTTitle :title="t('PageAdminGuests.title')">
            <template #right>
                <q-btn
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="showCreateGuestDialog"
                    aria-label="Add new guest"
                />
            </template>
        </FTTitle>

        <q-list v-if="sortedGuests.length > 0">
            <q-item
                v-for="guest in sortedGuests"
                :key="guest.contact"
                clickable
                class="bg-dark"
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
        </q-list>

        <FTCenteredText v-else>No guests data</FTCenteredText>
    </div>
</template>
