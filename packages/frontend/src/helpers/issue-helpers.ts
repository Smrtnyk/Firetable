import { IssueStatus } from "@firetable/types";

export function getIssueStatusColor(status: IssueStatus): string {
    switch (status) {
        case IssueStatus.RESOLVED:
            return "positive";
        case IssueStatus.WONT_FIX:
            return "negative";
        case IssueStatus.IN_PROGRESS:
            return "info";
        default:
            return "warning";
    }
}
