# IAM Complete Guide

> IAM is what controls "who, what, and under what conditions can do what" in AWS. If [Linux users/groups](../01-linux/03-users-groups) was access control for a single server, IAM is the access control system for your entire AWS cloud.

---

## 🎯 Why Do You Need to Know This?

```
Real-world scenarios where IAM is essential:
• Granting AWS account permissions to new developers      → IAM User + Policy
• EC2 instance needs access to S3 bucket                 → IAM Role (Instance Profile)
• EKS Pod needs to access DynamoDB                       → EKS Pod Identity / IRSA
• Need access to resources in a different AWS account     → Cross-Account Role (AssumeRole)
• Getting "Access Denied" errors                         → Policy debugging
• Security audit: "Who has what permissions?"            → IAM Access Analyzer
• Want to login to multiple AWS accounts with SSO        → Identity Center
```

---

## 🧠 Core Concepts

### Analogy: Company Building Access Card System

Think of your company building:

* **IAM User** = Employee with ID badge. Has unique employee number and password.
* **IAM Group** = Department. Dev team, Ops team, DBA team. Managing access by department is efficient.
* **IAM Role** = Temporary access pass. Like "temporary server room access for today only", where you borrow permissions temporarily when needed.
* **IAM Policy** = Rules written on the access card. Like "3rd floor conference room OK, server room NO" - a specific allow/deny list.
* **Root Account** = CEO's master key. Opens every door, but should be locked in a safe normally.

### IAM Basic Structure

```mermaid
flowchart TB
    subgraph "IAM Components"
        ROOT["Root Account<br/>(Master key - use sparingly!)"]

        subgraph "Who? (Identity)"
            USER["IAM User<br/>(Person/Service)"]
            GROUP["IAM Group<br/>(Team/Department)"]
            ROLE["IAM Role<br/>(Temporary permissions)"]
        end

        subgraph "What can they do? (Permission)"
            POLICY["IAM Policy<br/>(JSON rules)"]
        end
    end

    ROOT -.->|"⚠️ Emergency only"| POLICY
    POLICY -->|"Attach"| USER
    POLICY -->|"Attach"| GROUP
    POLICY -->|"Attach"| ROLE
    USER -->|"Belong to"| GROUP

    EC2["EC2 Instance"] -->|"AssumeRole"| ROLE
    POD["EKS Pod"] -->|"Pod Identity"| ROLE
    LAMBDA["Lambda Function"] -->|"AssumeRole"| ROLE

    style ROOT fill:#e74c3c,color:#fff
    style ROLE fill:#3498db,color:#fff
    style POLICY fill:#2ecc71,color:#fff
```

### Authentication vs Authorization

```mermaid
flowchart LR
    REQ["API Request<br/>(aws s3 ls)"]

    subgraph "Step 1: Authentication"
        AUTH["Who are you?<br/>Access Key / Role / SSO"]
    end

    subgraph "Step 2: Authorization"
        AUTHZ["Can you do this?<br/>Policy evaluation"]
    end

    ALLOW["Allow"]
    DENY["Deny"]

    REQ --> AUTH
    AUTH --> AUTHZ
    AUTHZ -->|"Policy allows"| ALLOW
    AUTHZ -->|"Policy denies or no permission"| DENY

    style ALLOW fill:#2ecc71,color:#fff
    style DENY fill:#e74c3c,color:#fff
```

### Policy Evaluation Order

```mermaid
flowchart TD
    START["API request arrives"] --> EXPLICIT_DENY{"Is there an<br/>explicit Deny?"}
    EXPLICIT_DENY -->|"Yes"| DENIED["Deny"]
    EXPLICIT_DENY -->|"No"| SCP{"Does SCP (Organization)<br/>allow?"}
    SCP -->|"No"| DENIED
    SCP -->|"Yes"| PERM_BOUNDARY{"Does Permission Boundary<br/>allow?"}
    PERM_BOUNDARY -->|"No"| DENIED
    PERM_BOUNDARY -->|"Yes"| ALLOW_CHECK{"Is there an<br/>explicit Allow?"}
    ALLOW_CHECK -->|"Yes"| ALLOWED["Allow"]
    ALLOW_CHECK -->|"No"| DENIED

    style DENIED fill:#e74c3c,color:#fff
    style ALLOWED fill:#2ecc71,color:#fff
    style START fill:#3498db,color:#fff
```

