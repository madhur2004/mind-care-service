// utils/notifications.js
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

export const showNotification = (title, options = {}) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/images/logo.png",
      badge: "/images/logo.png",
      ...options
    });
  }
};

// Daily reminder notification
export const scheduleDailyReminder = () => {
  // Check if notifications are enabled in settings
  const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
  if (!settings.notifications) return;

  // Daily 9 AM reminder
  const now = new Date();
  const reminderTime = new Date();
  reminderTime.setHours(9, 0, 0, 0);

  if (now > reminderTime) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  const timeUntilReminder = reminderTime.getTime() - now.getTime();

  setTimeout(() => {
    showNotification("🧠 Mental Wellness Reminder", {
      body: "Don't forget to log your mood and journal today!",
      requireInteraction: true
    });
    
    // Next day ke liye schedule karo
    scheduleDailyReminder();
  }, timeUntilReminder);
};