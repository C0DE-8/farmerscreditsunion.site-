import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axiosInstance from "../../../api/axios";
import { DataTable, EmptyState, StatusBadge, TableSkeleton } from "../AdminPrimitives";
import styles from "../Admin.module.css";

export default function AdminLoans() {
  const { notify } = useOutletContext();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});

  const loadLoans = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/loans");
      setLoans(res.data?.loans || []);
    } catch (error) {
      notify(error?.response?.data?.error || "Failed to load loan applications", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const updateLoan = async (loanId, action) => {
    try {
      const res = await axiosInstance.put(`/admin/loans/${loanId}/${action}`, {
        review_note: notes[loanId] || "",
      });
      notify(res.data?.message || "Loan application updated", "success");
      loadLoans();
    } catch (error) {
      notify(error?.response?.data?.error || "Failed to update loan application", "error");
    }
  };

  if (loading) return <TableSkeleton columns={8} rows={7} />;

  return (
    <section className={styles.panel}>
      <h2>Loan Applications</h2>
      <DataTable headers={["Applicant", "Contact", "Service", "Amount", "Income", "Tenure", "Status", "Action"]}>
        {loans.map((loan) => (
          <div className={styles.tableRow} key={loan.id} style={{ gridTemplateColumns: "1.15fr 1fr 0.9fr 0.8fr 0.8fr 0.8fr 0.8fr 1.2fr" }}>
            <span>
              <strong>{loan.full_name}</strong>
              <small>{loan.gender} • {loan.marital_status}</small>
              <small>{loan.residential_address}</small>
            </span>
            <span>
              <strong>{loan.email}</strong>
              <small>{loan.mobile_number}</small>
              <small>SSN: {loan.ssn}</small>
            </span>
            <span>
              <strong>{loan.loan_service}</strong>
              <small>{loan.loan_purpose}</small>
            </span>
            <span>${Number(loan.loan_amount || 0).toLocaleString()}</span>
            <span>${Number(loan.annual_income || 0).toLocaleString()}</span>
            <span>{loan.payment_tenure}</span>
            <span><StatusBadge status={loan.status} /></span>
            <span className={styles.inlineActions}>
              <textarea
                className={styles.inlineNote}
                rows="2"
                placeholder="Review note"
                value={notes[loan.id] ?? loan.review_note ?? ""}
                onChange={(event) => setNotes((current) => ({ ...current, [loan.id]: event.target.value }))}
              />
              {loan.status === "pending" ? (
                <>
                  <button onClick={() => updateLoan(loan.id, "approve")}>Approve</button>
                  <button onClick={() => updateLoan(loan.id, "reject")}>Reject</button>
                </>
              ) : (
                <small>{loan.reviewed_at || "Reviewed"}</small>
              )}
            </span>
          </div>
        ))}
      </DataTable>
    </section>
  );
}
