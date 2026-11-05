"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

function getNotificationIcon(type: string) {
  if (type === "message") return "💬";
  if (type === "product") return "📦";
  if (type === "account") return "👤";
  return "🔔";
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);

    const response = await fetch("/api/notifications");
    const data = await response.json();

    if (response.ok) {
      setNotifications(data.notifications || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function markAllAsRead() {
    setMarking(true);

    await fetch("/api/notifications/mark-all-read", {
      method: "POST",
    });

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        is_read: true,
      }))
    );

    setMarking(false);
  }

  const unreadCount = notifications.filter(
    (item) => !item.is_read
  ).length;

  return (
    <main className="page">
      <section className="notifications-page">
        <header className="notifications-top">
          <div className="notifications-title">
            <span className="mini-label">Stay updated</span>
            <h1>Notifications</h1>
            <p className="muted">
              Messages and important updates about your PadiMarket activity.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              className="pill ghost mark-read-button"
              onClick={markAllAsRead}
              disabled={marking}
            >
              {marking ? "Marking..." : "Mark all as read"}
            </button>
          )}
        </header>

        {loading ? (
          <div className="notifications-empty">
            <div className="empty-icon">🔔</div>
            <h2>Loading notifications...</h2>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="empty-icon">🔔</div>
            <h2>No notifications yet</h2>
            <p className="muted">
              When someone messages you or something important happens, it
              will appear here.
            </p>

            <div className="empty-actions">
              <Link href="/" className="pill primary">
                Back to home
              </Link>
            </div>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((item) => (
              <article
                key={item.id}
                className={`notification-item ${
                  item.is_read ? "read" : "unread"
                }`}
              >
                <div className="notification-icon">
                  {getNotificationIcon(item.type)}
                </div>

                <div className="notification-content">
                  <div className="notification-row">
                    <h3>{item.title}</h3>
                    {!item.is_read && (
                      <span className="unread-dot"></span>
                    )}
                  </div>

                  <p>{item.body}</p>
                  <span className="notification-date">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}