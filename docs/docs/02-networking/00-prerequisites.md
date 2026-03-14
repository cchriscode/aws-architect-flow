# 네트워킹 학습 환경 준비

이 문서는 **네트워킹 강의를 시작하기 전에** 필요한 도구를 설치하고 환경을 준비하는 방법을 설명한다.
네트워크 분석, DNS 조회, 패킷 캡처 등 실습에 필요한 도구를 하나씩 설치하고 동작을 확인한다.

강의를 시작하기 전에 이 문서의 모든 단계를 완료하고, 마지막 확인 명령어가 정상 출력되는지 반드시 확인한다.

---

# 1. 사전 준비: 리눅스 환경

네트워킹 실습은 리눅스 환경에서 진행한다.
아직 리눅스 환경이 준비되지 않았다면 먼저 **01-linux/00-prerequisites.md** 문서를 참고하여 환경을 만든다.

아래 명령으로 리눅스 환경이 정상인지 확인한다:

```bash
uname -a
```

### 예상 출력

```text
Linux DESKTOP-XXXXXX 5.15.153.1-microsoft-standard-WSL2 #1 SMP x86_64 GNU/Linux
```

Linux 커널 정보가 나오면 준비된 것이다.

패키지 목록도 먼저 최신화한다:

```bash
sudo apt update
```

---

# 2. curl 설치 확인

curl은 HTTP 요청을 보내고 응답을 확인하는 도구이다.
웹 서비스가 정상 동작하는지 확인하거나, API를 호출할 때 사용한다.

```bash
curl --version
```

### 예상 출력

```text
curl 7.81.0 (x86_64-pc-linux-gnu) libcurl/7.81.0 OpenSSL/3.0.2
Release-Date: 2022-01-05
Protocols: dict file ftp ftps gopher gophers http https imap imaps ...
```

버전 정보가 나오면 이미 설치되어 있다.

### 설치되어 있지 않은 경우

```bash
sudo apt install curl -y
```

### 동작 확인

```bash
curl -I https://google.com
```

### 예상 출력

```text
HTTP/2 301
location: https://www.google.com/
content-type: text/html; charset=UTF-8
```

HTTP 응답 헤더가 나오면 정상이다.

### 설명

* `curl -I`는 응답 헤더만 가져온다.
* `301`은 리다이렉트 응답이다. google.com이 www.google.com으로 이동시키는 것이다.

---

# 3. DNS 조회 도구 설치 (dig / nslookup)

dig와 nslookup은 도메인 이름이 어떤 IP 주소로 변환되는지 확인하는 도구이다.
DNS 문제를 진단할 때 반드시 필요하다.

```bash
dig -v
```

### 예상 출력

```text
DiG 9.18.18-0ubuntu0.22.04.2-Ubuntu
```

### 설치되어 있지 않은 경우

```bash
sudo apt install dnsutils -y
```

### 설명

`dnsutils` 패키지에는 `dig`와 `nslookup`이 모두 포함되어 있다.

### 동작 확인: dig

```bash
dig google.com
```

### 예상 출력 (핵심 부분)

```text
;; QUESTION SECTION:
;google.com.                    IN      A

;; ANSWER SECTION:
google.com.             300     IN      A       142.250.196.14

;; Query time: 24 msec
;; SERVER: 8.8.8.8#53(8.8.8.8) (UDP)
```

### 설명

* `ANSWER SECTION`에 IP 주소가 나온다.
* `Query time`은 DNS 조회에 걸린 시간이다.
* `SERVER`는 질의한 DNS 서버이다.

### 동작 확인: nslookup

```bash
nslookup google.com
```

### 예상 출력

```text
Server:         8.8.8.8
Address:        8.8.8.8#53

Non-authoritative answer:
Name:   google.com
Address: 142.250.196.14
```

### 실무 팁

dig는 nslookup보다 더 상세한 정보를 보여준다. 실무에서는 dig를 더 자주 사용한다.

---

# 4. Wireshark 설치

Wireshark는 네트워크 패킷을 캡처하고 분석하는 GUI 도구이다.
HTTP 요청, TCP 핸드셰이크, DNS 조회 과정을 눈으로 직접 볼 수 있다.

## 4.1 Windows 설치

1. https://www.wireshark.org/download.html 에서 Windows Installer를 다운로드한다.
2. 설치 마법사를 실행하고 기본 옵션으로 진행한다.
3. "Install Npcap" 체크박스가 나오면 반드시 체크한다 (패킷 캡처에 필요).
4. 설치 완료 후 Wireshark를 실행한다.

## 4.2 Mac 설치

```bash
brew install --cask wireshark
```

### 예상 출력 (마지막 부분)

```text
==> Installing Cask wireshark
==> Moving App 'Wireshark.app' to '/Applications/Wireshark.app'
wireshark was successfully installed!
```

