import { useEffect, useState } from "react";
import { FiMail, FiSend } from "react-icons/fi";
import { useOutletContext } from "react-router-dom";
import axiosInstance from "../../../api/axios";
import styles from "../Admin.module.css";

const initialForm = {
  to: "",
  subject: "",
  mode: "text",
  message: "",
};

export default function AdminEmail() {
  const { notify } = useOutletContext();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ configured: false, from: "" });
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    axiosInstance
      .get("/admin/gmail/status")
      .then((res) => setStatus(res.data || {}))
      .catch(() => setStatus({ configured: false, from: "" }));
  }, []);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const sendEmail = async (event) => {
    event.preventDefault();

    try {
      setSending(true);
      const payload = {
        to: form.to,
        subject: form.subject,
        text: form.mode === "text" ? form.message : "",
        html: form.mode === "html" ? form.message : "",
      };
      const res = await axiosInstance.post("/admin/gmail/send", payload);
      notify(res.data?.message || "Email sent successfully.", "success");
      setForm(initialForm);
    } catch (error) {
      notify(error?.response?.data?.error || "Failed to send email.", "error");
    } finally {
      setSending(false);
    }
  };

  const sendTestEmail = async () => {
    try {
      setTesting(true);
      const res = await axiosInstance.post("/admin/gmail/test", {
        to: form.to || status.from,
      });
      notify(res.data?.message || "Test email sent successfully.", "success");
    } catch (error) {
      notify(error?.response?.data?.error || "Failed to send test email.", "error");
    } finally {
      setTesting(false);
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.settingsHeader}>
        <div>
          <span className={styles.settingsEyebrow}><FiMail /> Gmail Mailer</span>
          <h2>Send Email</h2>
          <p>
            Send plain text or HTML emails from the configured Gmail account. The message is wrapped in the West Bridge Vault Reserve email header and footer.
          </p>
        </div>
        <button className={styles.secondaryBtn} type="button" onClick={sendTestEmail} disabled={testing || !status.configured}>
          <FiSend />
          {testing ? "Sending..." : "Send Test"}
        </button>
      </div>

      <div className={styles.mailerStatus}>
        <span className={status.configured ? styles.statusSuccess : styles.statusPending}>
          {status.configured ? "Configured" : "Not configured"}
        </span>
        <strong>{status.from || "Set GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env"}</strong>
      </div>

      <form className={styles.settingsForm} onSubmit={sendEmail}>
        <div className={styles.settingsFormGrid}>
          <label className={styles.field}>
            <span>Recipient email</span>
            <input
              value={form.to}
              onChange={(event) => updateField("to", event.target.value)}
              placeholder="customer@example.com"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Message type</span>
            <select value={form.mode} onChange={(event) => updateField("mode", event.target.value)}>
              <option value="text">Plain text</option>
              <option value="html">HTML</option>
            </select>
          </label>

          <label className={`${styles.field} ${styles.fieldFull}`}>
            <span>Subject</span>
            <input
              value={form.subject}
              onChange={(event) => updateField("subject", event.target.value)}
              placeholder="Email subject"
              required
            />
          </label>

          <label className={`${styles.field} ${styles.fieldFull}`}>
            <span>{form.mode === "html" ? "HTML message" : "Message"}</span>
            <textarea
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              placeholder={form.mode === "html" ? "<p>Your message here...</p>" : "Write your message here..."}
              rows={12}
              required
            />
          </label>
        </div>

        <div className={styles.formActions}>
          <button className={styles.secondaryBtn} type="button" onClick={() => setForm(initialForm)}>
            Clear
          </button>
          <button className={styles.secondaryBtn} type="submit" disabled={sending || !status.configured}>
            <FiSend />
            {sending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </form>
    </section>
  );
}
