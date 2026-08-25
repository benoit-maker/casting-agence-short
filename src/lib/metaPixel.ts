declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackCompleteRegistration(eventId: string) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  window.fbq(
    "track",
    "CompleteRegistration",
    { content_name: "Inscription casting", status: true },
    { eventID: eventId }
  );
}
