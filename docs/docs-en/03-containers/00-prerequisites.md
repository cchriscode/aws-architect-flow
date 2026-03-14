# Preparing the Container Learning Environment

This document explains how to **install the necessary tools and prepare your environment before starting the container course**.
It covers Docker installation, Docker Compose verification, account creation, and editor setup.

Complete all steps in this document before starting the course, and make sure the final verification commands produce the expected output.

---

# 1. System Requirements

Docker requires the following minimum specifications to run.

| Item | Minimum | Recommended |
|------|------|------|
| RAM | 4GB | 8GB or more |
| Free disk space | 10GB | 20GB or more |
| CPU | 2 cores | 4 cores or more |
| Virtualization | VT-x/AMD-V enabled in BIOS | - |

### Verification (Linux environment)

```bash
free -h
```

### Expected Output

```text
               total        used        free      shared  buff/cache   available
Mem:           7.8Gi       2.1Gi       3.2Gi       120Mi       2.5Gi       5.3Gi
```

If `total` is 4Gi or more, the minimum requirement is met.

```bash
df -h /
```

### Expected Output

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1       50G   15G   33G  32% /
```

If `Avail` is 10G or more, you are good to go.

### Warning

If RAM is less than 4GB, the system may slow down when running multiple Docker containers.
During learning, it is recommended to close unused programs to free up memory.

---

# 2. Installing Docker

The installation method varies by operating system. Follow the section that matches your environment.

---

## 2.1 Windows: Installing Docker Desktop

### Prerequisites

* WSL2 must be installed (refer to 01-linux/00-prerequisites.md).
* The WSL2 backend must be enabled. Docker Desktop runs on top of WSL2.

### Installation Steps

**Step 1: Download Docker Desktop.**

Go to https://www.docker.com/products/docker-desktop/ and click "Download for Windows".

**Step 2: Run the installer.**

When the installation wizard appears, verify the following options:

* "Use WSL 2 instead of Hyper-V" checked (required)
* "Add shortcut to desktop" checked (optional)

**Step 3: Reboot your computer after installation is complete.**

**Step 4: Launch Docker Desktop.**

Search for "Docker Desktop" in the Start menu and launch it.
On the first launch, a terms of service agreement screen will appear. Agree and proceed.

**Step 5: Verify WSL2 integration.**

Click the gear icon (Settings) at the top of Docker Desktop and:

1. **General** tab: Verify that "Use the WSL 2 based engine" is checked.
2. **Resources > WSL Integration** tab: Verify that your Ubuntu distribution is enabled.

**Step 6: Verify that Docker works from the WSL2 terminal.**

Open the WSL2 Ubuntu terminal and run:

```bash
docker --version
```

### Expected Output

```text
Docker version 27.5.1, build 9f9e405
```

### Warning

* Docker Desktop must be running for the docker command to work in WSL2. Check that Docker is running in the system tray icon.
* If you see "Docker Desktop - WSL2 backend requires WSL update", run `wsl --update` in PowerShell (as administrator).

---

## 2.2 Mac: Installing Docker Desktop

### Apple Silicon vs Intel Check

First, check which chip your Mac has.

Click the Apple menu in the top left > "About This Mac".

* **Chip**: Apple M1, M2, M3, etc. -- Apple Silicon
* **Processor**: Intel Core -- Intel

### Installation Steps

**Step 1: Download Docker Desktop.**

Go to https://www.docker.com/products/docker-desktop/ and:

* Apple Silicon Mac: Click "Download for Mac - Apple Silicon"
* Intel Mac: Click "Download for Mac - Intel Chip"

### Warning

Installing the wrong version for your chip type may cause it to not work properly. Make sure to select the version that matches your chip.

**Step 2: Open the downloaded `.dmg` file and drag the Docker icon to the Applications folder.**

**Step 3: Launch Docker from Applications.**

On the first launch, it may request system access permissions. Allow them.

**Step 4: When the Docker icon (whale) appears in the menu bar, installation is complete.**

**Step 5: Verify in the terminal.**

```bash
docker --version
```

### Expected Output

```text
Docker version 27.5.1, build 9f9e405
```

---

## 2.3 Linux: Direct Docker Engine Installation

On Linux, install Docker Engine directly instead of Docker Desktop.

### Installation Steps

**Step 1: Remove any previous versions if present.**

```bash
sudo apt remove docker docker-engine docker.io containerd runc 2>/dev/null
```

### Expected Output

```text
Reading package lists... Done
Building dependency tree... Done
```

This will proceed without errors even if the packages are not already present.

**Step 2: Install required packages.**

```bash
sudo apt update && sudo apt install -y ca-certificates curl gnupg
```

**Step 3: Add the official Docker GPG key.**

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

**Step 4: Add the Docker repository.**

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

**Step 5: Install Docker Engine.**

```bash
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Expected Output (final portion)

```text
Setting up docker-ce (5:27.5.1-1~ubuntu.22.04~jammy) ...
Processing triggers for man-db (2.10.2-1) ...
```

**Step 6: Add the current user to the docker group.**

```bash
sudo usermod -aG docker $USER
```

