# Pipeline Security (Pipeline Security)

> You learned building CI/CD workflows in [GitHub Actions Hands-On](./05-github-actions) and security fundamentals in [AWS Security Services](../05-cloud-aws/12-security). Now we'll explore **how to secure the CI/CD pipeline itself**. From secrets management to code security scanning (SAST/DAST/SCA), SBOM, supply chain security, container image scanning, and pipeline hardening — let's explore the core of DevSecOps with hands-on examples.

---

## 🎯 Why Learn Pipeline Security?

### Daily Analogy: Factory Security System

Remember the car factory? You built an [automated production line with GitHub Actions](./05-github-actions). Now we're **strengthening the factory's own security**.

- **Design blueprint leaked?** → Secrets exposed
- **Defective parts mixed in?** → Malicious dependency packages
- **Assembly robot hacked?** → CI/CD runner compromised
- **Finished car has defects?** → Deploying code with security vulnerabilities
- **Don't know parts sources?** → Deploying software without SBOM

### Real-World Moments When Pipeline Security is Needed

```
• AWS key exposed on GitHub, got hacked                    → Secrets management + Git secrets detection
• Open source library had known vulnerability              → SCA / Dependency scanning
• Code had SQL Injection vulnerability, found after deploy → SAST (static analysis)
• Deployed web app had XSS vulnerability                   → DAST (dynamic analysis)
• Audit: "What open source is in this software?"          → SBOM generation
• npm package was tampered with malicious code             → Supply Chain Security
• Container image had CVE vulnerabilities                  → Container Image Scanning
• Need SOC2/ISO27001 certification, need security proof    → Compliance as Code
```

| Real Event | What Happened | Lesson |
|-----------|-------------|---------|
| **SolarWinds (2020)** | Malicious code injected into build pipeline | Supply Chain Security essential |
| **Log4Shell (2021)** | Critical vulnerability in open source dependency | SCA + SBOM for instant impact assessment |
| **xz utils (2024)** | Open source maintainer account hijacked, backdoor installed | SLSA + signature verification |

---

## 🧠 Grasping Core Concepts

### Analogy: Factory Security System

| Factory Security | Pipeline Security |
|-----------|----------------|
| Safe (storing secret blueprints) | **Secrets Management** (GitHub Secrets, Vault, OIDC) |
| Blueprint inspection team | **SAST** (Semgrep, SonarQube, CodeQL) |
| Crash test for finished cars | **DAST** (OWASP ZAP, Burp Suite) |
| Incoming parts inspection | **SCA** (Dependabot, Snyk, Trivy) |
| Parts specification sheet (BOM) | **SBOM** (Syft, CycloneDX, SPDX) |
| Parts origin certificate | **Supply Chain Security** (SLSA, Sigstore, in-toto) |
| Container X-ray inspection | **Container Image Scanning** |
| Factory access control | **Pipeline Hardening** (least privilege, pinned actions) |

### Complete Security Pipeline Overview

```mermaid
flowchart LR
    subgraph DEV["👨‍💻 Development"]
        CODE["Write code"] --> PRECOMMIT["Pre-commit<br/>gitleaks"]
    end

    subgraph CI["🔧 CI"]
        SECRETS["🔐 Secrets check"]
        SAST["🔍 SAST"]
        SCA["📦 SCA"]
    end

    subgraph BUILD["📦 Build"]
        SCAN["🔬 Image scan"]
        SBOM["📋 SBOM generation"]
        SIGN["✍️ Image sign"]
    end

    subgraph CD["🚀 Deploy"]
        DAST["🌐 DAST"]
        VERIFY["✅ Signature verify"]
        ATTEST["📜 Attestation"]
    end

    PRECOMMIT --> SECRETS --> SAST --> SCA
    SCA --> SCAN --> SBOM --> SIGN
    SIGN --> DAST --> VERIFY --> ATTEST

    style SECRETS fill:#e74c3c,color:#fff
    style SAST fill:#e67e22,color:#fff
    style SCAN fill:#9b59b6,color:#fff
    style SBOM fill:#3498db,color:#fff
    style SIGN fill:#2ecc71,color:#fff
```

