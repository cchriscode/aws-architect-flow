# 컨테이너 학습 환경 준비

이 문서는 **컨테이너 강의를 시작하기 전에** 필요한 도구를 설치하고 환경을 준비하는 방법을 설명한다.
Docker 설치, Docker Compose 확인, 계정 생성, 편집기 설정까지 모두 다룬다.

강의를 시작하기 전에 이 문서의 모든 단계를 완료하고, 마지막 확인 명령어가 정상 출력되는지 반드시 확인한다.

---

# 1. 시스템 요구사항

Docker를 실행하려면 아래 최소 사양을 충족해야 한다.

| 항목 | 최소 | 권장 |
|------|------|------|
| RAM | 4GB | 8GB 이상 |
| 디스크 여유 공간 | 10GB | 20GB 이상 |
| CPU | 2코어 | 4코어 이상 |
| 가상화 | BIOS에서 VT-x/AMD-V 활성화 | - |

### 확인 방법 (리눅스 환경)

```bash
free -h
```

### 예상 출력

```text
               total        used        free      shared  buff/cache   available
Mem:           7.8Gi       2.1Gi       3.2Gi       120Mi       2.5Gi       5.3Gi
```

`total`이 4Gi 이상이면 최소 요구사항을 충족한다.

```bash
df -h /
```

### 예상 출력

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1       50G   15G   33G  32% /
```

`Avail`이 10G 이상이면 된다.

### 주의

RAM이 4GB 미만이면 Docker 컨테이너를 여러 개 실행할 때 시스템이 느려질 수 있다.
학습 중에는 사용하지 않는 프로그램을 닫아 메모리를 확보하는 것이 좋다.

---

# 2. Docker 설치

운영체제에 따라 설치 방법이 다르다. 자신의 환경에 맞는 항목을 따른다.

---

## 2.1 Windows: Docker Desktop 설치

### 사전 조건

* WSL2가 설치되어 있어야 한다 (01-linux/00-prerequisites.md 참고).
* WSL2 백엔드가 활성화되어야 한다. Docker Desktop이 WSL2 위에서 동작한다.

### 설치 절차

**1단계: Docker Desktop을 다운로드한다.**

https://www.docker.com/products/docker-desktop/ 에서 "Download for Windows"를 클릭한다.

**2단계: 설치 파일을 실행한다.**

설치 마법사가 나타나면 아래 옵션을 확인한다:

* "Use WSL 2 instead of Hyper-V" 체크 (반드시)
* "Add shortcut to desktop" 체크 (선택)

**3단계: 설치 완료 후 컴퓨터를 재부팅한다.**

**4단계: Docker Desktop을 실행한다.**

시작 메뉴에서 "Docker Desktop"을 검색해 실행한다.
처음 실행 시 서비스 약관 동의 화면이 나온다. 동의하고 진행한다.

**5단계: WSL2 통합을 확인한다.**

Docker Desktop 상단의 톱니바퀴(Settings)를 클릭하고:

1. **General** 탭: "Use the WSL 2 based engine" 이 체크되어 있는지 확인한다.
2. **Resources > WSL Integration** 탭: 사용 중인 Ubuntu 배포판이 활성화되어 있는지 확인한다.

**6단계: WSL2 터미널에서 Docker가 동작하는지 확인한다.**

WSL2 Ubuntu 터미널을 열고:

```bash
docker --version
```

### 예상 출력

```text
Docker version 27.5.1, build 9f9e405
```

### 주의

* Docker Desktop이 실행 중이어야 WSL2에서 docker 명령이 동작한다. 트레이 아이콘에서 Docker가 실행 중인지 확인한다.
* "Docker Desktop - WSL2 backend requires WSL update" 메시지가 나오면 PowerShell(관리자)에서 `wsl --update`를 실행한다.

---

## 2.2 Mac: Docker Desktop 설치

### Apple Silicon vs Intel 확인

먼저 자신의 Mac 칩을 확인한다.

왼쪽 상단 Apple 메뉴 > "이 Mac에 관하여"를 클릭한다.

* **칩**: Apple M1, M2, M3 등 → Apple Silicon
* **프로세서**: Intel Core → Intel

### 설치 절차

**1단계: Docker Desktop을 다운로드한다.**

https://www.docker.com/products/docker-desktop/ 에서:

* Apple Silicon Mac: "Download for Mac - Apple Silicon" 클릭
* Intel Mac: "Download for Mac - Intel Chip" 클릭

### 주의

칩 종류에 맞지 않는 버전을 설치하면 정상 동작하지 않을 수 있다. 반드시 자신의 칩에 맞는 버전을 선택한다.

**2단계: 다운로드한 `.dmg` 파일을 열고, Docker 아이콘을 Applications 폴더로 드래그한다.**

**3단계: Applications에서 Docker를 실행한다.**

처음 실행 시 시스템 접근 권한을 요청할 수 있다. 허용한다.

**4단계: 메뉴바에 Docker 아이콘(고래)이 나타나면 설치 완료이다.**

**5단계: 터미널에서 확인한다.**

```bash
docker --version
```

### 예상 출력

```text
Docker version 27.5.1, build 9f9e405
```

---

## 2.3 Linux: Docker Engine 직접 설치

Linux에서는 Docker Desktop 대신 Docker Engine을 직접 설치한다.

### 설치 절차

**1단계: 이전 버전이 있으면 제거한다.**

```bash
sudo apt remove docker docker-engine docker.io containerd runc 2>/dev/null
```

### 예상 출력

```text
Reading package lists... Done
Building dependency tree... Done
```

이미 없는 경우에도 에러 없이 진행된다.

**2단계: 필요한 패키지를 설치한다.**

```bash
sudo apt update && sudo apt install -y ca-certificates curl gnupg
```

**3단계: Docker 공식 GPG 키를 추가한다.**

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

**4단계: Docker 저장소를 추가한다.**

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

**5단계: Docker Engine을 설치한다.**

```bash
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 예상 출력 (마지막 부분)

