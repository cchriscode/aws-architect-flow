# 스크립팅 학습 환경 준비

> 스크립팅 과정에서는 Bash, Python, Go 세 가지 언어를 다뤄요. 각각의 역할이 다르고, DevOps 현장에서 모두 실제로 사용되는 언어들이에요. 이 문서에서는 세 언어의 개발 환경을 설정하고, 실습에 필요한 보조 도구들까지 한 번에 준비해요.

---

## 선수 과목

```
필수 선수 지식:

[01-linux]  리눅스 기본 명령어   → 터미널 사용, 파일/디렉토리 조작, 권한 관리
```

스크립팅 과정은 리눅스 기본 명령어를 알고 있다는 전제로 진행해요. `cd`, `ls`, `cat`, `chmod`, `grep` 같은 기본 명령어에 익숙하지 않다면 [01-linux](../01-linux/00-linux-commands)를 먼저 학습하세요.

---

## 1. Bash 환경 확인

Bash는 별도로 설치할 필요가 거의 없어요. Linux와 Mac에는 기본 포함이고, Windows에서는 WSL2 또는 Git Bash를 사용하면 돼요.

### Linux / Mac

```bash
bash --version
```

### 예상 출력

```text
GNU bash, version 5.2.21(1)-release (x86_64-pc-linux-gnu)
Copyright (C) 2022 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
```

### Windows 사용자

Windows에서 Bash를 쓰는 방법은 두 가지예요.

#### 방법 1: WSL2 (권장)

WSL2는 Windows 안에서 진짜 Linux를 돌리는 거예요. Bash뿐 아니라 리눅스 도구 전체를 쓸 수 있어서, DevOps 학습에는 이 방법이 가장 좋아요.

```powershell
# PowerShell을 관리자 권한으로 실행
wsl --install
```

설치 후 재부팅하면 Ubuntu가 기본으로 설치돼요. 사용자 이름과 비밀번호를 설정하면 끝이에요.

```powershell
# 설치 확인
wsl --list --verbose
```

### 예상 출력

```text
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

WSL2 터미널에서 Bash 버전을 확인하세요.

```bash
bash --version
```

#### 방법 2: Git Bash

Git for Windows를 설치하면 Git Bash가 함께 설치돼요. 간단한 Bash 스크립트 실습에는 충분하지만, 리눅스 도구가 제한적이에요.

- 다운로드: https://git-scm.com/download/win
- 설치 시 "Git Bash Here" 옵션을 체크하세요.

### 주의

- **WSL2를 강력히 권장**해요. Git Bash는 일부 리눅스 명령어(`apt`, `systemctl` 등)를 지원하지 않아요.
- WSL2 안에서는 Linux와 동일한 환경이 되므로, 이후 설치 과정도 Linux 방법을 따르면 돼요.

---

## 2. Python 3 설치

Python은 API 호출, 데이터 처리, 자동화 스크립트 등 복잡한 작업에 사용해요. **Python 3.10 이상**을 설치하세요.

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv
```

### Mac

```bash
brew install python3
```

### Windows

두 가지 방법 중 하나를 선택하세요.

#### 방법 1: python.org에서 다운로드

1. https://www.python.org/downloads/ 접속
2. 최신 Python 3.x 버전 다운로드
3. 설치 시 **"Add Python to PATH"** 체크 (중요!)
4. "Install Now" 클릭

#### 방법 2: Microsoft Store

Windows 검색에서 "Python"을 검색하면 Microsoft Store에서 설치할 수 있어요. PATH 설정이 자동으로 돼서 편해요.

### 설치 확인

```bash
python3 --version
```

### 예상 출력

```text
Python 3.12.4
```

```bash
pip3 --version
```

### 예상 출력

```text
pip 24.0 from /usr/lib/python3/dist-packages/pip (python 3.12)
```

### 주의

- Windows에서는 `python3` 대신 `python` 명령어를 사용해야 할 수 있어요.
- Mac에서 `python`은 시스템 Python(2.x)을 가리킬 수 있어요. 반드시 `python3`를 사용하세요.

