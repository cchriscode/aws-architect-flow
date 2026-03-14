# Terraform Advanced — Module, State, Workspace, Import, Backend, Terraform Cloud

> [In the previous lecture](./02-terraform-basics), we learned the basic Terraform syntax and resource creation. This time, we'll explore **advanced topics for using Terraform "well" in production**. Creating a few resources yourself is simple, but managing hundreds of resources with a team requires concepts like Module, State management, and Workspace.

---

## 🎯 Why Should You Learn Advanced Terraform?

Building a single house requires one blueprint. But what about **building an entire apartment complex**? You need to repeat the same design, systematically manage construction progress, and enable multiple teams to work simultaneously.

Advanced Terraform develops exactly this **large-scale infrastructure management capability**.

---

## Core Concepts

### Analogy: Large-Scale Construction Project

| Real World | Terraform Advanced |
|-----------|-------------------|
| LEGO building set | **Module** (reusable infrastructure package) |
| Construction status ledger | **State** (infrastructure status record) |
| Construction company vault | **Backend** (remote state repository) |
| Simulation model | **Workspace** (environment-isolated workspace) |
| Deed registry | **Import** (incorporating existing resources) |
| Central control center | **Terraform Cloud** (remote execution + policy) |

---

## Module System

A Module is a reusable package of Terraform configurations consisting of:

- `variables.tf` - Input variables
- `main.tf` - Resource definitions
- `outputs.tf` - Output values

Modules can be sourced from:
- Local paths: `./modules/vpc`
- Terraform Registry: `terraform-aws-modules/vpc/aws`
- GitHub: `github.com/my-org/terraform-modules//vpc`
- S3: `s3::https://bucket.s3.amazonaws.com/module.zip`

**Best Practice**: Always pin module versions in production:
```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.2"  # Pin exact version
}
```

---

## State Management

State is the critical record of your infrastructure. Key principles:

- **Never commit to Git** - Add `.tfstate` files to .gitignore
- **Use Remote Backend** - Store state in S3 with encryption
- **Enable Locking** - Use DynamoDB to prevent concurrent modifications
- **Version Control** - Enable S3 versioning for recovery

S3 Backend configuration:
```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "terraform-state-locks"
    encrypt        = true
  }
}
```

State commands:
- `terraform state list` - View managed resources
- `terraform state show <resource>` - View details
- `terraform state mv <from> <to>` - Rename resource
- `terraform state rm <resource>` - Remove from state

---

## Workspace

Workspaces allow the same code to manage multiple isolated environments:

```bash
$ terraform workspace new dev
$ terraform workspace new prod
$ terraform workspace select dev
```

Usage with variables:
```hcl
locals {
  env = terraform.workspace
}

resource "aws_instance" "app" {
  instance_type = var.instance_type[local.env]
  tags = {
    Environment = local.env
  }
}
```

**Note**: Directory-based separation is preferred for large teams.

---

## terraform import

Import existing resources created outside Terraform:

```bash
# Modern approach (Terraform 1.5+)
import {
  to = aws_vpc.main
  id = "vpc-0abc123def456"
}

# Auto-generate code
terraform plan -generate-config-out=generated.tf
```

---

## Backend Configuration

Remote backends enable team collaboration:

```hcl
terraform {
  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "prod/terraform.tfstate"
    dynamodb_table = "terraform-state-locks"
    encrypt        = true
  }
}
```

Migrate from local:
```bash
terraform init  # Choose to copy state to new backend
```

---

## Terraform Cloud

Enterprise features:
- Remote execution
- State management
- Policy as Code (Sentinel)
- VCS integration
- Team management

Configuration:
```hcl
terraform {
  cloud {
    organization = "my-company"
    workspaces {
      name = "myapp-prod"
    }
  }
}
```

---

## CI/CD Pipeline Integration

Typical workflow:
1. Developer writes code and creates PR
2. CI runs: format check, validation, plan
3. Plan results commented on PR
4. Reviewer approves
5. Merge to main triggers apply

---

## Managing Large-Scale Terraform

**Terragrunt** reduces boilerplate by centralizing common configuration.

**Monorepo vs Multi-repo:**
- **Monorepo**: Start here, single repository
- **Multi-repo**: Transition when teams grow

---

## terraform test — Native Testing Framework (1.6+)

Starting with Terraform 1.6, the **`terraform test`** command was officially introduced. Previously, you needed external tools like Terratest (Go) or Kitchen-Terraform (Ruby), but now you can **test infrastructure code using only HCL**.

### Why Is This Needed?

```
Problems with existing approaches:

1. External tool dependency — Go or Ruby runtime required
2. Learning overhead — Must learn another language besides HCL
3. Slow feedback — Can only test by creating actual resources

terraform test advantages:

1. HCL native — No additional language needed
2. Plan mode support — Validate without creating resources (fast and free)
3. Easy CI/CD integration — Just one command: terraform test
```

### Test File Structure

Test files use the `*.tftest.hcl` extension and go in the project root or `tests/` directory.

