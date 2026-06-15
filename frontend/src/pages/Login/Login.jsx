import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { registerUser } from "../../api/authApi";
import styles from "./Login.module.css";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [registration, setRegistration] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    age: "",
    work_id: "",
    id_type: "passport",
    phone: "",
    address: "",
    email: "",
    username: "",
    password: "",
    confirm_password: "",
  });
  const [registrationFiles, setRegistrationFiles] = useState({
    id_front: null,
    id_back: null,
    face_photo: null,
  });

  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegistrationChange = (e) => {
    setRegistration((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (e) => {
    setRegistrationFiles((prev) => ({
      ...prev,
      [e.target.name]: e.target.files?.[0] || null,
    }));
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();

    if (registration.password !== registration.confirm_password) {
      alert("Passwords do not match");
      return;
    }

    const payload = new FormData();
    Object.entries(registration).forEach(([key, value]) => {
      if (key !== "confirm_password") payload.append(key, value);
    });

    Object.entries(registrationFiles).forEach(([key, file]) => {
      if (file) payload.append(key, file);
    });

    try {
      setLoading(true);
      const res = await registerUser(payload);
      alert(res?.message || "Registration submitted for approval");
      setMode("login");
    } catch (error) {
      alert(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await login(formData);

      if (res?.otp_required) {
        // backend verify route needs email, so only save it automatically if identifier is email
        const identifierValue = formData.identifier.trim();
        const looksLikeEmail = identifierValue.includes("@");

        if (looksLikeEmail) {
          localStorage.setItem("pendingLoginEmail", identifierValue);
        } else {
          localStorage.removeItem("pendingLoginEmail");
        }

        alert(res?.message || "Login OTP sent to your email");
        navigate("/verify-login-otp");
        return;
      }

      if (res?.token && res?.user) {
        const role = res.user.is_admin ? "admin" : "user";

        if (role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
        return;
      }

      alert("Login failed");
    } catch (error) {
      alert(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.backgroundGlowOne}></div>
      <div className={styles.backgroundGlowTwo}></div>
      <div className={styles.backgroundGrid}></div>

      <div className={`${styles.loginShell} ${mode === "register" ? styles.registerShell : ""} ${mounted ? styles.showShell : ""}`}>
        <div className={styles.formPanel}>
          <div className={styles.logoRow}>
            <div className={styles.logoBox}>✦</div>
            <span className={styles.brandName}>Stercxa Bank</span>
          </div>

          <div className={styles.formContent}>
            <div className={styles.modeTabs}>
              <button
                type="button"
                className={mode === "login" ? styles.activeTab : ""}
                onClick={() => setMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={mode === "register" ? styles.activeTab : ""}
                onClick={() => setMode("register")}
              >
                Open account
              </button>
            </div>

            <h1>{mode === "login" ? "Welcome back" : "Start onboarding"}</h1>
            <p className={styles.subtitle}>
              {mode === "login"
                ? "Sign in to access your Stercxa Bank dashboard, manage transactions, monitor accounts, and stay in control securely."
                : "Submit your banking profile and identification documents for admin review before account numbers are issued."}
            </p>

            {mode === "login" ? (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.inputGroup}>
                  <label>Email address or Account Number</label>
                  <input
                    type="text"
                    name="identifier"
                    placeholder="Enter your email or account number"
                    value={formData.identifier}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formExtras}>
                  <label className={styles.rememberMe}>
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => alert("Forgot password flow here")}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  className={styles.primaryBtn}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Login"}
                </button>
              </form>
            ) : (
              <form className={`${styles.form} ${styles.registrationForm}`} onSubmit={handleRegistrationSubmit}>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label>First name</label>
                    <input name="first_name" value={registration.first_name} onChange={handleRegistrationChange} required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Middle name</label>
                    <input name="middle_name" value={registration.middle_name} onChange={handleRegistrationChange} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Last name</label>
                    <input name="last_name" value={registration.last_name} onChange={handleRegistrationChange} required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Age</label>
                    <input type="number" min="18" max="120" name="age" value={registration.age} onChange={handleRegistrationChange} required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Work ID</label>
                    <input name="work_id" value={registration.work_id} onChange={handleRegistrationChange} required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>ID type</label>
                    <select name="id_type" value={registration.id_type} onChange={handleRegistrationChange} required>
                      <option value="passport">Passport</option>
                      <option value="driver_license">Driver license</option>
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Phone</label>
                    <input name="phone" value={registration.phone} onChange={handleRegistrationChange} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Email</label>
                    <input type="email" name="email" value={registration.email} onChange={handleRegistrationChange} required />
                  </div>
                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label>Address</label>
                    <input name="address" value={registration.address} onChange={handleRegistrationChange} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Username</label>
                    <input name="username" value={registration.username} onChange={handleRegistrationChange} required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Password</label>
                    <input type="password" name="password" value={registration.password} onChange={handleRegistrationChange} required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Confirm password</label>
                    <input type="password" name="confirm_password" value={registration.confirm_password} onChange={handleRegistrationChange} required />
                  </div>
                </div>

                <div className={styles.uploadGrid}>
                  <div className={styles.inputGroup}>
                    <label>ID front</label>
                    <input type="file" name="id_front" accept="image/*" onChange={handleFileChange} required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>ID back</label>
                    <input type="file" name="id_back" accept="image/*" onChange={handleFileChange} required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Face photo</label>
                    <input type="file" name="face_photo" accept="image/*" onChange={handleFileChange} required />
                  </div>
                </div>

                <button className={styles.primaryBtn} type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit for approval"}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className={styles.visualPanel}>
          <div className={styles.visualOverlay}></div>
          <div className={styles.floatingOrbOne}></div>
          <div className={styles.floatingOrbTwo}></div>

          <div className={styles.visualContent}>
            <div className={styles.stars}>✦ ✦</div>
            <h2>Bank smarter with security, speed, and confidence.</h2>
            <p>
              Stercxa Bank gives you seamless transfers, account visibility,
              spending insights, and a modern banking experience built for today.
            </p>

            <div className={styles.usersRow}>
              <div className={styles.userBubble}>S</div>
              <div className={styles.userBubble}>B</div>
              <div className={styles.userBubble}>+</div>
              <span>Trusted by 40,000+ users</span>
            </div>
          </div>

          <div className={styles.cardMock}>
            <div className={styles.cardChip}></div>
            <div className={styles.cardBrand}>SB</div>
            <div className={styles.cardNumber}>1234 5678 9012 3456</div>
            <div className={styles.cardFooter}>
              <span>VALID THRU 08/32</span>
              <span>STERCXA</span>
            </div>
          </div>

          <div className={styles.statsCard}>
            <span className={styles.statsLabel}>Protected Transactions</span>
            <strong>99.9%</strong>
          </div>

          <div className={styles.curve}></div>
        </div>
      </div>
    </div>
  );
}
