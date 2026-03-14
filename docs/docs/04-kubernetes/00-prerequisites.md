# 쿠버네티스 학습 환경 준비

> 쿠버네티스(Kubernetes)를 배우기 전에 로컬 환경을 먼저 세팅해야 해요. 여기서 안내하는 도구들을 설치하면, 이후 강의에서 **바로 실습**할 수 있어요. [컨테이너 기초](../03-containers/01-concept)를 먼저 학습하고 오는 것을 강력히 권장해요.

---

## 시스템 요구사항

쿠버네티스 로컬 클러스터를 실행하려면 어느 정도의 리소스가 필요해요.

| 항목 | 최소 | 권장 |
|------|------|------|
| RAM | 4GB | 8GB 이상 |
| CPU | 2코어 | 4코어 이상 |
| 디스크 | 20GB 여유 공간 | 40GB 이상 |
| OS | Windows 10+, macOS 12+, Ubuntu 20.04+ | 최신 버전 |

### 주의

RAM 4GB 미만의 환경에서는 클러스터가 시작되더라도 Pod가 자주 죽어요. 노트북으로 학습한다면 **불필요한 프로그램을 닫고** 진행하세요.

---

## 1단계: Docker 설치 (필수 선행)

쿠버네티스는 컨테이너를 오케스트레이션하는 도구이므로, **Docker가 반드시 먼저 설치**되어 있어야 해요.

Docker 설치는 [03-containers](../03-containers/01-concept)에서 다루고 있어요. 아직 설치하지 않았다면 먼저 진행하세요.

### 설치 확인

```bash
docker version
```

### 예상 출력

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

`Client`와 `Server` 정보가 모두 출력되면 정상이에요.

### 주의

Docker Desktop을 설치하면 Docker Engine과 함께 기본적인 Kubernetes 지원도 포함되지만, 학습 목적으로는 **minikube나 kind를 별도로 사용하는 것**을 추천해요. Docker Desktop 내장 K8s는 설정 유연성이 낮아요.

---

## 2단계: kubectl 설치

`kubectl`은 쿠버네티스 클러스터와 소통하는 **CLI 도구**예요. K8s를 사용하는 동안 가장 많이 입력하게 될 명령어이므로, 반드시 설치해야 해요.

### Windows

**방법 1: Chocolatey 사용 (추천)**

```bash
choco install kubernetes-cli
```

**방법 2: 직접 다운로드**

```bash
curl -LO "https://dl.k8s.io/release/v1.31.0/bin/windows/amd64/kubectl.exe"
```

다운로드한 `kubectl.exe`를 `C:\usr\local\bin\` 등 PATH에 포함된 디렉토리에 넣어주세요.

### macOS

```bash
brew install kubectl
```

### Linux (Ubuntu/Debian)

**방법 1: apt 사용**

```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg

# Kubernetes 공식 GPG 키 추가
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.31/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

