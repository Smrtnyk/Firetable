export function getPublicUrForDrinkCard(organisationId: string, propertyId: string): string {
    return `${globalThis.location.origin}/${organisationId}/${propertyId}/drink-cards`;
}