## 4.3 Linux 설치

```bash
sudo apt install wireshark -y
```

설치 중 "Should non-superusers be able to capture packets?" 질문이 나오면 `Yes`를 선택한다.

설치 후 현재 사용자를 wireshark 그룹에 추가한다:

```bash
sudo usermod -aG wireshark $USER
```

### 주의

그룹 변경 후 재로그인(또는 재부팅)해야 반영된다.

### 동작 확인

```bash
wireshark --version
```

### 예상 출력

```text
Wireshark 3.6.2 (Git v3.6.2 packaged as 3.6.2-2)
```

### 실무 팁

WSL2 환경에서는 Wireshark를 Windows 쪽에 설치하는 것이 편하다. GUI 앱이므로 Windows에서 직접 실행하고, 캡처한 결과를 분석한다.

---

# 5. tcpdump 설치

tcpdump는 터미널에서 패킷을 캡처하는 도구이다.
GUI 없이 서버에서 직접 네트워크 트래픽을 확인할 때 사용한다.

```bash
tcpdump --version
```

### 예상 출력

```text
tcpdump version 4.99.1
libpcap version 1.10.1 (with TPACKET_V3)
```

### 설치되어 있지 않은 경우

```bash
sudo apt install tcpdump -y
```

### 동작 확인

```bash
sudo tcpdump -c 5 -i any
```

### 예상 출력

```text
tcpdump: data link type LINUX_SLL2
tcpdump: verbose output suppressed, use -v[v]... for full protocol decode
listening on any, link-type LINUX_SLL2 (Linux cooked v2), snapshot length 262144 bytes
10:30:01.123456 IP 10.0.0.5.22 > 10.0.0.1.54321: Flags [P.], seq 1:100, ...
10:30:01.123789 IP 10.0.0.1.54321 > 10.0.0.5.22: Flags [.], ack 100, ...
...
5 packets captured
5 packets received by filter
0 packets dropped by kernel
```

### 설명

* `-c 5`: 5개 패킷만 캡처하고 종료한다.
* `-i any`: 모든 네트워크 인터페이스를 대상으로 캡처한다.
* `sudo`가 필요하다. 패킷 캡처는 관리자 권한이 필요하다.

---

# 6. ping 확인

ping은 대상 서버가 네트워크에서 응답하는지 확인하는 가장 기본적인 도구이다.

```bash
ping -c 4 google.com
```

### 예상 출력

```text
PING google.com (142.250.196.14) 56(84) bytes of data.
64 bytes from 142.250.196.14: icmp_seq=1 ttl=117 time=24.1 ms
64 bytes from 142.250.196.14: icmp_seq=2 ttl=117 time=23.8 ms
64 bytes from 142.250.196.14: icmp_seq=3 ttl=117 time=24.0 ms
64 bytes from 142.250.196.14: icmp_seq=4 ttl=117 time=23.7 ms

--- google.com ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3004ms
rtt min/avg/max/mdev = 23.700/23.900/24.100/0.141 ms
```

### 설명

* `-c 4`: 4번만 보내고 멈춘다. 이 옵션이 없으면 `Ctrl + C`로 직접 중단해야 한다.
* `time`: 왕복 시간(RTT)이다. 숫자가 작을수록 빠른 것이다.
* `0% packet loss`: 패킷 손실이 없다는 뜻이다.

### 주의

ping이 설치되어 있지 않은 경우:

```bash
sudo apt install iputils-ping -y
```

---

# 7. traceroute 설치

traceroute는 목적지까지 패킷이 어떤 경로(라우터)를 거쳐 가는지 보여준다.
네트워크 경로 문제를 진단할 때 사용한다.

```bash
traceroute --version
```

### 설치되어 있지 않은 경우

```bash
sudo apt install traceroute -y
```

### 동작 확인

```bash
traceroute -m 10 google.com
```

### 예상 출력

```text
traceroute to google.com (142.250.196.14), 10 hops max, 60 byte packets
 1  gateway (10.0.0.1)  1.234 ms  1.100 ms  1.050 ms
 2  isp-router (203.0.113.1)  5.432 ms  5.321 ms  5.210 ms
 3  * * *
 4  edge-router (72.14.215.85)  15.678 ms  15.543 ms  15.421 ms
 5  lax17s55-in-f14.1e100.net (142.250.196.14)  24.100 ms  24.050 ms  23.980 ms
```

### 설명

* 각 줄은 패킷이 거치는 라우터(hop)이다.
* `* * *`는 해당 라우터가 응답하지 않는 것이다 (보안 설정으로 막은 경우가 많다).
* `-m 10`: 최대 10개 hop까지만 추적한다.

---

# 8. netcat(nc) 설치

