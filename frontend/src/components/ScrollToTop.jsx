import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

// React Router changes the page without a document reload. Always position
// the new page at its beginning, including footer and category links.
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  useLayoutEffect(() => {
    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) {
        target.scrollIntoView({ block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
  }, [pathname, search, hash]);
  return null;
}
