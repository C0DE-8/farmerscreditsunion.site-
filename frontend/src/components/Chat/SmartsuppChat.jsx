import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SMARTSUPP_CONFIG = {
  key: "9b56fa3303342809cc8f392ba7cf0468d0866750",
  scriptId: "smartsupp-live-chat-script",
  scriptSrc: "https://www.smartsuppchat.com/loader.js?",
};

function routeAllowsChat(pathname) {
  return !pathname.startsWith("/admin") && !pathname.startsWith("/lock/admin");
}

function setChatVisibility(visible) {
  document.documentElement.classList.toggle("smartsupp-chat-hidden", !visible);
}

function ensureChatOffsetStyles() {
  if (document.getElementById("smartsupp-chat-offset-styles")) return;

  const style = document.createElement("style");
  style.id = "smartsupp-chat-offset-styles";
  style.textContent = `
    .smartsupp-chat-hidden iframe[src*="smartsupp"],
    .smartsupp-chat-hidden #smartsupp-widget-container,
    .smartsupp-chat-hidden #smartsupp-chat-container,
    .smartsupp-chat-hidden [id*="smartsupp"],
    .smartsupp-chat-hidden [class*="smartsupp"] {
      display: none !important;
    }

    @media (max-width: 980px) {
      iframe[src*="smartsupp"],
      #smartsupp-widget-container,
      #smartsupp-chat-container,
      [id*="smartsupp"],
      [class*="smartsupp"] {
        bottom: 104px !important;
        right: 14px !important;
      }
    }
  `;
  document.head.appendChild(style);
}

export default function SmartsuppChat() {
  const location = useLocation();

  useEffect(() => {
    const allowed = routeAllowsChat(location.pathname);
    setChatVisibility(allowed);
    ensureChatOffsetStyles();

    if (!allowed) return undefined;

    window._smartsupp = window._smartsupp || {};
    window._smartsupp.key = SMARTSUPP_CONFIG.key;

    if (!window.smartsupp) {
      window.smartsupp = function smartsuppQueue() {
        window.smartsupp._.push(arguments);
      };
      window.smartsupp._ = [];
    }

    if (!document.getElementById(SMARTSUPP_CONFIG.scriptId)) {
      const firstScript = document.getElementsByTagName("script")[0];
      const script = document.createElement("script");
      script.id = SMARTSUPP_CONFIG.scriptId;
      script.type = "text/javascript";
      script.charset = "utf-8";
      script.async = true;
      script.src = SMARTSUPP_CONFIG.scriptSrc;
      firstScript.parentNode.insertBefore(script, firstScript);
    }

    if (window.smartsupp) {
      window.smartsupp("chat:show");
    }

    return undefined;
  }, [location.pathname]);

  return null;
}
