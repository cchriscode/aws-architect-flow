---
title: "06. DevSecOps: Security in Development"
description: "Shift Left Security, Threat Modeling, OWASP Top 10, security pipeline, vulnerability management, DevSecOps maturity"
category: "Security"
difficulty: "Advanced"
tags: ["devsecops", "shift-left", "sast", "dast", "sca", "threat-modeling", "security-pipeline"]
---

## Overview

If traditional security says "build the wall after the city is built", DevSecOps says "build security into the city design itself".

**DevSecOps = "Security is Everyone's Responsibility"**

In the past:
- Developers write code
- Testers test code
- Security team does pentest before release ← Too late!

With DevSecOps:
- Developers write code with security in mind
- Testers check for both functionality and security
- Security tools run automatically in CI/CD pipeline
- Security team focuses on architecture and training

---

## Core Concepts

### Shift Left Security

"Shift Left" means moving security checks earlier in the development process - from right (release) to left (code commit).

```
Traditional Security (Right):
└─ Code → Build → Test → Deploy → PENTEST (found vulnerabilities!)
                                      ↑ Too late, need to rollback

Shift Left Security (Left):
└─ SAST → Code → Build → SCA → Container Scan → Deploy → DAST
   ↑ Catch issues early when fixing is cheap
```

Benefits of Shift Left:
- **Cost**: Fixing at commit = 10x cheaper than fixing in production
- **Speed**: Developers fix issues immediately
- **Quality**: Issues are caught before review
- **Culture**: Security is part of development, not an external gate

### Security in Development Lifecycle

```
Phases and Security Activities:

1. Design Phase
   └─ Threat Modeling (STRIDE/DREAD)
      Risk Assessment
      Security Architecture Review

2. Development Phase
   └─ Code Review (security-focused)
      Pre-commit hooks (secret detection, linting)
      SAST (Static Application Security Testing)
      Library scanning (SCA)

3. Build Phase
   └─ Container image scanning (Trivy, Grype)
      SBOM (Software Bill of Materials) generation
      Code signing

4. Test Phase
   └─ DAST (Dynamic Application Security Testing)
      API security testing
      Database security testing

5. Deployment Phase
   └─ Infrastructure scanning (IaC security)
      Network policy validation
      Secrets rotation

6. Runtime Phase
   └─ RASP (Runtime Application Self-Protection)
      WAF rules
      Security monitoring
      Incident response
```

---

## Threat Modeling

Threat Modeling is "What could go wrong?" analysis before you build, so you can prevent it.

### STRIDE Methodology

STRIDE identifies **6 categories of threats**:

```yaml
Threats (STRIDE):
  S - Spoofing: Impersonating someone/something
      Example: Stealing JWT token to access another user's account
      Mitigation: Session binding, IP+Device fingerprint

  T - Tampering: Modifying data in transit or at rest
      Example: Client modifies order price before sending to server
      Mitigation: Server-side validation, digital signatures

  R - Repudiation: Denying you did something
      Example: "I never made that transaction!"
      Mitigation: Audit logs (immutable), event sourcing

  I - Information Disclosure: Exposing sensitive data
      Example: API returns credit card numbers in error message
      Mitigation: Error handling, encryption, minimal logging

  D - Denial of Service: Taking system down
      Example: DDoS attack, ReDoS regex
      Mitigation: Rate limiting, WAF, CDN, input validation

  E - Elevation of Privilege: Gaining higher access
      Example: Regular user becomes admin
      Mitigation: RBAC, principle of least privilege
```

### DREAD Risk Scoring

DREAD helps **quantify threat severity**:

