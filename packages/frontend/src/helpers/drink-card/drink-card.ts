import type {
    DrinkBundle,
    DrinkCardElement,
    DrinkCardHeader,
    DrinkCardHeaderEnd,
    DrinkCardSection,
} from "@firetable/types";

type ElementGroup = {
    element: DrinkCardElement;
    headerId?: string | undefined;
    isGrouped: boolean;
};

export function formatPrice(price: number): string {
    return new Intl.NumberFormat("de-DE", {
        currency: "EUR",
        style: "currency",
    }).format(price);
}

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
                headerId: currentHeader?.id,
                isGrouped: isInGroup,
            });
        }
    });

    return result;
}

export function getPublicUrForDrinkCard(organisationId: string, propertyId: string): string {
    return `${globalThis.location.origin}/${organisationId}/${propertyId}/drink-cards`;
}

export function isBundle(element: DrinkCardElement): element is DrinkBundle {
    return element.type === "bundle";
}

export function isHeader(element: DrinkCardElement): element is DrinkCardHeader {
    return element.type === "header";
}

export function isHeaderEnd(element: DrinkCardElement): element is DrinkCardHeaderEnd {
    return element.type === "header-end";
}
export function isSection(element: DrinkCardElement): element is DrinkCardSection {
    return element.type === "section";
}
