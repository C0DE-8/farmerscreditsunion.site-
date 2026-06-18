import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCreditCard, FiFileText, FiMoreHorizontal, FiSettings } from "react-icons/fi";
import MobileFooterNav from "../../components/Dashboard/MobileFooterNav";
import UserSettingsDrawer from "../../components/Dashboard/UserSettingsDrawer";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import styles from "./UserPage.module.css";

const iconMap = {
  cards: <FiCreditCard />,
  transactions: <FiFileText />,
  settings: <FiSettings />,
  more: <FiMoreHorizontal />,
};

export default function UserPage({ type, title, description }) {
  const navigate = useNavigate();
  const { userUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const displayName = userUser?.full_name || userUser?.username || "User";

  const handleLogout = () => {
    logout("user");
    navigate("/", { replace: true });
  };

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <button type="button" onClick={() => navigate("/dashboard")} aria-label="Back to dashboard">
            <FiArrowLeft />
          </button>
          <div>
            <span>{iconMap[type]}</span>
            <h1>{title}</h1>
          </div>
          <button
            className={styles.mobileSettingsButton}
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
          >
            <FiSettings />
          </button>
        </header>

        <section className={styles.panel}>
          <h2>{title}</h2>
          <p>{description}</p>
        </section>
      </section>

      <MobileFooterNav />
      <UserSettingsDrawer
        open={settingsOpen}
        user={userUser}
        displayName={displayName}
        theme={theme}
        onClose={() => setSettingsOpen(false)}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
      />
    </main>
  );
}
