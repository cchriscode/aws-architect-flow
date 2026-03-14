# Preparing the Kubernetes Learning Environment

> Before learning Kubernetes, you need to set up your local environment first. Once you install the tools described here, you will be able to **start hands-on practice right away** in the upcoming lessons. It is strongly recommended that you complete [Container Basics](../03-containers/01-concept) before proceeding.

---

## System Requirements

Running a local Kubernetes cluster requires a certain amount of resources.

| Item | Minimum | Recommended |
|------|---------|-------------|
| RAM | 4GB | 8GB or more |
| CPU | 2 cores | 4 cores or more |
| Disk | 20GB free space | 40GB or more |
| OS | Windows 10+, macOS 12+, Ubuntu 20.04+ | Latest version |

### Note

On systems with less than 4GB of RAM, even if the cluster starts, Pods will frequently crash. If you are studying on a laptop, **close unnecessary programs** before proceeding.

---

## Step 1: Install Docker (Required Prerequisite)

Kubernetes is a tool that orchestrates containers, so **Docker must be installed first**.

Docker installation is covered in [03-containers](../03-containers/01-concept). If you have not installed it yet, please do so first.

### Verify Installation

```bash
docker version
```

### Expected Output

```text
Client:
 Version:           24.0.7
 API version:       1.43
 Go version:        go1.21.3
 ...

Server:
 Engine:
  Version:          24.0.7
  API version:      1.43 (minimum version 1.12)
  ...
```

If both `Client` and `Server` information are displayed, everything is working correctly.

### Note

Installing Docker Desktop includes Docker Engine along with basic Kubernetes support, but for learning purposes, it is recommended to **use minikube or kind separately**. The built-in K8s in Docker Desktop has limited configuration flexibility.

---

## Step 2: Install kubectl

`kubectl` is the **CLI tool** for communicating with a Kubernetes cluster. Since it is the command you will type most often while using K8s, it must be installed.

### Windows

**Option 1: Using Chocolatey (Recommended)**

```bash
choco install kubernetes-cli
```

**Option 2: Direct Download**

```bash
curl -LO "https://dl.k8s.io/release/v1.31.0/bin/windows/amd64/kubectl.exe"
```

Place the downloaded `kubectl.exe` in a directory included in your PATH, such as `C:\usr\local\bin\`.

### macOS

```bash
brew install kubectl
```

### Linux (Ubuntu/Debian)

**Option 1: Using apt**

```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg

# Add the official Kubernetes GPG key
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.31/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

# Add the repository
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.31/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt-get update
sudo apt-get install -y kubectl
```

**Option 2: Direct download with curl**

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

### Verify Installation

```bash
kubectl version --client
```

### Expected Output

```text
Client Version: v1.31.0
Kustomize Version: v5.4.2
```

If a version number is displayed, the installation was successful.

### Practical Tip

Typing `kubectl` every time can be tedious. Setting up an alias as shown below makes it much easier.

```bash
# Add to ~/.bashrc or ~/.zshrc
alias k='kubectl'
```

After adding it, apply the changes:

```bash
source ~/.bashrc   # or source ~/.zshrc
```

After this, you can type short commands like `k get pods`.

---

## Step 3: Install a Local Cluster Tool

For hands-on practice, you need to **create a Kubernetes cluster on your own machine**. There are three popular tools for this.

### Tool Comparison

| Item | minikube | kind | k3d |
|------|----------|------|-----|
| Description | Local K8s cluster (VM or Docker-based) | Creates K8s cluster inside Docker containers | Runs K3s (lightweight K8s) in Docker |
| Multi-node | Supported (requires configuration) | Supported by default | Supported by default |
| Resource Usage | Moderate (higher when using VMs) | Low | Lowest |
| Startup Speed | Moderate (1-3 min) | Fast (30 sec - 1 min) | Fastest (20-40 sec) |
| Addon Support | Rich (built-in dashboard, ingress, etc.) | Manual setup | Manual setup |
| Learning Difficulty | Easiest | Moderate | Moderate |
| Recommended For | People learning K8s for the first time | CI/CD, multi-node testing | Lightweight local development |

**For beginners, minikube is recommended.** It has extensive documentation and easy addon installation.

---

### Option A: minikube (Recommended)

#### Installation

**Windows:**

```bash
choco install minikube
```

**macOS:**

```bash
brew install minikube
```

**Linux:**

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
rm minikube-linux-amd64
```

#### Start the Cluster

```bash
minikube start
```

#### Expected Output

