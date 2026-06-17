import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiCheck, FiClock, FiHome, FiList, FiSend } from "react-icons/fi";
import axiosInstance from "../../api/axios";
import MobileFooterNav from "../../components/Dashboard/MobileFooterNav";
import styles from "./UserPage.module.css";

export default function TransferDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const normalizedStatus = String(transfer?.status || "").replace(/_/g, " ");
  const isComplete = ["completed", "processing"].includes(String(transfer?.status || "").toLowerCase());

  useEffect(() => {
    let mounted = true;

    async function loadTransfer() {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/user/transfer/history/${id}`);
        if (mounted) setTransfer(res.data?.transfer || null);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.error || "Transfer not found.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTransfer();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <button type="button" onClick={() => navigate("/transactions")} aria-label="Back to transfers">
            <FiArrowLeft />
          </button>
          <div>
            <span><FiSend /></span>
            <h1>Transfer</h1>
          </div>
        </header>

        <section className={styles.panel}>
          {loading ? (
            <div className={styles.preloaderBlock}>
              <span />
              <strong>Loading transfer...</strong>
            </div>
          ) : error ? (
            <p className={styles.empty}>{error}</p>
          ) : (
            <>
              <article className={styles.receiptCard}>
                <div className={styles.receiptStatusIcon}>
                  {isComplete ? <FiCheck /> : <FiClock />}
                </div>
                <p className={styles.receiptEyebrow}>{location.state?.message || "Transfer details"}</p>
                <h2>{transfer.amount}</h2>
                <span className={styles.receiptStatus}>{normalizedStatus || "Submitted"}</span>

                <div className={styles.receiptRecipient}>
                  <span><FiSend /></span>
                  <div>
                    <small>Sent to</small>
                    <strong>{transfer.account_name || "Beneficiary"}</strong>
                    <p>{transfer.bank_name} · {transfer.account_number}</p>
                  </div>
                </div>

                <div className={styles.receiptMetaGrid}>
                  <div>
                    <small>Reference</small>
                    <strong>TRF-{transfer.id}</strong>
                  </div>
                  <div>
                    <small>Transfer type</small>
                    <strong>{transfer.type}</strong>
                  </div>
                  <div>
                    <small>Source</small>
                    <strong>{transfer.from_account}</strong>
                  </div>
                  <div>
                    <small>Date</small>
                    <strong>{transfer.date}</strong>
                  </div>
                </div>

                <div className={styles.receiptRows}>
                  <div><span>Fee</span><strong>{transfer.fee || "0"}</strong></div>
                  {transfer.reason && <div><span>Narration</span><strong>{transfer.reason}</strong></div>}
                  {transfer.bank_country && <div><span>Country</span><strong>{transfer.bank_country}</strong></div>}
                  {transfer.routine_number && <div><span>Routing number</span><strong>{transfer.routine_number}</strong></div>}
                </div>

                <div className={styles.receiptActions}>
                  <button type="button" onClick={() => navigate("/transactions")}><FiSend /> New transfer</button>
                  <button type="button" onClick={() => navigate("/transaction-history")}><FiList /> History</button>
                  <button type="button" onClick={() => navigate("/dashboard")}><FiHome /> Dashboard</button>
                </div>
              </article>
            </>
          )}
        </section>
      </section>

      <MobileFooterNav />
    </main>
  );
}
