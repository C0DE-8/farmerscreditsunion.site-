import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiDownload, FiSend } from "react-icons/fi";
import axiosInstance from "../../api/axios";
import MobileFooterNav from "../../components/Dashboard/MobileFooterNav";
import styles from "./UserPage.module.css";

const tabs = [
  { key: "self", label: "Self" },
  { key: "local", label: "Local" },
  { key: "wire", label: "International" },
];

export default function TransactionHistoryPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState("self");
  const [startX, setStartX] = useState(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState({ self: [], local: [], wire: [] });

  useEffect(() => {
    let mounted = true;

    async function loadTransactions() {
      try {
        setLoading(true);
        const [selfRes, localRes, wireRes] = await Promise.allSettled([
          axiosInstance.get("/user/transfer/self/history"),
          axiosInstance.get("/user/transfer/history/local"),
          axiosInstance.get("/user/transfer/history/wire"),
        ]);

        if (!mounted) return;

        setItems({
          self: selfRes.status === "fulfilled" ? selfRes.value.data?.history || [] : [],
          local: localRes.status === "fulfilled" ? localRes.value.data?.history || [] : [],
          wire: wireRes.status === "fulfilled" ? wireRes.value.data?.wire_history || [] : [],
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTransactions();
    return () => {
      mounted = false;
    };
  }, []);

  const activeItems = useMemo(() => items[active] || [], [active, items]);
  const openTransfer = (item) => {
    navigate(`/transfer/${item.id}?kind=${active}`);
  };

  const changeTabBySwipe = (endX) => {
    if (startX === null) return;
    const delta = startX - endX;
    if (Math.abs(delta) < 38) return setStartX(null);
    const currentIndex = tabs.findIndex((tab) => tab.key === active);
    const nextIndex = delta > 0 ? Math.min(currentIndex + 1, tabs.length - 1) : Math.max(currentIndex - 1, 0);
    setActive(tabs[nextIndex].key);
    setStartX(null);
  };

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <button type="button" onClick={() => navigate("/dashboard")} aria-label="Back to dashboard">
            <FiArrowLeft />
          </button>
          <div>
            <span><FiDownload /></span>
            <h1>Transaction History</h1>
          </div>
        </header>

        <div className={styles.segmented} aria-label="Transaction history type">
          {tabs.map((tab) => (
            <button
              type="button"
              className={active === tab.key ? styles.activeSegment : ""}
              onClick={() => setActive(tab.key)}
              key={tab.key}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section
          className={styles.panel}
          onTouchStart={(event) => setStartX(event.touches[0].clientX)}
          onTouchEnd={(event) => changeTabBySwipe(event.changedTouches[0].clientX)}
        >
          <div className={styles.panelHead}>
            <h2>{tabs.find((tab) => tab.key === active)?.label} History</h2>
            <button type="button" onClick={() => navigate("/transactions")}>Send</button>
          </div>

          {loading ? (
            <p className={styles.empty}>Loading transactions...</p>
          ) : activeItems.length === 0 ? (
            <p className={styles.empty}>No {active} transactions yet.</p>
          ) : (
            <div className={styles.transactionList}>
              {activeItems.map((item) => (
                <button
                  type="button"
                  className={styles.transactionItem}
                  key={`${active}-${item.id}`}
                  onClick={() => openTransfer(item)}
                >
                  <span className={styles.transactionIcon}>
                    {active === "self" ? <FiDownload /> : <FiSend />}
                  </span>
                  <div>
                    <strong>{item.account_name || item.bank_name || `${item.from_account || "Account"} transfer`}</strong>
                    <small>{item.bank_name || item.to_account || item.reason || item.date || item.created_at}</small>
                  </div>
                  <b>{item.amount}</b>
                </button>
              ))}
            </div>
          )}
        </section>
      </section>

      <MobileFooterNav />
    </main>
  );
}