```yaml
DREAD Scoring (Rate each 1-3):

D - Damage Potential: How bad if exploited?
    (1 = minor, 2 = significant, 3 = critical/system crash)

R - Reproducibility: How easy to exploit?
    (1 = very hard, 2 = moderate, 3 = easy)

E - Exploitability: What's required to exploit?
    (1 = advanced attacker+tools, 2 = moderate, 3 = anyone with browser)

A - Affected Users: How many users impacted?
    (1 = few, 2 = moderate, 3 = majority/all)

D - Discoverability: How easy to find vulnerability?
    (1 = very hard, 2 = moderate, 3 = obvious/public)

Formula: (D + R + E + A + D) / 5 = Risk Score (1-3)

Score 2.5+: HIGH risk, needs immediate fix
Score 1.5-2.5: MEDIUM risk, plan fix in sprint
Score <1.5: LOW risk, track but lower priority
```

### Threat Modeling in Practice

```yaml
# Example: Online Shopping Payment System
Service: Payment Processing

Data Flows:
  1. User → Browser → API Gateway → Payment Service
  2. Payment Service → External PG (Stripe)
  3. Payment Service → Database

Threats to Flow 1:
  - Spoofing: Stolen JWT token → access other users' history
    DREAD: (2+2+2+3+2)/5 = 2.2 (HIGH)
    Mitigation: Session binding, IP+Device fingerprint

  - Tampering: Modify payment amount in request
    DREAD: (3+1+1+3+3)/5 = 2.2 (HIGH)
    Mitigation: Server-side amount validation, payment signature

  - Information Disclosure: API error shows card last 4 digits
    DREAD: (2+2+2+2+1)/5 = 1.8 (MEDIUM)
    Mitigation: Generic error messages, separate logging

Outcome:
  → Implement mitigations in current sprint
  → Security review before payment feature release
  → Periodic threat model update when adding features
```

---

## OWASP Top 10

OWASP publishes the **10 most dangerous web application vulnerabilities** (updated every 3-4 years).

Current: OWASP Top 10 2021

```yaml
1. Broken Access Control
   Problem: Authorization not enforced correctly
   Example: Can access /users/123/profile and also /users/124/profile
   Prevention: RBAC, permission checks, principle of least privilege

2. Cryptographic Failures
   Problem: Sensitive data not encrypted properly
   Example: Passwords stored as plain text
   Prevention: Encryption at rest+transit, hashing, salt+pepper

3. Injection
   Problem: User input directly executed (SQL, OS, LDAP)
   Example: SQL: "SELECT * FROM users WHERE id=" + userId
           → userId="1 OR 1=1" returns all users
   Prevention: Parameterized queries, input validation, ORM

4. Insecure Design
   Problem: Missing security controls in architecture
   Example: No rate limiting, no account lockout
   Prevention: Threat modeling, secure design patterns

5. Security Misconfiguration
   Problem: Default settings, unnecessary features, outdated
   Example: Debug mode enabled in production, S3 bucket public
   Prevention: CIS Benchmarks, Infrastructure as Code, scanning

6. Vulnerable and Outdated Components
   Problem: Using libraries with known CVEs
   Example: Using Log4j 2.13 (vulnerable to Log4Shell)
   Prevention: SBOM, SCA tools, Dependabot, regular updates

7. Authentication and Session Management Failures
   Problem: Weak auth, session handling issues
   Example: Predictable session IDs, no MFA
   Prevention: Strong password policy, MFA, secure session mgmt

8. Software and Data Integrity Failures
   Problem: CI/CD, updates not verified
   Example: Package.json tampered, binary compromised
   Prevention: Code signing, SBOM, supply chain security (SLSA)

9. Logging and Monitoring Failures
   Problem: Can't detect attacks because no logs
   Example: No alerting for multiple failed login attempts
   Prevention: Comprehensive logging, SIEM, alerting

10. Server-Side Request Forgery (SSRF)
    Problem: Server makes unintended requests
    Example: Calling internal IP via user input
    Prevention: Input validation, network segmentation, WAF
```

---

## Security Testing in CI/CD

### SAST (Static Application Security Testing)

SAST analyzes **source code** without running it.

Tools: Semgrep, CodeQL, Bandit, SonarQube

