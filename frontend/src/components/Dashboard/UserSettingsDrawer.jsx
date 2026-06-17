import styles from "./UserSettingsDrawer.module.css";

export default function UserSettingsDrawer({
  open,
  user,
  displayName,
  theme,
  onClose,
  onToggleTheme,
  onLogout,
}) {
  if (!open) return null;

  const navItems = [
    { key: "Profile", title: "Profile", text: "Personal details and account profile" },
    { key: "Security", title: "Security", text: "Password, PIN, and verification settings" },
    { key: "Alerts", title: "Notifications", text: "Email and transaction alerts" },
    { key: "Support", title: "Support", text: "Tickets, messages, and help center" },
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside className={styles.drawer} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.user}>
            <div className={styles.avatar}>{displayName.charAt(0).toUpperCase()}</div>
            <div>
              <strong>{displayName}</strong>
              <span>{user?.email || "Personal banking"}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close settings">
            Close
          </button>
        </div>

        <nav className={styles.nav} aria-label="Settings navigation">
          {navItems.map((item) => (
            <button type="button" key={item.key}>
              <span>{item.key}</span>
              <div>
                <strong>{item.title}</strong>
                <small>{item.text}</small>
              </div>
            </button>
          ))}

          <button type="button" onClick={onToggleTheme}>
            <span>Theme</span>
            <div>
              <strong>{theme === "dark" ? "Light mode" : "Dark mode"}</strong>
              <small>Switch dashboard appearance</small>
            </div>
          </button>

          <button type="button" className={styles.logout} onClick={onLogout}>
            <span>Exit</span>
            <div>
              <strong>Logout</strong>
              <small>End this banking session</small>
            </div>
          </button>
        </nav>
      </aside>
    </div>
  );
}
