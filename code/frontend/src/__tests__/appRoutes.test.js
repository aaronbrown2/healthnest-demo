import { pathForPage, routeFromPath } from "../lib/appRoutes";

describe("app route helpers", () => {
  test("parses appointment detail URLs", () => {
    expect(routeFromPath("/appointments/appt-123")).toEqual({
      page: "appointment-detail",
      data: { appointmentId: "appt-123" },
    });
  });

  test("parses appointment detail URLs with trailing slashes", () => {
    expect(routeFromPath("/appointments/appt-123/")).toEqual({
      page: "appointment-detail",
      data: { appointmentId: "appt-123" },
    });
  });

  test("builds appointment detail URLs from appointmentId", () => {
    expect(
      pathForPage("appointment-detail", { appointmentId: "appt-123" }),
    ).toBe("/appointments/appt-123");
  });

  test("builds appointment detail URLs from the initial appointment object", () => {
    expect(
      pathForPage("appointment-detail", { appointment: { id: "appt-abc" } }),
    ).toBe("/appointments/appt-abc");
  });

  test("keeps the appointment list route separate from detail routes", () => {
    expect(routeFromPath("/appointments")).toEqual({
      page: "appointments",
      data: null,
    });
    expect(pathForPage("appointments")).toBe("/appointments");
  });

  test("parses provider schedule appointment URLs", () => {
    expect(routeFromPath("/schedule/appt-456")).toEqual({
      page: "schedule",
      data: { appointmentId: "appt-456" },
    });
  });

  test("builds provider schedule appointment URLs from appointmentId", () => {
    expect(pathForPage("schedule", { appointmentId: "appt-456" })).toBe(
      "/schedule/appt-456",
    );
  });
});
