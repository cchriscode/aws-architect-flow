# IAM 전체

> AWS에서 "누가, 무엇을, 어떤 조건에서 할 수 있는지"를 제어하는 게 IAM이에요. [Linux 사용자/그룹](../01-linux/03-users-groups)이 서버 한 대의 접근 통제였다면, IAM은 AWS 클라우드 전체의 접근 통제 시스템이에요.

---

## 🎯 이걸 왜 알아야 하나?

```
실무에서 IAM이 필요한 순간:
• 신규 개발자에게 AWS 계정 권한 부여                → IAM User + Policy
• EC2에서 S3 버킷에 접근해야 함                     → IAM Role (Instance Profile)
• EKS Pod가 DynamoDB에 접근해야 함                  → EKS Pod Identity / IRSA
• 다른 AWS 계정의 리소스에 접근해야 함              → Cross-Account Role (AssumeRole)
• "Access Denied" 에러가 났어요                     → Policy 디버깅
• 보안 감사: "누가 어떤 권한을 갖고 있나요?"        → IAM Access Analyzer
• SSO로 여러 AWS 계정에 로그인하고 싶어요           → Identity Center
```

---

## 🧠 핵심 개념

### 비유: 회사 출입카드 시스템

회사 건물을 생각해보세요.

* **IAM User** = 사원증을 가진 직원. 고유한 사번과 비밀번호가 있어요.
* **IAM Group** = 부서. 개발팀, 운영팀, DBA팀. 부서 단위로 출입 권한을 관리하면 편해요.
* **IAM Role** = 임시 출입증. "오늘만 서버실에 들어갈 수 있는 임시 카드"처럼, 필요할 때만 권한을 빌려 쓰는 거예요.
* **IAM Policy** = 출입카드에 적힌 규칙. "3층 회의실은 OK, 서버실은 NO"처럼 구체적인 허용/거부 목록이에요.
* **Root Account** = 사장님 마스터키. 모든 문을 열 수 있지만, 평소에는 금고에 보관해야 해요.

### IAM 기본 구조

```mermaid
flowchart TB
    subgraph "IAM 구성 요소"
        ROOT["Root Account<br/>(마스터키 - 사용 자제!)"]

        subgraph "누가? (Identity)"
            USER["IAM User<br/>(사람/서비스)"]
            GROUP["IAM Group<br/>(부서/팀)"]
            ROLE["IAM Role<br/>(임시 권한)"]
        end

        subgraph "무엇을 할 수 있나? (Permission)"
            POLICY["IAM Policy<br/>(JSON 규칙)"]
        end
    end

    ROOT -.->|"⚠️ 비상시만"| POLICY
    POLICY -->|"연결"| USER
    POLICY -->|"연결"| GROUP
    POLICY -->|"연결"| ROLE
    USER -->|"소속"| GROUP

    EC2["EC2 인스턴스"] -->|"AssumeRole"| ROLE
    POD["EKS Pod"] -->|"Pod Identity"| ROLE
    LAMBDA["Lambda 함수"] -->|"AssumeRole"| ROLE

    style ROOT fill:#e74c3c,color:#fff
    style ROLE fill:#3498db,color:#fff
    style POLICY fill:#2ecc71,color:#fff
```

### 인증(Authentication) vs 인가(Authorization)

```mermaid
flowchart LR
    REQ["API 요청<br/>(aws s3 ls)"]

    subgraph "1단계: 인증 (Authentication)"
        AUTH["너 누구야?<br/>Access Key / Role / SSO"]
    end

    subgraph "2단계: 인가 (Authorization)"
        AUTHZ["이 작업을 할 수 있어?<br/>Policy 평가"]
    end

    ALLOW["허용"]
    DENY["거부"]

    REQ --> AUTH
    AUTH --> AUTHZ
    AUTHZ -->|"Policy 허용"| ALLOW
    AUTHZ -->|"Policy 거부 또는 미허용"| DENY

    style ALLOW fill:#2ecc71,color:#fff
    style DENY fill:#e74c3c,color:#fff
```

### Policy 평가 순서

```mermaid
flowchart TD
    START["API 요청 도착"] --> EXPLICIT_DENY{"명시적 Deny가<br/>있는가?"}
    EXPLICIT_DENY -->|"Yes"| DENIED["거부"]
    EXPLICIT_DENY -->|"No"| SCP{"SCP(Organization)<br/>허용하는가?"}
    SCP -->|"No"| DENIED
    SCP -->|"Yes"| PERM_BOUNDARY{"Permission Boundary<br/>허용하는가?"}
    PERM_BOUNDARY -->|"No"| DENIED
    PERM_BOUNDARY -->|"Yes"| ALLOW_CHECK{"명시적 Allow가<br/>있는가?"}
    ALLOW_CHECK -->|"Yes"| ALLOWED["허용"]
    ALLOW_CHECK -->|"No"| DENIED

    style DENIED fill:#e74c3c,color:#fff
    style ALLOWED fill:#2ecc71,color:#fff
    style START fill:#3498db,color:#fff
```