### Security Scan Type Comparison

| Type | Checks | When | Analogy |
|------|--------|------|---------|
| **SAST** | Source code itself | PR time | Blueprint review (before execution) |
| **DAST** | Running app | After deploy | Crash test for finished car |
| **SCA** | Open source dependencies | Build time | Imported parts inspection |
| **Container Scan** | Container image | After image build | Container X-ray inspection |
| **Secret Scan** | Hardcoded secrets | Commit time | Lost safe key detection |

---

## 🔍 Exploring Each in Detail

### 1. Secrets Management — Safe System

#### 1-1. GitHub Secrets + Environment

```yaml
# .github/workflows/deploy.yml — Environment-level secrets (most recommended)
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # Secrets per environment + approval gate
    steps:
      - name: Deploy
        env:
          DB_PASSWORD: ${{ secrets.PROD_DB_PASSWORD }}
        run: ./deploy.sh
```

#### 1-2. OIDC — Authentication Without Long-Lived Keys

```mermaid
sequenceDiagram
    participant GHA as GitHub Actions
    participant OIDC as GitHub OIDC
    participant AWS as AWS STS

    GHA->>OIDC: 1. Request OIDC token
    OIDC-->>GHA: 2. Issue JWT (includes repo/branch info)
    GHA->>AWS: 3. AssumeRoleWithWebIdentity (JWT)
    AWS-->>GHA: 4. Temporary credentials (15min~1hour)
    Note over GHA,AWS: No need to store long-term keys!
```

```yaml
permissions:
  id-token: write
  contents: read

steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
      aws-region: ap-northeast-2
      # No Access Key! Use OIDC for temporary credentials only
```

> **Key Point**: In AWS Trust Policy, allow only **specific repository + branch** like `repo:my-org/my-repo:ref:refs/heads/main`.

#### 1-3. HashiCorp Vault Integration

```yaml
- name: Import Secrets from Vault
  uses: hashicorp/vault-action@v3
  with:
    url: https://vault.mycompany.com
    method: jwt
    role: github-actions-role
    secrets: |
      secret/data/prod/db password | DB_PASSWORD ;
      secret/data/prod/api key | API_KEY
```

| Feature | GitHub Secrets | HashiCorp Vault |
|--------|---------------|-----------------|
| Difficulty | Easy | Complex (separate infrastructure) |
| Auto rotation | Manual | Dynamic Secrets supported |
| Audit logs | Basic | Detailed Audit Log |
| Cost | Free | Open source / Enterprise paid |

---

### 2. Git Secrets Detection — Finding Leaked Keys

```yaml
# .github/workflows/security-scan.yml
jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Block secrets before commit with pre-commit hook:**

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

---

### 3. SAST (Static Application Security Testing) — Blueprint Review

Analyze **source code without running it** to find security vulnerabilities.

#### Semgrep — Lightweight, Fast SAST

```yaml
jobs:
  semgrep:
    runs-on: ubuntu-latest
    container: { image: semgrep/semgrep }
    steps:
      - uses: actions/checkout@v4
      - run: semgrep scan --config auto --sarif --output semgrep.sarif
      - uses: github/codeql-action/upload-sarif@v3
        with: { sarif_file: semgrep.sarif }
        if: always()
```

**Custom rule example:**

```yaml
# .semgrep/custom-rules.yml
rules:
  - id: sql-injection-risk
    patterns:
      - pattern: |
          $QUERY = f"... {$VAR} ..."
          cursor.execute($QUERY)
    message: "SQL Injection risk! Use parameterized query."
    severity: ERROR
    languages: [python]
