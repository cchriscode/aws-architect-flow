# GitHub Actions in Practice

> We learned about CI pipeline concepts in the [previous lecture](./03-ci-pipeline) and CD strategies in the [CD lecture](./04-cd-pipeline). Now we'll dive deep into **GitHub Actions**, one of the most popular CI/CD platforms. We'll cover everything from Workflow YAML structure to triggers, Actions Marketplace, Secrets management, Environment protection, Matrix strategies, reusable workflows, and AWS OIDC deployment — all with hands-on examples.

---

## 🎯 Why Learn GitHub Actions?

### Everyday Analogy: Automated Factory Production Line

Think of an automobile factory. Once the design blueprint (code) is finalized, the **automated production line** handles component assembly (build) → quality inspection (test) → painting and finishing (packaging) → shipping (deployment) in sequence.

GitHub Actions is essentially this **software factory's automated production line**.

- **Workflow** = The entire production line blueprint
- **Job** = Each process stage (assembly, inspection, painting)
- **Step** = Detailed tasks within a process (tightening bolts, spraying paint)
- **Runner** = The actual robotic arm performing the work (GitHub-hosted or Self-hosted)
- **Trigger** = The production signal, like "new order received!"
- **Secrets** = Credentials stored in a safe vault (never exposed externally)

### Real-World Moments When You Need GitHub Actions

```
Real-world scenarios for GitHub Actions:
• I want auto-build and auto-test when PR is submitted         → on: pull_request
• I want auto-deploy when code is merged to main               → on: push + environment
• I want to test across multiple versions (Node, Python, Go)   → matrix strategy
• I want to deploy to AWS safely without long-lived keys       → OIDC + assume role
• I want to reuse the same CI logic across repos               → reusable workflows
• I want team lead approval before production deployment       → environment protection rules
• I want automated security scans at 2 AM daily                → on: schedule (cron)
• I want faster builds                                          → caching + artifacts
```

We'll now **implement the CI pipeline concepts** from the earlier lecture **using GitHub Actions**.

---

## 🧠 Core Concepts

To understand GitHub Actions, you need to grasp seven key components.

### Analogy: Factory Automation System

| Factory World | GitHub Actions |
|-----------|---------------|
| Complete production line blueprint | **Workflow** (YAML file) |
| Production start signal (new order, regular production) | **Event/Trigger** (push, PR, schedule, etc.) |
| Each process stage (assembly, inspection, painting) | **Job** (build, test, deploy) |
| Detailed tasks within a process | **Step** (checkout, install, test, etc.) |
| Robotic arm performing the work | **Runner** (ubuntu-latest, self-hosted, etc.) |
| Factory access card/vault password | **Secrets** (API keys, passwords) |
| Generic components purchased from market | **Actions** (actions/checkout, actions/cache, etc.) |

### Full Architecture at a Glance

```mermaid
flowchart TB
    subgraph WF["📄 Workflow (.github/workflows/*.yml)"]
        direction TB

        subgraph TRIGGER["🔔 Event Triggers"]
            PUSH["push"]
            PR["pull_request"]
            SCHEDULE["schedule"]
            MANUAL["workflow_dispatch"]
        end

        subgraph JOB1["🔧 Job: build"]
            direction TB
            S1["Step 1: Checkout code"]
            S2["Step 2: Setup Node.js"]
            S3["Step 3: Install dependencies"]
            S4["Step 4: Build"]
        end

        subgraph JOB2["🧪 Job: test"]
            direction TB
            S5["Step 1: Checkout code"]
            S6["Step 2: Run tests"]
            S7["Step 3: Coverage report"]
        end

        subgraph JOB3["🚀 Job: deploy"]
            direction TB
            S8["Step 1: AWS auth (OIDC)"]
            S9["Step 2: Execute deployment"]
        end
    end

    TRIGGER --> JOB1
    JOB1 --> JOB2
    JOB2 --> JOB3

    S1 --> S2 --> S3 --> S4
    S5 --> S6 --> S7
    S8 --> S9

    style TRIGGER fill:#3498db,color:#fff
    style JOB1 fill:#2ecc71,color:#fff
    style JOB2 fill:#f39c12,color:#fff
    style JOB3 fill:#e74c3c,color:#fff
```

### Workflow YAML File Location

```
my-project/
├── .github/
│   └── workflows/           # ← Put YAML files in this directory
│       ├── ci.yml           # CI workflow
│       ├── cd.yml           # CD workflow
│       └── scheduled.yml    # Scheduled workflow
├── src/
├── tests/
└── package.json
```

> Key Point: Only `.yml` or `.yaml` files in the `.github/workflows/` directory are recognized by GitHub Actions. You can name the files freely.

---

## 🔍 Understanding Each Component in Detail

### 1. Workflow YAML Structure

Everything in GitHub Actions is defined in a YAML file. Let's explore the basic structure.

```yaml
# .github/workflows/ci.yml

# ─────────────────────────────────────────────
# 1) Workflow name (displayed in GitHub UI)
# ─────────────────────────────────────────────
name: CI Pipeline

# ─────────────────────────────────────────────
# 2) When to execute (Event Trigger)
# ─────────────────────────────────────────────
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

# ─────────────────────────────────────────────
# 3) Environment variables (used throughout workflow)
# ─────────────────────────────────────────────
env:
  NODE_VERSION: '20'
  CI: true

# ─────────────────────────────────────────────
# 4) Permission settings (GITHUB_TOKEN scope)
# ─────────────────────────────────────────────
permissions:
  contents: read
  pull-requests: write

# ─────────────────────────────────────────────
# 5) Concurrency control
# ─────────────────────────────────────────────
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

# ─────────────────────────────────────────────
# 6) Job definitions
# ─────────────────────────────────────────────
jobs:
  build:
    name: Build & Test
    runs-on: ubuntu-latest       # Runner selection

    steps:
      - name: Checkout code       # Step name
        uses: actions/checkout@v4 # Action to use

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:                     # Input values for the Action
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci               # Execute shell command

      - name: Run tests
        run: npm test
```

Let's clarify what each level means:

| Level | Keyword | Role | Analogy |
|-------|--------|------|---------|
| Top | `name` | Workflow name | Production line name |
| Top | `on` | Trigger event | Production start condition |
| Top | `env` | Global environment variables | Factory-wide settings |
| Top | `permissions` | GITHUB_TOKEN permissions | Security access level |
| Top | `concurrency` | Concurrency control | Prevent multiple products on same line |
| Top | `jobs` | Job list | Process list |
| Job | `runs-on` | Execution environment | Which robotic arm to use |
| Job | `steps` | Step execution list | Detailed work sequence |
| Step | `uses` | Use Action | Install purchased component |
| Step | `run` | Execute shell command | Manual work |
| Step | `with` | Action input values | Component settings |

