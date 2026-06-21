import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LanguageSwitcher, { prepareSavedGoogleLanguage } from "../../components/ui/LanguageSwitcher";

const STYLE_TWO_ROOT = "/style-two/";

const pageFiles = {
  home: "index.html",
  about: "about.html",
  services: "services.html",
  contact: "contact.html",
  faq: "faq.html",
  terms: "terms.html",
};

const stylesheets = [
  "temp/custom/base/css/bootstrap.min.css",
  "temp/custom/base/css/magnific-popup.css",
  "temp/custom/base/css/themify-icons.css",
  "temp/custom/base/css/all.min.css",
  "temp/custom/base/css/animate.min.css",
  "temp/custom/base/css/jquery.mb.YTPlayer.min.css",
  "temp/custom/base/css/owl.carousel.min.css",
  "temp/custom/base/css/owl.theme.default.min.css",
  "temp/custom/base/css/style.css",
  "temp/custom/base/css/responsive.css",
  "temp/custom/base/css/customstyle.css",
];

const scripts = [
  "temp/custom/base/js/jquery-3.4.1.min.js",
  "temp/custom/base/js/popper.min.js",
  "temp/custom/base/js/bootstrap.min.js",
  "temp/custom/base/js/jquery.magnific-popup.min.js",
  "temp/custom/base/js/jquery.easing.min.js",
  "temp/custom/base/js/jquery.mb.YTPlayer.min.js",
  "temp/custom/base/js/mixitup.min.js",
  "temp/custom/base/js/wow.min.js",
  "temp/custom/base/js/owl.carousel.min.js",
  "temp/custom/base/js/jquery.countdown.min.js",
  "temp/custom/base/js/all.min.js",
];

function styleTwoUrl(path) {
  return `${STYLE_TWO_ROOT}${path.replace(/^\/+/, "")}`;
}

function normalizeRoute(value) {
  const clean = value.replace(/^\.?\//, "").replace(/\.html$/, "").replace(/\/$/, "");

  if (!clean || clean === "index") return "/";
  if (clean === "about") return "/about";
  if (clean === "services" || clean === "service") return "/services";
  if (clean === "faq" || clean === "faqs") return "/faq";
  if (clean === "contact" || clean === "support") return "/contact";
  if (clean === "terms") return "/terms";
  if (clean === "login" || clean === "auth") return "/auth?mode=login";
  if (clean === "register") return "/auth?mode=register";

  return null;
}

function isExternal(value) {
  return /^(https?:|mailto:|tel:|#|javascript:)/i.test(value);
}

function rewriteAsset(value) {
  if (!value || isExternal(value) || value.startsWith("/")) return value;
  if (value.startsWith("../")) return value.replace(/^\.\.\//, "/");
  return styleTwoUrl(value);
}

function rewriteHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  doc.querySelectorAll("script").forEach((node) => node.remove());
  doc.querySelectorAll("link[rel='stylesheet']").forEach((node) => node.remove());

  doc.querySelectorAll("[src]").forEach((node) => {
    node.setAttribute("src", rewriteAsset(node.getAttribute("src")));
  });

  doc.querySelectorAll("[poster]").forEach((node) => {
    node.setAttribute("poster", rewriteAsset(node.getAttribute("poster")));
  });

  doc.querySelectorAll("a[href]").forEach((node) => {
    const href = node.getAttribute("href");
    if (!href || isExternal(href)) return;

    const route = normalizeRoute(href);
    node.setAttribute("href", route || rewriteAsset(href));
  });

  doc.querySelectorAll("form[action]").forEach((node) => {
    const action = node.getAttribute("action");
    const route = normalizeRoute(action || "");
    node.setAttribute("action", route || "/contact");
  });

  return doc.body.innerHTML;
}

function ensureStyleTwoAssets() {
  stylesheets.forEach((href) => {
    const id = `style-two-css-${href}`;
    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = styleTwoUrl(href);
    document.head.appendChild(link);
  });

  if (window.__styleTwoScriptsLoaded) return window.__styleTwoScriptsLoaded;

  window.__styleTwoScriptsLoaded = scripts.reduce((chain, src) => {
    return chain.then(
      () =>
        new Promise((resolve) => {
          const id = `style-two-js-${src}`;
          if (document.getElementById(id)) {
            resolve();
            return;
          }

          const script = document.createElement("script");
          script.id = id;
          script.src = styleTwoUrl(src);
          script.async = false;
          script.onload = resolve;
          script.onerror = resolve;
          document.body.appendChild(script);
        })
    );
  }, Promise.resolve());

  return window.__styleTwoScriptsLoaded;
}

function initializeStyleTwoPage() {
  const $ = window.jQuery;
  const locationField = document.getElementById("location");

  if (locationField) {
    locationField.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  if (!$) return;

  $(".loader1").delay(200).fadeOut("fade");
  $(".telegram-popup").delay(3000).show(0);

  if ($.fn?.owlCarousel) {
    $(".hero-content-slider").owlCarousel({
      loop: false,
      autoplay: true,
      dots: true,
      autoplayHoverPause: true,
      items: 1,
      smartSpeed: 1000,
      animateOut: "slideOutUp",
      animateIn: "slideInDown",
    });

    $(".clients-carousel").owlCarousel({
      autoplay: true,
      loop: true,
      margin: 15,
      dots: false,
      slideTransition: "linear",
      autoplayTimeout: 4500,
      autoplayHoverPause: true,
      autoplaySpeed: 4500,
      responsive: {
        0: { items: 2 },
        500: { items: 3 },
        600: { items: 4 },
        800: { items: 5 },
        1200: { items: 6 },
      },
    });
  }

  if (window.WOW) {
    new window.WOW({ offset: 100, mobile: true }).init();
  }
}

function StyleTwoPage({ page }) {
  const file = useMemo(() => pageFiles[page] || pageFiles.home, [page]);
  const [markup, setMarkup] = useState("");
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;

    ensureStyleTwoAssets();

    fetch(styleTwoUrl(file))
      .then((response) => response.text())
      .then((html) => {
        if (active) setMarkup(rewriteHtml(html));
      });

    return () => {
      active = false;
    };
  }, [file]);

  useEffect(() => {
    if (!markup) return undefined;

    let cancelled = false;

    ensureStyleTwoAssets().then(() => {
      if (!cancelled) {
        initializeStyleTwoPage();
        prepareSavedGoogleLanguage({
          timeout: 5200,
          minDelay: 300,
          settleDelay: 900,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [markup]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    const onClick = (event) => {
      const link = event.target.closest("a[href]");
      if (!link || !root.contains(link)) return;

      const href = link.getAttribute("href");
      if (!href || isExternal(href)) return;

      event.preventDefault();
      navigate(href);
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [navigate, location.pathname]);

  return (
    <>
      <div className="style-two-language-switcher">
        <LanguageSwitcher compact menuAlign="left" />
      </div>
      <div
        ref={containerRef}
        className="style-two-page"
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    </>
  );
}

export function WestBridgeHomePage() {
  return <StyleTwoPage page="home" />;
}

export function WestBridgeAboutPage() {
  return <StyleTwoPage page="about" />;
}

export function WestBridgeProjectsPage() {
  return <StyleTwoPage page="services" />;
}

export function WestBridgeServicesPage() {
  return <StyleTwoPage page="services" />;
}

export function WestBridgeContactPage() {
  return <StyleTwoPage page="contact" />;
}

export function WestBridgeFaqPage() {
  return <StyleTwoPage page="faq" />;
}

export function WestBridgeTermsPage() {
  return <StyleTwoPage page="terms" />;
}