### Warning

You must log out and log back in or reboot after the group change. Until you log back in, you need to use `sudo docker` to run commands.

After logging back in, verify without sudo:

```bash
docker --version
```

### Expected Output

```text
Docker version 27.5.1, build 9f9e405
```

---

# 3. Verifying Docker Installation: hello-world

The most reliable way to verify that Docker is installed correctly is to run the hello-world container.

```bash
docker run hello-world
```

### Expected Output

```text
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
c1ec31eb5944: Pull complete
Digest: sha256:d211f485f2dd1dee407a80973c8f129f00d54604d2c90732e8e320e5038a0348
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.
...
```

### Explanation

* `Unable to find image ... locally`: The image is not available locally, so it is being downloaded from Docker Hub.
* `Hello from Docker!`: If this message appears, Docker is fully operational.

### Warning

If you get a `Cannot connect to the Docker daemon` error:

* Windows/Mac: Verify that Docker Desktop is running.
* Linux: Verify that the Docker service is running.

```bash
sudo systemctl status docker
```

### Expected Output

```text
● docker.service - Docker Application Container Engine
     Loaded: loaded (/lib/systemd/system/docker.service; enabled; vendor preset: enabled)
     Active: active (running) since ...
```

If it shows `active (running)`, it is working correctly. If it is not running:

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

---

# 4. Verifying Docker Compose

Docker Compose is a tool for defining and running multiple containers at once.
It is included by default with Docker Desktop, and if you installed Docker Engine on Linux, it was installed as a plugin.

```bash
docker compose version
```

### Expected Output

```text
Docker Compose version v2.32.4
```

### Warning

Older versions used `docker-compose` (with a hyphen), but the current version uses `docker compose` (with a space).

If the `docker compose` command does not work:

```bash
docker-compose --version
```

If that does not work either, a separate installation is needed:

```bash
sudo apt install docker-compose-plugin -y
```

---

# 5. Creating a Docker Hub Account

Docker Hub is a public registry for storing and sharing Docker images.
Downloading (pulling) images is possible without an account, but uploading (pushing) images requires one.

### Creating an Account

1. Go to https://hub.docker.com.
2. Click "Sign Up".
3. Enter a username, email, and password to create your account.

### Logging in from the Terminal

```bash
docker login
```

### Expected Output

```text
Log in with your Docker ID or email address to push and pull images from Docker Hub.
Username: myuser
Password:
Login Succeeded
```

### Explanation

* Nothing will appear on screen while typing the password. This is normal.
* If `Login Succeeded` appears, the login is complete.

### Practical Tip

Login credentials are stored in `~/.docker/config.json`. On shared servers, make it a habit to run `docker logout` after completing your work.

---

# 6. Installing VS Code + Docker Extension

Installing the Docker extension in VS Code allows you to visually manage containers, images, volumes, and more.
It also provides syntax highlighting and auto-completion when writing Dockerfiles.

### Installing VS Code

If you do not have VS Code yet:

1. Download it from https://code.visualstudio.com.
2. Install the version for your operating system.

### Installing the Docker Extension

**Method 1: Install from within VS Code**

1. Open VS Code.
2. Click the Extensions icon in the left sidebar (four squares icon).
3. Type `Docker` in the search bar.
4. Find "Docker" (by Microsoft) and click **Install**.

**Method 2: Install from the terminal**

```bash
code --install-extension ms-azuretools.vscode-docker
```

### Expected Output

```text
Installing extension 'ms-azuretools.vscode-docker'...
Extension 'ms-azuretools.vscode-docker' v1.x.x was successfully installed.
```

### Verifying Installation

If a whale (Docker) icon appears in the VS Code left sidebar, the installation is complete.
Clicking this icon lets you view currently running containers, image lists, and more.

### Practical Tip

If you are using VS Code with WSL2, it is also helpful to install the "Remote - WSL" extension.
It allows you to edit files inside WSL2 directly from VS Code.

---

# 7. Resource Allocation Settings (Docker Desktop)

If you are using Docker Desktop, you can configure the CPU and memory available to Docker.

### How to Configure

1. Open Docker Desktop.
2. Click the gear icon (Settings).
3. Select the **Resources** tab.

### Recommended Settings

| Item | Recommended for Learning |
|------|---------------|
| CPUs | 2 or more |
| Memory | 4GB or more (6-8GB if possible) |
| Swap | 1GB |
| Disk image size | 20GB or more |

### After Changing Settings

Click "Apply & Restart" to restart Docker with the new settings applied.

### Warning

* Allocating too much memory may slow down the host (Windows/Mac) system. It is best not to exceed half of your total RAM.
* On Windows with the WSL2 backend, the settings may not appear in the Resources tab. In this case, configure them using the WSL2 `.wslconfig` file.

### WSL2 Memory Limit (.wslconfig)

To limit WSL2 memory on Windows, create a file at `C:\Users\YourUsername\.wslconfig`:

```text
[wsl2]
memory=6GB
processors=2
swap=2GB
```

After saving, run in PowerShell:

```powershell
wsl --shutdown
```

