interface DrinkCardBase {
    name: string;
    description: string;
    isActive: boolean;
    propertyId: string;
    organisationId: string;
}

export interface PDFDrinkCardDoc extends DrinkCardBase {
    id: string;
    type: "pdf";
    pdfUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    elements?: never;
}

export type DrinkCardDoc = PDFDrinkCardDoc;

export type CreatePDFDrinkCardPayload = Omit<PDFDrinkCardDoc, "createdAt" | "id" | "updatedAt">;
export type CreateDrinkCardPayload = CreatePDFDrinkCardPayload;

export function isPDFDrinkCard(card: Pick<DrinkCardDoc, "type">): card is PDFDrinkCardDoc {
    return card.type === "pdf";
}
