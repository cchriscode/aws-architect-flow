# CI/CD Learning Environment Setup

> This document is a guide for installing the necessary tools and setting up the environment **before** starting the CI/CD course. Follow along step by step, from installing Git to setting up a GitHub account, SSH keys, and a Jenkins lab environment. Once you complete all the steps, you can jump right into [Git Basics](./01-git-basics).

---

## Required Tools

```
Tool              Purpose                              Required
─────────────────────────────────────────────────────────────
Git               Version control, foundation of CI/CD  Required
GitHub Account    Remote repository, Actions labs        Required
SSH Key           GitHub authentication (instead of pw)  Required
GitHub CLI (gh)   Manage PRs/issues from the terminal    Optional
Docker            Jenkins lab environment                Required
Jenkins           CI pipeline labs                       Required
VS Code           Code editor + Git extensions           Recommended
GitLab Runner     GitLab CI labs                         Optional
```

---

## 1. Install Git

Git is the **starting point** of CI/CD. You need to commit and push code before a pipeline can run, so install it first.

### Windows

Download and install from [https://git-scm.com](https://git-scm.com).

```bash
# Verify after installation
git --version
```

### Expected Output

```text
git version 2.43.0.windows.1
```

The installer asks about various options during setup. You can proceed with the defaults (Next) for most of them. However, it is recommended to change the **default editor** to VS Code.

### Mac

```bash
# Method 1: Xcode Command Line Tools (simplest)
xcode-select --install

# Method 2: Homebrew (easier to keep up to date)
brew install git
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install git -y
```

### Linux (CentOS/RHEL)

```bash
sudo yum install git -y
```

### Verify

```bash
git --version
```

### Expected Output

```text
git version 2.43.0
```

### Note

If the version shows `1.x`, it is too outdated. Git `2.30` or higher is recommended. Some features (`git switch`, `git restore`, etc.) do not work on older versions.

---

## 2. Git Initial Configuration

After installing Git, you need to **register your user information**. This information is recorded in commit history.

```bash
# Set your name
git config --global user.name "Hong Gildong"

# Set your email (use the same email as your GitHub account)
git config --global user.email "gildong@example.com"
```

### Verify Configuration

```bash
git config --global --list
```

### Expected Output

```text
user.name=Hong Gildong
user.email=gildong@example.com
```

### Additional Recommended Settings

```bash
# Set the default branch name to main
git config --global init.defaultBranch main

# Auto-convert line endings (required for Windows users)
git config --global core.autocrlf true

# For Mac/Linux users, use this instead
git config --global core.autocrlf input

# Change the default editor to VS Code
git config --global core.editor "code --wait"
```

### Note

The `user.email` must be set to the **same email** registered with your GitHub account. If they differ, your commits will not be linked to your account on GitHub, and your contribution graph will not be updated.

---

## 3. Create a GitHub Account

### Why It Is Needed

GitHub is the core platform for CI/CD labs. You will build pipelines with **GitHub Actions**, conduct code reviews with **Pull Requests**, and collaborate using **remote repositories**.

### Sign-Up Process

1. Go to [https://github.com](https://github.com)
2. Click "Sign up"
3. Enter your email, password, and username
4. Complete email verification

### Practical Tips

- Your username is difficult to change once set. Use a clean combination of **lowercase letters and hyphens**.
- Adding a name and photo to your profile makes it easier for team members to identify each other.
- If you register both your personal and work email addresses, commits from either email will be linked to your profile.

---

## 4. Generate an SSH Key and Register It on GitHub

Connecting to GitHub via SSH instead of HTTPS means you **do not need to enter your password every time**. SSH authentication is also commonly used in CI/CD pipelines.

### 4.1 Generate an SSH Key

```bash
ssh-keygen -t ed25519 -C "gildong@example.com"
```

When you run this, you will be prompted as follows:

```text
Generating public/private ed25519 key pair.
Enter file in which to save the key (/home/user/.ssh/id_ed25519):
```

Press **Enter** to save to the default location.

```text
Enter passphrase (empty for no passphrase):
```

You can set a passphrase (password). Setting one is recommended for security, but for a lab environment you can leave it empty and press **Enter**.

### Expected Output

```text
Your identification has been saved in /home/user/.ssh/id_ed25519
Your public key has been saved in /home/user/.ssh/id_ed25519.pub
The key fingerprint is:
SHA256:AbCdEfGhIjKlMnOpQrStUvWxYz1234567890 gildong@example.com
The key's randomart image is:
+--[ED25519 256]--+
|        .o+..    |
|       . o.=     |
|      . + B .    |
|     . = X +     |
|    . S B = .    |
|     o + = .     |
|    . o + o      |
|     . + +.o     |
|      ..o.=o.    |
+----[SHA256]-----+
```

### 4.2 View the Public Key

```bash
cat ~/.ssh/id_ed25519.pub
```

### Expected Output

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx gildong@example.com
```

**Copy the entire output.**

### 4.3 Register the SSH Key on GitHub

1. Log in to GitHub and click the profile icon in the top right
2. Click **Settings**
3. Click **SSH and GPG keys** in the left menu
4. Click the **New SSH key** button
5. Enter a recognizable name in the Title field (e.g., "My Laptop")
6. Paste the copied public key into the Key field
7. Click **Add SSH key**

### 4.4 Test the Connection

```bash
ssh -T git@github.com
```

On the first connection, you will see the following message. Type `yes`.

```text
The authenticity of host 'github.com (20.200.245.247)' can't be established.
ED25519 key fingerprint is SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
```

### Expected Output (Success)

```text
Hi gildong! You've successfully authenticated, but GitHub does not provide shell access.
```

### Note

- If you get a `Permission denied (publickey)` error, the SSH key was not registered correctly. Make sure you did not paste the private key instead of the public key (`.pub`).
- On Windows, you should run this in **Git Bash**. SSH may behave differently in PowerShell or CMD.

---

## 5. Install GitHub CLI (Optional)

Installing GitHub CLI (`gh`) lets you create Pull Requests, manage issues, and check Actions results directly from the terminal. It is not required, but it significantly improves CI/CD workflow efficiency.

### Installation

```bash
# Mac
brew install gh

# Windows (Chocolatey)
choco install gh

# Windows (winget)
winget install --id GitHub.cli

# Linux (Ubuntu/Debian)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli-stable.list > /dev/null
sudo apt update
sudo apt install gh -y
```

### Authentication

```bash
gh auth login
```

This proceeds interactively. Select GitHub.com, choose SSH, then follow the browser authentication flow.

### Verify

```bash
gh auth status
```

### Expected Output

```text
github.com
  ✓ Logged in to github.com account gildong (keyring)
  - Active account: true
  - Git operations protocol: ssh
  - Token: gho_************************************
  - Token scopes: 'gist', 'read:org', 'repo', 'workflow'
```

---

## 6. Jenkins Lab Setup (Running with Docker)

Jenkins is one of the most widely used CI/CD pipeline tools. Running it with Docker makes the setup process very straightforward.

### Prerequisites

Docker must be installed. Refer to the [03-containers](../03-containers/02-docker-basics) section.

```bash
docker --version
```

### Expected Output

```text
Docker version 24.0.7, build afdd53b
```

### Run the Jenkins Container

```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:lts
```

Option descriptions:

| Option | Description |
|--------|-------------|
| `-d` | Run in the background |
| `--name jenkins` | Assign a container name |
| `-p 8080:8080` | Web UI port |
| `-p 50000:50000` | Agent connection port |
| `-v jenkins_home:/var/jenkins_home` | Persist data (settings are preserved even if the container is deleted) |

### Check the Initial Password

```bash
docker logs jenkins 2>&1 | grep -A 2 "initialAdminPassword"
```

### Expected Output

```text
Jenkins initial setup is required. An admin user has been created and a password generated.
Please use the following password to proceed to installation:

a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

This may also be found at: /var/jenkins_home/secrets/initialAdminPassword
```

You can also check it directly from the file:

```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### Verify Access

Open [http://localhost:8080](http://localhost:8080) in your browser and enter the password you obtained above.

### Practical Tips

- Managing Jenkins data with a volume (`-v`) means that even if you delete the container with `docker rm jenkins`, your pipeline settings will be preserved.
- When you finish a lab session, stop Jenkins with `docker stop jenkins`, and restart it later with `docker start jenkins`.
- On first access, select "Install suggested plugins". The default plugins will be installed automatically.

---

## 7. GitLab Runner Lab (Optional)

If you want to practice GitLab CI, you need a GitLab Runner. It can be easily run with Docker.

### Run the GitLab Runner Container

```bash
docker run -d \
  --name gitlab-runner \
  --restart always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v gitlab-runner-config:/etc/gitlab-runner \
  gitlab/gitlab-runner:latest
```

### Verify

```bash
docker ps --filter name=gitlab-runner
```

### Expected Output

```text
CONTAINER ID   IMAGE                         COMMAND                  STATUS         PORTS   NAMES
a1b2c3d4e5f6   gitlab/gitlab-runner:latest   "/usr/bin/dumb-init …"   Up 3 seconds           gitlab-runner
```

### Practical Tips

- The GitLab Runner must be **registered with a GitLab server** before it can be used. The detailed registration process is covered in the [GitLab CI](./06-gitlab-ci) lesson.
- You can run CI/CD pipelines with a free GitLab.com account (400 free minutes per month).

---

## 8. VS Code + Git Extensions

### Install VS Code

Download and install from [https://code.visualstudio.com](https://code.visualstudio.com).

### Recommended Extensions

| Extension | Purpose |
|-----------|---------|
| **GitLens** | Commit history visualization, line-by-line blame, branch comparison |
| **Git Graph** | Visual branch graph |
| **YAML** | Editing GitHub Actions and GitLab CI configuration files |
| **Docker** | Dockerfile and docker-compose editing support |
| **Jenkinsfile Support** | Jenkins pipeline syntax highlighting |

### Installation Method

Open VS Code, click the Extensions icon (four squares) in the left sidebar, type the extension name in the search bar, and click Install.

You can also install them from the terminal:

```bash
code --install-extension eamodio.gitlens
code --install-extension mhutchie.git-graph
code --install-extension redhat.vscode-yaml
```

---

## 9. Full Environment Verification

Once everything is installed, verify all at once with the following commands:

```bash
echo "=== Git ===" && git --version
echo "=== SSH ===" && ssh -T git@github.com 2>&1
echo "=== GitHub CLI ===" && gh auth status 2>&1
echo "=== Docker ===" && docker --version
echo "=== Jenkins ===" && docker ps --filter name=jenkins --format "{{.Names}}: {{.Status}}"
```

### Expected Output (When All Tools Are Installed)

```text
=== Git ===
git version 2.43.0
=== SSH ===
Hi gildong! You've successfully authenticated, but GitHub does not provide shell access.
=== GitHub CLI ===
github.com
  ✓ Logged in to github.com account gildong (keyring)
=== Docker ===
Docker version 24.0.7, build afdd53b
=== Jenkins ===
jenkins: Up 5 minutes
```

### Minimum Required Checklist

```
[  ] git --version                    → 2.30 or higher
[  ] ssh -T git@github.com            → "successfully authenticated" message
[  ] docker --version                 → Docker installation confirmed
[  ] Access localhost:8080             → Jenkins screen displayed
```

### Note

- GitHub CLI and GitLab Runner are **optional**. You can follow the course without them.
- Jenkins runs on Docker, so Docker **must** be installed first.
- Windows users are recommended to use Git Bash or WSL2 for the labs. Some Linux commands do not work in PowerShell.

---

## Next Steps

Once the environment is ready, start with [Git Basics through Advanced](./01-git-basics). Once you understand how Git works, you will naturally understand why CI/CD pipelines behave the way they do.
