<script setup lang="ts">
import type { CreateGuestPayload } from "@firetable/types";
import type { SortDirection, SortOption } from "src/components/admin/guest/GuestSortOptions.vue";
import GuestSortOptions from "src/components/admin/guest/GuestSortOptions.vue";
import { createGuest } from "@firetable/backend";
import { useI18n } from "vue-i18n";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { storeToRefs } from "pinia";
import { useDialog } from "src/composables/useDialog";
import { computed, onUnmounted, ref, useTemplateRef, watch } from "vue";
import { isMobile } from "src/global-reactives/screen-detection";
import { Loading, QVirtualScroll } from "quasar";
import { useAuthStore } from "src/stores/auth-store";
import { useGuestsStore } from "src/stores/guests-store";
import { useLocalStorage } from "@vueuse/core";

import AddNewGuestForm from "src/components/admin/guest/AddNewGuestForm.vue";
import FTTitle from "src/components/FTTitle.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTBtn from "src/components/FTBtn.vue";
import GuestSummaryChips from "src/components/guest/GuestSummaryChips.vue";

export interface PageAdminGuestsProps {
    organisationId: string;
}

const sortOption = useLocalStorage<SortOption>("guest-list-sort-option", "bookings");
const sortDirection = useLocalStorage<SortDirection>("guest-list-sort-direction", "desc");

const { createDialog } = useDialog();
const { t } = useI18n();
const props = defineProps<PageAdminGuestsProps>();
const guestsStore = useGuestsStore();
const guestsRef = guestsStore.getGuests(props.organisationId);
const sortDialog = ref(false);
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

        switch (sortOption.value) {
            case "lastModified":
                {
                    // Use 0 as default if lastModified is not set
                    const aTime = a.lastModified || 0;
                    const bTime = b.lastModified || 0;
                    comparison = bTime - aTime;
                }
                break;

            case "bookings":
                // Existing bookings logic
                if (b.totalReservations === a.totalReservations) {
                    comparison =
                        Number.parseFloat(b.overallPercentage) -
                        Number.parseFloat(a.overallPercentage);
                } else {
                    comparison = b.totalReservations - a.totalReservations;
                }
                break;

            case "percentage":
                {
                    const percentageDiff =
                        Number.parseFloat(b.overallPercentage) -
                        Number.parseFloat(a.overallPercentage);
                    if (percentageDiff === 0) {
                        comparison = b.totalReservations - a.totalReservations;
                    } else {
                        comparison = percentageDiff;
                    }
                }
                break;

            default:
                comparison = 0;
        }

        return sortDirection.value === "asc" ? -comparison : comparison;
    });
});

const selectedTags = useLocalStorage<string[]>("guest-list-selected-tags", []);

const availableTags = computed(() => {
    const tagSet = new Set<string>();
    guests.value?.forEach((guest) => {
        if (guest.tags?.length) {
            guest.tags.forEach((tag) => tagSet.add(tag.toLowerCase()));
        }
    });
    return Array.from(tagSet).sort();
});

const filteredGuests = computed(function () {
    let filtered = sortedGuests.value;

    // Apply search filter
    if (searchQuery.value?.trim()) {
        const query = searchQuery.value.trim().toLowerCase();
        filtered = filtered.filter(
            (guest) =>
                guest.name.toLowerCase().includes(query) ||
                guest.contact.toLowerCase().includes(query),
        );
    }

    // Apply tag filter
    if (selectedTags.value.length > 0) {
        filtered = filtered.filter((guest) => {
            if (!guest.tags) return false;
            const guestTagsLower = guest.tags.map((tag) => tag.toLowerCase());
            return selectedTags.value.every((tag) => guestTagsLower.includes(tag.toLowerCase()));
        });
    }

    return filtered;
});

const pageTitle = computed(function () {
    if (isLoading.value) {
        return t("PageAdminGuests.title");
    }
    return `${t("PageAdminGuests.title")} (${guestsWithSummaries.value.length})`;
});

function showSortDialog(): void {
    sortDialog.value = true;
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

const virtualListRef = useTemplateRef<QVirtualScroll>("virtualListRef");
const showScrollButton = ref(false);
const lastGuestIndex = computed(() => filteredGuests.value.length - 1);

function onVirtualScroll({
    index,
}: Parameters<NonNullable<QVirtualScroll["onVirtualScroll"]>>[0]): void {
    const scrollPercentage = index / filteredGuests.value.length;
    showScrollButton.value = scrollPercentage > 0.1 && scrollPercentage < 0.9;
}

function scrollToBottom(): void {
    virtualListRef.value?.scrollTo(lastGuestIndex.value, "end");
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
                    @click="showSortDialog"
                />
            </template>
        </q-input>

        <!-- Guest List -->
        <q-virtual-scroll
            style="max-height: 75vh"
            :items="filteredGuests"
            v-if="filteredGuests.length > 0 && !isLoading"
            v-slot="{ item }"
            ref="virtualListRef"
            @virtual-scroll="onVirtualScroll"
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

        <q-dialog v-model="sortDialog" position="bottom">
            <GuestSortOptions
                :current-sort-option="sortOption"
                :current-sort-direction="sortDirection"
                :available-tags="availableTags"
                :selected-tags="selectedTags"
                @close="sortDialog = false"
                @update:sort-option="setSortOption"
                @update:selected-tags="selectedTags = $event"
                @toggle-direction="toggleSortDirection"
            />
        </q-dialog>

        <q-page-sticky
            v-if="showScrollButton"
            position="bottom"
            :offset="[18, 18]"
            class="scroll-to-bottom"
        >
            <q-btn @click="scrollToBottom" fab icon="chevron_down" color="secondary" />
        </q-page-sticky>
    </div>
</template>

<style lang="scss">
.scroll-to-bottom {
    z-index: 999999;
}
</style>
