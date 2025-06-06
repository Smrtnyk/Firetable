<script setup lang="ts">
import type { CreateOrganisationPayload } from "src/db";

import { storeToRefs } from "pinia";
import { useQuasar } from "quasar";
import AddNewOrganisationForm from "src/components/admin/organisation/AddNewOrganisationForm.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCard from "src/components/FTCard.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTTitle from "src/components/FTTitle.vue";
import { useDialog } from "src/composables/useDialog";
import { createNewOrganisation } from "src/db";
import { isDark } from "src/global-reactives/is-dark";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

const quasar = useQuasar();
const router = useRouter();
const { createDialog } = useDialog();
const searchQuery = ref("");
const { organisations } = storeToRefs(usePropertiesStore());
const propertiesStore = usePropertiesStore();

const filteredOrganisations = computed(function () {
    if (!searchQuery.value) return organisations.value;

    const query = searchQuery.value.toLowerCase();
    return organisations.value.filter(function (org) {
        return org.name.toLowerCase().includes(query);
    });
});

function createOrganisation(): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: AddNewOrganisationForm,
            componentPropsObject: {},
            listeners: {
                create(organisationPayload: CreateOrganisationPayload) {
                    onOrganisationCreate(organisationPayload);
                    dialog.hide();
                },
            },
            maximized: false,
            title: "Add new Organisation",
        },
    });
}

function navigateToOrganisation(organisationId: string): void {
    router.push({ name: "adminOrganisation", params: { organisationId } });
}

async function onOrganisationCreate(organisationPayload: CreateOrganisationPayload): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await createNewOrganisation(organisationPayload);
            quasar.notify("Organisation created successfully!");
            return propertiesStore.initOrganisations();
        },
    });
}
</script>

<template>
    <div>
        <FTTitle title="Organisations">
            <template #right>
                <FTBtn
                    rounded
                    icon="fa fa-plus"
                    class="button-gradient"
                    @click="createOrganisation"
                />
            </template>
        </FTTitle>

        <!-- Search Bar -->
        <div class="search-section q-mb-lg" v-if="organisations.length > 0">
            <q-input
                v-model="searchQuery"
                outlined
                dense
                placeholder="Search organisations..."
                class="search-input"
            >
                <template v-slot:prepend>
                    <q-icon name="fa fa-search" />
                </template>
                <template v-slot:append v-if="searchQuery">
                    <q-icon name="fa fa-close" class="cursor-pointer" @click="searchQuery = ''" />
                </template>
            </q-input>
        </div>

        <!-- Organisation Cards Grid -->
        <div class="organisations-grid" v-if="filteredOrganisations.length > 0">
            <FTCard
                v-for="organisation in filteredOrganisations"
                :key="organisation.id"
                class="organisation-card"
            >
                <!-- Card Header -->
                <q-card-section
                    class="card-header q-pa-md"
                    @click="navigateToOrganisation(organisation.id)"
                >
                    <div class="header-content">
                        <q-avatar
                            :color="isDark ? 'primary' : 'primary'"
                            text-color="white"
                            size="40px"
                            class="org-avatar"
                        >
                            <q-icon name="fa fa-briefcase" size="24px" />
                        </q-avatar>
                        <div class="org-info">
                            <h6 class="org-name text-h6 q-my-none">{{ organisation.name }}</h6>
                            <div class="text-caption text-grey">
                                Organisation ID: {{ organisation.id.slice(0, 8) }}...
                            </div>
                        </div>
                    </div>
                </q-card-section>
            </FTCard>
        </div>

        <!-- Empty State -->
        <FTCenteredText v-if="organisations.length === 0">
            <q-icon name="fa fa-briefcase" size="64px" color="grey-5" class="q-mb-md" />
            <div class="text-grey-6 q-mb-lg">Create your first organisation to get started</div>
            <FTBtn
                label="Create Organisation"
                icon="fa fa-plus"
                class="button-gradient"
                @click="createOrganisation"
            />
        </FTCenteredText>

        <!-- No Search Results -->
        <FTCenteredText v-if="organisations.length > 0 && filteredOrganisations.length === 0">
            <q-icon
                name="fa fa-magnifying-glass-minus"
                size="64px"
                color="grey-5"
                class="q-mb-md"
            />
            <div class="text-h6 q-mb-sm">No organisations found</div>
            <div class="text-grey-6">Try adjusting your search criteria</div>
        </FTCenteredText>
    </div>
</template>

<style scoped lang="scss">
.organisations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 24px;

    @media (max-width: 599px) {
        grid-template-columns: 1fr;
        gap: 16px;
    }
}

.organisation-card {
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-2px);
    }

    .card-header {
        position: relative;

        .header-content {
            display: flex;
            align-items: center;
            gap: 16px;

            .org-avatar {
                flex-shrink: 0;
            }

            .org-info {
                flex: 1;
                min-width: 0;

                .org-name {
                    font-weight: 600;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }
        }
    }
}
</style>
