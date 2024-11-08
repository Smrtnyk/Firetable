export const enum IssueCategory {
    BUG = "BUG",
    FEATURE_REQUEST = "FEATURE_REQUEST",
}

export const enum IssueStatus {
    NEW = "NEW",
    IN_PROGRESS = "IN_PROGRESS",
    RESOLVED = "RESOLVED",
    WONT_FIX = "WONT_FIX",
}

export interface IssueReportDoc {
    id: string;
    description: string;
    createdAt: number;
    createdBy: string;
    status: IssueStatus;
    category: IssueCategory;
    user: {
        name: string;
        email: string;
    };
    organisation: {
        id: string;
        name: string;
    };
}