**핵심 원칙:** 기본은 전부 거부(Deny)예요. 명시적으로 Allow가 있어야만 허용되고, Deny는 Allow보다 항상 우선해요.

---

## 🔍 상세 설명

### IAM User / Group

IAM User는 AWS에 접근하는 주체이고, Group으로 묶어서 권한을 관리해요.

```bash
# IAM User 생성
aws iam create-user --user-name developer-kim
# {
#     "User": {
#         "Path": "/",
#         "UserName": "developer-kim",
#         "UserId": "AIDA1234567890EXAMPLE",
#         "Arn": "arn:aws:iam::123456789012:user/developer-kim",
#         "CreateDate": "2026-03-13T09:00:00+00:00"
#     }
# }

# 콘솔 로그인 비밀번호 설정
aws iam create-login-profile \
    --user-name developer-kim \
    --password "TempP@ss2026!" \
    --password-reset-required
# → 첫 로그인 시 비밀번호 변경 강제

# 프로그래밍 접근용 Access Key 생성
aws iam create-access-key --user-name developer-kim
# {
#     "AccessKey": {
#         "UserName": "developer-kim",
#         "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
#         "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
#         "Status": "Active"
#     }
# }
# ⚠️ SecretAccessKey는 이때만 표시됨! 반드시 안전하게 저장!

# IAM Group 생성 및 사용자 추가
aws iam create-group --group-name backend-developers
aws iam add-user-to-group \
    --group-name backend-developers \
    --user-name developer-kim

# Group에 Policy 연결 (개별 User 대신 Group에!)
aws iam attach-group-policy \
    --group-name backend-developers \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# 사용자 목록 확인
aws iam list-users --output table
# │   UserName    │                    Arn                       │
# │ admin         │ arn:aws:iam::123456789012:user/admin         │
# │ developer-kim │ arn:aws:iam::123456789012:user/developer-kim │
```

**Group으로 권한을 관리하는 이유:**

```
❌ User마다 개별 Policy 부여
  → 개발자 50명의 권한을 바꾸려면 50번 작업

✅ Group에 Policy 부여, User를 Group에 추가
  → Group Policy만 수정하면 50명 전원에게 적용
  → Linux의 /etc/group과 같은 개념이에요
```

---

### IAM Policy 문법

IAM Policy는 JSON 형태로 "누가 무엇을 할 수 있는지"를 정의해요.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowS3BucketAccess",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::my-app-bucket",
                "arn:aws:s3:::my-app-bucket/*"
            ],
            "Condition": {
                "IpAddress": {
                    "aws:SourceIp": "203.0.113.0/24"
                }
            }
        },
        {
            "Sid": "DenyDeleteBucket",
            "Effect": "Deny",
            "Action": "s3:DeleteBucket",
            "Resource": "*"
        }
    ]
}
```

각 필드 설명:

```bash
# Version: Policy 문법 버전 (항상 "2012-10-17" 사용)
# Statement: 규칙 배열 (여러 개 가능)
#   Sid: 규칙 이름 (식별용, 선택)
#   Effect: "Allow" 또는 "Deny"
#   Action: 허용/거부할 AWS API 액션
#     - "s3:GetObject"        → S3에서 파일 다운로드
#     - "s3:*"                → S3의 모든 작업
#     - "ec2:Describe*"       → EC2 조회 관련 모든 작업 (와일드카드)
#   Resource: 대상 AWS 리소스 (ARN 형태)
#     - "arn:aws:s3:::my-bucket"     → 버킷 자체
#     - "arn:aws:s3:::my-bucket/*"   → 버킷 안의 모든 객체
#     - "*"                          → 모든 리소스 (⚠️ 위험!)
#   Condition: 조건부 허용 (선택)
#     - 특정 IP에서만
#     - MFA 인증된 경우만
#     - 특정 태그가 있는 경우만
```

**ARN(Amazon Resource Name) 형식:**

```
arn:aws:서비스:리전:계정ID:리소스
arn:aws:s3:::my-bucket              → S3 버킷 (리전/계정 없음)
arn:aws:ec2:ap-northeast-2:123456789012:instance/i-1234
arn:aws:iam::123456789012:user/admin  → IAM User (리전 없음, 글로벌 서비스)
arn:aws:iam::123456789012:role/MyRole → IAM Role
```

### Policy의 세 가지 종류

```bash
# 1. AWS Managed Policy (AWS가 만들어 둔 것)
#    → 일반적인 용도에 바로 사용 가능
aws iam list-policies --scope AWS --query 'Policies[?starts_with(PolicyName,`AmazonS3`)].PolicyName'
# [
#     "AmazonS3FullAccess",
#     "AmazonS3ReadOnlyAccess",
#     "AmazonS3OutpostsFullAccess"
# ]