```text
Setting up docker-ce (5:27.5.1-1~ubuntu.22.04~jammy) ...
Processing triggers for man-db (2.10.2-1) ...
```

**6단계: 현재 사용자를 docker 그룹에 추가한다.**

```bash
sudo usermod -aG docker $USER
```

### 주의

그룹 변경 후 재로그인 또는 재부팅이 필요하다. 재로그인 전까지는 `sudo docker`로 실행해야 한다.

재로그인 후 sudo 없이 확인:

```bash
docker --version
```

### 예상 출력

```text
Docker version 27.5.1, build 9f9e405
```

---

# 3. Docker 설치 확인: hello-world

Docker가 정상 설치되었는지 확인하는 가장 확실한 방법은 hello-world 컨테이너를 실행하는 것이다.

```bash
docker run hello-world
```

### 예상 출력

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

### 설명

* `Unable to find image ... locally`: 로컬에 이미지가 없어서 Docker Hub에서 다운로드한다.
* `Hello from Docker!`: 이 메시지가 나오면 Docker가 완전히 정상 동작하는 것이다.

### 주의

`Cannot connect to the Docker daemon` 에러가 나오면:

* Windows/Mac: Docker Desktop이 실행 중인지 확인한다.
* Linux: Docker 서비스가 실행 중인지 확인한다.

```bash
sudo systemctl status docker
```

### 예상 출력

```text
● docker.service - Docker Application Container Engine
     Loaded: loaded (/lib/systemd/system/docker.service; enabled; vendor preset: enabled)
     Active: active (running) since ...
```

`active (running)` 이면 정상이다. 실행 중이 아니면:

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

---

# 4. Docker Compose 확인

Docker Compose는 여러 컨테이너를 한 번에 정의하고 실행하는 도구이다.
Docker Desktop에는 기본 포함되어 있고, Linux에서 Docker Engine을 설치했다면 플러그인으로 함께 설치된다.

```bash
docker compose version
```

### 예상 출력

```text
Docker Compose version v2.32.4
```

### 주의

예전 버전은 `docker-compose` (하이픈)으로 실행했지만, 현재 버전은 `docker compose` (스페이스)로 실행한다.

`docker compose` 명령이 안 되면:

```bash
docker-compose --version
```

이것도 안 되면 별도 설치가 필요하다:

```bash
sudo apt install docker-compose-plugin -y
```

---

# 5. Docker Hub 계정 생성

Docker Hub는 Docker 이미지를 저장하고 공유하는 공개 레지스트리이다.
이미지를 다운로드(pull)하는 것은 계정 없이도 가능하지만, 이미지를 업로드(push)하려면 계정이 필요하다.

### 계정 생성

1. https://hub.docker.com 에 접속한다.
2. "Sign Up"을 클릭한다.
3. 사용자 이름, 이메일, 비밀번호를 입력하고 계정을 만든다.