---

### Python 가상환경 설정

Python 프로젝트마다 의존성을 독립적으로 관리하려면 가상환경(venv)을 사용해야 해요. 실습 프로젝트에서 이 방법을 꾸준히 사용할 거예요.

```bash
# 가상환경 생성
python3 -m venv myenv

# 가상환경 활성화
source myenv/bin/activate
```

### 예상 출력 (프롬프트가 변경됨)

```text
(myenv) user@hostname:~$
```

프롬프트 앞에 `(myenv)`가 붙으면 가상환경이 활성화된 거예요.

```bash
# 가상환경 안에서 패키지 설치 확인
pip install requests
python -c "import requests; print(requests.__version__)"
```

### 예상 출력

```text
2.32.3
```

```bash
# 가상환경 비활성화
deactivate
```

### 실무 팁

- 프로젝트마다 별도의 가상환경을 만드는 것이 좋아요. 의존성이 섞이면 "내 컴퓨터에서는 되는데..."라는 문제가 생겨요.
- `requirements.txt`로 의존성을 관리하세요: `pip freeze > requirements.txt`
- 가상환경 폴더(`myenv/`)는 `.gitignore`에 추가하세요. Git에 올리면 안 돼요.

---

## 3. Go 설치

Go는 CLI 도구, 시스템 유틸리티, 높은 성능이 필요한 스크립트를 만들 때 사용해요. Kubernetes, Docker, Terraform 등 DevOps 핵심 도구들이 Go로 만들어져 있어서, Go를 알면 이 도구들의 소스 코드도 읽을 수 있어요.

### Linux

```bash
# 최신 버전 다운로드 (버전 번호는 https://go.dev/dl/ 에서 확인)
wget https://go.dev/dl/go1.22.5.linux-amd64.tar.gz

# 기존 Go 제거 후 설치
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.22.5.linux-amd64.tar.gz

# PATH에 Go 추가
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export PATH=$PATH:$(go env GOPATH)/bin' >> ~/.bashrc
source ~/.bashrc
```

### Mac

```bash
brew install go
```

### Windows

1. https://go.dev/dl/ 에서 Windows MSI 설치 파일 다운로드
2. 설치 마법사를 따라 설치 (기본 경로: `C:\Program Files\Go`)
3. 설치 후 새 터미널을 열어야 PATH가 적용돼요

### 설치 확인

```bash
go version
```

### 예상 출력

```text
go version go1.22.5 linux/amd64
```

### GOPATH 확인

```bash
go env GOPATH
```

### 예상 출력

```text
/home/user/go
```

### GOPATH가 설정되지 않은 경우

```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
```

```bash
source ~/.bashrc
```

### 간단한 테스트

```bash
mkdir -p ~/go-test && cd ~/go-test
```

`main.go` 파일을 생성하세요.

```go
package main

import "fmt"

func main() {
    fmt.Println("Go 설치 완료!")
}
```

```bash
go run main.go
```

### 예상 출력

```text
Go 설치 완료!
```

### 실무 팁

- `go install`로 설치한 바이너리는 `$GOPATH/bin`에 저장돼요. 이 경로가 PATH에 포함되어 있어야 해요.
- Go 모듈 시스템을 사용하려면 `go mod init`으로 프로젝트를 초기화하세요.

---

## 4. jq 설치 (JSON 처리)

jq는 커맨드라인에서 JSON 데이터를 파싱하고 필터링하는 도구예요. API 응답 처리, 설정 파일 수정 등 DevOps 실무에서 정말 자주 써요.

### Linux (Ubuntu/Debian)

```bash
sudo apt install -y jq
```

### Mac

```bash
brew install jq
```

### Windows

```powershell
# Chocolatey 사용
choco install jq

# 또는 Scoop 사용
scoop install jq
```

### 설치 확인

```bash
jq --version
```

### 예상 출력

