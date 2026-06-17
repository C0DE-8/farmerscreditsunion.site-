import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCreditCard, FiFileText, FiMoreHorizontal, FiSettings } from "react-icons/fi";
import MobileFooterNav from "../../components/Dashboard/MobileFooterNav";
import styles from "./UserPage.module.css";

const iconMap = {
  cards: <FiCreditCard />,
  transactions: <FiFileText />,
  settings: <FiSettings />,
  more: <FiMoreHorizontal />,
};

export default function UserPage({ type, title, description }) {
  const navigate = useNavigate();

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <button type="button" onClick={() => navigate("/dashboard")} aria-label="Back to dashboard">
            <FiArrowLeft />
          </button>
          <div>
            <span>{iconMap[type]}</span>
            <h1>{title}</h1>
          </div>
        </header>

        <section className={styles.panel}>
          <h2>{title}</h2>
          <p>{description}</p>
        </section>
      </section>

      <MobileFooterNav />
    </main>
  );
}
