<script setup lang="ts">
import type { CreateGuestPayload } from "@firetable/types";
import { createGuest } from "@firetable/backend";
import { useI18n } from "vue-i18n";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { storeToRefs } from "pinia";
import { useDialog } from "src/composables/useDialog";
import { computed, onUnmounted, ref, watch } from "vue";
import { isMobile } from "src/global-reactives/screen-detection";
import { Loading, useQuasar } from "quasar";
import { useAuthStore } from "src/stores/auth-store";
import { useGuestsStore } from "src/stores/guests-store";

import AddNewGuestForm from "src/components/admin/guest/AddNewGuestForm.vue";
import FTTitle from "src/components/FTTitle.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTBtn from "src/components/FTBtn.vue";
import GuestSummaryChips from "src/components/guest/GuestSummaryChips.vue";

export interface PageAdminGuestsProps {
    organisationId: string;
}

type SortOption =
    /**
     * When sorting by bookings try to prioritize guests with most bookings and then guests with the highest percentage of fulfilled visits.
     */
    | "bookings"
    /**
     * When sorting by percentage try to prioritize guests with most percentage of fulfilled bookings and then guests with the highest number of bookings.
     */
    | "percentage";

type SortDirection = "asc" | "desc";

const sortOption = ref<SortOption>("bookings");
const sortDirection = ref<SortDirection>("desc");
const sortOptions = [
    { label: "Bookings", value: "bookings" },
    { label: "Percentage", value: "percentage" },
] as const;

const { createDialog } = useDialog();
const { t } = useI18n();
const quasar = useQuasar();
const props = defineProps<PageAdminGuestsProps>();
const guestsStore = useGuestsStore();
const guestsRef = guestsStore.getGuests(props.organisationId);
const guests = computed(() => guestsRef.value.data);
const isLoading = computed(() => guestsRef.value.pending);
const { isAdmin } = storeToRefs(useAuthStore());

watch(
    () => isLoading.value,
    function () {
        if (isLoading.value) {
            Loading.show();
        } else {
            Loading.hide();
        }
    },
    { immediate: true },
);

onUnmounted(() => {
    Loading.hide();
});

const searchQuery = ref<string>("");

const guestsWithSummaries = computed(function () {
    if (!guests.value) {
        return [];
    }

    return guests.value
        .map(function (guest) {
            const summaries = guestsStore.guestReservationsSummary(guest);
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
    return [...guestsWithSummaries.value].sort(function (a, b) {
        let comparison: number;

        if (sortOption.value === "bookings") {
            // First compare by total reservations
            if (b.totalReservations === a.totalReservations) {
                // If total reservations are equal, sort by percentage
                comparison =
                    Number.parseFloat(b.overallPercentage) - Number.parseFloat(a.overallPercentage);
            } else {
                comparison = b.totalReservations - a.totalReservations;
            }
        } else {
            // percentage
            // First compare by percentage
            const percentageDiff =
                Number.parseFloat(b.overallPercentage) - Number.parseFloat(a.overallPercentage);
            if (percentageDiff === 0) {
                // If percentages are equal, sort by total reservations
                comparison = b.totalReservations - a.totalReservations;
            } else {
                comparison = percentageDiff;
            }
        }

        // Apply sort direction
        return sortDirection.value === "asc" ? -comparison : comparison;
    });
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
    if (isLoading.value) {
        return t("PageAdminGuests.title");
    }
    return `${t("PageAdminGuests.title")} (${guestsWithSummaries.value.length})`;
});

function showBottomSheet(): void {
    quasar
        .bottomSheet({
            class: "ft-card",
            persistent: false,
            actions: [
                {
                    label: "Sort by",
                    classes: "text-weight-bolder",
                },
                ...sortOptions.map((option) => ({
                    label: option.label,
                    icon: sortOption.value === option.value ? "check" : "",
                    value: option.value,
                    classes: "text-weight-regular",
                })),

                {},
                {
                    label: "Direction",
                    classes: "text-weight-bolder",
                },
                {
                    label: sortDirection.value === "desc" ? "Descending" : "Ascending",
                    icon: sortDirection.value === "desc" ? "arrow-sort-down" : "arrow-sort-up",
                    // Use a special value for direction toggle
                    value: "toggle-direction",
                    classes: "text-weight-regular",
                },
            ],
        })
        .onOk(function (action) {
            if (action.value === "toggle-direction") {
                toggleSortDirection();
            } else if (action.value) {
                setSortOption(action.value as SortOption);
            }
        });
}

function setSortOption(option: SortOption): void {
    sortOption.value = option;
}

function toggleSortDirection(): void {
    sortDirection.value = sortDirection.value === "desc" ? "asc" : "desc";
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
</script>

<template>
    <div class="PageAdminGuests">
        <FTTitle :title="pageTitle">
            <template #right>
                <FTBtn
                    v-if="!isLoading"
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
            clearable
            clear-icon="close"
            label="Search by name or contact"
            class="q-mb-sm"
        >
            <template #prepend>
                <q-icon name="search" />
            </template>
            <template #append>
                <!-- Sort Controls -->
                <q-btn
                    dense
                    flat
                    icon="filter"
                    aria-label="filter guests"
                    @click="showBottomSheet"
                />
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
                                <GuestSummaryChips :summary="summary" />
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