**Core principle:** Default is deny for everything. You need explicit Allow, and Deny always takes precedence over Allow.

---

## 🔍 Detailed Explanation

### IAM User / Group

IAM User is the principal accessing AWS, and we manage permissions by grouping them.

```bash
# Create IAM User
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

# Set console login password
aws iam create-login-profile \
    --user-name developer-kim \
    --password "TempP@ss2026!" \
    --password-reset-required
# → Forces password change on first login

# Create Access Key for programmatic access
aws iam create-access-key --user-name developer-kim
# {
#     "AccessKey": {
#         "UserName": "developer-kim",
#         "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
#         "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
#         "Status": "Active"
#     }
# }
# ⚠️ SecretAccessKey only shown now! Store it securely!

# Create IAM Group and add user
aws iam create-group --group-name backend-developers
aws iam add-user-to-group \
    --group-name backend-developers \
    --user-name developer-kim

# Attach Policy to Group (not individual User!)
aws iam attach-group-policy \
    --group-name backend-developers \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# List users
aws iam list-users --output table
# │   UserName    │                    Arn                       │
# │ admin         │ arn:aws:iam::123456789012:user/admin         │
# │ developer-kim │ arn:aws:iam::123456789012:user/developer-kim │
```

**Why manage permissions via Groups:**

```
❌ Assign Policy to each User individually
  → To change 50 developers' permissions, 50 operations needed

✅ Assign Policy to Group, add Users to Group
  → Modify Group Policy once, applies to all 50
  → Same concept as Linux /etc/group
```

---

### IAM Policy Syntax

IAM Policy is in JSON format defining "who can do what".

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

Field explanations:

```bash
# Version: Policy syntax version (always use "2012-10-17")
# Statement: Array of rules (multiple allowed)
#   Sid: Rule name (for identification, optional)
#   Effect: "Allow" or "Deny"
#   Action: AWS API actions to allow/deny
#     - "s3:GetObject"        → Download file from S3
#     - "s3:*"                → All S3 operations
#     - "ec2:Describe*"       → All EC2 describe operations (wildcard)
#   Resource: Target AWS resources (ARN format)
#     - "arn:aws:s3:::my-bucket"     → Bucket itself
#     - "arn:aws:s3:::my-bucket/*"   → All objects in bucket
#     - "*"                          → All resources (⚠️ dangerous!)
#   Condition: Conditional permission (optional)
#     - Only from specific IP
#     - Only with MFA
#     - Only with specific tags
```

**ARN (Amazon Resource Name) format:**

```
arn:aws:service:region:account-id:resource
arn:aws:s3:::my-bucket              → S3 bucket (no region/account)
arn:aws:ec2:ap-northeast-2:123456789012:instance/i-1234
arn:aws:iam::123456789012:user/admin  → IAM User (no region, global service)
arn:aws:iam::123456789012:role/MyRole → IAM Role
```

### Three Types of Policies

```bash
# 1. AWS Managed Policy (created by AWS)
#    → Ready to use for common scenarios
aws iam list-policies --scope AWS --query 'Policies[?starts_with(PolicyName,`AmazonS3`)].PolicyName'
# [
#     "AmazonS3FullAccess",
#     "AmazonS3ReadOnlyAccess",
#     "AmazonS3OutpostsFullAccess"
# ]

# 2. Customer Managed Policy (you create it)
#    → Fine-grained permissions for your organization
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

# 3. Inline Policy (embedded directly in User/Group/Role)
#    → Only for 1:1 relationships, not reusable
#    → In production, prefer Managed Policy
aws iam put-user-policy \
    --user-name developer-kim \
    --policy-name InlineS3Read \
    --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"s3:GetObject","Resource":"*"}]}'
```

```
Real-world recommendation:
• AWS Managed Policy  → When starting quickly (dev/test)
• Customer Managed    → For production with least privilege
• Inline Policy       → For special 1:1 mappings (rarely used)
```

---

### IAM Role

IAM Role provides **temporary credentials**. Unlike User with permanent password/key, it issues tokens valid for short periods.

**Who uses Roles?**

