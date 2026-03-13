# TLS / Certificate Management / mTLS

> The lock icon 🔒 in your browser address bar, the S in HTTPS, "this connection is secure" — all thanks to TLS. When certificates expire, sites become inaccessible. Misconfigured certificates cause security incidents. This is essential DevOps territory.

---

## 🎯 Why Do You Need to Know This?

```
Real-world TLS/Certificate tasks:
• HTTPS setup (Nginx, ALB)                       → Issue + install certificate
• "Certificate expired!"                          → Auto-renewal (Let's Encrypt)
• "NET::ERR_CERT_AUTHORITY_INVALID"               → Diagnose certificate chain issue
• AWS ACM certificate management                  → Connect to ALB/CloudFront
• Encrypted communication between microservices   → mTLS (Istio, etc)
• Wildcard certificates                           → *.example.com
• Certificate info check/debugging                → openssl commands
```

In [the previous lecture](./02-http), we learned that HTTPS = HTTP + TLS. Now let's dive deep into how TLS works and how to manage certificates.

---

## 🧠 Core Concepts

### Analogy: ID + Encrypted Letters

Let's think of TLS as **ID verification + encrypted letters**.

* **Certificate** = ID card. Proves "This is really google.com"
* **CA (Certificate Authority)** = Government agency issuing IDs. Trusted institutions (Let's Encrypt, DigiCert, etc)
* **Private Key** = Seal/stamp. Decrypts encrypted communication. NEVER expose!
* **TLS Handshake** = Verify ID then agree on encryption method
* **mTLS** = Mutual verification. Both server and client authenticate

```mermaid
flowchart TD
    subgraph "Regular TLS (HTTPS)"
        C1["Client<br/>(Browser)"] -->|"Verify server cert<br/>'Is this really google.com?'"| S1["Server<br/>(google.com)"]
        S1 -->|"Present certificate<br/>'Yes, CA vouches for me'"| C1
    end

    subgraph "mTLS (Bidirectional)"
        C2["Client<br/>(Service A)"] -->|"Verify server cert"| S2["Server<br/>(Service B)"]
        S2 -->|"Present server cert"| C2
        S2 -->|"Request client cert"| C2
        C2 -->|"Present client cert"| S2
    end

    style C1 fill:#3498db,color:#fff
    style S2 fill:#2ecc71,color:#fff
```

---

## 🔍 Detailed Explanation — TLS Operation

### TLS Handshake (Connection Establishment)

Happens after [TCP 3-way handshake](./01-osi-tcp-udp).

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    Note over C,S: TCP 3-way Handshake complete

    C->>S: ClientHello<br/>Supported TLS versions, encryption methods
    S->>C: ServerHello<br/>Selected TLS version, encryption method
    S->>C: Certificate<br/>Server certificate (contains public key)
    S->>C: ServerHelloDone

    Note over C: Verify certificate<br/>1. Check CA signature<br/>2. Check domain match<br/>3. Check expiry

    C->>S: ClientKeyExchange<br/>Exchange encryption key
    C->>S: ChangeCipherSpec<br/>"Starting encryption now"
    C->>S: Finished (encrypted)

    S->>C: ChangeCipherSpec
    S->>C: Finished (encrypted)

    Note over C,S: 🔒 Encrypted communication begins!
```

**TLS 1.2 vs TLS 1.3:**

| Item | TLS 1.2 | TLS 1.3 |
|------|---------|---------|
| Handshake round trips | 2-RTT | **1-RTT** (faster!) |
| 0-RTT | ❌ | ✅ (when resuming previous connection) |
| Security | Good | **Stronger** (weak ciphers removed) |
| Support | Almost all servers | Modern servers (recommended) |

```bash
# Check server TLS version
curl -v https://example.com 2>&1 | grep "SSL connection"
# * SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384

# Detailed check with openssl
openssl s_client -connect example.com:443 -tls1_3 < /dev/null 2>/dev/null | grep "Protocol"
# Protocol  : TLSv1.3

# Force TLS 1.2 connection
openssl s_client -connect example.com:443 -tls1_2 < /dev/null 2>/dev/null | grep "Protocol"
# Protocol  : TLSv1.2
```

---

### Certificate Structure

```bash
# View certificate contents
openssl x509 -in cert.pem -text -noout

# Sample output (key parts):
# Certificate:
#     Data:
#         Version: 3 (0x2)
#         Serial Number: 04:00:00:00:00:01:15:4b:5a:c3:94
#         Issuer: C=US, O=Let's Encrypt, CN=R3             ← Issuer (CA)
#         Validity
#             Not Before: Mar  1 00:00:00 2025 GMT         ← Start date
#             Not After : May 30 23:59:59 2025 GMT         ← Expiry date ⭐
#         Subject: CN=example.com                           ← Target domain
#         Subject Public Key Info:
#             Public Key Algorithm: id-ecPublicKey
#             Public-Key: (256 bit)                         ← Public key
#         X509v3 extensions:
#             X509v3 Subject Alternative Name:              ← SAN (multiple domains)
#                 DNS:example.com, DNS:www.example.com
```

### Certificate Chain (Chain of Trust)

Browser trusts a certificate only if **the complete chain to Root CA** is present.

```mermaid
flowchart TD
    ROOT["Root CA Certificate<br/>(Built into browser)<br/>Example: ISRG Root X1"]
    INTER["Intermediate CA Certificate<br/>(Middle certificate)<br/>Example: Let's Encrypt R3"]
    LEAF["Server Certificate<br/>(Leaf/End-entity)<br/>Example: example.com"]

    ROOT -->|"Signed by"| INTER
    INTER -->|"Signed by"| LEAF

    BROWSER["Browser verification:<br/>1. Server cert signed by Intermediate CA? ✅<br/>2. Intermediate signed by Root CA? ✅<br/>3. Root CA in my trust list? ✅<br/>→ Certificate trusted!"]

    style ROOT fill:#e74c3c,color:#fff
    style INTER fill:#f39c12,color:#fff
    style LEAF fill:#2ecc71,color:#fff
```

```bash
# Check certificate chain
openssl s_client -connect example.com:443 -showcerts < /dev/null 2>/dev/null
# Certificate chain
#  0 s:CN = example.com                      ← Server certificate
#    i:C = US, O = Let's Encrypt, CN = R3
#  1 s:C = US, O = Let's Encrypt, CN = R3    ← Intermediate certificate
#    i:O = Internet Security Research Group, CN = ISRG Root X1

# If chain is incomplete:
# "NET::ERR_CERT_AUTHORITY_INVALID" error!
# → Need to install intermediate certificate on server

# Validate chain online:
# https://www.ssllabs.com/ssltest/
# → Enter domain to check certificate chain, TLS version, security grade
```

### Certificate File Formats

| Extension | Format | Description |
|-----------|--------|-------------|
| `.pem` | Base64 text | Most common. Starts with `-----BEGIN CERTIFICATE-----` |
| `.crt` | PEM or DER | Certificate file (usually PEM) |
| `.key` | PEM | Private key file |
| `.csr` | PEM | Certificate signing request |
| `.der` | Binary | DER encoding |
| `.pfx` / `.p12` | Binary | Certificate + private key bundle (Windows) |
| `.ca-bundle` | PEM | Intermediate certificate chain |

```bash
# Example PEM file contents
cat cert.pem
# -----BEGIN CERTIFICATE-----
# MIIFjTCCA3WgAwIBAgIRANOxciY0IzLc9AUoUSrsnGowDQYJKoZIhvcNAQEL...
# ...
# -----END CERTIFICATE-----

# Private key file
cat privkey.pem
# -----BEGIN PRIVATE KEY-----
# MIIEvgIBADANBgkqhkiG9w0BAQEFAASC...
# ...
# -----END PRIVATE KEY-----

# ⚠️ NEVER expose private key!
# Permissions: chmod 600 privkey.pem
```

---

## 🔍 Detailed Explanation — Certificate Issuance and Management

### Let's Encrypt — Free Certificates (★ Most widely used)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx    # Ubuntu + Nginx

# === Method 1: Nginx auto-setup (easiest) ===
sudo certbot --nginx -d example.com -d www.example.com
# → Automatically:
# 1. Verify domain ownership (HTTP validation)
# 2. Issue certificate
# 3. Add SSL to Nginx config
# 4. Set up HTTP → HTTPS redirect

# Result:
# Certificate: /etc/letsencrypt/live/example.com/fullchain.pem
# Private key: /etc/letsencrypt/live/example.com/privkey.pem

# === Method 2: Standalone (without web server) ===
sudo certbot certonly --standalone -d example.com
# → certbot starts a temporary web server for validation
# → Port 80 must be available

# === Method 3: DNS validation (wildcard certificates) ===
sudo certbot certonly --manual --preferred-challenges dns \
    -d "*.example.com" -d "example.com"
# → Need to manually add TXT record
# → Automated: --dns-route53, --dns-cloudflare plugins

# Route53 automation:
sudo certbot certonly --dns-route53 \
    -d "*.example.com" -d "example.com"
# → Automatically adds/removes TXT record via Route53 API!
```

```bash
# Certificate file locations
ls -la /etc/letsencrypt/live/example.com/
# cert.pem       → Server certificate
# chain.pem      → Intermediate certificate chain
# fullchain.pem  → Server + intermediate certs (⭐ Use in Nginx)
# privkey.pem    → Private key (⭐ NEVER expose!)

# Check certificate info
sudo certbot certificates
# Found the following certs:
#   Certificate Name: example.com
#     Serial Number: 04abc123def456
#     Key Type: ECDSA
#     Domains: example.com www.example.com
#     Expiry Date: 2025-05-30 23:59:59+00:00 (VALID: 79 days)
#     Certificate Path: /etc/letsencrypt/live/example.com/fullchain.pem
#     Private Key Path: /etc/letsencrypt/live/example.com/privkey.pem
```

### Automatic Certificate Renewal (★ Essential for production!)

Let's Encrypt certificates are valid for 90 days. Must set up auto-renewal.

```bash
# certbot automatically registers timer/cron on install

# Check systemd timer (Ubuntu 20+)
systemctl list-timers | grep certbot
# Wed 2025-03-12 12:00:00 ... certbot.timer  certbot.service

# Or check cron
cat /etc/cron.d/certbot
# 0 */12 * * * root test -x /usr/bin/certbot -a \! -d /run/systemd/system && perl -e 'sleep int(rand(43200))' && certbot -q renew

# Test renewal (simulation, doesn't actually renew)
sudo certbot renew --dry-run
# Congratulations, all simulated renewals succeeded:
#   /etc/letsencrypt/live/example.com/fullchain.pem (success)

# Manual renewal (actual)
sudo certbot renew

# Renewal with Nginx reload hook
sudo certbot renew --deploy-hook "systemctl reload nginx"

# Or configure hook permanently
cat /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
#!/bin/bash
systemctl reload nginx

chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

### Auto-Renewal Monitoring

```bash
# Certificate expiry check script ([cron lecture](../01-linux/06-cron) reference)
cat << 'SCRIPT' > /opt/scripts/check-cert.sh
#!/bin/bash
DOMAIN="${1:-example.com}"
PORT="${2:-443}"
DAYS_WARN=14

EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:$PORT" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

if [ -z "$EXPIRY" ]; then
    echo "❌ $DOMAIN: Certificate lookup failed"
    exit 1
fi

EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

if [ "$DAYS_LEFT" -lt 0 ]; then
    echo "🔴 $DOMAIN: Certificate expired! ($EXPIRY)"
elif [ "$DAYS_LEFT" -lt "$DAYS_WARN" ]; then
    echo "🟡 $DOMAIN: Expires in ${DAYS_LEFT} days! ($EXPIRY)"
else
    echo "🟢 $DOMAIN: ${DAYS_LEFT} days remaining ($EXPIRY)"
fi
SCRIPT
chmod +x /opt/scripts/check-cert.sh

# Run it
/opt/scripts/check-cert.sh example.com
# 🟢 example.com: 79 days remaining (May 30 23:59:59 2025 GMT)

# Check multiple domains
for domain in example.com api.example.com admin.example.com; do
    /opt/scripts/check-cert.sh "$domain"
done

# Add to cron for daily checks + alerts
# 0 9 * * *  /opt/scripts/check-cert.sh example.com | grep -E "🔴|🟡" && <alert command>
```

---

### AWS ACM (Certificate Manager)

For AWS services (ALB, CloudFront, API Gateway), ACM is the easiest. **Free and auto-renewing**.

```bash
# ACM certificate features:
# ✅ Free
# ✅ Auto-renewal (no expiry worries!)
# ✅ Direct integration with ALB, CloudFront
# ❌ Can't install on EC2 directly (for ALB/CloudFront behind only)
# ❌ Can't download (AWS-only use)

# Issue ACM certificate (AWS CLI)
aws acm request-certificate \
    --domain-name "example.com" \
    --subject-alternative-names "*.example.com" \
    --validation-method DNS

# Add DNS validation record to Route53 (automatic or manual)
# → CNAME record added → Validation completes → Certificate issued!

# List certificates
aws acm list-certificates --region ap-northeast-2
# {
#     "CertificateSummaryList": [
#         {
#             "CertificateArn": "arn:aws:acm:ap-northeast-2:123456:certificate/abc-123",
#             "DomainName": "example.com",
#             "Status": "ISSUED"
#         }
#     ]
# }

# Attach to ALB:
# ALB Listener → HTTPS:443 → Select ACM certificate
# → Done! Auto-renews, no worries
```

**Let's Encrypt vs ACM:**

| Item | Let's Encrypt | AWS ACM |
|------|--------------|---------|
| Cost | Free | Free |
| Auto-renewal | Needs certbot setup | ✅ Fully automatic |
| Validity | 90 days | 13 months (auto-renew) |
| Install on EC2 | ✅ Possible | ❌ Not possible |
| ALB/CloudFront | ❌ (manual upload) | ✅ Direct integration |
| Wildcard | ✅ (DNS validation) | ✅ (DNS validation) |
| Recommended for | EC2 with Nginx | ALB/CloudFront |

---

### Nginx SSL Configuration

```bash
# /etc/nginx/sites-available/example.com

server {
    listen 80;
    server_name example.com www.example.com;

    # HTTP → HTTPS redirect
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    # Certificate files
    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # TLS versions (1.2 and 1.3 only)
    ssl_protocols TLSv1.2 TLSv1.3;

    # Encryption methods (strong only)
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # OCSP Stapling (speeds up cert validation)
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/example.com/chain.pem;

    # HSTS (tell browsers "always use HTTPS")
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # SSL session caching (speeds up reconnections)
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # Rest of config...
    location / {
        proxy_pass http://backend;
    }
}
```

```bash
# Validate config syntax
sudo nginx -t
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Apply
sudo systemctl reload nginx

# Check SSL rating online
# https://www.ssllabs.com/ssltest/analyze.html?d=example.com
# → Goal: A+ grade!
```

---

## 🔍 Detailed Explanation — mTLS

### What is mTLS (Mutual TLS)?

Regular TLS authenticates the **server only**. mTLS authenticates **both server and client**.

```mermaid
flowchart LR
    subgraph "Regular TLS"
        C1["Client"] -->|"Verify server"| S1["Server"]
        S1 -->|"Present cert"| C1
        C1 -.->|"'Who are you?' not asked"| S1
    end

    subgraph "mTLS"
        C2["Client<br/>(has certificate)"] -->|"Verify server"| S2["Server<br/>(has certificate)"]
        S2 -->|"Present server cert"| C2
        S2 -->|"'Show me your cert'"| C2
        C2 -->|"Present client cert"| S2
    end

    style C2 fill:#3498db,color:#fff
    style S2 fill:#2ecc71,color:#fff
```

**When to use mTLS:**

```
✅ Microservice communication (Service A ↔ Service B)
   → Istio, Linkerd handle mTLS automatically
✅ API client authentication (instead of username/password)
✅ Zero Trust network (authenticate by identity, not network location)
✅ Secure internal service communication (instead of VPN)

❌ Regular websites (users can't install certificates)
❌ Public APIs (unknown users accessing)
```

### mTLS in Istio

Kubernetes + Istio automatically applies **mTLS between all services**.

```yaml
# Istio PeerAuthentication — mTLS policy
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT    # Enforce mTLS for all services
    # PERMISSIVE    # Allow both mTLS and plaintext (migration)
    # DISABLE       # Disable mTLS
```

```bash
# Check Istio mTLS status
istioctl x authz check deploy/myapp
# LISTENER[FilterChain]  MTLS(STRICT)

# Service communication is encrypted
# → Sidecar proxy (Envoy) handles TLS automatically
# → App code needs no modification!
# → Istio auto-issues/renews certificates
```

---

## 🔍 Detailed Explanation — openssl Debugging

### Check Remote Server Certificate

```bash
# Basic certificate info
echo | openssl s_client -servername example.com -connect example.com:443 2>/dev/null \
    | openssl x509 -noout -text | head -20

# Expiry only (★ most commonly used!)
echo | openssl s_client -servername example.com -connect example.com:443 2>/dev/null \
    | openssl x509 -noout -enddate
# notAfter=May 30 23:59:59 2025 GMT

# Check issuer
echo | openssl s_client -servername example.com -connect example.com:443 2>/dev/null \
    | openssl x509 -noout -issuer
# issuer=C = US, O = Let's Encrypt, CN = R3

# SAN (Subject Alternative Name) — which domains are valid
echo | openssl s_client -servername example.com -connect example.com:443 2>/dev/null \
    | openssl x509 -noout -ext subjectAltName
# X509v3 Subject Alternative Name:
#     DNS:example.com, DNS:www.example.com

# View entire certificate chain
openssl s_client -connect example.com:443 -showcerts < /dev/null 2>/dev/null
```

### Check Local Certificate Files

```bash
# Certificate file info
openssl x509 -in /etc/letsencrypt/live/example.com/fullchain.pem -noout -text | head -30

# Expiry
openssl x509 -in cert.pem -noout -enddate
# notAfter=May 30 23:59:59 2025 GMT

# Domain
openssl x509 -in cert.pem -noout -subject
# subject=CN = example.com

# Verify certificate and private key match (⭐ prevents config errors!)
# Their modulus should match
openssl x509 -noout -modulus -in cert.pem | md5sum
# abc123def456...
openssl rsa -noout -modulus -in privkey.pem | md5sum
# abc123def456...  ← If same, they match! ✅

# If different → cert and key don't match! ❌
# → Using wrong key file or different cert's key
```

### Generate CSR (Certificate Signing Request)

```bash
# Create new private key + CSR
openssl req -new -newkey rsa:2048 -nodes \
    -keyout example.com.key \
    -out example.com.csr \
    -subj "/C=KR/ST=Seoul/L=Gangnam/O=MyCompany/CN=example.com"

# View CSR
openssl req -in example.com.csr -noout -text

# Self-signed certificate (testing only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout self-signed.key \
    -out self-signed.crt \
    -subj "/CN=localhost"

# ⚠️ Self-signed gets browser warnings!
# → Production: use CA-issued
# → Testing/dev: self-signed OK
```

---

## 💻 Lab Examples

### Lab 1: Check Certificate Info

```bash
# Check multiple sites' certificates
for site in google.com github.com amazon.com; do
    echo "=== $site ==="
    echo | openssl s_client -servername $site -connect $site:443 2>/dev/null \
        | openssl x509 -noout -subject -issuer -enddate
    echo ""
done
# === google.com ===
# subject=CN = *.google.com
# issuer=C = US, O = Google Trust Services, CN = GTS CA 1C3
# notAfter=Jun  2 08:24:43 2025 GMT
#
# === github.com ===
# subject=CN = github.com
# issuer=C = US, O = DigiCert Inc, CN = DigiCert ...
# notAfter=Mar 15 23:59:59 2026 GMT
```

### Lab 2: Check TLS Version/Encryption

```bash
# Check TLS 1.3 support
openssl s_client -connect google.com:443 -tls1_3 < /dev/null 2>/dev/null | grep "Protocol"
# Protocol  : TLSv1.3    ← Supported!

# Check encryption method used
openssl s_client -connect google.com:443 < /dev/null 2>/dev/null | grep "Cipher"
# Cipher    : TLS_AES_256_GCM_SHA384

# Check TLS info with curl
curl -vI https://google.com 2>&1 | grep -E "SSL|TLS|subject|expire|issuer"
```

### Lab 3: Create Self-Signed Certificate

```bash
# 1. Generate private key + self-signed cert
openssl req -x509 -nodes -days 30 -newkey rsa:2048 \
    -keyout /tmp/test.key \
    -out /tmp/test.crt \
    -subj "/CN=localhost"

# 2. Check certificate
openssl x509 -in /tmp/test.crt -noout -text | head -15

# 3. Test HTTPS server (Python)
cd /tmp
python3 << 'EOF' &
import ssl, http.server
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain('test.crt', 'test.key')
server = http.server.HTTPServer(('0.0.0.0', 4443), http.server.SimpleHTTPRequestHandler)
server.socket = context.wrap_socket(server.socket, server_side=True)
print("HTTPS server on :4443")
server.serve_forever()
EOF

# 4. Test connection (-k: accept self-signed cert)
curl -k https://localhost:4443/
# → File listing appears

# Without -k:
curl https://localhost:4443/
# curl: (60) SSL certificate problem: self-signed certificate
# → Self-signed, not trusted!

# 5. Cleanup
kill %1
rm /tmp/test.key /tmp/test.crt
```

### Lab 4: Certificate Expiry Monitoring

```bash
# Check expiry of multiple domains
cat << 'SCRIPT' > /tmp/cert-check.sh
#!/bin/bash
DOMAINS="google.com github.com example.com amazon.com"

printf "%-30s %-15s %s\n" "DOMAIN" "DAYS LEFT" "EXPIRY DATE"
echo "────────────────────────────────────────────────────────────────"

for domain in $DOMAINS; do
    expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null \
        | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

    if [ -n "$expiry" ]; then
        expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null)
        now_epoch=$(date +%s)
        days_left=$(( (expiry_epoch - now_epoch) / 86400 ))

        if [ "$days_left" -lt 14 ]; then
            status="⚠️"
        else
            status="✅"
        fi
        printf "%-30s %-15s %s %s\n" "$domain" "${days_left}d" "$expiry" "$status"
    else
        printf "%-30s %-15s %s\n" "$domain" "lookup failed" "❌"
    fi
done
SCRIPT
chmod +x /tmp/cert-check.sh
/tmp/cert-check.sh

# DOMAIN                         DAYS LEFT       EXPIRY DATE
# ────────────────────────────────────────────────────────────────
# google.com                     82d             Jun  2 08:24:43 2025 GMT ✅
# github.com                     368d            Mar 15 23:59:59 2026 GMT ✅
# example.com                    79d             May 30 23:59:59 2025 GMT ✅
# amazon.com                     120d            Jul 10 23:59:59 2025 GMT ✅
```

---

## 🏢 In Practice?

### Scenario 1: "Certificate Expired!" Emergency Response

```bash
# Users report "security warning when visiting site!"

# 1. Confirm expiry
echo | openssl s_client -connect mysite.com:443 2>/dev/null \
    | openssl x509 -noout -enddate
# notAfter=Mar 10 23:59:59 2025 GMT    ← Already expired!

# 2. Immediately renew with certbot
sudo certbot renew --force-renewal
# Congratulations, all renewals succeeded

# 3. Reload Nginx
sudo nginx -t && sudo systemctl reload nginx

# 4. Verify renewal
echo | openssl s_client -connect mysite.com:443 2>/dev/null \
    | openssl x509 -noout -enddate
# notAfter=Jun 10 23:59:59 2025 GMT    ← Renewed! ✅

# 5. Prevent recurrence
# Verify certbot auto-renewal is active
systemctl status certbot.timer
# → Active: active (waiting) ✅

# Set up expiry monitoring script
```

### Scenario 2: "NET::ERR_CERT_AUTHORITY_INVALID" Error

```bash
# Root cause: incomplete certificate chain (missing intermediate)

# 1. Check chain
openssl s_client -connect mysite.com:443 -showcerts < /dev/null 2>/dev/null | grep -E "^Certificate chain| s:| i:"
# Certificate chain
#  0 s:CN = mysite.com
#    i:C = US, O = Let's Encrypt, CN = R3
# → Intermediate (R3) not provided by server!

# 2. Fix: use fullchain.pem (not cert.pem!)
# Nginx config:
# ❌ ssl_certificate /etc/letsencrypt/live/mysite.com/cert.pem;
# ✅ ssl_certificate /etc/letsencrypt/live/mysite.com/fullchain.pem;

sudo nginx -t && sudo systemctl reload nginx

# 3. Verify
openssl s_client -connect mysite.com:443 -showcerts < /dev/null 2>/dev/null | grep -E "^Certificate chain| s:| i:"
# Certificate chain
#  0 s:CN = mysite.com
#    i:C = US, O = Let's Encrypt, CN = R3
#  1 s:C = US, O = Let's Encrypt, CN = R3
#    i:O = Internet Security Research Group, CN = ISRG Root X1
# → Chain complete! ✅
```

### Scenario 3: ALB with ACM Certificate

```bash
# 1. Request ACM certificate (AWS CLI)
aws acm request-certificate \
    --domain-name "myapp.example.com" \
    --validation-method DNS \
    --region ap-northeast-2

# 2. DNS validation (add CNAME to Route53)
# → ACM provides CNAME record, add to Route53
# → Auto-validates → Certificate issued!

# 3. Attach to ALB Listener
# ALB → Listeners → HTTPS:443 → Select ACM certificate

# 4. Verify
curl -vI https://myapp.example.com 2>&1 | grep -E "subject|issuer"
# subject: CN=myapp.example.com
# issuer: C=US, O=Amazon, CN=Amazon RSA 2048 M01

# ACM auto-renews! No expiry worries! ✅
```

### Scenario 4: Diagnose Certificate/Key Mismatch

```bash
# Nginx won't start:
# nginx: [emerg] SSL_CTX_use_PrivateKey_file("privkey.pem") failed
# (SSL: error:0B080074:x509 certificate routines:X509_check_private_key:key values mismatch)

# Root cause: cert and key don't match!

# Verify match
CERT_MD5=$(openssl x509 -noout -modulus -in cert.pem 2>/dev/null | md5sum | awk '{print $1}')
KEY_MD5=$(openssl rsa -noout -modulus -in privkey.pem 2>/dev/null | md5sum | awk '{print $1}')

echo "Certificate: $CERT_MD5"
echo "Private key: $KEY_MD5"

if [ "$CERT_MD5" = "$KEY_MD5" ]; then
    echo "✅ Match!"
else
    echo "❌ Mismatch! Using wrong key file"
fi

# Fix: Use correct key file
# For Let's Encrypt: check /etc/letsencrypt/live/domain/ directory
```

---

## ⚠️ Common Mistakes

### 1. Not Setting Up Auto-Renewal

```bash
# ❌ Issue Let's Encrypt cert manually, forget auto-renewal
# → 90 days later: expired → site down!

# ✅ Check auto-renewal is active
systemctl status certbot.timer    # or
crontab -l | grep certbot

# ✅ Set up expiry monitoring + alerts
```

### 2. Using cert.pem Instead of fullchain.pem

```bash
# ❌ Install server certificate only (missing intermediate)
ssl_certificate /etc/letsencrypt/live/example.com/cert.pem;

# → Some browsers: "Certificate not trusted" error!

# ✅ Use fullchain.pem (server + intermediate)
ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
```

### 3. Committing Private Key to Git

```bash
# ❌ Private key ends up in Git repository
git add privkey.pem
# → Anyone can see it! Cert can be impersonated!

# ✅ Add to .gitignore
echo "*.key" >> .gitignore
echo "*.pem" >> .gitignore
echo "privkey*" >> .gitignore

# Already committed? → Revoke key + reissue!
# Remove from history: git filter-branch or BFG Repo-Cleaner
```

### 4. Allowing TLS 1.0/1.1

```bash
# ❌ Old TLS versions have security issues
ssl_protocols TLSv1 TLSv1.1 TLSv1.2;

# ✅ TLS 1.2+ only
ssl_protocols TLSv1.2 TLSv1.3;

# PCI DSS and other regulations ban TLS 1.0/1.1!
```

### 5. Not Setting HTTP → HTTPS Redirect

```bash
# ❌ HTTP access possible → unencrypted!

# ✅ Nginx redirect HTTP to HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}

# ✅ HSTS header forces browser to always use HTTPS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## 📝 Summary

### TLS/Certificate Debugging Cheatsheet

```bash
# === Remote Server ===
# Check expiry
echo | openssl s_client -connect HOST:443 2>/dev/null | openssl x509 -noout -enddate

# Check issuer/domain
echo | openssl s_client -connect HOST:443 2>/dev/null | openssl x509 -noout -subject -issuer

# Check chain
openssl s_client -connect HOST:443 -showcerts < /dev/null

# Check TLS version
curl -v https://HOST 2>&1 | grep "SSL connection"

# === Local Files ===
# Certificate info
openssl x509 -in cert.pem -noout -text

# Certificate-key match
openssl x509 -noout -modulus -in cert.pem | md5sum
openssl rsa -noout -modulus -in key.pem | md5sum

# === Let's Encrypt ===
sudo certbot certificates              # List certs
sudo certbot renew --dry-run            # Test renewal
sudo certbot renew                      # Actual renewal
sudo certbot renew --force-renewal      # Force renewal
```

### Certificate Management Checklist

```
✅ Auto-renewal configured (certbot timer or cron)
✅ Using fullchain.pem (not cert.pem!)
✅ Private key permissions 600, not in Git
✅ TLS 1.2+ only (no 1.0/1.1)
✅ HTTP → HTTPS redirect + HSTS headers
✅ Expiry monitoring + alerts
✅ AWS services use ACM (auto-renews)
✅ SSL Labs reports A+ grade
```

---

## 🔗 Next Lecture

Next is **[06-load-balancing](./06-load-balancing)** — Load Balancing (L4 vs L7 / reverse proxy / sticky sessions / health check).

Traffic from one server isn't enough when thousands of users connect. Learn how load balancers distribute traffic, L4 vs L7 differences, Nginx and HAProxy configuration, and health checking in production.
