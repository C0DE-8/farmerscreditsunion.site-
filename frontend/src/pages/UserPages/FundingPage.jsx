import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCopy, FiCreditCard, FiPlus, FiSettings, FiUploadCloud } from "react-icons/fi";
import axiosInstance from "../../api/axios";
import MobileFooterNav from "../../components/Dashboard/MobileFooterNav";
import UserSettingsDrawer from "../../components/Dashboard/UserSettingsDrawer";
import CustomSelect from "../../components/Form/CustomSelect";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import styles from "./UserPage.module.css";

const typeOptions = [
  { value: "topup_account", label: "Top up account" },
  { value: "fix_issue", label: "Fix an issue" },
];

const accountOptions = [
  { value: "current", label: "Current Account" },
  { value: "savings", label: "Savings Account" },
];

export default function FundingPage() {
  const navigate = useNavigate();
  const { userUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    deposit_type: "topup_account",
    account_type: "current",
    wallet_id: "",
    amount: "",
    note: "",
    proof: null,
  });

  const walletOptions = useMemo(
    () => wallets.map((wallet) => ({ value: String(wallet.id), label: wallet.wallet_name })),
    [wallets]
  );
  const selectedWallet = wallets.find((wallet) => String(wallet.id) === String(form.wallet_id));
  const displayName = userUser?.full_name || userUser?.username || "User";

  const loadData = async () => {
    try {
      setLoading(true);
      const [walletRes, depositsRes] = await Promise.all([
        axiosInstance.get("/user/wallets"),
        axiosInstance.get("/user/deposits"),
      ]);
      const nextWallets = walletRes.data?.wallets || [];
      setWallets(nextWallets);
      setDeposits(depositsRes.data?.deposits || []);
      setForm((current) => ({
        ...current,
        wallet_id: current.wallet_id || String(nextWallets[0]?.id || ""),
      }));
    } catch (error) {
      setMessage(error?.response?.data?.error || "Unable to load funding information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = () => {
    logout("user");
    navigate("/", { replace: true });
  };

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submitFunding = async (event) => {
    event.preventDefault();
    if (!form.proof) {
      setMessage("Upload payment proof before submitting.");
      return;
    }

    const payload = new FormData();
    payload.append("deposit_type", form.deposit_type);
    payload.append("account_type", form.account_type);
    payload.append("wallet_id", form.wallet_id);
    payload.append("amount", form.amount);
    payload.append("note", form.note);
    payload.append("proof", form.proof);

    try {
      setSubmitting(true);
      setMessage("");
      const res = await axiosInstance.post("/user/deposit", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(res.data?.message || "Funding request submitted.");
      setForm((current) => ({ ...current, amount: "", note: "", proof: null }));
      await loadData();
    } catch (error) {
      setMessage(error?.response?.data?.error || "Funding request failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <button type="button" onClick={() => navigate("/dashboard")} aria-label="Back to dashboard">
            <FiArrowLeft />
          </button>
          <div>
            <span><FiPlus /></span>
            <h1>Funding</h1>
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
          <div className={styles.panelHead}>
            <div>
              <h2>Add Money</h2>
              <p>Upload your payment proof and admin will approve the account funding.</p>
            </div>
          </div>

          {message && <p className={styles.notice}>{message}</p>}

          {loading ? (
            <div className={styles.preloaderBlock}>
              <span />
              <strong>Loading funding options...</strong>
            </div>
          ) : (
            <form className={styles.formGrid} onSubmit={submitFunding}>
              <CustomSelect
                label="Funding type"
                value={form.deposit_type}
                options={typeOptions}
                onChange={(value) => updateField("deposit_type", value)}
              />
              <CustomSelect
                label="Account"
                value={form.account_type}
                options={accountOptions}
                onChange={(value) => updateField("account_type", value)}
              />
              <CustomSelect
                label="Payment wallet"
                value={form.wallet_id}
                options={walletOptions.length ? walletOptions : [{ value: "", label: "No wallet available" }]}
                onChange={(value) => updateField("wallet_id", value)}
              />

              {selectedWallet && (
                <div className={styles.walletPreview}>
                  {selectedWallet.qrcode_url && <img src={selectedWallet.qrcode_url} alt={selectedWallet.wallet_name} />}
                  <div>
                    <span>{selectedWallet.wallet_name}</span>
                    <strong>{selectedWallet.wallet_address}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(selectedWallet.wallet_address)}
                    aria-label="Copy wallet address"
                  >
                    <FiCopy />
                  </button>
                </div>
              )}

              <label>
                Amount
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => updateField("amount", event.target.value)}
                  placeholder="0.00"
                  required
                />
              </label>

              <label>
                Note
                <textarea
                  value={form.note}
                  onChange={(event) => updateField("note", event.target.value)}
                  placeholder="Reference, payment detail, or issue description"
                  rows="4"
                />
              </label>

              <label className={styles.fileDrop}>
                <FiUploadCloud />
                <strong>{form.proof?.name || "Upload payment proof"}</strong>
                <small>Receipt, screenshot, or bank payment confirmation</small>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(event) => updateField("proof", event.target.files?.[0] || null)}
                  required
                />
              </label>

              <button type="submit" disabled={submitting || !walletOptions.length}>
                {submitting ? "Submitting..." : "Submit Funding"}
              </button>
            </form>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>Funding History</h2>
              <p>Track submitted deposit requests and admin decisions.</p>
            </div>
          </div>

          <div className={styles.transactionList}>
            {deposits.length === 0 ? (
              <p className={styles.empty}>No funding requests yet.</p>
            ) : (
              deposits.map((deposit) => (
                <div className={styles.transactionItem} key={deposit.id}>
                  <span className={styles.transactionIcon}><FiCreditCard /></span>
                  <div>
                    <strong>{deposit.deposit_type === "fix_issue" ? "Fix an issue" : "Top up account"}</strong>
                    <small>{deposit.account_type} account • {deposit.created_at}</small>
                  </div>
                  <b>{deposit.amount}</b>
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      {submitting && (
        <div className={styles.preloaderOverlay}>
          <span />
          <strong>Submitting funding...</strong>
        </div>
      )}

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
