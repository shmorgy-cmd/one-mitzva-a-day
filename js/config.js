/**
 * config.js — IDs for the optional outside services. Each feature stays
 * switched off while its value is empty, so the site never contacts a service
 * that hasn't been set up.
 */
const SITE_CONFIG = {
  // OneSignal web push (weekly / holiday messages). From the OneSignal
  // dashboard: Settings → Keys & IDs → "OneSignal App ID".
  oneSignalAppId: "",

  // GoatCounter analytics (no cookies, no personal data). The part before
  // ".goatcounter.com" in your GoatCounter site address, e.g. "onemitzva".
  goatCounterCode: "",

  // Kit (kit.com) weekly email sign-up. In Kit: Grow → Landing Pages & Forms →
  // your form → Publish → HTML; the number in
  // action="https://app.kit.com/forms/1234567/subscriptions" is the form ID.
  kitFormId: "",

  // "Report an error" links go here. Leave empty to use GitHub issues instead.
  reportEmail: "",
  reportIssuesUrl: "https://github.com/shmorgy-cmd/one-mitzva-a-day/issues/new"
};
