import type { RenderResult } from "vitest-browser-vue";
import type { OrganisationDoc, PropertyDoc } from "@firetable/types";
import type { PageAdminPropertySettingsProps } from "./PageAdminPropertySettings.vue";
import PageAdminPropertySettings from "./PageAdminPropertySettings.vue";
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

describe("PageAdminPropertySettings.vue", () => {
    let propertiesData: PropertyDoc[];
    let organisationData: OrganisationDoc;

    beforeEach(() => {
        organisationData = {
            id: "org1",
            name: "Test Organisation",
            settings: {
                property: {
                    propertyCardAspectRatio: "1",
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
                    guest: {
                        collectGuestData: false,
                    },
                },
            },
            {
                id: "property2",
                name: "Property Two",
                organisationId: "org1",
                settings: {
                    timezone: "Europe/Athens",
                    markGuestAsLateAfterMinutes: 30,
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
                    guest: {
                        collectGuestData: false,
                    },
                },
            },
        ] as PropertyDoc[];
    });

    async function render(
        props = { organisationId: "org1", propertyId: "property1" },
    ): Promise<RenderResult<PageAdminPropertySettingsProps>> {
        const screen = renderComponent(PageAdminPropertySettings, props, {
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

        const propertySection = screen.getByLabelText("Property One settings card");

        await expect.element(propertySection).toBeInTheDocument();

        const propertySelect = propertySection.getByLabelText("Property timezone");

        await expect.element(propertySelect).toHaveValue("Europe/Vienna");
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
