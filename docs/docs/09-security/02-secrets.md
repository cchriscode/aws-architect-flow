# 비밀 관리 (Secrets Management)

> [신원 및 접근 관리(Identity & Access)](./01-identity)에서 "누가 접근할 수 있는지"를 배웠다면, 이번에는 **"비밀 정보를 어떻게 안전하게 저장하고, 전달하고, 교체하는지"**를 배워볼게요. [AWS 보안 서비스](../05-cloud-aws/12-security)에서 다뤘던 KMS/Secrets Manager의 기초 위에, HashiCorp Vault부터 Kubernetes 환경의 Sealed Secrets, External Secrets Operator까지 — 실무에서 마주치는 비밀 관리의 모든 것을 다뤄볼게요. [파이프라인 보안](../07-cicd/12-pipeline-security)과 함께 보면 DevSecOps의 전체 그림이 완성돼요.

---

## 🎯 왜 비밀 관리를 알아야 하나요?

### 일상 비유: 열쇠 관리

여러분의 일상을 떠올려볼게요.

- **집 열쇠**를 현관 매트 아래 숨겨두면? → 도둑이 가장 먼저 확인하는 곳이에요
- **비밀번호를 포스트잇**에 적어서 모니터에 붙여두면? → 누구나 볼 수 있어요
- **모든 문에 같은 열쇠**를 쓰면? → 하나 잃어버리면 전부 뚫려요
- **열쇠를 10년째 안 바꾸면?** → 이전 세입자도 여전히 들어올 수 있어요
- **열쇠 복사본이 어디 있는지 모르면?** → 누가 접근 가능한지 파악이 안 돼요

소프트웨어에서도 똑같아요. **비밀(Secret)**은 시스템의 열쇠이고, 이걸 잘못 관리하면 전체 시스템이 위험해져요.

### 실무에서 비밀 관리가 필요한 순간

```
• DB 비밀번호를 소스 코드에 하드코딩했다가 GitHub에 노출됐어요    → Secrets Manager / Vault
• AWS Access Key가 Docker 이미지에 들어가 있었어요               → 환경변수 + 동적 자격증명
• 개발/스테이징/운영 환경마다 비밀이 다른데 관리가 안 돼요       → 중앙 집중식 비밀 관리
• DB 비밀번호를 바꾸려면 10개 서비스를 다 재배포해야 해요        → Dynamic Secrets + 자동 로테이션
• K8s Secret이 etcd에 평문으로 저장돼 있다는데 괜찮은 건가요?    → Sealed Secrets / ESO
• GitOps로 배포하는데 Secret을 Git에 어떻게 넣죠?               → SOPS / Sealed Secrets
• TLS 인증서가 만료돼서 서비스가 다운됐어요                      → 자동 인증서 관리
• 면접: "Vault의 Dynamic Secret이 뭔가요?"                      → 이 강의에서 완벽 대비!
```

### 비밀 노출 사고의 현실

| 사건 | 무슨 일이? | 교훈 |
|------|-----------|------|
| **Uber (2016)** | GitHub 프라이빗 리포에 AWS 키 노출 → 5,700만 명 데이터 유출 | 코드에 비밀 하드코딩 금지 |
| **Samsung (2022)** | GitGuardian이 삼성 엔지니어의 공개 리포에서 AWS 키 100+ 발견 | Secret Scanning 자동화 필수 |
| **CircleCI (2023)** | 내부 시스템 침해 → 모든 고객의 환경변수/토큰 노출 | 비밀 로테이션 + 최소 권한 |
| **Microsoft (2024)** | 내부 리포에 하드코딩된 키로 이메일 시스템 접근 | 정기적 비밀 스캔 + 자동 폐기 |

> "비밀 노출은 **if**가 아니라 **when**의 문제예요." — 보안 업계 격언

---

## 🧠 핵심 개념 잡기

### 비유: 호텔 키 관리 시스템

비밀 관리 도구들을 **호텔**에 비유해볼게요.

| 호텔 시스템 | 비밀 관리 도구 | 설명 |
|-------------|---------------|------|
| 마스터키 금고 | **HashiCorp Vault** | 모든 열쇠의 열쇠. 방 열쇠를 발급하고, 만료시키고, 감사하는 중앙 금고 |
| 프론트 데스크 | **AWS Secrets Manager** | "DB 비밀번호 주세요" 하면 안전하게 전달해주고 자동 교체도 해줘요 |
| 객실 메모 시스템 | **AWS Parameter Store** | "302호 손님은 알러지 있음" 같은 설정값부터 비밀까지 관리 |
| 봉인 편지 | **Sealed Secrets** | 편지를 봉인하면 특정 호텔(클러스터)에서만 열 수 있어요 |
| 대리 수령 서비스 | **External Secrets Operator** | 다른 호텔 금고(AWS, Vault)의 열쇠를 대신 가져다줘요 |
| 봉투 암호화 | **SOPS** | 편지 내용만 암호화하고, 봉투(키 이름)는 읽을 수 있게 |
| 카드키 시스템 | **Dynamic Secrets** | 체크인할 때마다 새 카드키 발급, 체크아웃하면 자동 폐기 |

### Secrets의 종류

비밀은 하나의 종류가 아니에요. 각각 다른 특성과 관리 방법이 필요해요.

| 종류 | 예시 | 특성 | 관리 포인트 |
|------|------|------|------------|
| **API Keys** | OpenAI API Key, Stripe Secret Key | 장기 유효, 서비스 인증 | 주기적 로테이션, 범위 제한 |
| **DB Passwords** | PostgreSQL, MySQL 비밀번호 | 인프라 접근, 데이터 유출 위험 | 동적 생성, 자동 로테이션 |
| **TLS Certificates** | HTTPS 인증서, mTLS 인증서 | 만료일 존재, 체인 관리 필요 | 자동 갱신(cert-manager) |
| **SSH Keys** | 서버 접근용 프라이빗 키 | 장기 유효, 높은 권한 | 주기적 교체, CA 기반 관리 |
| **OAuth Tokens** | GitHub, Google OAuth Token | 단기/장기 토큰 혼재 | 토큰 수명 관리, 갱신 로직 |
| **Encryption Keys** | AES 키, KMS CMK | 데이터 암호화의 핵심 | Envelope Encryption, 키 로테이션 |
| **Service Account Keys** | GCP SA JSON, K8s SA Token | 서비스 간 인증 | Workload Identity, 단기 토큰 |

### 비밀 관리의 핵심 원칙

```mermaid
mindmap
  root((비밀 관리<br/>핵심 원칙))
    중앙 집중화
      단일 진실 공급원
      일관된 접근 정책
      감사 로그 통합
    최소 권한
      필요한 비밀만
      필요한 시간만
      필요한 서비스만
    자동화
      자동 로테이션
      자동 폐기
      자동 주입
    암호화
      전송 중 암호화 TLS
      저장 시 암호화 AES
      Envelope Encryption
    감사
      누가 언제 접근?
      변경 이력 추적
      이상 탐지
    단기 수명
      Dynamic Secrets
      TTL 설정
      자동 만료
```