```bash
# Example: Semgrep (finds security issues in code)
semgrep --config=p/security-audit --json > semgrep-results.json

# Detects:
# - SQL Injection: sql = f"SELECT * FROM users WHERE id={user_id}"
# - XSS: response.write(user_input)  # No escaping
# - Hardcoded secrets: AWS_KEY = "AKIAIOSFODNN7EXAMPLE"
# - Weak crypto: hashlib.md5(password)  # Should use bcrypt
```

### SCA (Software Composition Analysis)

SCA checks **dependencies** for known vulnerabilities.

Tools: Trivy, Dependabot, Snyk, Black Duck

```bash
# Example: Trivy scans dependencies
trivy fs . --format json > trivy-results.json

# Detects:
# - Outdated numpy with CVE-2021-12345
# - axios vulnerable to SSRF (CVE-2020-28168)
# - Log4j 2.13 with Log4Shell (CVE-2021-44228)

# Dependabot auto-creates PRs for updates:
# "Bump log4j from 2.13.3 to 2.17.1"
```

### Container Scanning

Container scanning checks **Docker images** for vulnerabilities.

```bash
# Trivy scans container images
trivy image myapp:latest

# Detects:
# - OS packages (apt, yum) with known CVEs
# - Application layer vulnerabilities
# - Misconfigurations (running as root, etc.)

# Output example:
# myapp:latest (ubuntu 20.04)
# ─────────────────────────────────
# Total: 5 vulnerabilities
# CRITICAL: 1 (openssl 1.1.1f-1ubuntu2)
# HIGH: 3
# MEDIUM: 1
```

### DAST (Dynamic Application Security Testing)

DAST runs **against a running application** (staging environment).

Tools: OWASP ZAP, Burp Suite, Nuclei

```bash
# OWASP ZAP automated scan
zaproxy -cmd -quickurl http://staging.app.com -quickout report.html

# Tests:
# - XSS vulnerabilities
# - SQL Injection
# - CSRF
# - Broken authentication
# - Security headers
```

---

## Security Champions and Culture

### Security Champion Program

A **Security Champion** is a developer who:
- Understands security fundamentals
- Reviews code for security
- Promotes security awareness
- Acts as bridge between dev and security teams

```
Typical Program:
├─ Selection: 1 champion per 5-10 developers
├─ Training: OWASP Top 10, threat modeling, secure coding
├─ Responsibilities:
│  ├─ Code security reviews (15% of time)
│  ├─ Threat modeling for new features
│  ├─ Team security training (monthly)
│  └─ Vulnerability remediation tracking
├─ Support:
│  ├─ Monthly community meeting
│  ├─ Slack #security-champions channel
│  ├─ Access to training budget
│  └─ Career growth path
└─ Recognition:
   ├─ "Champion of the Quarter" award
   ├─ Public recognition
   └─ Salary impact
```

### Building Security Culture

```
How to make security part of development culture:

1. Make it easy (don't block):
   ✅ Pre-commit hooks for secret detection (catches before commit)
   ✅ SAST shows errors in IDE (fix before push)
   ❌ Don't: Check secrets after push and block merge

2. Educate continuously:
   ✅ Monthly 30-min "Security Snack" sessions
   ✅ OWASP Top 10 reading club
   ❌ Don't: One annual security training

3. Celebrate wins:
   ✅ "This quarter we reduced MTTR by 50%!"
   ✅ "Security Champions found 10 critical issues"
   ❌ Don't: Only mention security when things break

4. Make it their responsibility:
   ✅ Dev team owns vulnerability fixes
   ✅ Developers can't push without SCA passing
   ❌ Don't: "Security team will handle it"

5. Connect to business:
   ✅ "Strong security = customer trust = revenue"
   ❌ Don't: "We have to comply with SOC2"
```

---

## Vulnerability Management

### Vulnerability Lifecycle

```
1. Discovery
   ↓ (SAST/SCA/DAST finds issue)
2. Triage
   ↓ (Classify: Critical/High/Medium/Low)
3. Assignment
   ↓ (Assign to developer)
4. Remediation
   ↓ (Developer fixes)
5. Verification
   ↓ (Security team verifies fix)
6. Closure
   ↓ (Mark as resolved)
7. Prevention
   ↓ (Add rule to SAST to catch similar)
```

