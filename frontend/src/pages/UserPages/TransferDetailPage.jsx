import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowDownLeft,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiHelpCircle,
  FiSend,
  FiX,
} from "react-icons/fi";
import axiosInstance from "../../api/axios";
import MobileFooterNav from "../../components/Dashboard/MobileFooterNav";
import GlassToast, { useGlassToast } from "../../components/Toast/GlassToast";
import styles from "./UserPage.module.css";

export default function TransferDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toasts, notify, dismissToast } = useGlassToast();
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const transferKind = new URLSearchParams(location.search).get("kind") || "local";

  useEffect(() => {
    let mounted = true;

    async function loadTransfer() {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/user/transfer/history/${id}?kind=${transferKind}`);
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
  }, [id, transferKind]);

  const normalizedStatus = String(transfer?.status || "").replace(/_/g, " ");
  const heroLabel = useMemo(() => {
    if (transferKind === "self") return "Transfer between your accounts";
    if (String(transfer?.status || "").toLowerCase() === "completed") return "Transfer completed";
    if (String(transfer?.status || "").toLowerCase() === "pending_admin") return "Waiting for bank review";
    if (String(transfer?.status || "").toLowerCase() === "processing") return "Transfer is processing";
    return "Transfer details";
  }, [transfer, transferKind]);
  const amountLabel = transfer?.amount || "$0.00";
  const completed = ["completed", "processing"].includes(String(transfer?.status || "").toLowerCase());
  const summaryRows = [
    { label: transferKind === "self" ? "Transfer amount" : "Amount", value: amountLabel },
    { label: transferKind === "self" ? "To account" : transferKind === "wire" ? "Beneficiary bank" : "Recipient", value: transferKind === "self" ? transfer?.to_account : transfer?.account_name || transfer?.bank_name || "Beneficiary" },
    { label: transferKind === "self" ? "Source account" : "Sender's bank", value: transferKind === "self" ? transfer?.from_account : transfer?.bank_name || "West Bridge Vault Reserve" },
  ];
  const moreRows = [
    transfer?.account_number ? { label: transferKind === "self" ? "Account route" : "Account number", value: transfer.account_number, copy: true } : null,
    transfer?.routine_number ? { label: "Routing number", value: transfer.routine_number, copy: true } : null,
    transfer?.bank_country ? { label: "Country", value: transfer.bank_country } : null,
    { label: "Reference code", value: `TRF-${transfer?.id || id}`, copy: true },
    transfer?.fee ? { label: "Fee", value: transfer.fee } : null,
    transfer?.from_account ? { label: "From account", value: transfer.from_account } : null,
    transfer?.reason ? { label: "Narration", value: transfer.reason } : null,
  ].filter(Boolean);
  const timeline = useMemo(() => {
    const stamp = transfer?.date || "";
    const status = String(transfer?.status || "").toLowerCase();
    const steps = [
      {
        title: "Transaction initiated",
        text: transferKind === "self" ? "Your internal transfer request was created." : "Your transfer request was submitted.",
        done: true,
        time: stamp,
      },
      {
        title: "Processing payment",
        text: transferKind === "self" ? "The transfer was checked and routed between your accounts." : "We're confirming and posting your transfer.",
        done: ["processing", "completed", "pending_admin"].includes(status),
        time: stamp,
      },
      {
        title: status === "pending_admin" ? "Awaiting approval" : "Payment complete",
        text: status === "pending_admin" ? "This transfer is waiting for admin confirmation." : "Your transaction record has been posted successfully.",
        done: status !== "pending_admin",
        time: stamp,
      },
    ];
    return steps;
  }, [transfer, transferKind]);

  const copyValue = async (value) => {
    try {
      await navigator.clipboard.writeText(String(value));
      notify("Copied to clipboard.", "success", "Copied");
    } catch {
      notify("Unable to copy that field right now.", "error", "Copy failed");
    }
  };

  const shareReceipt = async (mode) => {
    const body = [
      `Reference: TRF-${transfer?.id || id}`,
      `Amount: ${amountLabel}`,
      `Status: ${normalizedStatus || "submitted"}`,
      `Beneficiary: ${transfer?.account_name || transfer?.bank_name || "Beneficiary"}`,
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Transaction Receipt",
          text: `${mode === "pdf" ? "PDF" : "Image"} receipt\n${body}`,
        });
      } else {
        await navigator.clipboard.writeText(body);
      }
      setShareOpen(false);
      notify("Transaction receipt prepared for sharing.", "success", "Share ready");
    } catch {
      notify("Sharing was cancelled.", "info", "Share closed");
    }
  };

  return (
    <main className={styles.page}>
      <GlassToast toasts={toasts} onDismiss={dismissToast} />

      <section className={styles.shell}>
        <header className={`${styles.header} ${styles.receiptHeader}`}>
          <button type="button" onClick={() => navigate("/transaction-history")} aria-label="Back to history">
            <FiArrowLeft />
          </button>
          <button type="button" onClick={() => setShareOpen(true)} aria-label="Open receipt help">
            <FiHelpCircle />
          </button>
        </header>

        <section className={`${styles.panel} ${styles.receiptHeroPanel}`}>
          {loading ? (
            <div className={styles.preloaderBlock}>
              <span />
              <strong>Loading transfer...</strong>
            </div>
          ) : error ? (
            <p className={styles.empty}>{error}</p>
          ) : (
            <article className={styles.receiptStoryCard}>
              <div className={styles.receiptHeroMark}>
                <span className={styles.receiptHeroIcon}>
                  {transferKind === "self" ? <FiSend /> : completed ? <FiArrowDownLeft /> : <FiArrowRight />}
                </span>
              </div>
              <h2>{amountLabel}</h2>
              <p className={styles.receiptHeroLabel}>{heroLabel}</p>
              <small className={styles.receiptHeroDate}>{transfer?.date}</small>
            </article>
          )}
        </section>

        {!loading && !error && transfer ? (
          <>
            <section className={`${styles.panel} ${styles.receiptDetailPanel}`}>
              <div className={styles.receiptSectionHead}>
                <h2>Transaction details</h2>
              </div>

              <div className={styles.receiptDetailRows}>
                <div>
                  <span>Status</span>
                  <strong className={styles.receiptStatusPill}>{normalizedStatus || "Submitted"}</strong>
                </div>
                {summaryRows.map((row) => (
                  <div key={row.label}>
                    <span>{row.label}</span>
                    <strong>{row.value}</strong>
                  </div>
                ))}
                {showMore &&
                  moreRows.map((row) => (
                    <div key={row.label}>
                      <span>{row.label}</span>
                      <strong>
                        {row.value}
                        {row.copy ? (
                          <button type="button" className={styles.inlineCopyButton} onClick={() => copyValue(row.value)} aria-label={`Copy ${row.label}`}>
                            <FiCopy />
                          </button>
                        ) : null}
                      </strong>
                    </div>
                  ))}
              </div>

              <button
                type="button"
                className={styles.receiptExpandButton}
                onClick={() => setShowMore((current) => !current)}
              >
                <span>{showMore ? "See less" : "See more"}</span>
                {showMore ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </section>

            <section className={`${styles.panel} ${styles.receiptTimelinePanel}`}>
              <div className={styles.receiptSectionHead}>
                <h2>Timeline</h2>
              </div>
              <div className={styles.timelineList}>
                {timeline.map((step, index) => (
                  <div className={styles.timelineItem} key={`${step.title}-${index}`}>
                    <span className={`${styles.timelineDot} ${step.done ? styles.timelineDotDone : ""}`}>
                      {step.done ? <FiCheck /> : ""}
                    </span>
                    {index !== timeline.length - 1 ? <span className={styles.timelineLine} /> : null}
                    <div className={styles.timelineBody}>
                      <strong>{step.title}</strong>
                      <p>{step.text}</p>
                      <small>{step.time}</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <button type="button" className={styles.receiptShareButton} onClick={() => setShareOpen(true)}>
              Share Transaction Receipt
            </button>
          </>
        ) : null}
      </section>

      {shareOpen ? (
        <div className={styles.selectionSheetOverlay} onClick={() => setShareOpen(false)}>
          <div className={styles.selectionSheet} onClick={(event) => event.stopPropagation()}>
            <div className={styles.selectionSheetHeader}>
              <strong>Share Transaction Receipt</strong>
              <button type="button" className={styles.selectionCloseButton} onClick={() => setShareOpen(false)} aria-label="Close share options">
                <FiX />
              </button>
            </div>
            <div className={styles.selectionSheetList}>
              <button type="button" className={`${styles.selectionSheetItem} ${styles.selectionSheetItemActive}`} onClick={() => shareReceipt("image")}>
                <span className={styles.selectionSheetItemDot} />
                <strong>Share as image</strong>
                <span className={styles.selectionSheetCheck}>✓</span>
              </button>
              <button type="button" className={styles.selectionSheetItem} onClick={() => shareReceipt("pdf")}>
                <span className={styles.selectionSheetItemDot} />
                <strong>Share as PDF</strong>
                <span className={styles.selectionSheetCheck} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <MobileFooterNav />
    </main>
  );
}
