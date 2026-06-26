import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { registerUser } from "../../api/authApi";
import GlassToast, { useGlassToast } from "../../components/Toast/GlassToast";
import CustomSelect from "../../components/Form/CustomSelect";
import LanguageSwitcher from "../../components/ui/LanguageSwitcher";
import LogoPreloader from "../../components/ui/LogoPreloader";
import styles from "./Login.module.css";

const ONBOARDING_DRAFT_KEY = "stercxa_onboarding_draft";
const BRAND_LOGO = "/style-two/temp/custom/img/logo.png";

const emptyRegistration = {
  first_name: "",
  middle_name: "",
  last_name: "",
  age: "",
  date_of_birth: "",
  work_id: "",
  id_type: "passport",
  phone_country_code: "US:+1",
  phone: "",
  address: "",
  email: "",
  username: "",
  password: "",
  confirm_password: "",
};

const emptyFiles = {
  id_front: null,
  id_back: null,
  face_photo: null,
};

const emptyPreviews = {
  id_front: "",
  id_back: "",
  face_photo: "",
};

const countryCallingCodeOptions = [
  ["AF", "Afghanistan", "+93"], ["AL", "Albania", "+355"], ["DZ", "Algeria", "+213"], ["AS", "American Samoa", "+1-684"], ["AD", "Andorra", "+376"],
  ["AO", "Angola", "+244"], ["AI", "Anguilla", "+1-264"], ["AG", "Antigua and Barbuda", "+1-268"], ["AR", "Argentina", "+54"], ["AM", "Armenia", "+374"],
  ["AW", "Aruba", "+297"], ["AU", "Australia", "+61"], ["AT", "Austria", "+43"], ["AZ", "Azerbaijan", "+994"], ["BS", "Bahamas", "+1-242"],
  ["BH", "Bahrain", "+973"], ["BD", "Bangladesh", "+880"], ["BB", "Barbados", "+1-246"], ["BY", "Belarus", "+375"], ["BE", "Belgium", "+32"],
  ["BZ", "Belize", "+501"], ["BJ", "Benin", "+229"], ["BM", "Bermuda", "+1-441"], ["BT", "Bhutan", "+975"], ["BO", "Bolivia", "+591"],
  ["BA", "Bosnia and Herzegovina", "+387"], ["BW", "Botswana", "+267"], ["BR", "Brazil", "+55"], ["VG", "British Virgin Islands", "+1-284"], ["BN", "Brunei", "+673"],
  ["BG", "Bulgaria", "+359"], ["BF", "Burkina Faso", "+226"], ["BI", "Burundi", "+257"], ["KH", "Cambodia", "+855"], ["CM", "Cameroon", "+237"],
  ["CA", "Canada", "+1"], ["CV", "Cape Verde", "+238"], ["KY", "Cayman Islands", "+1-345"], ["CF", "Central African Republic", "+236"], ["TD", "Chad", "+235"],
  ["CL", "Chile", "+56"], ["CN", "China", "+86"], ["CO", "Colombia", "+57"], ["KM", "Comoros", "+269"], ["CG", "Congo", "+242"],
  ["CD", "Congo DR", "+243"], ["CK", "Cook Islands", "+682"], ["CR", "Costa Rica", "+506"], ["CI", "Cote d'Ivoire", "+225"], ["HR", "Croatia", "+385"],
  ["CU", "Cuba", "+53"], ["CW", "Curacao", "+599"], ["CY", "Cyprus", "+357"], ["CZ", "Czech Republic", "+420"], ["DK", "Denmark", "+45"],
  ["DJ", "Djibouti", "+253"], ["DM", "Dominica", "+1-767"], ["DO", "Dominican Republic", "+1-809"], ["EC", "Ecuador", "+593"], ["EG", "Egypt", "+20"],
  ["SV", "El Salvador", "+503"], ["GQ", "Equatorial Guinea", "+240"], ["ER", "Eritrea", "+291"], ["EE", "Estonia", "+372"], ["SZ", "Eswatini", "+268"],
  ["ET", "Ethiopia", "+251"], ["FK", "Falkland Islands", "+500"], ["FO", "Faroe Islands", "+298"], ["FJ", "Fiji", "+679"], ["FI", "Finland", "+358"],
  ["FR", "France", "+33"], ["GF", "French Guiana", "+594"], ["PF", "French Polynesia", "+689"], ["GA", "Gabon", "+241"], ["GM", "Gambia", "+220"],
  ["GE", "Georgia", "+995"], ["DE", "Germany", "+49"], ["GH", "Ghana", "+233"], ["GI", "Gibraltar", "+350"], ["GR", "Greece", "+30"],
  ["GL", "Greenland", "+299"], ["GD", "Grenada", "+1-473"], ["GP", "Guadeloupe", "+590"], ["GU", "Guam", "+1-671"], ["GT", "Guatemala", "+502"],
  ["GN", "Guinea", "+224"], ["GW", "Guinea-Bissau", "+245"], ["GY", "Guyana", "+592"], ["HT", "Haiti", "+509"], ["HN", "Honduras", "+504"],
  ["HK", "Hong Kong", "+852"], ["HU", "Hungary", "+36"], ["IS", "Iceland", "+354"], ["IN", "India", "+91"], ["ID", "Indonesia", "+62"],
  ["IR", "Iran", "+98"], ["IQ", "Iraq", "+964"], ["IE", "Ireland", "+353"], ["IL", "Israel", "+972"], ["IT", "Italy", "+39"],
  ["JM", "Jamaica", "+1-876"], ["JP", "Japan", "+81"], ["JO", "Jordan", "+962"], ["KZ", "Kazakhstan", "+7"], ["KE", "Kenya", "+254"],
  ["KI", "Kiribati", "+686"], ["XK", "Kosovo", "+383"], ["KW", "Kuwait", "+965"], ["KG", "Kyrgyzstan", "+996"], ["LA", "Laos", "+856"],
  ["LV", "Latvia", "+371"], ["LB", "Lebanon", "+961"], ["LS", "Lesotho", "+266"], ["LR", "Liberia", "+231"], ["LY", "Libya", "+218"],
  ["LI", "Liechtenstein", "+423"], ["LT", "Lithuania", "+370"], ["LU", "Luxembourg", "+352"], ["MO", "Macau", "+853"], ["MG", "Madagascar", "+261"],
  ["MW", "Malawi", "+265"], ["MY", "Malaysia", "+60"], ["MV", "Maldives", "+960"], ["ML", "Mali", "+223"], ["MT", "Malta", "+356"],
  ["MH", "Marshall Islands", "+692"], ["MQ", "Martinique", "+596"], ["MR", "Mauritania", "+222"], ["MU", "Mauritius", "+230"], ["YT", "Mayotte", "+262"],
  ["MX", "Mexico", "+52"], ["FM", "Micronesia", "+691"], ["MD", "Moldova", "+373"], ["MC", "Monaco", "+377"], ["MN", "Mongolia", "+976"],
  ["ME", "Montenegro", "+382"], ["MS", "Montserrat", "+1-664"], ["MA", "Morocco", "+212"], ["MZ", "Mozambique", "+258"], ["MM", "Myanmar", "+95"],
  ["NA", "Namibia", "+264"], ["NR", "Nauru", "+674"], ["NP", "Nepal", "+977"], ["NL", "Netherlands", "+31"], ["NC", "New Caledonia", "+687"],
  ["NZ", "New Zealand", "+64"], ["NI", "Nicaragua", "+505"], ["NE", "Niger", "+227"], ["NG", "Nigeria", "+234"], ["NU", "Niue", "+683"],
  ["KP", "North Korea", "+850"], ["MK", "North Macedonia", "+389"], ["MP", "Northern Mariana Islands", "+1-670"], ["NO", "Norway", "+47"], ["OM", "Oman", "+968"],
  ["PK", "Pakistan", "+92"], ["PW", "Palau", "+680"], ["PS", "Palestine", "+970"], ["PA", "Panama", "+507"], ["PG", "Papua New Guinea", "+675"],
  ["PY", "Paraguay", "+595"], ["PE", "Peru", "+51"], ["PH", "Philippines", "+63"], ["PL", "Poland", "+48"], ["PT", "Portugal", "+351"],
  ["PR", "Puerto Rico", "+1-787"], ["QA", "Qatar", "+974"], ["RE", "Reunion", "+262"], ["RO", "Romania", "+40"], ["RU", "Russia", "+7"],
  ["RW", "Rwanda", "+250"], ["WS", "Samoa", "+685"], ["SM", "San Marino", "+378"], ["ST", "Sao Tome and Principe", "+239"], ["SA", "Saudi Arabia", "+966"],
  ["SN", "Senegal", "+221"], ["RS", "Serbia", "+381"], ["SC", "Seychelles", "+248"], ["SL", "Sierra Leone", "+232"], ["SG", "Singapore", "+65"],
  ["SX", "Sint Maarten", "+1-721"], ["SK", "Slovakia", "+421"], ["SI", "Slovenia", "+386"], ["SB", "Solomon Islands", "+677"], ["SO", "Somalia", "+252"],
  ["ZA", "South Africa", "+27"], ["KR", "South Korea", "+82"], ["SS", "South Sudan", "+211"], ["ES", "Spain", "+34"], ["LK", "Sri Lanka", "+94"],
  ["KN", "St. Kitts and Nevis", "+1-869"], ["LC", "St. Lucia", "+1-758"], ["VC", "St. Vincent and Grenadines", "+1-784"], ["SD", "Sudan", "+249"], ["SR", "Suriname", "+597"],
  ["SE", "Sweden", "+46"], ["CH", "Switzerland", "+41"], ["SY", "Syria", "+963"], ["TW", "Taiwan", "+886"], ["TJ", "Tajikistan", "+992"],
  ["TZ", "Tanzania", "+255"], ["TH", "Thailand", "+66"], ["TL", "Timor-Leste", "+670"], ["TG", "Togo", "+228"], ["TK", "Tokelau", "+690"],
  ["TO", "Tonga", "+676"], ["TT", "Trinidad and Tobago", "+1-868"], ["TN", "Tunisia", "+216"], ["TR", "Turkey", "+90"], ["TM", "Turkmenistan", "+993"],
  ["TC", "Turks and Caicos Islands", "+1-649"], ["TV", "Tuvalu", "+688"], ["UG", "Uganda", "+256"], ["UA", "Ukraine", "+380"], ["AE", "United Arab Emirates", "+971"],
  ["GB", "United Kingdom", "+44"], ["US", "United States", "+1"], ["UY", "Uruguay", "+598"], ["UZ", "Uzbekistan", "+998"], ["VU", "Vanuatu", "+678"],
  ["VA", "Vatican City", "+379"], ["VE", "Venezuela", "+58"], ["VN", "Vietnam", "+84"], ["VI", "U.S. Virgin Islands", "+1-340"], ["YE", "Yemen", "+967"],
  ["ZM", "Zambia", "+260"], ["ZW", "Zimbabwe", "+263"],
].map(([iso, country, code]) => ({
  value: `${iso}:${code}`,
  label: `${country} ${code}`,
}));

