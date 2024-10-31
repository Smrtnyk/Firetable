/**
 * This file serves as proxy file for the backend imports
 * Reason that we have it is that vitest can't mock the imports from the @firetable packages
 * So we need to have a proxy file that we can mock
 */

export * from "@firetable/backend";
