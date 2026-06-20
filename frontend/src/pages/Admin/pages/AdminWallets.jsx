import { useEffect, useRef, useState } from "react";
import { FiEdit2, FiPlus, FiRefreshCw, FiSave, FiTrash2, FiX } from "react-icons/fi";
import { useOutletContext } from "react-router-dom";
import axiosInstance from "../../../api/axios";
import { EmptyState, WalletSkeleton } from "../AdminPrimitives";
import styles from "../Admin.module.css";

const INITIAL_FORM = {
  wallet_name: "",
  wallet_address: "",
  qrcode: null,
};

export default function AdminWallets() {
  const outletContext = useOutletContext() || {};
  const notify = outletContext.notify || (() => {});
  const [wallets, setWallets] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingWallet, setEditingWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const fileRef = useRef(null);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/wallets");
      setWallets(res.data?.wallets || []);
    } catch (error) {
      notify(error?.response?.data?.error || "Failed to load wallets", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingWallet(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const openEdit = (wallet) => {
    setEditingWallet(wallet);
    setForm({
      wallet_name: wallet.wallet_name || "",
      wallet_address: wallet.wallet_address || "",
      qrcode: null,
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const submitWallet = async (event) => {
    event.preventDefault();

    if (!form.wallet_name.trim() || !form.wallet_address.trim()) {
      notify("Wallet name and address are required.", "error");
      return;
    }

    if (!editingWallet && !form.qrcode) {
      notify("QR code image is required for a new wallet.", "error");
      return;
    }

    const payload = new FormData();
    payload.append("wallet_name", form.wallet_name.trim());
    payload.append("wallet_address", form.wallet_address.trim());
    if (form.qrcode) payload.append("qrcode", form.qrcode);

    try {
      setSaving(true);
      const res = editingWallet
        ? await axiosInstance.put(`/admin/wallets/${editingWallet.id}`, payload, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        : await axiosInstance.post("/admin/wallets", payload, {
            headers: { "Content-Type": "multipart/form-data" },
          });

      notify(res.data?.message || (editingWallet ? "Wallet updated" : "Wallet added"), "success");
      resetForm();
      loadWallets();
    } catch (error) {
      notify(error?.response?.data?.error || "Failed to save wallet", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteWallet = async (wallet) => {
    if (!window.confirm(`Delete ${wallet.wallet_name}?`)) return;

    try {
      setDeletingId(String(wallet.id));
      const res = await axiosInstance.delete(`/admin/wallets/${wallet.id}`);
      notify(res.data?.message || "Wallet deleted", "success");
      if (editingWallet?.id === wallet.id) resetForm();
      loadWallets();
    } catch (error) {
      notify(error?.response?.data?.error || "Failed to delete wallet", "error");
    } finally {
      setDeletingId("");
    }
  };

  if (loading) return <WalletSkeleton />;

  return (
    <div className={styles.settingsStack}>
      <section className={styles.panel}>
        <div className={styles.settingsHeader}>
          <div>
            <span className={styles.settingsEyebrow}>{editingWallet ? <FiEdit2 /> : <FiPlus />} Wallet Management</span>
            <h2>{editingWallet ? "Update wallet" : "Add new wallet"}</h2>
            <p>Add a wallet address with its QR code, or update an existing wallet from the list below.</p>
          </div>
          <button className={styles.secondaryBtn} type="button" onClick={loadWallets}>
            <FiRefreshCw />
            <span>Refresh</span>
          </button>
        </div>

        <form className={styles.settingsForm} onSubmit={submitWallet}>
          <div className={styles.settingsFormGrid}>
            <label className={styles.field}>
              <span>Wallet name</span>
              <input
                value={form.wallet_name}
                onChange={(event) => setForm((current) => ({ ...current, wallet_name: event.target.value }))}
                placeholder="Bitcoin, USDT TRC20, Ethereum..."
                required
              />
            </label>

            <label className={styles.field}>
              <span>Wallet address</span>
              <input
                value={form.wallet_address}
                onChange={(event) => setForm((current) => ({ ...current, wallet_address: event.target.value }))}
                placeholder="Paste wallet address"
                required
              />
            </label>

            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span>{editingWallet ? "Replace QR code image" : "QR code image"}</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(event) => setForm((current) => ({ ...current, qrcode: event.target.files?.[0] || null }))}
                required={!editingWallet}
              />
            </label>
          </div>

          <div className={styles.formActions}>
            {editingWallet && (
              <button className={styles.secondaryBtn} type="button" onClick={resetForm}>
                <FiX />
                <span>Cancel edit</span>
              </button>
            )}
            <button className={styles.refreshBtn} type="submit" disabled={saving}>
              <FiSave />
              <span>{saving ? "Saving..." : editingWallet ? "Save wallet" : "Add wallet"}</span>
            </button>
          </div>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.settingsHeader}>
          <div>
            <span className={styles.settingsEyebrow}>Wallets</span>
            <h2>Saved wallet addresses</h2>
            <p>Edit wallet details, replace QR codes, or remove wallet addresses from the funding options.</p>
          </div>
        </div>

        {wallets.length === 0 ? (
          <EmptyState>No wallets found.</EmptyState>
        ) : (
          <div className={styles.walletGrid}>
            {wallets.map((wallet) => (
              <article className={styles.walletCard} key={wallet.id}>
                {wallet.qrcode_url && <img src={wallet.qrcode_url} alt={wallet.wallet_name} />}
                <strong>{wallet.wallet_name}</strong>
                <p>{wallet.wallet_address}</p>
                {wallet.created_at && <p>Added {wallet.created_at}</p>}
                <div className={styles.inlineActions}>
                  <button className={styles.editActionBtn} type="button" onClick={() => openEdit(wallet)}>
                    <FiEdit2 />
                    <span>Edit</span>
                  </button>
                  <button
                    className={styles.deleteActionBtn}
                    type="button"
                    onClick={() => deleteWallet(wallet)}
                    disabled={deletingId === String(wallet.id)}
                  >
                    <FiTrash2 />
                    <span>{deletingId === String(wallet.id) ? "Deleting..." : "Delete"}</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
