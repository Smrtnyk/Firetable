<script setup lang="ts">
import type { IssueReportDoc } from "@firetable/types";

import { IssueCategory, IssueStatus } from "@firetable/types";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTTitle from "src/components/FTTitle.vue";
import { globalDialog } from "src/composables/useDialog";
import { useFirestoreCollection } from "src/composables/useFirestore";
import { deleteIssueReport, getIssueReportsPath, updateIssueReport } from "src/db";
import { getIssueStatusColor } from "src/helpers/issue-helpers";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useGlobalStore } from "src/stores/global";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const MIN_MENU_WIDTH = 150;

const { t } = useI18n();
const globalStore = useGlobalStore();
const { data: issueReports } = useFirestoreCollection<IssueReportDoc>(getIssueReportsPath());

const menuStates = ref<Record<string, boolean>>({});

const statusOptions = [
    { color: "warning", label: t("PageAdminIssueReports.status.new"), value: IssueStatus.NEW },
    {
        color: "info",
        label: t("PageAdminIssueReports.status.in_progress"),
        value: IssueStatus.IN_PROGRESS,
    },
    {
        color: "success",
        label: t("PageAdminIssueReports.status.resolved"),
        value: IssueStatus.RESOLVED,
    },
    {
        color: "error",
        label: t("PageAdminIssueReports.status.wont_fix"),
        value: IssueStatus.WONT_FIX,
    },
];

function closeMenu(issueId: string): void {
    menuStates.value[issueId] = false;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
}

function getIssueCategoryColor(category: IssueCategory): string {
    return category === IssueCategory.BUG ? "error" : "info";
}

async function onDeleteIssue(issueId: string): Promise<void> {
    closeMenu(issueId);

    if (
        await globalDialog.confirm({
            message: "",
            title: t("PageAdminIssueReports.deleteConfirmation"),
        })
    ) {
        await tryCatchLoadingWrapper({
            async hook() {
                await deleteIssueReport(issueId);
                globalStore.notify(t("PageAdminIssueReports.issueDeleted"));
            },
        });
    }
}

async function updateIssueStatus(issueId: string, status: IssueStatus): Promise<void> {
    closeMenu(issueId);

    await tryCatchLoadingWrapper({
        async hook() {
            await updateIssueReport(issueId, { status });
            globalStore.notify(t("PageAdminIssueReports.statusUpdated"));
        },
    });
}
</script>

<template>
    <div class="PageAdminIssueReports">
        <FTTitle :title="t('PageAdminIssueReports.title')" />

        <v-list v-if="issueReports.length > 0" lines="two">
            <template v-for="(issue, index) in issueReports" :key="issue.id">
                <v-list-item>
                    <template #prepend>
                        <v-chip
                            :color="getIssueCategoryColor(issue.category)"
                            size="small"
                            class="mr-3"
                        >
                            {{ t(`PageIssueReport.categories.${issue.category.toLowerCase()}`) }}
                        </v-chip>
                    </template>

                    <v-list-item-title>
                        {{ issue.description }}
                    </v-list-item-title>

                    <v-list-item-subtitle>
                        {{ issue.user.name }} ({{ issue.user.email }}) -
                        {{ issue.organisation.name }} -
                        {{ formatDate(issue.createdAt) }}
                    </v-list-item-subtitle>

                    <template #append>
                        <v-chip
                            :color="getIssueStatusColor(issue.status)"
                            size="small"
                            class="mr-2"
                        >
                            {{ t(`PageAdminIssueReports.status.${issue.status.toLowerCase()}`) }}
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

                            <v-list :min-width="MIN_MENU_WIDTH">
                                <v-list-subheader>
                                    {{ t("PageAdminIssueReports.updateStatus") }}
                                </v-list-subheader>

                                <v-list-item
                                    v-for="option in statusOptions"
                                    :key="option.value"
                                    @click="updateIssueStatus(issue.id, option.value)"
                                    :aria-label="`Set status to ${option.label}`"
                                >
                                    <v-list-item-title>{{ option.label }}</v-list-item-title>

                                    <template #append>
                                        <v-chip
                                            :color="getIssueStatusColor(option.value)"
                                            size="x-small"
                                            class="status-indicator"
                                        />
                                    </template>
                                </v-list-item>

                                <v-divider />

                                <v-list-item @click="onDeleteIssue(issue.id)" class="text-error">
                                    <v-list-item-title>
                                        {{ t("Global.delete") }}
                                    </v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </template>
                </v-list-item>

                <v-divider v-if="index < issueReports.length - 1" />
            </template>
        </v-list>

        <FTCenteredText v-else>
            {{ t("PageAdminIssueReports.noIssuesMessage") }}
        </FTCenteredText>
    </div>
</template>

<style scoped>
.v-list-item {
    padding: 16px;
}

.status-indicator {
    width: 12px;
    height: 12px;
    min-width: 12px;
}
</style>
