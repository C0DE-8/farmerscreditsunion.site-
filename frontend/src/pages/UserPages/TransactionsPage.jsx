import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiSend, FiSettings } from "react-icons/fi";
import axiosInstance from "../../api/axios";
import MobileFooterNav from "../../components/Dashboard/MobileFooterNav";
import UserSettingsDrawer from "../../components/Dashboard/UserSettingsDrawer";
import CustomSelect from "../../components/Form/CustomSelect";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import styles from "./UserPage.module.css";

const DRAFT_KEY = "userTransferDraft";

const transferTypes = [
  { key: "local", label: "Local" },
  { key: "wire", label: "Wire" },
];

const accountOptions = [
  { value: "current", label: "Current Account" },
  { value: "savings", label: "Savings Account" },
];

const initialForm = {
  from_account: "current",
  bank_name: "",
  account_name: "",
  account_number: "",
  bank_country: "",
  routine_number: "",
  reason: "",
  amount: "",
  pin: "",
  imf_code: "",
  cot_code: "",
  tax_code: "",
};

export default function TransactionsPage() {
  const navigate = useNavigate();
  const { userUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [active, setActive] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}")?.active || "local";
    } catch {
      return "local";
    }
  });
  const [step, setStep] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}")?.step || 1;
    } catch {
      return 1;
    }
  });
  const [startX, setStartX] = useState(null);
  const [form, setForm] = useState(() => {
    try {
      return { ...initialForm, ...(JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}")?.form || {}) };
    } catch {
      return initialForm;
    }
  });
  const [requirements, setRequirements] = useState({ imf: true, cot: true, tax: true });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axiosInstance
      .get("/user/security-codes/requirements")
      .then((res) => setRequirements(res.data?.requirements || requirements))
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ active, step, form }));
  }, [active, step, form]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const changeType = (type) => {
    setActive(type);
    setMessage("");
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setForm(initialForm);
    setStep(1);
    setActive("local");
  };

  const submit = async (event) => {
    event.preventDefault();
    const endpoint = active === "local" ? "/user/transfer/local/initiate" : "/user/transfer/wire/initiate";

    const payload = { ...form };
    if (active === "local") {
      delete payload.bank_country;
      delete payload.routine_number;
      delete payload.imf_code;
      delete payload.cot_code;
      delete payload.tax_code;
    }

    try {
      setSubmitting(true);
      setMessage("");
      const res = await axiosInstance.post(endpoint, payload);
      localStorage.removeItem(DRAFT_KEY);
      if (res.data?.transfer_id) {
        navigate(`/transfer/${res.data.transfer_id}`, {
          state: { message: "Transfer completed." },
        });
        return;
      }
      setMessage("Transfer completed.");
    } catch (error) {
      setMessage(error?.response?.data?.error || "Transfer failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const swipeTab = (endX) => {
    if (startX === null) return;
    const delta = startX - endX;
    if (Math.abs(delta) > 38) setActive((current) => (current === "local" ? "wire" : "local"));
    setStartX(null);
  };

  const canContinueFromBeneficiary =
    form.bank_name.trim() && form.account_name.trim() && form.account_number.trim();
  const canReview =
    form.from_account &&
    form.amount &&
    (active === "local" || (form.bank_country && form.routine_number && form.reason));
  const canSubmit = canReview && form.pin;
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
            <span><FiSend /></span>
            <h1>Transactions</h1>
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

        <div className={styles.segmentedTwo} aria-label="Transfer type">
          {transferTypes.map((type) => (
            <button
              type="button"
              className={active === type.key ? styles.activeSegment : ""}
              onClick={() => changeType(type.key)}
              key={type.key}
            >
              {type.label}
            </button>
          ))}
        </div>

        <section
          className={styles.panel}
          onTouchStart={(event) => setStartX(event.touches[0].clientX)}
          onTouchEnd={(event) => swipeTab(event.changedTouches[0].clientX)}
        >
          <div className={styles.panelHead}>
            <h2>{active === "local" ? "Local Transfer" : "Wire Transfer"}</h2>
            <button type="button" onClick={() => navigate("/transaction-history")}>History</button>
          </div>

          <div className={styles.transferSteps} aria-label="Transfer steps">
            {["Beneficiary", "Amount", "PIN", "Review"].map((label, index) => (
              <button
                type="button"
                className={step === index + 1 ? styles.activeStep : ""}
                onClick={() => setStep(index + 1)}
                key={label}
              >
                <span>{index + 1}</span>
                {label}
              </button>
            ))}
          </div>

          <div className={styles.draftNotice}>
            <strong>Draft saved</strong>
            <button type="button" onClick={clearDraft}>Clear</button>
          </div>

          <form className={styles.formGrid} onSubmit={submit}>
            {step === 1 && (
              <section className={styles.transferModule}>
                <h3>Beneficiary details</h3>
                <p>Enter the receiving bank and account information.</p>
                <label>
                  Bank name
                  <input value={form.bank_name} onChange={(e) => updateField("bank_name", e.target.value)} required />
                </label>
                <label>
                  Account name
                  <input value={form.account_name} onChange={(e) => updateField("account_name", e.target.value)} required />
                </label>
                <label>
                  Account number
                  <input value={form.account_number} onChange={(e) => updateField("account_number", e.target.value)} required />
                </label>
                <div className={styles.formActions}>
                  <button type="button" disabled={!canContinueFromBeneficiary} onClick={() => setStep(2)}>Continue</button>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className={styles.transferModule}>
                <h3>Amount and security</h3>
                <p>Select the source account and transfer amount.</p>
                <CustomSelect
                  label="From account"
                  value={form.from_account}
                  options={accountOptions}
                  onChange={(value) => updateField("from_account", value)}
                />
                {active === "wire" && (
                  <>
                    <label>
                      Bank country
                      <input value={form.bank_country} onChange={(e) => updateField("bank_country", e.target.value)} required />
                    </label>
                    <label>
                      Routing number
                      <input value={form.routine_number} onChange={(e) => updateField("routine_number", e.target.value)} required />
                    </label>
                  </>
                )}
                <label>
                  Reason
                  <input value={form.reason} onChange={(e) => updateField("reason", e.target.value)} required={active === "wire"} />
                </label>
                <label>
                  Amount
                  <input type="number" min="1" value={form.amount} onChange={(e) => updateField("amount", e.target.value)} required />
                </label>
                {active === "wire" && requirements.imf && (
                  <label>
                    IMF code
                    <input value={form.imf_code} onChange={(e) => updateField("imf_code", e.target.value)} required />
                  </label>
                )}
                {active === "wire" && requirements.cot && (
                  <label>
                    COT code
                    <input value={form.cot_code} onChange={(e) => updateField("cot_code", e.target.value)} required />
                  </label>
                )}
                {active === "wire" && requirements.tax && (
                  <label>
                    TAX code
                    <input value={form.tax_code} onChange={(e) => updateField("tax_code", e.target.value)} required />
                  </label>
                )}
                <div className={styles.formActions}>
                  <button type="button" className={styles.secondaryAction} onClick={() => setStep(1)}>Back</button>
                  <button type="button" disabled={!canReview} onClick={() => setStep(3)}>Continue</button>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className={styles.transferModule}>
                <h3>Transaction PIN</h3>
                <p>Enter your transaction PIN to authorize this transfer.</p>
                <div className={styles.pinModule}>
                  <label>
                    PIN
                    <input type="password" inputMode="numeric" value={form.pin} onChange={(e) => updateField("pin", e.target.value)} required />
                  </label>
                </div>
                <div className={styles.formActions}>
                  <button type="button" className={styles.secondaryAction} onClick={() => setStep(2)}>Back</button>
                  <button type="button" disabled={!form.pin} onClick={() => setStep(4)}>Review</button>
                </div>
              </section>
            )}

            {step === 4 && (
              <section className={styles.transferModule}>
                <h3>Review transfer</h3>
                <p>Confirm the details before sending this {active} transfer.</p>
                <div className={styles.reviewGrid}>
                  <div><span>Type</span><strong>{active === "local" ? "Local" : "Wire"}</strong></div>
                  <div><span>From</span><strong>{form.from_account}</strong></div>
                  <div><span>Bank</span><strong>{form.bank_name || "Not set"}</strong></div>
                  <div><span>Beneficiary</span><strong>{form.account_name || "Not set"}</strong></div>
                  <div><span>Account</span><strong>{form.account_number || "Not set"}</strong></div>
                  <div><span>Amount</span><strong>{form.amount || "0"}</strong></div>
                </div>
                <div className={styles.formActions}>
                  <button type="button" className={styles.secondaryAction} onClick={() => setStep(3)}>Back</button>
                  <button type="submit" disabled={submitting || !canSubmit}>{submitting ? "Processing..." : `Send ${active === "local" ? "Local" : "Wire"} Transfer`}</button>
                </div>
              </section>
            )}
          </form>

          {message && <p className={styles.notice}>{message}</p>}
        </section>

        {submitting && (
          <div className={styles.preloaderOverlay}>
            <span />
            <strong>Processing transfer...</strong>
          </div>
        )}
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