# 2. Customer Managed Policy (직접 만든 것)
#    → 우리 조직에 맞는 세밀한 권한 정의
aws iam create-policy \
    --policy-name MyAppS3Policy \
    --policy-document file://policy.json
# {
#     "Policy": {
#         "PolicyName": "MyAppS3Policy",
#         "Arn": "arn:aws:iam::123456789012:policy/MyAppS3Policy",
#         "PolicyId": "ANPA1234567890EXAMPLE"
#     }
# }

# 3. Inline Policy (User/Group/Role에 직접 내장)
#    → 1:1 관계일 때만, 재사용 불가
#    → 실무에서는 가능하면 Managed Policy 추천
aws iam put-user-policy \
    --user-name developer-kim \
    --policy-name InlineS3Read \
    --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"s3:GetObject","Resource":"*"}]}'
```

```
실무 추천:
• AWS Managed Policy  → 빠르게 시작할 때 (개발/테스트)
• Customer Managed    → 프로덕션에서 최소 권한 적용할 때
• Inline Policy       → 특수한 1:1 매핑이 필요할 때 (거의 안 씀)
```

---

### IAM Role

IAM Role은 **임시 자격 증명**을 제공해요. User처럼 영구 비밀번호/키가 아니라, 짧은 시간 동안만 유효한 토큰을 발급받아 사용해요.

**누가 Role을 쓰나요?**

```
1. EC2 Instance Profile   → EC2 앱이 AWS 서비스 접근 (Access Key 대신!)
2. EKS Pod Identity/IRSA  → K8s Pod가 AWS 서비스 접근 (→ ../04-kubernetes/04-config-secret)
3. Lambda Execution Role   → Lambda 함수 실행 권한
4. Cross-Account Role      → 다른 AWS 계정 리소스 접근
5. SAML/OIDC Federation    → 외부 IdP(Okta, Google) 사용자가 AWS 접근
```

#### EC2 Instance Profile

```bash
# EC2에 IAM Role을 연결하는 흐름:
# Trust Policy 작성 → Role 생성 → Policy 연결 → Instance Profile 생성 → EC2에 연결
# (상세 CLI는 실습 2에서 다뤄요)

# Trust Policy 핵심: "ec2.amazonaws.com 서비스가 이 Role을 Assume할 수 있다"
# { "Principal": { "Service": "ec2.amazonaws.com" }, "Action": "sts:AssumeRole" }

# EC2 안에서 확인 (SSH 접속 후)
aws sts get-caller-identity
# {
#     "UserId": "AROA1234567890:i-0abc123def456",
#     "Account": "123456789012",
#     "Arn": "arn:aws:sts::123456789012:assumed-role/EC2-S3-Access/i-0abc123def456"
# }
# → Access Key 없이도 S3에 접근 가능!
```

#### EKS Pod Identity (최신 방식)

[K8s RBAC](../04-kubernetes/11-rbac)에서 IRSA를 배웠다면, EKS Pod Identity는 그 진화 버전이에요. OIDC Provider 설정 없이 더 간단하게 Pod에 AWS 권한을 부여할 수 있어요.

```bash
# IRSA (기존) vs EKS Pod Identity (최신, 권장)
# IRSA: OIDC Provider 필요 + SA annotation + Trust Policy에 OIDC 조건
# Pod Identity: OIDC 불필요 + Agent만 설치 + 간단한 Trust Policy + Role 재사용 가능

# 1. EKS Pod Identity Agent 설치 (클러스터당 1회)
aws eks create-addon --cluster-name my-cluster --addon-name eks-pod-identity-agent

# 2. IAM Role 생성 (Trust Policy가 IRSA보다 간단!)
cat > pod-identity-trust.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": { "Service": "pods.eks.amazonaws.com" },
        "Action": ["sts:AssumeRole", "sts:TagSession"]
    }]
}
EOF

aws iam create-role --role-name MyApp-Pod-Role \
    --assume-role-policy-document file://pod-identity-trust.json
aws iam attach-role-policy --role-name MyApp-Pod-Role \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# 3. Pod Identity Association 생성 (namespace + SA + Role 연결)
aws eks create-pod-identity-association \
    --cluster-name my-cluster --namespace production \
    --service-account myapp-sa \
    --role-arn arn:aws:iam::123456789012:role/MyApp-Pod-Role

# 4. K8s에서 ServiceAccount 생성 (annotation 불필요!)
kubectl create serviceaccount myapp-sa -n production

# 5. Pod에서 확인
kubectl exec myapp-pod -n production -- aws sts get-caller-identity
# → "Arn": "arn:aws:sts::123456789012:assumed-role/MyApp-Pod-Role/eks-my-cluster-..."
```

#### Cross-Account Role (타 계정 접근)

```bash
# 시나리오: 개발 계정(111111111111)에서 프로덕션 계정(222222222222)의 S3에 접근