```

#### CodeQL — GitHub's Native SAST

```yaml
jobs:
  codeql:
    runs-on: ubuntu-latest
    permissions: { security-events: write, actions: read, contents: read }
    strategy:
      matrix: { language: ['javascript', 'python'] }
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with: { languages: '${{ matrix.language }}', queries: +security-extended }
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3
```

| Tool | Pros | Cons |
|------|------|------|
| **Semgrep** | Fast, easy custom rules | Limited advanced data flow analysis |
| **CodeQL** | GitHub native, powerful | GitHub-only, learning curve |
| **SonarQube** | Code quality + security, dashboard | Heavy, requires separate server |

---

### 4. DAST (Dynamic Application Security Testing) — Crash Test

Send **attack patterns to a running app** to find vulnerabilities.

```mermaid
sequenceDiagram
    participant ZAP as OWASP ZAP
    participant APP as Staging App

    ZAP->>APP: 1. Spider (crawl) — discover endpoints
    ZAP->>APP: 2. Attempt SQL Injection
    ZAP->>APP: 3. Send XSS payloads
    ZAP->>APP: 4. Test CSRF / auth bypass
    APP-->>ZAP: 5. Analyze responses
    Note over ZAP: 6. Generate SARIF report<br/>Fail pipeline if Critical found!
```

```yaml
jobs:
  zap-scan:
    runs-on: ubuntu-latest
    steps:
      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.12.0
        with:
          target: 'https://staging.myapp.com'
          rules_file_name: '.zap/rules.tsv'
```

| Characteristic | SAST | DAST |
|---|---|---|
| Target | Source code | Running app |
| Speed | Fast (minutes) | Slow (hours) |
| False Positives | Many possible | Few (real attacks) |
| Recommendation | **Use both!** | |

---

### 5. SCA (Software Composition Analysis) — Parts Import Inspection

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule: { interval: "weekly", day: "monday" }
    groups:
      production-dependencies:
        patterns: ["*"]
        exclude-patterns: ["@types/*", "eslint*"]
  - package-ecosystem: "docker"
    directory: "/"
    schedule: { interval: "weekly" }
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: { interval: "weekly" }
```

**Trivy — All-in-one security scanner:**

```yaml
- name: Trivy Filesystem Scan
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    scan-ref: '.'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'
```

| Tool | Pros | Cost |
|------|------|------|
| **Dependabot** | GitHub native, auto PR | Free |
| **Snyk** | Fix suggestions, license check | Free tier / Paid |
| **Trivy** | All-in-one (FS + image + IaC) | Open source free |

---

### 6. SBOM (Software Bill of Materials) — Parts Specification

SBOM is a **list of all components in software**. When Log4Shell happened, "where is Log4j used?" needs instant answers. **SBOM makes that possible**.

```mermaid
flowchart TB
    subgraph WITHOUT["❌ Without SBOM"]
        Q1["CVE announced!"] --> B1["Manually search entire codebase..."]
        B1 --> D1["Understand impact a week later"]
    end

    subgraph WITH["✅ With SBOM"]
        Q2["CVE announced!"] --> A2["Query SBOM database"]
        A2 --> C2["Understand impact in 30 minutes + patch"]
    end

    style WITHOUT fill:#ffcccc,stroke:#e74c3c
    style WITH fill:#ccffcc,stroke:#27ae60
    style D1 fill:#e74c3c,color:#fff
    style C2 fill:#27ae60,color:#fff
```

```yaml
# Generate SBOM with Syft + scan with Grype
steps:
  - uses: anchore/sbom-action@v0
    with:
      image: 'my-app:${{ github.sha }}'
      format: cyclonedx-json
      output-file: sbom.cdx.json

  - uses: anchore/scan-action@v4
    with:
      sbom: sbom.cdx.json
      fail-build: true
      severity-cutoff: high
```

| SBOM Format | Characteristics | Use |
|-----------|---------|--------|
| **SPDX** | Linux Foundation standard, license-focused | Legal compliance |
| **CycloneDX** | OWASP standard, security-focused | Security vulnerability management |