### 12-Factor App과 비밀 관리

[12-Factor App](https://12factor.net)의 **Factor III: Config** — "설정은 환경에 저장하라"는 비밀 관리의 출발점이에요.

```
❌ 안티패턴 (코드에 비밀 하드코딩)
─────────────────────────────────
db_password = "super_secret_123"       # 소스 코드에 직접
API_KEY = "sk-abc123..."               # 상수로 정의

❌ 약간 나은 안티패턴 (.env 파일을 Git에 커밋)
─────────────────────────────────
DB_PASSWORD=super_secret_123           # .env 파일이 Git에 포함

⚠️ 기본 단계 (환경변수, 하지만 수동 관리)
─────────────────────────────────
export DB_PASSWORD="super_secret_123"  # 배포 시 수동 설정

✅ 권장 단계 (비밀 관리 도구 사용)
─────────────────────────────────
DB_PASSWORD=$(vault kv get -field=password secret/myapp/db)
DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id myapp/db)

✅✅ 이상적 단계 (Dynamic Secrets)
─────────────────────────────────
# Vault가 임시 DB 계정을 자동 생성 → TTL 후 자동 삭제
vault read database/creds/myapp-role
```

### 비밀 관리 도구 비교 전체 맵

```mermaid
flowchart TB
    subgraph STORE["비밀 저장소"]
        VAULT["HashiCorp Vault<br/>자체 호스팅 / HCP"]
        ASM["AWS Secrets Manager<br/>완전 관리형"]
        PS["AWS Parameter Store<br/>무료 티어 있음"]
        GCP_SM["GCP Secret Manager"]
        AKV["Azure Key Vault"]
    end

    subgraph K8S_TOOLS["K8s 비밀 도구"]
        K8S_SEC["K8s Secrets<br/>⚠️ Base64 only"]
        SEALED["Sealed Secrets<br/>Git 안전"]
        ESO["External Secrets<br/>Operator"]
        CSI["Secrets Store<br/>CSI Driver"]
    end

    subgraph GITOPS_TOOLS["GitOps 비밀 도구"]
        SOPS_TOOL["SOPS<br/>파일 암호화"]
        AGE["age / gpg<br/>키 암호화"]
        HELM_SEC["Helm Secrets<br/>Plugin"]
    end

    ESO -->|"동기화"| VAULT
    ESO -->|"동기화"| ASM
    ESO -->|"동기화"| GCP_SM
    ESO -->|"동기화"| AKV
    CSI -->|"마운트"| VAULT
    CSI -->|"마운트"| ASM
    SOPS_TOOL -->|"암호화 키"| AGE
    SOPS_TOOL -->|"암호화 키"| ASM
    HELM_SEC -->|"사용"| SOPS_TOOL
    SEALED -->|"생성"| K8S_SEC
    ESO -->|"생성"| K8S_SEC

    style VAULT fill:#000,color:#fff
    style ASM fill:#ff9900,color:#000
    style SEALED fill:#326ce5,color:#fff
    style ESO fill:#2ecc71,color:#fff
    style SOPS_TOOL fill:#e74c3c,color:#fff
```

---

## 🔍 하나씩 자세히 알아보기

### 1. HashiCorp Vault — 비밀 관리의 왕

Vault는 **비밀 관리의 스위스 아미 나이프**예요. 단순 키-값 저장부터 동적 비밀 생성, PKI 인증서 발급, 암호화 서비스까지 — 비밀과 관련된 거의 모든 것을 할 수 있어요.

#### 1-1. Vault 아키텍처

```mermaid
flowchart TB
    CLIENT["클라이언트<br/>(App, CI/CD, Admin)"]

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
            PKI["PKI<br/>(인증서)"]
            TRANSIT["Transit<br/>(EaaS)"]
            AWS_ENG["AWS<br/>(Dynamic IAM)"]
            SSH_ENG["SSH<br/>(CA 서명)"]
        end

        subgraph CORE["🏗️ Core"]
            POLICY["Policies<br/>(HCL)"]
            AUDIT["Audit Log"]
            SEAL["Seal/Unseal<br/>(Master Key)"]
        end

        subgraph STORAGE["💾 Storage Backend"]
            RAFT["Raft (내장)"]
            CONSUL["Consul"]
            S3_STORE["S3 / DynamoDB"]
        end
    end

    CLIENT -->|"1. 인증"| AUTH
    AUTH -->|"2. 토큰 발급"| API
    API -->|"3. 정책 확인"| POLICY
    API -->|"4. 비밀 접근"| ENGINES
    ENGINES -->|"저장/조회"| STORAGE
    API -->|"기록"| AUDIT

    style VAULT fill:#000,color:#fff
    style AUTH fill:#1a1a2e,color:#fff
    style ENGINES fill:#16213e,color:#fff
    style CORE fill:#0f3460,color:#fff
```

#### 1-2. Vault의 핵심 개념

**Seal/Unseal (봉인/해제)**

Vault는 시작하면 **Sealed 상태**예요. 마치 금고가 잠긴 상태죠. Unseal Key(보통 Shamir's Secret Sharing으로 분할)를 조합해야 열 수 있어요.

```bash
# Vault 초기화 — 5개의 Unseal Key 생성, 3개가 모이면 Unseal 가능
vault operator init -key-shares=5 -key-threshold=3

# Unseal (3명의 관리자가 각자 자기 키를 입력)
vault operator unseal <key-1>   # 관리자 A
vault operator unseal <key-2>   # 관리자 B
vault operator unseal <key-3>   # 관리자 C → Unsealed!

# Auto-unseal (운영 환경 권장 — KMS 사용)
# vault.hcl 설정:
seal "awskms" {
  region     = "ap-northeast-2"
  kms_key_id = "alias/vault-unseal-key"
}
```

**Auth Methods (인증 방법)**

"너 누구야?"를 확인하는 방법이에요. 환경에 따라 적절한 인증 방법을 선택해요.

```bash
# Kubernetes 인증 — Pod이 자동으로 Vault에 인증
vault auth enable kubernetes
vault write auth/kubernetes/config \
    kubernetes_host="https://kubernetes.default.svc:443"

# AWS IAM 인증 — EC2/Lambda가 IAM Role로 인증
vault auth enable aws
vault write auth/aws/role/my-role \
    auth_type=iam \
    bound_iam_principal_arn="arn:aws:iam::123456789012:role/my-app-role" \
    policies=my-app-policy \
    ttl=1h

# AppRole 인증 — CI/CD 파이프라인용
vault auth enable approle
vault write auth/approle/role/ci-role \
    token_ttl=20m \
    token_max_ttl=30m \
    token_policies=ci-policy
```

**Policies (정책)**

"무엇을 할 수 있는가?"를 정의하는 HCL 규칙이에요.

```hcl
# my-app-policy.hcl
# 자기 앱의 비밀만 읽기 가능 (최소 권한)
path "secret/data/myapp/*" {
  capabilities = ["read", "list"]
}

# DB 동적 자격증명 생성 가능
path "database/creds/myapp-role" {
  capabilities = ["read"]
}

# Transit으로 암호화/복호화 가능
path "transit/encrypt/myapp-key" {
  capabilities = ["update"]
}

path "transit/decrypt/myapp-key" {
  capabilities = ["update"]
}

# 관리자 비밀에는 접근 불가
path "secret/data/admin/*" {
  capabilities = ["deny"]
}
```

```bash
# 정책 적용
vault policy write my-app-policy my-app-policy.hcl
```

#### 1-3. Secret Engines — 비밀 엔진

**KV v2 (Key-Value) — 정적 비밀**

가장 기본적인 비밀 저장소예요. 버전 관리가 가능한 v2를 사용하세요.

```bash
# 비밀 엔진 활성화
vault secrets enable -path=secret kv-v2

# 비밀 저장
vault kv put secret/myapp/config \
    db_host="db.example.com" \
    db_user="myapp" \
    db_password="s3cur3P@ss!"

# 비밀 읽기
vault kv get secret/myapp/config
vault kv get -field=db_password secret/myapp/config

# 버전 관리
vault kv get -version=1 secret/myapp/config     # 이전 버전 조회
vault kv rollback -version=1 secret/myapp/config # 롤백
vault kv delete -versions=2 secret/myapp/config  # 특정 버전 삭제
```

**Database — 동적 비밀 (가장 강력한 기능!)**

요청할 때마다 **임시 DB 계정**을 생성하고, TTL이 지나면 자동 삭제해요. 비밀번호가 유출돼도 이미 만료된 계정이라 피해가 최소화돼요.

```bash
# Database 엔진 활성화
vault secrets enable database

# PostgreSQL 연결 설정
vault write database/config/mydb \
    plugin_name=postgresql-database-plugin \
    allowed_roles="myapp-role" \
    connection_url="postgresql://{{username}}:{{password}}@db.example.com:5432/mydb?sslmode=require" \
    username="vault-admin" \
    password="vault-admin-password"

# 역할 정의 — 어떤 권한의 계정을 만들 것인가
vault write database/roles/myapp-role \
    db_name=mydb \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' \
        VALID UNTIL '{{expiration}}'; \
        GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    revocation_statements="DROP ROLE IF EXISTS \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="24h"

# 동적 자격증명 요청 — 매번 다른 계정이 생성됨!
vault read database/creds/myapp-role
# Key                Value
# ---                -----
# lease_id           database/creds/myapp-role/abcd1234
# lease_duration     1h
# username           v-approle-myapp-r-abc123XYZ
# password           B4s&kL9-mN2pQ...

# 1시간 후 자동 삭제! 수동 폐기도 가능:
vault lease revoke database/creds/myapp-role/abcd1234
```

**Transit — 서비스로서의 암호화 (Encryption as a Service)**

앱이 직접 암호화 키를 관리하지 않고, Vault에 "이 데이터 암호화해줘"라고 요청하는 방식이에요.

```bash
# Transit 엔진 활성화 + 키 생성
vault secrets enable transit
vault write -f transit/keys/myapp-key

# 암호화 (base64 인코딩 필요)
vault write transit/encrypt/myapp-key \
    plaintext=$(echo "주민등록번호: 901225-1234567" | base64)
# ciphertext: vault:v1:abc123...암호화된데이터...

# 복호화
vault write transit/decrypt/myapp-key \
    ciphertext="vault:v1:abc123..."
# plaintext: <base64 인코딩된 원본> → base64 디코딩하면 원본

# 키 로테이션 (이전 버전으로도 복호화 가능)
vault write -f transit/keys/myapp-key/rotate
```

**PKI — 인증서 자동 발급**

```bash
# PKI 엔진 활성화
vault secrets enable pki
vault secrets tune -max-lease-ttl=87600h pki

# Root CA 생성
vault write pki/root/generate/internal \
    common_name="MyCompany Root CA" \
    ttl=87600h

# 중간 CA 설정 + 역할 생성
vault secrets enable -path=pki_int pki
vault write pki_int/roles/my-domain \
    allowed_domains="example.com" \
    allow_subdomains=true \
    max_ttl="720h"

# 인증서 발급 (자동화!)
vault write pki_int/issue/my-domain \
    common_name="api.example.com" \
    ttl="24h"
```

#### 1-4. Vault Agent — 앱에서 비밀 자동 주입

앱이 직접 Vault API를 호출하지 않아도 되도록 **Sidecar/Init Container** 패턴으로 비밀을 주입해줘요.

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

[AWS 보안 서비스](../05-cloud-aws/12-security)에서 기초를 배웠죠? 여기서는 실무 패턴에 집중해볼게요.

#### 2-1. Secrets Manager — 완전 관리형 비밀 저장소

```bash
# 비밀 생성
aws secretsmanager create-secret \
    --name "myapp/production/db" \
    --description "Production DB credentials" \
    --secret-string '{"username":"admin","password":"s3cur3P@ss!","host":"db.example.com","port":"5432"}'

# 비밀 조회
aws secretsmanager get-secret-value \
    --secret-id "myapp/production/db" \
    --query 'SecretString' --output text | jq .

# 비밀 업데이트
aws secretsmanager update-secret \
    --secret-id "myapp/production/db" \
    --secret-string '{"username":"admin","password":"n3wP@ss!","host":"db.example.com","port":"5432"}'
```

**자동 로테이션 설정 (Lambda 기반)**

```python
# rotation_lambda.py — RDS 비밀번호 자동 교체
import boto3
import json

def lambda_handler(event, context):
    secret_id = event['SecretId']
    step = event['Step']
    token = event['ClientRequestToken']

    sm = boto3.client('secretsmanager')

    if step == "createSecret":
        # 새 비밀번호 생성
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
        # DB에 새 비밀번호 적용
        pending = json.loads(
            sm.get_secret_value(
                SecretId=secret_id, VersionStage='AWSPENDING'
            )['SecretString']
        )
        # RDS API 또는 직접 SQL로 비밀번호 변경
        change_db_password(pending)

    elif step == "testSecret":
        # 새 비밀번호로 접속 테스트
        pending = json.loads(
            sm.get_secret_value(
                SecretId=secret_id, VersionStage='AWSPENDING'
            )['SecretString']
        )
        test_db_connection(pending)

    elif step == "finishSecret":
        # 버전 스테이지 교체: AWSPENDING → AWSCURRENT
        sm.update_secret_version_stage(
            SecretId=secret_id,
            VersionStage='AWSCURRENT',
            MoveToVersionId=token,
            RemoveFromVersionId=get_current_version(sm, secret_id)
        )
```

```bash
# 자동 로테이션 활성화 (30일마다)
aws secretsmanager rotate-secret \
    --secret-id "myapp/production/db" \
    --rotation-lambda-arn "arn:aws:lambda:ap-northeast-2:123456789012:function:db-rotation" \
    --rotation-rules '{"AutomaticallyAfterDays": 30}'
```

#### 2-2. Parameter Store vs Secrets Manager 비교

| 특성 | Parameter Store | Secrets Manager |
|------|----------------|-----------------|
| **가격** | Standard 무료, Advanced $0.05/파라미터/월 | $0.40/비밀/월 + API 호출 비용 |
| **자동 로테이션** | 없음 (직접 구현) | Lambda 기반 내장 |
| **버전 관리** | 기본 지원 | 기본 지원 |
| **암호화** | KMS (SecureString) | KMS (자동) |
| **크기 제한** | 4KB (Standard), 8KB (Advanced) | 64KB |
| **계층 구조** | `/app/env/key` 지원 | 이름 기반 (유사) |
| **교차 계정** | RAM으로 공유 | 리소스 정책 |
| **추천 용도** | 설정값 + 간단한 비밀 | DB 비밀번호 + 자동 로테이션 필요 |

```bash
# Parameter Store 사용법
# 일반 설정값 (String)
aws ssm put-parameter \
    --name "/myapp/production/api_endpoint" \
    --type "String" \
    --value "https://api.example.com"

# 비밀 (SecureString — KMS 암호화)
aws ssm put-parameter \
    --name "/myapp/production/api_key" \
    --type "SecureString" \
    --value "sk-abc123..." \
    --key-id "alias/myapp-key"

# 계층적 조회 (한 번에 모든 설정 가져오기)
aws ssm get-parameters-by-path \
    --path "/myapp/production/" \
    --with-decryption \
    --recursive
```

---

### 3. SOPS — GitOps 친화적 비밀 암호화

**SOPS(Secrets OPerationS)**는 파일의 **값(value)만 암호화**하고 키(key)는 평문으로 남겨두는 도구예요. 덕분에 Git diff가 의미 있고, 코드 리뷰도 가능해요.

#### 3-1. SOPS 동작 원리

```yaml
# 원본 파일 (secrets.yaml)
database:
  host: db.example.com
  username: admin
  password: super_secret_123
api:
  key: sk-abc123def456

# SOPS로 암호화한 후 (secrets.enc.yaml)
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

키 이름(`database.host`, `api.key`)은 보이지만 값은 암호화돼 있어요!

#### 3-2. SOPS 실습

```bash
# 설치
brew install sops age   # macOS
# choco install sops age  # Windows

# age 키 생성 (개인 암호화 키)
age-keygen -o ~/.sops/key.txt
# Public key: age1abc123...
# 이 Public key를 .sops.yaml에 등록

# .sops.yaml (프로젝트 루트에 생성 — 암호화 규칙 정의)
creation_rules:
  # production 폴더 → AWS KMS로 암호화
  - path_regex: environments/production/.*\.yaml$
    kms: "arn:aws:kms:ap-northeast-2:123456789012:key/abc-123"

  # staging 폴더 → age로 암호화
  - path_regex: environments/staging/.*\.yaml$
    age: "age1abc123...,age1def456..."

  # 기본 규칙
  - age: "age1abc123..."
```

```bash
# 암호화
sops -e secrets.yaml > secrets.enc.yaml    # 새 파일로 출력
sops -e -i secrets.yaml                     # 파일 직접 암호화 (in-place)

# 복호화
sops -d secrets.enc.yaml                    # stdout으로 출력
sops -d -i secrets.enc.yaml                 # 파일 직접 복호화

# 편집 (복호화 → 에디터 → 저장 시 재암호화)
sops secrets.enc.yaml                       # $EDITOR로 열림

# 특정 키만 추출
sops -d --extract '["database"]["password"]' secrets.enc.yaml

# 키 로테이션 (암호화 키 변경)
sops -r secrets.enc.yaml
```

#### 3-3. SOPS + Kustomize/Helm 연동

```bash
# Kustomize + SOPS (ksops 플러그인)
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
# Helm + helm-secrets 플러그인
# helm secrets install myapp ./chart -f values.yaml -f secrets.enc.yaml
# → secrets.enc.yaml을 자동 복호화해서 Helm에 전달

# secrets.enc.yaml (SOPS 암호화)
db:
  password: ENC[AES256_GCM,data:abc...,type:str]
redis:
  password: ENC[AES256_GCM,data:def...,type:str]
```

---

### 4. Kubernetes Secrets의 한계와 대안

#### 4-1. K8s Secrets의 문제점

K8s의 기본 Secrets는 **보안 도구가 아니에요**. Base64 인코딩은 암호화가 아니에요!

```yaml
# K8s Secret 생성
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secret
type: Opaque
data:
  # base64 인코딩일 뿐! 누구나 디코딩 가능
  db-password: c3VwZXJfc2VjcmV0XzEyMw==  # echo -n "super_secret_123" | base64
```

```bash
# 누구나 복호화 가능 — 이건 "암호화"가 아니에요!
echo "c3VwZXJfc2VjcmV0XzEyMw==" | base64 -d
# 출력: super_secret_123
```

**K8s Secrets의 구체적 한계:**

| 문제 | 설명 |
|------|------|
| **Base64 ≠ 암호화** | 인코딩일 뿐, 누구나 디코딩 가능 |
| **etcd 평문 저장** | 기본 설정에서 etcd에 평문으로 저장됨 |
| **Git에 커밋 불가** | Base64라 GitOps와 궁합이 안 맞음 |
| **로테이션 없음** | 수동으로 Secret을 업데이트해야 함 |
| **RBAC만 의존** | Secret 접근 제어가 RBAC에만 의존 |
| **감사 로그 부족** | 누가 언제 Secret을 읽었는지 추적 어려움 |

```bash
# etcd 암호화 활성화 (최소한의 보안)
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

#### 4-2. Sealed Secrets (Bitnami) — GitOps의 구원자

Sealed Secrets는 **클러스터의 공개키로 비밀을 암호화**해서 Git에 안전하게 커밋할 수 있게 해줘요. 해당 클러스터에서만 복호화가 가능해요.

```mermaid
sequenceDiagram
    participant DEV as 개발자
    participant KUBESEAL as kubeseal CLI
    participant GIT as Git Repository
    participant CTRL as Sealed Secrets<br/>Controller
    participant K8S as K8s API Server
    participant POD as Application Pod

    DEV->>KUBESEAL: 1. 원본 Secret 전달
    Note over KUBESEAL: 클러스터 공개키로<br/>암호화
    KUBESEAL->>DEV: 2. SealedSecret YAML 반환
    DEV->>GIT: 3. SealedSecret 커밋 (안전!)
    GIT->>CTRL: 4. GitOps 동기화 (ArgoCD 등)
    Note over CTRL: 클러스터 비밀키로<br/>복호화
    CTRL->>K8S: 5. K8s Secret 생성
    K8S->>POD: 6. Secret 마운트/주입
```

```bash
# 설치
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm install sealed-secrets sealed-secrets/sealed-secrets \
    --namespace kube-system

# kubeseal CLI 설치
brew install kubeseal   # macOS

# 1. 일반 Secret 생성 (이건 Git에 커밋하면 안 돼요!)
kubectl create secret generic myapp-secret \
    --from-literal=db-password=super_secret_123 \
    --dry-run=client -o yaml > secret.yaml

# 2. Sealed Secret으로 변환 (이건 Git에 커밋해도 안전!)
kubeseal --format yaml < secret.yaml > sealed-secret.yaml

# 3. Git에 커밋
git add sealed-secret.yaml
git commit -m "Add encrypted myapp-secret"
```

```yaml
# sealed-secret.yaml (Git에 커밋해도 안전!)
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
# Sealed Secrets 스코프 옵션
# strict (기본값) — 같은 이름 + 같은 네임스페이스에서만 복호화
kubeseal --scope strict

# namespace-wide — 같은 네임스페이스의 어떤 이름으로든 복호화
kubeseal --scope namespace-wide

# cluster-wide — 클러스터 어디서든 복호화
kubeseal --scope cluster-wide

# 키 백업 (중요! — 키를 잃으면 모든 SealedSecret이 무용지물)
kubectl get secret -n kube-system \
    -l sealedsecrets.bitnami.com/sealed-secrets-key \
    -o yaml > sealed-secrets-master-key-backup.yaml
# 이 백업 파일은 매우 안전한 곳에 보관하세요!
```

#### 4-3. External Secrets Operator (ESO) — 외부 비밀 동기화

ESO는 **외부 비밀 저장소(Vault, AWS Secrets Manager 등)에서 비밀을 가져와** K8s Secret으로 자동 생성/동기화해요.

```mermaid
flowchart LR
    subgraph EXTERNAL["외부 비밀 저장소"]
        VAULT_EXT["HashiCorp Vault"]
        ASM_EXT["AWS Secrets Manager"]
        GCP_EXT["GCP Secret Manager"]
        AKV_EXT["Azure Key Vault"]
    end

    subgraph K8S_CLUSTER["Kubernetes 클러스터"]
        ESO_OP["External Secrets<br/>Operator"]
        SS["SecretStore /<br/>ClusterSecretStore"]
        ES["ExternalSecret<br/>(매니페스트)"]
        K8S_SECRET["K8s Secret<br/>(자동 생성)"]
        APP_POD["App Pod"]
    end

    ES -->|"참조"| SS
    SS -->|"인증 정보"| ESO_OP
    ESO_OP -->|"비밀 조회"| EXTERNAL
    ESO_OP -->|"생성/동기화"| K8S_SECRET
    K8S_SECRET -->|"마운트/환경변수"| APP_POD

    style ESO_OP fill:#2ecc71,color:#fff
    style VAULT_EXT fill:#000,color:#fff
    style ASM_EXT fill:#ff9900,color:#000
```

```bash
# ESO 설치
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
    --namespace external-secrets --create-namespace
```

```yaml
# 1. ClusterSecretStore — AWS Secrets Manager 연결
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
# 2. ExternalSecret — 어떤 비밀을 가져올지 정의
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: myapp-db-secret
  namespace: default
spec:
  refreshInterval: 1h    # 1시간마다 동기화 (로테이션 대응)
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore

  target:
    name: myapp-db-secret            # 생성될 K8s Secret 이름
    creationPolicy: Owner            # ExternalSecret 삭제 시 Secret도 삭제

  data:
    - secretKey: username             # K8s Secret의 키
      remoteRef:
        key: myapp/production/db      # AWS Secrets Manager의 비밀 이름
        property: username            # JSON 키

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
# Vault를 백엔드로 사용하는 경우
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
        key: secret/data/myapp/config   # Vault 경로의 모든 키-값을 가져옴
```

```yaml
# 3. App에서 사용 — 일반 K8s Secret처럼 사용
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

### 5. 비밀 로테이션 전략

비밀은 한번 설정하고 영원히 쓰는 게 아니에요. **주기적으로 교체(로테이션)**해야 해요.

#### 5-1. 로테이션이 필요한 이유

```
직원 퇴사 → 그 직원이 알던 비밀번호는 여전히 유효
비밀 유출 사고 → 로테이션 없으면 영원히 노출된 상태
컴플라이언스 → PCI-DSS, SOC2 등에서 주기적 교체 요구
Blast Radius 최소화 → 유출되더라도 짧은 유효기간으로 피해 제한
```

#### 5-2. 로테이션 전략 비교

| 전략 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **수동 로테이션** | 사람이 직접 비밀번호 변경 | 단순 | 느림, 실수 가능, 확장 불가 |
| **시간 기반 자동** | 30/60/90일마다 자동 교체 | 예측 가능, 자동화 | 교체 직전까지 같은 비밀 사용 |
| **Dynamic Secrets** | 요청 시 생성, TTL 후 폐기 | 가장 안전, 유출 영향 최소 | Vault 필요, 복잡도 증가 |
| **이벤트 기반** | 유출 감지 시 즉시 교체 | 빠른 대응 | 감지 시스템 필요 |

#### 5-3. 무중단 로테이션 패턴

DB 비밀번호를 바꿀 때 서비스가 안 끊기려면 **이중 자격증명(Dual Credentials)** 패턴을 사용해요.

```
단계 1: 현재 상태
  App → [user_A / password_old] → DB ✅

단계 2: 새 비밀번호 생성 (DB에 두 비밀번호 모두 유효하게 설정)
  App → [user_A / password_old] → DB ✅
         [user_A / password_new] → DB ✅ (아직 미사용)

단계 3: 앱에 새 비밀번호 전달 (점진적 롤아웃)
  App(old) → [user_A / password_old] → DB ✅
  App(new) → [user_A / password_new] → DB ✅

단계 4: 모든 앱이 새 비밀번호 사용 확인 후, 이전 비밀번호 폐기
  App → [user_A / password_new] → DB ✅
         [user_A / password_old] → DB ❌ (폐기)
```

```python
# AWS Secrets Manager의 멀티-유저 로테이션 패턴
# user_A와 user_B를 번갈아가며 사용

# 현재 활성: user_A (AWSCURRENT)
# 다음 교체 시: user_B의 비밀번호 변경 → user_B를 AWSCURRENT로 승격
# 그 다음 교체: user_A의 비밀번호 변경 → user_A를 AWSCURRENT로 승격
# 이렇게 A ↔ B를 번갈아가면 무중단 로테이션 가능!
```

#### 5-4. 비밀 유형별 로테이션 가이드

| 비밀 유형 | 권장 주기 | 로테이션 방법 | 자동화 도구 |
|-----------|----------|-------------|------------|
| **DB 비밀번호** | 30~90일 | 이중 자격증명 패턴 | Vault Dynamic / ASM 로테이션 |
| **API Keys** | 90일 | 새 키 발급 → 기존 키 폐기 | 서비스 제공자 API |
| **TLS 인증서** | 60~90일 (Let's Encrypt 자동) | 자동 갱신 | cert-manager / ACM |
| **SSH Keys** | 90~180일 | CA 기반 단기 인증서 | Vault SSH CA |
| **OAuth Tokens** | Access: 1시간, Refresh: 30일 | 자동 갱신 로직 | 앱 내부 구현 |
| **KMS 키** | 365일 | 자동 키 로테이션 | AWS KMS / Vault Transit |

---

## 💻 직접 해보기

### 실습 1: Vault로 동적 DB 비밀 관리

```bash
# ============================================
# Vault + PostgreSQL Dynamic Secrets 실습
# ============================================

# 1. Vault 서버 시작 (개발 모드)
vault server -dev -dev-root-token-id="root"
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='root'

# 2. PostgreSQL 시작 (Docker)
docker run -d --name postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=myapp \
    -p 5432:5432 postgres:16

# 3. Database 시크릿 엔진 활성화
vault secrets enable database

# 4. PostgreSQL 연결 설정
vault write database/config/myapp-db \
    plugin_name=postgresql-database-plugin \
    allowed_roles="readonly,readwrite" \
    connection_url="postgresql://{{username}}:{{password}}@host.docker.internal:5432/myapp?sslmode=disable" \
    username="postgres" \
    password="postgres"

# 5. 읽기 전용 역할 생성
vault write database/roles/readonly \
    db_name=myapp-db \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="4h"

# 6. 읽기/쓰기 역할 생성
vault write database/roles/readwrite \
    db_name=myapp-db \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="30m" \
    max_ttl="2h"

# 7. 동적 자격증명 발급!
echo "=== 읽기 전용 자격증명 ==="
vault read database/creds/readonly

echo "=== 읽기/쓰기 자격증명 ==="
vault read database/creds/readwrite

# 8. 자격증명으로 DB 접속 테스트
# (위에서 발급받은 username/password 사용)
psql -h localhost -U v-root-readonly-abc123 -d myapp

# 9. TTL 확인 및 갱신
vault lease lookup <lease-id>
vault lease renew <lease-id>

# 10. 수동 폐기 (긴급 상황 시)
vault lease revoke <lease-id>
vault lease revoke -prefix database/creds/readonly  # 역할의 모든 자격증명 폐기!
```

### 실습 2: SOPS로 Git에 비밀 안전하게 저장

```bash
# ============================================
# SOPS + age 암호화 실습
# ============================================

# 1. age 키 생성
mkdir -p ~/.sops
age-keygen -o ~/.sops/key.txt
# Public key: age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p

export SOPS_AGE_KEY_FILE=~/.sops/key.txt

# 2. 프로젝트 설정
mkdir -p myapp/environments/{production,staging}
cd myapp

# 3. .sops.yaml 생성 (암호화 규칙)
cat > .sops.yaml << 'EOF'
creation_rules:
  - path_regex: environments/production/.*\.yaml$
    age: "age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p"

  - path_regex: environments/staging/.*\.yaml$
    age: "age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p"
EOF

# 4. 비밀 파일 생성 + 암호화
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

# 5. Git에 커밋 (암호화된 상태로 안전하게!)
git add .
git commit -m "Add encrypted production secrets"

# 6. 팀원이 수정할 때
sops environments/production/secrets.yaml
# 에디터에서 복호화된 상태로 편집 → 저장 시 자동 재암호화

# 7. CI/CD에서 복호화
sops -d environments/production/secrets.yaml
# → 복호화된 값을 환경변수나 설정 파일로 사용
```

### 실습 3: External Secrets Operator 구성

```bash
# ============================================
# ESO + AWS Secrets Manager 실습
# ============================================

# 1. 사전 준비: AWS에 비밀 생성
aws secretsmanager create-secret \
    --name "myapp/prod/db-creds" \
    --secret-string '{"username":"admin","password":"s3cur3!","host":"db.prod.internal"}'

aws secretsmanager create-secret \
    --name "myapp/prod/api-keys" \
    --secret-string '{"stripe":"sk_live_abc","sendgrid":"SG.xyz"}'

# 2. ESO 설치
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
    -n external-secrets --create-namespace \
    --set installCRDs=true

# 3. IRSA(IAM Roles for Service Accounts) 설정
eksctl create iamserviceaccount \
    --name external-secrets-sa \
    --namespace external-secrets \
    --cluster my-cluster \
    --attach-policy-arn arn:aws:iam::123456789012:policy/ExternalSecretsPolicy \
    --approve
```

```yaml
# 4. ClusterSecretStore 생성
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
# 5. ExternalSecret 생성
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
# 6. 적용 및 확인
kubectl apply -f cluster-secret-store.yaml
kubectl apply -f external-secret-db.yaml

# 동기화 상태 확인
kubectl get externalsecret -n myapp
# NAME       STORE   REFRESH   STATUS
# myapp-db   aws-sm  1h        SecretSynced

# 생성된 K8s Secret 확인
kubectl get secret myapp-db-creds -n myapp -o yaml

# 7. Deployment에서 사용
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

### 실습 4: Sealed Secrets로 GitOps 비밀 관리

```bash
# ============================================
# Sealed Secrets + ArgoCD GitOps 실습
# ============================================

# 1. Sealed Secrets 컨트롤러 설치
helm install sealed-secrets sealed-secrets/sealed-secrets \
    -n kube-system \
    --set-string fullnameOverride=sealed-secrets-controller

# 2. kubeseal CLI 설치 및 테스트
kubeseal --version

# 3. 비밀 생성 → Sealing
kubectl create secret generic myapp-secret \
    --namespace=myapp \
    --from-literal=DB_PASSWORD='s3cur3P@ss!' \
    --from-literal=API_KEY='sk-abc123' \
    --dry-run=client -o yaml | \
    kubeseal --format yaml > sealed-myapp-secret.yaml

# 4. Git 리포지토리 구조
# gitops-repo/
# ├── apps/
# │   └── myapp/
# │       ├── deployment.yaml
# │       ├── service.yaml
# │       └── sealed-myapp-secret.yaml   ← 이 파일만 Git에!
# └── infrastructure/
#     └── sealed-secrets/
#         └── helm-release.yaml

# 5. ArgoCD가 자동으로 SealedSecret → Secret 변환
git add sealed-myapp-secret.yaml
git commit -m "Add sealed secret for myapp"
git push

# ArgoCD가 동기화하면:
# SealedSecret → (컨트롤러가 복호화) → K8s Secret → Pod에 주입
```

---

## 🏢 실무에서는?

### 환경별 비밀 관리 아키텍처

```mermaid
flowchart TB
    subgraph DEV["개발 환경"]
        DEV_SOPS["SOPS + age<br/>(개인 키)"]
        DEV_ENV[".env.local<br/>(Git 제외)"]
    end

    subgraph STG["스테이징 환경"]
        STG_ASM["AWS Secrets Manager<br/>/ Parameter Store"]
        STG_ESO["ESO 동기화<br/>(5분 간격)"]
    end

    subgraph PROD["운영 환경"]
        PROD_VAULT["HashiCorp Vault<br/>(HA 클러스터)"]
        PROD_DYN["Dynamic Secrets<br/>(TTL: 1시간)"]
        PROD_ROT["자동 로테이션<br/>(30일)"]
        PROD_AUDIT["감사 로그<br/>(전수 기록)"]
    end

    subgraph CICD["CI/CD 파이프라인"]
        GH_SEC["GitHub Secrets<br/>(OIDC 인증)"]
        PIPE_VAULT["Vault AppRole<br/>(단기 토큰)"]
    end

    DEV_SOPS -->|"배포 시"| STG_ASM
    STG_ASM -->|"승격"| PROD_VAULT
    GH_SEC --> PIPE_VAULT
    PIPE_VAULT --> PROD_VAULT

    style PROD fill:#e74c3c,color:#fff
    style PROD_VAULT fill:#000,color:#fff
    style DEV fill:#2ecc71,color:#fff
    style STG fill:#f39c12,color:#fff
```

### 실무 시나리오별 도구 선택 가이드

| 시나리오 | 추천 조합 | 이유 |
|---------|----------|------|
| **스타트업 (5인 이하)** | SOPS + AWS Parameter Store | 무료, 간단, 빠르게 시작 |
| **중소기업 (AWS 올인)** | AWS Secrets Manager + ESO | 완전 관리형, 자동 로테이션 |
| **멀티클라우드** | Vault + ESO | 클라우드 중립적, 통합 관리 |
| **GitOps (ArgoCD)** | Sealed Secrets 또는 SOPS + ESO | Git에 안전하게 커밋 가능 |
| **금융/규제 산업** | Vault Enterprise + HSM | 강력한 감사, 컴플라이언스 |
| **CI/CD 파이프라인** | GitHub OIDC + Vault/ASM | 장기 토큰 없이 인증 |

### 비밀 관리 성숙도 모델

```
Level 0: 카오스
  └─ 코드에 하드코딩, .env를 Git에 커밋, 슬랙으로 비밀번호 공유

Level 1: 기본
  └─ 환경변수 사용, .gitignore에 .env 추가, 수동 관리

Level 2: 중앙화
  └─ Secrets Manager/Parameter Store 사용, CI/CD에서 주입

Level 3: 자동화
  └─ 자동 로테이션, ESO로 K8s 동기화, SOPS로 GitOps

Level 4: 동적
  └─ Vault Dynamic Secrets, OIDC 인증, 단기 토큰

Level 5: 제로 트러스트
  └─ mTLS 기반, Workload Identity, 실시간 감사, 이상 탐지
```

### Terraform으로 비밀 인프라 구성

```hcl
# secrets-infrastructure.tf

# AWS Secrets Manager 비밀 생성
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

# Parameter Store 설정값
resource "aws_ssm_parameter" "api_endpoint" {
  name  = "/myapp/production/api_endpoint"
  type  = "String"
  value = "https://api.example.com"
}

resource "aws_ssm_parameter" "api_key" {
  name   = "/myapp/production/api_key"
  type   = "SecureString"
  value  = "initial-value"  # 초기값, 이후 수동/자동 업데이트
  key_id = aws_kms_key.myapp.arn

  lifecycle {
    ignore_changes = [value]  # Terraform이 값을 덮어쓰지 않도록!
  }
}

# KMS 키
resource "aws_kms_key" "myapp" {
  description             = "KMS key for myapp secrets"
  deletion_window_in_days = 30
  enable_key_rotation     = true  # 자동 키 로테이션!

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

# ESO에 필요한 IAM 정책
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

### 앱에서 비밀 사용 패턴

```python
# Python 앱에서 비밀 가져오기 — 여러 방법

# 방법 1: 환경변수 (가장 단순, 12-Factor App)
import os

DB_HOST = os.environ["DB_HOST"]
DB_PASSWORD = os.environ["DB_PASSWORD"]

# 방법 2: AWS Secrets Manager SDK
import boto3
import json

def get_secret(secret_name):
    client = boto3.client("secretsmanager", region_name="ap-northeast-2")
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response["SecretString"])

db_creds = get_secret("myapp/production/db")
db_host = db_creds["host"]
db_password = db_creds["password"]

# 방법 3: Vault hvac 클라이언트
import hvac

client = hvac.Client(url="https://vault.example.com:8200")
client.auth.kubernetes.login(role="myapp", jwt=open("/var/run/secrets/kubernetes.io/serviceaccount/token").read())

# 정적 비밀
secret = client.secrets.kv.v2.read_secret_version(path="myapp/config")
api_key = secret["data"]["data"]["api_key"]

# 동적 DB 자격증명
db_creds = client.secrets.database.generate_credentials(name="myapp-role")
db_user = db_creds["data"]["username"]
db_pass = db_creds["data"]["password"]

# 방법 4: 파일 마운트 (Vault Agent / CSI Driver)
# Secret이 파일로 마운트되는 경우
with open("/etc/secrets/db-password") as f:
    db_password = f.read().strip()
```

```go
// Go 앱에서 비밀 가져오기

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
    // 환경변수 우선, 없으면 Secrets Manager
    dbPassword := os.Getenv("DB_PASSWORD")
    if dbPassword == "" {
        secret, _ := getSecret("myapp/production/db")
        dbPassword = secret["password"]
    }
    fmt.Println("Connected with managed secret")
}
```

---

## ⚠️ 자주 하는 실수

### 실수 1: 코드에 비밀 하드코딩

```python
# ❌ 절대 하면 안 되는 것
DB_PASSWORD = "super_secret_123"
AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE"
API_KEY = "sk-abc123def456ghi789"

