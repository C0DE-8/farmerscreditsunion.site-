import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import styles from "./Admin.module.css";

const API_ORIGIN = "http://localhost:5000";

const resolveAsset = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
};

export default function Admin() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/admin/onboarding?status=${status}`);
      setApplications(res.data?.applications || []);
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to load onboarding applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [status]);

  const stats = useMemo(() => {
    const pending = applications.filter((item) => item.status === "pending").length;
    const approved = applications.filter((item) => item.status === "approved").length;
    const rejected = applications.filter((item) => item.status === "rejected").length;
    return { pending, approved, rejected, total: applications.length };
  }, [applications]);

  const approveApplication = async (id) => {
    try {
      setActionId(id);
      const res = await axiosInstance.post(`/admin/onboarding/${id}/approve`);
      alert(res.data?.message || "Application approved");
      fetchApplications();
    } catch (error) {
      alert(error?.response?.data?.error || "Approval failed");
    } finally {
      setActionId(null);
    }
  };

  const rejectApplication = async (id) => {
    const reason = window.prompt("Why is this onboarding being rejected?");
    if (!reason) return;

    try {
      setActionId(id);
      const res = await axiosInstance.post(`/admin/onboarding/${id}/reject`, { reason });
      alert(res.data?.message || "Application rejected");
      fetchApplications();
    } catch (error) {
      alert(error?.response?.data?.error || "Rejection failed");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Panel</h1>
          <p className={styles.subtitle}>Review customer onboarding before account numbers are issued.</p>
        </div>
        <div className={styles.adminName}>{user?.full_name || user?.username || "Admin"}</div>
      </div>

      <div className={styles.cards}>
        <div className={styles.card}>
          <h3>Visible Applications</h3>
          <p>{stats.total}</p>
        </div>

        <div className={styles.card}>
          <h3>Pending Review</h3>
          <p>{stats.pending}</p>
        </div>

        <div className={styles.card}>
          <h3>Approved</h3>
          <p>{stats.approved}</p>
        </div>

        <div className={styles.card}>
          <h3>Rejected</h3>
          <p>{stats.rejected}</p>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Onboarding Applications</h2>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>

        {loading ? (
          <div className={styles.emptyState}>Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className={styles.emptyState}>No onboarding applications found.</div>
        ) : (
          <div className={styles.applicationList}>
            {applications.map((application) => (
              <article className={styles.application} key={application.id}>
                <div className={styles.applicationMain}>
                  <div>
                    <div className={styles.nameLine}>
                      <h3>{application.full_name}</h3>
                      <span className={`${styles.status} ${styles[application.status]}`}>
                        {application.status}
                      </span>
                    </div>
                    <div className={styles.metaGrid}>
                      <span>Email: {application.email}</span>
                      <span>Username: {application.username}</span>
                      <span>Age: {application.age}</span>
                      <span>Work ID: {application.work_id}</span>
                      <span>ID: {application.id_type === "driver_license" ? "Driver license" : "Passport"}</span>
                      <span>Phone: {application.phone || "Not provided"}</span>
                      <span>Address: {application.address || "Not provided"}</span>
                      <span>Submitted: {new Date(application.created_at).toLocaleString()}</span>
                    </div>
                    {application.rejection_reason && (
                      <p className={styles.reason}>Reason: {application.rejection_reason}</p>
                    )}
                  </div>

                  {application.status === "pending" && (
                    <div className={styles.actions}>
                      <button
                        className={styles.approveBtn}
                        onClick={() => approveApplication(application.id)}
                        disabled={actionId === application.id}
                      >
                        Approve
                      </button>
                      <button
                        className={styles.rejectBtn}
                        onClick={() => rejectApplication(application.id)}
                        disabled={actionId === application.id}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.documents}>
                  <a href={resolveAsset(application.id_front_url)} target="_blank" rel="noreferrer">
                    <img src={resolveAsset(application.id_front_url)} alt="ID front" />
                    <span>ID front</span>
                  </a>
                  <a href={resolveAsset(application.id_back_url)} target="_blank" rel="noreferrer">
                    <img src={resolveAsset(application.id_back_url)} alt="ID back" />
                    <span>ID back</span>
                  </a>
                  <a href={resolveAsset(application.face_photo_url)} target="_blank" rel="noreferrer">
                    <img src={resolveAsset(application.face_photo_url)} alt="Face verification" />
                    <span>Face photo</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
