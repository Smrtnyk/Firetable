<script setup lang="ts">
import type { IssueReportDoc } from "@firetable/types";

import { IssueCategory, IssueStatus } from "@firetable/types";
import { where } from "firebase/firestore";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTTitle from "src/components/FTTitle.vue";
import IssueCreateForm from "src/components/issue/IssueCreateForm.vue";
import { globalDialog } from "src/composables/useDialog";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { ONE_MINUTE } from "src/constants";
import {
    createIssueReport,
    deleteIssueReport,
    getIssueReportsPath,
    updateIssueReport,
} from "src/db";
import { getIssueStatusColor } from "src/helpers/issue-helpers";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { useGlobalStore } from "src/stores/global-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const MAX_REPORTS_PER_WINDOW = 5;
const THROTTLE_WINDOW_MS = 5 * ONE_MINUTE;
const MIN_MENU_WIDTH = 150;

const { t } = useI18n();
const globalStore = useGlobalStore();
const authStore = useAuthStore();
const propertiesStore = usePropertiesStore();

const organisation = computed(() => {
    return propertiesStore.getOrganisationById(authStore.nonNullableUser.organisationId);
});

const menuStates = ref<Record<string, boolean>>({});

function checkReportThrottle(): boolean {
    const now = Date.now();
    const reportsKey = `issue-reports-${authStore.nonNullableUser.id}`;
    const reports = JSON.parse(localStorage.getItem(reportsKey) ?? "[]");

    const recentReports = reports.filter(
        (timestamp: number) => now - timestamp < THROTTLE_WINDOW_MS,
    );

    if (recentReports.length >= MAX_REPORTS_PER_WINDOW) {
        return false;
    }

    recentReports.push(now);
    localStorage.setItem(reportsKey, JSON.stringify(recentReports));
    return true;
}

function closeMenu(issueId: string): void {
    menuStates.value[issueId] = false;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
}

function getIssueCategoryColor(category: IssueCategory): string {
    return category === IssueCategory.BUG ? "error" : "info";
}

function isIssueEditable(status: IssueStatus): boolean {
    return status !== IssueStatus.RESOLVED && status !== IssueStatus.WONT_FIX;
}

async function onDeleteIssue(issueId: string): Promise<void> {
    closeMenu(issueId);

    if (
        await globalDialog.confirm({
            message: "",
            title: t("PageIssueReport.deleteConfirmation"),
        })
    ) {
        await tryCatchLoadingWrapper({
            async hook() {
                await deleteIssueReport(issueId);
                globalStore.notify(t("PageIssueReport.issueDeleted"));
            },
        });
    }
}

function showCreateIssueForm(): void {
    const dialog = globalDialog.openDialog(
        IssueCreateForm,
        {
            // @ts-expect-error -- FIXME: infer types properly
            async onCreate({ category, description }) {
                if (!checkReportThrottle()) {
                    globalStore.notify(
                        t("PageIssueReport.tooManyReports", {
                            count: MAX_REPORTS_PER_WINDOW,
                            minutes: THROTTLE_WINDOW_MS / ONE_MINUTE,
                        }),
                        "negative",
                    );
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
                        globalStore.notify(t("PageIssueReport.issueReportedSuccess"));
                        dialog.hide();
                    },
                });
            },
        },
        {
            title: t("PageIssueReport.createNewIssue"),
        },
    );
}

function showEditIssueForm(issue: IssueReportDoc): void {
    closeMenu(issue.id);

    const dialog = globalDialog.openDialog(
        IssueCreateForm,
        {
            issueToEdit: issue,
            // @ts-expect-error -- FIXME: infer types properly
            async onUpdate({ category, description }) {
                await tryCatchLoadingWrapper({
                    async hook() {
                        await updateIssueReport(issue.id, {
                            category,
                            description,
                        });
                        globalStore.notify(t("PageIssueReport.issueUpdatedSuccess"));
                        dialog.hide();
                    },
                });
            },
        },
        {
            title: t("PageIssueReport.editIssue"),
        },
    );
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
                    icon="fa fa-plus"
                    class="button-gradient"
                    @click="showCreateIssueForm"
                />
            </template>
        </FTTitle>

        <v-card class="pa-4 ft-card">
            <h2 class="text-h6 mb-4">
                {{ t("PageIssueReport.myIssues") }}
            </h2>

            <v-list v-if="myIssues?.length" lines="two">
                <template v-for="(issue, index) in myIssues" :key="issue.id">
                    <v-list-item>
                        <template #prepend>
                            <v-chip
                                :color="getIssueCategoryColor(issue.category)"
                                size="small"
                                class="mr-3"
                            >
                                {{
                                    t(`PageIssueReport.categories.${issue.category.toLowerCase()}`)
                                }}
                            </v-chip>
                        </template>

                        <v-list-item-title>
                            {{ issue.description }}
                        </v-list-item-title>

                        <v-list-item-subtitle>
                            {{ formatDate(issue.createdAt) }}
                        </v-list-item-subtitle>

                        <template #append>
                            <v-chip
                                :color="getIssueStatusColor(issue.status)"
                                size="small"
                                class="mr-2"
                            >
                                {{
                                    t(`PageAdminIssueReports.status.${issue.status.toLowerCase()}`)
                                }}
                            </v-chip>

                            <v-menu
                                v-model="menuStates[issue.id]"
                                location="bottom end"
                                :close-on-content-click="false"
                            >
                                <template #activator="{ props }">
                                    <v-btn
                                        v-bind="props"
                                        variant="text"
                                        icon="fa fa-ellipsis-v"
                                        size="small"
                                        :aria-label="`Actions for issue ${issue.description}`"
                                    />
                                </template>

                                <v-list :min-width="MIN_MENU_WIDTH" class="ft-card">
                                    <v-list-item
                                        aria-label="Edit issue"
                                        @click="showEditIssueForm(issue)"
                                        :disabled="!isIssueEditable(issue.status)"
                                    >
                                        <v-list-item-title>
                                            {{ t("Global.edit") }}
                                        </v-list-item-title>
                                    </v-list-item>

                                    <v-divider />

                                    <v-list-item
                                        @click="onDeleteIssue(issue.id)"
                                        class="text-error"
                                    >
                                        <v-list-item-title>
                                            {{ t("Global.delete") }}
                                        </v-list-item-title>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </template>
                    </v-list-item>

                    <v-divider v-if="index < myIssues.length - 1" />
                </template>
            </v-list>

            <FTCenteredText v-else>
                {{ t("PageIssueReport.noIssuesMessage") }}
            </FTCenteredText>
        </v-card>
    </div>
</template>

<style scoped>
.v-list-item {
    padding: 16px;
}
</style>