netcat은 네트워크 연결을 테스트하는 간단한 도구이다.
특정 포트가 열려 있는지 확인하거나, 간단한 TCP 연결을 만들 때 사용한다.

```bash
nc -h
```

### 설치되어 있지 않은 경우

```bash
sudo apt install netcat-openbsd -y
```

### 동작 확인: 포트 열림 테스트

```bash
nc -zv google.com 443
```

### 예상 출력

```text
Connection to google.com (142.250.196.14) 443 port [tcp/https] succeeded!
```

### 설명

* `-z`: 데이터를 보내지 않고 연결만 확인한다.
* `-v`: 자세한 출력을 보여준다.
* `443`: HTTPS 포트이다.
* `succeeded!`가 나오면 해당 포트가 열려 있다는 뜻이다.

### 포트가 닫혀 있는 경우의 출력

```bash
nc -zv -w 3 google.com 12345
```

### 예상 출력

```text
nc: connect to google.com (142.250.196.14) port 12345 (tcp) timed out: Operation now in progress
```

### 설명

* `-w 3`: 3초 타임아웃을 설정한다. 이 옵션이 없으면 오래 기다릴 수 있다.

---

# 9. nmap 설치 (선택 사항)

nmap은 네트워크 스캐닝 도구이다. 대상 서버에 어떤 포트가 열려 있는지 스캔할 수 있다.
학습 초반에는 필수가 아니지만, 네트워크 보안을 공부할 때 유용하다.

```bash
sudo apt install nmap -y
```

### 동작 확인

```bash
nmap --version
```

### 예상 출력

```text
Nmap version 7.80 ( https://nmap.org )
Platform: x86_64-pc-linux-gnu
```

### 사용 예시

```bash
nmap -p 80,443 google.com
```

### 예상 출력

```text
Starting Nmap 7.80 ( https://nmap.org ) at 2026-03-14 10:30 KST
Nmap scan report for google.com (142.250.196.14)
Host is up (0.024s latency).

PORT    STATE SERVICE
80/tcp  open  http
443/tcp open  https

Nmap done: 1 IP address (1 host up) scanned in 0.12 seconds
```

### 설명

* `-p 80,443`: 80번과 443번 포트만 검사한다.
* `open`: 해당 포트가 열려 있다.

### 주의

nmap을 허가 없이 외부 서버에 대량으로 사용하면 보안 정책 위반이 될 수 있다. 학습 시에는 자신의 서버나 잘 알려진 공개 서비스에만 사용한다.

---

# 10. 브라우저 개발자 도구 (Network 탭)

네트워크를 배울 때 브라우저의 개발자 도구도 매우 유용하다.
HTTP 요청/응답, 헤더, 상태 코드, 로딩 시간 등을 시각적으로 확인할 수 있다.

### 여는 방법

| 브라우저 | 단축키 |
|----------|--------|
| Chrome | `F12` 또는 `Ctrl + Shift + I` (Mac: `Cmd + Option + I`) |
| Firefox | `F12` 또는 `Ctrl + Shift + I` |
| Edge | `F12` 또는 `Ctrl + Shift + I` |

### 사용 방법

1. 브라우저에서 아무 웹사이트를 연다.
2. 개발자 도구를 연다 (`F12`).
3. 상단 탭에서 **Network** 를 클릭한다.
4. 페이지를 새로고침한다 (`F5` 또는 `Ctrl + R`).
5. 목록에 HTTP 요청들이 나타난다.

### 확인할 수 있는 정보

* **Name**: 요청한 리소스 이름 (페이지, 이미지, JS, CSS 등)
* **Status**: HTTP 상태 코드 (200, 301, 404, 500 등)
* **Type**: 리소스 종류 (document, script, image 등)
* **Size**: 응답 크기
* **Time**: 응답 시간

### 실무 팁

개별 요청을 클릭하면 **Headers** 탭에서 요청/응답 헤더를 볼 수 있다. 이후 강의에서 HTTP 프로토콜을 배울 때 이 기능을 자주 사용하게 된다.

---

# 11. ss (소켓 통계) 확인

ss는 현재 시스템의 네트워크 연결 상태와 열려 있는 포트를 확인하는 도구이다.
대부분의 리눅스 배포판에 기본 설치되어 있다.

```bash
ss -tulnp
```

### 예상 출력

```text
Netid State  Recv-Q Send-Q  Local Address:Port  Peer Address:Port Process
tcp   LISTEN 0      128     0.0.0.0:22          0.0.0.0:*
udp   UNCONN 0      0       127.0.0.53%lo:53    0.0.0.0:*
```

### 설명

