# Platform Engineering

> A world where developers don't touch infrastructure directly, but can self-service any environment they need — like an internal app store. After learning DevOps and SRE principles, it's time to add **Developer Experience (DX)** on top. Platform engineering is the glue that ties together IaC, CI/CD, and observability into **one self-service portal**.

---

## 🎯 Why Learn Platform Engineering?

### Daily Analogy: Company Cafeteria vs. Packed Lunch

Imagine a 100-person company.

**Packed Lunch Method (No Platform)**:
- Each person shops, cooks, and brings lunch daily
- Some cook well, some eat ramen every day
- Food costs and nutrition vary widely
- If someone gets sick, they solve it themselves

**Cafeteria Method (With Platform)**:
- Professional chefs plan menus and manage ingredients
- Employees pick what they want from the menu
- Nutritionist designs balanced meals, hygiene is managed
- "Add a new menu item" → Chef team reviews and adds it

**That's the essence of Platform Engineering:**
- Cafeteria = Internal Developer Platform (IDP)
- Chef team = Platform Team
- Menu = Golden Paths (standardized tech paths)
- Kiosk = Self-Service Portal

---

## 🧠 Core Concepts

### 1. Platform Engineering Definition

**Platform Engineering** is designing and building an Internal Developer Platform (IDP) with self-service capabilities within an organization.

Three core principles:
- **Abstraction**: Hide complex infrastructure behind simple interfaces
- **Self-Service**: Developers provision without tickets or waiting
- **Guardrails**: Provide freedom while preventing dangerous actions

### 2. DevOps vs SRE vs Platform Engineering

- **DevOps** = Philosophy (development and operations should collaborate)
- **SRE** = Specialist role (protect system stability)
- **Platform Engineering** = Product for developers (enable fast, safe development)

| Aspect | DevOps | SRE | Platform Engineering |
|--------|--------|-----|---------------------|
| **Nature** | Culture/Philosophy | Role/Practice | Product/Organization |
| **Core Question** | "How do we collaborate?" | "How do we operate reliably?" | "How do we enable fast development?" |
| **Key Output** | CI/CD, Automation | SLO, Error Budget, Runbooks | IDP, Service Catalog, Templates |
| **Success Metric** | Deploy frequency, Lead time | Availability, MTTR | Developer satisfaction, Onboarding time |

### 3. Internal Developer Platform (IDP)

IDP is a curated set of tools, workflows, and capabilities that abstract infrastructure complexity and enable self-service development.

**Five Core Layers of IDP:**

```
┌─────────────────────────────────────────────┐
│        Developer Portal (UI)                 │ ← What developers see
│    (Backstage, Port, Cortex)                │
├─────────────────────────────────────────────┤
│         Service Catalog                     │ ← What exists, search
│   (Services, APIs, docs, owners)            │
├─────────────────────────────────────────────┤
│      Self-Service Actions                   │ ← Direct execution
│  (Create env, provision DB, setup pipeline) │
├─────────────────────────────────────────────┤
│    Golden Paths / Templates                 │ ← Standard approaches
│  (Project templates, architecture guides)   │
├─────────────────────────────────────────────┤
│      Integration Layer                      │ ← Connect tools
│ (K8s, Terraform, GitHub, ArgoCD, Datadog)  │
└─────────────────────────────────────────────┘
```

### 4. Platform as a Product

Treat internal developers as **customers**. "We built it, use it" becomes "What do developers need?"

- **Product Manager**: Collect requirements, prioritize
- **UX Research**: Observe workflows, find pain points
- **Release Cycles**: Version the platform, provide changelogs
- **SLA Promises**: "Self-service portal 99.9% availability"
- **Feedback Loop**: NPS, surveys, usage analytics

### 5. Golden Paths / Paved Roads

**Golden Path** is an organization-recommended standardized technology approach.

- **Not enforced, recommended**: "This path is fastest and safest"
- **Pre-validated**: Already verified for security, performance, operations
- **Freedom guaranteed**: You can deviate, but you own the responsibility

