<script setup lang="ts">
import type { CreateGuestPayload } from "@firetable/types";
import type { SortDirection, SortOption } from "src/components/admin/guest/GuestSortOptions.vue";

import { useLocalStorage } from "@vueuse/core";
import { lowerCase, uniq } from "es-toolkit";
import { property } from "es-toolkit/compat";
import { storeToRefs } from "pinia";
import { Loading, QVirtualScroll } from "quasar";
import AddNewGuestForm from "src/components/admin/guest/AddNewGuestForm.vue";
import GuestSortOptions from "src/components/admin/guest/GuestSortOptions.vue";
import FTBottomDialog from "src/components/FTBottomDialog.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTTitle from "src/components/FTTitle.vue";
import GuestSummaryChips from "src/components/guest/GuestSummaryChips.vue";
import { useDialog } from "src/composables/useDialog";
import { batchDeleteGuests, createGuest } from "src/db";
import { isMobile } from "src/global-reactives/screen-detection";
import { showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { useGuestsStore } from "src/stores/guests-store";
import { computed, onUnmounted, ref, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

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
const guests = computed(() => guestsRef.value.data);
const isLoading = computed(() => guestsRef.value.pending);
const { isAdmin } = storeToRefs(useAuthStore());
const router = useRouter();

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
                fulfilledVisits,
                id: guest.id,
                overallPercentage,
                summary: summaries,
                totalReservations,
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
            case "land":
                comparison = (b.maskedContact ?? "").localeCompare(a.maskedContact ?? "");
                break;

            case "lastModified":
                {
                    // Use 0 as default if lastModified is not set
                    const aTime = a.lastModified ?? 0;
                    const bTime = b.lastModified ?? 0;
                    comparison = bTime - aTime;
                }
                break;

            case "bookings":
                if (b.totalReservations === a.totalReservations) {
                    comparison =
                        Number.parseFloat(b.overallPercentage) -
                        Number.parseFloat(a.overallPercentage);
                } else {
                    comparison = b.totalReservations - a.totalReservations;
                }
                break;

            case "name":
                comparison = b.name.localeCompare(a.name);
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

const availableTags = computed(function () {
    const guestsWithTags = guests.value?.map(({ tags }) => tags ?? []) ?? [];
    return uniq(guestsWithTags.flat()).sort();
});

const filteredGuests = computed(function () {
    let filtered = sortedGuests.value;

    if (searchQuery.value?.trim()) {
        const query = searchQuery.value.trim().toLowerCase();
        filtered = filtered.filter(
            (guest) =>
                guest.name.toLowerCase().includes(query) ||
                guest.contact.toLowerCase().includes(query),
        );
    }

    if (selectedTags.value.length > 0) {
        filtered = filtered.filter(function (guest) {
            if (!guest.tags) {
                return false;
            }
            const guestTagsLower = guest.tags.map(lowerCase);
            return selectedTags.value.every(function (tag) {
                return guestTagsLower.includes(tag.toLowerCase());
            });
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

function setSortOption(option: SortOption): void {
    sortOption.value = option;
}

function showCreateGuestDialog(): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
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
            maximized: false,
            title: t("PageAdminGuests.createNewGuestDialogTitle"),
        },
    });
}

function showSortDialog(): void {
    createDialog({
        component: FTBottomDialog,
        componentProps: {
            component: GuestSortOptions,
            componentPropsObject: {
                availableTags,
                currentSortDirection: sortDirection,
                currentSortOption: sortOption,
                selectedTags,
            },
            listeners: {
                toggleDirection() {
                    toggleSortDirection();
                },
                "update:selectedTags"(payload) {
                    selectedTags.value = payload;
                },
                "update:sortOption"(payload) {
                    setSortOption(payload);
                },
            },
        },
    });
}

function toggleSortDirection(): void {
    sortDirection.value = sortDirection.value === "desc" ? "asc" : "desc";
}

const virtualListRef = useTemplateRef<QVirtualScroll>("virtualListRef");
const showScrollButton = ref(false);
const lastGuestIndex = computed(() => filteredGuests.value.length - 1);

const scrollDirection = ref<"down" | "up">("down");
const lastScrollIndex = ref(0);

function handleScroll(): void {
    if (scrollDirection.value === "down") {
        virtualListRef.value?.scrollTo(lastGuestIndex.value, "end");
    } else {
        virtualListRef.value?.scrollTo(0, "start");
    }
}

function onVirtualScroll({
    index,
}: Parameters<NonNullable<QVirtualScroll["onVirtualScroll"]>>[0]): void {
    const scrollPercentage = index / filteredGuests.value.length;

    scrollDirection.value = index > lastScrollIndex.value ? "down" : "up";
    lastScrollIndex.value = index;

    showScrollButton.value = scrollPercentage > 0.1 && scrollPercentage < 0.9;
}

const selectedGuests = ref<string[]>([]);
const selectionMode = ref(false);
const allSelected = computed(function () {
    return (
        filteredGuests.value.length > 0 &&
        filteredGuests.value.every(function ({ id }) {
            return selectedGuests.value.includes(id);
        })
    );
});

async function bulkDeleteSelected(): Promise<void> {
    if (selectedGuests.value.length === 0) {
        return;
    }
    const shouldDelete = await showConfirm(
        `Are you sure you want to delete ${selectedGuests.value.length} guests?`,
    );
    if (!shouldDelete) {
        return;
    }

    await tryCatchLoadingWrapper({
        async hook() {
            await batchDeleteGuests(props.organisationId, selectedGuests.value);
            selectedGuests.value = [];
        },
    });
}

function cancelSelectionMode(): void {
    selectionMode.value = false;
    selectedGuests.value = [];
}

function onItemClick(item: any): void {
    if (selectionMode.value) {
        toggleGuestSelection(item.id);
    } else {
        router.push({
            name: "adminGuest",
            params: {
                guestId: item.id,
                organisationId: props.organisationId,
            },
        });
    }
}

function onItemHold(item: any): void {
    if (!selectionMode.value) {
        selectionMode.value = true;
        if (!selectedGuests.value.includes(item.id)) {
            selectedGuests.value.push(item.id);
        }
    }
}

function toggleGuestSelection(id: string): void {
    const idx = selectedGuests.value.indexOf(id);
    if (idx === -1) {
        selectedGuests.value.push(id);
    } else {
        selectedGuests.value.splice(idx, 1);
    }
}

function toggleSelectAll(): void {
    if (allSelected.value) {
        selectedGuests.value = [];
    } else {
        selectedGuests.value = filteredGuests.value.map(property("id"));
    }
}
</script>

<template>
    <div class="PageAdminGuests">
        <FTTitle :title="pageTitle">
            <template #right>
                <FTBtn
                    v-if="!isLoading"
                    rounded
                    icon="fa fa-plus"
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
            outlined
            v-model="searchQuery"
            debounce="300"
            clearable
            clear-icon="fa fa-close"
            label="Search by name or contact"
            class="q-mb-sm"
        >
            <template #prepend>
                <q-icon name="fa fa-search" />
            </template>
            <template #append>
                <!-- Sort Controls -->
                <q-btn
                    dense
                    flat
                    icon="fa fa-sort"
                    aria-label="filter guests"
                    @click="showSortDialog"
                />
            </template>
        </q-input>

        <q-slide-transition>
            <div v-show="selectionMode" class="row items-center q-pa-sm full-width">
                <q-checkbox
                    v-model="allSelected"
                    @update:model-value="toggleSelectAll"
                    toggle-indeterminate
                    dense
                    class="q-mr-sm"
                />
                <span>{{ `Selected items ${selectedGuests.length}` }}</span>
                <q-space />
                <q-btn
                    icon="fa fa-trash"
                    color="negative"
                    flat
                    class="q-ml-sm"
                    @click="bulkDeleteSelected"
                    aria-label="Bulk delete"
                />
                <q-btn
                    icon="fa fa-close"
                    flat
                    class="q-ml-sm"
                    @click="cancelSelectionMode"
                    aria-label="Cancel bulk action"
                />
            </div>
        </q-slide-transition>

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
                v-touch-hold:2000.mouse="() => onItemHold(item)"
                :key="item.id"
                clickable
                @click="onItemClick(item)"
            >
                <q-item-section>
                    <q-item-label>
                        <div class="row items-center">
                            <q-checkbox
                                size="xs"
                                v-if="selectionMode"
                                class="q-mr-sm"
                                :model-value="selectedGuests.includes(item.id)"
                                @update:model-value="() => toggleGuestSelection(item.id)"
                                @click.stop
                            />
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

        <q-page-sticky
            v-if="showScrollButton"
            position="bottom"
            :offset="[18, 18]"
            class="scroll-to-bottom"
        >
            <q-btn
                @click="handleScroll"
                fab
                :icon="scrollDirection === 'down' ? 'fa fa-chevron-down' : 'fa fa-chevron-up'"
                color="secondary"
            />
        </q-page-sticky>
    </div>
</template>

<style lang="scss">
.scroll-to-bottom {
    z-index: 999999;
}
</style>
