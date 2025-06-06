import type { IssueCategory } from "@firetable/types";

import { IssueStatus } from "@firetable/types";
import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";

import { initializeFirebase } from "./base.js";
import { getIssueReportsPath } from "./paths.js";

interface CreateIssueReportPayload {
    category: IssueCategory;
    createdAt: number;
    createdBy: string;
    description: string;
    organisation: {
        id: string;
        name: string;
    };
    user: {
        email: string;
        name: string;
    };
}

interface UpdateIssueReportPayload {
    category?: IssueCategory;
    description?: string;
    status?: IssueStatus;
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

export async function deleteIssueReport(issueId: string): Promise<void> {
    const { firestore } = initializeFirebase();
    const issueDoc = doc(firestore, getIssueReportsPath(), issueId);
    await deleteDoc(issueDoc);
}

export async function updateIssueReport(
    issueId: string,
    payload: UpdateIssueReportPayload,
): Promise<void> {
    const { firestore } = initializeFirebase();
    const issueDoc = doc(firestore, getIssueReportsPath(), issueId);
    await updateDoc(issueDoc, { ...payload });
}
