# Secrets Management

> If we learned "who can access" in [Identity & Access Management](./01-identity), this time we'll learn **"how to safely store, transmit, and rotate secret information"**. Building on the fundamentals of [AWS Security Services](../05-cloud-aws/12-security) covered earlier, we'll explore everything from HashiCorp Vault to Sealed Secrets and External Secrets Operator in Kubernetes environments. Together with [Pipeline Security](../07-cicd/12-pipeline-security), the complete DevSecOps picture becomes clear.

---

## 🎯 Why do you need to understand secrets management?

### Real-world analogy: Key management

Think about your daily life.

- **Hide house key under the doormat?** → That's the first place thieves check
- **Write passwords on sticky notes on monitor?** → Everyone can see them
- **Use same key for all doors?** → Lose one, lose everything
- **Haven't changed key in 10 years?** → Previous tenants can still enter
- **Don't know where key copies are?** → Can't tell who has access

The same applies in software. **Secrets are the keys to your system**, and mismanagement puts the entire system at risk.

### Real-world scenarios requiring secrets management

```
• Hardcoded DB password in source code, exposed on GitHub              → Secrets Manager / Vault
• AWS Access Key embedded in Docker image                              → Environment variables + Dynamic credentials
• Different secrets for dev/staging/prod, but no management            → Centralized secrets management
• Need to change DB password, but requires redeploying 10 services    → Dynamic Secrets + Auto-rotation
• K8s Secret stored in etcd as plaintext, is this OK?                 → Sealed Secrets / ESO
• Deploying with GitOps, how do I commit Secret to Git?               → SOPS / Sealed Secrets
• TLS certificate expired, service went down                           → Automatic certificate management
• Interview: "What's a Vault Dynamic Secret?"                         → Master this lecture!
```

### Reality of secrets exposure incidents

| Incident | What happened? | Lesson |
|------|-----------|------|
| **Uber (2016)** | AWS key exposed in private GitHub repo → 57M user data leaked | Never hardcode secrets in code |
| **Samsung (2022)** | GitGuardian found 100+ AWS keys in engineer's public repo | Automatic Secret Scanning required |
| **CircleCI (2023)** | Internal system breach → all customers' env vars/tokens exposed | Secret rotation + least privilege |
| **Microsoft (2024)** | Hardcoded key in internal repo accessing email system | Regular scanning + automatic revocation |

> "Secret exposure is not a matter of **if**, but **when**." — Industry saying

---

## 🧠 Core concepts

### Analogy: Hotel key management system

Let's compare secrets management tools to a **hotel system**.

| Hotel System | Secrets Management Tool | Explanation |
|-------------|---------------|------|
| Master key safe | **HashiCorp Vault** | Master safe for all keys. Issues, revokes, audits room keys |
| Front desk | **AWS Secrets Manager** | "Give me DB password" → securely delivers and auto-rotates |
| Room memo system | **AWS Parameter Store** | Manages config values like "Room 302 guest has allergy" and secrets |
| Sealed letter | **Sealed Secrets** | Sealed letter can only be opened in specific hotel (cluster) |
| Proxy pickup service | **External Secrets Operator** | Retrieves keys from other hotel safes (AWS, Vault) on behalf |
| Envelope encryption | **SOPS** | Encrypts only content, leaves envelope (key name) readable |
| Card key system | **Dynamic Secrets** | New card issued each check-in, auto-revoked at check-out |

### Types of Secrets

Secrets aren't a single type. Each has different characteristics and management methods.

| Type | Example | Characteristics | Management Point |
|------|------|------|------------|
| **API Keys** | OpenAI API Key, Stripe Secret Key | Long-lived, service authentication | Periodic rotation, scope limitation |
| **DB Passwords** | PostgreSQL, MySQL passwords | Infrastructure access, data breach risk | Dynamic generation, auto-rotation |
| **TLS Certificates** | HTTPS, mTLS certificates | Expiration date exists, chain management needed | Auto-renewal (cert-manager) |
| **SSH Keys** | Private keys for server access | Long-lived, high privilege | Periodic rotation, CA-based management |
| **OAuth Tokens** | GitHub, Google OAuth Token | Mixed short/long-lived tokens | Token lifetime management, refresh logic |
| **Encryption Keys** | AES keys, KMS CMK | Core of data encryption | Envelope Encryption, key rotation |
| **Service Account Keys** | GCP SA JSON, K8s SA Token | Service-to-service auth | Workload Identity, short-lived tokens |

### Core principles of secrets management

```mermaid
mindmap
  root((Secrets Management<br/>Core Principles))
    Centralization
      Single source of truth
      Consistent access policies
      Unified audit logs
    Least Privilege
      Only needed secrets
      Only needed time
      Only needed service
    Automation
      Auto rotation
      Auto revocation
      Auto injection
    Encryption
      TLS in transit
      AES at rest
      Envelope Encryption
    Audit
      Who, when, what accessed?
      Change history tracking
      Anomaly detection
    Short Lifetime
      Dynamic Secrets
      TTL settings
      Auto expiration
```

### 12-Factor App and secrets management

