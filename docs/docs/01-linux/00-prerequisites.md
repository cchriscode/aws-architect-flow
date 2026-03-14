# 리눅스 학습 환경 준비

이 문서는 **리눅스를 처음 접하는 사람이 학습을 시작하기 전에** 환경을 준비하는 방법을 설명한다.
운영체제별로 리눅스 환경을 만드는 방법, 필수 도구 설치, 터미널 기본 사용법을 다룬다.

강의를 시작하기 전에 이 문서의 모든 단계를 완료하고, 마지막 확인 명령어가 정상 출력되는지 반드시 확인한다.

---

# 1. 운영체제별 리눅스 환경 만들기

리눅스 명령어를 실습하려면 리눅스 환경이 필요하다.
사용 중인 운영체제에 따라 아래 중 하나를 선택한다.

---

## 1.1 Windows: WSL2 설치

WSL2(Windows Subsystem for Linux 2)는 Windows 안에서 리눅스를 실행하는 가장 간편한 방법이다.
별도 가상머신 없이 Windows에서 바로 리눅스 터미널을 쓸 수 있다.

### 시스템 요구사항

* Windows 10 버전 2004 이상 또는 Windows 11
* 64비트 운영체제
* BIOS에서 가상화(Virtualization) 활성화 필요 (대부분 기본 활성화)

### 설치 절차

**1단계: PowerShell을 관리자 권한으로 실행한다.**

시작 메뉴에서 `PowerShell` 을 검색하고, "관리자 권한으로 실행"을 클릭한다.

**2단계: WSL 설치 명령을 실행한다.**

```powershell
wsl --install
```

### 예상 출력

```text
Installing: Virtual Machine Platform
Installing: Windows Subsystem for Linux
Installing: Ubuntu
The requested operation is successful. Changes will not be effective until the system is rebooted.
```

**3단계: 컴퓨터를 재부팅한다.**

재부팅 후 자동으로 Ubuntu 설치 창이 나타난다.

**4단계: 리눅스 사용자 이름과 비밀번호를 설정한다.**

```text
Enter new UNIX username: myuser
New password:
Retype new password:
passwd: password updated successfully
```

### 주의

* 비밀번호 입력 시 화면에 아무것도 표시되지 않는다. 이것은 정상이다. 그냥 입력하고 Enter를 누른다.
* 사용자 이름은 영소문자로만 만드는 것이 좋다. 공백이나 한글은 피한다.

**5단계: 설치된 WSL 버전을 확인한다.**

PowerShell에서 실행한다:

```powershell
wsl --list --verbose
```

### 예상 출력

```text
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

VERSION이 `2`로 표시되면 WSL2가 정상 설치된 것이다.

**6단계: Ubuntu 터미널에 진입한다.**

시작 메뉴에서 `Ubuntu`를 검색해서 실행하거나, PowerShell에서 아래 명령을 입력한다:

```powershell
wsl
```

### 예상 출력

```text
myuser@DESKTOP-XXXXXX:~$
```

이 프롬프트가 나오면 리눅스 환경에 진입한 것이다.

### 실무 팁

Windows Terminal 앱을 설치하면 여러 탭에서 PowerShell과 Ubuntu를 동시에 열 수 있어 편하다.
Microsoft Store에서 "Windows Terminal"을 검색해 설치한다.

---

## 1.2 Mac: 기본 터미널 사용

macOS는 Unix 기반이므로 대부분의 리눅스 명령어가 기본 터미널에서 동작한다.
별도 설치 없이 바로 실습할 수 있다.

### 터미널 열기

* `Cmd + Space`를 눌러 Spotlight 검색을 연다.
* `Terminal`을 입력하고 Enter를 누른다.

### Homebrew 설치

Homebrew는 macOS용 패키지 관리자이다. 리눅스의 `apt`와 비슷한 역할을 한다.
이후 도구 설치에 필요하므로 먼저 설치한다.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 예상 출력 (마지막 부분)

```text
==> Installation successful!

