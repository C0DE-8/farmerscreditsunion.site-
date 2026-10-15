// Smartsupp Live Chat
var _smartsupp = _smartsupp || {};
_smartsupp.key = '8a588c36a5ba722ccdd8f477f01c4b285e3e748a';
window.smartsupp || (function (d) {
  var s, c, o = smartsupp = function () {
    o._.push(arguments);
  };
  o._ = [];
  s = d.getElementsByTagName('script')[0];
  c = d.createElement('script');
  c.type = 'text/javascript';
  c.charset = 'utf-8';
  c.async = true;
  c.src = 'https://www.smartsuppchat.com/loader.js?';
  s.parentNode.insertBefore(c, s);
})(document);

// WhatsApp click-to-chat widget. The link opens a real WhatsApp conversation.
(function () {
  var phoneNumber = '19714387002';
  var whatsappUrl = 'https://wa.me/' + phoneNumber;

  function addWhatsAppWidget() {
    if (document.getElementById('whatsapp-chat-widget')) return;

    var style = document.createElement('style');
    style.textContent = '\
      #whatsapp-chat-widget {\
        position: fixed;\
        left: 24px;\
        bottom: 24px;\
        z-index: 9998;\
        display: inline-flex;\
        align-items: center;\
        gap: 10px;\
        padding: 12px 18px 12px 14px;\
        border-radius: 999px;\
        background: #25d366;\
        color: #fff;\
        font: 600 14px/1.2 Arial, sans-serif;\
        text-decoration: none;\
        box-shadow: 0 4px 14px rgba(0, 0, 0, .22);\
        transition: background-color .2s ease, transform .2s ease;\
      }\
      #whatsapp-chat-widget:hover {\
        background: #1ebe5d;\
        color: #fff;\
        transform: translateY(-2px);\
      }\
      #whatsapp-chat-widget:focus-visible {\
        outline: 3px solid #111;\
        outline-offset: 3px;\
      }\
      #whatsapp-chat-widget svg { width: 25px; height: 25px; flex: 0 0 25px; }\
      @media (max-width: 480px) {\
        #whatsapp-chat-widget { left: 16px; bottom: 16px; width: 54px; height: 54px; padding: 0; justify-content: center; }\
        #whatsapp-chat-widget span { display: none; }\
      }\
    ';
    document.head.appendChild(style);

    var link = document.createElement('a');
    link.id = 'whatsapp-chat-widget';
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', 'Chat with us on WhatsApp');
    link.title = 'Chat with us on WhatsApp';
    link.innerHTML = '\
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">\
        <path fill="currentColor" d="M16 .8A15.1 15.1 0 0 0 3.05 23.67L1 31l7.5-1.97A15.1 15.1 0 1 0 16 .8Zm0 27.45c-2.3 0-4.56-.62-6.54-1.8l-.47-.28-4.45 1.17 1.19-4.34-.3-.48A12.3 12.3 0 1 1 16 28.25Zm6.76-9.22c-.37-.18-2.2-1.08-2.54-1.2-.34-.13-.59-.19-.84.18-.25.37-.96 1.2-1.18 1.45-.22.25-.44.28-.81.1-.37-.19-1.56-.58-2.97-1.84a11.1 11.1 0 0 1-2.05-2.55c-.21-.37-.02-.57.16-.75.16-.16.37-.44.56-.66.18-.22.24-.37.37-.62.12-.25.06-.47-.03-.66-.1-.18-.84-2.02-1.15-2.77-.3-.73-.61-.63-.84-.64l-.72-.02c-.25 0-.66.09-1 .47-.34.37-1.3 1.27-1.3 3.1s1.33 3.6 1.52 3.85c.19.25 2.62 4 6.35 5.6.89.39 1.58.62 2.12.79.9.28 1.72.24 2.37.15.73-.11 2.2-.9 2.5-1.77.31-.87.31-1.61.22-1.77-.1-.15-.35-.24-.72-.43Z"/>\
      </svg>\
      <span>Chat on WhatsApp</span>\
    ';
    document.body.appendChild(link);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addWhatsAppWidget);
  } else {
    addWhatsAppWidget();
  }
})();
