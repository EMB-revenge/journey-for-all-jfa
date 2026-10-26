/**
 * QR base URL selection. Run with: npm run test
 */
import assert from "node:assert/strict";

import { pickLanHost, verifyBaseUrl } from "~/app/_lib/verify-url";

const loopback = { address: "127.0.0.1", family: "IPv4", internal: true };
const wifi = { address: "192.168.1.114", family: "IPv4", internal: false };
const ipv6 = { address: "::1", family: "IPv6", internal: false };

assert.equal(pickLanHost({ loopback: [loopback] }), null);
assert.equal(
  pickLanHost({ loopback: [loopback], wifi: [wifi] }),
  "192.168.1.114",
);
assert.equal(pickLanHost({ wifi: [ipv6] }), null, "IPv6 is skipped");

assert.equal(
  verifyBaseUrl("https", "jfa.example.com", "192.168.1.114"),
  "https://jfa.example.com",
  "a real host is left alone",
);
assert.equal(
  verifyBaseUrl("http", "localhost:3000", "192.168.1.114"),
  "http://192.168.1.114:3000",
  "localhost is swapped for the LAN address",
);
assert.equal(
  verifyBaseUrl("http", "127.0.0.1:3000", "192.168.1.114"),
  "http://192.168.1.114:3000",
);
assert.equal(
  verifyBaseUrl("http", "localhost:3000", null),
  "http://localhost:3000",
  "no LAN address keeps the original host",
);

console.log("verify-url.test: all assertions passed");