==> Homebrew has enabled anonymous aggregate formulae and cask analytics.
==> Next steps:
- Run `brew help` to get started
```

설치 확인:

```bash
brew --version
```

### 예상 출력

```text
Homebrew 4.x.x
```

### 주의

* Homebrew 설치 시 Xcode Command Line Tools 설치를 묻는 경우가 있다. "Install"을 눌러 설치한다.
* Apple Silicon(M1/M2/M3) Mac에서는 설치 후 PATH 설정이 필요할 수 있다. 설치 완료 메시지에 나오는 안내를 따른다.

---

## 1.3 Linux: 기본 제공

Ubuntu, CentOS, Fedora 등 리눅스를 이미 사용 중이라면 별도 설치가 필요 없다.
터미널을 열면 바로 실습할 수 있다.

* Ubuntu: `Ctrl + Alt + T`로 터미널을 연다.
* 터미널이 바로 열리면 준비 완료이다.

---

## 1.4 가상머신(VirtualBox + Ubuntu) 설치 (대안)

WSL2를 쓸 수 없거나, 완전한 리눅스 환경이 필요한 경우 가상머신을 사용한다.

### 설치 순서

1. **VirtualBox 다운로드**: https://www.virtualbox.org 에서 운영체제에 맞는 버전을 받는다.
2. **Ubuntu ISO 다운로드**: https://ubuntu.com/download/desktop 에서 최신 LTS 버전을 받는다.
3. **VirtualBox에서 새 가상머신을 만든다**:
   * 이름: `Ubuntu-Lab`
   * 메모리: 최소 2GB (권장 4GB)
   * 디스크: 최소 20GB
4. **ISO 파일을 연결하고 부팅한다.**
5. **Ubuntu 설치 마법사를 따라 설치한다.**

### 실무 팁

학습 목적이라면 WSL2가 훨씬 가볍고 빠르다. VirtualBox는 네트워크 설정 실습이나 완전한 서버 환경이 필요할 때 사용한다.

---

# 2. 패키지 업데이트

리눅스 환경이 준비되면 가장 먼저 패키지 목록을 최신화하고 설치된 패키지를 업데이트한다.
이후 모든 설치 작업의 기본이 되는 단계이다.

```bash
sudo apt update && sudo apt upgrade -y
```

### 예상 출력 (일부)

```text
Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease
Get:2 http://archive.ubuntu.com/ubuntu jammy-updates InRelease [119 kB]
Reading package lists... Done
Building dependency tree... Done
Calculating upgrade... Done
The following packages will be upgraded:
  base-files libc6 ...
X upgraded, 0 newly installed, 0 to remove and 0 not upgraded.
```

### 설명

* `apt update`: 설치 가능한 패키지 목록을 최신으로 갱신한다.
* `apt upgrade -y`: 설치된 패키지를 최신 버전으로 업데이트한다. `-y`는 확인 질문에 자동으로 "Yes"를 선택한다.

### 주의

* `sudo`는 관리자 권한으로 실행한다는 뜻이다. 비밀번호를 물어볼 수 있다.
* 처음 실행 시 다운로드할 양이 많아 몇 분 걸릴 수 있다.

---

# 3. 기본 편집기 설치

터미널에서 파일을 편집할 일이 많다. 기본 편집기 두 가지를 설치한다.

## 3.1 nano 설치 확인

nano는 가장 쉬운 터미널 편집기이다. 입문자에게 추천한다.

```bash
nano --version
```

### 예상 출력

```text
 GNU nano, version 6.2
