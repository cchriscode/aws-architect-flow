# IaC Testing and Policy (Terratest / Checkov / OPA / tfsec / Infracost)

> [In the previous lecture](./05-cloudformation-pulumi), we explored various IaC tools. Now we'll learn how to **validate that your infrastructure code is safe, compliant, and cost-controlled**. Think of it as quality assurance for your infrastructure.

---

## 🎯 Why Learn IaC Testing and Policy?

### Analogy: Building Safety Inspection

- **Static Analysis** = Blueprint review
- **Unit Testing** = Component inspection
- **Integration Testing** = Assembly validation
- **E2E Testing** = Final inspection
- **Policy** = Building code compliance
- **Cost Estimation** = Budget check

Without these, you risk security breaches, rule violations, and budget overruns.

---

## Testing Pyramid

```
        E2E Testing
      (hours, expensive)

    Integration Testing
   (minutes, real costs)

  Unit Testing
 (seconds, free)

Static Analysis
(immediate, free)
```

**Principle**: Catch issues as early as possible at lowest cost.

---

## Static Analysis Tools

### terraform fmt & validate

```bash
# Format check
terraform fmt -check -recursive

# Fix formatting
terraform fmt -recursive

# Syntax validation
terraform validate
```

### tfsec / Trivy

Security vulnerability scanner for Terraform:

```bash
# Install
brew install tfsec

# Scan
tfsec .

# Example output:
# CRITICAL: Security group allows public SSH access
# main.tf:25
#   cidr_blocks = ["0.0.0.0/0"]
```

### Checkov

Comprehensive security and compliance checker:

```bash
# Install
pip install checkov

# Scan
checkov -d .

# Filter by severity
checkov -d . --check-severity HIGH

# Skip specific checks
checkov -d . --skip-check CKV_AWS_144
```

**Checks include:**
- S3 encryption
- Database encryption
- IAM policies
- Network security
- Tagging compliance

---

## Terratest — Integration Testing

Real infrastructure testing in Go:

```go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/aws"
    "github.com/gruntwork-io/terratest/modules/terraform"
)

func TestVpcModule(t *testing.T) {
    opts := &terraform.Options{
        TerraformDir: "../modules/vpc",
        Vars: map[string]interface{}{
            "vpc_cidr": "10.0.0.0/16",
        },
    }

    defer terraform.Destroy(t, opts)
    terraform.InitAndApply(t, opts)

    vpcId := terraform.Output(t, opts, "vpc_id")
    vpc := aws.GetVpcById(t, vpcId, "us-east-2")

    assert.Equal(t, vpc.CidrBlock, "10.0.0.0/16")
}
```

**Run tests:**

```bash
cd test && go test -v -timeout 30m
```

---

## OPA (Open Policy Agent) / Conftest

Define and enforce policies in Rego language:

```rego
# policy/tags.rego
package terraform.tags

required_tags := {"Environment", "Team", "Owner"}

deny[msg] {
    resource := input.planned_values.root_module.resources[_]
    tags := object.get(resource.values, "tags", {})
    tag := required_tags[_]
    not tags[tag]

    msg := sprintf("Resource %s missing required tag %s",
                   [resource.address, tag])
}
```

**Usage:**

```bash
# Install Conftest
brew install conftest

# Generate plan JSON
terraform plan -out=tfplan
terraform show -json tfplan > tfplan.json

# Check policies
conftest test tfplan.json --policy policy/

# Output:
# FAIL - Required tag missing
# ...
```

---

## Sentinel (Terraform Cloud)

HashiCorp's policy framework (Terraform Cloud/Enterprise):

```python
import "tfplan/v2" as tfplan

# Enforce instance type limits
main = rule {
    all tfplan.resource_changes as _, rc {
        rc.type is "aws_instance" implies
        rc.change.after.instance_type in ["t3.micro", "t3.small", "t3.medium"]
    }
}
```

---

## Infracost — Cost Estimation

See cost changes before deployment:

```bash
# Install
brew install infracost

# Estimate costs
infracost breakdown --path .

# Compare before/after
infracost diff --path .

# Sample output:
# ~ aws_instance.web
#   ~ Instance usage: t3.micro → t3.large  +$100/month
# + aws_rds.db                          +$200/month
# Total monthly increase: $300
```

**GitHub Integration:**

```yaml
- name: Infracost
  run: infracost comment github --repo myorg/infra --pull-request 42
```

---

## CI/CD Pipeline Integration

Complete quality assurance workflow:

```yaml
# .github/workflows/terraform.yml
name: Terraform Quality Gates

on: [pull_request]

jobs:
  format-and-validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform fmt -check
      - run: terraform validate

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aquasecurity/tfsec-action@v1
      - uses: bridgecrewio/checkov-action@v12

  policy-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: conftest test tfplan.json --policy policy/

  cost-estimate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: infracost/actions/setup@v3
      - run: infracost diff --path .
      - run: infracost comment github

  apply:
    needs: [format-and-validate, security-scan, policy-check]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: terraform apply -auto-approve
```

---

## Real-World Policies

### Tagging Policy

