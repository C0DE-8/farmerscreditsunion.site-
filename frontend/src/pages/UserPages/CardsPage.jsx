import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiSettings,
  FiShield,
} from "react-icons/fi";
import axiosInstance from "../../api/axios";
import MobileFooterNav from "../../components/Dashboard/MobileFooterNav";
import UserSettingsDrawer from "../../components/Dashboard/UserSettingsDrawer";
import GlassToast, { useGlassToast } from "../../components/Toast/GlassToast";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import styles from "./FinancePages.module.css";

const requestTypes = [
  { key: "savings", label: "Savings card" },
  { key: "current", label: "Current card" },
];

const statusLabel = {
  approved: "Approved",
  pending: "Pending review",
  rejected: "Rejected",
};

export default function CardsPage() {
  const navigate = useNavigate();
  const { userUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toasts, notify, dismissToast } = useGlassToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cards, setCards] = useState([]);
  const [profile, setProfile] = useState(userUser);
  const [bankName, setBankName] = useState("Stercxa Bank");
  const [loading, setLoading] = useState(true);
  const [submittingType, setSubmittingType] = useState("");

  const displayName = profile?.full_name || profile?.username || "User";
  const currencySign = profile?.currency_sign || "$";

  const loadPage = async () => {
    try {
      setLoading(true);
      const [profileRes, cardRes, bankRes] = await Promise.allSettled([
        axiosInstance.get("/user/profile"),
        axiosInstance.get("/user/atm-card-info"),
        axiosInstance.get("/user/settings/bank-name"),
      ]);

      if (profileRes.status === "fulfilled") setProfile(profileRes.value.data?.user || userUser);
      if (cardRes.status === "fulfilled") setCards(cardRes.value.data?.cards || []);
      if (bankRes.status === "fulfilled") setBankName(bankRes.value.data?.bank_name || "Stercxa Bank");
    } catch {
      notify("Unable to load your cards right now.", "error", "Cards unavailable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const requestCard = async (accountType) => {
    try {
      setSubmittingType(accountType);
      const res = await axiosInstance.post("/user/request-atm-card", {
        account_type: accountType,
      });
      notify(res.data?.message || "Card request submitted.", "success", "Request sent");
      await loadPage();
    } catch (error) {
      notify(error?.response?.data?.error || "Failed to request card.", "error", "Request failed");
    } finally {
      setSubmittingType("");
    }
  };

  const cardsByType = useMemo(() => {
    const grouped = { savings: [], current: [] };
    cards.forEach((card) => {
      if (grouped[card.account_type]) grouped[card.account_type].push(card);
    });
    return grouped;
  }, [cards]);

  const requestAvailability = useMemo(() => {
    return requestTypes.map((item) => {
      const existing = (cardsByType[item.key] || []).some((card) =>
        ["pending", "approved"].includes(card.status)
      );
      return { ...item, blocked: existing };
    });
  }, [cardsByType]);

  const primaryCards = useMemo(() => {
    return requestTypes
      .map((item) => {
        const matching = cardsByType[item.key] || [];
        const approved = matching.find((card) => card.status === "approved");
        return approved || matching[0] || null;
      })
      .filter(Boolean);
  }, [cardsByType]);

  const formatCardNumber = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const maskCardNumber = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "•••• •••• •••• ••••";
    const masked = `${"•".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
    return masked.replace(/(.{4})(?=.)/g, "$1 ").trim();
  };

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
            <span><FiCreditCard /></span>
            <h1>Cards</h1>
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

        <section className={styles.heroPanel}>
          <div>
            <span className={styles.eyebrow}>Card centre</span>
            <h2>Manage your debit cards</h2>
            <p>Request a new card for your Savings or Current account and track approval status.</p>
          </div>
          <div className={styles.heroMeta}>
            <FiShield />
            <span>Admin approval required</span>
          </div>
        </section>

        {loading ? (
          <div className={styles.preloaderBlock}>
            <span />
            <strong>Loading cards...</strong>
          </div>
        ) : (
          <>
            <section className={styles.cardDeck}>
              {primaryCards.length ? (
                primaryCards.map((card) => (
                  <article className={styles.bankCard} key={`${card.account_type}-${card.card_number}`}>
                    <div className={styles.cardWorld} />
                    <div className={styles.cardInner}>
                      <header className={styles.bankCardHeader}>
                        <div className={styles.bankBrand}>
                          <div className={styles.bankLogoMark}>
                            <span>{bankName.slice(0, 2).toUpperCase()}</span>
                          </div>
                          <div>
                            <strong>{bankName}</strong>
                            <small>{card.account_type === "savings" ? "Savings Debit" : "Current Debit"}</small>
                          </div>
                        </div>
                        <span className={`${styles.cardStatus} ${styles[`cardStatus${card.status}`] || ""}`}>
                          {statusLabel[card.status] || card.status}
                        </span>
                      </header>

                      <div className={styles.cardChip} />
                      <div className={styles.cardNumber}>{card.status === "approved" ? formatCardNumber(card.card_number) : maskCardNumber(card.card_number)}</div>

                      <footer className={styles.bankCardFooter}>
                        <div>
                          <span>Card holder</span>
                          <strong>{card.card_holder_name || displayName}</strong>
                        </div>
                        <div>
                          <span>Expires</span>
                          <strong>{card.expiry_date || "--/--"}</strong>
                        </div>
                      </footer>
                    </div>
                  </article>
                ))
              ) : (
                <article className={styles.cardPlaceholder}>
                  <FiCreditCard />
                  <strong>No card issued yet</strong>
                  <p>Request a card below. The request will remain pending until an admin approves it.</p>
                </article>
              )}
            </section>

            <section className={styles.gridTwo}>
              {requestAvailability.map((item) => (
                <article className={styles.actionGlassCard} key={item.key}>
                  <div>
                    <span className={styles.eyebrow}>{item.label}</span>
                    <strong>{item.key === "savings" ? "Linked to your savings balance" : "Linked to your daily spending account"}</strong>
                    <small>Card request fee is deducted immediately from the selected account.</small>
                  </div>
                  <button
                    type="button"
                    disabled={item.blocked || submittingType === item.key}
                    onClick={() => requestCard(item.key)}
                  >
                    {submittingType === item.key ? "Submitting..." : item.blocked ? "Already requested" : "Request card"}
                  </button>
                </article>
              ))}
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <h2>Card activity</h2>
                  <p>Every request, approved card, and processing item on your account.</p>
                </div>
              </div>

              {cards.length === 0 ? (
                <p className={styles.empty}>No card activity yet.</p>
              ) : (
                <div className={styles.listStack}>
                  {cards.map((card) => (
                    <article className={styles.statementRow} key={`${card.account_type}-${card.card_number}-${card.requested_at}`}>
                      <span className={styles.statementIcon}>
                        {card.status === "approved" ? <FiCheckCircle /> : <FiClock />}
                      </span>
                      <div>
                        <strong>{card.account_type === "savings" ? "Savings Debit Card" : "Current Debit Card"}</strong>
                        <small>{maskCardNumber(card.card_number)} • Requested {card.requested_at || "Recently"}</small>
                      </div>
                      <div className={styles.rowRight}>
                        <b>{currencySign}{Number(card.fee || 0).toFixed(2)}</b>
                        <small>{statusLabel[card.status] || card.status}</small>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>

      <MobileFooterNav />
      <GlassToast toasts={toasts} onDismiss={dismissToast} />
      <UserSettingsDrawer
        open={settingsOpen}
        user={profile}
        displayName={displayName}
        theme={theme}
        onClose={() => setSettingsOpen(false)}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
      />
    </main>
  );
}