```
1. EC2 Instance Profile   → EC2 app accessing AWS services (instead of Access Key!)
2. EKS Pod Identity/IRSA  → K8s Pod accessing AWS services (→ ../04-kubernetes/04-config-secret)
3. Lambda Execution Role   → Lambda function execution permissions
4. Cross-Account Role      → Accessing resources in different AWS account
5. SAML/OIDC Federation    → External IdP (Okta, Google) users accessing AWS
```

#### EC2 Instance Profile

```bash
# Flow to attach IAM Role to EC2:
# Write Trust Policy → Create Role → Attach Policy → Create Instance Profile → Attach to EC2
# (Detailed CLI covered in Lab 2)

# Trust Policy core: "ec2.amazonaws.com service can Assume this Role"
# { "Principal": { "Service": "ec2.amazonaws.com" }, "Action": "sts:AssumeRole" }

# Verify inside EC2 (after SSH)
aws sts get-caller-identity
# {
#     "UserId": "AROA1234567890:i-0abc123def456",
#     "Account": "123456789012",
#     "Arn": "arn:aws:sts::123456789012:assumed-role/EC2-S3-Access/i-0abc123def456"
# }
# → Can access S3 without Access Key!
```

#### EKS Pod Identity (Latest approach)

If you learned IRSA in [K8s RBAC](../04-kubernetes/11-rbac), EKS Pod Identity is its evolved version. You can grant AWS permissions to Pods more simply without OIDC Provider setup.

```bash
# IRSA (existing) vs EKS Pod Identity (latest, recommended)
# IRSA: Needs OIDC Provider + SA annotation + Trust Policy with OIDC condition
# Pod Identity: No OIDC needed + Agent only + simple Trust Policy + Role reusable

# 1. Install EKS Pod Identity Agent (once per cluster)
aws eks create-addon --cluster-name my-cluster --addon-name eks-pod-identity-agent

# 2. Create IAM Role (simpler Trust Policy than IRSA!)
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

# 3. Create Pod Identity Association (connect namespace + SA + Role)
aws eks create-pod-identity-association \
    --cluster-name my-cluster --namespace production \
    --service-account myapp-sa \
    --role-arn arn:aws:iam::123456789012:role/MyApp-Pod-Role

# 4. Create ServiceAccount in K8s (no annotation needed!)
kubectl create serviceaccount myapp-sa -n production

# 5. Verify in Pod
kubectl exec myapp-pod -n production -- aws sts get-caller-identity
# → "Arn": "arn:aws:sts::123456789012:assumed-role/MyApp-Pod-Role/eks-my-cluster-..."
```

#### Cross-Account Role (Accessing other accounts)

```bash
# Scenario: Access S3 in production account (222222222222) from dev account (111111111111)

# [In production account] Trust Policy allows dev account + MFA condition
# Principal: "AWS": "arn:aws:iam::111111111111:root"
# Condition: "aws:MultiFactorAuthPresent": "true"
# → Dev account users can only use this Role after MFA

# [In dev account] Assume Role and use it
aws sts assume-role \
    --role-arn arn:aws:iam::222222222222:role/CrossAccountS3Access \
    --role-session-name dev-session
# {
#     "Credentials": {
#         "AccessKeyId": "ASIA1234567890EXAMPLE",
#         "SecretAccessKey": "temporary-secret-key",
#         "SessionToken": "FwoGZXIvYXdzE...(very long token)...",
#         "Expiration": "2026-03-13T10:00:00+00:00"
#     }
# }

# Access production S3 with temporary credentials
export AWS_ACCESS_KEY_ID="ASIA1234567890EXAMPLE"
export AWS_SECRET_ACCESS_KEY="temporary-secret-key"
export AWS_SESSION_TOKEN="FwoGZXIvYXdzE..."

aws s3 ls s3://production-data-bucket/
# 2026-03-12 backup/
# 2026-03-13 logs/
```

---

### STS (Security Token Service)

STS is the service that issues **temporary credentials**. It's the actual mechanism behind IAM Role.