---

### 2. Event Triggers (Triggers)

This section defines "when to execute the workflow". GitHub Actions supports 30+ events.

```mermaid
flowchart LR
    subgraph CODE["Code Events"]
        PUSH["push<br/>Code push"]
        PR_EVENT["pull_request<br/>PR create/update"]
        PR_TARGET["pull_request_target<br/>External PR (fork)"]
    end

    subgraph SCHEDULE["Time Events"]
        CRON["schedule<br/>Cron expression"]
    end

    subgraph MANUAL["Manual Events"]
        DISPATCH["workflow_dispatch<br/>Manual run (UI/API)"]
        CALL["workflow_call<br/>Called from other workflow"]
    end

    subgraph OTHER["Other Events"]
        RELEASE_EV["release<br/>Release published"]
        ISSUE["issues<br/>Issue created/updated"]
        TAG["push (tags)<br/>Tag created"]
    end

    CODE --> WF["🔄 Workflow Execution"]
    SCHEDULE --> WF
    MANUAL --> WF
    OTHER --> WF

    style WF fill:#2ecc71,color:#fff
    style CODE fill:#3498db,color:#fff
    style SCHEDULE fill:#9b59b6,color:#fff
    style MANUAL fill:#f39c12,color:#fff
    style OTHER fill:#e74c3c,color:#fff
```

#### push event

```yaml
on:
  push:
    # React only to specific branches
    branches:
      - main
      - 'release/**'        # release/1.0, release/2.0, etc.

    # Exclude specific branches
    branches-ignore:
      - 'experiment/**'

    # Only when files in specific paths change
    paths:
      - 'src/**'
      - 'package.json'

    # Exclude specific paths
    paths-ignore:
      - 'docs/**'
      - '**.md'

    # React to tags
    tags:
      - 'v*'                # v1.0.0, v2.1.3, etc.
```

#### pull_request event

```yaml
on:
  pull_request:
    branches: [main]
    types:
      - opened              # PR newly created
      - synchronize         # New commit added to PR
      - reopened            # Closed PR reopened
    paths:
      - 'src/**'
      - 'tests/**'
```

> Note: The default `types` for `pull_request` are `[opened, synchronize, reopened]`. To use `labeled`, `closed`, etc., you must explicitly specify them.

#### schedule event (cron)

```yaml
on:
  schedule:
    # ┌───────────── minute (0-59)
    # │ ┌───────────── hour (0-23)
    # │ │ ┌───────────── day of month (1-31)
    # │ │ │ ┌───────────── month (1-12)
    # │ │ │ │ ┌───────────── day of week (0-6, 0=Sunday)
    # │ │ │ │ │
    - cron: '30 2 * * 1-5'   # Monday-Friday 2:30 AM (UTC)
    - cron: '0 9 * * 1'      # Every Monday 9:00 AM (UTC)
```

> Note: Schedule times are in **UTC**. Korea Standard Time (KST) is UTC+9, so to run at 2 AM Korea time, set UTC 17:00 (previous day).

#### workflow_dispatch (manual run)

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

      version:
        description: 'Deployment version (e.g., v1.2.3)'
        required: false
        type: string

      dry_run:
        description: 'Test mode (do not actually deploy)'
        required: false
        type: boolean
        default: false
```

Input values passed in manual execution are referenced as `${{ github.event.inputs.environment }}`.

#### Multiple triggers

```yaml
# You can specify multiple events simultaneously
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'     # Every Sunday midnight
  workflow_dispatch:          # Manual run also available
```

---

### 3. Jobs and Steps

#### Job basic structure

```yaml
jobs:
  # Job ID (alphanumeric, -, _ allowed)
  build:
    name: Build Application        # Name displayed in GitHub UI
    runs-on: ubuntu-latest         # Runner selection
    timeout-minutes: 15            # Max execution time (default 360 minutes)

    # Environment variables for this Job
    env:
      BUILD_ENV: production

    steps:
      - uses: actions/checkout@v4
      - run: echo "Hello, World!"

  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: build                    # Runs only after build succeeds

    steps:
      - uses: actions/checkout@v4
      - run: npm test

  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: [build, test]            # Runs only after both build and test succeed
    if: github.ref == 'refs/heads/main'  # Only on main branch

    steps:
      - run: echo "Deploying..."
```

#### Job dependency relationships

```mermaid
flowchart LR
    subgraph PARALLEL["Parallel Execution"]
        LINT["lint"]
        TYPECHECK["typecheck"]
    end

    BUILD["build"] --> PARALLEL
    LINT --> TEST["test"]
    TYPECHECK --> TEST
    TEST --> DEPLOY_STG["deploy-staging"]
    DEPLOY_STG --> APPROVE{"Manual Approval<br/>(environment)"}
    APPROVE --> DEPLOY_PROD["deploy-production"]

    style BUILD fill:#3498db,color:#fff
    style LINT fill:#2ecc71,color:#fff
    style TYPECHECK fill:#2ecc71,color:#fff
    style TEST fill:#f39c12,color:#fff
    style DEPLOY_STG fill:#e67e22,color:#fff
    style APPROVE fill:#9b59b6,color:#fff
    style DEPLOY_PROD fill:#e74c3c,color:#fff
```

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build

  lint:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    needs: [lint, typecheck]         # Waits for both lint and typecheck
    steps:
      - uses: actions/checkout@v4
      - run: npm test

  deploy-staging:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - run: echo "Deploying to staging..."

  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment: production           # Requires approval!
    steps:
      - run: echo "Deploying to production..."
```

#### Step details

Steps can be defined in two ways.

```yaml
steps:
  # Method 1: Using Actions (uses)
  - name: Checkout code
    uses: actions/checkout@v4       # {owner}/{repo}@{ref}
    with:                           # Input values for the Action
      fetch-depth: 0                # Full Git history

  # Method 2: Execute shell commands (run)
  - name: Install dependencies
    run: |
      npm ci
      echo "Installation complete!"
    shell: bash                     # Default (can be omitted)
    working-directory: ./frontend   # Execution directory

  # Pass data between Steps (Output)
  - name: Get version
    id: version                     # ID for reference from other Steps
    run: |
      VERSION=$(node -p "require('./package.json').version")
      echo "app_version=$VERSION" >> "$GITHUB_OUTPUT"

  - name: Use version
    run: echo "Version is ${{ steps.version.outputs.app_version }}"

  # Conditional execution
  - name: Only on main branch
    if: github.ref == 'refs/heads/main'
    run: echo "This is main branch"

  # Always execute (even if previous Step fails)
  - name: Cleanup
    if: always()
    run: echo "Cleaning up..."

  # Execute only when previous Step fails
  - name: Notify failure
    if: failure()
    run: echo "Something went wrong!"
```

