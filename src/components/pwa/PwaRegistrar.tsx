"use client";

import { useEffect } from "react";

export function PwaRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silent fail in unsupported/private modes.
      });
    };

    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return null;
}
