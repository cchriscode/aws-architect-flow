# Security Learning Environment Setup

> This document is a guide for installing the necessary tools and setting up the lab environment **before** starting the Security course. We will prepare a variety of tools covering encryption, secret management, container scanning, and network analysis. Once you complete all the steps, you can jump right into [Identity/Authentication Management](./01-identity).

---

## Required Tools

```
Tool              Purpose                              Required
─────────────────────────────────────────────────────────────
Linux Environment Base environment for security tools    Required
OpenSSL          Certificate and encryption labs         Required
AWS CLI          Cloud security labs (IAM, KMS, etc.)    Required
Docker           Running Vault, Trivy, etc. in containers Required
HashiCorp Vault  Secret management labs                  Required
Trivy            Container image vulnerability scanning  Recommended
GPG              File/commit signing                     Recommended
SSH              Remote access and key management        Required
nmap             Network port scanning                   Recommended
tcpdump          Network packet capture                  Optional
OWASP ZAP        Web application vulnerability scanning  Optional
```

---

## 1. Prepare a Linux Environment

Most security tools work best in a Linux environment. Windows users can use a Linux environment through WSL2 or Docker.

### Environment Guide

| Environment | Method |
|-------------|--------|
| **Linux (Ubuntu/Debian)** | Use as-is |
| **Mac** | Most tools can be installed via Homebrew |
| **Windows** | WSL2 is recommended. Refer to [01-linux](../01-linux/00-linux-commands) |

### Setting Up WSL2 on Windows

```bash
# Run in PowerShell (as Administrator)
wsl --install -d Ubuntu
```

After installation, set up a username and password, and you will have access to an Ubuntu terminal.

### Practical Tips

- Many security lab tools require **root privileges** (`nmap`, `tcpdump`, etc.). Verify in advance that you can use `sudo` in your environment.
- Using `nmap` or port scanning tools on a corporate network may be **detected as a security policy violation**. Only practice on personal environments or networks where you have permission.

---

## 2. Verify OpenSSL Installation

OpenSSL is an essential tool for encryption, certificate generation, and TLS connection testing. It comes pre-installed on most operating systems.

### Verify

```bash
openssl version
```

### Expected Output

```text
OpenSSL 3.0.13 30 Jan 2024 (Library: OpenSSL 3.0.13 30 Jan 2024)
```

### If Not Installed

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openssl -y

# Mac (Homebrew)
brew install openssl

# CentOS/RHEL
sudo yum install openssl -y
```

### Quick Functionality Test

```bash
# Generate a random password
openssl rand -base64 32
```

### Expected Output

```text
K7xQ2mP9vB3nL8wY5jR1cF6hD4tA0sU+gE7iM2oN3kX=
```

```bash
# Generate a SHA256 hash
echo "hello world" | openssl dgst -sha256
```

### Expected Output

```text
SHA2-256(stdin)= a948904f2f0f479b8f8564e9d7e91c9020a3516...
```

### Note

- On Mac, the system default OpenSSL may be **LibreSSL**. It works fine for basic labs, but some advanced features may behave differently.
- If `openssl version` shows `LibreSSL`, install OpenSSL separately via Homebrew and configure your PATH.

---

## 3. Install AWS CLI

AWS CLI is needed for cloud security labs involving IAM, KMS, Secrets Manager, and more.

### Verify Installation

If you already installed it during the [05-cloud-aws](../05-cloud-aws/01-iam) section, just verify.

```bash
aws --version
```

### Expected Output

```text
aws-cli/2.15.17 Python/3.11.6 Linux/5.15.0-91-generic exe/x86_64.ubuntu.22
```

### If Not Yet Installed

```bash
# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Mac
brew install awscli

# Windows
# Download and install from https://awscli.amazonaws.com/AWSCLIV2.msi
```

### Configure Credentials

```bash
aws configure
```

```text
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: ap-northeast-2
Default output format [None]: json
```

### Verify

```bash
aws sts get-caller-identity
```

### Expected Output

```json
{
    "UserId": "AIDAIOSFODNN7EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/gildong"
}
```

### Note

- **Never** hard-code Access Keys in your code or commit them to Git. This is the first principle of the security course.
- Create a dedicated IAM user for labs and grant **least privilege** only. If a key with administrator privileges is leaked, it can lead to a serious incident.
- Make sure the `~/.aws/credentials` file is included in your `.gitignore`.

---

## 4. Install HashiCorp Vault (via Docker)

Vault is the standard tool for secret management. It securely stores and manages API keys, database passwords, certificates, and more.

### Run Vault with Docker

```bash
docker run -d \
  --name vault \
  --cap-add=IPC_LOCK \
  -p 8200:8200 \
  -e 'VAULT_DEV_ROOT_TOKEN_ID=myroot' \
  -e 'VAULT_DEV_LISTEN_ADDRESS=0.0.0.0:8200' \
  hashicorp/vault:latest
