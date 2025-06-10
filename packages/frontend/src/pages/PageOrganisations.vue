<script setup lang="ts">
import type { CreateOrganisationPayload } from "src/db";

import { storeToRefs } from "pinia";
import { useQuasar } from "quasar";
import AddNewOrganisationForm from "src/components/admin/organisation/AddNewOrganisationForm.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import { useDialog } from "src/composables/useDialog";
import { createNewOrganisation } from "src/db";
import {
    formatOrganisationStatus,
    getOrganisationStatusColor,
} from "src/helpers/organisation/organisation";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { usePropertiesStore } from "src/stores/properties-store";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const propertiesStore = usePropertiesStore();
const { organisations } = storeToRefs(usePropertiesStore());
const quasar = useQuasar();

const { createDialog } = useDialog();

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
            title: t("PageOrganisations.addNewOrganisationTitle"),
        },
    });
}

async function onOrganisationCreate(organisationPayload: CreateOrganisationPayload): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await createNewOrganisation(organisationPayload);
            quasar.notify({
                message: t("PageOrganisations.organisationCreatedSuccess"),
                type: "success",
            });
            return propertiesStore.initOrganisations();
        },
    });
}
</script>

<template>
    <div class="PageOrganisations">
        <div class="row q-col-gutter-md" v-if="organisations.length > 0">
            <div
                class="col-12 col-sm-6 col-lg-4"
                v-for="organisation of organisations"
                :key="organisation.id"
            >
                <router-link
                    :to="{
                        name: 'properties',
                        params: { organisationId: organisation.id },
                    }"
                    class="OrganisationCard__link"
                >
                    <div class="OrganisationCard">
                        <!-- Header Section -->
                        <div class="OrganisationCard__header">
                            <div class="OrganisationCard__icon">
                                <i class="fas fa-building" />
                            </div>
                            <div class="OrganisationCard__status">
                                <q-chip
                                    :color="getOrganisationStatusColor(organisation.status)"
                                    text-color="white"
                                    size="sm"
                                    class="OrganisationCard__status-chip"
                                >
                                    {{ formatOrganisationStatus(organisation.status) }}
                                </q-chip>
                            </div>
                        </div>

                        <!-- Title Section -->
                        <div class="OrganisationCard__title">
                            <h3>{{ organisation.name }}</h3>
                        </div>

                        <!-- Stats Section -->
                        <div class="OrganisationCard__stats">
                            <div class="OrganisationCard__stat">
                                <div class="OrganisationCard__stat-icon">
                                    <i class="fas fa-home" />
                                </div>
                                <div class="OrganisationCard__stat-content">
                                    <span class="OrganisationCard__stat-label">
                                        {{ t("PageOrganisations.propertiesLimit") }}
                                    </span>
                                    <span class="OrganisationCard__stat-value">
                                        {{ organisation.maxAllowedProperties }}
                                    </span>
                                </div>
                            </div>

                            <div class="OrganisationCard__stat">
                                <div class="OrganisationCard__stat-icon">
                                    <i class="fas fa-map" />
                                </div>
                                <div class="OrganisationCard__stat-content">
                                    <span class="OrganisationCard__stat-label">
                                        {{ t("PageOrganisations.floorPlansPerEvent") }}
                                    </span>
                                    <span class="OrganisationCard__stat-value">
                                        {{
                                            organisation.subscriptionSettings
                                                ?.maxFloorPlansPerEvent ?? "N/A"
                                        }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Action Section -->
                        <div class="OrganisationCard__action">
                            <span>{{ t("common.viewDetails", "View Details") }}</span>
                            <i class="fas fa-arrow-right" />
                        </div>
                    </div>
                </router-link>
            </div>
        </div>

        <div v-else>
            <FTCenteredText>
                <q-icon name="fa fa-briefcase" size="64px" color="grey-5" class="q-mb-md" />
                <div class="text-grey-6 q-mb-lg">
                    {{ t("PageOrganisations.noOrganisationsMessage") }}
                </div>
                <FTBtn
                    :label="t('PageOrganisations.createOrganisationButton')"
                    icon="fa fa-plus"
                    class="button-gradient"
                    @click="createOrganisation"
                />
            </FTCenteredText>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.OrganisationCard {
    background: white;
    border-radius: 16px;
    padding: 24px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.06);
    height: 100%;
    display: flex;
    flex-direction: column;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        border-color: rgba(99, 102, 241, 0.2);

        .OrganisationCard__action {
            background: #6366f1;
            color: white;

            i {
                transform: translateX(4px);
            }
        }
    }

    &__link {
        text-decoration: none;
        color: inherit;
        display: block;
    }

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
    }

    &__icon {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
    }

    &__status {
        &-chip {
            border-radius: 8px !important;
            font-weight: 600;
        }
    }

    &__title {
        margin-bottom: 24px;

        h3 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            color: #111827;
            line-height: 1.3;
        }
    }

    &__stats {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 24px;
        flex: 1;
    }

    &__stat {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #f8fafc;
        border-radius: 10px;
        border: 1px solid #e2e8f0;

        &-icon {
            width: 32px;
            height: 32px;
            background: #e0e7ff;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6366f1;
            font-size: 14px;
        }

        &-content {
            display: flex;
            flex-direction: column;
            flex: 1;
        }

        &-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        &-value {
            font-size: 16px;
            color: #1e293b;
            font-weight: 700;
            margin-top: 2px;
        }
    }

    &__action {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-weight: 600;
        color: #475569;
        font-size: 14px;

        i {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 12px;
        }
    }
}

// Dark mode support
.body--dark .OrganisationCard {
    background: #1e293b;
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);

    &:hover {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        border-color: rgba(99, 102, 241, 0.4);
    }

    .OrganisationCard__title h3 {
        color: #f1f5f9;
    }

    .OrganisationCard__stat {
        background: #334155;
        border-color: #475569;

        &-icon {
            background: rgba(99, 102, 241, 0.2);
            color: #a5b4fc;
        }

        &-label {
            color: #94a3b8;
        }

        &-value {
            color: #f1f5f9;
        }
    }

    .OrganisationCard__action {
        background: #334155;
        border-color: #475569;
        color: #cbd5e1;

        &:hover {
            background: #6366f1;
            border-color: #6366f1;
            color: white;
        }
    }
}

// Responsive adjustments
@media (max-width: 768px) {
    .OrganisationCard {
        padding: 20px;

        &__title h3 {
            font-size: 18px;
        }

        &__stats {
            gap: 12px;
            margin-bottom: 20px;
        }

        &__stat {
            padding: 10px;

            &-value {
                font-size: 14px;
            }
        }
    }
}

@media (max-width: 480px) {
    .OrganisationCard {
        padding: 16px;

        &__icon {
            width: 40px;
            height: 40px;
            font-size: 18px;
        }

        &__title h3 {
            font-size: 16px;
        }

        &__stats {
            margin-bottom: 16px;
        }
    }
}
</style>