#### Passing data between Jobs (outputs)

```yaml
jobs:
  prepare:
    runs-on: ubuntu-latest
    # Define job output values
    outputs:
      version: ${{ steps.get_version.outputs.version }}
      should_deploy: ${{ steps.check.outputs.deploy }}

    steps:
      - uses: actions/checkout@v4

      - name: Get version
        id: get_version
        run: echo "version=1.2.3" >> "$GITHUB_OUTPUT"

      - name: Check deployment
        id: check
        run: echo "deploy=true" >> "$GITHUB_OUTPUT"

  deploy:
    runs-on: ubuntu-latest
    needs: prepare
    if: needs.prepare.outputs.should_deploy == 'true'

    steps:
      - run: echo "Deploying version ${{ needs.prepare.outputs.version }}"
```

---

### 4. Runner (Execution Environment)

The Runner is the machine where the workflow actually executes.

#### GitHub-hosted Runner

These are virtual machines provided by GitHub. Each Job starts in a clean environment.

```yaml
jobs:
  linux-job:
    runs-on: ubuntu-latest         # Ubuntu 22.04
    # runs-on: ubuntu-24.04        # Specify specific version

  macos-job:
    runs-on: macos-latest          # macOS (Apple Silicon)
    # runs-on: macos-13            # Specify Intel Mac

  windows-job:
    runs-on: windows-latest        # Windows Server 2022
```

| Runner | vCPU | RAM | Storage | Use Case |
|--------|------|-----|---------|----------|
| `ubuntu-latest` | 4 | 16GB | 14GB SSD | Most CI/CD |
| `macos-latest` | 3 (M1) | 7GB | 14GB SSD | iOS/macOS builds |
| `windows-latest` | 4 | 16GB | 14GB SSD | .NET/Windows builds |

#### Self-hosted Runner

You can register your own server as a Runner.

```yaml
jobs:
  deploy:
    # Use self-hosted runner
    runs-on: [self-hosted, linux, x64]

    # Or specify by label
    # runs-on: [self-hosted, gpu]          # Runner with GPU
    # runs-on: [self-hosted, production]   # Runner with production network access
```

When you need Self-hosted Runners:
- Need access to internal network (VPC)
- Need special hardware (GPU, ARM)
- GitHub-hosted Runner specs are insufficient
- Security policy prohibits external runners

---

### 5. Actions Marketplace

Actions are **reusable unit tasks**. You can create your own or use verified Actions from the Marketplace.

#### Frequently Used Official Actions

```yaml
steps:
  # 1. Checkout code (used in almost all workflows)
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0               # Full history (0), only latest commit (1, default)
      token: ${{ secrets.PAT }}    # For private submodules

  # 2. Setup Node.js
  - uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'                 # Auto-manage node_modules cache

  # 3. Setup Python
  - uses: actions/setup-python@v5
    with:
      python-version: '3.12'
      cache: 'pip'

  # 4. Setup Java
  - uses: actions/setup-java@v4
    with:
      distribution: 'temurin'
      java-version: '21'
      cache: 'gradle'

  # 5. Setup Go
  - uses: actions/setup-go@v5
    with:
      go-version: '1.22'
      cache: true

  # 6. Setup Docker Buildx
  - uses: docker/setup-buildx-action@v3

  # 7. Login to Docker Hub
  - uses: docker/login-action@v3
    with:
      username: ${{ secrets.DOCKERHUB_USERNAME }}
      password: ${{ secrets.DOCKERHUB_TOKEN }}

  # 8. Build & push Docker image
  - uses: docker/build-push-action@v6
    with:
      push: true
      tags: myapp:latest
      cache-from: type=gha          # Use GitHub Actions cache
      cache-to: type=gha,mode=max

  # 9. AWS authentication (OIDC)
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789012:role/GitHubActions
      aws-region: ap-northeast-2

  # 10. Setup Terraform
  - uses: hashicorp/setup-terraform@v3
    with:
      terraform_version: 1.7.0
```

#### How to specify Action version

```yaml
# Method 1: Tag (recommended - lock major version)
- uses: actions/checkout@v4          # Latest from v4.x.x

# Method 2: Exact tag
- uses: actions/checkout@v4.1.7      # Lock to exact version

# Method 3: SHA (most secure - prevent supply chain attack)
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11

# Method 4: Branch (not recommended - unstable)
- uses: actions/checkout@main        # Can change unexpectedly!
```

> Practical Tip: For security-critical projects, pin by SHA and auto-update via Dependabot for the most secure approach.

---

### 6. Secrets and Variables Management

#### Secrets (confidential values)

Secrets are encrypted and masked in logs.

```yaml
# How to use Secrets
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        run: |
          echo "Deploying..."
          curl -X POST ${{ secrets.DEPLOY_URL }} \
            -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}"
        env:
          # Safer to pass as environment variables
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          API_KEY: ${{ secrets.API_KEY }}
```

Where to configure Secrets:

| Level | Scope | Configuration Path |
|------|-------|-------------------|
| Repository | Only this repo | Settings → Secrets and variables → Actions |
| Environment | Only specific environment | Settings → Environments → [Environment name] → Secrets |
| Organization | Selected repos in org | Organization Settings → Secrets |

#### Variables (non-secret values)

Unlike Secrets, these are not encrypted.

```yaml
# How to use Variables
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Build
        run: |
          echo "Building for ${{ vars.DEPLOY_REGION }}"
          echo "App name: ${{ vars.APP_NAME }}"
```

#### GITHUB_TOKEN (auto-provided)

GitHub automatically provides this token when running a workflow.

```yaml
permissions:
  contents: read           # Read code
  pull-requests: write     # Write PR comments
  issues: write            # Write issue comments
  packages: write          # Push GHCR packages
  id-token: write          # Issue OIDC token (required for AWS auth!)

jobs:
  comment:
    runs-on: ubuntu-latest
    steps:
      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: 'Build successful! ✅'
            })
```

---

### 7. Environments and Protection Rules

Environments let you define deployment targets and set protection rules.

```yaml
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.myapp.com    # Link displayed in GitHub UI

    steps:
      - name: Deploy to staging
        run: echo "Deploying to staging..."
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}  # staging Secret

  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment:
      name: production
      url: https://myapp.com

    steps:
      - name: Deploy to production
        run: echo "Deploying to production..."
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}  # production Secret
```

#### Setting Protection Rules

Configure in GitHub web UI: Settings → Environments → [Environment name]

| Protection Rule | Description | Example |
|-----------|------|---------|
| Required reviewers | Specified person must approve deployment | Team lead approval for production |
| Wait timer | Wait N minutes after approval before execution | 5-minute wait before deploy (time to cancel) |
| Deployment branches | Only deploy from specific branches | Only main branch can deploy to production |
| Custom rules | External API approval/rejection | Verify Jira ticket status, security scan passed |