# [프로덕션 계정에서] Trust Policy에 개발 계정 허용 + MFA 조건
# Principal: "AWS": "arn:aws:iam::111111111111:root"
# Condition: "aws:MultiFactorAuthPresent": "true"
# → 개발 계정의 사용자가 MFA 인증 후에만 이 Role을 사용할 수 있음

# [개발 계정에서] Role을 Assume해서 사용
aws sts assume-role \
    --role-arn arn:aws:iam::222222222222:role/CrossAccountS3Access \
    --role-session-name dev-session
# {
#     "Credentials": {
#         "AccessKeyId": "ASIA1234567890EXAMPLE",
#         "SecretAccessKey": "temporary-secret-key",
#         "SessionToken": "FwoGZXIvYXdzE...(매우 긴 토큰)...",
#         "Expiration": "2026-03-13T10:00:00+00:00"
#     }
# }

# 임시 자격 증명으로 프로덕션 S3 접근
export AWS_ACCESS_KEY_ID="ASIA1234567890EXAMPLE"
export AWS_SECRET_ACCESS_KEY="temporary-secret-key"
export AWS_SESSION_TOKEN="FwoGZXIvYXdzE..."

aws s3 ls s3://production-data-bucket/
# 2026-03-12 backup/
# 2026-03-13 logs/
```

---

### STS (Security Token Service)

STS는 **임시 자격 증명**을 발급하는 서비스예요. IAM Role의 실제 동작 메커니즘이에요.

```bash
# 현재 내가 누구인지 확인 (가장 많이 쓰는 STS 명령어!)
aws sts get-caller-identity
# IAM User: "Arn": "arn:aws:iam::123456789012:user/developer-kim"
# Role 사용 중: "Arn": "arn:aws:sts::123456789012:assumed-role/EC2-S3-Access/my-session"
# → "assumed-role"이 보이면 Role을 사용 중이라는 뜻!

# AssumeRole - 임시 자격 증명 발급
aws sts assume-role \
    --role-arn arn:aws:iam::123456789012:role/AdminRole \
    --role-session-name my-admin-session \
    --duration-seconds 3600
# → 1시간(3600초) 동안 유효, 기본 1시간/최대 12시간
# → Access Key + Secret Key + Session Token 3개가 모두 필요!
```

**영구 Access Key vs 임시 자격 증명:**

```
영구 Key: 유출 → 즉시 악용, 수동 비활성화 필요, 로테이션 누락 위험
임시 토큰: 1~12시간 자동 만료, 유출 피해 제한, 매번 새로 발급
→ 실무에서는 항상 Role/STS를 우선 사용!
```

---

### IAM 보안 모범 사례

#### Root 계정 보호

```bash
# Root 계정 = AWS 계정의 사장님 마스터키
# → 모든 AWS 서비스와 리소스에 무제한 접근 가능
# → IAM Policy로도 제한 불가!

# ⚠️ Root 계정으로 해야만 하는 작업 (이것만 Root로!)
# - AWS 계정 설정 변경 (계정 이름, 이메일)
# - IAM 첫 번째 관리자 사용자 생성
# - 결제 정보 변경
# - AWS Support 플랜 변경
# - 계정 폐쇄

# Root 계정 보안 체크리스트:
# 1. MFA 활성화 (필수!)
# 2. Access Key 삭제 (생성하지도 말 것)
# 3. 강력한 비밀번호 설정
# 4. 일상 작업에 Root 사용 금지
```

#### 최소 권한 원칙 (Least Privilege)

```bash
# 필요한 권한만, 필요한 리소스에만, 필요한 기간만

# ❌ 나쁜 예: 모든 것을 허용
# {
#     "Effect": "Allow",
#     "Action": "*",
#     "Resource": "*"
# }

# ✅ 좋은 예: 필요한 것만 허용
# {
#     "Effect": "Allow",
#     "Action": [
#         "s3:GetObject",
#         "s3:PutObject"
#     ],
#     "Resource": "arn:aws:s3:::my-app-bucket/uploads/*"
# }

# IAM Access Analyzer로 미사용 권한 찾기
aws accessanalyzer list-findings \
    --analyzer-arn arn:aws:access-analyzer:ap-northeast-2:123456789012:analyzer/my-analyzer
# → 외부에서 접근 가능한 리소스, 사용하지 않는 권한을 분석

# Policy 시뮬레이션 (이 사용자가 이 작업을 할 수 있는지 테스트)
aws iam simulate-principal-policy \
    --policy-source-arn arn:aws:iam::123456789012:user/developer-kim \
    --action-names s3:GetObject s3:DeleteObject \
    --resource-arns arn:aws:s3:::my-app-bucket/test.txt
