import { useEffect, useLayoutEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FiArrowUp } from "react-icons/fi";
import "./ScrollToTop.css";

const jumpTop = () => {
  // Some browsers scroll <html>, others <body>. Reset both, without
  // animation when navigating between pages.
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

export default function ScrollToTop() {
  const { pathname, search, hash, key } = useLocation();
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    // React Router navigation creates a new location.key even if the user
    // clicked the link for the page they are already viewing.
    if (hash && hash !== "#page-top") {
      const id = decodeURIComponent(hash.slice(1));
      const target = document.getElementById(id);
      if (target) {
        requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
        return;
      }
    }
    jumpTop();
    const frame = requestAnimationFrame(jumpTop);
    return () => cancelAnimationFrame(frame);
  }, [key, pathname, search, hash]);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    // Also catches non-router hyperlinks targeting the current pathname.
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 ||
          event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const anchor = event.target.closest?.("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search &&
          (!url.hash || url.hash === "#page-top")) {
        requestAnimationFrame(jumpTop);
      }
    };
    const onScroll = () => setVisible(window.scrollY > 280);
    document.addEventListener("click", onClick, true);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", onScroll);
      if ("scrollRestoration" in window.history) window.history.scrollRestoration = previous;
    };
  }, []);

  return (
    <>
      <span id="page-top" className="bsp-page-top-anchor" aria-hidden="true" />
      {visible && (
        <a
          className="bsp-back-to-top"
          href="#page-top"
          aria-label="Back to the top of the page"
          title="Back to top"
          onClick={(event) => {
            event.preventDefault();
            const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? "instant" : "smooth" });
          }}
        >
          <FiArrowUp aria-hidden="true" />
          <span>Top</span>
        </a>
      )}
    </>
  );
}