```
Example approval flow:

Developer merges to main
    ↓
Auto-deploy to staging
    ↓
Production deployment triggered
    ↓
🔒 Protection Rule activated!
    ↓
"Manager, please approve deployment" (Slack/Email notification)
    ↓
Manager approves → Wait 5 minutes → Deployment starts
```

---

### 8. Matrix Strategy

Use matrix strategies to test multiple environment combinations simultaneously. Test across Node 18, 20, 22 or build on both Ubuntu and Windows at the same time.

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}

    strategy:
      # If one fails, others continue
      fail-fast: false

      # Limit concurrent runs (prevent API rate limits)
      max-parallel: 4

      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18, 20, 22]

        # Add specific combinations
        include:
          - os: ubuntu-latest
            node-version: 22
            experimental: true         # Define additional variable

        # Exclude specific combinations
        exclude:
          - os: macos-latest
            node-version: 18           # Skip macOS + Node 18

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - run: npm ci
      - run: npm test
```

Combinations created by this configuration:

```
Total Jobs: 3 OS × 3 Node - 1 exclude = 8 Jobs running in parallel!

✅ ubuntu-latest  + Node 18
✅ ubuntu-latest  + Node 20
✅ ubuntu-latest  + Node 22 (experimental: true)
✅ windows-latest + Node 18
✅ windows-latest + Node 20
✅ windows-latest + Node 22
❌ macos-latest   + Node 18 (excluded)
✅ macos-latest   + Node 20
✅ macos-latest   + Node 22
```

---

### 9. Caching

A key feature that significantly speeds up builds. No need to re-download dependencies each time.

#### Using actions/cache directly

```yaml
steps:
  - uses: actions/checkout@v4

  # npm cache
  - name: Cache node_modules
    uses: actions/cache@v4
    id: npm-cache
    with:
      path: ~/.npm                    # Path to cache
      key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
      restore-keys: |
        ${{ runner.os }}-npm-

  - name: Install dependencies
    if: steps.npm-cache.outputs.cache-hit != 'true'  # Only on cache miss
    run: npm ci
```

#### Built-in caching in setup-* Actions (easier!)

```yaml
steps:
  # Node.js + npm cache auto-managed
  - uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'                    # Just add this!

  # Python + pip cache
  - uses: actions/setup-python@v5
    with:
      python-version: '3.12'
      cache: 'pip'

  # Go modules cache
  - uses: actions/setup-go@v5
    with:
      go-version: '1.22'
      cache: true
```

#### Docker layer caching

```yaml
steps:
  - uses: docker/setup-buildx-action@v3

  - uses: docker/build-push-action@v6
    with:
      push: true
      tags: myapp:latest
      # Use GitHub Actions cache backend
      cache-from: type=gha
      cache-to: type=gha,mode=max
```

> Cache size limit: Max 10GB per repo. Old caches auto-delete after 7 days. When over capacity, oldest caches are deleted first.

---

### 10. Artifacts

Share build results and test reports between Jobs or download them.

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build

      # Upload build artifact
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/                  # Directory/file to upload
          retention-days: 7            # Keep for 7 days (default 90)
          if-no-files-found: error     # Error if no files found

  deploy:
    runs-on: ubuntu-latest
    needs: build
    steps:
      # Download build artifact
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/

      - name: Deploy
        run: |
          ls -la dist/
          echo "Deploying build artifacts..."

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test -- --coverage

      # Upload test report
      - name: Upload test results
        if: always()                   # Upload even if test fails
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            coverage/
            junit-report.xml
```

---

### 11. Concurrency (Concurrency Control)

Prevent multiple workflows from running simultaneously. If you push multiple times to the same branch quickly, cancel the previous workflow and run only the latest one.

```yaml
# Workflow-level concurrency
concurrency:
  # Workflows with same group don't run concurrently
  group: ${{ github.workflow }}-${{ github.ref }}
  # Cancel waiting previous runs
  cancel-in-progress: true

# Or set at Job level
jobs:
  deploy:
    runs-on: ubuntu-latest
    concurrency:
      group: deploy-${{ github.event.inputs.environment }}
      cancel-in-progress: false      # Don't cancel deployment!
```

Common patterns:

```yaml
# CI (PR builds): Cancel previous run OK
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true          # Only need to test latest commit

# CD (deployment): Don't cancel!
concurrency:
  group: deploy-production
  cancel-in-progress: false          # In-progress deployment must complete
```

---

### 12. Reusable Workflows and Composite Actions

Use these when you want to share the same CI/CD logic across multiple repositories.

#### Reusable Workflow

**Defining side** (`.github/workflows/reusable-build.yml`):

```yaml
# Reusable workflow that can be called from other workflows
name: Reusable Build

on:
  workflow_call:                     # ← Core of reusable workflow!
    inputs:
      node-version:
        description: 'Node.js version'
        required: false
        default: '20'
        type: string

      environment:
        description: 'Deployment environment'
        required: true
        type: string

    secrets:
      deploy-token:
        description: 'Deployment token'
        required: true

    outputs:
      build-version:
        description: 'Built version'
        value: ${{ jobs.build.outputs.version }}

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.value }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - name: Get version
        id: version
        run: echo "value=$(node -p "require('./package.json').version")" >> "$GITHUB_OUTPUT"

      - name: Deploy
        run: echo "Deploying to ${{ inputs.environment }}"
        env:
          DEPLOY_TOKEN: ${{ secrets.deploy-token }}
```

**Calling side** (`.github/workflows/ci.yml`):

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]

jobs:
  call-build:
    # Call reusable workflow from same repo
    uses: ./.github/workflows/reusable-build.yml
    with:
      node-version: '20'
      environment: 'staging'
    secrets:
      deploy-token: ${{ secrets.DEPLOY_TOKEN }}

  call-external:
    # Call reusable workflow from different repo
    uses: my-org/shared-workflows/.github/workflows/deploy.yml@main
    with:
      environment: 'production'
    secrets: inherit                  # Pass all Secrets

  post-deploy:
    needs: call-build
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deployed version ${{ needs.call-build.outputs.build-version }}"
```

#### Composite Action

Wrap multiple Steps into a single Action.

**Define** (`.github/actions/setup-and-build/action.yml`):

```yaml
name: 'Setup and Build'
description: 'Setup Node.js + install dependencies + build in one step'

inputs:
  node-version:
    description: 'Node.js version'
    required: false
    default: '20'

  build-command:
    description: 'Build command'
    required: false
    default: 'npm run build'

outputs:
  build-path:
    description: 'Build output path'
    value: ${{ steps.build.outputs.path }}