```text
jq-1.7.1
```

### 간단한 사용 예시

```bash
# JSON 문자열 파싱
echo '{"name": "devops", "level": 1}' | jq '.name'
```

### 예상 출력

```text
"devops"
```

```bash
# API 응답에서 특정 필드 추출
echo '[{"id":1,"name":"서버A"},{"id":2,"name":"서버B"}]' | jq '.[].name'
```

### 예상 출력

```text
"서버A"
"서버B"
```

### 실무 팁

- `curl`과 조합하면 API 응답을 바로 가공할 수 있어요: `curl -s https://api.example.com/data | jq '.results[]'`
- `-r` 옵션을 쓰면 따옴표 없이 출력돼요: `echo '{"name":"devops"}' | jq -r '.name'` 결과는 `devops`

---

## 5. yq 설치 (YAML 처리, Optional)

yq는 YAML 파일을 커맨드라인에서 파싱하고 수정하는 도구예요. Kubernetes manifest, Docker Compose, Ansible 등 YAML을 많이 다루는 DevOps 환경에서 유용해요.

### Linux

```bash
# snap 사용
sudo snap install yq

# 또는 바이너리 직접 다운로드
wget https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 -O /usr/local/bin/yq
chmod +x /usr/local/bin/yq
```

### Mac

```bash
brew install yq
```

### 설치 확인

```bash
yq --version
```

### 예상 출력

```text
yq (https://github.com/mikefarah/yq/) version v4.44.2
```

### 간단한 사용 예시

```bash
echo "name: devops
level: 1
tools:
  - docker
  - kubernetes" | yq '.tools[]'
```

### 예상 출력

```text
docker
kubernetes
```

### 주의

- yq는 여러 버전이 있어요. **mikefarah/yq**를 설치하세요. `kislyuk/yq`라는 Python 기반 버전도 있는데, 문법이 달라요.
- `pip install yq`로 설치하면 kislyuk 버전이 설치돼요. 혼동하지 마세요.

---

## 6. VS Code + 확장 프로그램

VS Code는 세 언어 모두 지원하는 편집기예요. 확장 프로그램을 설치하면 코드 자동 완성, 문법 검사, 디버깅까지 할 수 있어요.

### VS Code 설치

- 다운로드: https://code.visualstudio.com/

### 필수 확장 프로그램

VS Code를 열고, 왼쪽 사이드바의 확장(Extensions) 아이콘을 클릭하거나 `Ctrl+Shift+X`를 누르세요.

| 확장 프로그램 | 검색어 | 용도 |
|-------------|--------|------|
| **Python** | `ms-python.python` | Python 코드 자동 완성, 디버깅, 린트 |
| **Go** | `golang.go` | Go 코드 자동 완성, 디버깅, 테스트 |
| **ShellCheck** | `timonwong.shellcheck` | Bash 스크립트 문법 검사 |
| **YAML** | `redhat.vscode-yaml` | YAML 문법 검사, 자동 완성 |

### 커맨드라인에서 설치

```bash
code --install-extension ms-python.python
code --install-extension golang.go
code --install-extension timonwong.shellcheck
code --install-extension redhat.vscode-yaml
```

### 실무 팁

- VS Code의 **Remote - WSL** 확장을 설치하면, WSL2 안의 파일을 VS Code에서 직접 편집할 수 있어요. Windows 사용자에게 강력 추천해요.
- Go 확장을 처음 설치하면 "Install All"이 뜨는데, 전부 설치하세요. `gopls`, `dlv` 등 개발 도구가 포함돼요.

---

## 7. ShellCheck 설치 (Bash 문법 검사)

ShellCheck은 Bash 스크립트의 문법 오류, 잠재적 버그, 스타일 문제를 잡아주는 도구예요. VS Code 확장과 함께 사용하면 실시간으로 검사해 줘요.

### Linux (Ubuntu/Debian)

```bash
sudo apt install -y shellcheck
```

### Mac

```bash
brew install shellcheck
```