**Without Golden Path:**
```
New microservice:
1. Manually create Git repo
2. Write Dockerfile from scratch (copy from another team)
3. Copy K8s manifests (maybe outdated version)
4. Write CI/CD manually (2 days of work)
5. Monitoring? "Later..."
6. Security scanning? "What's that?"
```

**With Golden Path:**
```
New microservice:
1. Open Backstage → "Spring Boot Service" template
2. Enter name, team, dependencies
3. Done! Git repo + CI/CD + K8s manifests + monitoring dashboard created
4. Just write code
```

---

## 🔍 Deep Dive

### 1. Backstage (Spotify OSS)

Backstage is the most popular open-source IDP framework. Spotify created it and donated to CNCF.

**Core Components:**

- **Software Catalog**: Central registry of all services, APIs, libraries with ownership and dependencies
- **Software Templates (Scaffolder)**: Generate projects with standard structure, CI/CD, monitoring
- **TechDocs**: Auto-rendered technical documentation from Git repos
- **Search**: Unified search across all catalog items
- **Plugins**: Integrate with K8s, Grafana, GitHub Actions, Snyk, etc.

**Service Registration (catalog-info.yaml):**

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: payment-service
  description: "Payment processing microservice"
  annotations:
    github.com/project-slug: myorg/payment-service
  tags:
    - java
    - spring-boot
    - payments
spec:
  type: service
  lifecycle: production
  owner: team-payments
  providesApis:
    - payment-api
  consumesApis:
    - user-api
    - inventory-api
```

**Project Template (Scaffolder):**

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: spring-boot-service
  title: Spring Boot Microservice
  description: |
    Creates Spring Boot microservice with:
    - CI/CD pipeline
    - Dockerfile
    - K8s manifests
    - Grafana dashboard
    - Alert setup
spec:
  owner: team-platform
  type: service

  parameters:
    - title: Service Info
      required:
        - serviceName
        - owner
      properties:
        serviceName:
          title: Service Name
          type: string
          pattern: "^[a-z][a-z0-9-]*$"
        owner:
          title: Owning Team
          type: string
          ui:field: OwnerPicker
        javaVersion:
          title: Java Version
          type: string
          enum: ["17", "21"]
          default: "21"

  steps:
    # Generate from template
    - id: fetch-template
      name: Scaffold Project
      action: fetch:template
      input:
        url: ./skeleton
        values:
          serviceName: ${{ parameters.serviceName }}
          javaVersion: ${{ parameters.javaVersion }}

    # Create GitHub repo
    - id: publish
      name: Create GitHub Repo
      action: publish:github
      input:
        repoUrl: github.com?owner=myorg&repo=${{ parameters.serviceName }}

    # Register in catalog
    - id: register
      name: Register in Catalog
      action: catalog:register
      input:
        repoContentsUrl: ${{ steps['publish'].output.repoContentsUrl }}
        catalogInfoPath: /catalog-info.yaml

  output:
    links:
      - title: GitHub Repository
        url: ${{ steps['publish'].output.remoteUrl }}
      - title: Backstage Catalog
        url: ${{ steps['register'].output.catalogInfoUrl }}
```

---

### 2. Self-Service Portal

Self-service means **"No tickets, no approval waiting, developers do it directly."**

**Database Provisioning Template Example:**

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: provision-database
  title: Create PostgreSQL Database
  description: "Provision RDS PostgreSQL instance via self-service"