# {
#     "EvaluationResults": [
#         {
#             "EvalActionName": "s3:GetObject",
#             "EvalDecision": "allowed",
#             "MatchedStatements": [...]
#         },
#         {
#             "EvalActionName": "s3:DeleteObject",
#             "EvalDecision": "implicitDeny",
#             "MatchedStatements": []
#         }
#     ]
# }
# → s3:GetObject는 허용, s3:DeleteObject는 거부됨을 미리 확인!
```

#### Access Key 관리

```bash
# Access Key 현황 + 마지막 사용 일시 확인
aws iam list-access-keys --user-name developer-kim
# → AccessKeyId, Status(Active/Inactive), CreateDate 확인

aws iam get-access-key-last-used --access-key-id AKIAIOSFODNN7EXAMPLE
# → LastUsedDate, ServiceName, Region 확인

# 로테이션 절차: 새 키 생성 → 앱 교체 → 이전 키 비활성화 → 삭제
aws iam create-access-key --user-name developer-kim
aws iam update-access-key --user-name developer-kim \
    --access-key-id AKIAIOSFODNN7EXAMPLE --status Inactive
aws iam delete-access-key --user-name developer-kim \
    --access-key-id AKIAIOSFODNN7EXAMPLE
# ⚠️ Access Key는 최대 2개까지 (로테이션 중 신/구 키 동시 운영용)
```

#### 비밀번호 정책

```bash
# 계정 전체 비밀번호 정책 설정
aws iam update-account-password-policy \
    --minimum-password-length 14 \
    --require-symbols --require-numbers \
    --require-uppercase-characters --require-lowercase-characters \
    --max-password-age 90 \
    --password-reuse-prevention 12 \
    --allow-users-to-change-password

# 현재 정책 확인
aws iam get-account-password-policy
# → MinimumPasswordLength: 14, MaxPasswordAge: 90, PasswordReusePrevention: 12
```

---

### Identity Center (SSO)

여러 AWS 계정에 하나의 로그인으로 접근할 수 있게 해주는 서비스예요. AWS Organizations와 함께 사용해요.

```bash
# 기존: 계정별 IAM User + 비밀번호 + Access Key (3계정 = 3세트...)
# SSO:  SSO 포털에 한 번 로그인 → 계정 선택 → 임시 자격 증명 자동 발급!

# AWS CLI에서 SSO 설정
aws configure sso
# SSO start URL: https://my-company.awsapps.com/start
# → 브라우저에서 SSO 로그인 페이지가 열림

# SSO 프로필로 AWS 명령어 실행
aws s3 ls --profile my-company-dev
aws s3 ls --profile my-company-prod
aws sso login --profile my-company-dev    # 토큰 갱신
```

**SAML / OIDC Federation:**

```bash
# 회사에 이미 IdP(Okta, Azure AD, Google Workspace)가 있으면
# → IAM User를 만들지 않고 외부 IdP 연동!
# SAML: 기업용 SSO (Okta, Azure AD) / OIDC: 웹 표준 (Google, GitHub)
# → EKS IRSA/Pod Identity도 OIDC를 사용!

# OIDC Provider 생성 (EKS에서 자주 사용)
aws iam create-open-id-connect-provider \
    --url https://oidc.eks.ap-northeast-2.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 9e99a48a9960b14926bb7f3b02e22da2b0ab7280
```

---

## 💻 실습 예제

### 실습 1: IAM User 생성 + 최소 권한 Policy 부여

```bash
# 시나리오: 인턴에게 S3 특정 버킷의 읽기 권한만 부여

# 1. Policy 문서 작성 (버킷 ListBucket + 객체 GetObject만 허용, 삭제/업로드 Deny)
cat > intern-s3-readonly.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        { "Sid": "ListSpecificBucket", "Effect": "Allow",
          "Action": ["s3:ListBucket"], "Resource": "arn:aws:s3:::dev-shared-bucket" },
        { "Sid": "ReadObjectsInBucket", "Effect": "Allow",
          "Action": ["s3:GetObject"], "Resource": "arn:aws:s3:::dev-shared-bucket/*" },
        { "Sid": "DenyWriteDelete", "Effect": "Deny",
          "Action": ["s3:DeleteObject", "s3:PutObject"], "Resource": "*" }
    ]
}
EOF

# 2. User 생성 + Policy 적용
aws iam create-user --user-name intern-park
aws iam create-login-profile --user-name intern-park \
    --password "TempIntern2026!" --password-reset-required
aws iam create-policy --policy-name InternS3ReadOnly \
    --policy-document file://intern-s3-readonly.json
aws iam attach-user-policy --user-name intern-park \
    --policy-arn arn:aws:iam::123456789012:policy/InternS3ReadOnly

# 3. 권한 테스트 (simulate-principal-policy)
aws iam simulate-principal-policy \
    --policy-source-arn arn:aws:iam::123456789012:user/intern-park \
    --action-names s3:GetObject s3:PutObject s3:DeleteObject \
    --resource-arns arn:aws:s3:::dev-shared-bucket/test.txt
# s3:GetObject    → allowed       ✅
# s3:PutObject    → explicitDeny  ✅
# s3:DeleteObject → explicitDeny  ✅

