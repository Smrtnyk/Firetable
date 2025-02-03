import { IssueStatus } from "@firetable/types";

export function getIssueStatusColor(status: IssueStatus): string {
    switch (status) {
        case IssueStatus.IN_PROGRESS:
            return "info";
        case IssueStatus.RESOLVED:
            return "positive";
        case IssueStatus.WONT_FIX:
            return "negative";
        default:
            return "warning";
    }
}