```text
😄  minikube v1.33.0 on Darwin 14.3
✨  Automatically selected the docker driver
📌  Using Docker Desktop driver with root privileges
👍  Starting "minikube" primary control-plane node in "minikube" cluster
🚜  Pulling base image v0.0.43 ...
🔥  Creating docker container (CPUs=2, Memory=4096MB) ...
🐳  Preparing Kubernetes v1.30.0 on Docker 26.0.1 ...
    ▪ Generating certificates and keys ...
    ▪ Booting up control plane ...
    ▪ Configuring RBAC rules ...
🔗  Configuring bridge CNI (Container Networking Interface) ...
🔎  Verifying Kubernetes components...
    ▪ Using image gcr.io/k8s-minikube/storage-provisioner:v5
🌟  Enabled addons: storage-provisioner, default-storageclass
🏄  Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
```

If you see `Done!`, the cluster has started successfully.

#### Check Status

```bash
minikube status
```

#### Expected Output

```text
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured
```

If all items show `Running`, everything is working correctly.

#### Useful minikube Commands

```bash
minikube stop          # Stop the cluster (save resources)
minikube start         # Restart a stopped cluster
minikube delete        # Completely delete the cluster
minikube dashboard     # Open the web dashboard
minikube addons list   # Check available addons
```

### Practical Tip

When you finish practicing, stop the cluster with `minikube stop`. If you leave it running, it will continue consuming CPU and memory.

---

### Option B: kind (Kubernetes IN Docker)

#### Installation

**Windows:**

```bash
choco install kind
```

**macOS:**

```bash
brew install kind
```

**Linux:**

```bash
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.23.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

#### Create a Cluster

```bash
kind create cluster
```

#### Expected Output

```text
Creating cluster "kind" ...
 ✓ Ensuring node image (kindest/node:v1.30.0) 🖼
 ✓ Preparing nodes 📦
 ✓ Writing configuration 📜
 ✓ Starting control-plane 🕹️
 ✓ Installing CNI 🔌
 ✓ Installing StorageClass 💾
Set kubectl context to "kind-kind"
You can now use your cluster with:

kubectl cluster-info --context kind-kind

Have a nice day! 👋
```

#### Multi-node Cluster (Optional)

You can add worker nodes by creating a `kind-config.yaml` file.

```yaml
# kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
  - role: worker
  - role: worker
```

```bash
kind create cluster --config kind-config.yaml
```

#### Delete the Cluster

```bash
kind delete cluster
```

---

### Option C: k3d (K3s in Docker)

#### Installation

**Windows:**

```bash
choco install k3d
```

**macOS:**

```bash
brew install k3d
```

**Linux:**

```bash
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash
```

#### Create a Cluster

```bash
k3d cluster create mycluster
```

#### Expected Output

```text
INFO[0000] Prep: Network
INFO[0000] Created network 'k3d-mycluster'
INFO[0000] Created image volume k3d-mycluster-images
INFO[0000] Starting new tools node...
INFO[0001] Creating node 'k3d-mycluster-server-0'
INFO[0001] Pulling image 'ghcr.io/k3d-io/k3d-tools:5.7.1'
INFO[0004] Pulling image 'docker.io/rancher/k3s:v1.30.1-k3s1'
INFO[0010] Starting node 'k3d-mycluster-server-0'
INFO[0014] Cluster 'mycluster' created successfully!
INFO[0014] You can now use it with: kubectl cluster-info
```

#### Delete the Cluster

```bash
k3d cluster delete mycluster
```

---

## Step 4: Install Helm

Helm is the **package manager** for Kubernetes. Just as you install programs with apt or yum on Linux, you use Helm to install K8s applications.

### Windows

```bash
choco install kubernetes-helm
```

### macOS

```bash
brew install helm
```

### Linux

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Verify Installation

```bash
helm version
```

### Expected Output

```text
version.BuildInfo{Version:"v3.15.2", GitCommit:"1a500d5...", GitTreeState:"clean", GoVersion:"go1.22.4"}
```

### Practical Tip

Helm is covered in detail later in [12-helm-kustomize](./12-helm-kustomize), but installing it in advance allows you to immediately follow along with Helm-based installation commands that appear throughout the course.

---

## Step 5: Install Additional Tools (Optional)

The tools below are not required, but installing them will significantly boost your productivity when working with K8s.

### kubectx + kubens

These are tools for quickly switching between multiple clusters (contexts) and namespaces.

**Why you need them:** Instead of typing `kubectl config use-context ...` every time, you can simply switch with `kubectx name`.

#### Installation

**macOS:**

```bash
brew install kubectx
```

**Windows:**

```bash
choco install kubectx kubens
```

**Linux:**

```bash
# Install via krew (kubectl plugin manager)
kubectl krew install ctx
kubectl krew install ns
```

#### Usage Examples

```bash
# List clusters (contexts)
kubectx

