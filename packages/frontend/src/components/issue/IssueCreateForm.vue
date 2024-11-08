<script setup lang="ts">
import type { IssueReportDoc } from "@firetable/types";
import { ref, useTemplateRef } from "vue";
import { QForm } from "quasar";
import { useI18n } from "vue-i18n";
import { minLength } from "src/helpers/form-rules";
import { IssueCategory } from "@firetable/types";

const props = defineProps<{
    issueToEdit?: IssueReportDoc;
}>();

const { t } = useI18n();
const emit =
    defineEmits<
        (
            event: "create" | "update",
            payload: { description: string; category: IssueCategory },
        ) => void
    >();

const issueDescription = ref(props.issueToEdit?.description ?? "");
const selectedCategory = ref<IssueCategory>(props.issueToEdit?.category ?? IssueCategory.BUG);
const issueForm = useTemplateRef<QForm>("issueForm");

const descriptionRules = [minLength("Issue description needs to have at least 10 characters!", 10)];

const categoryOptions = [
    {
        label: t("PageIssueReport.categories.bug"),
        value: IssueCategory.BUG,
    },
    {
        label: t("PageIssueReport.categories.feature_request"),
        value: IssueCategory.FEATURE_REQUEST,
    },
];

async function submit(): Promise<void> {
    if (!(await issueForm.value?.validate())) {
        return;
    }

    const payload = {
        description: issueDescription.value,
        category: selectedCategory.value,
    };

    if (props.issueToEdit) {
        emit("update", payload);
    } else {
        emit("create", payload);
    }
}
</script>

<template>
    <q-form ref="issueForm" @submit="submit">
        <q-select
            v-model="selectedCategory"
            :options="categoryOptions"
            :label="t('PageIssueReport.categoryLabel')"
            class="q-mb-md"
            rounded
            standout
            emit-value
            map-options
        />

        <q-input
            v-model="issueDescription"
            type="textarea"
            :label="t('PageIssueReport.descriptionLabel')"
            :hint="t('PageIssueReport.descriptionHint')"
            :rules="descriptionRules"
            rows="6"
            class="q-mb-md"
            rounded
            standout
        />

        <div class="row justify-end">
            <q-btn
                :label="t(props.issueToEdit ? 'Global.edit' : 'Global.submit')"
                type="submit"
                rounded
                class="button-gradient"
            />
        </div>
    </q-form>
</template>