# 4. 정리
aws iam detach-user-policy --user-name intern-park \
    --policy-arn arn:aws:iam::123456789012:policy/InternS3ReadOnly
aws iam delete-login-profile --user-name intern-park
aws iam delete-user --user-name intern-park
aws iam delete-policy --policy-arn arn:aws:iam::123456789012:policy/InternS3ReadOnly
```

### 실습 2: EC2 Instance Profile 설정

```bash
# 시나리오: EC2에서 실행되는 앱이 S3와 SQS에 접근해야 함

# 1. Trust Policy + 권한 Policy 작성
cat > ec2-trust.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": { "Service": "ec2.amazonaws.com" },
        "Action": "sts:AssumeRole"
    }]
}
EOF

cat > app-permissions.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "S3Access",
            "Effect": "Allow",
            "Action": ["s3:GetObject", "s3:PutObject"],
            "Resource": "arn:aws:s3:::my-app-data/*"
        },
        {
            "Sid": "SQSAccess",
            "Effect": "Allow",
            "Action": ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"],
            "Resource": "arn:aws:sqs:ap-northeast-2:123456789012:my-app-queue"
        }
    ]
}
EOF

# 2. Role + Instance Profile 생성 + EC2에 연결
aws iam create-role --role-name MyApp-EC2-Role \
    --assume-role-policy-document file://ec2-trust.json
aws iam create-policy --policy-name MyAppPermissions \
    --policy-document file://app-permissions.json
aws iam attach-role-policy --role-name MyApp-EC2-Role \
    --policy-arn arn:aws:iam::123456789012:policy/MyAppPermissions
aws iam create-instance-profile --instance-profile-name MyApp-EC2-Profile
aws iam add-role-to-instance-profile \
    --instance-profile-name MyApp-EC2-Profile --role-name MyApp-EC2-Role
aws ec2 associate-iam-instance-profile \
    --instance-id i-0abc123def456 \
    --iam-instance-profile Name=MyApp-EC2-Profile

# 3. EC2 내에서 확인
ssh ec2-user@my-ec2-instance
aws sts get-caller-identity
# → assumed-role/MyApp-EC2-Role/i-0abc123def456

aws s3 cp test.txt s3://my-app-data/test.txt
# upload: ./test.txt to s3://my-app-data/test.txt  ✅

aws ec2 describe-instances
# An error occurred (UnauthorizedOperation)  ✅ (EC2 권한 없음!)
```

### 실습 3: Cross-Account AssumeRole

```bash
# 시나리오: 개발 계정에서 프로덕션 계정의 DynamoDB 테이블 조회

# [프로덕션 계정: 222222222222에서 실행]
# 1. Trust Policy + Role 생성
cat > cross-trust.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": { "AWS": "arn:aws:iam::111111111111:role/DevOps-Role" },
        "Action": "sts:AssumeRole",
        "Condition": { "StringEquals": { "sts:ExternalId": "cross-account-2026" } }
    }]
}
EOF

aws iam create-role --role-name ProdDynamoDBReadOnly \
    --assume-role-policy-document file://cross-trust.json
aws iam attach-role-policy --role-name ProdDynamoDBReadOnly \
    --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess

# [개발 계정: 111111111111에서 실행]
# 2. AssumeRole로 임시 자격 증명 획득 + 환경 변수 설정
CREDS=$(aws sts assume-role \
    --role-arn arn:aws:iam::222222222222:role/ProdDynamoDBReadOnly \
    --role-session-name prod-read-session \
    --external-id cross-account-2026 \
    --query 'Credentials' --output json)

export AWS_ACCESS_KEY_ID=$(echo $CREDS | jq -r '.AccessKeyId')
export AWS_SECRET_ACCESS_KEY=$(echo $CREDS | jq -r '.SecretAccessKey')
export AWS_SESSION_TOKEN=$(echo $CREDS | jq -r '.SessionToken')

# 3. 프로덕션 DynamoDB 조회
aws sts get-caller-identity
# { "Account": "222222222222",
#   "Arn": "arn:aws:sts::222222222222:assumed-role/ProdDynamoDBReadOnly/prod-read-session" }

aws dynamodb list-tables --region ap-northeast-2
# { "TableNames": ["prod-users", "prod-orders"] }

# 4. 세션 정리
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
```

---

## 🏢 실무에서는?

### 시나리오 1: 팀별 권한 체계 설계

```bash
# 조직 구조:
# - Platform팀 (3명): AWS 인프라 전체 관리
# - Backend팀 (10명): ECS/EKS 배포, S3, DynamoDB, SQS 사용
# - Frontend팀 (5명): S3 정적 호스팅, CloudFront 관리
# - Data팀 (3명): Glue, Athena, S3 데이터 레이크 접근

# IAM 설계:
# 1. Group 기반으로 관리 (User별 Policy 금지!)
# 2. 환경별 분리 (dev/staging/prod 각각 다른 AWS 계정)
# 3. Identity Center로 SSO (IAM User 대신!)

