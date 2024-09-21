import { parseProductData } from "./parse-product-data";
import RedBull from "../../../test-helpers/inventory/test-products/red-bull.json";
import CocaCola from "../../../test-helpers/inventory/test-products/coca-cola.json";
import AbsolutVodka from "../../../test-helpers/inventory/test-products/absolut-vodka.json";
import { describe, it, expect } from "vitest";

describe("helpers/inventory/parse-product-data", () => {
    it("parses coca cola", () => {
        expect(parseProductData(CocaCola)).toEqual({
            alcoholContent: 0,
            category: "Beverages",
            name: "Coca-Cola",
            price: 0,
            quantity: 1,
            supplier: "Coca-Cola",
            type: "drink",
            volume: 250,
        });
    });

    it("parses red bull", () => {
        expect(parseProductData(RedBull)).toEqual({
            alcoholContent: 0,
            category: "Beverages",
            name: "Red Bull 250ml",
            price: 0,
            quantity: 1,
            supplier: "Red Bull,Orginal",
            type: "drink",
            volume: 250,
        });
    });

    it("parses absolute vodka", () => {
        expect(parseProductData(AbsolutVodka)).toEqual({
            alcoholContent: 40,
            category: "Beverages",
            name: "Absolut Vodka",
            price: 0,
            quantity: 1,
            supplier: "Absolut,absolut vodka",
            type: "drink",
            volume: 700,
        });
    });
});