### Vulnerability SLA

SLA = **Service Level Agreement** — how quickly must vulnerabilities be fixed?

```yaml
Vulnerability Management SLA:

critical:
  sla: "24시간"  # Must fix within 24 hours
  escalation: "12시간 후 알림"
  examples:
    - "Remote Code Execution (RCE)"
    - "SQL Injection with data access"
    - "SQL Injection"
    - "XSS (Stored)"
    - "SSRF"

medium:
  sla: "30일"  # 30 days
  escalation: "14일 후 알림"
  examples:
    - "XSS (Reflected)"
    - "Information Disclosure"
    - "CSRF"

low:
  sla: "90일"  # 90 days
  escalation: "60일 후 알림"
  examples:
    - "Missing security headers"
    - "Cookie flags not set"
    - "Error message information leakage"

# Exception Process
exception_process:
  approval_required: ["Security Lead", "Engineering Manager"]
  max_extension: "2x original SLA"
  documentation: "Risk acceptance reason, mitigation measures, review date"
```

### Vulnerability Dashboard

```python
# scripts/vuln-dashboard-metrics.py
"""Collect vulnerability management metrics"""
from datetime import datetime, timedelta

def calculate_vulnerability_metrics(vulnerabilities: list[dict]) -> dict:
    """Calculate key vulnerability management metrics"""

    now = datetime.now()

    # 1. Unresolved vulnerabilities by severity
    open_by_severity = {
        "critical": 0, "high": 0, "medium": 0, "low": 0
    }
    for v in vulnerabilities:
        if v["status"] == "open":
            open_by_severity[v["severity"]] += 1

    # 2. MTTR (Mean Time to Remediate) — average time to fix
    resolved = [v for v in vulnerabilities if v["status"] == "closed"]
    mttr_by_severity = {}
    for severity in ["critical", "high", "medium", "low"]:
        severity_resolved = [
            v for v in resolved if v["severity"] == severity
        ]
        if severity_resolved:
            total_hours = sum(
                (v["resolved_at"] - v["discovered_at"]).total_seconds() / 3600
                for v in severity_resolved
            )
            mttr_by_severity[severity] = total_hours / len(severity_resolved)

    # 3. SLA Compliance Rate
    sla_limits = {"critical": 24, "high": 168, "medium": 720, "low": 2160}
    sla_compliance = {}
    for severity, limit_hours in sla_limits.items():
        severity_resolved = [
            v for v in resolved if v["severity"] == severity
        ]
        if severity_resolved:
            within_sla = sum(
                1 for v in severity_resolved
                if (v["resolved_at"] - v["discovered_at"]).total_seconds() / 3600 <= limit_hours
            )
            sla_compliance[severity] = within_sla / len(severity_resolved) * 100

    # 4. Vulnerability Density (vulns per 1000 lines of code)
    total_kloc = 150  # Example: 150K lines
    vuln_density = len([v for v in vulnerabilities if v["status"] == "open"]) / total_kloc

    # 5. False Positive Rate
    total_found = len(vulnerabilities)
    false_positives = len([v for v in vulnerabilities if v["status"] == "false_positive"])
    fp_rate = (false_positives / total_found * 100) if total_found > 0 else 0

    return {
        "open_vulnerabilities": open_by_severity,
        "mttr_hours": mttr_by_severity,
        "sla_compliance_percent": sla_compliance,
        "vulnerability_density_per_kloc": round(vuln_density, 2),
        "false_positive_rate_percent": round(fp_rate, 1),
    }

# Sample output:
# {
#   "open_vulnerabilities": {"critical": 0, "high": 3, "medium": 12, "low": 25},
#   "mttr_hours": {"critical": 8.5, "high": 72.3, "medium": 336.0, "low": 1200.0},
#   "sla_compliance_percent": {"critical": 95.0, "high": 88.5, "medium": 82.0, "low": 90.0},
#   "vulnerability_density_per_kloc": 0.27,
#   "false_positive_rate_percent": 12.3
# }
```

