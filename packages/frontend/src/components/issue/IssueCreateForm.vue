<script setup lang="ts">
import type { IssueReportDoc } from "@firetable/types";

import { IssueCategory } from "@firetable/types";
import { minLength } from "src/helpers/form-rules";
import { ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
    issueToEdit?: IssueReportDoc;
}>();

const { t } = useI18n();
const emit =
    defineEmits<
        (
            event: "create" | "update",
            payload: { category: IssueCategory; description: string },
        ) => void
    >();

const issueDescription = ref(props.issueToEdit?.description ?? "");
const selectedCategory = ref<IssueCategory>(props.issueToEdit?.category ?? IssueCategory.BUG);
const issueForm = useTemplateRef("issueForm");

const descriptionRules = [minLength("Issue description needs to have at least 10 characters!", 10)];

const categoryOptions = [
    {
        title: t("PageIssueReport.categories.bug"),
        value: IssueCategory.BUG,
    },
    {
        title: t("PageIssueReport.categories.feature_request"),
        value: IssueCategory.FEATURE_REQUEST,
    },
];

async function submit(): Promise<void> {
    const { valid } = (await issueForm.value?.validate()) ?? { valid: false };
    if (!valid) {
        return;
    }

    const payload = {
        category: selectedCategory.value,
        description: issueDescription.value,
    };

    if (props.issueToEdit) {
        emit("update", payload);
    } else {
        emit("create", payload);
    }
}
</script>

<template>
    <v-form ref="issueForm" @submit.prevent="submit">
        <v-select
            v-model="selectedCategory"
            :items="categoryOptions"
            :label="t('PageIssueReport.categoryLabel')"
            class="mb-4"
            variant="outlined"
        />

        <v-textarea
            v-model="issueDescription"
            :label="t('PageIssueReport.descriptionLabel')"
            :hint="t('PageIssueReport.descriptionHint')"
            :rules="descriptionRules"
            rows="6"
            class="mb-4"
            variant="outlined"
        />

        <div class="d-flex justify-end">
            <v-btn type="submit" rounded="lg" class="button-gradient">
                {{ t(props.issueToEdit ? "Global.edit" : "Global.submit") }}
            </v-btn>
        </div>
    </v-form>
</template>