# Group별 Policy 예시:
# Platform팀 → AdministratorAccess (프로덕션은 MFA 필수)
# Backend팀  → 커스텀 Policy (ECS + S3 + DynamoDB + SQS)
# Frontend팀 → 커스텀 Policy (S3 + CloudFront + Route53)
# Data팀     → 커스텀 Policy (Glue + Athena + S3 데이터 버킷)

# ⚠️ 핵심: 프로덕션 계정은 반드시 MFA 조건 추가!
# Condition:
#   "Bool": { "aws:MultiFactorAuthPresent": "true" }
```

### 시나리오 2: CI/CD 파이프라인 권한 (ECR + EKS)

```bash
# GitHub Actions에서 ECR에 이미지 push + EKS에 배포
# 참고: ECR 인증 → ../03-containers/07-registry

# 1. GitHub Actions용 OIDC Provider 생성 (Access Key 대신!)
aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# 2. Trust Policy - 우리 repo에서만 이 Role 사용 가능!
cat > github-actions-trust.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {
            "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
        },
        "Action": "sts:AssumeRoleWithWebIdentity",
        "Condition": {
            "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
            "StringLike": { "token.actions.githubusercontent.com:sub": "repo:my-org/my-app:*" }
        }
    }]
}
EOF

# 3. 권한: ECR push + EKS 배포 (최소 권한)
# ECR: GetAuthorizationToken, BatchCheckLayerAvailability, PutImage,
#      InitiateLayerUpload, UploadLayerPart, CompleteLayerUpload
# EKS: DescribeCluster (kubectl 접속용)

# → Access Key를 GitHub Secrets에 저장하는 대신
# → OIDC로 임시 자격 증명을 매번 발급받아 사용!
# → 키 유출 위험 없음!
```

### 시나리오 3: 보안 사고 대응 (Access Key 유출)

```bash
# "Access Key가 GitHub에 실수로 커밋됐어요!"

# 1. 즉시 키 비활성화 (삭제보다 먼저!)
aws iam update-access-key --user-name developer-kim \
    --access-key-id AKIAIOSFODNN7EXAMPLE --status Inactive

# 2. 해당 키로 수행된 작업 확인 (CloudTrail)
aws cloudtrail lookup-events \
    --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=AKIAIOSFODNN7EXAMPLE \
    --max-results 20

# 3. 키 삭제 + 필요 시 새 키 발급
aws iam delete-access-key --user-name developer-kim \
    --access-key-id AKIAIOSFODNN7EXAMPLE

# 4. 해당 사용자의 기존 세션 모두 무효화 (Inline Deny Policy)
aws iam put-user-policy --user-name developer-kim \
    --policy-name DenyAllUntilReview \
    --policy-document '{
        "Version":"2012-10-17",
        "Statement":[{"Effect":"Deny","Action":"*","Resource":"*",
        "Condition":{"DateLessThan":{"aws:TokenIssueTime":"2026-03-13T12:00:00Z"}}}]
    }'
# → 특정 시각 이전에 발급된 모든 토큰 무효화

# 5. 재발 방지: git-secrets hook 설정 + Role/SSO 전환 + Access Analyzer 활성화
```

---

## ⚠️ 자주 하는 실수

### 1. Root 계정을 일상적으로 사용

```bash
# ❌ Root 계정으로 EC2 만들고, S3 업로드하고, 일상 작업 수행
# → Root는 MFA로도 제한이 안 되는 무제한 권한!
# → 키 유출 시 계정 전체가 위험!

# ✅ Root는 MFA 설정 후 금고에 보관
# → 일상 작업은 IAM User (또는 Identity Center SSO)로
# → AdministratorAccess Policy가 있어도 Root보다 안전 (Policy로 제한 가능)
```

### 2. EC2에 Access Key를 하드코딩

```bash
# ❌ EC2 안에 ~/.aws/credentials 파일에 Access Key 저장
# 또는 코드에 하드코딩
# AWS_ACCESS_KEY_ID=AKIA...
# AWS_SECRET_ACCESS_KEY=wJalr...

# ✅ EC2 Instance Profile (IAM Role) 사용
# → Access Key가 아예 존재하지 않음
# → EC2 메타데이터 서비스를 통해 임시 자격 증명 자동 발급
# → AWS SDK가 자동으로 인식
```

### 3. 와일드카드(*) 남용

```bash
# ❌ 개발 편의를 위해 모든 권한 부여
# {
#     "Effect": "Allow",
#     "Action": "s3:*",
#     "Resource": "*"
# }
# → 모든 S3 버킷의 모든 작업 허용 (삭제 포함!)