The [12-Factor App](https://12factor.net) **Factor III: Config** — "Store config in environment" — is the starting point for secrets management.

```
❌ Antipattern (hardcoded secrets in code)
─────────────────────────────────
db_password = "super_secret_123"       # Directly in source
API_KEY = "sk-abc123..."               # Defined as constant

❌ Slightly better antipattern (.env file committed to Git)
─────────────────────────────────
DB_PASSWORD=super_secret_123           # .env file in Git

⚠️ Basic stage (environment variables, but manual management)
─────────────────────────────────
export DB_PASSWORD="super_secret_123"  # Manual setup at deployment

✅ Recommended stage (using secrets management tool)
─────────────────────────────────
DB_PASSWORD=$(vault kv get -field=password secret/myapp/db)
DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id myapp/db)

✅✅ Ideal stage (Dynamic Secrets)
─────────────────────────────────
# Vault auto-creates temporary DB account → auto-deletes after TTL
vault read database/creds/myapp-role
```

### Complete secrets management tool map

```mermaid
flowchart TB
    subgraph STORE["Secret Storage"]
        VAULT["HashiCorp Vault<br/>Self-hosted / HCP"]
        ASM["AWS Secrets Manager<br/>Fully managed"]
        PS["AWS Parameter Store<br/>Free tier available"]
        GCP_SM["GCP Secret Manager"]
        AKV["Azure Key Vault"]
    end

    subgraph K8S_TOOLS["K8s Secrets Tools"]
        K8S_SEC["K8s Secrets<br/>⚠️ Base64 only"]
        SEALED["Sealed Secrets<br/>Git-safe"]
        ESO["External Secrets<br/>Operator"]
        CSI["Secrets Store<br/>CSI Driver"]
    end

    subgraph GITOPS_TOOLS["GitOps Secrets Tools"]
        SOPS_TOOL["SOPS<br/>File encryption"]
        AGE["age / gpg<br/>Key encryption"]
        HELM_SEC["Helm Secrets<br/>Plugin"]
    end

    ESO -->|"Sync"| VAULT
    ESO -->|"Sync"| ASM
    ESO -->|"Sync"| GCP_SM
    ESO -->|"Sync"| AKV
    CSI -->|"Mount"| VAULT
    CSI -->|"Mount"| ASM
    SOPS_TOOL -->|"Encryption key"| AGE
    SOPS_TOOL -->|"Encryption key"| ASM
    HELM_SEC -->|"Uses"| SOPS_TOOL
    SEALED -->|"Creates"| K8S_SEC
    ESO -->|"Creates"| K8S_SEC

    style VAULT fill:#000,color:#fff
    style ASM fill:#ff9900,color:#000
    style SEALED fill:#326ce5,color:#fff
    style ESO fill:#2ecc71,color:#fff
    style SOPS_TOOL fill:#e74c3c,color:#fff
```

---

## 🔍 Deep dive into each

### 1. HashiCorp Vault — King of secrets management

Vault is a **Swiss Army knife for secrets management**. From simple key-value storage to dynamic secret generation, PKI certificate issuance, and encryption services — it can do almost anything related to secrets.

#### 1-1. Vault architecture

```mermaid
flowchart TB
    CLIENT["Client<br/>(App, CI/CD, Admin)"]

    subgraph VAULT["HashiCorp Vault"]
        API["API Server<br/>(HTTPS :8200)"]

        subgraph AUTH["🔐 Auth Methods"]
            TOKEN["Token"]
            K8S_AUTH["Kubernetes"]
            AWS_AUTH["AWS IAM"]
            OIDC["OIDC / JWT"]
            LDAP["LDAP / AD"]
            APPROLE["AppRole"]
        end

        subgraph ENGINES["⚙️ Secret Engines"]
            KV["KV v2<br/>(Key-Value)"]
            DB["Database<br/>(Dynamic)"]
            PKI["PKI<br/>(Certificates)"]
            TRANSIT["Transit<br/>(EaaS)"]
            AWS_ENG["AWS<br/>(Dynamic IAM)"]
            SSH_ENG["SSH<br/>(CA Signing)"]
        end

        subgraph CORE["🏗️ Core"]
            POLICY["Policies<br/>(HCL)"]
            AUDIT["Audit Log"]
            SEAL["Seal/Unseal<br/>(Master Key)"]
        end

        subgraph STORAGE["💾 Storage Backend"]
            RAFT["Raft (built-in)"]
            CONSUL["Consul"]
            S3_STORE["S3 / DynamoDB"]
        end
    end

    CLIENT -->|"1. Authenticate"| AUTH
    AUTH -->|"2. Issue token"| API
    API -->|"3. Check policy"| POLICY
    API -->|"4. Access secret"| ENGINES
    ENGINES -->|"Store/Retrieve"| STORAGE
    API -->|"Log"| AUDIT

    style VAULT fill:#000,color:#fff
    style AUTH fill:#1a1a2e,color:#fff
    style ENGINES fill:#16213e,color:#fff
    style CORE fill:#0f3460,color:#fff
```

#### 1-2. Vault core concepts

**Seal/Unseal**

When Vault starts, it's in **Sealed state**. Like a locked safe. You need to combine Unseal Keys (usually split via Shamir's Secret Sharing) to open it.

```bash
# Vault initialization — create 5 Unseal Keys, 3 needed to unseal
vault operator init -key-shares=5 -key-threshold=3

# Unseal (3 admins each enter their key)
vault operator unseal <key-1>   # Admin A
vault operator unseal <key-2>   # Admin B
vault operator unseal <key-3>   # Admin C → Unsealed!

# Auto-unseal (recommended for production — using KMS)
# vault.hcl config:
seal "awskms" {
  region     = "ap-northeast-2"
  kms_key_id = "alias/vault-unseal-key"
}
```

**Auth Methods**

Ways to verify "who are you?" Choose the appropriate method for your environment.

```bash
# Kubernetes auth — Pod automatically authenticates to Vault
vault auth enable kubernetes
vault write auth/kubernetes/config \
    kubernetes_host="https://kubernetes.default.svc:443"

# AWS IAM auth — EC2/Lambda authenticate with IAM Role
vault auth enable aws
vault write auth/aws/role/my-role \
    auth_type=iam \
    bound_iam_principal_arn="arn:aws:iam::123456789012:role/my-app-role" \
    policies=my-app-policy \
    ttl=1h

# AppRole auth — for CI/CD pipelines
vault auth enable approle
vault write auth/approle/role/ci-role \
    token_ttl=20m \
    token_max_ttl=30m \
    token_policies=ci-policy
```

**Policies**

HCL rules defining "what can be done?"

```hcl
# my-app-policy.hcl
# Can only read own app secrets (least privilege)
path "secret/data/myapp/*" {
  capabilities = ["read", "list"]
}

# Can create DB dynamic credentials
path "database/creds/myapp-role" {
  capabilities = ["read"]
}

# Can encrypt/decrypt with Transit
path "transit/encrypt/myapp-key" {
  capabilities = ["update"]
}

path "transit/decrypt/myapp-key" {
  capabilities = ["update"]
}

# Cannot access admin secrets
path "secret/data/admin/*" {
  capabilities = ["deny"]
}
```

```bash
# Apply policy
vault policy write my-app-policy my-app-policy.hcl
```

#### 1-3. Secret Engines

**KV v2 (Key-Value) — Static secrets**

The most basic secret storage. Use v2 which supports versioning.

```bash
# Enable secrets engine
vault secrets enable -path=secret kv-v2

# Store secret
vault kv put secret/myapp/config \
    db_host="db.example.com" \
    db_user="myapp" \
    db_password="s3cur3P@ss!"

# Read secret
vault kv get secret/myapp/config
vault kv get -field=db_password secret/myapp/config

# Version management
vault kv get -version=1 secret/myapp/config     # Get previous version
vault kv rollback -version=1 secret/myapp/config # Rollback
vault kv delete -versions=2 secret/myapp/config  # Delete specific version
```

**Database — Dynamic Secrets (Most powerful feature!)**

Generates **temporary DB accounts** on request, auto-deletes after TTL. Even if credentials leak, the account is already revoked.

```bash
# Enable database engine
vault secrets enable database

# Configure PostgreSQL connection
vault write database/config/mydb \
    plugin_name=postgresql-database-plugin \
    allowed_roles="myapp-role" \
    connection_url="postgresql://{{username}}:{{password}}@db.example.com:5432/mydb?sslmode=require" \
    username="vault-admin" \
    password="vault-admin-password"

# Define role — what permissions for generated accounts
vault write database/roles/myapp-role \
    db_name=mydb \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' \
        VALID UNTIL '{{expiration}}'; \
        GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    revocation_statements="DROP ROLE IF EXISTS \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="24h"

# Request dynamic credentials — different account generated each time!
vault read database/creds/myapp-role
# Key                Value
# ---                -----
# lease_id           database/creds/myapp-role/abcd1234
# lease_duration     1h
# username           v-approle-myapp-r-abc123XYZ
# password           B4s&kL9-mN2pQ...

# Auto-deleted after 1 hour! Or manually revoke:
vault lease revoke database/creds/myapp-role/abcd1234
```