# ✅ 환경변수 또는 비밀 관리 도구 사용
DB_PASSWORD = os.environ["DB_PASSWORD"]
```

**방지법:** pre-commit hook으로 비밀 스캔 자동화

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

### 실수 2: Git 히스토리에 비밀이 남아있음

```bash
# ❌ 파일을 삭제해도 Git 히스토리에 남아요!
git rm secrets.env
git commit -m "Remove secrets"
# → git log -p 로 여전히 볼 수 있음!

# ✅ Git 히스토리에서 완전 제거 (BFG Repo-Cleaner)
bfg --delete-files secrets.env
# 또는
git filter-repo --path secrets.env --invert-paths

# ✅ 근본적 해결: 처음부터 .gitignore에 추가
echo "*.env" >> .gitignore
echo "secrets.*" >> .gitignore
echo "!secrets.enc.*" >> .gitignore   # SOPS 암호화 파일은 허용
```

### 실수 3: K8s Secret을 안전하다고 착각

```yaml
# ❌ "Secret이니까 안전하겠지?"
apiVersion: v1
kind: Secret
metadata:
  name: my-secret
data:
  password: cGFzc3dvcmQ=   # base64("password") — 이건 암호화가 아니에요!

# ✅ Sealed Secrets 또는 ESO 사용
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: my-secret
spec:
  encryptedData:
    password: AgBy3i4OJSWK+PiTySYZZA9rO...  # 진짜 암호화됨!