runs:
  using: 'composite'                 # ← Core of Composite Action!
  steps:
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'npm'

    - name: Install dependencies
      shell: bash                    # shell is required for composite!
      run: npm ci

    - name: Build
      id: build
      shell: bash
      run: |
        ${{ inputs.build-command }}
        echo "path=dist" >> "$GITHUB_OUTPUT"
```

**Use** (`.github/workflows/ci.yml`):

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Use local Composite Action
      - uses: ./.github/actions/setup-and-build
        with:
          node-version: '20'
          build-command: 'npm run build:prod'
```

#### Reusable Workflow vs Composite Action Comparison

| Characteristic | Reusable Workflow | Composite Action |
|-------|-------------------|------------------|
| Definition location | `.github/workflows/` | Anywhere (`action.yml`) |
| How to call | `uses:` (Job level) | `uses:` (Step level) |
| Own Runner | Yes (`runs-on` required) | No (uses caller's Runner) |
| Pass Secrets | Explicit or `inherit` | Environment variables |
| Nesting depth | Max 4 levels | Max 10 levels |
| Use case | Reuse entire CI/CD pipelines | Reuse repeated Step groups |

---

### 13. Deploy to AWS with OIDC

Traditionally, accessing AWS required storing Access Key and Secret Key in GitHub Secrets. But this approach has key exposure risks and burdensome key rotation management.

Using **OIDC (OpenID Connect)**, you can access AWS from GitHub Actions **without long-lived keys** — much safer.

```mermaid
sequenceDiagram
    participant GA as GitHub Actions
    participant GH as GitHub OIDC Provider
    participant STS as AWS STS
    participant AWS as AWS Services

    GA->>GH: 1. Request OIDC token
    GH-->>GA: 2. Issue JWT token (short-lived, auto-expires)
    GA->>STS: 3. AssumeRoleWithWebIdentity (submit JWT)
    Note over STS: Validate Trust Policy<br/>- Is this correct GitHub repo?<br/>- Is this correct branch?
    STS-->>GA: 4. Issue temporary AWS credentials (1 hour)
    GA->>AWS: 5. Call AWS services with temp credentials
    Note over AWS: S3, ECS, Lambda, etc.
```

#### AWS-side configuration (written with [Terraform](../06-iac/02-terraform-basics))

```hcl
# 1. Register GitHub OIDC Provider
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

# 2. Create IAM Role (for GitHub Actions to assume)
resource "aws_iam_role" "github_actions" {
  name = "github-actions-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            # Only allow specific repo
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            # Only allow main branch of specific repo
            "token.actions.githubusercontent.com:sub" = "repo:my-org/my-repo:ref:refs/heads/main"
          }
        }
      }
    ]
  })
}

# 3. Grant required permissions (example: ECS deployment)
resource "aws_iam_role_policy_attachment" "ecs_deploy" {
  role       = aws_iam_role.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonECS_FullAccess"
}
```

#### Using in GitHub Actions Workflow

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest

    # OIDC requires id-token write permission
    permissions:
      id-token: write
      contents: read

    steps:
      - uses: actions/checkout@v4

      # AWS authentication with OIDC (no long-lived keys needed!)
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions-deploy
          aws-region: ap-northeast-2
          # role-session-name: github-actions-${{ github.run_id }}  # Optional

      # Now you can freely use AWS CLI
      - name: Verify AWS identity
        run: aws sts get-caller-identity

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster my-cluster \
            --service my-service \
            --force-new-deployment
```

OIDC advantages:

| Item | Traditional (Access Key) | OIDC |
|------|----------------------|------|
| Key management | Manual rotation needed | Auto-expires (1 hour) |
| Leak risk | Permanent access if leaked | Short-lived token, restricted to repo+branch |
| Setup complexity | Just store key in Secret | Need to register OIDC Provider in AWS |
| Security level | Medium | High (close to Zero Trust) |

---

## 💻 Hands-On Practice

### Practice 1: Basic CI Workflow

Let's create a basic CI pipeline for a Node.js project.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
    paths-ignore:
      - 'docs/**'
      - '**.md'
  pull_request:
    branches: [main]

# Cancel previous runs on same branch
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ─────────────────────────────────────────
  # Job 1: Code quality check (lint + typecheck)
  # ─────────────────────────────────────────
  quality:
    name: Code Quality
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript check
        run: npm run typecheck

  # ─────────────────────────────────────────
  # Job 2: Test (Matrix for multiple Node versions)
  # ─────────────────────────────────────────
  test:
    name: Test (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    needs: quality

    strategy:
      fail-fast: false
      matrix:
        node-version: [18, 20, 22]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm test -- --coverage

      # Upload test results (even if fails)
      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-node-${{ matrix.node-version }}
          path: coverage/
          retention-days: 7

  # ─────────────────────────────────────────
  # Job 3: Build
  # ─────────────────────────────────────────
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      # Upload build artifacts (for deploy Job to use)
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/
          retention-days: 1
```

### Practice 2: Docker Build + ECR Push + ECS Deploy

```yaml
# .github/workflows/cd.yml
name: CD - Build and Deploy

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'Dockerfile'
      - 'package.json'

env:
  AWS_REGION: ap-northeast-2
  ECR_REPOSITORY: my-app
  ECS_CLUSTER: my-cluster
  ECS_SERVICE: my-service
  ECS_TASK_DEFINITION: .aws/task-definition.json
  CONTAINER_NAME: my-app

permissions:
  id-token: write
  contents: read

# Deploy only one at a time
concurrency:
  group: deploy-production
  cancel-in-progress: false

jobs:
  # ─────────────────────────────────────────
  # Job 1: Build Docker image & push to ECR
  # ─────────────────────────────────────────
  build-and-push:
    name: Build & Push to ECR
    runs-on: ubuntu-latest
    outputs:
      image: ${{ steps.build-image.outputs.image }}

    steps:
      - uses: actions/checkout@v4

      # Authenticate with AWS via OIDC
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      # Login to ECR
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      # Build & push Docker image
      - name: Build, tag, and push image
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build \
            --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
            --build-arg GIT_SHA=${{ github.sha }} \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:latest \
            .

          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> "$GITHUB_OUTPUT"

  # ─────────────────────────────────────────
  # Job 2: Deploy to Staging
  # ─────────────────────────────────────────
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build-and-push
    environment:
      name: staging
      url: https://staging.myapp.com

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      # Update Task Definition with new image tag
      - name: Update ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: ${{ env.ECS_TASK_DEFINITION }}
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ needs.build-and-push.outputs.image }}

      # Update ECS service
      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}-staging
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true

  # ─────────────────────────────────────────
  # Job 3: Production Deployment (approval required)
  # ─────────────────────────────────────────
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build-and-push, deploy-staging]
    environment:
      name: production
      url: https://myapp.com

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Update ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: ${{ env.ECS_TASK_DEFINITION }}
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ needs.build-and-push.outputs.image }}

      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
```

### Practice 3: Reusable Workflow Usage

Share the same build+deploy logic across multiple microservices.

**Shared workflow repo** (`my-org/shared-workflows`):

```yaml
# .github/workflows/docker-deploy.yml
name: Reusable Docker Deploy

on:
  workflow_call:
    inputs:
      service-name:
        required: true
        type: string
      dockerfile-path:
        required: false
        type: string
        default: './Dockerfile'
      aws-region:
        required: false
        type: string
        default: 'ap-northeast-2'
      environment:
        required: true
        type: string

    secrets:
      aws-role-arn:
        required: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}

    permissions:
      id-token: write
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.aws-role-arn }}
          aws-region: ${{ inputs.aws-region }}

      - name: Login to ECR
        id: ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          file: ${{ inputs.dockerfile-path }}
          push: true
          tags: |
            ${{ steps.ecr.outputs.registry }}/${{ inputs.service-name }}:${{ github.sha }}
            ${{ steps.ecr.outputs.registry }}/${{ inputs.service-name }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster main-cluster \
            --service ${{ inputs.service-name }}-${{ inputs.environment }} \
            --force-new-deployment
```

**Call from each microservice**:

```yaml
# user-service/.github/workflows/deploy.yml
name: Deploy User Service

on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    uses: my-org/shared-workflows/.github/workflows/docker-deploy.yml@main
    with:
      service-name: user-service
      environment: staging
    secrets:
      aws-role-arn: ${{ secrets.AWS_ROLE_ARN }}

  deploy-production:
    needs: deploy-staging
    uses: my-org/shared-workflows/.github/workflows/docker-deploy.yml@main
    with:
      service-name: user-service
      environment: production
    secrets:
      aws-role-arn: ${{ secrets.AWS_ROLE_ARN }}
```

```yaml
# order-service/.github/workflows/deploy.yml
name: Deploy Order Service

on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    uses: my-org/shared-workflows/.github/workflows/docker-deploy.yml@main
    with:
      service-name: order-service
      environment: staging
    secrets:
      aws-role-arn: ${{ secrets.AWS_ROLE_ARN }}
```

### Practice 4: Complete CI/CD Pipeline (Build → Test → Deploy)

A production-ready complete pipeline you can use immediately.

```yaml
# .github/workflows/pipeline.yml
name: Full CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      skip-tests:
        description: 'Skip tests (emergency deployment)'
        type: boolean
        default: false

env:
  NODE_VERSION: '20'
  AWS_REGION: ap-northeast-2

permissions:
  contents: read
  pull-requests: write
  id-token: write

concurrency:
  group: pipeline-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  # ═══════════════════════════════════════════
  # Stage 1: Code Quality (Parallel)
  # ═══════════════════════════════════════════
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high

  # ═══════════════════════════════════════════
  # Stage 2: Testing (Matrix)
  # ═══════════════════════════════════════════
  test:
    name: Test (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    needs: [lint, typecheck]
    if: ${{ !inputs.skip-tests }}

    strategy:
      fail-fast: false
      matrix:
        node-version: [18, 20, 22]

    services:
      # Test PostgreSQL container
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      # Test Redis container
      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        if: matrix.node-version == 20 && always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  # ═══════════════════════════════════════════
  # Stage 3: Build
  # ═══════════════════════════════════════════
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test, security]
    # Allow build to continue even if test was skipped
    if: |
      always() &&
      (needs.test.result == 'success' || needs.test.result == 'skipped') &&
      needs.security.result == 'success'

    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      version: ${{ steps.version.outputs.value }}

    steps:
      - uses: actions/checkout@v4

      - name: Get version
        id: version
        run: echo "value=$(node -p "require('./package.json').version")-${{ github.sha }}" >> "$GITHUB_OUTPUT"

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ steps.ecr.outputs.registry }}/my-app
          tags: |
            type=sha,prefix=
            type=raw,value=latest,enable={{is_default_branch}}

      - uses: docker/setup-buildx-action@v3

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ═══════════════════════════════════════════
  # Stage 4: Staging Deployment
  # ═══════════════════════════════════════════
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: staging
      url: https://staging.myapp.com

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to ECS (staging)
        run: |
          aws ecs update-service \
            --cluster main-cluster \
            --service my-app-staging \
            --force-new-deployment

      - name: Wait for deployment stability
        run: |
          aws ecs wait services-stable \
            --cluster main-cluster \
            --services my-app-staging

      - name: Health check
        run: |
          for i in $(seq 1 10); do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://staging.myapp.com/health)
            if [ "$STATUS" = "200" ]; then
              echo "Health check passed!"
              exit 0
            fi
            echo "Attempt $i: status $STATUS, retrying in 10s..."
            sleep 10
          done
          echo "Health check failed!"
          exit 1

  # ═══════════════════════════════════════════
  # Stage 5: Production Deployment (approval required)
  # ═══════════════════════════════════════════
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment:
      name: production
      url: https://myapp.com

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to ECS (production)
        run: |
          aws ecs update-service \
            --cluster main-cluster \
            --service my-app-production \
            --force-new-deployment

      - name: Wait for deployment stability
        run: |
          aws ecs wait services-stable \
            --cluster main-cluster \
            --services my-app-production

      - name: Verify deployment
        run: |
          for i in $(seq 1 10); do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://myapp.com/health)
            if [ "$STATUS" = "200" ]; then
              echo "Production deployment verified!"
              exit 0
            fi
            echo "Attempt $i: status $STATUS, retrying in 15s..."
            sleep 15
          done
          echo "Production health check failed!"
          exit 1

  # ═══════════════════════════════════════════
  # Notification: Send deployment result to Slack
  # ═══════════════════════════════════════════
  notify:
    name: Notify
    runs-on: ubuntu-latest
    needs: [deploy-production]
    if: always()

    steps:
      - name: Notify Slack
        uses: slackapi/slack-github-action@v2
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
          webhook-type: incoming-webhook
          payload: |
            {
              "text": "${{ needs.deploy-production.result == 'success' && 'Production deployment successful!' || 'Production deployment failed!' }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*${{ github.repository }}* deployment result\nResult: `${{ needs.deploy-production.result }}`\nBranch: `${{ github.ref_name }}`\nCommit: `${{ github.sha }}`"
                  }
                }
              ]
            }
```

The complete pipeline flow diagram:

```mermaid
flowchart TB
    subgraph TRIGGER["Triggers"]
        PUSH_MAIN["push to main"]
        PUSH_DEV["push to develop"]
        PR_MAIN["PR to main"]
        MANUAL["Manual run"]
    end

    subgraph STAGE1["Stage 1: Code Quality (Parallel)"]
        LINT["lint"]
        TYPE["typecheck"]
        SEC["security scan"]
    end

    subgraph STAGE2["Stage 2: Testing (Matrix)"]
        T18["test Node 18"]
        T20["test Node 20"]
        T22["test Node 22"]
    end

    subgraph STAGE3["Stage 3: Build"]
        BUILD["Docker build<br/>+ ECR push"]
    end

    subgraph STAGE4["Stage 4: Staging"]
        STG["deploy-staging<br/>+ health check"]
    end

    subgraph STAGE5["Stage 5: Production"]
        APPROVE{"Approval Wait<br/>(environment)"}
        PROD["deploy-production<br/>+ health check"]
    end

    NOTIFY["Slack Notification"]

    TRIGGER --> STAGE1
    LINT --> STAGE2
    TYPE --> STAGE2
    SEC --> BUILD
    STAGE2 --> BUILD
    BUILD --> STG
    STG --> APPROVE
    APPROVE --> PROD
    PROD --> NOTIFY

    style TRIGGER fill:#3498db,color:#fff
    style LINT fill:#2ecc71,color:#fff
    style TYPE fill:#2ecc71,color:#fff
    style SEC fill:#2ecc71,color:#fff
    style T18 fill:#f39c12,color:#fff
    style T20 fill:#f39c12,color:#fff
    style T22 fill:#f39c12,color:#fff
    style BUILD fill:#9b59b6,color:#fff
    style STG fill:#e67e22,color:#fff
    style APPROVE fill:#e74c3c,color:#fff
    style PROD fill:#e74c3c,color:#fff
    style NOTIFY fill:#1abc9c,color:#fff
```

---

## 🏢 Real-World Practices

### Real-World Pattern 1: Monorepo Path-Based Triggers

```yaml
# Build and deploy only changed services in monorepo
name: Monorepo CI

on:
  push:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.changes.outputs.frontend }}
      backend: ${{ steps.changes.outputs.backend }}
      infra: ${{ steps.changes.outputs.infra }}

    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            frontend:
              - 'apps/frontend/**'
            backend:
              - 'apps/backend/**'
            infra:
              - 'infra/**'

  build-frontend:
    needs: detect-changes
    if: needs.detect-changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Building frontend..."

  build-backend:
    needs: detect-changes
    if: needs.detect-changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Building backend..."

  deploy-infra:
    needs: detect-changes
    if: needs.detect-changes.outputs.infra == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Applying Terraform..."
```

### Real-World Pattern 2: Automatic PR Review Comments

```yaml
name: PR Checks

on:
  pull_request:
    branches: [main]

permissions:
  pull-requests: write
  contents: read

jobs:
  pr-size-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check PR size
        uses: actions/github-script@v7
        with:
          script: |
            const { data: files } = await github.rest.pulls.listFiles({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
            });

            const totalChanges = files.reduce((sum, f) => sum + f.changes, 0);

            let label, comment;
            if (totalChanges > 500) {
              label = 'size/XL';
              comment = 'This PR has 500+ lines changed. Please break it into smaller PRs.';
            } else if (totalChanges > 200) {
              label = 'size/L';
              comment = 'This PR has many changes. Review may take time.';
            } else {
              label = 'size/M';
              comment = 'This is a good-sized PR for review!';
            }

            await github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              labels: [label],
            });

            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `📊 **PR Size Analysis**: ${totalChanges} lines changed (${files.length} files)\n\n${comment}`,
            });
```

### Real-World Pattern 3: Schedule-Based Security/Dependency Check

```yaml
name: Weekly Security Scan

on:
  schedule:
    - cron: '0 0 * * 1'    # Every Monday 00:00 UTC (Korea 09:00)
  workflow_dispatch:

jobs:
  dependency-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: Run audit
        id: audit
        run: |
          npm audit --json > audit-report.json 2>&1 || true
          VULNS=$(cat audit-report.json | jq '.metadata.vulnerabilities.high + .metadata.vulnerabilities.critical')
          echo "high_critical=$VULNS" >> "$GITHUB_OUTPUT"

      - name: Create issue if vulnerabilities found
        if: steps.audit.outputs.high_critical > 0
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Security vulnerability found: ${process.env.VULNS} (high/critical)`,
              body: 'Weekly security scan found high/critical vulnerabilities.\n\nRun `npm audit` to check details.',
              labels: ['security', 'urgent'],
            });
        env:
          VULNS: ${{ steps.audit.outputs.high_critical }}