**Transit — Encryption as a Service (EaaS)**

Apps request Vault to "encrypt this data" instead of managing keys directly.

```bash
# Enable transit engine + create key
vault secrets enable transit
vault write -f transit/keys/myapp-key

# Encrypt (base64 encoding required)
vault write transit/encrypt/myapp-key \
    plaintext=$(echo "SSN: 901225-1234567" | base64)
# ciphertext: vault:v1:abc123...encrypted...

# Decrypt
vault write transit/decrypt/myapp-key \
    ciphertext="vault:v1:abc123..."
# plaintext: <base64-encoded original> → base64 decode for original

# Key rotation (previous version can still decrypt)
vault write -f transit/keys/myapp-key/rotate
```

**PKI — Automatic certificate issuance**

```bash
# Enable PKI engine
vault secrets enable pki
vault secrets tune -max-lease-ttl=87600h pki

# Generate Root CA
vault write pki/root/generate/internal \
    common_name="MyCompany Root CA" \
    ttl=87600h

# Set up intermediate CA + create role
vault secrets enable -path=pki_int pki
vault write pki_int/roles/my-domain \
    allowed_domains="example.com" \
    allow_subdomains=true \
    max_ttl="720h"

# Issue certificate (automated!)
vault write pki_int/issue/my-domain \
    common_name="api.example.com" \
    ttl="24h"
```

#### 1-4. Vault Agent — Auto-inject secrets into apps

Inject secrets into apps without requiring direct Vault API calls, using **Sidecar/Init Container** pattern.

```hcl
# vault-agent-config.hcl
auto_auth {
  method "kubernetes" {
    mount_path = "auth/kubernetes"
    config = {
      role = "myapp"
    }
  }

  sink "file" {
    config = {
      path = "/home/vault/.vault-token"
    }
  }
}

template {
  source      = "/etc/vault/templates/config.tpl"
  destination = "/etc/app/config.yaml"
}
```

```
# /etc/vault/templates/config.tpl
database:
  host: {{ with secret "secret/data/myapp/config" }}{{ .Data.data.db_host }}{{ end }}
  username: {{ with secret "database/creds/myapp-role" }}{{ .Data.username }}{{ end }}
  password: {{ with secret "database/creds/myapp-role" }}{{ .Data.password }}{{ end }}
```

---

### 2. AWS Secrets Manager & Parameter Store

We covered the basics in [AWS Security Services](../05-cloud-aws/12-security). Here we focus on production patterns.

#### 2-1. Secrets Manager — Fully managed secret storage

```bash
# Create secret
aws secretsmanager create-secret \
    --name "myapp/production/db" \
    --description "Production DB credentials" \
    --secret-string '{"username":"admin","password":"s3cur3P@ss!","host":"db.example.com","port":"5432"}'

# Retrieve secret
aws secretsmanager get-secret-value \
    --secret-id "myapp/production/db" \
    --query 'SecretString' --output text | jq .

# Update secret
aws secretsmanager update-secret \
    --secret-id "myapp/production/db" \
    --secret-string '{"username":"admin","password":"n3wP@ss!","host":"db.example.com","port":"5432"}'
```

**Configure auto-rotation (Lambda-based)**

```python
# rotation_lambda.py — Auto rotate RDS password
import boto3
import json

def lambda_handler(event, context):
    secret_id = event['SecretId']
    step = event['Step']
    token = event['ClientRequestToken']

    sm = boto3.client('secretsmanager')

    if step == "createSecret":
        # Generate new password
        new_password = sm.get_random_password(
            PasswordLength=32,
            ExcludeCharacters='/@"\\',
        )['RandomPassword']

        current = json.loads(
            sm.get_secret_value(SecretId=secret_id)['SecretString']
        )
        current['password'] = new_password

        sm.put_secret_value(
            SecretId=secret_id,
            ClientRequestToken=token,
            SecretString=json.dumps(current),
            VersionStages=['AWSPENDING']
        )

    elif step == "setSecret":
        # Apply new password to DB
        pending = json.loads(
            sm.get_secret_value(
                SecretId=secret_id, VersionStage='AWSPENDING'
            )['SecretString']
        )
        # Change DB password via RDS API or direct SQL
        change_db_password(pending)

    elif step == "testSecret":
        # Test connection with new password
        pending = json.loads(
            sm.get_secret_value(
                SecretId=secret_id, VersionStage='AWSPENDING'
            )['SecretString']
        )
        test_db_connection(pending)

    elif step == "finishSecret":
        # Swap version stages: AWSPENDING → AWSCURRENT
        sm.update_secret_version_stage(
            SecretId=secret_id,
            VersionStage='AWSCURRENT',
            MoveToVersionId=token,
            RemoveFromVersionId=get_current_version(sm, secret_id)
        )
```

```bash
# Enable auto-rotation (every 30 days)
aws secretsmanager rotate-secret \
    --secret-id "myapp/production/db" \
    --rotation-lambda-arn "arn:aws:lambda:ap-northeast-2:123456789012:function:db-rotation" \
    --rotation-rules '{"AutomaticallyAfterDays": 30}'
```

#### 2-2. Parameter Store vs Secrets Manager comparison

| Feature | Parameter Store | Secrets Manager |
|------|----------------|-----------------|
| **Price** | Standard free, Advanced $0.05/param/month | $0.40/secret/month + API calls |
| **Auto rotation** | None (manual implementation) | Lambda-based built-in |
| **Version management** | Supported by default | Supported by default |
| **Encryption** | KMS (SecureString) | KMS (automatic) |
| **Size limit** | 4KB (Standard), 8KB (Advanced) | 64KB |
| **Hierarchy** | Supports `/app/env/key` | Name-based (similar) |
| **Cross-account** | Shared via RAM | Resource policy |
| **Recommended use** | Config values + simple secrets | DB passwords + auto-rotation needed |

```bash
# Parameter Store usage
# Regular config (String)
aws ssm put-parameter \
    --name "/myapp/production/api_endpoint" \
    --type "String" \
    --value "https://api.example.com"

# Secret (SecureString — KMS encrypted)
aws ssm put-parameter \
    --name "/myapp/production/api_key" \
    --type "SecureString" \
    --value "sk-abc123..." \
    --key-id "alias/myapp-key"

# Hierarchical retrieval (get all config at once)
aws ssm get-parameters-by-path \
    --path "/myapp/production/" \
    --with-decryption \
    --recursive
```

---

### 3. SOPS — GitOps-friendly secrets encryption

**SOPS (Secrets OPerationS)** encrypts only **values**, leaving keys in plaintext. This makes Git diffs meaningful and code reviews possible.

#### 3-1. How SOPS works

