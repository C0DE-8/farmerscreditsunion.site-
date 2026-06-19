import { useEffect, useMemo, useState } from "react";
import { FiLock, FiMail, FiSave, FiSettings, FiUser } from "react-icons/fi";
import { useOutletContext } from "react-router-dom";
import axiosInstance from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";
import { resolveAsset, SettingsSkeleton } from "../AdminPrimitives";
import styles from "../Admin.module.css";

const INITIAL_PROFILE = {
  full_name: "",
  username: "",
  email: "",
  profile_image_url: "",
};

const INITIAL_PASSWORD = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

export default function AdminSettings() {
  const outletContext = useOutletContext() || {};
  const notify = outletContext.notify || (() => {});
  const { adminUser, updateSessionUser } = useAuth();
  const [settings, setSettings] = useState(null);
  const [fees, setFees] = useState({});
  const [profileForm, setProfileForm] = useState(INITIAL_PROFILE);
  const [passwordForm, setPasswordForm] = useState(INITIAL_PASSWORD);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      setLoading(true);
      const [settingsRes, feeRes, profileRes] = await Promise.allSettled([
        axiosInstance.get("/admin/security-codes/settings"),
        axiosInstance.get("/admin/transfer-fee"),
        axiosInstance.get("/admin/profile"),
      ]);

      if (!active) return;

      const nextSettings = settingsRes.status === "fulfilled" ? settingsRes.value?.data?.settings || null : null;
      const nextFees = feeRes.status === "fulfilled" ? feeRes.value?.data?.fees || {} : {};
      const profile = profileRes.status === "fulfilled" ? profileRes.value?.data?.user || adminUser || {} : adminUser || {};
      const failedRequests = [settingsRes, feeRes, profileRes].filter((item) => item.status === "rejected").length;

      setSettings(nextSettings);
      setFees(nextFees);
      setProfileForm({
        full_name: profile.full_name || "",
        username: profile.username || "",
        email: profile.email || "",
        profile_image_url: profile.profile_image_url || "",
      });

      if (profile?.id) {
        updateSessionUser("admin", profile);
      }

      if (failedRequests === 3) {
        notify("Failed to load admin settings.", "error");
      } else if (failedRequests > 0) {
        notify("Some admin settings could not be loaded.", "info");
      }

      setLoading(false);
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!adminUser) return;
    setProfileForm((current) => ({
      full_name: current.full_name || adminUser.full_name || "",
      username: current.username || adminUser.username || "",
      email: current.email || adminUser.email || "",
      profile_image_url: current.profile_image_url || adminUser.profile_image_url || "",
    }));
  }, [adminUser]);

  const updateSecuritySetting = async (key, value) => {
    const next = { ...(settings || {}), [key]: value };
    setSettings(next);

    try {
      await axiosInstance.post("/admin/security-codes/settings", next);
      notify("Security settings updated", "success");
    } catch (error) {
      notify(error?.response?.data?.error || "Failed to update security settings", "error");
    }
  };

  const updateFee = async (type, fee_amount) => {
    try {
      const res = await axiosInstance.post("/admin/set-transfer-fee", { type, fee_amount });
      notify(res.data?.message || "Transfer fee updated", "success");
      setFees((current) => ({ ...current, [type]: Number(fee_amount) }));
    } catch (error) {
      notify(error?.response?.data?.error || "Failed to update transfer fee", "error");
    }
  };

  const submitProfile = async (event) => {
    event.preventDefault();

    try {
      setSavingProfile(true);
      const res = await axiosInstance.patch("/admin/profile", profileForm);
      const nextUser = res.data?.user;
      if (nextUser) {
        updateSessionUser("admin", nextUser);
        setProfileForm({
          full_name: nextUser.full_name || "",
          username: nextUser.username || "",
          email: nextUser.email || "",
          profile_image_url: nextUser.profile_image_url || "",
        });
      }
      notify(res.data?.message || "Admin profile updated", "success");
    } catch (error) {
      notify(error?.response?.data?.error || "Failed to update admin profile", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      notify("New password and confirmation must match.", "error");
      return;
    }

    try {
      setSavingPassword(true);
      const res = await axiosInstance.put("/admin/change-password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      notify(res.data?.message || "Password updated successfully", "success");
      setPasswordForm(INITIAL_PASSWORD);
    } catch (error) {
      notify(error?.response?.data?.error || "Failed to update password", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const profilePreview = useMemo(
    () => resolveAsset(profileForm.profile_image_url) || resolveAsset(adminUser?.profile_image_url),
    [adminUser?.profile_image_url, profileForm.profile_image_url]
  );

  if (loading) return <SettingsSkeleton />;

  return (
    <div className={styles.settingsStack}>
      <section className={styles.panel}>
        <div className={styles.settingsHeader}>
          <div>
            <span className={styles.settingsEyebrow}><FiUser /> Admin Profile</span>
            <h2>Profile information</h2>
            <p>Update the admin account details used across the operations console.</p>
          </div>
        </div>

        <div className={styles.profileCard}>
          <div className={styles.profileMedia}>
            {profilePreview ? (
              <img src={profilePreview} alt={profileForm.full_name || profileForm.username || "Admin profile"} />
            ) : (
              <div className={styles.profileFallback}>
                {(profileForm.full_name || profileForm.username || "A").trim().charAt(0).toUpperCase()}
              </div>
            )}
            <div className={styles.profileMeta}>
              <strong>{profileForm.full_name || adminUser?.full_name || "West Bridge Admin"}</strong>
              <span>{profileForm.email || adminUser?.email || "Admin email"}</span>
            </div>
          </div>

          <form className={styles.settingsForm} onSubmit={submitProfile}>
            <div className={styles.settingsFormGrid}>
              <label className={styles.field}>
                <span>Full name</span>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(event) => setProfileForm((current) => ({ ...current, full_name: event.target.value }))}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Username</span>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(event) => setProfileForm((current) => ({ ...current, username: event.target.value }))}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Email address</span>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span>Profile image URL</span>
                <input
                  type="text"
                  value={profileForm.profile_image_url}
                  onChange={(event) => setProfileForm((current) => ({ ...current, profile_image_url: event.target.value }))}
                  placeholder="https://..."
                />
              </label>
            </div>

            <div className={styles.formActions}>
              <button className={styles.refreshBtn} type="submit" disabled={savingProfile}>
                <FiSave />
                <span>{savingProfile ? "Saving..." : "Save profile"}</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.settingsHeader}>
          <div>
            <span className={styles.settingsEyebrow}><FiLock /> Password</span>
            <h2>Change password</h2>
            <p>Update the password used for admin access to West Bridge operations.</p>
          </div>
        </div>

        <form className={styles.settingsForm} onSubmit={submitPassword}>
          <div className={styles.settingsFormGrid}>
            <label className={styles.field}>
              <span>Current password</span>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))}
                required
              />
            </label>
            <label className={styles.field}>
              <span>New password</span>
              <input
                type="password"
                minLength={6}
                value={passwordForm.new_password}
                onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Confirm new password</span>
              <input
                type="password"
                minLength={6}
                value={passwordForm.confirm_password}
                onChange={(event) => setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))}
                required
              />
            </label>
          </div>

          <div className={styles.formActions}>
            <button className={styles.refreshBtn} type="submit" disabled={savingPassword}>
              <FiMail />
              <span>{savingPassword ? "Updating..." : "Update password"}</span>
            </button>
          </div>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.settingsHeader}>
          <div>
            <span className={styles.settingsEyebrow}><FiSettings /> Security and fees</span>
            <h2>Operational controls</h2>
            <p>Manage code requirements and default transfer fee amounts.</p>
          </div>
        </div>

        <div className={styles.settingsGrid}>
          {["require_imf", "require_cot", "require_tax"].map((key) => (
            <label className={styles.toggleRow} key={key}>
              <span>{key.replace("require_", "").toUpperCase()} required</span>
              <input
                type="checkbox"
                checked={!!settings?.[key]}
                onChange={(e) => updateSecuritySetting(key, e.target.checked)}
              />
            </label>
          ))}

          {["local", "wire"].map((type) => (
            <label className={styles.feeRow} key={type}>
              <span>{type} transfer fee</span>
              <input
                type="number"
                defaultValue={fees?.[type] ?? ""}
                onBlur={(e) => e.target.value && updateFee(type, e.target.value)}
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
