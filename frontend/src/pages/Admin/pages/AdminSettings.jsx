import { useEffect, useMemo, useState } from "react";
import { FiCopy, FiLock, FiMail, FiSave, FiSettings, FiShield, FiUser } from "react-icons/fi";
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

const INITIAL_CODES = {
  imf_code: "",
  cot_code: "",
  tax_code: "",
};

const INITIAL_SETTINGS = {
  require_imf: true,
  require_cot: true,
  require_tax: true,
};

const codeFields = [
  { key: "imf_code", setting: "require_imf", label: "IMF Code" },
  { key: "cot_code", setting: "require_cot", label: "COT Code" },
  { key: "tax_code", setting: "require_tax", label: "TAX Code" },
];

const feeFields = [
  { type: "local", label: "Local Transfer Fee" },
  { type: "wire", label: "International Transfer Fee" },
];

export default function AdminSettings() {
  const outletContext = useOutletContext() || {};
  const notify = outletContext.notify || (() => {});
  const { adminUser, updateSessionUser } = useAuth();
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [fees, setFees] = useState({});
  const [feeDrafts, setFeeDrafts] = useState({});
  const [securityCodes, setSecurityCodes] = useState(INITIAL_CODES);
  const [profileForm, setProfileForm] = useState(INITIAL_PROFILE);
  const [passwordForm, setPasswordForm] = useState(INITIAL_PASSWORD);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingCodes, setSavingCodes] = useState(false);
  const [savingFee, setSavingFee] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      setLoading(true);
      const [settingsRes, feeRes, profileRes, codesRes] = await Promise.allSettled([
        axiosInstance.get("/admin/security-codes/settings"),
        axiosInstance.get("/admin/transfer-fee"),
        axiosInstance.get("/admin/profile"),
        axiosInstance.get("/admin/security-codes"),
      ]);

      if (!active) return;

      const nextSettings = settingsRes.status === "fulfilled" ? settingsRes.value?.data?.settings || INITIAL_SETTINGS : INITIAL_SETTINGS;
      const nextFees = feeRes.status === "fulfilled" ? feeRes.value?.data?.fees || {} : {};
      const nextCodes = codesRes.status === "fulfilled" ? codesRes.value?.data?.codes || INITIAL_CODES : INITIAL_CODES;
      const profile = profileRes.status === "fulfilled" ? profileRes.value?.data?.user || adminUser || {} : adminUser || {};
      const failedRequests = [settingsRes, feeRes, profileRes, codesRes].filter((item) => item.status === "rejected").length;

      setSettings(nextSettings);
      setFees(nextFees);
      setFeeDrafts({
        local: nextFees.local ?? "",
        wire: nextFees.wire ?? "",
      });
      setSecurityCodes({
        imf_code: nextCodes.imf_code || "",
        cot_code: nextCodes.cot_code || "",
        tax_code: nextCodes.tax_code || "",
      });
      setProfileForm({
        full_name: profile.full_name || "",
        username: profile.username || "",
        email: profile.email || "",
        profile_image_url: profile.profile_image_url || "",
      });

      if (profile?.id) {
        updateSessionUser("admin", profile);
      }

      if (failedRequests === 4) {
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
      const res = await axiosInstance.post("/admin/security-codes/settings", next);
      setSettings(res.data?.settings || next);
      notify("Security settings updated", "success");
    } catch (error) {
      setSettings(settings);
      notify(error?.response?.data?.error || "Failed to update security settings", "error");
    }
  };

  const toggleAllSecuritySettings = async (enabled) => {
    const next = {
      require_imf: enabled,
      require_cot: enabled,
      require_tax: enabled,
    };
    setSettings(next);

    try {
      const res = await axiosInstance.post("/admin/security-codes/settings", { require_codes: enabled });
      setSettings(res.data?.settings || next);
      notify(`All code requirements ${enabled ? "enabled" : "disabled"}`, "success");
    } catch (error) {
      setSettings(settings);
      notify(error?.response?.data?.error || "Failed to update security settings", "error");
    }
  };

  const updateFee = async (type) => {
    const fee_amount = feeDrafts[type];
    if (fee_amount === "" || Number.isNaN(Number(fee_amount)) || Number(fee_amount) < 0) {
      notify("Enter a valid transfer fee.", "error");
      return;
    }

    try {
      setSavingFee(type);
      const res = await axiosInstance.post("/admin/set-transfer-fee", { type, fee_amount });
      notify(res.data?.message || "Transfer fee updated", "success");
      setFees((current) => ({ ...current, [type]: Number(fee_amount) }));
    } catch (error) {
      notify(error?.response?.data?.error || "Failed to update transfer fee", "error");
    } finally {
      setSavingFee("");
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

  const submitSecurityCodes = async (event) => {
    event.preventDefault();

    if (!securityCodes.imf_code || !securityCodes.cot_code || !securityCodes.tax_code) {
      notify("IMF, COT, and TAX codes are required.", "error");
      return;
    }

    try {
      setSavingCodes(true);
      const res = await axiosInstance.put("/admin/security-codes", securityCodes);
      notify(res.data?.message || "Security codes updated successfully", "success");
    } catch (error) {
      notify(error?.response?.data?.error || "Failed to update security codes", "error");
    } finally {
      setSavingCodes(false);
    }
  };

  const copyCode = async (label, value) => {
    try {
      await navigator.clipboard?.writeText(value);
      notify(`${label} copied`, "success");
    } catch {
      notify(`Failed to copy ${label}`, "error");
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

        <div className={styles.requirementActions}>
          <button className={styles.applyBtn} type="button" onClick={() => toggleAllSecuritySettings(true)}>
            Enable all code checks
          </button>
          <button className={styles.secondaryBtn} type="button" onClick={() => toggleAllSecuritySettings(false)}>
            Disable all code checks
          </button>
        </div>

        <div className={styles.operationalGrid}>
          {codeFields.map((item) => (
            <label className={styles.requirementCard} key={item.setting}>
              <span>{item.label}</span>
              <strong>{settings?.[item.setting] ? "Required" : "Not required"}</strong>
              <input
                type="checkbox"
                checked={!!settings?.[item.setting]}
                onChange={(e) => updateSecuritySetting(item.setting, e.target.checked)}
              />
            </label>
          ))}

          {feeFields.map((item) => (
            <div className={styles.feeManageCard} key={item.type}>
              <div>
                <h3>{item.label}</h3>
                <span>Current Fee</span>
                <strong>${Number(fees?.[item.type] || 0).toFixed(2)}</strong>
              </div>
              <label className={styles.field}>
                <span>New fee amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={feeDrafts[item.type] ?? ""}
                  onChange={(event) => setFeeDrafts((current) => ({ ...current, [item.type]: event.target.value }))}
                />
              </label>
              <button className={styles.applyBtn} type="button" onClick={() => updateFee(item.type)} disabled={savingFee === item.type}>
                <FiSave />
                <span>{savingFee === item.type ? "Saving..." : "Save fee"}</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.settingsHeader}>
          <div>
            <span className={styles.settingsEyebrow}><FiShield /> Security Codes Management</span>
            <h2>IMF, COT, and TAX codes</h2>
            <p>View the current system security codes, update them, and copy them directly for operational use.</p>
          </div>
        </div>

        <form className={styles.settingsForm} onSubmit={submitSecurityCodes}>
          <div className={styles.codeCardsGrid}>
            {codeFields.map((item) => (
              <label className={styles.codeValueCard} key={item.key}>
                <span>Current {item.label}</span>
                <strong>{securityCodes[item.key] || "Not set"}</strong>
                <div className={styles.copyField}>
                  <input
                    type="text"
                    value={securityCodes[item.key]}
                    onChange={(event) => setSecurityCodes((current) => ({ ...current, [item.key]: event.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => copyCode(item.label, securityCodes[item.key])}
                    disabled={!securityCodes[item.key]}
                  >
                    <FiCopy />
                    <span>Copy</span>
                  </button>
                </div>
              </label>
            ))}
          </div>

          <div className={styles.formActions}>
            <button className={styles.refreshBtn} type="submit" disabled={savingCodes}>
              <FiSave />
              <span>{savingCodes ? "Saving..." : "Save codes"}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