```rego
# All resources must have required tags
required_tags := {"Environment", "Team", "Owner"}

deny[msg] {
    resource := input.planned_values.root_module.resources[_]
    tags := object.get(resource.values, "tags", {})
    missing := required_tags - object.keys(tags)
    count(missing) > 0

    msg := sprintf("Resource %s missing tags: %v",
                   [resource.address, missing])
}
```

### Cost Policy

```rego
# Restrict expensive instance types in dev
deny[msg] {
    resource := input.planned_values.root_module.resources[_]
    resource.type == "aws_instance"
    tags := resource.values.tags
    tags.Environment == "dev"
    expensive_types := {"m5.4xlarge", "c5.9xlarge", "r5.8xlarge"}
    resource.values.instance_type in expensive_types

    msg := sprintf("Instance %s too large for dev: %s",
                   [resource.address, resource.values.instance_type])
}
```

### Security Policy

```rego
# S3 buckets must not be public
deny[msg] {
    resource := input.planned_values.root_module.resources[_]
    resource.type == "aws_s3_bucket_acl"
    resource.values.acl in ["public-read", "public-read-write"]

    msg := sprintf("S3 bucket %s has public ACL", [resource.address])
}

# RDS must be encrypted
deny[msg] {
    resource := input.planned_values.root_module.resources[_]
    resource.type == "aws_db_instance"
    not resource.values.storage_encrypted

    msg := sprintf("RDS %s not encrypted", [resource.address])
}
```

---

## Shift-Left Security

Catch issues early:

```
IDE (tfsec plugin)
  ↓ [catch early]
Pre-commit (fmt, validate)
  ↓ [catch immediately]
PR (tfsec, checkov, OPA)
  ↓ [catch before merge]
Staging (Terratest)
  ↓ [catch real issues]
Production [final gate]
```

Each level is cheaper and faster to fix.

---

## Practical Example

Complete policy file:

```rego
# policy/production.rego
package terraform.production

# Enforce tagging
required_tags := {"Environment", "Team", "Owner", "CostCenter"}

deny[msg] {
    resource := input.planned_values.root_module.resources[_]
    tags := object.get(resource.values, "tags", {})
    missing := required_tags - object.keys(tags)
    count(missing) > 0
    msg := sprintf("%s missing tags: %v", [resource.address, missing])
}

# Restrict instance types
allowed_instances := {"t3.micro", "t3.small", "t3.medium", "t3.large",
                      "m5.large", "m5.xlarge"}

deny[msg] {
    resource := input.planned_values.root_module.resources[_]
    resource.type == "aws_instance"
    not resource.values.instance_type in allowed_instances
    msg := sprintf("%s instance type %s not allowed",
                   [resource.address, resource.values.instance_type])
}

# Enforce encryption
deny[msg] {
    resource := input.planned_values.root_module.resources[_]
    resource.type == "aws_ebs_volume"
    not resource.values.encrypted
    msg := sprintf("EBS volume %s not encrypted", [resource.address])
}

deny[msg] {
    resource := input.planned_values.root_module.resources[_]
    resource.type == "aws_s3_bucket_acl"
    resource.values.acl in ["public-read", "public-read-write"]
    msg := sprintf("S3 %s has public ACL", [resource.address])
}
```

---

## Summary Table

| Tool | Type | Purpose | Speed | Cost |
|------|------|---------|-------|------|
| **terraform fmt** | Format | Code style | Immediate | Free |
| **terraform validate** | Validation | Syntax check | Immediate | Free |
| **tfsec** | Security | Vulnerability scan | Seconds | Free |
| **Checkov** | Security | Compliance check | Seconds | Free |
| **OPA/Conftest** | Policy | Custom rules | Seconds | Free |
| **Infracost** | Cost | Budget impact | Seconds | Free |
| **Terratest** | Integration | Real testing | Minutes | AWS costs |

---

## Checklist

```
Basic Setup
□ terraform fmt -check in CI
□ terraform validate in CI
□ tfsec or checkov running

Policies
□ Tagging policy implemented
□ Instance type restrictions
□ Security requirements (encryption, public access)
□ Cost controls

CI/CD
□ Policy checks run on PR
□ Security scan blocks violations
□ Infracost comments on costs

Advanced
□ Terratest for critical modules
□ Central policy repository
□ Automated policy updates
```

---

## Common Mistakes

1. **Disabling checks** — Never skip tests without reason
   - Solution: Document and review exemptions

2. **Loose policy thresholds** — Policies too permissive
   - Solution: Start strict, relax as needed

3. **Manual cost approval** — No budget controls
   - Solution: Automated cost gates

4. **No test rollback** — Tests pass, deploy fails
   - Solution: Use Terratest for real validation

---

## Next Steps

You've completed the entire IaC curriculum:
1. IaC Concepts
2. Terraform Basics
3. Terraform Advanced
4. Ansible
5. CloudFormation/CDK/Pulumi
6. Testing and Policy

Next module: **[CI/CD](../07-cicd/)** — Automating deployment pipelines

**Related Lectures:**
- [Git Basics](../07-cicd/01-git-basics) — Version control
- [GitHub Actions](../07-cicd/) — Workflow automation
- [AWS Security](../05-cloud-aws/12-security) — Security best practices