# ✅ 필요한 Action과 Resource만 명시
# {
#     "Effect": "Allow",
#     "Action": ["s3:GetObject", "s3:PutObject"],
#     "Resource": "arn:aws:s3:::my-app-bucket/uploads/*"
# }
# → 특정 버킷의 uploads 폴더에서 읽기/쓰기만 허용
```

### 4. Access Key를 로테이션하지 않음

```bash
# ❌ 1년 전에 만든 Access Key를 계속 사용
# → 유출 여부를 알 수 없고, 유출 시 피해 기간이 길어짐

# ✅ 90일마다 Access Key 로테이션
# 더 좋은 방법: Access Key 대신 IAM Role 또는 SSO 사용

# 오래된 키 찾기
aws iam generate-credential-report
aws iam get-credential-report --output text --query Content | base64 -d | \
    awk -F, '{if (NR>1 && $9=="true") print $1, $10}'
# → access_key_1이 Active인 사용자와 마지막 로테이션 날짜 확인
```

### 5. Policy에서 버킷과 객체를 혼동

```bash
# ❌ Resource에 버킷만 지정하고 객체 작업을 허용
# {
#     "Effect": "Allow",
#     "Action": "s3:GetObject",
#     "Resource": "arn:aws:s3:::my-bucket"     ← 버킷 자체!
# }
# → s3:GetObject는 객체에 대한 작업이라 동작하지 않음!

# ✅ 버킷 작업과 객체 작업의 Resource를 분리
# {
#     "Statement": [
#         {
#             "Action": "s3:ListBucket",
#             "Resource": "arn:aws:s3:::my-bucket"         ← 버킷
#         },
#         {
#             "Action": ["s3:GetObject", "s3:PutObject"],
#             "Resource": "arn:aws:s3:::my-bucket/*"        ← 객체
#         }
#     ]
# }
```

---

## 📝 정리

### IAM 구성 요소 요약

```
구성 요소         설명                              언제 사용?
─────────────────────────────────────────────────────────────
IAM User         사람/서비스의 영구 계정            콘솔 로그인, CLI 접근
IAM Group        User를 묶어서 권한 관리            팀/부서 단위 관리
IAM Role         임시 자격 증명                     EC2, Lambda, EKS Pod, Cross-Account
IAM Policy       JSON 형태의 권한 규칙              모든 곳에 연결
Instance Profile EC2에 Role을 연결하는 래퍼         EC2에서 AWS 서비스 접근
STS              임시 자격 증명 발급 서비스          AssumeRole, Federation
Identity Center  SSO (단일 로그인)                   다중 계정 관리
```

### 핵심 CLI 명령어

```bash
aws sts get-caller-identity                          # 내가 누구인지 확인
aws iam create-user --user-name NAME                 # User 생성
aws iam create-group --group-name NAME               # Group 생성
aws iam add-user-to-group --group-name G --user-name U  # Group에 추가
aws iam attach-group-policy --group-name G --policy-arn ARN  # Group에 Policy
aws iam create-role --role-name R --assume-role-policy-document file://t.json
aws iam attach-role-policy --role-name R --policy-arn ARN
aws iam create-policy --policy-name P --policy-document file://p.json
aws iam simulate-principal-policy --policy-source-arn ARN --action-names A1 A2
aws iam list-access-keys --user-name NAME            # Access Key 확인
aws sts assume-role --role-arn ARN --role-session-name S  # Role 전환
```

### 보안 체크리스트

```
✅ Root 계정에 MFA 활성화, Access Key 없음
✅ 일상 작업은 IAM User 또는 Identity Center(SSO)로
✅ EC2/Lambda/EKS Pod는 IAM Role 사용 (Access Key 금지)
✅ Policy는 최소 권한 원칙 (필요한 Action + 특정 Resource)
✅ User 대신 Group에 Policy 연결
✅ Access Key 90일 로테이션 / 비밀번호 정책(14자+, 90일 만료)
✅ CloudTrail + IAM Access Analyzer 활성화
```

### K8s RBAC과의 비교

```
AWS IAM           K8s RBAC                       연결 고리
──────────────────────────────────────────────────────────
IAM User        → User (X.509)
IAM Group       → Group (aws-auth 매핑)
IAM Role        → ServiceAccount               ← EKS Pod Identity / IRSA
IAM Policy      → Role / ClusterRole
Policy 연결     → RoleBinding / ClusterRoleBinding
STS AssumeRole  → TokenRequest API

→ 참고: K8s RBAC → ../04-kubernetes/11-rbac
→ 참고: Linux 사용자/그룹 → ../01-linux/03-users-groups
```

---

## 🔗 다음 강의 → [02-vpc](./02-vpc)

다음은 **VPC (Virtual Private Cloud)** -- AWS에서 나만의 네트워크를 만드는 방법이에요. IAM이 "누가 AWS를 쓸 수 있는지"를 제어했다면, VPC는 "AWS 리소스들이 어떤 네트워크에서 어떻게 통신하는지"를 제어해요. 서브넷, 라우팅 테이블, 보안 그룹, NAT Gateway 등 클라우드 네트워킹의 핵심을 배워볼게요.
