import React from "react";
import "@testing-library/jest-dom";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import NotificationBell from "../components/NotificationBell";
import { notificationsApi } from "../lib/notificationsApi";

const mockOpenThread = jest.fn();
const mockOpenDrawer = jest.fn();
let mockMessagesState = {};

jest.mock("../lib/notificationsApi", () => ({
  notificationsApi: {
    getNotifications: jest.fn(),
  },
}));

jest.mock("../lib/authApi", () => ({
  authApi: {
    getSession: () => ({ user: { id: "patient-user-test" } }),
  },
}));

jest.mock("../messages/MessagesProvider", () => ({
  useMessages: () => ({
    openThread: mockOpenThread,
    openDrawer: mockOpenDrawer,
    unreadByContact: {},
    ...mockMessagesState,
  }),
}));

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  jest.clearAllMocks();
  localStorage.clear();
  mockMessagesState = {};
});

function notification(overrides = {}) {
  return {
    id: "lab-lab-1",
    type: "lab",
    title: "New lab result",
    body: "",
    created_at: new Date(Date.now() - 1000).toISOString(),
    nav: "labs",
    data: { lab_result_id: "lab-1" },
    ...overrides,
  };
}

describe("NotificationBell", () => {
  test("clears the badge when opened but keeps unhandled dots", async () => {
    localStorage.setItem(
      "healthnest.notificationsSeenAt.patient-user-test",
      String(Date.now() - 2000),
    );
    notificationsApi.getNotifications.mockResolvedValue([notification()]);

    render(<NotificationBell />);

    const bell = await screen.findByLabelText("Notifications (1 new)");
    fireEvent.click(bell);

    await waitFor(() => {
      expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Unread notification")).toBeInTheDocument();
  });

  test("clicking a notification clears its unhandled dot", async () => {
    notificationsApi.getNotifications.mockResolvedValue([notification()]);

    render(<NotificationBell />);

    fireEvent.click(await screen.findByLabelText(/Notifications/));
    expect(screen.getByLabelText("Unread notification")).toBeInTheDocument();

    fireEvent.click(screen.getByText("New lab result"));
    fireEvent.click(screen.getByLabelText("Notifications"));

    await waitFor(() => {
      expect(screen.queryByLabelText("Unread notification")).not.toBeInTheDocument();
    });
  });

  test("appointment notifications open the appointment detail page", async () => {
    const onNavigate = jest.fn();
    window.addEventListener("hn:navigate", onNavigate);
    notificationsApi.getNotifications.mockResolvedValue([
      notification({
        id: "appt-appt-123",
        type: "appointment",
        title: "Appointment booked with Dr. Elena Chen",
        nav: "appointments",
        data: { appointmentId: "appt-123" },
      }),
    ]);

    render(<NotificationBell />);

    fireEvent.click(await screen.findByLabelText(/Notifications/));
    fireEvent.click(screen.getByText("Appointment booked with Dr. Elena Chen"));

    expect(onNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          page: "appointment-detail",
          data: expect.objectContaining({ appointmentId: "appt-123" }),
        },
      }),
    );

    window.removeEventListener("hn:navigate", onNavigate);
  });

  test("provider appointment notifications focus the schedule appointment", async () => {
    const onNavigate = jest.fn();
    window.addEventListener("hn:navigate", onNavigate);
    notificationsApi.getNotifications.mockResolvedValue([
      notification({
        id: "appt-appt-456",
        type: "appointment",
        title: "New appointment with Maya Rivera",
        nav: "schedule",
        data: {
          appointmentId: "appt-456",
          available_date: "2099-01-15",
        },
      }),
    ]);

    render(<NotificationBell />);

    fireEvent.click(await screen.findByLabelText(/Notifications/));
    fireEvent.click(screen.getByText("New appointment with Maya Rivera"));

    expect(onNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          page: "schedule",
          data: expect.objectContaining({
            appointmentId: "appt-456",
            available_date: "2099-01-15",
          }),
        },
      }),
    );

    window.removeEventListener("hn:navigate", onNavigate);
  });

  test("message dots follow message unread state", async () => {
    mockMessagesState = {
      unreadByContact: { "provider-user-chen": 2 },
    };
    notificationsApi.getNotifications.mockResolvedValue([
      notification({
        id: "msg-msg-1",
        type: "message",
        title: "New message from Dr. Chen",
        contact_id: "provider-user-chen",
        nav: undefined,
        data: undefined,
      }),
    ]);

    const { unmount } = render(<NotificationBell />);
    fireEvent.click(await screen.findByLabelText(/Notifications/));
    expect(screen.getByLabelText("Unread notification")).toBeInTheDocument();

    unmount();
    cleanup();
    mockMessagesState = {
      unreadByContact: { "provider-user-chen": 0 },
    };

    render(<NotificationBell />);
    fireEvent.click(await screen.findByLabelText(/Notifications/));

    await waitFor(() => {
      expect(screen.queryByLabelText("Unread notification")).not.toBeInTheDocument();
    });
  });

  test("clears the badge for database UTC timestamps", async () => {
    jest.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 6, 23, 23, 15, 1));
    localStorage.setItem(
      "healthnest.notificationsSeenAt.patient-user-test",
      String(Date.UTC(2026, 6, 23, 23, 14, 59)),
    );
    notificationsApi.getNotifications.mockResolvedValue([
      notification({
        created_at: "2026-07-23 23:15:00",
      }),
    ]);

    render(<NotificationBell />);

    fireEvent.click(await screen.findByLabelText("Notifications (1 new)"));
    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Notifications"));

    await waitFor(() => {
      expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
    });
  });
});
