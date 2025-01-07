import { OrganisationStatus } from "@firetable/types";

export function getOrganisationStatusColor(status?: OrganisationStatus): string {
    switch (status) {
        case OrganisationStatus.ACTIVE:
            return "positive";
        case OrganisationStatus.DISABLED:
            return "grey";
        case OrganisationStatus.PENDING:
            return "warning";
        case OrganisationStatus.SUSPENDED:
            return "negative";
        default:
            return "grey";
    }
}

export function formatOrganisationStatus(status?: OrganisationStatus): string {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : "No Status";
}