---

### 7. Supply Chain Security — Parts Origin Proof

#### SLSA Framework (Supply-chain Levels for Software Artifacts)

SLSA (pronounced "salsa") is a framework for measuring software supply chain security maturity. It was started by Google and is managed by the OpenSSF (Open Source Security Foundation).

> **Analogy**: Think of food safety ratings. When a restaurant has a "Hygiene Grade A" sticker, it means they passed defined criteria. SLSA works similarly -- "This software meets Level 3 standards, so the build process was not tampered with."

```
SLSA Levels:
Level 3: Isolated build, tampering prevention, source verification
Level 2: Signed provenance (hosted build service)
Level 1: Build process documentation, provenance generation
Level 0: No protection
```

| SLSA Level | Requirements | What It Protects | Example |
|------------|-------------|------------------|---------|
| **Level 0** | None | None | Build locally and deploy manually |
| **Level 1** | Documented build process, auto-generated provenance | Verify package is not tampered | Use `slsa-github-generator` in GitHub Actions |
| **Level 2** | Hosted build service, signed provenance | Build service trustworthiness | GitHub Actions + Sigstore signing |
| **Level 3** | Isolated build environment, source/build integrated verification, tamper-proof guarantee | Defends against insider threats | Build system runs in fully isolated environment |

```yaml
# Generate SLSA Level 3 provenance in GitHub Actions
name: SLSA Build
on: push

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      digest: ${{ steps.hash.outputs.digest }}
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - name: Generate artifact hash
        id: hash
        run: |
          sha256sum dist/app.tar.gz | awk '{print $1}' > digest.txt
          echo "digest=$(cat digest.txt)" >> "$GITHUB_OUTPUT"

  # SLSA GitHub Generator automatically creates provenance attestation
  provenance:
    needs: build
    permissions:
      actions: read
      id-token: write
      contents: write
    uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v2.0.0
    with:
      base64-subjects: "${{ needs.build.outputs.digest }}"
```

#### Sigstore: Keyless Signing

Sigstore is an open-source infrastructure for software signing. Its most innovative feature is **Keyless Signing** -- no need to manage private keys.

```
Sigstore Components:

  Cosign   — Container image signing/verification tool
  Fulcio   — Short-lived certificate issuing CA (Certificate Authority)
  Rekor    — Tamper-proof signature record transparency log

How it works:
  1. Run cosign sign
  2. Fulcio issues short-lived certificate (10 min) via GitHub OIDC token
  3. Sign image with the certificate
  4. Signature record permanently stored in Rekor transparency log
  5. Certificate auto-expires → No key management needed!
```

#### Sigstore / cosign — Image Signing

```yaml
jobs:
  build-sign:
    permissions: { contents: read, packages: write, id-token: write }
    steps:
      - uses: sigstore/cosign-installer@v3

      - name: Build and Push
        uses: docker/build-push-action@v5
        id: build
        with:
          push: true
          tags: ghcr.io/my-org/my-app:${{ github.sha }}

      # Keyless Signing (Sigstore + Fulcio)
      - run: cosign sign --yes ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }}

      # Attach SBOM + sign
      - run: |
          syft ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }} -o cyclonedx-json > sbom.cdx.json
          cosign attach sbom --sbom sbom.cdx.json ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }}

      # Verify
      - run: |
          cosign verify \
            --certificate-identity "https://github.com/my-org/my-app/.github/workflows/build.yml@refs/heads/main" \
            --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
            ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }}
```

#### in-toto Attestations

```yaml
# Attach build + vulnerability scan proofs
- run: |
    cosign attest --yes --type slsaprovenance \
      --predicate provenance.json \
      ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }}
    cosign attest --yes --type vuln \
      --predicate trivy-results.json \
      ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }}
```

#### Integrated Pipeline: SBOM Generation + Signing + Verification

In practice, SBOM generation, image signing, and vulnerability scanning are integrated into a single pipeline.

