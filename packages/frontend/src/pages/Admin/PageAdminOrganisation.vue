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
import { useGlobalStore } from "src/stores/global-store";
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
const propertiesStore = usePropertiesStore();
const globalStore = useGlobalStore();
const router = useRouter();

const organisation = propertiesStore.getOrganisationById(props.organisationId);

function getActionCards(): ActionCard[] {
    const params = { organisationId: props.organisationId };
    return [
        {
            color: "accent",
            description: t("PageAdminOrganisation.managePropertiesDescription"),
            icon: "fas fa-home",
            route: { name: "adminProperties", params },
            title: t("AppDrawer.links.manageProperties"),
        },
        {
            color: "primary",
            description: t("PageAdminOrganisation.manageUsersDescription"),
            icon: "fas fa-users",
            route: { name: "adminUsers", params },
            title: t("AppDrawer.links.manageUsers"),
        },
        {
            color: "secondary",
            description: t("PageAdminOrganisation.manageGuestsDescription"),
            icon: "fas fa-user-friends",
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
            globalStore.notify("", t("PageAdminOrganisation.organisationDeletedSuccess"));
            await router.replace({ name: "adminOrganisations" });
        },
    });
}
</script>

<template>
    <div v-if="organisation" class="PageAdminOrganisation">
        <!-- Header Section -->
        <FTTitle title="">
            <template #left>
                {{ t("PageAdminOrganisation.statusLabel") }}
                <v-chip
                    :color="getOrganisationStatusColor(organisation.status)"
                    class="text-white"
                    :aria-label="t('PageAdminOrganisation.statusLabel')"
                >
                    {{ formatOrganisationStatus(organisation.status) }}
                </v-chip>
            </template>
            <template #right>
                <FTBtn
                    icon="fas fa-trash"
                    :aria-label="t('PageAdminOrganisation.deleteOrganisationButtonAriaLabel')"
                    color="error"
                    @click="onDeleteOrganisation"
                />
            </template>
        </FTTitle>

        <div class="PageAdminOrganisation__content">
            <!-- Organisation Info Card -->
            <FTCard class="PageAdminOrganisation__info-card mb-6">
                <v-card-text class="pa-6">
                    <v-row>
                        <v-col cols="12" md="8">
                            <div class="PageAdminOrganisation__info-header">
                                <v-avatar
                                    color="primary"
                                    size="56"
                                    class="PageAdminOrganisation__avatar"
                                >
                                    <v-icon size="32" color="white">fas fa-briefcase</v-icon>
                                </v-avatar>
                                <div class="PageAdminOrganisation__info-content">
                                    <h5 class="text-h5 mb-1">{{ organisation.name }}</h5>
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
        <div class="PageAdminOrganisation__action-cards-section">
            <div class="PageAdminOrganisation__action-cards-grid">
                <FTCard
                    v-for="card in getActionCards()"
                    :key="card.title"
                    class="PageAdminOrganisation__action-card"
                    @click="router.push(card.route)"
                >
                    <v-card-text class="pa-6">
                        <div class="PageAdminOrganisation__action-card-content">
                            <v-avatar :color="card.color" size="48" class="mb-4">
                                <v-icon :icon="card.icon" size="28" color="white" />
                            </v-avatar>
                            <h6 class="text-h6 my-2">{{ card.title }}</h6>
                            <p class="text-body-2 text-grey-darken-1 mb-0">
                                {{ card.description }}
                            </p>
                        </div>
                    </v-card-text>
                    <v-card-actions class="justify-end pa-4">
                        <v-btn
                            variant="text"
                            :color="card.color"
                            append-icon="fas fa-chevron-right"
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
@use "src/css/variables.scss" as *;

.PageAdminOrganisation {
    &__content {
        margin-bottom: 32px;
    }

    &__info-card {
        .PageAdminOrganisation__info-header {
            display: flex;
            align-items: center;
            gap: 16px;

            .PageAdminOrganisation__info-content {
                flex: 1;
            }
        }

        .PageAdminOrganisation__avatar {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
    }

    &__action-cards-section {
        .PageAdminOrganisation__action-cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;

            .PageAdminOrganisation__action-card {
                transition: all 0.3s ease;
                cursor: pointer;
                border-radius: 12px;
                overflow: hidden;

                &:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                }

                .PageAdminOrganisation__action-card-content {
                    text-align: center;
                    padding: 16px 0;
                }
            }
        }
    }
}

// Dark mode support
.v-theme--dark .PageAdminOrganisation {
    &__info-card {
        .PageAdminOrganisation__avatar {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
    }

    &__action-cards-section {
        .PageAdminOrganisation__action-cards-grid {
            .PageAdminOrganisation__action-card {
                &:hover {
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                }
            }
        }
    }
}

// Mobile responsive
@media (max-width: 768px) {
    .PageAdminOrganisation {
        &__action-cards-section {
            .PageAdminOrganisation__action-cards-grid {
                grid-template-columns: 1fr;
                gap: 16px;
            }
        }

        &__info-header {
            flex-direction: column;
            text-align: center;
            gap: 12px !important;
        }
    }
}
</style>
