import dns from 'dns';
import { promisify } from 'util';

const resolve4Async = promisify(dns.resolve4);
const resolve6Async = promisify(dns.resolve6);

// Private IPv4 ranges and link-local metadata addresses
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  // 127.0.0.0/8 (Loopback)
  if (parts[0] === 127) return true;
  // 10.0.0.0/8 (Private)
  if (parts[0] === 10) return true;
  // 172.16.0.0/12 (Private)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 169.254.0.0/16 (Link-local / Cloud Metadata e.g. 169.254.169.254)
  if (parts[0] === 169 && parts[1] === 254) return true;
  // 0.0.0.0/8 (Current network)
  if (parts[0] === 0) return true;
  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (parts[0] >= 224) return true;

  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  // Loopback ::1
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
  // Link-local fe80::
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true;
  // Unique local fc00::/7
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  // IPv4-mapped IPv6
  if (normalized.includes('::ffff:')) {
    const ipv4 = normalized.split('::ffff:')[1];
    if (ipv4 && isPrivateIPv4(ipv4)) return true;
  }
  return false;
}

export interface SecurityValidationResult {
  valid: boolean;
  error?: string;
  sanitizedUrl?: string;
  hostname?: string;
}

/**
 * Validates a website URL against SSRF attacks, internal IPs,
 * invalid protocols, metadata endpoints, and non-standard ports.
 */
export async function validateWebsiteUrl(rawUrl: string): Promise<SecurityValidationResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  let trimmed = rawUrl.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = 'https://' + trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Explicit forbidden hostnames
  const forbiddenHostnames = ['localhost', 'metadata.google.internal', 'instance-data', '169.254.169.254'];
  if (forbiddenHostnames.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return { valid: false, error: 'Access to internal hostnames or metadata services is blocked' };
  }

  // If port is specified, restrict to standard web ports
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    return { valid: false, error: 'Only standard web ports (80, 443) are allowed' };
  }

  // Resolve hostname to IP to protect against DNS rebinding & private IP access
  try {
    const ipv4s = await resolve4Async(hostname).catch(() => []);
    for (const ip of ipv4s) {
      if (isPrivateIPv4(ip)) {
        return { valid: false, error: `Resolved IP (${ip}) is in a private or restricted network range` };
      }
    }

    const ipv6s = await resolve6Async(hostname).catch(() => []);
    for (const ip of ipv6s) {
      if (isPrivateIPv6(ip)) {
        return { valid: false, error: `Resolved IPv6 (${ip}) is in a private or restricted network range` };
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // If it's an IP address itself, check directly
    if (isPrivateIPv4(hostname)) {
      return { valid: false, error: 'Access to private IP addresses is blocked' };
    }
    // DNS resolution failure for a regular domain
    if (message.includes('ENOTFOUND')) {
      return { valid: false, error: `Could not resolve domain '${hostname}'. Please check domain name.` };
    }
  }

  return {
    valid: true,
    sanitizedUrl: parsed.toString(),
    hostname,
  };
}

/**
 * Validates reverse-domain package identifier (e.g. com.example.bapp)
 */
export function validatePackageId(packageId: string): { valid: boolean; error?: string } {
  if (!packageId) return { valid: false, error: 'Package ID cannot be empty' };
  const pattern = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;
  if (!pattern.test(packageId)) {
    return {
      valid: false,
      error: 'Package ID must follow reverse domain notation (e.g. com.company.app) and contain only letters, numbers, underscores, and periods.',
    };
  }
  const parts = packageId.split('.');
  if (parts.length < 2) {
    return { valid: false, error: 'Package ID must contain at least two segments (e.g. com.myapp).' };
  }
  const reservedKeywords = ['abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while'];
  for (const part of parts) {
    if (reservedKeywords.includes(part.toLowerCase())) {
      return { valid: false, error: `'${part}' is a reserved programming keyword and cannot be used in a Package ID.` };
    }
  }
  return { valid: true };
}

/**
 * Redacts secrets, tokens, passwords, and private keys from terminal logs
 */
export function redactSecrets(text: string): string {
  if (!text) return '';
  return text
    .replace(/(?:password|passwd|secret|api[_-]?key|token|auth)["']?\s*[:=]\s*["']?([^\s"',;]+)/gi, '$1: [REDACTED]')
    .replace(/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC )?PRIVATE KEY-----/g, '[REDACTED PRIVATE KEY]')
    .replace(/Bearer\s+[a-zA-Z0-9._~+/-]+=*/g, 'Bearer [REDACTED]');
}
