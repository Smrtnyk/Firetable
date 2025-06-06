<script setup lang="ts">
import type { IssueReportDoc } from "@firetable/types";

import { IssueCategory, IssueStatus } from "@firetable/types";
import { where } from "firebase/firestore";
import { useQuasar } from "quasar";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTTitle from "src/components/FTTitle.vue";
import IssueCreateForm from "src/components/issue/IssueCreateForm.vue";
import { useDialog } from "src/composables/useDialog";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { ONE_MINUTE } from "src/constants";
import {
    createIssueReport,
    deleteIssueReport,
    getIssueReportsPath,
    updateIssueReport,
} from "src/db";
import { getIssueStatusColor } from "src/helpers/issue-helpers";
import { showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const { createDialog } = useDialog();
const quasar = useQuasar();
const authStore = useAuthStore();
const propertiesStore = usePropertiesStore();

const organisation = computed(() => {
    return propertiesStore.getOrganisationById(authStore.nonNullableUser.organisationId);
});

const MAX_REPORTS = 5;
const THROTTLE_WINDOW_MS = 5 * ONE_MINUTE;

function checkReportThrottle(): boolean {
    const now = Date.now();
    const reportsKey = `issue-reports-${authStore.nonNullableUser.id}`;
    const reports = JSON.parse(localStorage.getItem(reportsKey) ?? "[]");

    // Clean up old reports
    const recentReports = reports.filter(
        (timestamp: number) => now - timestamp < THROTTLE_WINDOW_MS,
    );

    if (recentReports.length >= MAX_REPORTS) {
        return false;
    }

    // Add new report timestamp
    recentReports.push(now);
    localStorage.setItem(reportsKey, JSON.stringify(recentReports));
    return true;
}

async function onDeleteIssue(issueId: string): Promise<void> {
    if (await showConfirm(t("PageIssueReport.deleteConfirmation"))) {
        await tryCatchLoadingWrapper({
            async hook() {
                await deleteIssueReport(issueId);
                quasar.notify(t("PageIssueReport.issueDeleted"));
            },
        });
    }
}

function showCreateIssueForm(): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: IssueCreateForm,
            componentPropsObject: {},
            listeners: {
                async create({ category, description }) {
                    if (!checkReportThrottle()) {
                        quasar.notify({
                            message: t("PageIssueReport.tooManyReports", {
                                count: MAX_REPORTS,
                                minutes: THROTTLE_WINDOW_MS / ONE_MINUTE,
                            }),
                            type: "negative",
                        });
                        return;
                    }

                    await tryCatchLoadingWrapper({
                        async hook() {
                            await createIssueReport({
                                category,
                                createdAt: Date.now(),
                                createdBy: authStore.nonNullableUser.id,
                                description,
                                organisation: {
                                    id: organisation.value.id,
                                    name: organisation.value.name,
                                },
                                user: {
                                    email: authStore.nonNullableUser.email,
                                    name: authStore.nonNullableUser.name,
                                },
                            });
                            quasar.notify(t("PageIssueReport.issueReportedSuccess"));
                            dialog.hide();
                        },
                    });
                },
            },
            maximized: false,
            title: t("PageIssueReport.createNewIssue"),
        },
    });
}

function showEditIssueForm(issue: IssueReportDoc): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: IssueCreateForm,
            componentPropsObject: {
                issueToEdit: issue,
            },
            listeners: {
                async update({ category, description }) {
                    await tryCatchLoadingWrapper({
                        async hook() {
                            await updateIssueReport(issue.id, {
                                category,
                                description,
                            });
                            quasar.notify(t("PageIssueReport.issueUpdatedSuccess"));
                            dialog.hide();
                        },
                    });
                },
            },
            maximized: false,
            title: t("PageIssueReport.editIssue"),
        },
    });
}

const { data: myIssues } = useFirestoreCollection<IssueReportDoc>(
    createQuery(
        getIssueReportsPath(),
        where("organisation.id", "==", organisation.value.id),
        where("createdBy", "==", authStore.nonNullableUser.id),
    ),
);
</script>

<template>
    <div class="PageIssueReport">
        <FTTitle :title="t('PageIssueReport.title')">
            <template #right>
                <FTBtn
                    aria-label="Report new issue"
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="showCreateIssueForm"
                />
            </template>
        </FTTitle>

        <q-card class="q-pa-md ft-card">
            <h6 class="text-h6 q-mb-md">
                {{ t("PageIssueReport.myIssues") }}
            </h6>

            <q-list bordered separator v-if="myIssues?.length">
                <q-item v-for="issue in myIssues" :key="issue.id">
                    <q-item-section>
                        <q-item-label>
                            <q-badge
                                :color="issue.category === IssueCategory.BUG ? 'negative' : 'info'"
                                class="q-mr-sm"
                            >
                                {{
                                    t(`PageIssueReport.categories.${issue.category.toLowerCase()}`)
                                }}
                            </q-badge>
                            {{ issue.description }}
                        </q-item-label>
                        <q-item-label caption>
                            {{ new Date(issue.createdAt).toLocaleString() }}
                        </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                        <q-badge :color="getIssueStatusColor(issue.status)">
                            {{ t(`PageAdminIssueReports.status.${issue.status.toLowerCase()}`) }}
                        </q-badge>
                    </q-item-section>

                    <q-item-section side>
                        <q-btn
                            flat
                            round
                            color="grey"
                            icon="more"
                            :aria-label="`Actions for issue ${issue.description}`"
                        >
                            <q-menu class="ft-card">
                                <q-list style="min-width: 150px">
                                    <q-item
                                        clickable
                                        aria-label="Edit issue"
                                        v-close-popup
                                        @click="showEditIssueForm(issue)"
                                        :disable="
                                            issue.status === IssueStatus.RESOLVED ||
                                            issue.status === IssueStatus.WONT_FIX
                                        "
                                    >
                                        <q-item-section>
                                            {{ t("Global.edit") }}
                                        </q-item-section>
                                    </q-item>

                                    <q-separator />

                                    <q-item
                                        clickable
                                        v-close-popup
                                        @click="onDeleteIssue(issue.id)"
                                    >
                                        <q-item-section class="text-negative">
                                            {{ t("Global.delete") }}
                                        </q-item-section>
                                    </q-item>
                                </q-list>
                            </q-menu>
                        </q-btn>
                    </q-item-section>
                </q-item>
            </q-list>

            <FTCenteredText v-else>
                {{ t("PageIssueReport.noIssuesMessage") }}
            </FTCenteredText>
        </q-card>
    </div>
</template>
