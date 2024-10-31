<script setup lang="ts">
import type { CreateGuestPayload, GuestDoc, Visit } from "@firetable/types";
import { formatEventDate, getDefaultTimezone } from "src/helpers/date-utils";
import { useFirestoreDocument } from "src/composables/useFirestore";
import { deleteGuest, getGuestPath, updateGuestInfo } from "@firetable/backend";
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { usePropertiesStore } from "src/stores/properties-store";
import { showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { matchesProperty } from "es-toolkit/compat";
import { useDialog } from "src/composables/useDialog";
import { useGuestsStore } from "src/stores/guests-store";
import { useAuthStore } from "src/stores/auth-store";

import FTTitle from "src/components/FTTitle.vue";
import FTTabs from "src/components/FTTabs.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTTabPanels from "src/components/FTTabPanels.vue";
import FTDialog from "src/components/FTDialog.vue";
import AddNewGuestForm from "src/components/admin/guest/AddNewGuestForm.vue";
import FTBtn from "src/components/FTBtn.vue";
import AdminGuestVisitsTimeline from "src/components/admin/guest/AdminGuestVisitsTimeline.vue";

export interface PageAdminGuestProps {
    organisationId: string;
    guestId: string;
}

interface VisitsByProperty {
    [propertyId: string]: {
        name: string;
        visits: Visit[];
    };
}
const router = useRouter();
const { createDialog } = useDialog();
const guestsStore = useGuestsStore();
const propertiesStore = usePropertiesStore();
const { isAdmin } = storeToRefs(useAuthStore());
const { properties } = storeToRefs(propertiesStore);
const { t, locale } = useI18n();
const { organisationId, guestId } = defineProps<PageAdminGuestProps>();
const { data: guest } = useFirestoreDocument<GuestDoc>(getGuestPath(organisationId, guestId));

const tab = ref("");
const propertiesVisits = computed(function () {
    const visitsByProperty: VisitsByProperty = {};
    for (const [propertyId, events] of Object.entries(guest.value?.visitedProperties ?? {})) {
        const propertyData = properties.value.find(matchesProperty("id", propertyId));
        if (!propertyData) {
            continue;
        }

        const sortedVisits = (Object.values(events || {}).filter(Boolean) as Visit[]).sort(
            function (a, b) {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            },
        );

        if (sortedVisits.length > 0) {
            visitsByProperty[propertyId] = {
                name: propertyData.name,
                visits: sortedVisits,
            };
        }
    }
    return visitsByProperty;
});

const singlePropertyVisits = computed(() => {
    const propertiesKeys = Object.keys(propertiesVisits.value);
    if (propertiesKeys.length === 1) {
        const singleProperty = propertiesVisits.value[propertiesKeys[0]];
        return singleProperty.visits;
    }
    return [];
});

watch(
    propertiesVisits,
    function (newVisits) {
        if (Object.keys(newVisits).length > 0) {
            tab.value = Object.keys(newVisits)[0];
        }
    },
    { immediate: true },
);

async function editGuest(guestVal: GuestDoc): Promise<void> {
    const shouldEdit = await showConfirm(
        t("PageAdminGuest.editGuestConfirmMsg", {
            name: guestVal.name,
        }),
    );
    if (!shouldEdit) {
        return;
    }

    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: AddNewGuestForm,
            componentPropsObject: {
                mode: "edit",
                initialData: guestVal,
            },
            maximized: false,
            title: t("PageAdminGuest.editGuestDialogTitle", {
                name: guestVal.name,
            }),
            listeners: {
                update(updatedData: CreateGuestPayload) {
                    dialog.hide();
                    return tryCatchLoadingWrapper({
                        async hook() {
                            await updateGuestInfo(organisationId, guestId, updatedData);
                            guestsStore.invalidateGuestCache(guestId);
                        },
                    });
                },
            },
        },
    });
}

async function onDeleteGuest(): Promise<void> {
    const shouldDelete = await showConfirm(
        t("PageAdminGuest.deleteGuestConfirmTitle"),
        t("PageAdminGuest.deleteGuestConfirmMessage"),
    );
    if (!shouldDelete) {
        return;
    }

    return tryCatchLoadingWrapper({
        async hook() {
            await deleteGuest(organisationId, guestId);
            guestsStore.invalidateGuestCache(guestId);
            router.back();
        },
    });
}
</script>

<template>
    <div class="PageAdminGuest">
        <div v-if="guest">
            <FTTitle :title="guest.name" :subtitle="guest.contact">
                <template #right>
                    <FTBtn
                        class="q-mr-sm"
                        rounded
                        icon="pencil"
                        color="secondary"
                        @click="editGuest(guest)"
                        aria-label="Edit guest"
                    />
                    <FTBtn
                        rounded
                        icon="trash"
                        color="negative"
                        @click="onDeleteGuest()"
                        aria-label="Delete guest"
                    />
                </template>
            </FTTitle>

            <div class="q-mb-sm q-ml-sm" v-if="guest.lastModified && isAdmin">
                <span class="text-caption"
                    >Last modified:
                    {{ formatEventDate(guest.lastModified, locale, getDefaultTimezone()) }}</span
                >
            </div>

            <div v-if="Object.keys(propertiesVisits).length > 0">
                <!-- Check if there are multiple properties -->
                <template v-if="Object.keys(propertiesVisits).length > 1">
                    <FTTabs v-model="tab">
                        <q-tab
                            v-for="(item, propertyId) in propertiesVisits"
                            :key="propertyId"
                            :name="propertyId"
                            :label="item.name"
                        />
                    </FTTabs>

                    <FTTabPanels v-model="tab">
                        <q-tab-panel
                            v-for="(item, propertyId) in propertiesVisits"
                            :key="propertyId"
                            :name="propertyId"
                        >
                            <AdminGuestVisitsTimeline
                                :timezone="
                                    propertiesStore.getPropertySettingsById(String(propertyId))
                                        .timezone
                                "
                                :visits="item.visits"
                            />
                        </q-tab-panel>
                    </FTTabPanels>
                </template>

                <!-- Single Property: Directly show the visits without tabs -->
                <template v-else>
                    <AdminGuestVisitsTimeline
                        :timezone="
                            propertiesStore.getPropertySettingsById(
                                Object.keys(guest.visitedProperties)[0],
                            ).timezone
                        "
                        :visits="singlePropertyVisits"
                    />
                </template>
            </div>

            <FTCenteredText v-else>{{ t("PageAdminGuest.noVisitsMessage") }}</FTCenteredText>
        </div>
    </div>
</template>