```

### 실수 4: 비밀에 과도한 권한 부여

```hcl
# ❌ 모든 비밀에 접근 가능
path "secret/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# ✅ 최소 권한 원칙
path "secret/data/myapp/*" {
  capabilities = ["read"]
}
```

### 실수 5: 비밀 로테이션을 안 함

```bash
# ❌ "처음 설정한 비밀번호를 3년째 쓰고 있어요"
# 직원 퇴사, 노트북 분실, 비밀 유출 등의 위험에 무방비

# ✅ 자동 로테이션 설정
aws secretsmanager rotate-secret \
    --secret-id "myapp/db" \
    --rotation-rules '{"AutomaticallyAfterDays": 30}'

# 또는 Vault Dynamic Secrets (요청 시 생성, 자동 만료)
vault write database/roles/myapp-role default_ttl="1h" max_ttl="24h"
```

### 실수 6: 로그에 비밀이 출력됨

```python
# ❌ 비밀이 로그에 찍혀요!
logger.info(f"Connecting to DB with password: {db_password}")
logger.debug(f"API response: {response.json()}")  # 토큰 포함 가능

# ✅ 비밀은 마스킹
logger.info("Connecting to DB with password: ****")
logger.info(f"DB connection established to {db_host}")

# ✅ 환경변수에 비밀이 있으면 로그에서 자동 마스킹하는 래퍼
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