### 터미널에서 로그인

```bash
docker login
```

### 예상 출력

```text
Log in with your Docker ID or email address to push and pull images from Docker Hub.
Username: myuser
Password:
Login Succeeded
```

### 설명

* 비밀번호 입력 시 화면에 아무것도 표시되지 않는다. 이것은 정상이다.
* `Login Succeeded`가 나오면 로그인 완료이다.

### 실무 팁

로그인 정보는 `~/.docker/config.json`에 저장된다. 공유 서버에서는 로그인 후 작업이 끝나면 `docker logout`으로 로그아웃하는 습관을 들인다.

---

# 6. VS Code + Docker 확장 프로그램 설치

VS Code에 Docker 확장을 설치하면 컨테이너, 이미지, 볼륨 등을 시각적으로 관리할 수 있다.
Dockerfile 작성 시 문법 강조와 자동 완성도 지원한다.

### VS Code 설치

아직 VS Code가 없다면:

1. https://code.visualstudio.com 에서 다운로드한다.
2. 운영체제에 맞는 버전을 설치한다.

### Docker 확장 프로그램 설치

**방법 1: VS Code 안에서 설치**

1. VS Code를 연다.
2. 왼쪽 사이드바에서 확장(Extensions) 아이콘을 클릭한다 (사각형 4개 모양).
3. 검색창에 `Docker`를 입력한다.
4. "Docker" (Microsoft 제작)를 찾아 **Install**을 클릭한다.

**방법 2: 터미널에서 설치**

```bash
code --install-extension ms-azuretools.vscode-docker
```

### 예상 출력

```text
Installing extension 'ms-azuretools.vscode-docker'...
Extension 'ms-azuretools.vscode-docker' v1.x.x was successfully installed.
```

### 설치 확인

VS Code 왼쪽 사이드바에 고래(Docker) 아이콘이 나타나면 설치 완료이다.
이 아이콘을 클릭하면 현재 실행 중인 컨테이너, 이미지 목록 등을 볼 수 있다.

### 실무 팁

WSL2 환경에서 VS Code를 사용한다면 "Remote - WSL" 확장도 함께 설치하면 좋다.
WSL2 안의 파일을 VS Code에서 직접 편집할 수 있다.

---

# 7. 리소스 할당 설정 (Docker Desktop)

Docker Desktop을 사용하는 경우, Docker가 사용할 수 있는 CPU와 메모리를 설정할 수 있다.

### 설정 방법

1. Docker Desktop을 연다.
2. 톱니바퀴(Settings) 아이콘을 클릭한다.
3. **Resources** 탭을 선택한다.

### 권장 설정

| 항목 | 학습용 권장 값 |
|------|---------------|
| CPUs | 2개 이상 |
| Memory | 4GB 이상 (가능하면 6~8GB) |
| Swap | 1GB |
| Disk image size | 20GB 이상 |

### 설정 변경 후

"Apply & Restart"를 클릭하면 Docker가 재시작되면서 설정이 반영된다.

### 주의

* 메모리를 너무 많이 할당하면 호스트(Windows/Mac) 시스템이 느려질 수 있다. 전체 RAM의 절반을 넘기지 않는 것이 좋다.
* WSL2 백엔드를 사용하는 Windows의 경우, Resources 탭에 설정 항목이 안 보일 수 있다. 이 경우 WSL2의 `.wslconfig` 파일로 설정한다.

### WSL2 메모리 제한 (.wslconfig)

Windows에서 WSL2 메모리를 제한하려면 `C:\Users\사용자이름\.wslconfig` 파일을 만든다:

```text
[wsl2]
memory=6GB
processors=2
swap=2GB
```

설정 후 PowerShell에서:

```powershell
wsl --shutdown
```

다시 WSL2를 열면 반영된다.

---

# 8. 환경 준비 최종 확인

모든 설치가 끝났으면 아래 명령어를 실행하여 확인한다.

## 8.1 Docker 버전 확인

```bash
docker --version
```

### 예상 출력

```text
Docker version 27.5.1, build 9f9e405
```

---

## 8.2 Docker Compose 버전 확인

```bash
docker compose version
```

### 예상 출력

```text
Docker Compose version v2.32.4
```

---

## 8.3 Docker 시스템 정보 확인

```bash
docker info
```

### 예상 출력 (주요 부분)

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

### 설명