```

Option descriptions:

| Option | Description |
|--------|-------------|
| `--cap-add=IPC_LOCK` | Memory lock permission (prevents secrets from being written to swap) |
| `-p 8200:8200` | Web UI and API port |
| `VAULT_DEV_ROOT_TOKEN_ID` | Root token for dev mode (for labs only) |
| `VAULT_DEV_LISTEN_ADDRESS` | Allow connections from all interfaces |

### Verify Access

Open [http://localhost:8200](http://localhost:8200) in your browser and enter `myroot` as the Token.

### Verify via CLI

```bash
# Set the Vault address
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='myroot'

# Check status
docker exec vault vault status
```

### Expected Output

```text
Key             Value
---             -----
Seal Type       shamir
Initialized     true
Sealed          false
Total Shares    1
Threshold       1
Version         1.15.4
Storage Type    inmem
Cluster Name    vault-cluster-abcdef12
Cluster ID      a1b2c3d4-e5f6-7890-abcd-ef1234567890
HA Enabled      false
```

`Sealed: false` is the important part. In dev mode, Vault is automatically unsealed.

### Simple Secret Storage Test

```bash
# Store a secret
docker exec -e VAULT_TOKEN=myroot vault vault kv put secret/myapp db_password="super-secret-123"
```

### Expected Output

```text
===== Secret Path =====
secret/data/myapp

======= Metadata =======
Key                Value
---                -----
created_time       2026-03-14T09:00:00.000000Z
custom_metadata    <nil>
deletion_time      n/a
destroyed          false
version            1
```

```bash
# Retrieve a secret
docker exec -e VAULT_TOKEN=myroot vault vault kv get secret/myapp
```

### Expected Output

```text
===== Secret Path =====
secret/data/myapp

======= Metadata =======
Key                Value
---                -----
created_time       2026-03-14T09:00:00.000000Z
version            1

====== Data ======
Key             Value
---             -----
db_password     super-secret-123
```

### Note

- The configuration above runs in **dev mode**. Data is stored only in memory, so all secrets are lost if the container is restarted.
- Never use dev mode in production. You must configure a file/Consul storage backend and manage the unseal keys securely.

---

## 5. Install Trivy (Container Image Scanning)

Trivy scans container images for **known vulnerabilities (CVEs)**. When integrated into a CI/CD pipeline, it can prevent vulnerable images from being deployed.

### Installation

```bash
# Mac
brew install aquasecurity/trivy/trivy

# Ubuntu/Debian
sudo apt install wget apt-transport-https gnupg lsb-release -y
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor | sudo tee /usr/share/keyrings/trivy.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/trivy.list
sudo apt update
sudo apt install trivy -y

# CentOS/RHEL
sudo rpm -ivh https://github.com/aquasecurity/trivy/releases/download/v0.49.0/trivy_0.49.0_Linux-64bit.rpm
```

### Run via Docker (Without Installation)

If installation is cumbersome, you can run it directly with Docker.

```bash
docker run --rm aquasec/trivy image python:3.9-slim
```

### Verify

```bash
trivy --version
```

### Expected Output

```text
Version: 0.49.0
```

### Image Scan Test

```bash
trivy image nginx:latest
```

### Expected Output (Excerpt)

```text
nginx:latest (debian 12.4)
============================
Total: 85 (UNKNOWN: 0, LOW: 62, MEDIUM: 15, HIGH: 7, CRITICAL: 1)

┌──────────────────┬────────────────┬──────────┬─────────────────┬──────────────────┐
│     Library      │ Vulnerability  │ Severity │ Installed Ver   │   Fixed Version  │
├──────────────────┼────────────────┼──────────┼─────────────────┼──────────────────┤
│ libssl3          │ CVE-2024-XXXXX │ CRITICAL │ 3.0.13-1~deb12u │ 3.0.13-1~deb12u2 │
│ curl             │ CVE-2024-YYYYY │ HIGH     │ 7.88.1-10+deb12 │ 7.88.1-10+deb12u │
│ ...              │ ...            │ ...      │ ...             │ ...              │
└──────────────────┴────────────────┴──────────┴─────────────────┴──────────────────┘
```

Images with `CRITICAL` or `HIGH` vulnerabilities should not be deployed to production.

### Practical Tips

- Use `trivy image --severity HIGH,CRITICAL nginx:latest` to filter for only severe vulnerabilities.
- In CI/CD pipelines, use `--exit-code 1` to automatically fail the build when vulnerabilities are found.
- The first run takes some time (1 to 3 minutes) as it downloads the vulnerability database.

---

## 6. Install OWASP ZAP (Optional, Web Vulnerability Scanning)

OWASP ZAP is a tool that automatically scans web applications for security vulnerabilities. It detects major web vulnerabilities such as SQL Injection and XSS.

### Run with Docker

```bash
docker run -d \
  --name zap \
  -p 8080:8080 \
  -p 8090:8090 \
  zaproxy/zap-stable zap-webswing.sh