```hcl
# tests/vpc.tftest.hcl

# === Plan mode test (validate without creating resources) ===
run "vpc_cidr_is_valid" {
  command = plan    # Run plan only, no actual creation

  assert {
    condition     = aws_vpc.main.cidr_block == "10.0.0.0/16"
    error_message = "VPC CIDR block must be 10.0.0.0/16"
  }
}

run "subnet_count_is_correct" {
  command = plan

  assert {
    condition     = length(aws_subnet.private) == 3
    error_message = "Expected 3 private subnets"
  }
}

# === Apply mode test (create real resources then validate) ===
run "ec2_instance_has_correct_tags" {
  command = apply   # Create real resources, auto-destroyed after test

  variables {
    environment = "test"
    instance_type = "t3.micro"
  }

  assert {
    condition     = aws_instance.web.tags["Environment"] == "test"
    error_message = "Instance must have Environment=test tag"
  }
}
```

### Core Syntax

```
terraform test components:

┌─────────────────────────────────────────────────┐
│  *.tftest.hcl file                              │
│                                                 │
│  run "test_name" {                              │
│    command = plan | apply   # Execution mode     │
│                                                 │
│    variables {              # Override variables │
│      key = "value"                              │
│    }                                            │
│                                                 │
│    assert {                 # Conditions (multiple ok) │
│      condition     = <bool expression>          │
│      error_message = "failure message"          │
│    }                                            │
│  }                                              │
└─────────────────────────────────────────────────┘

command types:
  plan  — Fast and free, sufficient for most validations
  apply — Create then validate, auto-destroy after test
```

### Running Tests

```bash
# Run all tests
terraform test

# Run specific test file
terraform test -filter=tests/vpc.tftest.hcl

# Verbose output
terraform test -verbose
```

### Using terraform test in CI/CD

```yaml
# GitHub Actions example
- name: Terraform Test
  run: |
    terraform init
    terraform test    # Plan mode tests have zero cost/time overhead
```

```
Position in CI/CD pipeline:

On PR creation:
  terraform fmt -check → terraform validate → terraform test → terraform plan
                                                  ↑
                                          Plan mode tests go here!
                                          (fast and free)

After main merge:
  terraform apply
```

**Practical tip**: Plan mode tests alone can handle most static validations -- variable checks, CIDR ranges, tag rules, resource counts. Use apply mode only when you truly need integration testing.

---

## OpenTofu — Open-Source Fork of Terraform

### Background

In August 2023, HashiCorp changed Terraform's license from **MPL 2.0 to BSL (Business Source License)**. BSL restricts using Terraform in competing services.

In response, **OpenTofu** was created as an open-source fork under the Linux Foundation.

```
License Change Timeline:

2023.08  HashiCorp announces Terraform license change to BSL
2023.09  OpenTF (now OpenTofu) fork project starts
2023.09  Joins Linux Foundation
2024.01  OpenTofu 1.6.0 GA release (Terraform 1.6 compatible)
2024~    OpenTofu begins adding independent features (state encryption, etc.)
```

### Terraform vs OpenTofu

| Comparison | Terraform | OpenTofu |
|-----------|-----------|----------|
| **License** | BSL 1.1 (restrictive) | MPL 2.0 (open-source) |
| **Governance** | HashiCorp (acquired by IBM) | Linux Foundation |
| **CLI Compatibility** | Reference | Based on Terraform 1.6, high compatibility |
| **Provider Compat** | Reference | Uses same providers |
| **State Format** | Reference | Compatible (+ native state encryption) |
| **Registry** | registry.terraform.io | registry.opentofu.org |
| **Commercial Support** | Terraform Cloud/Enterprise | Community + third-party |

### Which Should You Choose?

```
Selection Guide:

Stay with Terraform if:
  ├ Already using Terraform Cloud/Enterprise
  ├ Enterprise requiring official HashiCorp support
  └ Existing CI/CD pipelines tightly coupled to Terraform

Consider OpenTofu if:
  ├ Open-source license is mandatory per org policy
  ├ Want to reduce vendor lock-in
  ├ Need OpenTofu-exclusive features like state encryption
  └ Starting a new project with freedom to choose
```

**Practical tip**: The Module, State, Backend, and Workspace concepts taught in this lecture **apply equally to both Terraform and OpenTofu**. HCL syntax, providers, and core commands are the same, so this lecture's content is valid regardless of which tool you choose.

---

## Common Mistakes

1. **Commit state to Git** - Use .gitignore and remote backend
2. **Wrong workspace selection** - Use directory separation
3. **Ignore state locks** - Never force-unlock without cause
4. **Loose version pinning** - Pin exact versions in production
5. **Manual state editing** - Always use CLI commands

---

## Key Takeaways

| Concept | Purpose | Best Practice |
|---------|---------|---------------|
| Module | Code reuse | Pin exact versions |
| State | Infrastructure tracking | Remote backend required |
| Backend | Central state storage | S3 + DynamoDB Lock |
| Workspace | Environment isolation | Directory approach preferred |
| Import | Legacy resource management | Use import block |
| Cloud | Enterprise features | Adopt as team grows |
| terraform test | HCL native testing (1.6+) | Plan mode for fast static validation |
| OpenTofu | Terraform open-source fork | Same HCL/providers, different license |

---

## Next Steps

Next lecture: **[Ansible](./04-ansible)** — Server configuration automation

**Related Lectures:**
- [Terraform Basics](./02-terraform-basics) — HCL syntax, resources, provider
- [AWS VPC](../05-cloud-aws/02-vpc) — Network structure
- [Kubernetes](../04-kubernetes/) — EKS and K8s
- [CI/CD](../07-cicd/) — Deployment pipelines