```

이미 설치되어 있으면 위처럼 버전이 나온다.
설치되어 있지 않으면 아래 명령으로 설치한다:

```bash
sudo apt install nano -y
```

### nano 기본 사용법

파일 열기:

```bash
nano test.txt
```

편집기가 열리면 바로 텍스트를 입력할 수 있다.

* **저장**: `Ctrl + O` (파일 이름 확인 후 Enter)
* **종료**: `Ctrl + X`
* **잘라내기**: `Ctrl + K`
* **붙여넣기**: `Ctrl + U`

### 실무 팁

nano의 단축키는 화면 하단에 항상 표시된다. `^O`는 `Ctrl + O`를 의미한다.

---

## 3.2 vim 설치 확인

vim은 리눅스에서 가장 널리 쓰이는 편집기이다. 서버에 기본 설치되어 있는 경우가 많다.

```bash
vim --version | head -n 1
```

### 예상 출력

```text
VIM - Vi IMproved 8.2 (2019 Dec 12, compiled ...)
```

설치되어 있지 않으면:

```bash
sudo apt install vim -y
```

### vim 기본 사용법 (최소한만)

```bash
vim test.txt
```

vim은 **모드**가 있다:

* **일반 모드**: 파일을 열면 이 모드이다. 텍스트 입력이 안 된다.
* **입력 모드**: `i`를 누르면 입력 모드로 전환된다. 텍스트를 쓸 수 있다.
* **일반 모드로 복귀**: `Esc` 키를 누른다.
* **저장 후 종료**: 일반 모드에서 `:wq` 입력 후 Enter
* **저장 안 하고 종료**: 일반 모드에서 `:q!` 입력 후 Enter

### 주의

vim에 처음 들어가면 아무 키도 안 먹는 것처럼 보일 수 있다. 반드시 `i`를 눌러 입력 모드로 전환해야 글을 쓸 수 있다. 종료가 안 되면 `Esc`를 누른 뒤 `:q!`를 입력한다.

---

# 4. 터미널 기본 사용법

터미널을 효율적으로 쓰려면 몇 가지 기본 조작법을 알아두는 것이 좋다.

## 4.1 복사 / 붙여넣기

터미널에서의 복사/붙여넣기는 일반 앱과 단축키가 다르다.

| 환경 | 복사 | 붙여넣기 |
|------|------|----------|
| WSL2 / Windows Terminal | `Ctrl + Shift + C` | `Ctrl + Shift + V` |
| Mac 터미널 | `Cmd + C` | `Cmd + V` |
| Linux (GNOME 터미널) | `Ctrl + Shift + C` | `Ctrl + Shift + V` |

### 주의

터미널에서 `Ctrl + C`는 복사가 아니라 **현재 실행 중인 명령을 중단**하는 기능이다. 복사하려면 반드시 `Ctrl + Shift + C`를 사용한다.

---

## 4.2 유용한 터미널 단축키

```text
Ctrl + C      현재 실행 중인 명령 중단
Ctrl + L      화면 지우기 (clear와 동일)
Ctrl + A      커서를 줄 맨 앞으로 이동
Ctrl + E      커서를 줄 맨 뒤로 이동
Ctrl + R      이전 명령어 검색
Tab           자동 완성 (파일 이름, 명령어)
위/아래 화살표  이전/다음 명령어 탐색
```

### 실무 팁

`Tab` 자동 완성은 매우 자주 쓴다. 파일 이름이나 명령어를 일부만 입력하고 `Tab`을 누르면 자동으로 완성된다.
두 번 누르면 가능한 후보 목록이 나온다.

---

## 4.3 명령어 히스토리

이전에 입력한 명령어를 다시 보려면:

```bash
history
```

### 예상 출력

```text
    1  sudo apt update
    2  sudo apt upgrade -y
    3  nano --version
    4  vim --version
    5  history
```

특정 명령어를 다시 실행하려면:

```bash
!3
```

이렇게 하면 3번 명령(`nano --version`)이 다시 실행된다.

---

# 5. SSH 클라이언트 확인

이후 강의에서 원격 서버에 접속할 때 SSH를 사용한다.
SSH 클라이언트가 설치되어 있는지 확인한다.

```bash
ssh -V
```

### 예상 출력

```text
OpenSSH_8.9p1 Ubuntu-3ubuntu0.6, OpenSSL 3.0.2 15 Mar 2022
```

버전 번호가 출력되면 SSH 클라이언트가 설치된 것이다.

### 설치되어 있지 않은 경우

```bash
sudo apt install openssh-client -y
```

### 실무 팁

Windows에서 WSL2를 사용한다면 WSL2 안에 SSH가 기본 포함되어 있다.
Mac에서도 SSH는 기본 설치되어 있으므로 별도 작업이 필요 없다.

---

# 6. 환경 준비 최종 확인

모든 설정이 끝났으면 아래 명령어를 하나씩 실행해서 결과를 확인한다.

## 6.1 운영체제 정보 확인

```bash
uname -a
```

### 예상 출력

```text
Linux DESKTOP-XXXXXX 5.15.153.1-microsoft-standard-WSL2 #1 SMP x86_64 GNU/Linux
```

Linux 커널 정보가 나오면 정상이다.

---

## 6.2 현재 사용자 확인

```bash
whoami
```

### 예상 출력

```text
myuser
```

WSL 설치 시 만든 사용자 이름이 나온다.

---

## 6.3 현재 셸 확인

```bash
echo $SHELL
```

### 예상 출력

```text
/bin/bash
```

`/bin/bash` 또는 `/bin/zsh`가 나오면 정상이다.

---

## 6.4 패키지 관리자 동작 확인

```bash
apt --version
```

### 예상 출력

```text
apt 2.4.11 (amd64)
```

---

## 6.5 편집기 동작 확인

```bash
nano --version | head -n 1
vim --version | head -n 1
```

### 예상 출력

```text
 GNU nano, version 6.2