function getDialingCode(value) {
  const raw = String(value || "");
  return raw.includes(":") ? raw.split(":").pop() : raw || "+1";
}

function formatPhoneForSubmit(countryCode, phone) {
  const cleanPhone = String(phone || "").trim();
  if (!cleanPhone) return "";
  if (cleanPhone.startsWith("+")) return cleanPhone;
  return `${getDialingCode(countryCode)} ${cleanPhone}`;
}

const dataUrlToFile = (dataUrl, filename) => {
  const [meta, content] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new File([bytes], filename, { type: mime });
};

const readOnboardingDraft = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(ONBOARDING_DRAFT_KEY) || "null");
    if (!saved) return null;

    const files = { ...emptyFiles };
    const previews = { ...emptyPreviews };

    Object.entries(saved.documents || {}).forEach(([key, item]) => {
      if (item?.dataUrl) {
        previews[key] = item.dataUrl;
        files[key] = dataUrlToFile(item.dataUrl, item.name || `${key}.jpg`);
      }
    });

    const savedRegistration = saved.registration || {};
    const savedPhoneCountryCode = String(savedRegistration.phone_country_code || emptyRegistration.phone_country_code);
    const normalizedPhoneCountryCode = savedPhoneCountryCode.includes(":")
      ? savedPhoneCountryCode
      : countryCallingCodeOptions.find((item) => item.value.endsWith(`:${savedPhoneCountryCode}`))?.value || emptyRegistration.phone_country_code;

    return {
      mode: saved.mode === "register" ? "register" : "login",
      step: Number.isInteger(saved.step) ? saved.step : 0,
      registration: {
        ...emptyRegistration,
        ...savedRegistration,
        phone_country_code: normalizedPhoneCountryCode,
        password: "",
        confirm_password: "",
      },
      files,
      previews,
    };
  } catch {
    return null;
  }
};

