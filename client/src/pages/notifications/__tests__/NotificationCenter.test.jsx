import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import NotificationCenter from "../NotificationCenter";

vi.mock("socket.io-client", () => ({
  io: () => ({
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

vi.mock("../../../services/notificationService", () => ({
  default: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn().mockResolvedValue({ success: true, data: { unreadcount: 1 } }),
    markAsRead: vi.fn().mockResolvedValue({ success: true }),
    markAllAsRead: vi.fn().mockResolvedValue({ success: true }),
    deleteNotification: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock("../../../components/layout/Navbar", () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", name: "Alex" },
  }),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import notificationService from "../../../services/notificationService";

function renderNotifications() {
  return render(
    <MemoryRouter>
      <NotificationCenter />
    </MemoryRouter>
  );
}

describe("NotificationCenter Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders notifications header and filter buttons", async () => {
    notificationService.getNotifications.mockResolvedValueOnce({
      success: true,
      data: {
        notifications: [],
        total: 0,
        unreadCount: 0,
      },
    });
    notificationService.getUnreadCount.mockResolvedValueOnce({
      success: true,
      data: { unreadcount: 0 },
    });

    renderNotifications();

    expect(screen.getByRole("heading", { name: /notification center/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^all/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^unread/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/no notifications found/i)).toBeInTheDocument();
    });
  });

  it("renders list of notifications with titles and marks all as read", async () => {
    const user = userEvent.setup();
    notificationService.getNotifications.mockResolvedValueOnce({
      success: true,
      data: {
        notifications: [
          {
            _id: "notif-1",
            title: "Interview Scheduled",
            message: "You have a new interview on Friday.",
            type: "interview_scheduled",
            read: false,
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
        unreadCount: 1,
      },
    });
    notificationService.getUnreadCount.mockResolvedValue({
      success: true,
      data: { unreadcount: 1 },
    });
    notificationService.markAllAsRead.mockResolvedValueOnce({ success: true });

    renderNotifications();

    expect(await screen.findByText("Interview Scheduled")).toBeInTheDocument();
    expect(screen.getByText("You have a new interview on Friday.")).toBeInTheDocument();

    const markAllBtn = screen.getByRole("button", { name: /mark all as read/i });
    await user.click(markAllBtn);

    expect(notificationService.markAllAsRead).toHaveBeenCalled();
  });
});
