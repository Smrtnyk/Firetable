<script setup lang="ts">
import { useQuasar } from "quasar";
import FTBtn from "src/components/FTBtn.vue";
import FTCard from "src/components/FTCard.vue";
import FTTitle from "src/components/FTTitle.vue";
import { deleteOrganisation } from "src/db";
import {
    formatOrganisationStatus,
    getOrganisationStatusColor,
} from "src/helpers/organisation/organisation";
import { showDeleteConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
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
const quasar = useQuasar();
const propertiesStore = usePropertiesStore();
const router = useRouter();

const organisation = propertiesStore.getOrganisationById(props.organisationId);

function getActionCards(): ActionCard[] {
    const params = { organisationId: props.organisationId };
    return [
        {
            color: "primary",
            description: "Add, edit, or remove users who can access this organisation",
            icon: "users",
            route: { name: "adminUsers", params },
            title: t("AppDrawer.links.manageUsers"),
        },
        {
            color: "secondary",
            description: "Manage guest access and permissions for this organisation",
            icon: "users-list",
            route: { name: "adminGuests", params },
            title: t("AppDrawer.links.manageGuests"),
        },
        {
            color: "accent",
            description: "Add, edit, or remove properties belonging to this organisation",
            icon: "home",
            route: { name: "adminProperties", params },
            title: t("AppDrawer.links.manageProperties"),
        },
    ];
}

async function onDeleteOrganisation(): Promise<void> {
    if (!organisation) {
        return;
    }

    const shouldDeleteOrganisation = await showDeleteConfirm(
        "Delete Organisation?",
        `This action cannot be undone. All users, properties, and data associated with this organisation will be permanently deleted.`,
        organisation.name,
    );

    if (!shouldDeleteOrganisation) {
        return;
    }

    await tryCatchLoadingWrapper({
        async hook() {
            await deleteOrganisation(props.organisationId);
            await propertiesStore.initOrganisations();
            quasar.notify({
                message: "Organisation deleted successfully",
                position: "top",
                type: "positive",
            });
            await router.replace({ name: "adminOrganisations" });
        },
    });
}
</script>

<template>
    <div v-if="organisation" class="organisation-detail-container">
        <!-- Header Section -->
        <FTTitle :title="organisation.name">
            <template #right>
                <q-chip
                    square
                    class="q-mr-md"
                    :color="getOrganisationStatusColor(organisation.status)"
                    text-color="white"
                >
                    {{ formatOrganisationStatus(organisation.status) }}
                </q-chip>
                <FTBtn
                    icon="trash"
                    aria-label="Delete organisation"
                    rounded
                    color="negative"
                    @click="onDeleteOrganisation"
                />
            </template>
        </FTTitle>

        <div>
            <!-- Organisation Info Card -->
            <FTCard class="info-card q-mb-lg">
                <q-card-section>
                    <div class="row q-col-gutter-lg">
                        <div class="col-12 col-md-8">
                            <div class="info-header q-mb-md">
                                <q-avatar color="primary" text-color="white" size="56px">
                                    <q-icon name="business" size="32px" />
                                </q-avatar>
                                <div class="info-content">
                                    <h5 class="text-h5 q-my-none">{{ organisation.name }}</h5>
                                    <div class="text-caption text-grey q-mt-xs">
                                        Organisation ID: {{ organisation.id }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </q-card-section>
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
                >
                    <q-card-section>
                        <div class="action-card-content">
                            <q-avatar
                                :color="card.color"
                                text-color="white"
                                size="48px"
                                class="q-mb-md"
                            >
                                <q-icon :name="card.icon" size="28px" />
                            </q-avatar>
                            <h6 class="text-h6 q-my-sm">{{ card.title }}</h6>
                            <p class="text-body2 text-grey q-mb-none">
                                {{ card.description }}
                            </p>
                        </div>
                    </q-card-section>
                    <q-card-actions align="right">
                        <q-btn
                            flat
                            :color="card.color"
                            icon-right="arrow_forward"
                            label="Manage"
                            no-caps
                        />
                    </q-card-actions>
                </FTCard>
            </div>
        </div>
    </div>

    <!-- Not Found State -->
    <div v-else class="text-center q-pa-lg">
        <q-icon name="business_center" size="64px" color="grey-5" />
        <h5 class="text-h5 q-mt-md q-mb-sm">Organisation Not Found</h5>
        <p class="text-body1 text-grey-6">
            The organisation you're looking for doesn't exist or has been deleted.
        </p>
        <FTBtn
            label="Back to Organisations"
            icon="arrow_back"
            color="primary"
            @click="router.push({ name: 'adminOrganisations' })"
        />
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
            cursor: pointer;

            &:hover {
                transform: translateY(-4px);

                :deep(.ft-card) {
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

                    .body--dark & {
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
