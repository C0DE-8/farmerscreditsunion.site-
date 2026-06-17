import styles from "./MobileFooterNav.module.css";
import { NavLink } from "react-router-dom";
import { FiCreditCard, FiHome, FiMoreHorizontal, FiSettings } from "react-icons/fi";

export default function MobileFooterNav() {
  const items = [
    { to: "/dashboard", label: "Home", icon: <FiHome /> },
    { to: "/cards", label: "Cards", icon: <FiCreditCard /> },
    { to: "/settings", label: "Settings", icon: <FiSettings /> },
    { to: "/more", label: "More", icon: <FiMoreHorizontal /> },
  ];

  return (
    <nav className={styles.footer} aria-label="Mobile dashboard navigation">
      {items.map((item) => (
        <NavLink
          className={({ isActive }) => (isActive ? styles.active : undefined)}
          to={item.to}
          key={item.to}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