```yaml
# .github/workflows/secure-build.yml
name: Secure Build Pipeline
on:
  push:
    branches: [main]

jobs:
  secure-build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write    # Required for OIDC + cosign signing

    steps:
      - uses: actions/checkout@v4

      # 1. Docker image build + push
      - uses: docker/build-push-action@v5
        id: build
        with:
          push: true
          tags: ghcr.io/my-org/my-app:${{ github.sha }}

      # 2. Generate SBOM (Syft)
      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          image: ghcr.io/my-org/my-app:${{ github.sha }}
          format: cyclonedx-json
          output-file: sbom.cdx.json

      # 3. Sign image (Cosign keyless)
      - uses: sigstore/cosign-installer@v3
      - name: Sign image
        run: cosign sign --yes ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }}

      # 4. Attach SBOM to image + sign
      - name: Attach and sign SBOM
        run: |
          cosign attach sbom --sbom sbom.cdx.json \
            ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }}
          cosign sign --yes --attachment sbom \
            ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }}

      # 5. Vulnerability scan (Trivy)
      - name: Scan for vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ghcr.io/my-org/my-app:${{ github.sha }}
          format: json
          output: trivy-results.json
          severity: CRITICAL,HIGH

      # 6. Attach vulnerability results as attestation
      - name: Attest vulnerability scan
        run: |
          cosign attest --yes --type vuln \
            --predicate trivy-results.json \
            ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }}
```

> **Key point**: Images that pass this pipeline have cryptographic proof of "who built it, when, with what, and with which dependencies." Verifying signatures with `cosign verify` at deployment time prevents tampered images from reaching production.

---

### 8. Container Image Scanning + Pipeline Hardening

#### Secure Dockerfile

```dockerfile
FROM node:20-alpine AS builder
# ❌ FROM node:20 (full image = more vulnerabilities)
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runtime
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -D appuser
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
USER appuser
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Least Privilege Pipeline

```yaml
permissions: {}  # Remove all default permissions!

jobs:
  build:
    permissions: { contents: read }  # Only what's needed!
  deploy:
    permissions: { contents: read, id-token: write, packages: write }
```

#### Actions Version SHA Pinning

```yaml
# ❌ Risky: tag can be tampered
- uses: actions/checkout@v4

# ✅ Safe: SHA pinning prevents tampering
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1
```

#### Compliance as Code

```yaml
# Validate security policy with OPA
- run: |
    cat > policy.rego << 'REGO'
    package pipeline.security
    deny[msg] { input.image_scan != true; msg := "Image scan required" }
    deny[msg] { input.sbom_generated != true; msg := "SBOM required" }
    deny[msg] { input.critical_vulns > 0; msg := sprintf("%d critical vulns", [input.critical_vulns]) }
    REGO
    opa eval -d policy.rego -i compliance-input.json "data.pipeline.security.deny"
```

---

## 💻 Hands-On

### Practice: Comprehensive Security Pipeline

```yaml
# .github/workflows/security-pipeline.yml
name: "Security Pipeline"
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions: {}