The settings will take effect when you reopen WSL2.

---

# 8. Final Environment Verification

Once all installations are complete, run the following commands to verify.

## 8.1 Docker Version Check

```bash
docker --version
```

### Expected Output

```text
Docker version 27.5.1, build 9f9e405
```

---

## 8.2 Docker Compose Version Check

```bash
docker compose version
```

### Expected Output

```text
Docker Compose version v2.32.4
```

---

## 8.3 Docker System Information Check

```bash
docker info
```

### Expected Output (key portions)

```text
Client:
 Version:    27.5.1
 Context:    default

Server:
 Containers: 1
  Running: 0
  Paused: 0
  Stopped: 1
 Images: 1
 Server Version: 27.5.1
 Storage Driver: overlay2
 Operating System: Ubuntu 22.04.3 LTS
 OSType: linux
 Architecture: x86_64
 CPUs: 4
 Total Memory: 7.764GiB
```

### Explanation

* `Server Version`: The Docker server version.
* `CPUs`, `Total Memory`: Resources available to Docker.
* `Containers`, `Images`: The number of containers and images currently on the system.

---

## 8.4 hello-world Re-verification

```bash
docker run hello-world
```

### Expected Output (key portion)

```text
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

---

# 9. All-in-One Verification

Run the following command to check the installation status of all key tools at once.

```bash
echo "=== Docker ===" && docker --version && echo "" && \
echo "=== Docker Compose ===" && docker compose version && echo "" && \
echo "=== Docker Info (요약) ===" && docker info 2>/dev/null | grep -E "Server Version|CPUs|Total Memory|Operating System" && echo "" && \
echo "=== Docker Hub 로그인 상태 ===" && docker info 2>/dev/null | grep "Username" && echo "" && \
echo "=== hello-world 테스트 ===" && docker run --rm hello-world 2>&1 | head -n 5
```

### Expected Output

```text
=== Docker ===
Docker version 27.5.1, build 9f9e405

=== Docker Compose ===
Docker Compose version v2.32.4

=== Docker Info (요약) ===
 Server Version: 27.5.1
 Operating System: Ubuntu 22.04.3 LTS
 CPUs: 4
 Total Memory: 7.764GiB

=== Docker Hub 로그인 상태 ===
 Username: myuser

=== hello-world 테스트 ===

Hello from Docker!
This message shows that your installation appears to be working correctly.
```

If all items produce normal output, the container learning environment setup is complete.

---

# 10. Common Issues and Solutions

## 10.1 `Cannot connect to the Docker daemon`

The Docker daemon is not running.

**Windows/Mac**: Verify that Docker Desktop is running. Check for the Docker icon in the system tray (taskbar).

**Linux**: Start the Docker service.

```bash
sudo systemctl start docker
```

Verification:

```bash
sudo systemctl status docker
```

### Expected Output

```text
● docker.service - Docker Application Container Engine
     Active: active (running) since ...
```

---

## 10.2 `permission denied while trying to connect to the Docker daemon socket`

The current user is not a member of the docker group.

```bash
sudo usermod -aG docker $USER
```

You must log out and log back in or reboot after running this command.

After logging back in, verify:

```bash
groups
```

### Expected Output

```text
myuser adm sudo docker
```

If `docker` appears in the list, everything is correct.

---

## 10.3 "WSL 2 installation is incomplete" When Launching Docker Desktop

A WSL2 kernel update is needed. In PowerShell (as administrator):

```powershell
wsl --update
```

### Expected Output

```text
Checking for updates.
Updating Windows Subsystem for Linux...
```

After the update, launch Docker Desktop again.

---

## 10.4 `docker compose` Command Not Found

The Docker Compose plugin is not installed.

```bash
sudo apt install docker-compose-plugin -y
```

After installation, verify:

```bash
docker compose version
```

---

## 10.5 Docker Image Pull Is Very Slow

Docker Hub access may be slow depending on your network environment.
You can configure a mirror registry in Docker Desktop.

In Settings > Docker Engine, add the following:

```json
{
  "registry-mirrors": ["https://mirror.gcr.io"]
}
```

Click "Apply & Restart".

---

## 10.6 Insufficient Disk Space

Docker images and containers can consume a lot of disk space. Clean up unused resources:

```bash
docker system df
```

### Expected Output

```text
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          5         1         2.3GB     1.8GB (78%)
Containers      3         0         15MB      15MB (100%)
Local Volumes   2         1         500MB     200MB (40%)
Build Cache     10        0         300MB     300MB
```

Cleanup command:

```bash
docker system prune
```

### Expected Output

```text
WARNING! This will remove:
  - all stopped containers
  - all networks not used by at least one container
  - all dangling images
  - unused build cache

Are you sure you want to continue? [y/N] y
Total reclaimed space: 2.1GB
```

### Warning

`docker system prune` only deletes resources that are not in use. It does not affect running containers.

---

# 11. Next Steps

Once the environment setup is complete, proceed to the next document: the Container Concepts Guide.
Now that you have verified Docker is working correctly, you can learn about the basic concepts and operating principles of containers.

---