---

## Security Metrics

"You can't improve what you don't measure"

### Key DevSecOps Metrics

```
┌─────────────────────────────────────────────────────────────────┐
│                    DevSecOps Core Metrics                        │
├─────────────────────┬───────────────────────────────────────────┤
│ MTTR for Vulns      │ Average time from discovery to fix        │
│ (Mean Time to       │ Goal: Critical < 24h, High < 7d           │
│  Remediate)         │ Measure: (fix_date - discovery_date) avg  │
├─────────────────────┼───────────────────────────────────────────┤
│ Vulnerability       │ Vulnerabilities per 1000 lines of code    │
│ Density             │ Goal: < 0.5 per KLOC                      │
│                     │ Measure: open_vulns / KLOC                │
├─────────────────────┼───────────────────────────────────────────┤
│ SLA Compliance      │ % of vulns fixed within SLA deadline       │
│ Rate                │ Goal: Critical 95%, High 90%               │
│                     │ Measure: (fixed_in_sla / total_fixed) × 100│
├─────────────────────┼───────────────────────────────────────────┤
│ Scan Coverage       │ % of projects with security scans          │
│                     │ Goal: SAST 100%, DAST 80%, SCA 100%        │
│                     │ Measure: (scanned / total) × 100           │
├─────────────────────┼───────────────────────────────────────────┤
│ False Positive      │ % of alerts that aren't real vulns        │
│ Rate                │ Goal: < 15%                                │
│                     │ Measure: (false_positives / total) × 100   │
├─────────────────────┼───────────────────────────────────────────┤
│ Security Debt       │ Accumulated unresolved security issues    │
│                     │ Goal: Decrease each sprint                 │
│                     │ Measure: unresolved_count × severity_weight│
├─────────────────────┼───────────────────────────────────────────┤
│ Champion            │ Security Champion activity index           │
│ Engagement          │ Goal: 2+ security reviews per month        │
│                     │ Measure: reviews + training + issues fixed │
└─────────────────────┴───────────────────────────────────────────┘
```

---

## DevSecOps Maturity Model

Where is your organization on the maturity scale?

```
Level 0: Initial
─────────────────────────
• Security is "security team's job"
• Manual security reviews (pre-release only)
• No security tools
• No vulnerability management process
→ "Call firemen only after fire starts"

Level 1: Managed (Repeatable)
─────────────────────────
• Basic SAST/SCA tools introduced
• Some security scans in CI
• Vulnerability tracking starts (spreadsheets)
• Annual security training
→ "Have a fire extinguisher but no drills"

Level 2: Defined
─────────────────────────
• Security Champions program operating
• Threat Modeling conducted regularly
• Automated security gates (PR blocks)
• Vulnerability SLA defined and tracked
• Quarterly OWASP Top 10 training
→ "Fire system complete, regular drills"

Level 3: Quantitatively Managed (Measured)
─────────────────────────
• MTTR, Vuln Density metrics dashboards
• Security Debt tracked and decreasing
• SBOM + Supply Chain security
• Compliance as Code implemented
• Security metrics drive decisions
→ "IoT sensors for real-time detection, data-driven prevention"

Level 4: Optimizing
─────────────────────────
• Security fully embedded in dev culture
• AI-powered vulnerability prediction+auto-fix
• Chaos Security Engineering
• Red Team / Blue Team operations
• Industry-leading benchmarks
→ "Self-healing system + AI fire prediction + fully fireproofed"
```

---

## Hands-On Labs

### Lab 1: Threat Modeling Workshop (STRIDE)

