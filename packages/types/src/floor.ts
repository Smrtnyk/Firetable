export interface FloorDoc {
    id: string;
    name: string;
    width: number;
    height: number;
    json: string | Record<string, any>;
    propertyId: string;
    compressed?: boolean;
}
