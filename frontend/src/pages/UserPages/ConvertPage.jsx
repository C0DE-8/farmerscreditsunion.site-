import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiRepeat } from "react-icons/fi";
import axiosInstance from "../../api/axios";
import MobileFooterNav from "../../components/Dashboard/MobileFooterNav";
import CustomSelect from "../../components/Form/CustomSelect";
import styles from "./UserPage.module.css";

const accountOptions = [
  { value: "savings", label: "Savings Account" },
  { value: "current", label: "Current Account" },
];

export default function ConvertPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ from_account: "savings", to_account: "current", amount: "", pin: "" });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axiosInstance.get("/user/profile").then((res) => setProfile(res.data?.user || null)).catch(() => setProfile(null));
  }, []);

  const updateField = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "from_account") next.to_account = value === "savings" ? "current" : "savings";
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setMessage("");
      const res = await axiosInstance.post("/user/transfer/self", form);
      setMessage(res.data?.message || "Transfer completed.");
    } catch (error) {
      setMessage(error?.response?.data?.error || "Transfer failed.");
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
            <span><FiRepeat /></span>
            <h1>Convert</h1>
          </div>
        </header>

        <section className={styles.panel}>
          <div className={styles.balanceMiniGrid}>
            <div><span>Savings</span><strong>{profile?.currency_sign || ""}{Number(profile?.savings_balance || 0).toLocaleString()}</strong></div>
            <div><span>Current</span><strong>{profile?.currency_sign || ""}{Number(profile?.current_balance || 0).toLocaleString()}</strong></div>
          </div>

          <form className={styles.formGrid} onSubmit={submit}>
            <CustomSelect
              label="From account"
              value={form.from_account}
              options={accountOptions}
              onChange={(value) => updateField("from_account", value)}
            />
            <label>
              To account
              <input value={form.to_account === "savings" ? "Savings Account" : "Current Account"} readOnly />
            </label>
            <label>
              Amount
              <input type="number" min="1" value={form.amount} onChange={(e) => updateField("amount", e.target.value)} required />
            </label>
            <div className={styles.pinModule}>
              <label>
                Transaction PIN
                <input type="password" inputMode="numeric" value={form.pin} onChange={(e) => updateField("pin", e.target.value)} required />
              </label>
            </div>
            <button type="submit" disabled={submitting}>{submitting ? "Processing..." : "Convert Funds"}</button>
          </form>

          {message && <p className={styles.notice}>{message}</p>}
        </section>
      </section>

      <MobileFooterNav />
    </main>
  );
}
