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

---

## Next Steps

Next lecture: **[Ansible](./04-ansible)** — Server configuration automation

**Related Lectures:**
- [Terraform Basics](./02-terraform-basics) — HCL syntax, resources, provider
- [AWS VPC](../05-cloud-aws/02-vpc) — Network structure
- [Kubernetes](../04-kubernetes/) — EKS and K8s
- [CI/CD](../07-cicd/) — Deployment pipelines