```yaml
# Scenario: Online shopping checkout system
# Architecture:
#   User → CDN → ALB → API Gateway → Payment Service → PostgreSQL
#                                   → Redis (session)

service: payment-service
participants: ["backend-dev", "security-champion", "infra-engineer"]

data_flows:
  - name: "User → API Gateway"
    threats:
      - stride: Spoofing
        threat: "Stolen session token to access another user's account"
        dread: { D: 9, R: 7, E: 6, A: 8, D_disc: 5 }  # Score: 7.0
        priority: HIGH
        mitigation: "Session binding (IP + Device Fingerprint)"

      - stride: Tampering
        threat: "Client modifies order amount before sending to server"
        dread: { D: 10, R: 9, E: 8, A: 10, D_disc: 7 }  # Score: 8.8
        priority: CRITICAL
        mitigation: "Server-side amount validation, payment signature"

  - name: "Payment Service → PostgreSQL"
    threats:
      - stride: Information Disclosure
        threat: "Card numbers stored plaintext in database"
        dread: { D: 10, R: 10, E: 3, A: 10, D_disc: 4 }  # Score: 7.4
        priority: HIGH
        mitigation: "PCI DSS compliance, tokenization, encrypted storage"

      - stride: Repudiation
        threat: "User changes transaction then denies it"
        dread: { D: 8, R: 5, E: 4, A: 6, D_disc: 3 }  # Score: 5.2
        priority: MEDIUM
        mitigation: "Immutable audit logs, event sourcing"

# Next steps:
# 1. Add CRITICAL/HIGH mitigations to sprint backlog
# 2. Implement and re-evaluate
# 3. Share results with team
# 4. Champion tracks implementation
```

### Lab 2: Pre-commit Security Hooks

```bash
# 1. Install pre-commit
pip install pre-commit

# 2. Create config
cat > .pre-commit-config.yaml << 'EOF'
repos:
  # Secret detection
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks

  # Python security linting
  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.7
    hooks:
      - id: bandit
        args: ['-ll', '-ii']  # LOW and above, INFO and above

  # Dockerfile security checks
  - repo: https://github.com/hadolint/hadolint
    rev: v2.12.0
    hooks:
      - id: hadolint
EOF

# 3. Install hooks
pre-commit install

# 4. Test: Try to commit a secret
echo 'AWS_SECRET_KEY = "AKIAIOSFODNN7EXAMPLE"' > test_secret.py
git add test_secret.py
git commit -m "test"
# gitleaks..............................................................Failed
# - hook id: gitleaks
# - exit code: 1
# Secret detected in test_secret.py:1 → Commit blocked!

# Clean up
rm test_secret.py
```

### Lab 3: Vulnerability Dashboard with DefectDojo

```yaml
# docker-compose.yml
services:
  defectdojo:
    image: defectdojo/defectdojo-django:latest
    ports:
      - "8080:8080"
    environment:
      DD_DATABASE_URL: postgresql://defectdojo:password@db:5432/defectdojo
      DD_SECRET_KEY: "your-secret-key-change-me"
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: defectdojo
      POSTGRES_USER: defectdojo
      POSTGRES_PASSWORD: password
    volumes:
      - defectdojo-db:/var/lib/postgresql/data

volumes:
  defectdojo-db:
```

```bash
# Upload scan results to DefectDojo
# Trivy results
curl -X POST "https://defectdojo.mycompany.com/api/v2/import-scan/" \
  -H "Authorization: Token ${DEFECTDOJO_TOKEN}" \
  -F "scan_type=Trivy Scan" \
  -F "file=@trivy-results.json" \
  -F "engagement=${ENGAGEMENT_ID}" \
  -F "verified=true" \
  -F "active=true"

# Semgrep results
curl -X POST "https://defectdojo.mycompany.com/api/v2/import-scan/" \
  -H "Authorization: Token ${DEFECTDOJO_TOKEN}" \
  -F "scan_type=Semgrep JSON Report" \
  -F "file=@semgrep-results.json" \
  -F "engagement=${ENGAGEMENT_ID}"
```

### Lab 4: Security Metrics Collection