```

### Real-World Pattern 4: Terraform + GitHub Actions Integration

Integrating [Terraform](../06-iac/02-terraform-basics) with GitHub Actions lets you manage infrastructure changes via PR.

```yaml
name: Terraform

on:
  push:
    branches: [main]
    paths: ['infra/**']
  pull_request:
    branches: [main]
    paths: ['infra/**']

permissions:
  id-token: write
  contents: read
  pull-requests: write

env:
  TF_WORKING_DIR: infra

jobs:
  plan:
    name: Terraform Plan
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ap-northeast-2

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.7.0

      - name: Terraform Init
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform init

      - name: Terraform Plan
        id: plan
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform plan -no-color -out=tfplan
        continue-on-error: true

      # Comment Plan result on PR
      - name: Comment Plan on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const output = `#### Terraform Plan 📝
            \`\`\`
            ${{ steps.plan.outputs.stdout }}
            \`\`\`
            *Run ID: ${{ github.run_id }}*`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            });

  apply:
    name: Terraform Apply
    runs-on: ubuntu-latest
    needs: plan
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: infrastructure

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ap-northeast-2

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.7.0

      - name: Terraform Init
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform init

      - name: Terraform Apply
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform apply -auto-approve
```

### Real-World Cost/Time Optimization Tips

| Optimization Technique | Effect | Method |
|-------------|------|--------|
| Caching | 50-80% build time reduction | `actions/cache`, setup-* built-in cache |
| Path filtering | Prevent unnecessary runs | `paths`, `paths-ignore` |
| Concurrency | Prevent duplicate runs | `cancel-in-progress: true` |
| Matrix optimization | Test only essential combinations | `include`/`exclude` |
| Self-hosted Runner | Cost reduction, performance boost | Own EC2/on-premise |
| Docker layer cache | Docker build time reduction | `cache-from: type=gha` |
| Artifact retention | Storage cost reduction | `retention-days: 1~7` |

---

## ⚠️ Common Mistakes

### Mistake 1: Exposing Secrets in Logs

```yaml
# Never do this
- run: echo "Token is ${{ secrets.API_KEY }}"
  # GitHub masks it, but indirect exposure is possible