```yaml
# Original file (secrets.yaml)
database:
  host: db.example.com
  username: admin
  password: super_secret_123
api:
  key: sk-abc123def456

# After SOPS encryption (secrets.enc.yaml)
database:
  host: ENC[AES256_GCM,data:abc123...,iv:xyz...,tag:...,type:str]
  username: ENC[AES256_GCM,data:def456...,iv:...,tag:...,type:str]
  password: ENC[AES256_GCM,data:ghi789...,iv:...,tag:...,type:str]
api:
  key: ENC[AES256_GCM,data:jkl012...,iv:...,tag:...,type:str]
sops:
  kms:
    - arn: arn:aws:kms:ap-northeast-2:123456789012:key/abc-123
  age:
    - recipient: age1abc123...
  lastmodified: "2026-03-13T12:00:00Z"
  version: 3.9.0
```

Key names (`database.host`, `api.key`) are visible but values are encrypted!

#### 3-2. SOPS hands-on

```bash
# Install
brew install sops age   # macOS
# choco install sops age  # Windows

# Generate age key (personal encryption key)
age-keygen -o ~/.sops/key.txt
# Public key: age1abc123...
# Register this Public key in .sops.yaml

# .sops.yaml (project root — defines encryption rules)
creation_rules:
  # production folder → encrypt with AWS KMS
  - path_regex: environments/production/.*\.yaml$
    kms: "arn:aws:kms:ap-northeast-2:123456789012:key/abc-123"

  # staging folder → encrypt with age
  - path_regex: environments/staging/.*\.yaml$
    age: "age1abc123...,age1def456..."

  # Default rule
  - age: "age1abc123..."
```

```bash
# Encrypt
sops -e secrets.yaml > secrets.enc.yaml    # Output to new file
sops -e -i secrets.yaml                     # Encrypt in-place

# Decrypt
sops -d secrets.enc.yaml                    # Output to stdout
sops -d -i secrets.enc.yaml                 # Decrypt in-place

# Edit (decrypt → editor → re-encrypt on save)
sops secrets.enc.yaml                       # Opens in $EDITOR

# Extract specific key
sops -d --extract '["database"]["password"]' secrets.enc.yaml

# Key rotation (change encryption key)
sops -r secrets.enc.yaml
```

#### 3-3. SOPS + Kustomize/Helm integration

```bash
# Kustomize + SOPS (ksops plugin)
# kustomization.yaml
generators:
  - secret-generator.yaml

# secret-generator.yaml
apiVersion: viaduct.ai/v1
kind: ksops
metadata:
  name: my-secrets
files:
  - secrets.enc.yaml
```

```yaml
# Helm + helm-secrets plugin
# helm secrets install myapp ./chart -f values.yaml -f secrets.enc.yaml
# → auto-decrypt secrets.enc.yaml and pass to Helm

# secrets.enc.yaml (SOPS encrypted)
db:
  password: ENC[AES256_GCM,data:abc...,type:str]
redis:
  password: ENC[AES256_GCM,data:def...,type:str]
```

---

### 4. Kubernetes Secrets and alternatives

#### 4-1. Problems with K8s Secrets

K8s built-in Secrets are **not a security tool**. Base64 encoding is not encryption!

```yaml
# Create K8s Secret
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secret
type: Opaque
data:
  # Base64 encoded only! Anyone can decode
  db-password: c3VwZXJfc2VjcmV0XzEyMw==  # echo -n "super_secret_123" | base64
```

```bash
# Anyone can decrypt — this is NOT encryption!
echo "c3VwZXJfc2VjcmV0XzEyMw==" | base64 -d
# Output: super_secret_123
```

**Specific K8s Secrets limitations:**

| Problem | Explanation |
|------|------|
| **Base64 ≠ Encryption** | Only encoding, anyone can decode |
| **etcd plaintext storage** | Stored in plaintext by default in etcd |
| **Can't commit to Git** | Base64 doesn't fit GitOps |
| **No rotation** | Manual Secret update required |
| **RBAC only** | Secret access control depends only on RBAC |
| **Audit lack** | Hard to track who accessed Secret when |

```bash
# Enable etcd encryption (minimum security)
# /etc/kubernetes/encryption-config.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
      - secrets
    providers:
      - aescbc:
          keys:
            - name: key1
              secret: <base64-encoded-32-byte-key>
      - identity: {}
```

#### 4-2. Sealed Secrets (Bitnami) — GitOps savior

Sealed Secrets encrypts secrets with **cluster's public key** so they're safe to commit to Git. Only the cluster can decrypt them.

```mermaid
sequenceDiagram
    participant DEV as Developer
    participant KUBESEAL as kubeseal CLI
    participant GIT as Git Repository
    participant CTRL as Sealed Secrets<br/>Controller
    participant K8S as K8s API Server
    participant POD as Application Pod

    DEV->>KUBESEAL: 1. Pass original Secret
    Note over KUBESEAL: Encrypt with<br/>cluster public key
    KUBESEAL->>DEV: 2. Return SealedSecret YAML
    DEV->>GIT: 3. Commit SealedSecret (safe!)
    GIT->>CTRL: 4. GitOps sync (ArgoCD etc.)
    Note over CTRL: Decrypt with<br/>cluster private key
    CTRL->>K8S: 5. Create K8s Secret
    K8S->>POD: 6. Mount/inject Secret
```

```bash
# Install
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm install sealed-secrets sealed-secrets/sealed-secrets \
    --namespace kube-system

# Install kubeseal CLI
brew install kubeseal   # macOS

# 1. Create regular Secret (don't commit this to Git!)
kubectl create secret generic myapp-secret \
    --from-literal=db-password=super_secret_123 \
    --dry-run=client -o yaml > secret.yaml

# 2. Convert to SealedSecret (safe to commit to Git!)
kubeseal --format yaml < secret.yaml > sealed-secret.yaml

# 3. Commit to Git
git add sealed-secret.yaml
git commit -m "Add encrypted myapp-secret"
```

```yaml
# sealed-secret.yaml (safe to commit to Git!)
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: myapp-secret
  namespace: default
spec:
  encryptedData:
    db-password: AgBy3i4OJSWK+PiTySYZZA9rO...very-long-encrypted-string...
  template:
    metadata:
      name: myapp-secret
      namespace: default
    type: Opaque
```

```bash
# Sealed Secrets scope options
# strict (default) — decrypt only with same name + same namespace
kubeseal --scope strict

# namespace-wide — decrypt with any name in same namespace
kubeseal --scope namespace-wide

# cluster-wide — decrypt anywhere in cluster
kubeseal --scope cluster-wide

# Key backup (CRITICAL! — lose key, lose all SealedSecrets)
kubectl get secret -n kube-system \
    -l sealedsecrets.bitnami.com/sealed-secrets-key \
    -o yaml > sealed-secrets-master-key-backup.yaml
# Keep this backup file in very safe place!
```

#### 4-3. External Secrets Operator (ESO) — Sync external secrets