# 저장소 추가
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.31/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt-get update
sudo apt-get install -y kubectl
```

**방법 2: curl로 직접 다운로드**

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

### 설치 확인

```bash
kubectl version --client
```

### 예상 출력

```text
Client Version: v1.31.0
Kustomize Version: v5.4.2
```

버전 번호가 출력되면 성공이에요.

### 실무 팁

`kubectl`을 매번 타이핑하면 손이 아파요. 아래처럼 alias를 설정하면 편해요.

```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
alias k='kubectl'
```

추가 후 반영:

```bash
source ~/.bashrc   # 또는 source ~/.zshrc
```

이후 `k get pods`처럼 짧게 입력할 수 있어요.

---

## 3단계: 로컬 클러스터 도구 설치

실습을 위해 **내 컴퓨터에 쿠버네티스 클러스터**를 만들어야 해요. 대표적인 도구 3가지가 있어요.

### 도구 비교

| 항목 | minikube | kind | k3d |
|------|----------|------|-----|
| 설명 | 로컬 K8s 클러스터 (VM 또는 Docker 기반) | Docker 컨테이너 안에 K8s 클러스터 생성 | K3s(경량 K8s)를 Docker에서 실행 |
| 멀티 노드 | 지원 (설정 필요) | 기본 지원 | 기본 지원 |
| 리소스 사용 | 보통 (VM 사용 시 높음) | 적음 | 가장 적음 |
| 시작 속도 | 보통 (1~3분) | 빠름 (30초~1분) | 가장 빠름 (20~40초) |
| 에드온 지원 | 풍부 (dashboard, ingress 등 내장) | 직접 설정 | 직접 설정 |
| 학습 난이도 | 가장 쉬움 | 보통 | 보통 |
| 추천 대상 | K8s 처음 배우는 사람 | CI/CD, 멀티 노드 테스트 | 가벼운 로컬 개발 |

**처음 배우는 분에게는 minikube를 추천해요.** 문서가 많고, 에드온 설치가 간편해요.

---

### 옵션 A: minikube (추천)

#### 설치

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

#### 클러스터 시작

```bash
minikube start
```

#### 예상 출력

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

`Done!`이 나오면 클러스터가 정상적으로 떴어요.

#### 상태 확인

```bash
minikube status
```

#### 예상 출력

```text
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured
```

모든 항목이 `Running`이면 정상이에요.

#### 유용한 minikube 명령어

```bash
minikube stop          # 클러스터 중지 (리소스 절약)
minikube start         # 중지된 클러스터 재시작
minikube delete        # 클러스터 완전 삭제
minikube dashboard     # 웹 대시보드 열기
minikube addons list   # 사용 가능한 에드온 확인
```

### 실무 팁

실습이 끝나면 `minikube stop`으로 클러스터를 중지하세요. 계속 켜두면 CPU와 메모리를 계속 소모해요.

---

### 옵션 B: kind (Kubernetes IN Docker)

#### 설치

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

#### 클러스터 생성

```bash
kind create cluster
```

#### 예상 출력

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

#### 멀티 노드 클러스터 (선택)

`kind-config.yaml` 파일을 만들어서 워커 노드를 추가할 수 있어요.

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

#### 클러스터 삭제

```bash
kind delete cluster
```

---

### 옵션 C: k3d (K3s in Docker)

#### 설치

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

#### 클러스터 생성

```bash
k3d cluster create mycluster
```

#### 예상 출력

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

#### 클러스터 삭제

```bash
k3d cluster delete mycluster
```

---

## 4단계: Helm 설치

Helm은 쿠버네티스의 **패키지 매니저**예요. Linux에서 apt나 yum으로 프로그램을 설치하듯, Helm으로 K8s 애플리케이션을 설치해요.

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

### 설치 확인

```bash
helm version
```

### 예상 출력

```text
version.BuildInfo{Version:"v3.15.2", GitCommit:"1a500d5...", GitTreeState:"clean", GoVersion:"go1.22.4"}
```

### 실무 팁

Helm은 강의 후반부([12-helm-kustomize](./12-helm-kustomize))에서 본격적으로 다루지만, 미리 설치해두면 중간중간 등장하는 Helm 기반 설치 명령어를 바로 따라할 수 있어요.

---

## 5단계: 추가 도구 설치 (선택사항)

아래 도구들은 필수는 아니지만, 설치하면 K8s를 다루는 생산성이 크게 올라가요.

### kubectx + kubens

여러 클러스터(context)와 네임스페이스(namespace)를 빠르게 전환하는 도구예요.

**왜 필요한가:** `kubectl config use-context ...`를 매번 타이핑하는 대신, `kubectx 이름`으로 바로 전환해요.

#### 설치

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
# krew (kubectl 플러그인 매니저)를 통해 설치
kubectl krew install ctx
kubectl krew install ns
```

#### 사용 예시

```bash
# 클러스터(context) 목록 확인
kubectx

# 클러스터 전환
kubectx minikube

# 네임스페이스 목록 확인
kubens

# 네임스페이스 전환
kubens kube-system
```

---

### k9s (TUI 관리 도구)

터미널에서 K8s 클러스터를 시각적으로 관리하는 도구예요. Pod 상태, 로그, 삭제 등을 키보드 단축키로 빠르게 처리할 수 있어요.

#### 설치

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

