import { Link } from "react-router-dom";
import { FiAlertTriangle, FiArrowLeft, FiHome, FiShield } from "react-icons/fi";
import styles from "./ErrorPages.module.css";

const BRAND_LOGO = "/westbridge-assets/images/westbridge.png";

function ErrorLayout({ code, title, description, tone = "warn" }) {
  return (
    <main className={styles.page}>
      <div className={styles.glowOne} />
      <div className={styles.glowTwo} />

      <section className={styles.shell}>
        <Link className={styles.brand} to="/">
          <img src={BRAND_LOGO} alt="West Bridge Vault Reserve" />
        </Link>

        <div className={`${styles.badge} ${tone === "danger" ? styles.badgeDanger : ""}`}>
          {tone === "danger" ? <FiAlertTriangle /> : <FiShield />}
          <span>Error {code}</span>
        </div>

        <div className={styles.code}>{code}</div>
        <h1>{title}</h1>
        <p>{description}</p>

        <div className={styles.actions}>
          <Link className={styles.primaryLink} to="/">
            <FiHome />
            <span>Back Home</span>
          </Link>
          <Link className={styles.secondaryLink} to="/auth?mode=login">
            <FiArrowLeft />
            <span>Account Login</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <ErrorLayout
      code="404"
      title="Page not found"
      description="The page you requested does not exist or is no longer available on West Bridge Vault Reserve."
    />
  );
}

export function ServerErrorPage() {
  return (
    <ErrorLayout
      code="500"
      title="Server error"
      description="Something went wrong while loading this page. Please try again or return to the main site."
      tone="danger"
    />
  );
}