# Even more dangerous: curl response may contain Secrets
- run: curl -v "${{ secrets.API_URL }}"
  # -v flag outputs headers, exposing token!
```

**Correct approach:**

```yaml
# Pass as environment variables, minimize log output
- name: Call API
  run: |
    curl -s -o /dev/null -w "%{http_code}" "$API_URL" \
      -H "Authorization: Bearer $API_KEY"
  env:
    API_URL: ${{ secrets.API_URL }}
    API_KEY: ${{ secrets.API_KEY }}
```

### Mistake 2: Missing OIDC Permissions

```yaml
# This will fail! OIDC auth requires id-token write
jobs:
  deploy:
    runs-on: ubuntu-latest
    # permissions missing - id-token: write is off by default!
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/my-role
          aws-region: ap-northeast-2
        # Error: Could not get ID token
```

**Correct approach:**

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write      # ← Must explicitly set!
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/my-role
          aws-region: ap-northeast-2
```

### Mistake 3: Missing Job Dependencies with 'needs'

```yaml
# Wrong: build and deploy run in parallel!
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build

  deploy:
    runs-on: ubuntu-latest
    # needs missing - deploy runs simultaneously with build!
    steps:
      - run: echo "Build may not be finished yet..."
```

**Correct approach:**

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build

  deploy:
    runs-on: ubuntu-latest
    needs: build                # ← build must finish first!
    steps:
      - run: echo "Build finished, now deploying"