```bash
# Most used STS command - find out who you are right now!
aws sts get-caller-identity
# IAM User: "Arn": "arn:aws:iam::123456789012:user/developer-kim"
# Using Role: "Arn": "arn:aws:sts::123456789012:assumed-role/EC2-S3-Access/my-session"
# → If you see "assumed-role", you're using a Role!

# AssumeRole - issue temporary credentials
aws sts assume-role \
    --role-arn arn:aws:iam::123456789012:role/AdminRole \
    --role-session-name my-admin-session \
    --duration-seconds 3600
# → Valid for 1 hour (3600 seconds), default 1 hour/max 12 hours
# → Need all 3: Access Key + Secret Key + Session Token!
```

**Permanent Access Key vs Temporary Credentials:**

```
Permanent Key: Leaked → immediately exploited, manual disable needed, rotation may be missed
Temporary Token: Auto-expires in 1-12 hours, leak damage limited, new ones issued each time
→ Always prefer Role/STS in production!
```

---

### IAM Security Best Practices

#### Root Account Protection

```bash
# Root account = AWS account's CEO master key
# → Unlimited access to all AWS services and resources
# → Cannot be restricted even with IAM Policy!

# ⚠️ Only operations requiring Root account (use Root ONLY for these!)
# - Change AWS account settings (name, email)
# - Create first admin IAM User
# - Change billing information
# - Change AWS Support plan
# - Close account

# Root account security checklist:
# 1. Enable MFA (mandatory!)
# 2. Delete Access Keys (never create them)
# 3. Set strong password
# 4. Never use Root for daily operations
```

#### Principle of Least Privilege

```bash
# Only required permissions, only required resources, only required duration

# ❌ Bad: Allow everything
# {
#     "Effect": "Allow",
#     "Action": "*",
#     "Resource": "*"
# }

# ✅ Good: Allow only what's needed
# {
#     "Effect": "Allow",
#     "Action": [
#         "s3:GetObject",
#         "s3:PutObject"
#     ],
#     "Resource": "arn:aws:s3:::my-app-bucket/uploads/*"
# }

# Find unused permissions with IAM Access Analyzer
aws accessanalyzer list-findings \
    --analyzer-arn arn:aws:access-analyzer:ap-northeast-2:123456789012:analyzer/my-analyzer
# → Analyzes externally accessible resources and unused permissions

# Test permissions before deployment (Policy simulation)
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
# → s3:GetObject allowed, s3:DeleteObject denied - confirmed before deployment!
```

#### Access Key Management

```bash
# Check Access Keys + last used date
aws iam list-access-keys --user-name developer-kim
# → Check AccessKeyId, Status(Active/Inactive), CreateDate

aws iam get-access-key-last-used --access-key-id AKIAIOSFODNN7EXAMPLE
# → Check LastUsedDate, ServiceName, Region

# Rotation procedure: Create new key → Update app → Disable old key → Delete
aws iam create-access-key --user-name developer-kim
aws iam update-access-key --user-name developer-kim \
    --access-key-id AKIAIOSFODNN7EXAMPLE --status Inactive
aws iam delete-access-key --user-name developer-kim \
    --access-key-id AKIAIOSFODNN7EXAMPLE
# ⚠️ Max 2 Access Keys per User (for rotation overlap)
```

#### Password Policy

```bash
# Set password policy for entire account
aws iam update-account-password-policy \
    --minimum-password-length 14 \
    --require-symbols --require-numbers \
    --require-uppercase-characters --require-lowercase-characters \
    --max-password-age 90 \
    --password-reuse-prevention 12 \
    --allow-users-to-change-password

# Check current policy
aws iam get-account-password-policy
# → MinimumPasswordLength: 14, MaxPasswordAge: 90, PasswordReusePrevention: 12
```

---

### Identity Center (SSO)

Service enabling single login access to multiple AWS accounts. Used with AWS Organizations.

```bash
# Traditional: IAM User per account + password + Access Key (3 accounts = 3 sets...)
# SSO:  Login once to SSO portal → Select account → Temporary credentials auto-issued!

# Setup SSO in AWS CLI
aws configure sso
# SSO start URL: https://my-company.awsapps.com/start
# → Browser opens SSO login page

# Run AWS commands with SSO profile
aws s3 ls --profile my-company-dev
aws s3 ls --profile my-company-prod
aws sso login --profile my-company-dev    # Refresh token
```

**SAML / OIDC Federation:**