```

### Access

Open [http://localhost:8080/zap/](http://localhost:8080/zap/) in your browser to use the web-based interface.

### Quick Scan Test (CLI)

```bash
docker run --rm zaproxy/zap-stable zap-baseline.py -t https://example.com
```

### Note

- Scanning **unauthorized websites with OWASP ZAP can result in legal consequences**. Only use it on sites you manage or in test environments.
- If Jenkins is also using port 8080, there will be a conflict. Change the ZAP port to `8081:8080`.

---

## 7. Verify GPG Key Installation

GPG (GNU Privacy Guard) is used for file encryption, signing, and Git commit signing.

### Verify

```bash
gpg --version
```

### Expected Output

```text
gpg (GnuPG) 2.4.4
libgcrypt 1.10.3
```

### If Not Installed

```bash
# Ubuntu/Debian
sudo apt install gnupg -y

# Mac
brew install gnupg

# CentOS/RHEL
sudo yum install gnupg2 -y
```

### Generate a GPG Key

```bash
gpg --full-generate-key
```

This proceeds interactively.

```text
Please select what kind of key you want:
   (1) RSA and RSA
   (4) RSA (sign only)
Your selection? 1

What keysize do you want? (3072) 4096
Key is valid for? (0) 1y
Is this correct? (y/N) y

Real name: Hong Gildong
Email address: gildong@example.com
Comment:
```

### Verify the Generated Key

```bash
gpg --list-keys --keyid-format long
```

### Expected Output

```text
pub   rsa4096/ABCDEF1234567890 2026-03-14 [SC] [expires: 2027-03-14]
      1234567890ABCDEF1234567890ABCDEF12345678
uid                 [ultimate] Hong Gildong <gildong@example.com>
sub   rsa4096/1234567890ABCDEF 2026-03-14 [E] [expires: 2027-03-14]
```

### Configure Git Commit Signing

```bash
# Register the GPG key ID with Git
git config --global user.signingkey ABCDEF1234567890

# Automatically sign all commits
git config --global commit.gpgsign true
```

---

## 8. SSH Key Management Basics

SSH keys are not only used for server access but are also a **fundamental part of security**. You must properly handle key generation, management, and permission settings.

### Check Existing Keys

```bash
ls -la ~/.ssh/
```

### Expected Output

```text
total 16
drwx------  2 user user 4096 Mar 14 09:00 .
drwxr-xr-x 20 user user 4096 Mar 14 09:00 ..
-rw-------  1 user user  411 Mar 14 09:00 id_ed25519
-rw-r--r--  1 user user   97 Mar 14 09:00 id_ed25519.pub
-rw-r--r--  1 user user  444 Mar 14 09:00 known_hosts
```

### Generate a Key If None Exists

```bash
ssh-keygen -t ed25519 -C "gildong@example.com"
```

### Verify File Permissions

SSH will not work if key file permissions are incorrect.

```bash
# Set correct permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
chmod 644 ~/.ssh/known_hosts
```

| File | Correct Permission | Description |
|------|--------------------|-------------|
| `~/.ssh/` | `700 (drwx------)` | Only the owner can access |
| `id_ed25519` (private key) | `600 (-rw-------)` | Only the owner can read/write |
| `id_ed25519.pub` (public key) | `644 (-rw-r--r--)` | Others can read |
| `known_hosts` | `644 (-rw-r--r--)` | Others can read |

### Note

- If the private key (`id_ed25519`) has permissions of `644` or `777`, SSH will reject it with a **"Permissions are too open"** error.
- Never share the private key with anyone or send it via email/messenger.
- To use different keys for different servers, configure the `~/.ssh/config` file.

---

## 9. Network Security Tools: nmap, tcpdump

### 9.1 nmap (Network Port Scanner)

nmap is a tool that detects open ports and services on a network.

### Installation

```bash
# Ubuntu/Debian
sudo apt install nmap -y

# Mac
brew install nmap