### 실수 7: Sealed Secrets 백업 키를 안 함

```bash
# ❌ 클러스터를 재구축하면 기존 SealedSecret을 복호화할 수 없어요!

# ✅ 반드시 백업!
kubectl get secret -n kube-system \
    -l sealedsecrets.bitnami.com/sealed-secrets-key \
    -o yaml > sealed-secrets-backup.yaml

# 이 파일은 AWS Secrets Manager나 금고에 안전하게 보관
aws secretsmanager create-secret \
    --name "infra/sealed-secrets-backup" \
    --secret-string "$(cat sealed-secrets-backup.yaml)"
```

### 실수 체크리스트

```
□ 코드에 하드코딩된 비밀이 없는지 gitleaks로 스캔했나요?
□ .gitignore에 .env, *.key, *.pem 등이 포함돼 있나요?
□ K8s Secret 대신 Sealed Secrets / ESO를 사용하고 있나요?
□ 비밀 로테이션이 자동화돼 있나요?
□ Vault/SM 접근에 최소 권한 원칙을 적용했나요?
□ 비밀이 로그, 에러 메시지, 응답에 노출되지 않나요?
□ Sealed Secrets 마스터 키를 백업했나요?
□ CI/CD에서 장기 토큰 대신 OIDC를 사용하나요?
□ 비밀 접근 감사 로그를 활성화했나요?
□ 비밀 유출 시 대응 절차(Incident Response)가 있나요?
```

