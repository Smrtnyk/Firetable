export type AspectRatio = "1" | "16:9";

export interface OrganisationDoc {
    id: string;
    name: string;
    maxAllowedProperties: number;
    settings?: OrganisationSettings;
}

export interface OrganisationSettings {
    property: {
        propertyCardAspectRatio: AspectRatio;
    };
    event: {
        eventCardAspectRatio: AspectRatio;
        eventStartTime24HFormat: string;
        eventDurationInHours: number;
        reservationArrivedColor: string;
        reservationConfirmedColor: string;
        reservationCancelledColor: string;
        reservationPendingColor: string;
    };
    guest: {
        collectGuestData: boolean;
    };
}