```yaml
# .github/workflows/security-metrics.yml
name: Security Metrics Collection

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday 09:00 UTC

jobs:
  collect-metrics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # 1. Calculate vulnerability density
      - name: Count Lines of Code
        run: |
          KLOC=$(find src/ -name "*.py" -o -name "*.js" -o -name "*.ts" | \
                 xargs wc -l | tail -1 | awk '{print $1/1000}')
          echo "KLOC=${KLOC}" >> $GITHUB_ENV

      # 2. Collect vulnerabilities with Trivy
      - name: Trivy Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          format: 'json'
          output: 'trivy-results.json'

      # 3. Calculate and report metrics
      - name: Calculate and Report Metrics
        run: |
          CRITICAL=$(jq '[.Results[].Vulnerabilities[]? | select(.Severity=="CRITICAL")] | length' trivy-results.json)
          HIGH=$(jq '[.Results[].Vulnerabilities[]? | select(.Severity=="HIGH")] | length' trivy-results.json)
          TOTAL=$((CRITICAL + HIGH))
          DENSITY=$(echo "scale=2; $TOTAL / $KLOC" | bc)

          echo "## Weekly Security Metrics" >> $GITHUB_STEP_SUMMARY
          echo "| Metric | Value |" >> $GITHUB_STEP_SUMMARY
          echo "|--------|-------|" >> $GITHUB_STEP_SUMMARY
          echo "| Critical Vulns | ${CRITICAL} |" >> $GITHUB_STEP_SUMMARY
          echo "| High Vulns | ${HIGH} |" >> $GITHUB_STEP_SUMMARY
          echo "| Vuln Density (per KLOC) | ${DENSITY} |" >> $GITHUB_STEP_SUMMARY
          echo "| Code Size (KLOC) | ${KLOC} |" >> $GITHUB_STEP_SUMMARY

      # 4. Slack notification
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1.25.0
        with:
          payload: |
            {
              "text": "📊 Weekly Security Metrics\nCritical: ${{ env.CRITICAL }}\nHigh: ${{ env.HIGH }}\nDensity: ${{ env.DENSITY }}/KLOC"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_SECURITY_WEBHOOK }}
```

---

## In Practice

### Startup (10-50 people) → Level 0 → Level 1

```
Priority:
1. Pre-commit hooks (gitleaks) — 30 min setup
2. Enable GitHub Dependabot — few clicks
3. Add Trivy to CI — one pipeline line
4. OWASP Top 10 team study — 30 min weekly

Time investment: 2-4 hours/week
Tool cost: $0 (all free/open source)
Effect: Auto-detect 80% of common vulns
```

Minimal security pipeline:
```yaml
# .github/workflows/basic-security.yml
name: Basic Security
on: [pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      # Secret Detection
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      # Dependency Scan
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL'
          exit-code: '1'
```

### Mid-size Company (50-500 people) → Level 1 → Level 2

```
Additional investments:
1. Security Champions program (1 per team)
2. Quarterly Threat Modeling
3. SAST (Semgrep) + SCA (Trivy) + DAST (ZAP) integration
4. Vulnerability SLA with tracking
5. Quarterly security training
6. DefectDojo for centralized vuln management

Staff: 1-2 security engineers
Tool cost: $0-5K/month
Effect: Systematic vuln management, compliance foundation
```

### Enterprise (500+ people) → Level 2 → Level 3/4

```
Advanced investments:
1. Security Metrics dashboard (Grafana + custom)
2. SBOM + Supply Chain Security (SLSA)
3. Runtime Protection (Falco, RASP)
4. Compliance as Code (OPA, Kyverno)
5. Red Team / Purple Team
6. Bug Bounty program
7. AI-powered vuln analysis

Staff: AppSec team 3-10 people
Tool cost: $10K-50K+/month
Effect: Proactive security, automated compliance, industry leader level
```

---

## Common Mistakes

### Mistake 1: Tool-Only Approach

```
❌ "We deployed Semgrep, we do DevSecOps!"
   → Developers ignore alerts → vulnerabilities remain

✅ Tools + Training + Process + Metrics:
   → Security Champion reviews results
   → Weekly security triage meeting
   → MTTR tracked and improved
   → Metric improvements celebrated
```

### Mistake 2: All-At-Once Adoption