---

## 📝 마무리

### 핵심 정리 한눈에

```
비밀 관리의 4가지 기둥:
━━━━━━━━━━━━━━━━━━━

1. 저장 (Store)
   → Vault KV, AWS Secrets Manager, Parameter Store
   "비밀을 어디에 안전하게 보관하는가?"

2. 전달 (Deliver)
   → ESO, Vault Agent, CSI Driver, 환경변수
   "비밀을 앱에 어떻게 안전하게 전달하는가?"

3. 교체 (Rotate)
   → Dynamic Secrets, 자동 로테이션, 이중 자격증명
   "비밀을 얼마나 자주, 어떻게 교체하는가?"

4. 감사 (Audit)
   → 접근 로그, 이상 탐지, 컴플라이언스
   "누가 언제 어떤 비밀에 접근했는가?"
```

### 도구 선택 의사결정 트리

```
비밀 관리 도구를 선택해야 한다면?
│
├─ Kubernetes를 쓰나요?
│   ├─ YES → GitOps(ArgoCD/Flux)를 쓰나요?
│   │   ├─ YES → Sealed Secrets (Git에 커밋) + ESO (외부 저장소 동기화)
│   │   └─ NO → ESO 단독으로 충분
│   └─ NO → 서버리스/EC2라면 AWS Secrets Manager 직접 호출
│
├─ 멀티클라우드인가요?
│   ├─ YES → HashiCorp Vault (클라우드 중립)
│   └─ NO → 해당 클라우드의 관리형 서비스 (ASM, GCP SM, AKV)
│
├─ Dynamic Secrets가 필요한가요? (DB 접근 등)
│   ├─ YES → HashiCorp Vault (유일한 선택지)
│   └─ NO → AWS Secrets Manager + 자동 로테이션으로 충분
│
└─ 예산이 제한적인가요?
    ├─ YES → SOPS + Parameter Store (거의 무료)
    └─ NO → Vault + Secrets Manager + ESO (최적 조합)
```

