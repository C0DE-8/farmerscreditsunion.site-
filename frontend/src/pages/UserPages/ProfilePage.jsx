import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUser } from "react-icons/fi";
import axiosInstance from "../../api/axios";
import MobileFooterNav from "../../components/Dashboard/MobileFooterNav";
import { resolveAsset } from "../../utils/assets";
import styles from "./UserPage.module.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    axiosInstance
      .get("/user/profile")
      .then((res) => setProfile(res.data?.user || null))
      .catch(() => setProfile(null));
  }, []);

  const imageUrl = resolveAsset(profile?.profile_image_url || "");
  const displayName = profile?.full_name || profile?.username || "User";

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <button type="button" onClick={() => navigate("/dashboard")} aria-label="Back to dashboard">
            <FiArrowLeft />
          </button>
          <div>
            <span><FiUser /></span>
            <h1>Profile</h1>
          </div>
        </header>

        <section className={styles.panel}>
          <div className={styles.profileHero}>
            <div className={styles.profileImage}>
              {imageUrl ? <img src={imageUrl} alt={displayName} /> : displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2>{displayName}</h2>
              <p>{profile?.email || "No email available"}</p>
            </div>
          </div>

          <div className={styles.profileGrid}>
            <div><span>Username</span><strong>{profile?.username || "Not set"}</strong></div>
            <div><span>Main account</span><strong>{profile?.account_number || "Pending"}</strong></div>
            <div><span>Savings account</span><strong>{profile?.s_account_number || "Pending"}</strong></div>
            <div><span>Current account</span><strong>{profile?.c_account_number || "Pending"}</strong></div>
            <div><span>Status</span><strong>{profile?.acct_status || "Unknown"}</strong></div>
            <div><span>Currency</span><strong>{profile?.currency_sign || "$"}</strong></div>
          </div>
        </section>
      </section>

      <MobileFooterNav />
    </main>
  );
}