* `Server Version`: Docker 서버 버전이다.
* `CPUs`, `Total Memory`: Docker가 사용 가능한 리소스이다.
* `Containers`, `Images`: 현재 시스템에 있는 컨테이너와 이미지 수이다.

---

## 8.4 hello-world 재확인

```bash
docker run hello-world
```

### 예상 출력 (핵심 부분)

```text
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

---

# 9. 한 번에 확인하기

아래 명령어를 실행하면 핵심 도구의 설치 상태를 한 번에 볼 수 있다.

```bash
echo "=== Docker ===" && docker --version && echo "" && \
echo "=== Docker Compose ===" && docker compose version && echo "" && \
echo "=== Docker Info (요약) ===" && docker info 2>/dev/null | grep -E "Server Version|CPUs|Total Memory|Operating System" && echo "" && \
echo "=== Docker Hub 로그인 상태 ===" && docker info 2>/dev/null | grep "Username" && echo "" && \
echo "=== hello-world 테스트 ===" && docker run --rm hello-world 2>&1 | head -n 5
```

### 예상 출력

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

모든 항목이 정상 출력되면 컨테이너 학습 환경 준비가 완료된 것이다.

---

# 10. 자주 발생하는 문제와 해결

## 10.1 `Cannot connect to the Docker daemon`

Docker 데몬이 실행 중이 아닌 경우이다.

**Windows/Mac**: Docker Desktop이 실행 중인지 확인한다. 시스템 트레이(작업 표시줄)에서 Docker 아이콘을 확인한다.

**Linux**: Docker 서비스를 시작한다.

```bash
sudo systemctl start docker
```

확인:

```bash
sudo systemctl status docker
```

### 예상 출력

```text
● docker.service - Docker Application Container Engine
     Active: active (running) since ...
```

---

## 10.2 `permission denied while trying to connect to the Docker daemon socket`

현재 사용자가 docker 그룹에 속하지 않은 경우이다.

```bash
sudo usermod -aG docker $USER
```

실행 후 반드시 재로그인 또는 재부팅한다.

재로그인 후 확인:

```bash
groups
```

### 예상 출력

```text
myuser adm sudo docker
```

`docker`가 목록에 있으면 정상이다.

---

## 10.3 Docker Desktop 실행 시 "WSL 2 installation is incomplete"

WSL2 커널 업데이트가 필요하다. PowerShell(관리자)에서:

```powershell
wsl --update
```

### 예상 출력

```text
Checking for updates.
Updating Windows Subsystem for Linux...
```

업데이트 후 Docker Desktop을 다시 실행한다.

---

## 10.4 `docker compose` 명령을 찾을 수 없는 경우

Docker Compose 플러그인이 설치되지 않은 경우이다.

```bash
sudo apt install docker-compose-plugin -y
```

설치 후 확인:

```bash
docker compose version
```

---

## 10.5 Docker 이미지 pull이 매우 느린 경우

네트워크 환경에 따라 Docker Hub 접근이 느릴 수 있다.
Docker Desktop에서 미러 레지스트리를 설정할 수 있다.

Settings > Docker Engine에서 아래 내용을 추가한다:

```json
{
  "registry-mirrors": ["https://mirror.gcr.io"]
}
```

"Apply & Restart"를 클릭한다.

---

## 10.6 디스크 공간 부족

Docker 이미지와 컨테이너가 디스크를 많이 차지할 수 있다. 사용하지 않는 리소스를 정리한다:

```bash
docker system df
```

### 예상 출력

```text
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          5         1         2.3GB     1.8GB (78%)
Containers      3         0         15MB      15MB (100%)
Local Volumes   2         1         500MB     200MB (40%)
Build Cache     10        0         300MB     300MB
```

정리 명령:

```bash
docker system prune
```

### 예상 출력

```text
WARNING! This will remove:
  - all stopped containers
  - all networks not used by at least one container
  - all dangling images
  - unused build cache

Are you sure you want to continue? [y/N] y
Total reclaimed space: 2.1GB
```

### 주의

`docker system prune`은 사용 중이 아닌 리소스만 삭제한다. 실행 중인 컨테이너에는 영향을 주지 않는다.

---

# 11. 다음 단계

환경 준비가 완료되면 다음 문서인 컨테이너 개념 가이드로 넘어간다.
Docker가 정상 동작하는 것을 확인했으므로 컨테이너의 기본 개념과 동작 원리를 학습할 수 있다.

---