### 설치 확인

```bash
shellcheck --version
```

### 예상 출력

```text
ShellCheck - shell script analysis tool
version: 0.9.0
license: GNU General Public License, version 3
website: https://www.shellcheck.net
```

### 사용 예시

아래 내용으로 `test.sh` 파일을 만드세요.

```bash
#!/bin/bash
echo $greeting
name = "devops"
```

```bash
shellcheck test.sh
```

### 예상 출력

```text
In test.sh line 2:
echo $greeting
     ^--------^ SC2154 (warning): greeting is referenced but not assigned.
     ^--------^ SC2086 (info): Double quote to prevent globbing and word splitting.

Did you mean:
echo "$greeting"

In test.sh line 3:
name = "devops"
     ^-- SC1068 (error): Don't put spaces around the = in assignments (or
                  use '= ' if you mean comparison).
```

### 실무 팁

- ShellCheck은 스크립트를 커밋하기 전에 반드시 돌리세요. CI/CD 파이프라인에 통합하면 더 좋아요.
- 온라인 버전도 있어요: https://www.shellcheck.net/ (브라우저에서 바로 검사 가능)
- 특정 경고를 무시하려면 스크립트에 `# shellcheck disable=SC2086` 주석을 추가하세요.

---

## 최종 환경 확인 체크리스트

모든 설치가 완료되었는지 아래 명령어를 한 번에 실행해서 확인하세요.

```bash
echo "=== Bash ==="
bash --version | head -1

echo ""
echo "=== Python ==="
python3 --version
pip3 --version | head -1

echo ""
echo "=== Go ==="
go version

echo ""
echo "=== jq ==="
jq --version

echo ""
echo "=== ShellCheck ==="
shellcheck --version | head -3

echo ""
echo "=== yq (optional) ==="
yq --version 2>/dev/null || echo "yq 미설치 (optional이므로 괜찮아요)"
```

### 예상 출력

```text
=== Bash ===
GNU bash, version 5.2.21(1)-release (x86_64-pc-linux-gnu)

=== Python ===
Python 3.12.4
pip 24.0 from /usr/lib/python3/dist-packages/pip (python 3.12)

=== Go ===
go version go1.22.5 linux/amd64

=== jq ===
jq-1.7.1

=== ShellCheck ===
ShellCheck - shell script analysis tool
version: 0.9.0
license: GNU General Public License, version 3

=== yq (optional) ===
yq (https://github.com/mikefarah/yq/) version v4.44.2
```

### 주의

- 버전 번호는 설치 시점에 따라 다를 수 있어요. 명령어가 정상 실행되면 괜찮아요.
- Windows 사용자는 WSL2 터미널 안에서 위 명령어를 실행하세요.
- Python은 `python3` 또는 `python` 중 본인 환경에 맞는 명령어를 사용하세요.

---

## 문제 해결

### Python: "command not found"

```bash
# Python이 다른 이름으로 설치된 경우
which python3 || which python

# PATH에 없는 경우 (Linux)
sudo apt install -y python3

# Mac에서 brew로 설치한 경우
brew link python3
```

### Go: "go: command not found"

```bash
# PATH 확인
echo $PATH | tr ':' '\n' | grep go

# PATH에 Go가 없으면 추가
export PATH=$PATH:/usr/local/go/bin
source ~/.bashrc
```

### ShellCheck: "shellcheck: command not found"

```bash
# 패키지 목록 업데이트 후 재시도
sudo apt update && sudo apt install -y shellcheck

# snap으로 설치 (대안)
sudo snap install shellcheck
```

### WSL2: "wsl --install" 실패

```powershell
# Windows 기능 수동 활성화 (관리자 PowerShell)
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 재부팅 후 다시 시도
wsl --install
```

---

## 다음 단계

환경 준비가 완료되었다면, [Bash 스크립팅](./01-bash)부터 학습을 시작하세요. Bash로 기본적인 자동화 스크립트를 만드는 것부터 시작해요.
