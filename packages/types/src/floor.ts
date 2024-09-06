export interface FloorDoc {
    id: string;
    name: string;
    width: number;
    height: number;
    json: Record<string, any> | string;
    propertyId: string;
    compressed?: boolean;
}