spec:
  owner: team-platform
  type: resource

  parameters:
    - title: Database Config
      required:
        - dbName
        - environment
        - size
      properties:
        dbName:
          title: Database Name
          type: string
          pattern: "^[a-z][a-z0-9_]*$"
        environment:
          title: Environment
          type: string
          enum: ["dev", "staging"]
        size:
          title: Instance Size
          type: string
          enum: ["small", "medium", "large"]
          enumNames:
            - "Small (2 vCPU, 8GB) - dev/test"
            - "Medium (4 vCPU, 16GB) - small services"
            - "Large (8 vCPU, 32GB) - medium services"
        backup:
          title: Auto Backup
          type: boolean
          default: true

  steps:
    # Generate Terraform
    - id: create-terraform
      name: Generate Terraform Code
      action: fetch:template
      input:
        url: ./terraform-rds-template
        values:
          dbName: ${{ parameters.dbName }}
          environment: ${{ parameters.environment }}

    # Create PR
    - id: create-pr
      name: Create Infrastructure PR
      action: publish:github:pull-request
      input:
        repoUrl: github.com?owner=myorg&repo=infrastructure
        branchName: provision-db-${{ parameters.dbName }}
        title: "[Self-Service] DB Provisioning: ${{ parameters.dbName }}"
        description: |
          Created by: ${{ user.entity.metadata.name }}
          Environment: ${{ parameters.environment }}
          Size: ${{ parameters.size }}
          Backup: ${{ parameters.backup }}

  output:
    links:
      - title: Infrastructure PR
        url: ${{ steps['create-pr'].output.pullRequestUrl }}
```

---

### 3. Service Catalog Benefits

- **Clear Ownership**: "Who owns service X?"
- **Dependency Graph**: Understand what depends on what
- **Technology Radar**: See stack composition across organization
- **API Discovery**: Find and understand available APIs
- **Onboarding**: New developers understand services faster

---

### 4. Golden Paths in Practice

```
Common Golden Paths:

🛣️ Path 1: REST API Service
   Framework: Spring Boot
   Container: Docker
   Orchestration: Kubernetes
   CI/CD: GitHub Actions → ArgoCD
   Monitoring: Prometheus + Grafana
   Logging: ELK Stack

🛣️ Path 2: Async Worker
   Framework: Spring Boot + Kafka
   Container: Docker
   Orchestration: Kubernetes
   CI/CD: GitHub Actions → ArgoCD
   Monitoring: Prometheus + Grafana

🛣️ Path 3: Data Pipeline
   Framework: Apache Airflow
   Container: Docker
   Orchestration: Kubernetes
   CI/CD: GitHub Actions → ArgoCD
   Monitoring: Custom dashboards

Each path includes:
✅ Pre-configured monitoring dashboards
✅ Security best practices embedded
✅ Deployment runbooks
✅ On-call setup
✅ Cost optimization guidelines
✅ Documentation templates
```

---

### 5. DX Metrics (Developer Experience)

Measure developer satisfaction and productivity:

| Metric | How to Measure | Target |
|--------|----------------|--------|
| **Onboarding Time** | Days to first commit | < 2 days |
| **Service Creation** | Time from request to "hello world" | < 30 min |
| **Deploy Frequency** | Deploys per week | > 1/day |
| **Lead Time** | Commit to production | < 1 hour |
| **Feedback Loop** | Code change to test results | < 5 min |
| **Platform Uptime** | Self-service portal availability | > 99.9% |
| **Developer NPS** | Net Promoter Score of platform | > 50 |

---

## 💻 Getting Started

### Step 1: Install Backstage (Docker)

```bash
npx @backstage/create-app@latest

# Start locally
cd my-backstage-app
yarn dev

# Open http://localhost:3000
```

### Step 2: Create Software Catalog

```yaml
# catalog-info.yaml in service repo
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  description: My awesome service
spec:
  type: service
  owner: my-team
  lifecycle: production
```

### Step 3: Create Service Template

```bash
# Use Backstage template generator
```

### Step 4: Add Plugins

```bash
# Add Kubernetes plugin
yarn add @backstage/plugin-kubernetes

# Add Grafana plugin
yarn add @backstage/plugin-grafana
```

---

This comprehensive guide covers Platform Engineering from principles through real-world implementation. Start with a Software Catalog, add Templates progressively, and build your IDP step-by-step.
