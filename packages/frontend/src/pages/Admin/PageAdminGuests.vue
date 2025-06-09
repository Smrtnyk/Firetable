<script setup lang="ts">
import type { CreateGuestPayload } from "@firetable/types";
import type { SortDirection, SortOption } from "src/components/admin/guest/GuestSortOptions.vue";

import { useLocalStorage } from "@vueuse/core";
import { lowerCase, uniq } from "es-toolkit";
import { property } from "es-toolkit/compat";
import { storeToRefs } from "pinia";
import AddNewGuestForm from "src/components/admin/guest/AddNewGuestForm.vue";
import GuestSortOptions from "src/components/admin/guest/GuestSortOptions.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTTitle from "src/components/FTTitle.vue";
import GuestSummaryChips from "src/components/guest/GuestSummaryChips.vue";
import { globalBottomSheet } from "src/composables/useBottomSheet";
import { globalDialog } from "src/composables/useDialog";
import { batchDeleteGuests, createGuest } from "src/db";
import { useScreenDetection } from "src/global-reactives/screen-detection";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { useGlobalStore } from "src/stores/global-store";
import { useGuestsStore } from "src/stores/guests-store";
import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    onUnmounted,
    ref,
    useTemplateRef,
    watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

export interface PageAdminGuestsProps {
    organisationId: string;
}

const LONG_PRESS_DURATION = 2000;
const SCROLL_VISIBILITY_THRESHOLD_MIN = 0.1;
const SCROLL_VISIBILITY_THRESHOLD_MAX = 0.9;

const { isMobile } = useScreenDetection();
const sortOption = useLocalStorage<SortOption>("guest-list-sort-option", "bookings");
const sortDirection = useLocalStorage<SortDirection>("guest-list-sort-direction", "desc");

const { t } = useI18n();
const props = defineProps<PageAdminGuestsProps>();
const globalStore = useGlobalStore();
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
            globalStore.setLoading(true);
        } else {
            globalStore.setLoading(false);
        }
    },
    { immediate: true },
);

onUnmounted(() => {
    globalStore.setLoading(false);
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
            if (isAdmin.value) {
                return true;
            }
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
    const dialog = globalDialog.openDialog(
        AddNewGuestForm,
        {
            onCreate(payload: CreateGuestPayload) {
                dialog.hide();

                tryCatchLoadingWrapper({
                    hook() {
                        return createGuest(props.organisationId, payload);
                    },
                });
            },
        },
        {
            title: t("PageAdminGuests.createNewGuestDialogTitle"),
        },
    );
}

function showSortDialog(): void {
    globalBottomSheet.openBottomSheet(GuestSortOptions, {
        availableTags,
        currentSortDirection: sortDirection,
        currentSortOption: sortOption,
        onToggleDirection() {
            toggleSortDirection();
        },
        // @ts-expect-error -- FIXME: use proper types for payload
        "onUpdate:selectedTags"(payload) {
            selectedTags.value = payload;
        },
        // @ts-expect-error -- FIXME: use proper types for payload
        "onUpdate:sortOption"(payload) {
            setSortOption(payload);
        },
        selectedTags,
    });
}

function toggleSortDirection(): void {
    sortDirection.value = sortDirection.value === "desc" ? "asc" : "desc";
}

const virtualListRef = useTemplateRef("virtualListRef");
const showScrollButton = ref(false);
const scrollDirection = ref<"down" | "up">("down");
const lastScrollTop = ref(0);

function handleScroll(): void {
    const container = virtualListRef.value?.$el;
    if (!container) return;

    if (scrollDirection.value === "down") {
        container.scrollTop = container.scrollHeight;
    } else {
        container.scrollTop = 0;
    }
}

function handleVirtualScroll(event: Event): void {
    const container = event.target as HTMLElement;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Calculate scroll percentage
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);

    // Determine scroll direction
    scrollDirection.value = scrollTop > lastScrollTop.value ? "down" : "up";
    lastScrollTop.value = scrollTop;

    // Show button only when scrolled between 10% and 90%
    showScrollButton.value =
        scrollPercentage > SCROLL_VISIBILITY_THRESHOLD_MIN &&
        scrollPercentage < SCROLL_VISIBILITY_THRESHOLD_MAX;
}

function setupScrollListener(): void {
    nextTick(() => {
        const container = virtualListRef.value?.$el;
        if (!container) return;

        container.addEventListener("scroll", handleVirtualScroll);
    });
}

// Setup scroll listener when component is mounted
onMounted(() => {
    setupScrollListener();
});

// Cleanup scroll listener
onBeforeUnmount(() => {
    const container = virtualListRef.value?.$el;
    if (container) {
        container.removeEventListener("scroll", handleVirtualScroll);
    }
});

