import { networkInterfaces } from "node:os";

type InterfaceInfo = { address: string; family: string; internal: boolean };

/** First non-internal IPv4, so a phone can reach the dev server. */
export function pickLanHost(
  interfaces: Record<string, InterfaceInfo[] | undefined> = networkInterfaces(),
) {
  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal)
        return address.address;
    }
  }
  return null;
}

/**
 * The QR points at the verify page. A phone cannot resolve localhost, so in
 * dev the loopback host is swapped for the machine's LAN address.
 */
export function verifyBaseUrl(
  protocol: string,
  host: string,
  lan: string | null = pickLanHost(),
) {
  const [hostname, port] = host.split(":");
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    return `${protocol}://${host}`;
  }
  return lan
    ? `${protocol}://${lan}${port ? `:${port}` : ""}`
    : `${protocol}://${host}`;
}
