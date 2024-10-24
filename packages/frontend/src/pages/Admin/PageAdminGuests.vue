<script setup lang="ts">
import type { CreateGuestPayload, GuestDoc, Visit } from "@firetable/types";
import { useFirestoreCollection } from "src/composables/useFirestore";
import { createGuest, getGuestsPath } from "@firetable/backend";
import { useI18n } from "vue-i18n";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { usePropertiesStore } from "src/stores/properties-store";
import { storeToRefs } from "pinia";
import { matchesProperty } from "es-toolkit/compat";
import { useDialog } from "src/composables/useDialog";
import { computed, ref, watch } from "vue";
import { isMobile } from "src/global-reactives/screen-detection";
import { Loading } from "quasar";

import AddNewGuestForm from "src/components/admin/guest/AddNewGuestForm.vue";
import FTTitle from "src/components/FTTitle.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTBtn from "src/components/FTBtn.vue";

export interface PageAdminGuestsProps {
    organisationId: string;
}

const { createDialog } = useDialog();
const { t } = useI18n();
const props = defineProps<PageAdminGuestsProps>();
const { data: guests, pending: isLoading } = useFirestoreCollection<GuestDoc>(
    getGuestsPath(props.organisationId),
    {
        wait: true,
    },
);
const { properties } = storeToRefs(usePropertiesStore());

watch(
    () => isLoading.value,
    function () {
        if (isLoading.value) {
            Loading.show();
        } else {
            Loading.hide();
        }
    },
);

const searchQuery = ref<string>("");

const guestsWithSummaries = computed(function () {
    if (!guests.value) {
        return [];
    }

    return guests.value.map((guest) => ({
        ...guest,
        id: guest.id,
        summary: guestReservationsSummary(guest),
    }));
});

const sortedGuests = computed(() => {
    if (!guestsWithSummaries.value) {
        return [];
    }
    return [...guestsWithSummaries.value].sort((a, b) => {
        const aReservations = getGuestVisitsCount(a);
        const bReservations = getGuestVisitsCount(b);
        // Sort in descending order
        return bReservations - aReservations;
    });
});

const filteredGuests = computed(() => {
    if (!searchQuery.value?.trim()) {
        return sortedGuests.value;
    }
    const query = searchQuery.value.trim().toLowerCase();
    return sortedGuests.value.filter((guest) => {
        return (
            guest.name.toLowerCase().includes(query) || guest.contact.toLowerCase().includes(query)
        );
    });
});

function getReservationColor(summary: Summary): string {
    const percentage = Number.parseFloat(summary.visitPercentage);
    if (percentage >= 75) {
        return "green";
    }

    if (percentage >= 50) {
        return "orange";
    }

    return "red";
}

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

type Summary = {
    propertyName: string;
    totalReservations: number;
    fulfilledVisits: number;
    visitPercentage: string;
};

function guestReservationsSummary(guest: GuestDoc): Summary[] | undefined {
    if (Object.keys(guest.visitedProperties).length === 0) {
        return undefined;
    }

    const summaries = Object.entries(guest.visitedProperties).map(([propertyId, events]) => {
        const property = properties.value.find(matchesProperty("id", propertyId));
        if (!property) {
            return "";
        }

        // Total reservations: count of non-null events
        const totalReservations = Object.values(events).filter(
            (event): event is Visit => event !== null,
        ).length;

        // Fulfilled visits: arrived and not canceled
        const fulfilledVisits = Object.values(events).filter(
            (event): event is Visit => event !== null && event.arrived && !event.cancelled,
        ).length;

        // Calculate visit percentage
        const visitPercentage =
            totalReservations > 0
                ? ((fulfilledVisits / totalReservations) * 100).toFixed(2)
                : "0.00";

        return {
            propertyName: property.name,
            totalReservations,
            fulfilledVisits,
            visitPercentage,
        };
    });

    return summaries.filter(Boolean) as Summary[];
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
                <FTBtn
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="showCreateGuestDialog"
                    aria-label="Add new guest"
                />
            </template>
        </FTTitle>

        <!-- Search Input -->
        <div class="q-mb-md">
            <q-input
                :dense="isMobile"
                standout
                rounded
                v-model="searchQuery"
                debounce="300"
                placeholder="Search by name or contact"
                clearable
                clear-icon="close"
                label="Search guests"
            >
                <template #prepend>
                    <q-icon name="search" />
                </template>
            </q-input>
        </div>

        <!-- Guest List -->
        <q-virtual-scroll
            style="max-height: 75vh"
            :items="filteredGuests"
            v-if="filteredGuests.length > 0 && !isLoading"
            v-slot="{ item, index }"
        >
            <q-item
                :key="index"
                clickable
                :to="{
                    name: 'adminGuest',
                    params: {
                        organisationId: props.organisationId,
                        guestId: item.id,
                    },
                }"
            >
                <q-item-section>
                    <q-item-label>
                        <div class="row">
                            <span>{{ item.name }}</span>
                            <q-space />
                            <span class="text-grey-6" v-if="item.maskedContact">{{
                                item.maskedContact
                            }}</span>
                        </div>
                    </q-item-label>
                    <q-item-label caption>
                        <div v-if="item.summary" v-for="summary in item.summary" class="full-width">
                            <span>{{ summary.propertyName }}</span
                            >:
                            <q-chip text-color="white" color="tertiary" size="sm"
                                >Bookings: {{ summary.totalReservations }}</q-chip
                            >
                            <q-chip size="sm"> Arrived: {{ summary.fulfilledVisits }} </q-chip>
                            <q-chip :color="getReservationColor(summary)" size="sm"
                                >{{ summary.visitPercentage }}%</q-chip
                            >
                        </div>
                        <span v-else>No bookings</span>
                    </q-item-label>
                </q-item-section>
            </q-item>
        </q-virtual-scroll>

        <FTCenteredText v-if="!isLoading && filteredGuests.length === 0">{{
            t("PageAdminGuests.noGuestsData")
        }}</FTCenteredText>
    </div>
</template>