#### 실행

```bash
k9s
```

터미널에 아래와 같은 화면이 나타나요.

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

`q`를 누르면 종료해요. `:pod`, `:svc`, `:deploy` 등을 입력해서 리소스를 탐색할 수 있어요.

---

### Lens (GUI 관리 도구)

마우스로 K8s 클러스터를 관리하고 싶다면 Lens를 사용하세요.

#### 설치

1. [https://k8slens.dev](https://k8slens.dev)에서 다운로드
2. 설치 프로그램 실행
3. 계정 생성 (무료)
4. 실행 후 로컬 클러스터가 자동으로 감지됨

### 주의

Lens는 Open Lens(오픈소스 버전)와 상용 Lens Desktop이 있어요. 학습 목적이라면 Open Lens로도 충분하지만, 최근 버전에서는 기능 차이가 있을 수 있어요. 터미널에 익숙하다면 k9s만으로도 충분해요.

---

## 최종 확인

모든 설치가 끝났으면 아래 명령어들을 순서대로 실행해서 확인하세요.

### 1. kubectl 확인

```bash
kubectl version --client
```

예상 출력:

```text
Client Version: v1.31.0
Kustomize Version: v5.4.2
```

### 2. 클러스터 상태 확인 (minikube 기준)

```bash
minikube status
```

예상 출력:

```text
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured
```

### 3. 클러스터 연결 확인

```bash
kubectl cluster-info
```

예상 출력:

```text
Kubernetes control plane is running at https://127.0.0.1:xxxxx
CoreDNS is running at https://127.0.0.1:xxxxx/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
```

### 4. 노드 확인

```bash
kubectl get nodes
```

예상 출력:

```text
NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane   5m    v1.30.0
```

`STATUS`가 `Ready`이면 정상이에요.

### 5. Helm 확인

```bash
helm version
```

예상 출력:

```text
version.BuildInfo{Version:"v3.15.2", ...}
```

---

## 문제 해결

### minikube start가 실패하는 경우

**증상:** `Exiting due to DRV_NOT_HEALTHY` 또는 `docker is not running`

**원인:** Docker가 실행되고 있지 않아요.

**해결:**

```bash
# Docker 상태 확인
docker info

# Docker Desktop을 실행하거나 (Windows/Mac)
# Linux에서는 서비스 시작
sudo systemctl start docker
```

이후 다시 `minikube start`를 시도하세요.

---

### kubectl 명령어가 클러스터에 연결되지 않는 경우

**증상:** `The connection to the server localhost:8080 was refused`

**원인:** kubectl이 클러스터 정보를 모르고 있어요.

**해결:**

```bash
# 현재 context 확인
kubectl config current-context

# 사용 가능한 context 목록
kubectl config get-contexts
```

context가 없다면 클러스터가 실행 중인지 확인하세요.

```bash
minikube start   # minikube의 경우
# 또는
kind create cluster   # kind의 경우
```

---

### 메모리 부족으로 Pod가 Pending 상태인 경우

**증상:** `kubectl get pods`에서 STATUS가 계속 `Pending`

**해결:**

```bash
# minikube에 더 많은 메모리 할당
minikube delete
minikube start --memory=4096 --cpus=2
```

---

## 실무 팁

이 강의에서 사용하는 도구들의 버전은 시간이 지나면 바뀔 수 있어요. 설치할 때 **공식 문서**에서 최신 버전을 확인하는 습관을 들이세요.

| 도구 | 공식 문서 |
|------|-----------|
| kubectl | https://kubernetes.io/docs/tasks/tools/ |
| minikube | https://minikube.sigs.k8s.io/docs/start/ |
| kind | https://kind.sigs.k8s.io/docs/user/quick-start/ |
| k3d | https://k3d.io/ |
| Helm | https://helm.sh/docs/intro/install/ |
| k9s | https://k9scli.io/ |

---

## 다음 단계

환경 준비가 끝났으면 [쿠버네티스 클러스터 아키텍처](./01-architecture)로 넘어가세요. K8s가 내부적으로 어떻게 구성되어 있는지 전체 그림을 그려볼 거예요.