VIM - Vi IMproved 8.2 (2019 Dec 12, compiled ...)
```

---

## 6.6 SSH 클라이언트 확인

```bash
ssh -V
```

### 예상 출력

```text
OpenSSH_8.9p1 Ubuntu-3ubuntu0.6, OpenSSL 3.0.2 15 Mar 2022
```

---

# 7. 한 번에 확인하기

위 항목을 한 번에 확인하는 명령어 모음이다.

```bash
echo "=== OS ===" && uname -a && echo "" && \
echo "=== User ===" && whoami && echo "" && \
echo "=== Shell ===" && echo $SHELL && echo "" && \
echo "=== apt ===" && apt --version && echo "" && \
echo "=== nano ===" && nano --version | head -n 1 && echo "" && \
echo "=== vim ===" && vim --version | head -n 1 && echo "" && \
echo "=== SSH ===" && ssh -V
```

### 예상 출력

```text
=== OS ===
Linux DESKTOP-XXXXXX 5.15.153.1-microsoft-standard-WSL2 #1 SMP x86_64 GNU/Linux

=== User ===
myuser

=== Shell ===
/bin/bash

=== apt ===
apt 2.4.11 (amd64)

=== nano ===
 GNU nano, version 6.2

=== vim ===
VIM - Vi IMproved 8.2 (2019 Dec 12, compiled ...)

=== SSH ===
OpenSSH_8.9p1 Ubuntu-3ubuntu0.6, OpenSSL 3.0.2 15 Mar 2022
```

모든 항목이 정상 출력되면 리눅스 학습 환경 준비가 완료된 것이다.

---

# 8. 자주 발생하는 문제와 해결

## 8.1 WSL 설치 시 "가상화가 비활성화되어 있습니다"

BIOS에서 가상화 기능을 활성화해야 한다.

1. 컴퓨터를 재부팅한다.
2. 부팅 시 BIOS 진입 키를 누른다 (보통 `F2`, `F10`, `Del` 중 하나).
3. `Virtualization Technology` 또는 `VT-x` 항목을 `Enabled`로 변경한다.
4. 저장 후 재부팅한다.

---

## 8.2 `sudo apt update` 실행 시 "Could not resolve" 오류

DNS 설정 문제이다.

```bash
sudo nano /etc/resolv.conf
```

아래 내용을 추가하거나 수정한다:

```text
nameserver 8.8.8.8
nameserver 8.8.4.4
```

저장 후 다시 시도한다:

```bash
sudo apt update
```

---

## 8.3 WSL에서 `sudo` 비밀번호를 잊어버린 경우

PowerShell에서 아래 명령으로 root로 접속할 수 있다:

```powershell
wsl -u root
```

그다음 비밀번호를 재설정한다:

```bash
passwd myuser
```

### 예상 출력

```text
New password:
Retype new password:
passwd: password updated successfully
```

---

## 8.4 Mac에서 `brew` 명령을 찾을 수 없다고 나오는 경우

Apple Silicon Mac에서는 Homebrew 설치 후 PATH 설정이 필요하다.

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

설정 후 확인:

```bash
brew --version
```

---

# 9. 다음 단계

환경 준비가 완료되면 다음 문서인 리눅스 명령어 가이드로 넘어간다.
해당 문서에서 파일 관리, 검색, 프로세스 관리 등 실무에서 필요한 명령어를 학습한다.

---
