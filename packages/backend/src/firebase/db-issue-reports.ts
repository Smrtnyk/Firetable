import type { IssueCategory } from "@firetable/types";
import { initializeFirebase } from "./base.js";
import { getIssueReportsPath } from "./paths.js";
import { collection, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { IssueStatus } from "@firetable/types";

export interface CreateIssueReportPayload {
    description: string;
    createdAt: number;
    createdBy: string;
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

export interface UpdateIssueReportPayload {
    status?: IssueStatus;
    description?: string;
    category?: IssueCategory;
}

export async function createIssueReport(payload: CreateIssueReportPayload): Promise<string> {
    const { firestore } = initializeFirebase();
    const issueReportsCollection = collection(firestore, getIssueReportsPath());
    const docRef = await addDoc(issueReportsCollection, {
        ...payload,
        status: IssueStatus.NEW,
    });
    return docRef.id;
}

export async function updateIssueReport(
    issueId: string,
    payload: UpdateIssueReportPayload,
): Promise<void> {
    const { firestore } = initializeFirebase();
    const issueDoc = doc(firestore, getIssueReportsPath(), issueId);
    await updateDoc(issueDoc, { ...payload });
}

export async function deleteIssueReport(issueId: string): Promise<void> {
    const { firestore } = initializeFirebase();
    const issueDoc = doc(firestore, getIssueReportsPath(), issueId);
    await deleteDoc(issueDoc);
}