ESO **fetches secrets from external stores (Vault, AWS Secrets Manager, etc.)** and auto-creates/syncs K8s Secrets.

```mermaid
flowchart LR
    subgraph EXTERNAL["External Secret Storage"]
        VAULT_EXT["HashiCorp Vault"]
        ASM_EXT["AWS Secrets Manager"]
        GCP_EXT["GCP Secret Manager"]
        AKV_EXT["Azure Key Vault"]
    end

    subgraph K8S_CLUSTER["Kubernetes Cluster"]
        ESO_OP["External Secrets<br/>Operator"]
        SS["SecretStore /<br/>ClusterSecretStore"]
        ES["ExternalSecret<br/>(Manifest)"]
        K8S_SECRET["K8s Secret<br/>(Auto-created)"]
        APP_POD["App Pod"]
    end

    ES -->|"Reference"| SS
    SS -->|"Auth info"| ESO_OP
    ESO_OP -->|"Fetch secret"| EXTERNAL
    ESO_OP -->|"Create/Sync"| K8S_SECRET
    K8S_SECRET -->|"Mount/Env var"| APP_POD

    style ESO_OP fill:#2ecc71,color:#fff
    style VAULT_EXT fill:#000,color:#fff
    style ASM_EXT fill:#ff9900,color:#000
```

```bash
# Install ESO
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
    --namespace external-secrets --create-namespace
```

```yaml
# 1. ClusterSecretStore — Connect to AWS Secrets Manager
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: aws-secrets-manager
spec:
  provider:
    aws:
      service: SecretsManager
      region: ap-northeast-2
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
            namespace: external-secrets

---
# 2. ExternalSecret — Define which secrets to fetch
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: myapp-db-secret
  namespace: default
spec:
  refreshInterval: 1h    # Sync every 1 hour (respond to rotation)
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore

  target:
    name: myapp-db-secret            # Name of K8s Secret to create
    creationPolicy: Owner            # Delete Secret if ExternalSecret deleted

  data:
    - secretKey: username             # K8s Secret key
      remoteRef:
        key: myapp/production/db      # AWS Secrets Manager secret name
        property: username            # JSON key

    - secretKey: password
      remoteRef:
        key: myapp/production/db
        property: password

    - secretKey: host
      remoteRef:
        key: myapp/production/db
        property: host
```

```yaml
# Using Vault as backend
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: vault-backend
spec:
  provider:
    vault:
      server: "https://vault.example.com:8200"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "external-secrets"
          serviceAccountRef:
            name: external-secrets-sa
            namespace: external-secrets

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: myapp-vault-secret
spec:
  refreshInterval: 15m
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: myapp-config
  dataFrom:
    - extract:
        key: secret/data/myapp/config   # Fetch all key-values from Vault path
```

```yaml
# 3. Use in app — like regular K8s Secret
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
        - name: myapp
          image: myapp:latest
          env:
            - name: DB_HOST
              valueFrom:
                secretKeyRef:
                  name: myapp-db-secret
                  key: host
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: myapp-db-secret
                  key: username
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: myapp-db-secret
                  key: password
```

---

### 5. Secrets rotation strategy

Secrets aren't set once and used forever. They must be **periodically rotated (replaced)**.

#### 5-1. Why rotation is needed

```
Employee quits → Passwords they knew still work
Secret breach → Without rotation, forever exposed
Compliance → PCI-DSS, SOC2 require periodic rotation
Blast radius → Limited exposure window if leaked
```

#### 5-2. Rotation strategy comparison

| Strategy | Description | Pros | Cons |
|------|------|------|------|
| **Manual rotation** | People manually change passwords | Simple | Slow, error-prone, not scalable |
| **Time-based auto** | Auto rotate every 30/60/90 days | Predictable, automated | Same secret used until right before rotation |
| **Dynamic Secrets** | Generate on request, revoke after TTL | Most secure, minimal exposure | Requires Vault, higher complexity |
| **Event-based** | Rotate immediately on breach detection | Quick response | Requires detection system |

#### 5-3. Zero-downtime rotation pattern

When changing DB password, prevent service downtime using **Dual Credentials** pattern.

```
Step 1: Current state
  App → [user_A / password_old] → DB ✅

Step 2: Create new password (both valid on DB)
  App → [user_A / password_old] → DB ✅
         [user_A / password_new] → DB ✅ (not used yet)

Step 3: Deliver new password to app (gradual rollout)
  App(old) → [user_A / password_old] → DB ✅
  App(new) → [user_A / password_new] → DB ✅

Step 4: Verify all apps use new password, revoke old one
  App → [user_A / password_new] → DB ✅
         [user_A / password_old] → DB ❌ (revoked)
```

```python
# AWS Secrets Manager multi-user rotation pattern
# Alternate between user_A and user_B

# Current active: user_A (AWSCURRENT)
# Next rotation: Change user_B password → Promote user_B to AWSCURRENT
# Next rotation: Change user_A password → Promote user_A to AWSCURRENT
# Alternating A ↔ B enables zero-downtime rotation!
```

#### 5-4. Rotation guide by secret type