```bash
# If your company already has IdP (Okta, Azure AD, Google Workspace)
# → Don't create IAM Users, federate with external IdP!
# SAML: Enterprise SSO (Okta, Azure AD) / OIDC: Web standard (Google, GitHub)
# → EKS IRSA/Pod Identity also uses OIDC!

# Create OIDC Provider (frequently used with EKS)
aws iam create-open-id-connect-provider \
    --url https://oidc.eks.ap-northeast-2.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 9e99a48a9960b14926bb7f3b02e22da2b0ab7280
```

---

## 💻 Lab Examples

### Lab 1: Create IAM User + Apply Least Privilege Policy

```bash
# Scenario: Grant intern S3 read-only access to specific bucket

# 1. Write Policy document (allow ListBucket + GetObject, deny Delete/Upload)
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

# 2. Create User + Apply Policy
aws iam create-user --user-name intern-park
aws iam create-login-profile --user-name intern-park \
    --password "TempIntern2026!" --password-reset-required
aws iam create-policy --policy-name InternS3ReadOnly \
    --policy-document file://intern-s3-readonly.json
aws iam attach-user-policy --user-name intern-park \
    --policy-arn arn:aws:iam::123456789012:policy/InternS3ReadOnly

# 3. Test permissions (policy simulation)
aws iam simulate-principal-policy \
    --policy-source-arn arn:aws:iam::123456789012:user/intern-park \
    --action-names s3:GetObject s3:PutObject s3:DeleteObject \
    --resource-arns arn:aws:s3:::dev-shared-bucket/test.txt
# s3:GetObject    → allowed       ✅
# s3:PutObject    → explicitDeny  ✅
# s3:DeleteObject → explicitDeny  ✅

# 4. Cleanup
aws iam detach-user-policy --user-name intern-park \
    --policy-arn arn:aws:iam::123456789012:policy/InternS3ReadOnly
aws iam delete-login-profile --user-name intern-park
aws iam delete-user --user-name intern-park
aws iam delete-policy --policy-arn arn:aws:iam::123456789012:policy/InternS3ReadOnly
```

### Lab 2: EC2 Instance Profile Setup

```bash
# Scenario: App on EC2 needs access to S3 and SQS

# 1. Write Trust Policy + Permission Policy
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

# 2. Create Role + Instance Profile + Attach to EC2
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

# 3. Verify inside EC2
ssh ec2-user@my-ec2-instance
aws sts get-caller-identity
# → assumed-role/MyApp-EC2-Role/i-0abc123def456

aws s3 cp test.txt s3://my-app-data/test.txt
# upload: ./test.txt to s3://my-app-data/test.txt  ✅

aws ec2 describe-instances
# An error occurred (UnauthorizedOperation)  ✅ (No EC2 permission!)
```

### Lab 3: Cross-Account AssumeRole

```bash
# Scenario: Read DynamoDB table in production account from dev account

# [In production account: 222222222222]
# 1. Create Trust Policy + Role
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

# [In dev account: 111111111111]
# 2. Assume Role + Get temporary credentials + Set environment
CREDS=$(aws sts assume-role \
    --role-arn arn:aws:iam::222222222222:role/ProdDynamoDBReadOnly \
    --role-session-name prod-read-session \
    --external-id cross-account-2026 \
    --query 'Credentials' --output json)

export AWS_ACCESS_KEY_ID=$(echo $CREDS | jq -r '.AccessKeyId')
export AWS_SECRET_ACCESS_KEY=$(echo $CREDS | jq -r '.SecretAccessKey')
export AWS_SESSION_TOKEN=$(echo $CREDS | jq -r '.SessionToken')

# 3. Read production DynamoDB
aws sts get-caller-identity
# { "Account": "222222222222",
#   "Arn": "arn:aws:sts::222222222222:assumed-role/ProdDynamoDBReadOnly/prod-read-session" }

aws dynamodb list-tables --region ap-northeast-2
# { "TableNames": ["prod-users", "prod-orders"] }

# 4. Cleanup session
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
```

---

## 🏢 In Production

### Scenario 1: Design Team-based Permission Structure

