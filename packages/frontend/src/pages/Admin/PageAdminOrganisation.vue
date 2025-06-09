<script setup lang="ts">
import FTBtn from "src/components/FTBtn.vue";
import FTCard from "src/components/FTCard.vue";
import FTTitle from "src/components/FTTitle.vue";
import { deleteOrganisation } from "src/db";
import {
    formatOrganisationStatus,
    getOrganisationStatusColor,
} from "src/helpers/organisation/organisation";
import { showDeleteConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useGlobalStore } from "src/stores/global";
import { usePropertiesStore } from "src/stores/properties-store";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

export interface PageAdminOrganisationProps {
    organisationId: string;
}

interface ActionCard {
    color: string;
    description: string;
    icon: string;
    route: object;
    title: string;
}

const props = defineProps<PageAdminOrganisationProps>();
const { t } = useI18n();
const globalStore = useGlobalStore();
const propertiesStore = usePropertiesStore();
const router = useRouter();

const organisation = propertiesStore.getOrganisationById(props.organisationId);

function getActionCards(): ActionCard[] {
    const params = { organisationId: props.organisationId };
    return [
        {
            color: "accent",
            description: t("PageAdminOrganisation.managePropertiesDescription"),
            icon: "fa:fas fa-home", // Updated for Vuetify
            route: { name: "adminProperties", params },
            title: t("AppDrawer.links.manageProperties"),
        },
        {
            color: "primary",
            description: t("PageAdminOrganisation.manageUsersDescription"),
            icon: "fa:fas fa-users", // Updated for Vuetify
            route: { name: "adminUsers", params },
            title: t("AppDrawer.links.manageUsers"),
        },
        {
            color: "secondary",
            description: t("PageAdminOrganisation.manageGuestsDescription"),
            icon: "fa:fas fa-user-friends", // Updated for Vuetify
            route: { name: "adminGuests", params },
            title: t("AppDrawer.links.manageGuests"),
        },
    ];
}

async function onDeleteOrganisation(): Promise<void> {
    if (!organisation) {
        return;
    }

    const shouldDeleteOrganisation = await showDeleteConfirm(
        t("PageAdminOrganisation.deleteOrganisationConfirmTitle"),
        t("PageAdminOrganisation.deleteOrganisationConfirmMessage"),
        organisation.name,
    );

    if (!shouldDeleteOrganisation) {
        return;
    }

    await tryCatchLoadingWrapper({
        async hook() {
            await deleteOrganisation(props.organisationId);
            await propertiesStore.initOrganisations();
            globalStore.notify(t("PageAdminOrganisation.organisationDeletedSuccess"), "success"); // Changed "positive" to "success"
            await router.replace({ name: "adminOrganisations" });
        },
    });
}
</script>

<template>
    <div v-if="organisation" class="organisation-detail-container">
        <!-- Header Section -->
        <FTTitle title="">
            <template #left>
                {{ t("PageAdminOrganisation.statusLabel") }}
                <v-chip
                    :color="getOrganisationStatusColor(organisation.status)"
                    text-color="white"
                    aria-label="Organisation status"
                    class="ml-2"
                >
                    {{ formatOrganisationStatus(organisation.status) }}
                </v-chip>
            </template>
            <template #right>
                <FTBtn
                    icon="fa:fas fa-trash"
                    :aria-label="t('PageAdminOrganisation.deleteOrganisationButtonAriaLabel')"
                    rounded="pill"
                    color="error"
                    @click="onDeleteOrganisation"
                />
            </template>
        </FTTitle>

        <div class="mt-4">
            <!-- Organisation Info Card -->
            <FTCard class="info-card mb-6">
                <v-card-text>
                    <v-row>
                        <v-col cols="12" md="8">
                            <div class="info-header mb-4">
                                <v-avatar color="primary" size="56">
                                    <v-icon icon="fa:fas fa-briefcase" size="32" color="white" />
                                </v-avatar>
                                <div class="info-content">
                                    <h5 class="text-h5 my-0">{{ organisation.name }}</h5>
                                    <div class="text-caption text-grey-darken-1 mt-1">
                                        {{ t("PageAdminOrganisation.organisationIdLabel") }}
                                        {{ organisation.id }}
                                    </div>
                                </div>
                            </div>
                        </v-col>
                    </v-row>
                </v-card-text>
            </FTCard>
        </div>

        <!-- Action Cards Grid -->
        <div class="action-cards-section">
            <div class="action-cards-grid">
                <FTCard
                    v-for="card in getActionCards()"
                    :key="card.title"
                    class="action-card cursor-pointer"
                    @click="router.push(card.route)"
                    link
                >
                    <v-card-text>
                        <div class="action-card-content">
                            <v-avatar :color="card.color" size="48" class="mb-4">
                                <v-icon :icon="card.icon" size="28" color="white" />
                            </v-avatar>
                            <h6 class="text-h6 my-2">{{ card.title }}</h6>
                            <p class="text-body2 text-grey-darken-1 mb-0">
                                {{ card.description }}
                            </p>
                        </div>
                    </v-card-text>
                    <v-card-actions class="d-flex justify-end pa-2">
                        <v-btn
                            variant="text"
                            :color="card.color"
                            append-icon="fa:fas fa-chevron-right"
                            class="text-none"
                        >
                            {{ t("PageAdminOrganisation.manageButtonLabel") }}
                        </v-btn>
                    </v-card-actions>
                </FTCard>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.info-card {
    .info-header {
        display: flex;
        align-items: center;
        gap: 16px;

        .info-content {
            flex: 1;
        }
    }
}

.action-cards-section {
    .action-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;

        .action-card {
            transition: all 0.3s ease;

            &:hover {
                transform: translateY(-4px);

                :deep(.ft-card) {
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

                    .v-theme--dark & {
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                    }
                }
            }

            .action-card-content {
                text-align: center;
                padding: 16px 0;
            }
        }
    }
}
</style>