export default function Login() {
  const [savedDraft] = useState(() => readOnboardingDraft());
  const [mode, setMode] = useState(savedDraft?.mode || "login");
  const [registrationStep, setRegistrationStep] = useState(savedDraft?.step || 0);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [registration, setRegistration] = useState(savedDraft?.registration || emptyRegistration);
  const [registrationFiles, setRegistrationFiles] = useState(savedDraft?.files || emptyFiles);
  const [filePreviews, setFilePreviews] = useState(savedDraft?.previews || emptyPreviews);
  const [cameraTarget, setCameraTarget] = useState("");
  const [cameraError, setCameraError] = useState("");

  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { toasts, notify, dismissToast } = useGlassToast();

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminAuth = location.pathname.startsWith("/lock/admin/auth");

  const registrationPhases = [
    {
      title: "Personal profile",
      description: "Legal name and basic contact information",
    },
    {
      title: "Employment and ID",
      description: "Work identifier and preferred verification document",
    },
    {
      title: "Document upload",
      description: "Front, back, and face photo for admin review",
    },
    {
      title: "Account access",
      description: "Login credentials used after approval",
    },
  ];
  const pageTitle = mode === "login" ? (isAdminAuth ? "Admin sign in" : "Welcome back") : "Start onboarding";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAdminAuth) {
      setMode("login");
      return;
    }
    const params = new URLSearchParams(location.search);
    const requestedMode = params.get("mode");
    if (requestedMode === "register") {
      setMode("register");
      return;
    }
    if (requestedMode === "login") {
      setMode("login");
    }
  }, [isAdminAuth, location.search]);

  useEffect(() => {
    const safeRegistration = { ...registration };
    delete safeRegistration.password;
    delete safeRegistration.confirm_password;
    const documents = {};

    Object.entries(filePreviews).forEach(([key, dataUrl]) => {
      if (dataUrl) {
        documents[key] = {
          dataUrl,
          name: registrationFiles[key]?.name || `${key}.jpg`,
        };
      }
    });

    localStorage.setItem(
      ONBOARDING_DRAFT_KEY,
      JSON.stringify({
        mode,
        step: registrationStep,
        registration: safeRegistration,
        documents,
      })
    );
  }, [mode, registrationStep, registration, filePreviews, registrationFiles]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (!cameraTarget) {
      stopCamera();
      return undefined;
    }

    let active = true;
    setCameraError("");

    navigator.mediaDevices
      ?.getUserMedia({
        video: {
          facingMode: cameraTarget === "face_photo" ? "user" : "environment",
        },
        audio: false,
      })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch(() => {
        setCameraError("Camera access is required to capture this document.");
      });

    return () => {
      active = false;
      stopCamera();
    };
  }, [cameraTarget]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegistrationChange = (e) => {
    if (e.target.name === "date_of_birth") {
      const birthDate = new Date(e.target.value);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge -= 1;
      }

      setRegistration((prev) => ({
        ...prev,
        date_of_birth: e.target.value,
        age: Number.isFinite(calculatedAge) && calculatedAge > 0 ? String(calculatedAge) : "",
      }));
      return;
    }

    setRegistration((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFilePreviews((prev) => ({
        ...prev,
        [e.target.name]: reader.result,
      }));
    };
    reader.readAsDataURL(file);

    setRegistrationFiles((prev) => ({
      ...prev,
      [e.target.name]: file,
    }));

    if (cameraTarget === e.target.name) {
      setCameraTarget("");
    }
  };

  const captureCameraPhoto = () => {
    const video = videoRef.current;
    if (!video || !cameraTarget) return;

    const canvas = document.createElement("canvas");
    const sourceWidth = video.videoWidth || 1280;
    const sourceHeight = video.videoHeight || 720;
    const maxWidth = 1200;
    const scale = Math.min(1, maxWidth / sourceWidth);

    canvas.width = Math.round(sourceWidth * scale);
    canvas.height = Math.round(sourceHeight * scale);
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `${cameraTarget}_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      setRegistrationFiles((prev) => ({
        ...prev,
        [cameraTarget]: file,
      }));
      setFilePreviews((prev) => ({
        ...prev,
        [cameraTarget]: dataUrl,
      }));
      setCameraTarget("");
    }, "image/jpeg", 0.9);
  };

  const clearDocument = (field) => {
    setRegistrationFiles((prev) => ({ ...prev, [field]: null }));
    setFilePreviews((prev) => ({ ...prev, [field]: "" }));
  };

  const validateRegistrationStep = () => {
    if (registrationStep === 0) {
      if (!registration.first_name || !registration.last_name || !registration.date_of_birth || !registration.email) {
        notify("First name, last name, date of birth, and email are required.", "error");
        return false;
      }

      const ageNumber = Number(registration.age);
      if (!Number.isInteger(ageNumber) || ageNumber < 18 || ageNumber > 120) {
        notify("Applicant age must be between 18 and 120.", "error");
        return false;
      }
    }

    if (registrationStep === 1 && (!registration.work_id || !registration.id_type)) {
      notify("Work ID and ID type are required.", "error");
      return false;
    }

    if (
      registrationStep === 2 &&
      (!registrationFiles.id_front || !registrationFiles.id_back || !registrationFiles.face_photo)
    ) {
      notify("ID front, ID back, and face photo are required.", "error");
      return false;
    }

    if (registrationStep === 3) {
      if (!registration.username || !registration.password || !registration.confirm_password) {
        notify("Username, password, and confirmation are required.", "error");
        return false;
      }

      if (registration.password !== registration.confirm_password) {
        notify("Passwords do not match.", "error");
        return false;
      }
    }

    return true;
  };

  const goToNextRegistrationStep = () => {
    if (!validateRegistrationStep()) return;
    setRegistrationStep((step) => Math.min(step + 1, registrationPhases.length - 1));
  };

  const goToPreviousRegistrationStep = () => {
    setRegistrationStep((step) => Math.max(step - 1, 0));
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();

    if (registration.password !== registration.confirm_password) {
      notify("Passwords do not match.", "error");
      return;
    }

    if (!validateRegistrationStep()) return;

    const payload = new FormData();
    Object.entries(registration).forEach(([key, value]) => {
      if (key === "phone") {
        payload.append("phone", formatPhoneForSubmit(registration.phone_country_code, value));
        return;
      }

      if (key !== "confirm_password" && key !== "date_of_birth" && key !== "phone_country_code") {
        payload.append(key, value);
      }
    });

    Object.entries(registrationFiles).forEach(([key, file]) => {
      if (file) payload.append(key, file);
    });

    try {
      setLoading(true);
      const res = await registerUser(payload);
      notify(res?.message || "Registration submitted for approval", "success", "Submitted");
      localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      setMode("login");
      setRegistrationStep(0);
      setRegistration(emptyRegistration);
      setRegistrationFiles(emptyFiles);
      setFilePreviews(emptyPreviews);
    } catch (error) {
      notify(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Registration failed",
        "error"
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

        notify(res?.message || "Login OTP sent to your email", "success", "OTP sent");
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

      notify("Login failed", "error");
    } catch (error) {
      notify(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Login failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      {loading ? <LogoPreloader overlay label={mode === "login" ? "Signing you in..." : "Submitting application..."} /> : null}
      <div className={styles.backgroundGlowOne}></div>
      <div className={styles.backgroundGlowTwo}></div>
      <div className={styles.backgroundGrid}></div>

      <GlassToast toasts={toasts} onDismiss={dismissToast} />
      <div className={styles.languageSwitcher}>
        <LanguageSwitcher compact />
      </div>

      <div className={`${styles.loginShell} ${mode === "register" ? styles.registerShell : ""} ${mounted ? styles.showShell : ""}`}>
        <div className={styles.formPanel}>
          <Link className={styles.logoRow} to="/">
            <img className={styles.logoImage} src={BRAND_LOGO} alt="West Bridge Vault Reserve" />
          </Link>

          <div className={styles.formContent}>
            <div className={styles.modeTabs}>
              <button
                type="button"
                className={mode === "login" ? styles.activeTab : ""}
                onClick={() => setMode("login")}
              >
                {isAdminAuth ? "Admin login" : "Login"}
              </button>
              {!isAdminAuth && (
                <button
                  type="button"
                  className={mode === "register" ? styles.activeTab : ""}
                  onClick={() => {
                    setMode("register");
                    setRegistrationStep(0);
                  }}
                >
                  Open account
                </button>
              )}
            </div>

            {isAdminAuth && (
              <div className={styles.adminBadge}>
                <span>Admin console</span>
                <small>Restricted staff access</small>
              </div>
            )}

            <h1>{pageTitle}</h1>
            <p className={styles.subtitle}>
              {mode === "login"
                ? isAdminAuth
                  ? "Sign in to access the West Bridge Vault Reserve admin console and manage customer approvals, support, and platform operations."
                  : "Sign in to access your West Bridge Vault Reserve dashboard, manage transactions, monitor accounts, and stay in control securely."
                : "Submit your banking profile and identification documents for admin review before account numbers are issued."}
            </p>

            {mode === "login" ? (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.inputGroup}>
                  <label>{isAdminAuth ? "Admin email or username" : "Email address or Account Number"}</label>
                  <input
                    type="text"
                    name="identifier"
                    placeholder={isAdminAuth ? "Enter your admin email or username" : "Enter your email or account number"}
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
                    onClick={() => notify("Password recovery is not connected yet.", "info", "Coming soon")}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  className={styles.primaryBtn}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : isAdminAuth ? "Access admin" : "Login"}
                </button>
              </form>
            ) : (
              <form className={`${styles.form} ${styles.registrationForm}`} onSubmit={handleRegistrationSubmit}>
                <div className={styles.phaseTracker}>
                  {registrationPhases.map((phase, index) => (
                    <button
                      key={phase.title}
                      type="button"
                      className={`${styles.phaseStep} ${
                        index === registrationStep ? styles.activePhaseStep : ""
                      } ${index < registrationStep ? styles.completedPhaseStep : ""}`}
                      onClick={() => {
                        if (index <= registrationStep) setRegistrationStep(index);
                      }}
                    >
                      <span>{index + 1}</span>
                      <strong>{phase.title}</strong>
                    </button>
                  ))}
                </div>

                <section className={styles.phasePanel}>
                  <div className={styles.phaseHeader}>
                    <span>Phase {registrationStep + 1} of {registrationPhases.length}</span>
                    <h2>{registrationPhases[registrationStep].title}</h2>
                    <p>{registrationPhases[registrationStep].description}</p>
                  </div>

                  {registrationStep === 0 && (
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
                        <label>Date of birth</label>
                        <div className={styles.calendarField}>
                          <input
                            type="date"
                            name="date_of_birth"
                            value={registration.date_of_birth}
                            onChange={handleRegistrationChange}
                            max={new Date().toISOString().split("T")[0]}
                            required
                          />
                          <span>{registration.age ? `${registration.age} years` : "Age"}</span>
                        </div>
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Email</label>
                        <input type="email" name="email" value={registration.email} onChange={handleRegistrationChange} required />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Phone</label>
                        <div className={styles.phoneField}>
                          <div className={styles.countryCodeSelect}>
                            <CustomSelect
                              label="Country code"
                              value={registration.phone_country_code}
                              options={countryCallingCodeOptions}
                              onChange={(value) => {
                                setRegistration((current) => ({
                                  ...current,
                                  phone_country_code: value,
                                }));
                              }}
                            />
                          </div>
                          <input
                            name="phone"
                            value={registration.phone}
                            onChange={handleRegistrationChange}
                            inputMode="tel"
                            autoComplete="tel-national"
                            placeholder="Phone number"
                          />
                        </div>
                      </div>
                      <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                        <label>Residential address</label>
                        <input name="address" value={registration.address} onChange={handleRegistrationChange} />
                      </div>
                    </div>
                  )}

                  {registrationStep === 1 && (
                    <div className={styles.formGrid}>
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
                      <div className={`${styles.reviewCard} ${styles.fullWidth}`}>
                        <strong>Review requirement</strong>
                        <p>Choose either passport or driver license. The selected document must match the front and back images uploaded in the next phase.</p>
                      </div>
                    </div>
                  )}

                  {registrationStep === 2 && (
                    <div className={styles.uploadGrid}>
                      <div className={`${styles.uploadTile} ${cameraTarget === "id_front" ? styles.activeUploadTile : ""}`}>
                        <span>ID front</span>
                        {cameraTarget === "id_front" ? (
                          <>
                            {cameraError ? (
                              <div className={styles.cameraError}>
                                <p>{cameraError}</p>
                                <input
                                  type="file"
                                  name="id_front"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={handleFileChange}
                                />
                              </div>
                            ) : (
                              <video ref={videoRef} className={styles.cameraVideo} playsInline muted />
                            )}
                            <div className={styles.captureActions}>
                              <button className={styles.captureBtn} type="button" onClick={captureCameraPhoto} disabled={!!cameraError}>
                                Capture front
                              </button>
                              <button type="button" className={styles.clearCaptureBtn} onClick={() => setCameraTarget("")}>
                                Close
                              </button>
                            </div>
                          </>
                        ) : filePreviews.id_front ? (
                          <img src={filePreviews.id_front} alt="ID front preview" />
                        ) : (
                          <div className={styles.cameraPlaceholder}>Live card photo</div>
                        )}
                        {cameraTarget !== "id_front" && (
                          <button type="button" onClick={() => setCameraTarget("id_front")}>
                            {filePreviews.id_front ? "Retake front" : "Open camera"}
                          </button>
                        )}
                        {cameraTarget !== "id_front" && filePreviews.id_front && (
                          <button type="button" className={styles.clearCaptureBtn} onClick={() => clearDocument("id_front")}>
                            Clear
                          </button>
                        )}
                      </div>

                      <div className={`${styles.uploadTile} ${cameraTarget === "id_back" ? styles.activeUploadTile : ""}`}>
                        <span>ID back</span>
                        {cameraTarget === "id_back" ? (
                          <>
                            {cameraError ? (
                              <div className={styles.cameraError}>
                                <p>{cameraError}</p>
                                <input
                                  type="file"
                                  name="id_back"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={handleFileChange}
                                />
                              </div>
                            ) : (
                              <video ref={videoRef} className={styles.cameraVideo} playsInline muted />
                            )}
                            <div className={styles.captureActions}>
                              <button className={styles.captureBtn} type="button" onClick={captureCameraPhoto} disabled={!!cameraError}>
                                Capture back
                              </button>
                              <button type="button" className={styles.clearCaptureBtn} onClick={() => setCameraTarget("")}>
                                Close
                              </button>
                            </div>
                          </>
                        ) : filePreviews.id_back ? (
                          <img src={filePreviews.id_back} alt="ID back preview" />
                        ) : (
                          <div className={styles.cameraPlaceholder}>Live card photo</div>
                        )}
                        {cameraTarget !== "id_back" && (
                          <button type="button" onClick={() => setCameraTarget("id_back")}>
                            {filePreviews.id_back ? "Retake back" : "Open camera"}
                          </button>
                        )}
                        {cameraTarget !== "id_back" && filePreviews.id_back && (
                          <button type="button" className={styles.clearCaptureBtn} onClick={() => clearDocument("id_back")}>
                            Clear
                          </button>
                        )}
                      </div>

                      <div className={`${styles.uploadTile} ${cameraTarget === "face_photo" ? styles.activeUploadTile : ""}`}>
                        <span>Face photo</span>
                        {cameraTarget === "face_photo" ? (
                          <>
                            {cameraError ? (
                              <div className={styles.cameraError}>
                                <p>{cameraError}</p>
                                <input
                                  type="file"
                                  name="face_photo"
                                  accept="image/*"
                                  capture="user"
                                  onChange={handleFileChange}
                                />
                              </div>
                            ) : (
                              <video ref={videoRef} className={styles.cameraVideo} playsInline muted />
                            )}
                            <div className={styles.captureActions}>
                              <button className={styles.captureBtn} type="button" onClick={captureCameraPhoto} disabled={!!cameraError}>
                                Capture face
                              </button>
                              <button type="button" className={styles.clearCaptureBtn} onClick={() => setCameraTarget("")}>
                                Close
                              </button>
                            </div>
                          </>
                        ) : filePreviews.face_photo ? (
                          <img src={filePreviews.face_photo} alt="Face preview" />
                        ) : (
                          <div className={styles.cameraPlaceholder}>Live face photo</div>
                        )}
                        {cameraTarget !== "face_photo" && (
                          <button type="button" onClick={() => setCameraTarget("face_photo")}>
                            {filePreviews.face_photo ? "Retake face" : "Open camera"}
                          </button>
                        )}
                        {cameraTarget !== "face_photo" && filePreviews.face_photo && (
                          <button type="button" className={styles.clearCaptureBtn} onClick={() => clearDocument("face_photo")}>
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {registrationStep === 3 && (
                    <div className={styles.formGrid}>
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
                      <div className={`${styles.reviewCard} ${styles.fullWidth}`}>
                        <strong>Final review</strong>
                        <p>After submission, an admin reviews the application. If approved, account numbers are generated and sent by email.</p>
                      </div>
                    </div>
                  )}
                </section>

                <div className={styles.phaseActions}>
                  <button
                    className={styles.secondaryBtn}
                    type="button"
                    onClick={goToPreviousRegistrationStep}
                    disabled={registrationStep === 0 || loading}
                  >
                    Back
                  </button>

                  {registrationStep < registrationPhases.length - 1 ? (
                    <button className={styles.primaryBtn} type="button" onClick={goToNextRegistrationStep}>
                      Continue
                    </button>
                  ) : (
                    <button className={styles.primaryBtn} type="submit" disabled={loading}>
                      {loading ? "Submitting..." : "Submit for approval"}
                    </button>
                  )}
                </div>
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
            <h2>Bank smarter with secure online banking built for daily control.</h2>
            <p>
              West Bridge Vault Reserve gives you seamless transfers, account visibility,
              funding support, and a modern banking experience built for today.
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
            <div className={styles.cardBrand}>WB</div>
            <div className={styles.cardNumber}>1234 5678 9012 3456</div>
            <div className={styles.cardFooter}>
              <span>VALID THRU 08/32</span>
              <span>WESTBRIDGE</span>
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
