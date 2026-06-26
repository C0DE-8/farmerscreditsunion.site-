import styles from "./LogoPreloader.module.css";

const DEFAULT_LOGO = "/style-two/temp/custom/img/logo.png";

export default function LogoPreloader({ label = "Loading", compact = false, overlay = false, fullPage = false }) {
  return (
    <div
      className={`${styles.preloader} ${compact ? styles.compact : ""} ${overlay ? styles.overlay : ""} ${
        fullPage ? styles.fullPage : ""
      }`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.logoRing} aria-hidden="true">
        <img src={DEFAULT_LOGO} alt="" />
      </span>
      <span>{label}</span>
    </div>
  );
}
