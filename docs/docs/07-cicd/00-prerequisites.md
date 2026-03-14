# CI/CD 학습 환경 준비

> 이 문서는 CI/CD 강의를 시작하기 **전에** 필요한 도구를 설치하고 환경을 세팅하는 가이드예요. Git 설치부터 GitHub 계정, SSH 키, Jenkins 실습 환경까지 하나씩 따라 하면 돼요. 모든 단계를 완료하면 [Git 기본](./01-git-basics)부터 바로 시작할 수 있어요.

---

## 필요한 도구 목록

```
도구              용도                              필수 여부
─────────────────────────────────────────────────────────────
Git               버전 관리, CI/CD의 기반             필수
GitHub 계정       원격 저장소, Actions 실습           필수
SSH 키            GitHub 인증 (패스워드 대신)          필수
GitHub CLI (gh)   터미널에서 PR/이슈 관리              선택
Docker            Jenkins 실습 환경                   필수
Jenkins           CI 파이프라인 실습                   필수
VS Code           코드 편집기 + Git 확장               권장
GitLab Runner     GitLab CI 실습                     선택
```

---

## 1. Git 설치

Git은 CI/CD의 **시작점**이에요. 코드를 커밋하고 푸시해야 파이프라인이 돌아가니까, 가장 먼저 설치해야 해요.

### Windows

