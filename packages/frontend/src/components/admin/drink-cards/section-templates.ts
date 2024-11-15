import type { SectionTemplateId } from "@firetable/types";
import { DrinkMainCategory } from "@firetable/types";

export interface SectionTemplate {
    id: SectionTemplateId;
    name: string;
    category: DrinkMainCategory;
    defaultServingSize: {
        amount: number;
        unit: "bottle" | "cl" | "ml";
        displayName: string;
    };
}

export function getSectionTemplates(t: (key: string) => string): SectionTemplate[] {
    return [
        {
            id: "shots",
            name: t("PageAdminPropertyDrinkCards.shotsSection"),
            category: DrinkMainCategory.SPIRITS,
            defaultServingSize: {
                amount: 40,
                unit: "ml",
                displayName: "",
            },
        },
        {
            id: "spirits",
            name: t("PageAdminPropertyDrinkCards.spiritsSection"),
            category: DrinkMainCategory.SPIRITS,
            defaultServingSize: {
                amount: 1,
                unit: "cl",
                displayName: "",
            },
        },
        {
            id: "beer",
            name: t("PageAdminPropertyDrinkCards.beerSection"),
            category: DrinkMainCategory.BEER,
            defaultServingSize: {
                amount: 500,
                unit: "ml",
                displayName: "",
            },
        },
        {
            id: "wine",
            name: t("PageAdminPropertyDrinkCards.wineSection"),
            category: DrinkMainCategory.WINE,
            defaultServingSize: {
                amount: 150,
                unit: "ml",
                displayName: t("PageAdminPropertyDrinkCards.glass"),
            },
        },
        {
            id: "soft-drinks",
            name: t("PageAdminPropertyDrinkCards.softDrinksSection"),
            category: DrinkMainCategory.NON_ALCOHOLIC,
            defaultServingSize: {
                amount: 330,
                unit: "ml",
                displayName: "",
            },
        },
    ];
}
