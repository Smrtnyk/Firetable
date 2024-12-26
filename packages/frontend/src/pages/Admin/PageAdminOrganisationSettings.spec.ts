import type { RenderResult } from "vitest-browser-vue";
import type { OrganisationDoc, PropertyDoc } from "@firetable/types";
import type { PageAdminOrganisationSettingsProps } from "./PageAdminOrganisationSettings.vue";
import PageAdminOrganisationSettings from "./PageAdminOrganisationSettings.vue";
import { renderComponent } from "../../../test-helpers/render-component";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { page, userEvent } from "@vitest/browser/context";
import { nextTick } from "vue";

const { updateOrganisationSettingsMock, updatePropertySettingsMock } = vi.hoisted(() => ({
    updateOrganisationSettingsMock: vi.fn(),
    updatePropertySettingsMock: vi.fn(),
}));

vi.mock("../../backend-proxy", () => ({
    updateOrganisationSettings: updateOrganisationSettingsMock,
    updatePropertySettings: updatePropertySettingsMock,
    fetchOrganisationById: vi.fn(),
    fetchOrganisationsForAdmin: vi.fn(),
    fetchPropertiesForAdmin: vi.fn(),
    propertiesCollection: vi.fn(),
}));

describe("PageAdminOrganisationSettings.vue", () => {
    let propertiesData: PropertyDoc[];
    let organisationData: OrganisationDoc;

    beforeEach(() => {
        organisationData = {
            id: "org1",
            name: "Test Organisation",
            settings: {
                event: {
                    eventStartTime24HFormat: "22:00",
                    eventDurationInHours: 10,
                    eventCardAspectRatio: "16:9",
                    reservationArrivedColor: "#1a7722",
                    reservationConfirmedColor: "#6247aa",
                    reservationCancelledColor: "#ff9f43",
                    reservationPendingColor: "#2ab7ca",
                    reservationWaitingForResponseColor: "#b5a22c",
                },
                property: {
                    propertyCardAspectRatio: "1",
                },
                guest: {
                    collectGuestData: false,
                },
            },
        } as OrganisationDoc;

        propertiesData = [
            {
                id: "property1",
                name: "Property One",
                organisationId: "org1",
                settings: {
                    timezone: "Europe/Vienna",
                    markGuestAsLateAfterMinutes: 15,
                },
            },
            {
                id: "property2",
                name: "Property Two",
                organisationId: "org1",
                settings: {
                    timezone: "Europe/Athens",
                    markGuestAsLateAfterMinutes: 30,
                },
            },
        ] as PropertyDoc[];
    });

    async function render(
        props = { organisationId: "org1" },
    ): Promise<RenderResult<PageAdminOrganisationSettingsProps>> {
        const screen = renderComponent(PageAdminOrganisationSettings, props, {
            piniaStoreOptions: {
                initialState: {
                    properties: {
                        properties: propertiesData,
                        organisations: [organisationData],
                    },
                },
            },
        });

        // Wait for initial render
        await vi.waitUntil(() => page.getByText("Property One"));

        return screen;
    }

    it("renders all properties with their timezone settings", async () => {
        const screen = await render();

        const propertyOneSection = screen.getByLabelText("Property One settings card");
        const propertyTwoSection = screen.getByLabelText("Property Two settings card");

        await expect.element(propertyOneSection).toBeInTheDocument();
        await expect.element(propertyTwoSection).toBeInTheDocument();

        const propertyOneSelect = propertyOneSection.getByLabelText("Property timezone");
        const propertyTwoSelect = propertyTwoSection.getByLabelText("Property timezone");

        await expect.element(propertyOneSelect).toHaveValue("Europe/Vienna");
        await expect.element(propertyTwoSelect).toHaveValue("Europe/Athens");
    });

    it("detects changes in property timezone settings", async () => {
        const screen = await render();

        const propertySection = screen.getByLabelText("Property One settings card");
        propertySection.query()!.scrollIntoView();

        await nextTick();

        const timezoneSelect = propertySection.getByLabelText("Property timezone");
        await userEvent.click(timezoneSelect);
        const search = screen.getByRole("textbox", { name: "Search timezones" });
        await userEvent.fill(search, "Vilnius");
        const vilniusOption = screen.getByText("Europe/Vilnius");
        await userEvent.click(vilniusOption);

        const saveButton = screen.getByRole("button", { name: "Save" });
        await expect.element(saveButton).not.toBeDisabled();
    });

    it("resets all changes when reset button is clicked", async () => {
        const screen = await render();

        const eventDurationInHoursTextbox = screen.getByRole("textbox", {
            name: "Event duration in hours",
        });
        await userEvent.clear(eventDurationInHoursTextbox);
        await userEvent.type(eventDurationInHoursTextbox, "11");

        const resetButton = screen.getByRole("button", { name: "Reset" });
        await userEvent.click(resetButton);

        await expect.element(eventDurationInHoursTextbox).toHaveValue("10");
    });

    it("disables save and reset buttons when no changes made", async () => {
        const screen = await render();

        const saveButton = screen.getByRole("button", { name: "Save" });
        const resetButton = screen.getByRole("button", { name: "Reset" });

        await expect.element(saveButton).toBeDisabled();
        await expect.element(resetButton).toBeDisabled();
    });
});
