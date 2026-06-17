import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axios";
import GlassToast, { useGlassToast } from "../../components/Toast/GlassToast";
import { useAuth } from "../../context/AuthContext";
import styles from "./Admin.module.css";

const API_ORIGIN = "http://localhost:5000";

const resolveAsset = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
};

const sections = [
  { id: "overview", label: "Overview" },
  { id: "onboarding", label: "Onboarding" },
  { id: "users", label: "Users" },
  { id: "transfers", label: "Transfers" },
  { id: "deposits", label: "Deposits" },
  { id: "tickets", label: "Tickets" },
  { id: "wallets", label: "Wallets" },
  { id: "settings", label: "Settings" },
];

const emptyData = {
  applications: [],
  users: [],
  transfers: [],
  deposits: [],
  tickets: [],
  wallets: [],
  settings: null,
  fees: {},
};

export default function Admin() {
  const { adminUser, logout } = useAuth();
  const { toasts, notify, dismissToast } = useGlassToast();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("overview");
  const [onboardingStatus, setOnboardingStatus] = useState("pending");
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState("");

  const setPartialData = (patch) => {
    setData((current) => ({ ...current, ...patch }));
  };

  const request = async (fn, fallbackMessage) => {
    try {
      return await fn();
    } catch (error) {
      notify(error?.response?.data?.error || fallbackMessage, "error");
      return null;
    }
  };

  const fetchOverview = async () => {
    setLoading(true);
    const [
      onboardingRes,
      usersRes,
      transfersRes,
      depositsRes,
      ticketsRes,
      walletsRes,
      settingsRes,
      feeRes,
    ] = await Promise.allSettled([
      axiosInstance.get("/admin/onboarding?status=all"),
      axiosInstance.get("/admin/users?pageSize=100"),
      axiosInstance.get("/admin/all-transfers"),
      axiosInstance.get("/admin/deposits"),
      axiosInstance.get("/admin/tickets"),
      axiosInstance.get("/admin/wallets"),
      axiosInstance.get("/admin/security-codes/settings"),
      axiosInstance.get("/admin/transfer-fee"),
    ]);

    setPartialData({
      applications: onboardingRes.value?.data?.applications || [],
      users: usersRes.value?.data?.users || [],
      transfers: transfersRes.value?.data?.transfers || [],
      deposits: depositsRes.value?.data?.deposits || [],
      tickets: Array.isArray(ticketsRes.value?.data) ? ticketsRes.value.data : [],
      wallets: walletsRes.value?.data?.wallets || [],
      settings: settingsRes.value?.data?.settings || null,
      fees: feeRes.value?.data?.fees || {},
    });
    setLoading(false);
  };

  const fetchActivePage = async () => {
    setLoading(true);

    const loaders = {
      overview: fetchOverview,
      onboarding: async () => {
        const res = await request(
          () => axiosInstance.get(`/admin/onboarding?status=${onboardingStatus}`),
          "Failed to load onboarding applications"
        );
        setPartialData({ applications: res?.data?.applications || [] });
      },
      users: async () => {
        const res = await request(
          () => axiosInstance.get("/admin/users?pageSize=100"),
          "Failed to load users"
        );
        setPartialData({ users: res?.data?.users || [] });
      },
      transfers: async () => {
        const res = await request(
          () => axiosInstance.get("/admin/all-transfers"),
          "Failed to load transfers"
        );
        setPartialData({ transfers: res?.data?.transfers || [] });
      },
      deposits: async () => {
        const res = await request(
          () => axiosInstance.get("/admin/deposits"),
          "Failed to load deposits"
        );
        setPartialData({ deposits: res?.data?.deposits || [] });
      },
      tickets: async () => {
        const res = await request(
          () => axiosInstance.get("/admin/tickets"),
          "Failed to load tickets"
        );
        setPartialData({ tickets: Array.isArray(res?.data) ? res.data : [] });
      },
      wallets: async () => {
        const res = await request(
          () => axiosInstance.get("/admin/wallets"),
          "Failed to load wallets"
        );
        setPartialData({ wallets: res?.data?.wallets || [] });
      },
      settings: async () => {
        const [settingsRes, feeRes] = await Promise.all([
          request(() => axiosInstance.get("/admin/security-codes/settings"), "Failed to load security settings"),
          request(() => axiosInstance.get("/admin/transfer-fee"), "Failed to load transfer fees"),
        ]);
        setPartialData({
          settings: settingsRes?.data?.settings || null,
          fees: feeRes?.data?.fees || {},
        });
      },
    };

    await loaders[activePage]();
    setLoading(false);
  };

  useEffect(() => {
    fetchActivePage();
  }, [activePage, onboardingStatus]);

  const stats = useMemo(() => {
    const pendingApplications = data.applications.filter((item) => item.status === "pending").length;
    const pendingDeposits = data.deposits.filter((item) => item.status === "pending").length;
    const openTickets = data.tickets.filter((item) => String(item.status).toLowerCase() !== "closed").length;
    const transferVolume = data.transfers.reduce((sum, transfer) => {
      const amount = Number(String(transfer.amount || "0").replace(/[^\d.-]/g, ""));
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);

    return {
      users: data.users.length,
      pendingApplications,
      pendingDeposits,
      openTickets,
      transferVolume,
    };
  }, [data]);

  const handleLogout = () => {
    logout("admin");
    navigate("/", { replace: true });
  };

  const approveApplication = async (id) => {
    setActionId(`approve-${id}`);
    const res = await request(
      () => axiosInstance.post(`/admin/onboarding/${id}/approve`),
      "Approval failed"
    );
    if (res) {
      notify(res.data?.message || "Application approved", "success");
      fetchActivePage();
    }
    setActionId("");
  };

  const rejectApplication = async (id) => {
    const reason = window.prompt("Why is this onboarding being rejected?");
    if (!reason) return;

    setActionId(`reject-${id}`);
    const res = await request(
      () => axiosInstance.post(`/admin/onboarding/${id}/reject`, { reason }),
      "Rejection failed"
    );
    if (res) {
      notify(res.data?.message || "Application rejected", "success");
      fetchActivePage();
    }
    setActionId("");
  };

  const updateTransferStatus = async (id, status) => {
    setActionId(`transfer-${id}`);
    const res = await request(
      () => axiosInstance.put(`/admin/update-transfer-status/${id}`, { status }),
      "Failed to update transfer"
    );
    if (res) {
      notify(res.data?.message || "Transfer updated", "success");
      fetchActivePage();
    }
    setActionId("");
  };

  const updateDeposit = async (id, action) => {
    setActionId(`deposit-${id}`);
    const res = await request(
      () => axiosInstance.put(`/admin/deposit/${id}/${action}`),
      "Failed to update deposit"
    );
    if (res) {
      notify(res.data?.message || "Deposit updated", "success");
      fetchActivePage();
    }
    setActionId("");
  };

  const closeTicket = async (id) => {
    setActionId(`ticket-${id}`);
    const res = await request(
      () => axiosInstance.put(`/admin/tickets/${id}/close`),
      "Failed to close ticket"
    );
    if (res) {
      notify(res.data?.message || "Ticket closed", "success");
      fetchActivePage();
    }
    setActionId("");
  };

  const updateSecuritySetting = async (key, value) => {
    const next = { ...(data.settings || {}), [key]: value };
    setPartialData({ settings: next });
    const res = await request(
      () => axiosInstance.post("/admin/security-codes/settings", next),
      "Failed to update security settings"
    );
    if (res) notify("Security settings updated", "success");
  };

  const updateFee = async (type, fee_amount) => {
    const res = await request(
      () => axiosInstance.post("/admin/set-transfer-fee", { type, fee_amount }),
      "Failed to update transfer fee"
    );
    if (res) {
      notify(res.data?.message || "Transfer fee updated", "success");
      setPartialData({ fees: { ...data.fees, [type]: Number(fee_amount) } });
    }
  };

  const renderStatus = (status) => (
    <span className={`${styles.status} ${styles[String(status || "").toLowerCase()] || ""}`}>
      {status || "unknown"}
    </span>
  );

  const renderOverview = () => (
    <>
      <div className={styles.cards}>
        <div className={styles.card}><h3>Total Users</h3><p>{stats.users}</p></div>
        <div className={styles.card}><h3>Pending Onboarding</h3><p>{stats.pendingApplications}</p></div>
        <div className={styles.card}><h3>Pending Deposits</h3><p>{stats.pendingDeposits}</p></div>
        <div className={styles.card}><h3>Open Tickets</h3><p>{stats.openTickets}</p></div>
      </div>

      <div className={styles.dashboardGrid}>
        <section className={styles.panel}>
          <h2>Recent Onboarding</h2>
          {data.applications.slice(0, 5).map((item) => (
            <div className={styles.compactRow} key={item.id}>
              <strong>{item.full_name}</strong>
              {renderStatus(item.status)}
            </div>
          ))}
        </section>

        <section className={styles.panel}>
          <h2>Transfer Volume</h2>
          <p className={styles.bigNumber}>${stats.transferVolume.toLocaleString()}</p>
          <span className={styles.muted}>{data.transfers.length} transfers loaded</span>
        </section>
      </div>
    </>
  );

  const renderOnboarding = () => (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <h2>Onboarding Applications</h2>
        <select value={onboardingStatus} onChange={(e) => setOnboardingStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      {data.applications.length === 0 ? (
        <div className={styles.emptyState}>No onboarding applications found.</div>
      ) : (
        <div className={styles.applicationList}>
          {data.applications.map((application) => (
            <article className={styles.application} key={application.id}>
              <div className={styles.applicationMain}>
                <div>
                  <div className={styles.nameLine}>
                    <h3>{application.full_name}</h3>
                    {renderStatus(application.status)}
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
                    <button className={styles.approveBtn} onClick={() => approveApplication(application.id)} disabled={actionId === `approve-${application.id}`}>Approve</button>
                    <button className={styles.rejectBtn} onClick={() => rejectApplication(application.id)} disabled={actionId === `reject-${application.id}`}>Reject</button>
                  </div>
                )}
              </div>

              <div className={styles.documents}>
                <a href={resolveAsset(application.id_front_url)} target="_blank" rel="noreferrer"><img src={resolveAsset(application.id_front_url)} alt="ID front" /><span>ID front</span></a>
                <a href={resolveAsset(application.id_back_url)} target="_blank" rel="noreferrer"><img src={resolveAsset(application.id_back_url)} alt="ID back" /><span>ID back</span></a>
                <a href={resolveAsset(application.face_photo_url)} target="_blank" rel="noreferrer"><img src={resolveAsset(application.face_photo_url)} alt="Face verification" /><span>Face photo</span></a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );

  const renderTable = (headers, rows) => (
    <div className={styles.table}>
      <div className={styles.tableHead} style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}>
        {headers.map((header) => <span key={header}>{header}</span>)}
      </div>
      {rows}
    </div>
  );

  const renderUsers = () => (
    <section className={styles.panel}>
      <h2>Users</h2>
      {renderTable(["User", "Email", "Account", "Status", "Verified"], data.users.map((item) => (
        <div className={styles.tableRow} key={item.id} style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
          <span>{item.full_name || item.username}</span>
          <span>{item.email}</span>
          <span>{item.account_number || "Pending"}</span>
          <span>{renderStatus(item.acct_status)}</span>
          <span>{item.email_verified ? "Yes" : "No"}</span>
        </div>
      )))}
    </section>
  );

  const renderTransfers = () => (
    <section className={styles.panel}>
      <h2>Transfers</h2>
      {renderTable(["Customer", "Type", "Beneficiary", "Amount", "Status", "Action"], data.transfers.map((item) => (
        <div className={styles.tableRow} key={item.id} style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
          <span>{item.full_name}</span>
          <span>{item.type}</span>
          <span>{item.account_name || item.bank_name || "N/A"}</span>
          <span>{item.amount}</span>
          <span>{renderStatus(item.status)}</span>
          <span className={styles.inlineActions}>
            <button onClick={() => updateTransferStatus(item.id, "approved")}>Approve</button>
            <button onClick={() => updateTransferStatus(item.id, "rejected")}>Reject</button>
          </span>
        </div>
      )))}
    </section>
  );

  const renderDeposits = () => (
    <section className={styles.panel}>
      <h2>Deposits</h2>
      {renderTable(["User", "Wallet", "Amount", "Status", "Proof", "Action"], data.deposits.map((item) => (
        <div className={styles.tableRow} key={item.id} style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
          <span>{item.username}</span>
          <span>{item.wallet_name}</span>
          <span>{item.amount}</span>
          <span>{renderStatus(item.status)}</span>
          <a href={item.proof_url} target="_blank" rel="noreferrer">View</a>
          <span className={styles.inlineActions}>
            <button onClick={() => updateDeposit(item.id, "confirm")}>Confirm</button>
            <button onClick={() => updateDeposit(item.id, "reject")}>Reject</button>
          </span>
        </div>
      )))}
    </section>
  );

  const renderTickets = () => (
    <section className={styles.panel}>
      <h2>Support Tickets</h2>
      {renderTable(["User", "Subject", "Status", "Created", "Action"], data.tickets.map((item) => (
        <div className={styles.tableRow} key={item.id} style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
          <span>{item.user_username || item.user_id}</span>
          <span>{item.subject}</span>
          <span>{renderStatus(item.status)}</span>
          <span>{item.created_at ? new Date(item.created_at).toLocaleString() : "N/A"}</span>
          <span className={styles.inlineActions}>
            <button onClick={() => closeTicket(item.id)}>Close</button>
          </span>
        </div>
      )))}
    </section>
  );

  const renderWallets = () => (
    <section className={styles.panel}>
      <h2>Wallets</h2>
      <div className={styles.walletGrid}>
        {data.wallets.map((wallet) => (
          <article className={styles.walletCard} key={wallet.id}>
            {wallet.qrcode_url && <img src={wallet.qrcode_url} alt={wallet.wallet_name} />}
            <strong>{wallet.wallet_name}</strong>
            <p>{wallet.wallet_address}</p>
          </article>
        ))}
      </div>
    </section>
  );

  const renderSettings = () => (
    <section className={styles.panel}>
      <h2>Security and Fees</h2>
      <div className={styles.settingsGrid}>
        {["require_imf", "require_cot", "require_tax"].map((key) => (
          <label className={styles.toggleRow} key={key}>
            <span>{key.replace("require_", "").toUpperCase()} required</span>
            <input
              type="checkbox"
              checked={!!data.settings?.[key]}
              onChange={(e) => updateSecuritySetting(key, e.target.checked)}
            />
          </label>
        ))}

        {["local", "wire"].map((type) => (
          <label className={styles.feeRow} key={type}>
            <span>{type} transfer fee</span>
            <input
              type="number"
              defaultValue={data.fees?.[type] ?? ""}
              onBlur={(e) => e.target.value && updateFee(type, e.target.value)}
            />
          </label>
        ))}
      </div>
    </section>
  );

  const renderPage = () => {
    if (loading) return <div className={styles.emptyState}>Loading admin data...</div>;
    if (activePage === "overview") return renderOverview();
    if (activePage === "onboarding") return renderOnboarding();
    if (activePage === "users") return renderUsers();
    if (activePage === "transfers") return renderTransfers();
    if (activePage === "deposits") return renderDeposits();
    if (activePage === "tickets") return renderTickets();
    if (activePage === "wallets") return renderWallets();
    return renderSettings();
  };

  return (
    <div className={styles.adminShell}>
      <GlassToast toasts={toasts} onDismiss={dismissToast} />

      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>S</div>
          <div>
            <strong>Stercxa Admin</strong>
            <span>Operations Console</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {sections.map((section) => (
            <button
              type="button"
              key={section.id}
              className={activePage === section.id ? styles.activeNav : ""}
              onClick={() => setActivePage(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{sections.find((item) => item.id === activePage)?.label}</h1>
            <p className={styles.subtitle}>Manage customers, approvals, money movement, support, and platform controls.</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.adminName}>{adminUser?.full_name || adminUser?.username || "Admin"}</div>
            <button className={styles.refreshBtn} type="button" onClick={fetchActivePage}>Refresh</button>
            <button className={styles.logoutBtn} type="button" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        {renderPage()}
      </main>
    </div>
  );
}