| Secret Type | Recommended Period | Rotation Method | Automation Tool |
|-----------|----------|-------------|------------|
| **DB passwords** | 30~90 days | Dual credentials pattern | Vault Dynamic / ASM rotation |
| **API Keys** | 90 days | Issue new key → revoke old | Service provider API |
| **TLS certificates** | 60~90 days (Let's Encrypt auto) | Auto renewal | cert-manager / ACM |
| **SSH Keys** | 90~180 days | CA-based short-lived certs | Vault SSH CA |
| **OAuth Tokens** | Access: 1hr, Refresh: 30d | Auto refresh logic | App internal implementation |
| **KMS keys** | 365 days | Auto key rotation | AWS KMS / Vault Transit |

---

## 💻 Hands-on

### Practice 1: Vault dynamic DB secrets management

```bash
# ============================================
# Vault + PostgreSQL Dynamic Secrets hands-on
# ============================================

# 1. Start Vault server (dev mode)
vault server -dev -dev-root-token-id="root"
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='root'

# 2. Start PostgreSQL (Docker)
docker run -d --name postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=myapp \
    -p 5432:5432 postgres:16

# 3. Enable database secret engine
vault secrets enable database

# 4. Configure PostgreSQL connection
vault write database/config/myapp-db \
    plugin_name=postgresql-database-plugin \
    allowed_roles="readonly,readwrite" \
    connection_url="postgresql://{{username}}:{{password}}@host.docker.internal:5432/myapp?sslmode=disable" \
    username="postgres" \
    password="postgres"

# 5. Create read-only role
vault write database/roles/readonly \
    db_name=myapp-db \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="4h"

# 6. Create read-write role
vault write database/roles/readwrite \
    db_name=myapp-db \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="30m" \
    max_ttl="2h"

# 7. Request dynamic credentials!
echo "=== Read-only credentials ==="
vault read database/creds/readonly

echo "=== Read-write credentials ==="
vault read database/creds/readwrite

# 8. Test DB connection with generated credentials
# (Use username/password from above)
psql -h localhost -U v-root-readonly-abc123 -d myapp

# 9. Check TTL and renew
vault lease lookup <lease-id>
vault lease renew <lease-id>

# 10. Manual revocation (emergency)
vault lease revoke <lease-id>
vault lease revoke -prefix database/creds/readonly  # Revoke all role credentials!
```

### Practice 2: Store secrets safely in Git with SOPS

```bash
# ============================================
# SOPS + age encryption hands-on
# ============================================

# 1. Generate age key
mkdir -p ~/.sops
age-keygen -o ~/.sops/key.txt
# Public key: age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p

export SOPS_AGE_KEY_FILE=~/.sops/key.txt

# 2. Project setup
mkdir -p myapp/environments/{production,staging}
cd myapp

# 3. Create .sops.yaml (encryption rules)
cat > .sops.yaml << 'EOF'
creation_rules:
  - path_regex: environments/production/.*\.yaml$
    age: "age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p"

  - path_regex: environments/staging/.*\.yaml$
    age: "age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p"
EOF

# 4. Create + encrypt secrets file
cat > environments/production/secrets.yaml << 'EOF'
database:
  host: prod-db.example.com
  username: prod_admin
  password: Pr0d_S3cur3_P@ss!
  port: 5432
redis:
  host: prod-redis.example.com
  password: R3d1s_Pr0d_P@ss!
api:
  stripe_key: sk_live_abc123def456
  sendgrid_key: SG.xyz789
EOF

sops -e -i environments/production/secrets.yaml

# 5. Commit to Git (encrypted, safe!)
git add .
git commit -m "Add encrypted production secrets"

# 6. When team member needs to edit
sops environments/production/secrets.yaml
# Editor opens with decrypted values → save auto-re-encrypts

# 7. Decrypt in CI/CD
sops -d environments/production/secrets.yaml
# → Use decrypted values as env vars or config
```

### Practice 3: Configure External Secrets Operator

```bash
# ============================================
# ESO + AWS Secrets Manager hands-on
# ============================================

# 1. Pre-work: Create secrets in AWS
aws secretsmanager create-secret \
    --name "myapp/prod/db-creds" \
    --secret-string '{"username":"admin","password":"s3cur3!","host":"db.prod.internal"}'

aws secretsmanager create-secret \
    --name "myapp/prod/api-keys" \
    --secret-string '{"stripe":"sk_live_abc","sendgrid":"SG.xyz"}'

# 2. Install ESO
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
    -n external-secrets --create-namespace \
    --set installCRDs=true

# 3. Setup IRSA (IAM Roles for Service Accounts)
eksctl create iamserviceaccount \
    --name external-secrets-sa \
    --namespace external-secrets \
    --cluster my-cluster \
    --attach-policy-arn arn:aws:iam::123456789012:policy/ExternalSecretsPolicy \
    --approve
```

```yaml
# 4. Create ClusterSecretStore
# cluster-secret-store.yaml
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: aws-sm
spec:
  provider:
    aws:
      service: SecretsManager
      region: ap-northeast-2
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
            namespace: external-secrets
---
# 5. Create ExternalSecret
# external-secret-db.yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: myapp-db
  namespace: myapp
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-sm
    kind: ClusterSecretStore
  target:
    name: myapp-db-creds
  data:
    - secretKey: DB_HOST
      remoteRef:
        key: myapp/prod/db-creds
        property: host
    - secretKey: DB_USER
      remoteRef:
        key: myapp/prod/db-creds
        property: username
    - secretKey: DB_PASSWORD
      remoteRef:
        key: myapp/prod/db-creds
        property: password
---
# external-secret-api.yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: myapp-api-keys
  namespace: myapp
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-sm
    kind: ClusterSecretStore
  target:
    name: myapp-api-keys
  dataFrom:
    - extract:
        key: myapp/prod/api-keys
```

```bash
# 6. Apply and verify
kubectl apply -f cluster-secret-store.yaml
kubectl apply -f external-secret-db.yaml

# Check sync status
kubectl get externalsecret -n myapp
# NAME       STORE   REFRESH   STATUS
# myapp-db   aws-sm  1h        SecretSynced

# Verify created K8s Secret
kubectl get secret myapp-db-creds -n myapp -o yaml

# 7. Use in Deployment
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: myapp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myapp
          image: myapp:latest
          envFrom:
            - secretRef:
                name: myapp-db-creds
            - secretRef:
                name: myapp-api-keys
EOF
```

### Practice 4: Sealed Secrets with GitOps

```bash
# ============================================
# Sealed Secrets + ArgoCD GitOps hands-on
# ============================================

# 1. Install Sealed Secrets controller
helm install sealed-secrets sealed-secrets/sealed-secrets \
    -n kube-system \
    --set-string fullnameOverride=sealed-secrets-controller

# 2. Install kubeseal CLI and test
kubeseal --version

# 3. Create + seal secret
kubectl create secret generic myapp-secret \
    --namespace=myapp \
    --from-literal=DB_PASSWORD='s3cur3P@ss!' \
    --from-literal=API_KEY='sk-abc123' \
    --dry-run=client -o yaml | \
    kubeseal --format yaml > sealed-myapp-secret.yaml

# 4. Git repository structure
# gitops-repo/
# ├── apps/
# │   └── myapp/
# │       ├── deployment.yaml
# │       ├── service.yaml
# │       └── sealed-myapp-secret.yaml   ← Only this to Git!
# └── infrastructure/
#     └── sealed-secrets/
#         └── helm-release.yaml

# 5. ArgoCD automatically converts SealedSecret → Secret
git add sealed-myapp-secret.yaml
git commit -m "Add sealed secret for myapp"
git push

# ArgoCD syncs and:
# SealedSecret → (controller decrypts) → K8s Secret → injected into Pod
```

---

## 🏢 In production

### Secrets management architecture by environment

```mermaid
flowchart TB
    subgraph DEV["Development Environment"]
        DEV_SOPS["SOPS + age<br/>(Personal key)"]
        DEV_ENV[".env.local<br/>(Git excluded)"]
    end

    subgraph STG["Staging Environment"]
        STG_ASM["AWS Secrets Manager<br/>/ Parameter Store"]
        STG_ESO["ESO sync<br/>(5min interval)"]
    end

    subgraph PROD["Production Environment"]
        PROD_VAULT["HashiCorp Vault<br/>(HA cluster)"]
        PROD_DYN["Dynamic Secrets<br/>(TTL: 1 hour)"]
        PROD_ROT["Auto rotation<br/>(30 days)"]
        PROD_AUDIT["Audit logs<br/>(All access)"]
    end

    subgraph CICD["CI/CD Pipeline"]
        GH_SEC["GitHub Secrets<br/>(OIDC auth)"]
        PIPE_VAULT["Vault AppRole<br/>(Short-lived token)"]
    end

    DEV_SOPS -->|"Deploy"| STG_ASM
    STG_ASM -->|"Promote"| PROD_VAULT
    GH_SEC --> PIPE_VAULT
    PIPE_VAULT --> PROD_VAULT

    style PROD fill:#e74c3c,color:#fff
    style PROD_VAULT fill:#000,color:#fff
    style DEV fill:#2ecc71,color:#fff
    style STG fill:#f39c12,color:#fff
```

### Tool selection by production scenario

| Scenario | Recommended Combo | Reason |
|---------|----------|------|
| **Startup (5 people)** | SOPS + AWS Parameter Store | Free, simple, quick start |
| **SMB (AWS all-in)** | AWS Secrets Manager + ESO | Fully managed, auto-rotation |
| **Multi-cloud** | Vault + ESO | Cloud-neutral, unified management |
| **GitOps (ArgoCD)** | Sealed Secrets or SOPS + ESO | Safe to commit to Git |
| **Finance/regulated** | Vault Enterprise + HSM | Strong audit, compliance |
| **CI/CD pipeline** | GitHub OIDC + Vault/ASM | Auth without long-lived tokens |

### Secrets management maturity model

```
Level 0: Chaos
  └─ Hardcoded in code, .env in Git, passwords shared on Slack

Level 1: Basic
  └─ Environment variables, .gitignore on .env, manual management

Level 2: Centralized
  └─ Secrets Manager/Parameter Store, inject in CI/CD

Level 3: Automated
  └─ Auto rotation, ESO K8s sync, SOPS GitOps

Level 4: Dynamic
  └─ Vault Dynamic Secrets, OIDC auth, short-lived tokens

Level 5: Zero Trust
  └─ mTLS-based, Workload Identity, real-time audit, anomaly detection
```

### Terraform for secrets infrastructure

```hcl
# secrets-infrastructure.tf

# AWS Secrets Manager secret
resource "aws_secretsmanager_secret" "db_creds" {
  name                    = "myapp/production/db"
  description             = "Production database credentials"
  recovery_window_in_days = 7

  tags = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

resource "aws_secretsmanager_secret_rotation" "db_rotation" {
  secret_id           = aws_secretsmanager_secret.db_creds.id
  rotation_lambda_arn = aws_lambda_function.rotation.arn

  rotation_rules {
    automatically_after_days = 30
  }
}

# Parameter Store config
resource "aws_ssm_parameter" "api_endpoint" {
  name  = "/myapp/production/api_endpoint"
  type  = "String"
  value = "https://api.example.com"
}

resource "aws_ssm_parameter" "api_key" {
  name   = "/myapp/production/api_key"
  type   = "SecureString"
  value  = "initial-value"  # Initial value, update manually/auto after
  key_id = aws_kms_key.myapp.arn

  lifecycle {
    ignore_changes = [value]  # Prevent Terraform from overwriting!
  }
}

# KMS key
resource "aws_kms_key" "myapp" {
  description             = "KMS key for myapp secrets"
  deletion_window_in_days = 30
  enable_key_rotation     = true  # Auto key rotation!

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSecretsManagerAccess"
        Effect = "Allow"
        Principal = {
          Service = "secretsmanager.amazonaws.com"
        }
        Action   = ["kms:Decrypt", "kms:GenerateDataKey"]
        Resource = "*"
      }
    ]
  })
}

# IAM policy for ESO
resource "aws_iam_policy" "eso_policy" {
  name = "ExternalSecretsPolicy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:secretsmanager:ap-northeast-2:*:secret:myapp/*",
          "arn:aws:ssm:ap-northeast-2:*:parameter/myapp/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["kms:Decrypt"]
        Resource = [aws_kms_key.myapp.arn]
      }
    ]
  })
}
```

### Using secrets in applications

```python
# Python app — multiple ways to get secrets

# Method 1: Environment variables (simplest, 12-Factor App)
import os

DB_HOST = os.environ["DB_HOST"]
DB_PASSWORD = os.environ["DB_PASSWORD"]

# Method 2: AWS Secrets Manager SDK
import boto3
import json

def get_secret(secret_name):
    client = boto3.client("secretsmanager", region_name="ap-northeast-2")
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response["SecretString"])

db_creds = get_secret("myapp/production/db")
db_host = db_creds["host"]
db_password = db_creds["password"]

# Method 3: Vault hvac client
import hvac

client = hvac.Client(url="https://vault.example.com:8200")
client.auth.kubernetes.login(role="myapp", jwt=open("/var/run/secrets/kubernetes.io/serviceaccount/token").read())

# Static secrets
secret = client.secrets.kv.v2.read_secret_version(path="myapp/config")
api_key = secret["data"]["data"]["api_key"]

# Dynamic DB credentials
db_creds = client.secrets.database.generate_credentials(name="myapp-role")
db_user = db_creds["data"]["username"]
db_pass = db_creds["data"]["password"]

# Method 4: File mount (Vault Agent / CSI Driver)
# Secrets mounted as files
with open("/etc/secrets/db-password") as f:
    db_password = f.read().strip()
```

```go
// Go app — get secrets

package main

import (
    "context"
    "encoding/json"
    "fmt"
    "os"

    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

func getSecret(secretName string) (map[string]string, error) {
    cfg, err := config.LoadDefaultConfig(context.TODO(),
        config.WithRegion("ap-northeast-2"),
    )
    if err != nil {
        return nil, err
    }

    client := secretsmanager.NewFromConfig(cfg)
    result, err := client.GetSecretValue(context.TODO(),
        &secretsmanager.GetSecretValueInput{
            SecretId: &secretName,
        },
    )
    if err != nil {
        return nil, err
    }

    var secret map[string]string
    json.Unmarshal([]byte(*result.SecretString), &secret)
    return secret, nil
}

func main() {
    // Env var first, then Secrets Manager
    dbPassword := os.Getenv("DB_PASSWORD")
    if dbPassword == "" {
        secret, _ := getSecret("myapp/production/db")
        dbPassword = secret["password"]
    }
    fmt.Println("Connected with managed secret")
}
```

---

## ⚠️ Common mistakes

### Mistake 1: Hardcoding secrets in code

```python
# ❌ Never do this
DB_PASSWORD = "super_secret_123"
AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE"
API_KEY = "sk-abc123def456ghi789"

# ✅ Use environment variables or secrets management
DB_PASSWORD = os.environ["DB_PASSWORD"]
```

**Prevention:** Automate secret scanning with pre-commit hook

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

### Mistake 2: Secrets left in Git history

```bash
# ❌ Deleting file doesn't remove from Git history!
git rm secrets.env
git commit -m "Remove secrets"
# → Still visible with git log -p!

# ✅ Completely remove from history (BFG Repo-Cleaner)
bfg --delete-files secrets.env
# or
git filter-repo --path secrets.env --invert-paths

# ✅ Root solution: Add to .gitignore from start
echo "*.env" >> .gitignore
echo "secrets.*" >> .gitignore
echo "!secrets.enc.*" >> .gitignore   # Allow SOPS encrypted files
```

### Mistake 3: Thinking K8s Secrets are safe

```yaml
# ❌ "Secrets are secure right?"
apiVersion: v1
kind: Secret
metadata:
  name: my-secret
data:
  password: cGFzc3dvcmQ=   # base64("password") — NOT encryption!

# ✅ Use Sealed Secrets or ESO
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: my-secret
spec:
  encryptedData:
    password: AgBy3i4OJSWK+PiTySYZZA9rO...  # Really encrypted!
```

### Mistake 4: Over-permissioned secret access

```hcl
# ❌ Access everything
path "secret/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# ✅ Least privilege
path "secret/data/myapp/*" {
  capabilities = ["read"]
}
```

### Mistake 5: Not rotating secrets

```bash
# ❌ "Using same password for 3 years"
# Risk: Employee quit, laptop lost, breach undetected

# ✅ Enable auto-rotation
aws secretsmanager rotate-secret \
    --secret-id "myapp/db" \
    --rotation-rules '{"AutomaticallyAfterDays": 30}'

# Or use Vault Dynamic Secrets (request-time generation, auto-expiry)
vault write database/roles/myapp-role default_ttl="1h" max_ttl="24h"
```

### Mistake 6: Secrets in logs

```python
# ❌ Secrets logged!
logger.info(f"Connecting to DB with password: {db_password}")
logger.debug(f"API response: {response.json()}")  # Token included?

# ✅ Mask secrets
logger.info("Connecting to DB with password: ****")
logger.info(f"DB connection established to {db_host}")

# ✅ Auto-mask sensitive patterns
import re

SENSITIVE_PATTERNS = [
    r'password["\s:=]+\S+',
    r'(sk|pk)[-_](live|test)[-_]\w+',
    r'AKIA[A-Z0-9]{16}',
]

def sanitize_log(message):
    for pattern in SENSITIVE_PATTERNS:
        message = re.sub(pattern, "****REDACTED****", message, flags=re.IGNORECASE)
    return message
```

### Mistake 7: No Sealed Secrets master key backup

```bash
# ❌ Cluster rebuilt, all SealedSecrets unreadable!

# ✅ Always backup!
kubectl get secret -n kube-system \
    -l sealedsecrets.bitnami.com/sealed-secrets-key \
    -o yaml > sealed-secrets-backup.yaml

# Store securely in AWS Secrets Manager
aws secretsmanager create-secret \
    --name "infra/sealed-secrets-backup" \
    --secret-string "$(cat sealed-secrets-backup.yaml)"
```

### Mistake checklist

```
□ Scanned for hardcoded secrets with gitleaks?
□ .gitignore includes .env, *.key, *.pem?
□ Using Sealed Secrets / ESO instead of K8s Secrets?
□ Secret rotation automated?
□ Least privilege applied to Vault/SM access?
□ Secrets not exposed in logs, errors, responses?
□ Sealed Secrets master key backed up?
□ Using OIDC instead of long-lived tokens in CI/CD?
□ Secret access audit logging enabled?
□ Incident response plan for secret breach?
```

---

## 📝 Summary

### Quick recap

```
Secrets Management's 4 Pillars:
━━━━━━━━━━━━━━━━━━

1. Store
   → Vault KV, AWS Secrets Manager, Parameter Store
   "Where to safely keep secrets?"

2. Deliver
   → ESO, Vault Agent, CSI Driver, environment variables
   "How to safely pass secrets to app?"

3. Rotate
   → Dynamic Secrets, auto-rotation, dual credentials
   "How often and how to replace secrets?"

4. Audit
   → Access logs, anomaly detection, compliance
   "Who accessed what secret when?"
```

### Tool selection decision tree

```
Choosing secrets management tool?
│
├─ Using Kubernetes?
│   ├─ YES → Using GitOps (ArgoCD/Flux)?
│   │   ├─ YES → Sealed Secrets (commit to Git) + ESO (sync external)
│   │   └─ NO → ESO alone sufficient
│   └─ NO → Serverless/EC2? Call AWS Secrets Manager directly
│
├─ Multi-cloud?
│   ├─ YES → HashiCorp Vault (cloud-neutral)
│   └─ NO → Use cloud provider's service (ASM, GCP SM, AKV)
│
├─ Need Dynamic Secrets? (DB access, etc.)
│   ├─ YES → HashiCorp Vault (only choice)
│   └─ NO → AWS Secrets Manager + auto-rotation sufficient
│
└─ Limited budget?
    ├─ YES → SOPS + Parameter Store (almost free)
    └─ NO → Vault + Secrets Manager + ESO (optimal combo)
```

### Interview prep: key questions

| Question | Core Answer |
|------|----------|
| K8s Secrets limitations? | Base64-encoded only, etcd plaintext, no rotation/audit |
| What's Vault Dynamic Secret? | Generate on request, auto-revoke after TTL. Exposure minimized |
| Sealed Secrets vs ESO? | Sealed: Git commit (one-way), ESO: sync external store (two-way) |
| SOPS advantages? | Encrypt values only → Git diff works, code review possible, GitOps-friendly |
| Rotation strategy? | Dynamic Secrets > auto time-based > event-based > manual |
| 12-Factor App + secrets? | Factor III: store in environment. No hardcoding, use env vars/tools |

---

## 🔗 Next steps

### Content connected to this lecture

| Topic | Link | Relationship |
|------|------|------|
| Identity & Access Management | [Identity & Access](./01-identity) | "Who" accesses → This lecture: "What" to protect |
| AWS Security Services | [KMS / Secrets Manager](../05-cloud-aws/12-security) | AWS secrets basics → Deep dive this lecture |
| Pipeline Security | [Pipeline Security](../07-cicd/12-pipeline-security) | Secrets patterns in CI/CD |
| K8s Config & Secrets | [ConfigMap & Secret](../04-kubernetes/04-config-secret) | K8s basics → Alternatives this lecture |

### Next topics

**[Container Security](./03-container-security)** covers:
- Container image vulnerability scanning (Trivy, Grype)
- Runtime security (Falco, Seccomp, AppArmor)
- Pod Security Standards (PSS/PSA)
- Image signing and verification (Cosign, Sigstore)
- Supply Chain Security (SLSA, SBOM)

Now that you've learned to manage secrets safely, learn to **secure containers themselves**!

### Additional resources

```
Official documentation:
  • HashiCorp Vault: https://developer.hashicorp.com/vault/docs
  • AWS Secrets Manager: https://docs.aws.amazon.com/secretsmanager/
  • External Secrets Operator: https://external-secrets.io/
  • Sealed Secrets: https://github.com/bitnami-labs/sealed-secrets
  • SOPS: https://github.com/getsops/sops

Hands-on:
  • Vault Learn: https://developer.hashicorp.com/vault/tutorials
  • AWS Workshop: https://catalog.workshops.aws/secrets-manager
  • KillerCoda Vault scenarios: https://killercoda.com/vault
```