[https://git-scm.com](https://git-scm.com)에서 다운로드하고 설치해요.

```bash
# 설치 후 확인
git --version
```

### 예상 출력

```text
git version 2.43.0.windows.1
```

설치 과정에서 옵션을 물어보는데, 대부분 기본값(Next)으로 진행하면 돼요. 단, **기본 에디터**는 VS Code로 변경하는 걸 추천해요.

### Mac

```bash
# 방법 1: Xcode Command Line Tools (가장 간단)
xcode-select --install

# 방법 2: Homebrew (최신 버전 유지가 쉬움)
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

### 확인

```bash
git --version
```

### 예상 출력

```text
git version 2.43.0
```

### 주의

버전이 `1.x`대로 나오면 너무 오래된 버전이에요. 최신 Git은 `2.30` 이상을 권장해요. 오래된 버전에서는 일부 기능(`git switch`, `git restore` 등)이 동작하지 않아요.

---

## 2. Git 기본 설정

Git을 설치했으면 **사용자 정보를 등록**해야 해요. 이 정보가 커밋 기록에 남아요.

```bash
# 이름 설정
git config --global user.name "홍길동"

# 이메일 설정 (GitHub 계정 이메일과 동일하게)
git config --global user.email "gildong@example.com"
```

### 설정 확인

```bash
git config --global --list
```

### 예상 출력

```text
user.name=홍길동
user.email=gildong@example.com
```

### 추가 권장 설정

```bash
# 기본 브랜치 이름을 main으로 설정
git config --global init.defaultBranch main

# 줄바꿈 자동 변환 (Windows 사용자 필수)
git config --global core.autocrlf true

# Mac/Linux 사용자는 이렇게
git config --global core.autocrlf input

# 기본 에디터를 VS Code로 변경
git config --global core.editor "code --wait"
```

### 주의

`user.email`은 GitHub 계정에 등록된 이메일과 **동일하게** 설정해야 해요. 다르면 GitHub에서 커밋이 본인 계정과 연결되지 않아서, 잔디(contribution graph)가 안 심어져요.

---

## 3. GitHub 계정 생성

### 왜 필요한가

GitHub는 CI/CD 실습의 핵심 플랫폼이에요. **GitHub Actions**로 파이프라인을 만들고, **Pull Request**로 코드 리뷰를 하고, **원격 저장소**로 협업해요.

### 가입 절차

1. [https://github.com](https://github.com)에 접속
2. "Sign up" 클릭
3. 이메일, 비밀번호, 사용자명 입력
4. 이메일 인증 완료

### 실무 팁

- 사용자명은 한번 정하면 바꾸기 번거로워요. **영문 소문자 + 하이픈** 조합으로 깔끔하게 만드세요.
- 프로필에 이름과 사진을 등록하면 팀 작업할 때 서로 알아보기 쉬워요.
- 개인 이메일과 회사 이메일을 둘 다 등록해두면, 어떤 이메일로 커밋해도 본인 프로필에 연결돼요.

---

## 4. SSH 키 생성 및 GitHub에 등록

HTTPS 대신 SSH로 GitHub에 연결하면 **매번 비밀번호를 입력하지 않아도** 돼요. CI/CD 파이프라인에서도 SSH 인증을 자주 사용해요.

### 4.1 SSH 키 생성

```bash
ssh-keygen -t ed25519 -C "gildong@example.com"
```

실행하면 아래처럼 물어봐요.

```text
Generating public/private ed25519 key pair.
Enter file in which to save the key (/home/user/.ssh/id_ed25519):
```

**Enter**를 누르면 기본 경로에 저장돼요.

```text
Enter passphrase (empty for no passphrase):
```

패스프레이즈(비밀번호)를 설정할 수 있어요. 보안을 위해 설정하는 걸 권장하지만, 실습 환경이라면 빈칸으로 두고 **Enter**를 눌러도 돼요.

### 예상 출력

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

### 4.2 공개 키 확인

```bash
cat ~/.ssh/id_ed25519.pub
```

### 예상 출력

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx gildong@example.com
```

이 출력 내용 **전체를 복사**해요.

### 4.3 GitHub에 SSH 키 등록

1. GitHub 로그인 후 오른쪽 상단 프로필 아이콘 클릭
2. **Settings** 클릭
3. 왼쪽 메뉴에서 **SSH and GPG keys** 클릭
4. **New SSH key** 버튼 클릭
5. Title에 알아볼 수 있는 이름 입력 (예: "내 노트북")
6. Key 필드에 복사한 공개 키 붙여넣기
7. **Add SSH key** 클릭

### 4.4 연결 테스트

```bash
ssh -T git@github.com
```

처음 연결하면 아래 메시지가 나와요. `yes`를 입력해요.

```text
The authenticity of host 'github.com (20.200.245.247)' can't be established.
ED25519 key fingerprint is SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
```

### 예상 출력 (성공)

```text
Hi gildong! You've successfully authenticated, but GitHub does not provide shell access.
```

### 주의

- `Permission denied (publickey)` 에러가 나오면 SSH 키가 제대로 등록되지 않은 거예요. 공개 키(`.pub`)가 아닌 개인 키를 붙여넣지 않았는지 확인하세요.
- Windows에서는 **Git Bash**에서 실행해야 해요. PowerShell이나 CMD에서는 SSH가 다르게 동작할 수 있어요.

---

## 5. GitHub CLI 설치 (선택)

GitHub CLI(`gh`)를 설치하면 터미널에서 직접 Pull Request를 만들고, 이슈를 관리하고, Actions 결과를 확인할 수 있어요. 필수는 아니지만, CI/CD 작업 효율이 크게 올라가요.

### 설치

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

### 인증

```bash
gh auth login
```

대화형으로 진행돼요. GitHub.com 선택, SSH 선택, 브라우저 인증 순서로 하면 돼요.

### 확인

```bash
gh auth status
```

### 예상 출력

```text
github.com
  ✓ Logged in to github.com account gildong (keyring)
  - Active account: true
  - Git operations protocol: ssh
  - Token: gho_************************************
  - Token scopes: 'gist', 'read:org', 'repo', 'workflow'
```

---

## 6. Jenkins 실습 준비 (Docker로 실행)

Jenkins는 CI/CD 파이프라인의 대표적인 도구예요. Docker로 실행하면 설치 과정이 매우 간단해요.

### 사전 조건

Docker가 설치되어 있어야 해요. [03-containers](../03-containers/02-docker-basics) 과정을 참고하세요.

```bash
docker --version
```

### 예상 출력

```text
Docker version 24.0.7, build afdd53b
```

### Jenkins 컨테이너 실행

```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:lts
```

각 옵션 설명:

| 옵션 | 설명 |
|------|------|
| `-d` | 백그라운드에서 실행 |
| `--name jenkins` | 컨테이너 이름 지정 |
| `-p 8080:8080` | 웹 UI 포트 |
| `-p 50000:50000` | 에이전트 연결 포트 |
| `-v jenkins_home:/var/jenkins_home` | 데이터 영속화 (컨테이너 삭제해도 설정 유지) |

### 초기 비밀번호 확인

```bash
docker logs jenkins 2>&1 | grep -A 2 "initialAdminPassword"
```

### 예상 출력

```text
Jenkins initial setup is required. An admin user has been created and a password generated.
Please use the following password to proceed to installation:

a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

This may also be found at: /var/jenkins_home/secrets/initialAdminPassword
```

또는 직접 파일에서 확인할 수도 있어요.

```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### 접속 확인

브라우저에서 [http://localhost:8080](http://localhost:8080)에 접속하고, 위에서 확인한 비밀번호를 입력해요.

### 실무 팁

- Jenkins 데이터를 볼륨(`-v`)으로 관리하면, `docker rm jenkins`로 컨테이너를 삭제해도 파이프라인 설정이 유지돼요.
- 실습이 끝나면 `docker stop jenkins`로 중지하고, 다시 시작할 때는 `docker start jenkins`를 쓰면 돼요.
- 처음 접속하면 "Install suggested plugins"를 선택하세요. 기본 플러그인이 자동으로 설치돼요.

---

## 7. GitLab Runner 실습 (선택)

GitLab CI를 실습하려면 GitLab Runner가 필요해요. Docker로 간단하게 실행할 수 있어요.

### GitLab Runner 컨테이너 실행

```bash
docker run -d \
  --name gitlab-runner \
  --restart always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v gitlab-runner-config:/etc/gitlab-runner \
  gitlab/gitlab-runner:latest
```

### 확인

```bash
docker ps --filter name=gitlab-runner
```

### 예상 출력

```text
CONTAINER ID   IMAGE                         COMMAND                  STATUS         PORTS   NAMES
a1b2c3d4e5f6   gitlab/gitlab-runner:latest   "/usr/bin/dumb-init …"   Up 3 seconds           gitlab-runner
```

### 실무 팁

- GitLab Runner는 **GitLab 서버에 등록(register)**해야 사용할 수 있어요. 자세한 등록 방법은 [GitLab CI](./06-gitlab-ci) 강의에서 다뤄요.
- GitLab.com 무료 계정으로도 CI/CD 파이프라인을 실행할 수 있어요 (월 400분 무료).

---

## 8. VS Code + Git 확장 프로그램

### VS Code 설치

[https://code.visualstudio.com](https://code.visualstudio.com)에서 다운로드하고 설치해요.

### 권장 확장 프로그램

| 확장 프로그램 | 용도 |
|---------------|------|
| **GitLens** | 커밋 이력 시각화, 라인별 blame, 브랜치 비교 |
| **Git Graph** | 브랜치 그래프를 시각적으로 확인 |
| **YAML** | GitHub Actions, GitLab CI 설정 파일 작성 |
| **Docker** | Dockerfile, docker-compose 편집 지원 |
| **Jenkinsfile Support** | Jenkins 파이프라인 문법 하이라이팅 |

### 설치 방법

VS Code를 열고, 왼쪽 사이드바에서 확장 아이콘(네모 4개)을 클릭한 다음, 검색창에 확장 프로그램 이름을 입력하고 Install을 클릭해요.

또는 터미널에서 설치할 수도 있어요.

```bash
code --install-extension eamodio.gitlens
code --install-extension mhutchie.git-graph
code --install-extension redhat.vscode-yaml
```

---

## 9. 전체 환경 확인

모든 설치가 끝났으면 아래 명령어로 한 번에 확인해요.

```bash
echo "=== Git ===" && git --version
echo "=== SSH ===" && ssh -T git@github.com 2>&1
echo "=== GitHub CLI ===" && gh auth status 2>&1
echo "=== Docker ===" && docker --version
echo "=== Jenkins ===" && docker ps --filter name=jenkins --format "{{.Names}}: {{.Status}}"
```

### 예상 출력 (모든 도구가 설치된 경우)

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

### 최소 필수 체크리스트

```
[  ] git --version                    → 2.30 이상
[  ] ssh -T git@github.com            → "successfully authenticated" 메시지
[  ] docker --version                 → Docker 설치 확인
[  ] localhost:8080 접속               → Jenkins 화면 표시
```

### 주의

- GitHub CLI와 GitLab Runner는 **선택 사항**이에요. 없어도 강의를 따라갈 수 있어요.
- Jenkins는 Docker 기반으로 실행하기 때문에, Docker가 **반드시** 먼저 설치되어 있어야 해요.
- Windows 사용자는 Git Bash 또는 WSL2에서 실습하는 것을 권장해요. PowerShell에서는 일부 리눅스 명령어가 동작하지 않아요.

---

## 다음 단계

환경 준비가 끝났으면, [Git 기본 ~ 심화](./01-git-basics)부터 시작하세요. Git의 동작 원리를 먼저 이해하고 나면, CI/CD 파이프라인이 왜 그렇게 동작하는지 자연스럽게 이해돼요.