# CentOS/RHEL
sudo yum install nmap -y
```

### Verify

```bash
nmap --version
```

### Expected Output

```text
Nmap version 7.94 ( https://nmap.org )
```

### Basic Usage

```bash
# Check open ports on your own PC
nmap localhost
```

### Expected Output

```text
Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for localhost (127.0.0.1)
Host is up (0.00010s latency).
Not shown: 997 closed tcp ports (conn-refused)
PORT     STATE SERVICE
3000/tcp open  ppp
8080/tcp open  http-proxy
8200/tcp open  trivnet1
9090/tcp open  zeus-admin

Nmap done: 1 IP address (1 host up) scanned in 0.05 seconds
```

If you can see Grafana (3000), Jenkins (8080), Vault (8200), and Prometheus (9090) from earlier installations, everything is working correctly.

### 9.2 tcpdump (Packet Capture)

tcpdump is a tool that captures and analyzes network packets in real time.

### Installation

```bash
# Ubuntu/Debian
sudo apt install tcpdump -y

# Mac (pre-installed)
tcpdump --version

# CentOS/RHEL
sudo yum install tcpdump -y
```

### Basic Usage

```bash
# Capture HTTP traffic (port 80)
sudo tcpdump -i any port 80 -c 5
```

`-c 5` means capture only 5 packets and then stop.

### Expected Output

```text
tcpdump: data link type LINUX_SLL2
tcpdump: listening on any, link-type LINUX_SLL2, snapshot length 262144 bytes
09:15:23.123456 eth0 Out IP 192.168.1.10.54321 > 93.184.216.34.80: Flags [S], seq 12345
09:15:23.234567 eth0 In  IP 93.184.216.34.80 > 192.168.1.10.54321: Flags [S.], seq 67890
```

### Note

- `tcpdump` requires **root privileges (sudo)**.
- Capturing someone else's network traffic without authorization can result in **legal consequences**. Only use it in your own environment.
- Captured data may contain sensitive information such as passwords. Manage capture files securely.

---

## 10. Full Environment Verification

Once everything is installed, verify all at once with the following commands.

```bash
echo "=== OpenSSL ==="
openssl version

echo ""
echo "=== AWS CLI ==="
aws --version 2>/dev/null || echo "설치되지 않음"

echo ""
echo "=== Docker ==="
docker --version

echo ""
echo "=== Vault ==="
docker ps --filter name=vault --format "{{.Names}}: {{.Status}}" 2>/dev/null || echo "설치되지 않음"

echo ""
echo "=== Trivy ==="
trivy --version 2>/dev/null || echo "설치되지 않음 (Docker로 실행 가능)"

echo ""
echo "=== GPG ==="
gpg --version 2>/dev/null | head -1

echo ""
echo "=== SSH ==="
ssh -V 2>&1

echo ""
echo "=== nmap ==="
nmap --version 2>/dev/null | head -1 || echo "설치되지 않음"
```

### Expected Output

```text
=== OpenSSL ===
OpenSSL 3.0.13 30 Jan 2024

=== AWS CLI ===
aws-cli/2.15.17 Python/3.11.6 Linux/5.15.0

=== Docker ===
Docker version 24.0.7, build afdd53b

=== Vault ===
vault: Up 10 minutes

=== Trivy ===
Version: 0.49.0

=== GPG ===
gpg (GnuPG) 2.4.4

=== SSH ===
OpenSSH_9.6p1 Ubuntu-3ubuntu13, OpenSSL 3.0.13

=== nmap ===
Nmap version 7.94 ( https://nmap.org )
```

### Minimum Required Checklist

```
[  ] openssl version              → OpenSSL installation confirmed
[  ] aws --version                → AWS CLI installation confirmed
[  ] docker --version             → Docker installation confirmed
[  ] Access localhost:8200        → Vault web UI displayed
[  ] ssh -V                       → OpenSSH installation confirmed
```

### Optional Tools Checklist

```
[  ] trivy --version              → Trivy installation confirmed
[  ] gpg --version                → GPG installation confirmed
[  ] nmap --version               → nmap installation confirmed
[  ] tcpdump --version            → tcpdump installation confirmed
```

### Lab Environment Management

```bash
# Stop Vault
docker stop vault

# Restart Vault (dev mode resets data on restart)
docker start vault

# Delete Vault
docker rm -f vault
```

### Note

- When testing security tools, **always run them only on systems you manage**. Scanning or penetration testing someone else's system without authorization is **illegal**.
- Vault dev mode is for lab use only. All secrets are lost when the container restarts. In production, you must configure persistent storage.
- Make sure AWS credentials (Access Keys) are not committed to Git by checking your `.gitignore`.

---

## Next Steps

Once the environment is ready, start with [Identity/Authentication Management](./01-identity). Once you understand the basic concepts of authentication and authorization such as IAM, RBAC, and OAuth/OIDC, you will naturally understand why tools like Vault and AWS security services are used.