# Switch cluster
kubectx minikube

# List namespaces
kubens

# Switch namespace
kubens kube-system
```

---

### k9s (TUI Management Tool)

This is a tool for visually managing a K8s cluster from the terminal. You can quickly handle Pod status, logs, deletion, and more using keyboard shortcuts.

#### Installation

**macOS:**

```bash
brew install derailed/k9s/k9s
```

**Windows:**

```bash
choco install k9s
```

**Linux:**

```bash
curl -sS https://webi.sh/k9s | sh
```

#### Launch

```bash
k9s
```

A screen like the following will appear in the terminal.

```text
 ____  __.________
|    |/ _/   __   \______
|      < \____    /  ___/
|    |  \   /    /\___ \
|____|__ \ /____//____  >
        \/             \/

Context: minikube
Cluster: minikube
User:    minikube
K9s Rev: v0.32.4

  <Pod>                          default
  NAME                READY  STATUS   RESTARTS  AGE
```

Press `q` to exit. You can type `:pod`, `:svc`, `:deploy`, etc. to browse resources.

---

### Lens (GUI Management Tool)

If you want to manage a K8s cluster with a mouse, use Lens.

#### Installation

1. Download from [https://k8slens.dev](https://k8slens.dev)
2. Run the installer
3. Create an account (free)
4. After launching, local clusters are detected automatically

### Note

Lens comes in two versions: Open Lens (open-source) and the commercial Lens Desktop. Open Lens is sufficient for learning purposes, but recent versions may have feature differences. If you are comfortable with the terminal, k9s alone is sufficient.

---

## Final Verification

Once all installations are complete, run the following commands in order to verify.

### 1. Verify kubectl

```bash
kubectl version --client
```

Expected output:

```text
Client Version: v1.31.0
Kustomize Version: v5.4.2
```

### 2. Verify Cluster Status (minikube)

```bash
minikube status
```

Expected output:

```text
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured
```

### 3. Verify Cluster Connection

```bash
kubectl cluster-info
```

Expected output:

```text
Kubernetes control plane is running at https://127.0.0.1:xxxxx
CoreDNS is running at https://127.0.0.1:xxxxx/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
```

### 4. Verify Nodes

```bash
kubectl get nodes
```

Expected output:

```text
NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane   5m    v1.30.0
```

If `STATUS` shows `Ready`, everything is working correctly.

### 5. Verify Helm

```bash
helm version
```

Expected output:

```text
version.BuildInfo{Version:"v3.15.2", ...}
```

---

## Troubleshooting

### minikube start Fails

**Symptom:** `Exiting due to DRV_NOT_HEALTHY` or `docker is not running`

**Cause:** Docker is not running.

**Solution:**

```bash
# Check Docker status
docker info

# Start Docker Desktop (Windows/Mac)
# On Linux, start the service
sudo systemctl start docker
```

After that, try `minikube start` again.

---

### kubectl Commands Cannot Connect to the Cluster

**Symptom:** `The connection to the server localhost:8080 was refused`

**Cause:** kubectl does not know about any cluster.

**Solution:**

```bash
# Check current context
kubectl config current-context

# List available contexts
kubectl config get-contexts
```

If there is no context, verify that a cluster is running.

```bash
minikube start   # for minikube
# or
kind create cluster   # for kind
```

---

### Pods Stuck in Pending State Due to Insufficient Memory

**Symptom:** `kubectl get pods` shows STATUS as `Pending` continuously

**Solution:**

```bash
# Allocate more memory to minikube
minikube delete
minikube start --memory=4096 --cpus=2
```

---

## Practical Tip

The tool versions used in this course may change over time. Make it a habit to check the **official documentation** for the latest versions when installing.

| Tool | Official Documentation |
|------|----------------------|
| kubectl | https://kubernetes.io/docs/tasks/tools/ |
| minikube | https://minikube.sigs.k8s.io/docs/start/ |
| kind | https://kind.sigs.k8s.io/docs/user/quick-start/ |
| k3d | https://k3d.io/ |
| Helm | https://helm.sh/docs/intro/install/ |
| k9s | https://k9scli.io/ |

---

## Next Step

Once the environment preparation is complete, proceed to [Kubernetes Cluster Architecture](./01-architecture). We will draw the big picture of how K8s is structured internally.