* `-t`: TCP 연결을 보여준다.
* `-u`: UDP 연결을 보여준다.
* `-l`: LISTEN 상태(대기 중)인 것만 보여준다.
* `-n`: 호스트 이름 대신 숫자(IP)로 표시한다.
* `-p`: 어떤 프로세스가 사용하는지 보여준다.

### 주의

`-p` 옵션은 `sudo`가 필요할 수 있다. 프로세스 정보가 비어 있으면 `sudo ss -tulnp`로 다시 시도한다.

---

# 12. 환경 준비 최종 확인

모든 도구가 설치되었는지 아래 명령어를 실행하여 확인한다.

## 12.1 curl 확인

```bash
curl -I https://google.com
```

### 예상 출력 (첫 줄)

```text
HTTP/2 301
```

---

## 12.2 dig 확인

```bash
dig google.com +short
```

### 예상 출력

```text
142.250.196.14
```

IP 주소가 나오면 정상이다.

---

## 12.3 nslookup 확인

```bash
nslookup google.com
```

### 예상 출력 (일부)

```text
Name:   google.com
Address: 142.250.196.14
```

---

## 12.4 ss 확인

```bash
ss -tulnp
```

### 예상 출력

열려 있는 포트 목록이 나온다.

---

## 12.5 ping 확인

```bash
ping -c 2 google.com
```

### 예상 출력 (마지막 줄)

```text
2 packets transmitted, 2 received, 0% packet loss
```

---

## 12.6 traceroute 확인

```bash
traceroute -m 3 google.com
```

### 예상 출력

최소 1~3개의 hop 정보가 나온다.

---

## 12.7 netcat 확인

```bash
nc -zv google.com 443
```

### 예상 출력

```text
Connection to google.com (142.250.196.14) 443 port [tcp/https] succeeded!
```

---

## 12.8 tcpdump 확인

```bash
tcpdump --version
```

### 예상 출력

```text
tcpdump version 4.99.1
```

---

# 13. 한 번에 확인하기

아래 명령어를 실행하면 모든 도구의 설치 상태를 한 번에 볼 수 있다.

```bash
echo "=== curl ===" && curl --version | head -n 1 && echo "" && \
echo "=== dig ===" && dig -v 2>&1 | head -n 1 && echo "" && \
echo "=== nslookup ===" && nslookup -version 2>&1 | head -n 1 && echo "" && \
echo "=== ping ===" && ping -c 1 127.0.0.1 | head -n 1 && echo "" && \
echo "=== traceroute ===" && traceroute --version 2>&1 | head -n 1 && echo "" && \
echo "=== nc ===" && nc -h 2>&1 | head -n 1 && echo "" && \
echo "=== tcpdump ===" && tcpdump --version 2>&1 | head -n 1 && echo "" && \
echo "=== ss ===" && ss --version 2>&1 | head -n 1
```

### 예상 출력

```text
=== curl ===
curl 7.81.0 (x86_64-pc-linux-gnu) libcurl/7.81.0 OpenSSL/3.0.2

=== dig ===
DiG 9.18.18-0ubuntu0.22.04.2-Ubuntu

=== nslookup ===
nslookup 9.18.18-0ubuntu0.22.04.2-Ubuntu

=== ping ===
PING 127.0.0.1 (127.0.0.1) 56(84) bytes of data.

=== traceroute ===
Modern traceroute for Linux, version 2.1.0

=== nc ===
OpenBSD netcat (Debian pstrider-1.219-1)

=== tcpdump ===
tcpdump version 4.99.1

=== ss ===
ss utility, iproute2-5.15.0
```

모든 항목이 출력되면 네트워킹 학습 환경 준비가 완료된 것이다.

---

# 14. 자주 발생하는 문제와 해결

## 14.1 `dig: command not found`

`dnsutils` 패키지가 설치되지 않은 것이다.

```bash
sudo apt install dnsutils -y
```

---

## 14.2 `ping: permission denied`

WSL2 환경에서 발생할 수 있다. 아래 명령으로 권한을 설정한다:

```bash
sudo sysctl -w net.ipv4.ping_group_range="0 2147483647"
```

---

## 14.3 `tcpdump: permission denied`

tcpdump는 관리자 권한이 필요하다. 반드시 `sudo`를 붙여서 실행한다:

```bash
sudo tcpdump -c 5 -i any
```

---

## 14.4 `traceroute` 결과가 전부 `* * *`로 나오는 경우

방화벽이나 네트워크 설정에서 ICMP/UDP를 차단하고 있을 수 있다.
이것은 도구 문제가 아니라 네트워크 환경의 특성이다. 학습에는 지장이 없다.

---

# 15. 다음 단계

환경 준비가 완료되면 다음 문서인 OSI 모델, TCP/UDP 가이드로 넘어간다.
실습 도구가 모두 준비되었으므로 각 프로토콜을 직접 확인하면서 학습할 수 있다.

---
