import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axiosInstance from "../../../api/axios";
import { DataTable, EmptyState, StatusBadge, TableSkeleton } from "../AdminPrimitives";
import styles from "../Admin.module.css";

export default function AdminDeposits() {
  const { notify } = useOutletContext();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDeposits = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/deposits");
      setDeposits(res.data?.deposits || []);
    } catch (error) {
      notify(error?.response?.data?.error || "Failed to load deposits", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeposits();
  }, []);

  const updateDeposit = async (id, action) => {
    try {
      const res = await axiosInstance.put(`/admin/deposit/${id}/${action}`);
      notify(res.data?.message || "Deposit updated", "success");
      loadDeposits();
    } catch (error) {
      notify(error?.response?.data?.error || "Failed to update deposit", "error");
    }
  };

  if (loading) return <TableSkeleton columns={8} rows={7} />;

  return (
    <section className={styles.panel}>
      <h2>Deposits</h2>
      <DataTable headers={["User", "Type", "Account", "Wallet", "Amount", "Status", "Proof", "Action"]}>
        {deposits.map((item) => (
          <div className={styles.tableRow} key={item.id} style={{ gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}>
            <span>
              <strong>{item.username}</strong>
              {item.email && <small>{item.email}</small>}
            </span>
            <span>{item.deposit_type === "fix_issue" ? "Fix issue" : "Top up"}</span>
            <span>{item.account_type || "current"}</span>
            <span>{item.wallet_name}</span>
            <span>{item.amount}</span>
            <span><StatusBadge status={item.status} /></span>
            <span>
              {item.proof_url ? <a href={item.proof_url} target="_blank" rel="noreferrer">Proof</a> : "No proof"}
              {item.note && <small>{item.note}</small>}
            </span>
            <span className={styles.inlineActions}>
              {item.status === "pending" ? (
                <>
                  <button onClick={() => updateDeposit(item.id, "confirm")}>Confirm</button>
                  <button onClick={() => updateDeposit(item.id, "reject")}>Reject</button>
                </>
              ) : (
                <small>{item.reviewed_at || "Reviewed"}</small>
              )}
            </span>
          </div>
        ))}
      </DataTable>
    </section>
  );
}