```bash
# Organization:
# - Platform team (3 people): Manage all AWS infrastructure
# - Backend team (10 people): Deploy ECS/EKS, use S3, DynamoDB, SQS
# - Frontend team (5 people): S3 static hosting, CloudFront management
# - Data team (3 people): Glue, Athena, S3 data lake access

# IAM Design:
# 1. Use Groups (never individual User policies!)
# 2. Separate by environment (dev/staging/prod separate AWS accounts)
# 3. Use Identity Center for SSO (not IAM Users!)

# Policy per Group:
# Platform team → AdministratorAccess (MFA required for prod)
# Backend team  → Custom Policy (ECS + S3 + DynamoDB + SQS)
# Frontend team → Custom Policy (S3 + CloudFront + Route53)
# Data team     → Custom Policy (Glue + Athena + S3 data buckets)

# ⚠️ Key: Always add MFA condition for production account!
# Condition:
#   "Bool": { "aws:MultiFactorAuthPresent": "true" }
```

### Scenario 2: CI/CD Pipeline Permissions (ECR + EKS)

```bash
# GitHub Actions pushing to ECR and deploying to EKS
# Reference: ECR auth → ../03-containers/07-registry

# 1. Create OIDC Provider for GitHub Actions (not Access Key!)
aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# 2. Trust Policy - only our repo can use this Role!
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

# 3. Permissions: ECR push + EKS deploy (least privilege)
# ECR: GetAuthorizationToken, BatchCheckLayerAvailability, PutImage,
#      InitiateLayerUpload, UploadLayerPart, CompleteLayerUpload
# EKS: DescribeCluster (for kubectl access)

# → Instead of storing Access Key in GitHub Secrets
# → Issue temporary credentials via OIDC each time
# → No key leakage risk!
```

### Scenario 3: Security Incident Response (Leaked Access Key)

```bash
# "Oops, we accidentally committed an Access Key to GitHub!"

# 1. Immediately disable the key (before deletion!)
aws iam update-access-key --user-name developer-kim \
    --access-key-id AKIAIOSFODNN7EXAMPLE --status Inactive

# 2. Check what actions were performed (CloudTrail)
aws cloudtrail lookup-events \
    --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=AKIAIOSFODNN7EXAMPLE \
    --max-results 20

# 3. Delete the key + issue new one if needed
aws iam delete-access-key --user-name developer-kim \
    --access-key-id AKIAIOSFODNN7EXAMPLE

# 4. Invalidate all existing sessions (Inline Deny Policy)
aws iam put-user-policy --user-name developer-kim \
    --policy-name DenyAllUntilReview \
    --policy-document '{
        "Version":"2012-10-17",
        "Statement":[{"Effect":"Deny","Action":"*","Resource":"*",
        "Condition":{"DateLessThan":{"aws:TokenIssueTime":"2026-03-13T12:00:00Z"}}}]
    }'
# → Invalidate all tokens issued before the incident time

# 5. Prevention: Setup git-secrets hook + Move to Role/SSO + Enable Access Analyzer
```

---

## ⚠️ Common Mistakes

### 1. Using Root Account for Daily Operations

```bash
# ❌ Using Root for EC2, S3 uploads, daily tasks
# → Root has unlimited permissions even MFA can't restrict!
# → Key leakage means entire account compromise!

# ✅ Lock Root behind MFA, store credentials in safe
# → Daily work with IAM User or Identity Center SSO
# → AdministratorAccess Policy is safer (can be restricted via Policy)
```

### 2. Hardcoding Access Key in EC2

```bash
# ❌ Store Access Key in EC2's ~/.aws/credentials or code
# AWS_ACCESS_KEY_ID=AKIA...
# AWS_SECRET_ACCESS_KEY=wJalr...

# ✅ Use EC2 Instance Profile (IAM Role)
# → Access Key doesn't exist
# → EC2 metadata service auto-issues temporary credentials
# → AWS SDK automatically recognizes them
```

### 3. Wildcard (*) Abuse

```bash
# ❌ Grant all permissions for development convenience
# {
#     "Effect": "Allow",
#     "Action": "s3:*",
#     "Resource": "*"
# }
# → All S3 buckets, all operations (including delete!)

# ✅ Specify only required Actions and Resources
# {
#     "Effect": "Allow",
#     "Action": ["s3:GetObject", "s3:PutObject"],
#     "Resource": "arn:aws:s3:::my-app-bucket/uploads/*"
# }
# → Only specific bucket, read/write in uploads folder
```

