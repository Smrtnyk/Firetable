<script setup lang="ts">
import type { IssueReportDoc } from "@firetable/types";

import { IssueCategory, IssueStatus } from "@firetable/types";
import { useQuasar } from "quasar";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTTitle from "src/components/FTTitle.vue";
import { useFirestoreCollection } from "src/composables/useFirestore";
import { deleteIssueReport, getIssueReportsPath, updateIssueReport } from "src/db";
import { getIssueStatusColor } from "src/helpers/issue-helpers";
import { showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const quasar = useQuasar();

const { data: issueReports } = useFirestoreCollection<IssueReportDoc>(getIssueReportsPath());

const statusOptions = [
    { color: "warning", label: t("PageAdminIssueReports.status.new"), value: IssueStatus.NEW },
    {
        color: "info",
        label: t("PageAdminIssueReports.status.in_progress"),
        value: IssueStatus.IN_PROGRESS,
    },
    {
        color: "positive",
        label: t("PageAdminIssueReports.status.resolved"),
        value: IssueStatus.RESOLVED,
    },
    {
        color: "negative",
        label: t("PageAdminIssueReports.status.wont_fix"),
        value: IssueStatus.WONT_FIX,
    },
];

async function onDeleteIssue(issueId: string): Promise<void> {
    if (await showConfirm(t("PageAdminIssueReports.deleteConfirmation"))) {
        await tryCatchLoadingWrapper({
            async hook() {
                await deleteIssueReport(issueId);
                quasar.notify(t("PageAdminIssueReports.issueDeleted"));
            },
        });
    }
}

async function updateIssueStatus(issueId: string, status: IssueStatus): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await updateIssueReport(issueId, { status });
            quasar.notify(t("PageAdminIssueReports.statusUpdated"));
        },
    });
}
</script>

<template>
    <div class="PageAdminIssueReports">
        <FTTitle :title="t('PageAdminIssueReports.title')" />

        <q-list bordered separator v-if="issueReports.length > 0">
            <q-item v-for="issue in issueReports" :key="issue.id">
                <q-item-section>
                    <q-item-label>
                        <q-badge
                            :color="issue.category === IssueCategory.BUG ? 'negative' : 'info'"
                            class="q-mr-sm"
                        >
                            {{ t(`PageIssueReport.categories.${issue.category.toLowerCase()}`) }}
                        </q-badge>
                        {{ issue.description }}
                    </q-item-label>
                    <q-item-label caption>
                        {{ issue.user.name }} ({{ issue.user.email }}) -
                        {{ issue.organisation.name }} -
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
                        <q-menu>
                            <q-list style="min-width: 150px">
                                <q-item-label header>{{
                                    t("PageAdminIssueReports.updateStatus")
                                }}</q-item-label>

                                <q-item
                                    v-for="option in statusOptions"
                                    :key="option.value"
                                    clickable
                                    v-close-popup
                                    @click="updateIssueStatus(issue.id, option.value)"
                                    :aria-label="`Set status to ${option.label}`"
                                >
                                    <q-item-section>
                                        <q-item-label>{{ option.label }}</q-item-label>
                                    </q-item-section>
                                    <q-item-section side>
                                        <q-badge :color="getIssueStatusColor(option.value)" />
                                    </q-item-section>
                                </q-item>

                                <q-separator />

                                <q-item clickable v-close-popup @click="onDeleteIssue(issue.id)">
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
            {{ t("PageAdminIssueReports.noIssuesMessage") }}
        </FTCenteredText>
    </div>
</template>
