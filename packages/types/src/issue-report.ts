export const enum IssueCategory {
    BUG = "BUG",
    FEATURE_REQUEST = "FEATURE_REQUEST",
}

export const enum IssueStatus {
    IN_PROGRESS = "IN_PROGRESS",
    NEW = "NEW",
    RESOLVED = "RESOLVED",
    WONT_FIX = "WONT_FIX",
}

/**
 * Represents an issue report document in Firestore
 * Used for tracking bug reports and feature requests from users
 */
export interface IssueReportDoc {
    /**
     * Type of the report (bug or feature request)
     */
    category: IssueCategory;
    /**
     * Unix timestamp when the report was created
     */
    createdAt: number;
    /**
     * Firebase Auth UID of the user who created the report
     */
    createdBy: string;
    /**
     * Detailed description of the issue or feature request
     */
    description: string;
    /**
     * Firestore document ID
     */
    id: string;
    /**
     * Information about the organisation where the issue was reported
     */
    organisation: {
        id: string;
        name: string;
    };
    /**
     * Current status of the issue
     */
    status: IssueStatus;
    /**
     * Information about the user who reported the issue
     */
    user: {
        email: string;
        name: string;
    };
}