### 4. Not Rotating Access Keys

```bash
# ❌ Using same Access Key from a year ago
# → Don't know if leaked, leak period extends

# ✅ Rotate Access Key every 90 days
# Even better: Use IAM Role or SSO instead of Access Key

# Find old keys
aws iam generate-credential-report
aws iam get-credential-report --output text --query Content | base64 -d | \
    awk -F, '{if (NR>1 && $9=="true") print $1, $10}'
# → Check users with active key_1 and last rotation date
```

### 5. Confusing Buckets and Objects in Policy

```bash
# ❌ Specify bucket in Resource but allow object operations
# {
#     "Effect": "Allow",
#     "Action": "s3:GetObject",
#     "Resource": "arn:aws:s3:::my-bucket"     ← Bucket itself!
# }
# → s3:GetObject targets objects, doesn't work!

# ✅ Separate Resources for bucket vs object operations
# {
#     "Statement": [
#         {
#             "Action": "s3:ListBucket",
#             "Resource": "arn:aws:s3:::my-bucket"         ← Bucket
#         },
#         {
#             "Action": ["s3:GetObject", "s3:PutObject"],
#             "Resource": "arn:aws:s3:::my-bucket/*"        ← Objects
#         }
#     ]
# }
```

---

## 📝 Summary

### IAM Components Summary

```
Component          Description                         When to use?
──────────────────────────────────────────────────────────────────
IAM User         Permanent account for person/service  Console login, CLI access
IAM Group        Bundle Users for permission mgmt      Team/department management
IAM Role         Temporary credentials                 EC2, Lambda, EKS Pod, Cross-Account
IAM Policy       JSON permission rules                 Attached everywhere
Instance Profile EC2 wrapper to attach Role            EC2 AWS service access
STS              Issue temporary credentials           AssumeRole, Federation
Identity Center  SSO (single login)                    Multi-account management
```

### Essential CLI Commands

```bash
aws sts get-caller-identity                          # Check who you are
aws iam create-user --user-name NAME                 # Create User
aws iam create-group --group-name NAME               # Create Group
aws iam add-user-to-group --group-name G --user-name U  # Add to Group
aws iam attach-group-policy --group-name G --policy-arn ARN  # Attach Policy
aws iam create-role --role-name R --assume-role-policy-document file://t.json
aws iam attach-role-policy --role-name R --policy-arn ARN
aws iam create-policy --policy-name P --policy-document file://p.json
aws iam simulate-principal-policy --policy-source-arn ARN --action-names A1 A2
aws iam list-access-keys --user-name NAME            # Check keys
aws sts assume-role --role-arn ARN --role-session-name S  # Switch Role
```

### Security Checklist

```
✅ Root account MFA enabled, no Access Keys
✅ Daily work via IAM User or Identity Center (SSO)
✅ EC2/Lambda/EKS Pod use IAM Role (never Access Key)
✅ Policies follow least privilege (required Action + specific Resource)
✅ Attach Policy to Group, not individual User
✅ Access Key rotation every 90 days / password policy (14+ chars, 90-day expiry)
✅ CloudTrail + IAM Access Analyzer enabled
```

### Comparison with K8s RBAC

```
AWS IAM           K8s RBAC                       Connection
──────────────────────────────────────────────────────────
IAM User        → User (X.509)
IAM Group       → Group (aws-auth mapping)
IAM Role        → ServiceAccount               ← EKS Pod Identity / IRSA
IAM Policy      → Role / ClusterRole
Policy attach   → RoleBinding / ClusterRoleBinding
STS AssumeRole  → TokenRequest API

→ Reference: K8s RBAC → ../04-kubernetes/11-rbac
→ Reference: Linux users/groups → ../01-linux/03-users-groups
```

---

## 🔗 Next Lecture → [02-vpc](./02-vpc)

Next is **VPC (Virtual Private Cloud)** -- how to create your own network in AWS. While IAM controlled "who can use AWS", VPC controls "what network do AWS resources live in and how do they communicate". We'll learn subnets, routing tables, security groups, NAT Gateway, and core cloud networking concepts.