```

### Mistake 4: Misuse of pull_request_target

```yaml
# Very dangerous! Runs fork's code with high privileges
on:
  pull_request_target:          # Checks out base branch code
    types: [opened]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          # ← Fork's malicious code can access Secrets!
```

> `pull_request_target` runs the base branch's workflow with Secret access. If you checkout the fork's code, malicious code can steal Secrets. Never use `ref: head.sha` with it.

### Mistake 5: Wrong Cache Key

```yaml
# Wrong: cache never hits
- uses: actions/cache@v4
  with:
    path: node_modules
    key: ${{ runner.os }}-${{ github.sha }}    # Different per commit!

# Another mistake: hash package.json, not lock file
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package.json') }}
    # Cache invalidates even for script-only changes
```

**Correct approach:**

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

### Mistake 6: Deployment Without Concurrency

```yaml
# Dangerous: 2 deployments can run simultaneously
jobs:
  deploy:
    runs-on: ubuntu-latest
    # No concurrency - multiple fast pushes cause parallel deploys!
```

**Correct approach:**

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    concurrency:
      group: deploy-${{ github.ref }}
      cancel-in-progress: false      # Don't cancel deployment
```

### Common Mistakes Checklist

```
Pre-deployment checklist:
❌ Echoing Secrets or using curl -v with Secrets?
❌ Missing permissions.id-token: write for OIDC?
❌ Missing Job dependencies (needs)?
❌ Checking out fork's code with pull_request_target?
❌ Using hashFiles('package.json') instead of lock file?
❌ Missing concurrency on deployment Job?
❌ Not pinning Action version to tag/SHA?
❌ Forgetting schedule times are UTC?
❌ Not filtering paths to avoid unnecessary runs?
❌ Not protecting production with environment protection rules?
```

---

## 📝 Summary

### Core Concepts Summary Table

| Concept | Description | Analogy |
|--------|------|---------|
| **Workflow** | YAML-defined automation pipeline | Factory production line blueprint |
| **Event/Trigger** | Workflow execution condition | Production start signal |
| **Job** | Group of Steps on same Runner | Process stage (assembly, inspection, painting) |
| **Step** | Individual unit of work in Job | Detailed work unit (tightening bolts) |
| **Runner** | Machine running the workflow | Robotic arm performing work |
| **Action** | Reusable unit of work | Generic component from market |
| **Secret** | Encrypted confidential value | Vault-stored access card |
| **Environment** | Deployment target + protection rules | Shipping inspection gate |
| **Matrix** | Test multiple combinations simultaneously | Parallel production on multiple lines |
| **Reusable Workflow** | Callable from other workflows | Standardized process manual |
| **OIDC** | Cloud auth without long-lived keys | Single-use access pass |

### GitHub Actions Core Keywords Summary

| Keyword | Location | Role |
|--------|------|------|
| `name` | Workflow / Job / Step | Assign name (displayed in UI) |
| `on` | Workflow | Trigger event |
| `jobs` | Workflow | Job list |
| `runs-on` | Job | Runner selection |
| `needs` | Job | Job dependency |
| `if` | Job / Step | Conditional execution |
| `strategy.matrix` | Job | Combination testing |
| `environment` | Job | Deployment environment + protection |
| `steps` | Job | Step list |
| `uses` | Step | Use Action |
| `run` | Step | Execute shell command |
| `with` | Step | Action input values |
| `env` | Workflow / Job / Step | Environment variable |
| `secrets` | Step | Reference Secret |
| `permissions` | Workflow / Job | GITHUB_TOKEN permission |
| `concurrency` | Workflow / Job | Concurrency control |
| `outputs` | Job / Step | Define output value |

### Checklist

After this lecture, verify the following:

```
✅ Understand Workflow YAML basic structure (name, on, jobs, steps)?
✅ Can configure push, pull_request, schedule, workflow_dispatch triggers?
✅ Understand Job dependencies (needs) and data passing (outputs)?
✅ Explain difference between GitHub-hosted and Self-hosted Runners?
✅ Can find and use Actions from Actions Marketplace?
✅ Know difference between Secrets and Variables, can set GITHUB_TOKEN permissions?
✅ Protect deployment with Environment and Protection Rules?
✅ Test multiple environment combinations with Matrix Strategy?
✅ Explain difference between Reusable Workflow and Composite Action?
✅ Understand OIDC-based safe AWS authentication?
✅ Optimize build speed with actions/cache?
✅ Share data between Jobs with Artifacts?
✅ Control concurrent deployment with concurrency?
✅ Build complete Build → Test → Deploy pipeline?
```

---

## 🔗 Next Steps

You've learned practical GitHub Actions in this lecture. The next lecture covers another popular CI/CD platform.

| Next Lecture | Content |
|-----------|------|
| [GitLab CI in Practice](./06-gitlab-ci) | `.gitlab-ci.yml` structure, Pipeline/Stage/Job, GitLab Runner, Auto DevOps, GitLab Container Registry |

### Related Lectures

| Lecture | Relevance |
|------|--------|
| [CI Pipeline](./03-ci-pipeline) | CI concepts and build/cache/parallelization principles |
| [CD Pipeline](./04-cd-pipeline) | CD concepts and rollback/Preview environment strategies |
| [Terraform Basics](../06-iac/02-terraform-basics) | How to create OIDC IAM Role with Terraform |
| [Deployment Strategy](./10-deployment-strategy) | Rolling, Blue-Green, Canary deployment strategies |
| [Pipeline Security](./12-pipeline-security) | Secrets management, SAST, SBOM advanced topics |
