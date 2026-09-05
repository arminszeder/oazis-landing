// Content-Security-Policy notes: Next inlines its bootstrap script and its
// font/style tags, so 'unsafe-inline' is required for script and style until
// the app moves to nonces. The only third party allowed is the Meta pixel:
// its loader comes from connect.facebook.net and it reports back to
// facebook.com / facebook.net over three transports: an image beacon, an XHR,
// and a hidden iframe posting a form.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.facebook.com",
  "font-src 'self' data:",
  "connect-src 'self' https://www.facebook.com https://connect.facebook.net",
  // The pixel falls back to a hidden iframe posting a form to facebook.com/tr/
  // when it cannot use the image beacon, so both need allowing or events are
  // dropped with only a console error to show for it.
  "frame-src https://www.facebook.com",
  "form-action 'self' https://www.facebook.com",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // frame-ancestors covers modern browsers; this covers the rest.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