jobs:
  # Stage 1: Secret Detection
  secret-scan:
    runs-on: ubuntu-latest
    permissions: { contents: read }
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
        env: { GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}" }

  # Stage 2: SAST
  sast:
    runs-on: ubuntu-latest
    permissions: { contents: read, security-events: write }
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
      - uses: semgrep/semgrep-action@v1
        with: { config: "p/default p/owasp-top-ten" }

  # Stage 3: SCA
  sca:
    runs-on: ubuntu-latest
    permissions: { contents: read, security-events: write }
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
      - uses: aquasecurity/trivy-action@master
        with: { scan-type: 'fs', severity: 'CRITICAL,HIGH', exit-code: '1' }

  # Stage 4: Build + Image Scan + SBOM + Sign
  build-scan:
    needs: [secret-scan, sast, sca]
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write, id-token: write }
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
      - uses: docker/build-push-action@v5
        id: build
        with: { push: true, tags: "ghcr.io/${{ github.repository }}:${{ github.sha }}" }
      - uses: aquasecurity/trivy-action@master
        with: { image-ref: "ghcr.io/${{ github.repository }}:${{ github.sha }}", severity: 'CRITICAL,HIGH', exit-code: '1' }
      - uses: anchore/sbom-action@v0
        with: { image: "ghcr.io/${{ github.repository }}:${{ github.sha }}", format: cyclonedx-json }
      - uses: sigstore/cosign-installer@v3
      - run: cosign sign --yes ghcr.io/${{ github.repository }}@${{ steps.build.outputs.digest }}

  # Stage 5: Security Gate
  security-gate:
    needs: [secret-scan, sast, sca, build-scan]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - run: |
          if [[ "${{ needs.secret-scan.result }}" == "failure" ]] || \
             [[ "${{ needs.sast.result }}" == "failure" ]] || \
             [[ "${{ needs.sca.result }}" == "failure" ]] || \
             [[ "${{ needs.build-scan.result }}" == "failure" ]]; then
            echo "::error::Security gate FAILED!"
            exit 1
          fi
          echo "All security checks passed!"
```

---

## 🏢 Real-World Application

### Security Strategy by Organization Size

```mermaid
flowchart TB
    subgraph Startup["🚀 Startup"]
        S1["GitHub Secret Scanning"]
        S2["Dependabot"]
        S3["gitleaks pre-commit"]
        S4["Trivy basic scan"]
        S5["Cost: Almost free"]
    end

    subgraph Medium["🏢 Mid-sized Company"]
        M1["+ Semgrep / CodeQL"]
        M2["+ Snyk SCA"]
        M3["+ SBOM + cosign"]
        M4["+ OWASP ZAP"]
        M5["Cost: $500-2,000/month"]
    end

    subgraph Enterprise["🏛️ Enterprise"]
        E1["+ SonarQube Enterprise"]
        E2["+ HashiCorp Vault"]
        E3["+ SLSA Level 3"]
        E4["+ Compliance as Code"]
        E5["Cost: $5,000+/month"]
    end

    Startup --> Medium --> Enterprise

    style Startup fill:#27ae60,color:#fff
    style Medium fill:#f39c12,color:#fff
    style Enterprise fill:#8e44ad,color:#fff
```

### Scenario 1: "Secrets exposed on GitHub!"

```
Emergency response:
1. Immediately revoke the exposed secret
2. Check CloudTrail logs for unauthorized use
3. Issue new secret → store in GitHub Secrets/Vault
4. Install gitleaks pre-commit hook + Push Protection
5. Write incident report
```

### Scenario 2: "Critical CVE found in dependency!"

```
1. Query SBOM → identify affected services
2. Check CVSS score + attack vector
3. If patch available → update immediately + deploy / Otherwise → temporary WAF mitigation
4. Re-run vulnerability scans after patching
```

### Security Metrics (Real KPIs)

| Metric | Goal | Check Frequency |
|--------|------|-----------------|
| Mean Time to Remediate (MTTR) | Critical < 24h, High < 7d | Weekly |
| Open Critical Vulnerabilities | 0 | Daily |
| SBOM Coverage | 100% | Monthly |
| SAST Scan Pass Rate | > 95% | Weekly |
| Container Image Freshness | < 30 days | Weekly |

---

## ⚠️ Common Mistakes

### Mistake 1: Hardcoding secrets in code

```python
# ❌ Never do this!
AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE"

# ✅ Use environment variables
import os
AWS_ACCESS_KEY = os.environ.get("AWS_ACCESS_KEY_ID")
```

### Mistake 2: Referencing actions by tag only

```yaml
# ❌ Tag can be tampered (supply chain attack vector)
- uses: actions/checkout@v4

# ✅ SHA pinning prevents tampering
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1
```

### Mistake 3: Over-granting permissions

```yaml
# ❌ Risky
permissions: write-all