```
❌ Week 1: "Turn on SAST, DAST, SCA, IAST, RASP - everything!"
   → Hundreds of alerts → dev team panics → "turn it off"

✅ Gradual rollout:
   Month 1: Pre-commit hooks + secret detection (blocking)
   Month 2: SAST - Critical only (warning)
   Month 3: SCA + Dependabot auto-PR
   Month 4: Container scanning
   Month 6: DAST (staging only)
   Month 9: Full security gates
```

### Mistake 3: Not Managing False Positives

```
❌ Scanner finds 100 issues → 70 are false positives
   → "All alerts are spam" → everyone ignores them
   = "Crying wolf" effect

✅ False Positive Management:
   1. Tune rules for your codebase
   2. Track false positive rate (goal: <15%)
   3. Disable noisy rules
   4. Regular rule review (quarterly)
```

### Mistake 4: Threat Modeling "Once and Done"

```
❌ Initial threat model created → Never updated
   → New features, architecture changes not reflected

✅ "Living Threat Model":
   - Update when adding features
   - Update on architecture changes
   - Update after security incidents
   - Quarterly review minimum
   - Stored in git with code
```

### Mistake 5: Not Recognizing Security Champions

```
❌ "Champion work is on top of regular job" → Burnout → person leaves

✅ Recognize champion role:
   - 10-20% of work time for champion activities
   - Include in performance reviews
   - Provide training/conference budget
   - "Champion of the Quarter" awards
   - Career growth path
```

### Mistake 6: Measuring Without Action

```
❌ "We have MTTR dashboard" → Check weekly → No improvement
   → 3 months later MTTR same as ever

✅ Metrics → Insight → Action → Measure:
   1. MTTR Critical = 72h (but SLA is 24h)
   2. Why? Assignment takes 48h
   3. Action: Auto-assignment + escalation policy
   4. Re-measure: MTTR Critical now 18h! ✅
```

---

## Summary

### DevSecOps Core Principles

```mermaid
mindmap
  root((DevSecOps))
    Culture
      Shared responsibility
      Security Champions
      Continuous learning
      Security = Quality
    Process
      Shift Left
      Threat Modeling
        STRIDE
        DREAD
      Vuln Management
        SLA-based
        Lifecycle
    Technology
      Security Pipeline
        Pre-commit
        SAST
        SCA
        Container Scan
        DAST
        Runtime Protection
      Security Metrics
        MTTR
        Vuln Density
        SLA Compliance
    Maturity
      Level 0: Initial
      Level 1: Managed
      Level 2: Defined
      Level 3: Measured
      Level 4: Optimizing
```

### Remember These Core Principles

```
1️⃣  Shift Left — Catch issues early, fix is 10x cheaper
2️⃣  People > Tools — Culture matters more than tools
3️⃣  Automation First — Machines repeat, people decide
4️⃣  Measure → Improve — No data = no improvement
5️⃣  Start Small — Level 0→1 is biggest change
```

---

## Next Steps

```
Current: DevSecOps ✅

Prior Learning (Review):
├── [Pipeline Security](../07-cicd/12-pipeline-security) → SAST/DAST/SCA details
└── [Container Security](./03-container-security) → Image scanning, runtime protection

Next Learning:
├── [Incident Response](./07-incident-response) → When security breaks
├── [AWS Security Services](../05-cloud-aws/12-security) → GuardDuty, SecurityHub, WAF
└── [IaC Testing & Policy](../06-iac/06-testing-policy) → Policy as Code, OPA, tfsec

Practical Projects:
1. Set up pre-commit hooks + basic security pipeline (30 min)
2. Conduct Threat Modeling workshop (team project)
3. Build integrated security pipeline (SAST + SCA + Container Scan)
4. Create Security Metrics dashboard + weekly review
5. Launch Security Champions program
```

---

> **Key Takeaway**: Security shouldn't be added at the end - it should be built in from the beginning. Start small, automate aggressively, measure everything, and let your team own security as much as you own features. That's DevSecOps.
