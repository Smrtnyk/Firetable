export interface PropertySettings {
    timezone: string;
}

export interface PropertyDoc {
    id: string;
    name: string;
    organisationId: string;
    img?: string;
    settings?: PropertySettings;
}