// Re-setup listener when filtered guests change
watch(filteredGuests, () => {
    nextTick(() => {
        setupScrollListener();
    });
});

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
    const shouldDelete = await globalDialog.confirm({
        message: "",
        title: `Are you sure you want to delete ${selectedGuests.value.length} guests?`,
    });
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

let longPressTimer: null | ReturnType<typeof setTimeout> = null;

// FIXME: does vueuse providee helper for this? also fix this any
function handleMouseDown(item: any): void {
    longPressTimer = setTimeout(() => {
        onItemHold(item);
    }, LONG_PRESS_DURATION);
}

function handleMouseUp(): void {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
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
                    color="primary"
                    @click="showCreateGuestDialog"
                    aria-label="Add new guest"
                />
            </template>
        </FTTitle>

        <!-- Search Input and Sort Options Container -->
        <v-text-field
            v-if="guestsWithSummaries.length > 0 && !isLoading"
            :density="isMobile ? 'compact' : 'default'"
            variant="outlined"
            v-model="searchQuery"
            clearable
            clear-icon="fa fa-close"
            label="Search by name or contact"
            class="mb-2"
            hide-details
        >
            <template #prepend-inner>
                <v-icon icon="fa fa-search" />
            </template>
            <template #append-inner>
                <!-- Sort Controls -->
                <v-btn
                    density="compact"
                    variant="text"
                    icon="fa fa-sort"
                    aria-label="filter guests"
                    @click="showSortDialog"
                />
            </template>
        </v-text-field>

        <v-expand-transition>
            <div v-show="selectionMode" class="d-flex align-center pa-2 w-100">
                <v-checkbox
                    v-model="allSelected"
                    @update:model-value="toggleSelectAll"
                    density="compact"
                    hide-details
                    class="flex-grow-0 mr-2"
                />
                <span>{{ `Selected items ${selectedGuests.length}` }}</span>
                <v-spacer />
                <v-btn
                    icon="fa fa-trash"
                    color="error"
                    variant="text"
                    class="ml-2"
                    @click="bulkDeleteSelected"
                    aria-label="Bulk delete"
                />
                <v-btn
                    icon="fa fa-close"
                    variant="text"
                    class="ml-2"
                    @click="cancelSelectionMode"
                    aria-label="Cancel bulk action"
                />
            </div>
        </v-expand-transition>

        <!-- Guest List -->
        <v-virtual-scroll
            :height="isMobile ? 'calc(75vh)' : '75vh'"
            :items="filteredGuests"
            v-if="filteredGuests.length > 0 && !isLoading"
            ref="virtualListRef"
            item-height="80"
        >
            <template #default="{ item, index }">
                <v-list-item
                    :key="item.id"
                    @click="onItemClick(item)"
                    @mousedown="handleMouseDown(item)"
                    @mouseup="handleMouseUp"
                    @mouseleave="handleMouseUp"
                    @touchstart="handleMouseDown(item)"
                    @touchend="handleMouseUp"
                    @touchcancel="handleMouseUp"
                    lines="two"
                    :ripple="!selectionMode"
                >
                    <template #prepend v-if="selectionMode">
                        <v-checkbox
                            size="small"
                            :model-value="selectedGuests.includes(item.id)"
                            @update:model-value="() => toggleGuestSelection(item.id)"
                            @click.stop
                            hide-details
                            class="mr-4"
                        />
                    </template>

                    <v-list-item-title>
                        <div class="d-flex align-center">
                            <span>{{ item.name }}</span>
                            <v-spacer />
                            <span class="text-grey" v-if="item.maskedContact">
                                {{ item.maskedContact }}
                            </span>
                        </div>
                    </v-list-item-title>

                    <v-list-item-subtitle>
                        <template v-if="item.summary">
                            <div
                                v-for="summary in item.summary"
                                :key="summary.propertyName"
                                class="w-100"
                            >
                                <span>{{ summary.propertyName }}</span
                                >:
                                <GuestSummaryChips :summary="summary" />
                            </div>
                        </template>
                        <span v-else>No bookings</span>
                    </v-list-item-subtitle>
                </v-list-item>
                <v-divider v-if="index < filteredGuests.length - 1" />
            </template>
        </v-virtual-scroll>

        <FTCenteredText v-if="!isLoading && filteredGuests.length === 0">
            {{ t("PageAdminGuests.noGuestsData") }}
        </FTCenteredText>

        <v-fab
            v-if="showScrollButton"
            @click="handleScroll"
            :icon="scrollDirection === 'down' ? 'fa fa-chevron-down' : 'fa fa-chevron-up'"
            color="secondary"
            location="bottom end"
            size="default"
            class="scroll-to-bottom"
            app
        />
    </div>
</template>

<style lang="scss">
.scroll-to-bottom {
    z-index: 999999;
}

.v-list-item {
    cursor: pointer;
}
</style>