### 면접 대비 핵심 질문

| 질문 | 핵심 답변 |
|------|----------|
| K8s Secret의 한계는? | Base64 인코딩일 뿐 암호화 아님, etcd 평문 저장, 로테이션/감사 없음 |
| Vault Dynamic Secret이란? | 요청 시 임시 자격증명 생성, TTL 후 자동 폐기. 유출돼도 이미 만료 |
| Sealed Secrets vs ESO 차이? | Sealed: Git 커밋용(단방향 암호화), ESO: 외부 저장소 동기화(양방향) |
| SOPS의 장점은? | 값만 암호화 → Git diff 가능, 코드 리뷰 가능, GitOps 친화적 |
| 비밀 로테이션 전략? | Dynamic Secrets > 자동 시간 기반 > 이벤트 기반 > 수동 |
| 12-Factor App과 비밀 관리? | Factor III: 설정은 환경에 저장. 하드코딩 금지, 환경변수/비밀 관리 도구 |

---

## 🔗 다음 단계

### 이 강의와 연결된 내용

| 주제 | 링크 | 관계 |
|------|------|------|
| 신원 및 접근 관리 | [Identity & Access](./01-identity) | "누가" 접근하는지 → 이번 강의는 "무엇을" 보호하는지 |
| AWS 보안 서비스 | [KMS / Secrets Manager](../05-cloud-aws/12-security) | AWS 비밀 관리의 기초 → 이번 강의에서 실무 심화 |
| 파이프라인 보안 | [Pipeline Security](../07-cicd/12-pipeline-security) | CI/CD에서의 비밀 관리 패턴 |
| K8s Config & Secret | [ConfigMap & Secret](../04-kubernetes/04-config-secret) | K8s 기본 Secret → 이번 강의에서 한계와 대안 |

### 다음으로 배울 내용

**[컨테이너 보안 (Container Security)](./03-container-security)**에서는:
- 컨테이너 이미지 취약점 스캔 (Trivy, Grype)
- 런타임 보안 (Falco, Seccomp, AppArmor)
- Pod Security Standards (PSS/PSA)
- 이미지 서명 및 검증 (Cosign, Sigstore)
- Supply Chain Security (SLSA, SBOM)

비밀을 안전하게 관리하는 방법을 배웠으니, 이제 **컨테이너 자체를 안전하게 만드는 방법**을 배워볼게요!

### 추가 학습 리소스

```
공식 문서:
  • HashiCorp Vault 문서: https://developer.hashicorp.com/vault/docs
  • AWS Secrets Manager 문서: https://docs.aws.amazon.com/secretsmanager/
  • External Secrets Operator: https://external-secrets.io/
  • Sealed Secrets: https://github.com/bitnami-labs/sealed-secrets
  • SOPS: https://github.com/getsops/sops

실습 환경:
  • Vault Learn: https://developer.hashicorp.com/vault/tutorials
  • AWS Workshop: https://catalog.workshops.aws/secrets-manager
  • KillerCoda Vault 시나리오: https://killercoda.com/vault
```
