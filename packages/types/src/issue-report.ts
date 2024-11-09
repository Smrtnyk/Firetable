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

/**
 * Represents an issue report document in Firestore
 * Used for tracking bug reports and feature requests from users
 */
export interface IssueReportDoc {
    /**
     * Firestore document ID
     */
    id: string;
    /**
     * Detailed description of the issue or feature request
     */
    description: string;
    /**
     * Unix timestamp when the report was created
     */
    createdAt: number;
    /**
     * Firebase Auth UID of the user who created the report
     */
    createdBy: string;
    /**
     * Current status of the issue
     */
    status: IssueStatus;
    /**
     * Type of the report (bug or feature request)
     */
    category: IssueCategory;
    /**
     * Information about the user who reported the issue
     */
    user: {
        name: string;
        email: string;
    };
    /**
     * Information about the organisation where the issue was reported
     */
    organisation: {
        id: string;
        name: string;
    };
}
