/**
 * Helper function to get enum values in a type-safe way
 * @param enumType - The enum to get values from
 * @returns Array of enum values
 */
export function getEnumValues<T extends { [key: string]: number | string }>(
    enumType: T,
): T[keyof T][] {
    // Get runtime values using Object.values while maintaining type safety
    return Object.values(enumType) as T[keyof T][];
}
