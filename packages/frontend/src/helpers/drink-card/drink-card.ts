import type {
    DrinkBundle,
    DrinkCardElement,
    DrinkCardHeader,
    DrinkCardHeaderEnd,
    DrinkCardSection,
} from "@firetable/types";

export function getPublicUrForDrinkCard(organisationId: string, propertyId: string): string {
    return `${globalThis.location.origin}/${organisationId}/${propertyId}/drink-cards`;
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
    }).format(price);
}

export function isSection(element: DrinkCardElement): element is DrinkCardSection {
    return element.type === "section";
}

export function isHeader(element: DrinkCardElement): element is DrinkCardHeader {
    return element.type === "header";
}

export function isHeaderEnd(element: DrinkCardElement): element is DrinkCardHeaderEnd {
    return element.type === "header-end";
}

export function isBundle(element: DrinkCardElement): element is DrinkBundle {
    return element.type === "bundle";
}

type ElementGroup = {
    element: DrinkCardElement;
    isGrouped: boolean;
    headerId?: string | undefined;
};
export function getElementGroups(elements: DrinkCardElement[]): ElementGroup[] {
    const result: ElementGroup[] = [];

    let currentHeader: DrinkCardHeader | null = null;
    let isInGroup = false;

    elements.forEach((element) => {
        if (isHeader(element)) {
            currentHeader = element;
            isInGroup = true;
            result.push({
                element,
                isGrouped: false,
            });
        } else if (isHeaderEnd(element)) {
            isInGroup = false;
            currentHeader = null;
            result.push({
                element,
                isGrouped: false,
            });
        } else {
            result.push({
                element,
                isGrouped: isInGroup,
                headerId: currentHeader?.id,
            });
        }
    });

    return result;
}