# ✅ Least privilege
permissions:
  contents: read
```

### Mistake 4: Ignoring scan results

```yaml
# ❌ Ignore results
- run: trivy image my-app:latest || true

# ✅ Fail on critical/high
- uses: aquasecurity/trivy-action@master
  with: { severity: 'CRITICAL,HIGH', exit-code: '1', ignore-unfixed: true }
```

### Mistake 5: Generating SBOM but not using it

```
❌ Generate SBOM → save artifact → nobody looks at it
✅ Generate SBOM → upload to Dependency-Track → auto-match new CVEs → alerts
```

### Mistake 6: OIDC trust policy too permissive

```json
// ❌ All repos can assume the role
{ "sub": "repo:my-org/*" }

// ✅ Only specific repo + branch
{ "sub": "repo:my-org/my-repo:ref:refs/heads/main" }
```

### Pipeline Security Checklist

```
Secrets:
☐ No hardcoded secrets in code
☐ Using OIDC (temporary credentials)
☐ Pre-commit hook + Push Protection enabled

Scanning:
☐ SAST scan runs on every PR
☐ SCA / Dependency scanning enabled
☐ Container image scanning enabled
☐ Critical/High findings block deployment

Supply Chain:
☐ Actions SHA pinned
☐ SBOM generated and stored
☐ Container images signed (cosign)

Pipeline:
☐ Least privilege permissions
☐ Branch Protection Rules active
☐ Deploy environment approval gates
```

---

## 📝 Summary

### Core Principle: Shift-Left + Defense in Depth

```mermaid
flowchart LR
    DEV["🖥️ IDE<br/>pre-commit<br/>$1"] -->|10x| PR["📋 PR<br/>SAST+SCA<br/>$10"]
    PR -->|10x| BUILD["📦 Build<br/>Image Scan<br/>$100"]
    BUILD -->|10x| STAGING["🧪 Staging<br/>DAST<br/>$1,000"]
    STAGING -->|10x| PROD["🚀 Prod<br/>Runtime<br/>$10,000"]

    style DEV fill:#27ae60,color:#fff
    style PR fill:#2ecc71,color:#fff
    style BUILD fill:#f39c12,color:#fff
    style STAGING fill:#e67e22,color:#fff
    style PROD fill:#e74c3c,color:#fff
```

> **Fix cost increases 10x moving right!** Catch problems on the left (Shift-Left) whenever possible.

### Tool Selection Guide

| Purpose | Free Recommendation | Enterprise Recommendation |
|---------|-----------|-------------------|
| Secret Detection | gitleaks + Push Protection | GitHub Advanced Security |
| SAST | Semgrep + CodeQL | SonarQube Enterprise |
| SCA | Dependabot + Trivy | Snyk |
| DAST | OWASP ZAP | Burp Suite Enterprise |
| SBOM | Syft + Grype | Anchore Enterprise |
| Supply Chain | cosign + SLSA Generator | Chainguard |
| Secrets Mgmt | GitHub Secrets + OIDC | HashiCorp Vault |

---

## 🔗 Next Steps

```
Current location: Pipeline Security ✅

Next learning:
├── [Change Management](./13-change-management) → Deploy approval, change automation
├── [AWS Security Services](../05-cloud-aws/12-security) → KMS, WAF, Shield, GuardDuty
├── [IaC Testing & Policy](../06-iac/06-testing-policy) → Policy as Code, tfsec, OPA
└── [GitHub Actions Hands-On](./05-github-actions) → OIDC, Environment, Reusable Workflows

Practice projects:
1. Set up pre-commit hook + gitleaks
2. Build GitHub Actions security pipeline
3. Automate SBOM generation + image signing
4. Implement Compliance as Code
```

> **Coming Next**: [Change Management](./13-change-management) teaches deployment approval processes, change window management, rollback strategies, and GitOps-based change management. The security gates you learned here become the core of change management!

