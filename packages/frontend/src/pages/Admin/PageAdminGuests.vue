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
import { useAuthStore } from "src/stores/auth-store";

import AddNewGuestForm from "src/components/admin/guest/AddNewGuestForm.vue";
import FTTitle from "src/components/FTTitle.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTBtn from "src/components/FTBtn.vue";

export interface PageAdminGuestsProps {
    organisationId: string;
}

type SortOption = "bookings" | "percentage";

type Summary = {
    propertyId: string;
    propertyName: string;
    totalReservations: number;
    fulfilledVisits: number;
    visitPercentage: string;
};

const sortOption = ref<SortOption>("bookings");
const sortOptions = [
    { label: "Sort by Bookings", value: "bookings" },
    { label: "Sort by Percentage", value: "percentage" },
] as const;

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
const { nonNullableUser, isAdmin } = storeToRefs(useAuthStore());

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

    return guests.value
        .map(function (guest) {
            const summaries = guestReservationsSummary(guest);
            let totalReservations = 0;
            let fulfilledVisits = 0;

            if (summaries && summaries.length > 0) {
                summaries.forEach(function (summary) {
                    totalReservations += summary.totalReservations;
                    fulfilledVisits += summary.fulfilledVisits;
                });
            }

            const overallPercentage =
                totalReservations > 0
                    ? ((fulfilledVisits / totalReservations) * 100).toFixed(2)
                    : "0.00";

            return {
                ...guest,
                id: guest.id,
                summary: summaries,
                totalReservations,
                fulfilledVisits,
                overallPercentage,
            };
        })
        .filter(function (guest) {
            // Admin sees all guests
            if (isAdmin.value) {
                return true;
            }
            // Non-admins: only include guests with summaries (i.e., visits to accessible properties)
            return guest.summary && guest.summary.length > 0;
        });
});

const sortedGuests = computed(function () {
    const guestsWithRes = guestsWithSummaries.value.filter(function (guest) {
        return guest.totalReservations > 0;
    });
    const guestsWithoutRes = guestsWithSummaries.value.filter(function (guest) {
        return guest.totalReservations === 0;
    });

    if (sortOption.value === "bookings") {
        guestsWithRes.sort(function (a, b) {
            return b.totalReservations - a.totalReservations;
        });
    }

    if (sortOption.value === "percentage") {
        guestsWithRes.sort(function (a, b) {
            return Number.parseFloat(b.overallPercentage) - Number.parseFloat(a.overallPercentage);
        });
    }

    // Append guests without reservations at the end
    return [...guestsWithRes, ...guestsWithoutRes];
});

const filteredGuests = computed(function () {
    if (!searchQuery.value?.trim()) {
        return sortedGuests.value;
    }
    const query = searchQuery.value.trim().toLowerCase();
    return sortedGuests.value.filter(function (guest) {
        return (
            guest.name.toLowerCase().includes(query) || guest.contact.toLowerCase().includes(query)
        );
    });
});

const pageTitle = computed(function () {
    return `${t("PageAdminGuests.title")} (${guestsWithSummaries.value.length})`;
});

function setSortOption(option: SortOption): void {
    sortOption.value = option;
}

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

function guestReservationsSummary(guest: GuestDoc): Summary[] | undefined {
    if (Object.keys(guest.visitedProperties).length === 0) {
        return undefined;
    }

    const summaries = Object.entries(guest.visitedProperties)
        .filter(function ([propertyId]) {
            // Admins see all properties
            if (isAdmin.value) {
                return true;
            }
            // Non-admins only see properties in their relatedProperties
            return nonNullableUser.value.relatedProperties.includes(propertyId);
        })
        .map(function ([propertyId, events]) {
            const property = properties.value.find(matchesProperty("id", propertyId));
            if (!property) {
                return null;
            }

            // Total reservations: count of non-null events
            const totalReservations = Object.values(events).filter(
                function (event): event is Visit {
                    return event !== null;
                },
            ).length;

            // Fulfilled visits: arrived and not canceled
            const fulfilledVisits = Object.values(events).filter(function (event): event is Visit {
                return event !== null && event.arrived && !event.cancelled;
            }).length;

            // Calculate visit percentage
            const visitPercentage =
                totalReservations > 0
                    ? ((fulfilledVisits / totalReservations) * 100).toFixed(2)
                    : "0.00";

            return {
                propertyId: property.id,
                propertyName: property.name,
                totalReservations,
                fulfilledVisits,
                visitPercentage,
            };
        });

    return summaries.filter(Boolean) as Summary[];
}
</script>

<template>
    <div class="PageAdminGuests">
        <FTTitle :title="pageTitle">
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

        <!-- Search Input and Sort Options Container -->
        <q-input
            v-if="guestsWithSummaries.length > 0 && !isLoading"
            :dense="isMobile"
            standout
            rounded
            v-model="searchQuery"
            debounce="300"
            placeholder="Search by name or contact"
            clearable
            clear-icon="close"
            label="Search guests"
            class="q-mb-sm"
        >
            <template #prepend>
                <q-icon name="search" />
            </template>
            <template #append>
                <!-- Sort Select -->
                <q-btn dense flat icon="filter">
                    <q-menu auto-close>
                        <q-list>
                            <q-item
                                clickable
                                v-for="option in sortOptions"
                                :key="option.value"
                                @click="setSortOption(option.value)"
                            >
                                <q-item-section>
                                    {{ option.label }}
                                </q-item-section>
                                <q-item-section side>
                                    <q-icon
                                        v-if="sortOption === option.value"
                                        name="check"
                                        color="primary"
                                    />
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </q-menu>
                </q-btn>
            </template>
        </q-input>

        <!-- Guest List -->
        <q-virtual-scroll
            style="max-height: 75vh"
            :items="filteredGuests"
            v-if="filteredGuests.length > 0 && !isLoading"
            v-slot="{ item }"
        >
            <q-item
                :key="item.id"
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
                        <template v-if="item.summary">
                            <div
                                v-for="summary in item.summary"
                                :key="summary.propertyName"
                                class="full-width"
                            >
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
                        </template>
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
