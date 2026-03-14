# DevOps 엔지니어를 위한 리눅스 명령어 가이드

이 문서는 **리눅스를 처음 접하는 사람도 이해할 수 있도록** 만들었다.
단순히 명령어 이름만 나열하지 않고, 아래 순서로 설명한다.

1. **이 명령어가 왜 필요한지**
2. **실무에서 언제 쓰는지**
3. **실행 예시**
4. **예상 출력 결과**
5. **주의할 점**

또한 뒤쪽에는 DevOps 실무에서 자주 쓰는 **`grep + awk + sed + xargs` 조합**을 상세히 정리했다.

---

# 1. 리눅스 명령어를 보기 전에 알아둘 것

리눅스에서는 보통 **터미널**에서 명령어를 입력한다.
명령어는 보통 아래 구조로 되어 있다.

```bash
명령어 옵션 대상
```

예를 들어:

```bash
ls -al /var/log
```

뜻은 다음과 같다.

* `ls`: 목록 보기
* `-al`: 자세히, 숨김 파일 포함
* `/var/log`: 확인할 대상 폴더

즉, **"/var/log 폴더 안의 파일을 자세히 보여줘"** 라는 뜻이다.

---

# 2. 파일과 디렉토리 관리

서버에 접속하면 가장 먼저 하는 일은 **현재 위치를 확인하고, 파일과 폴더를 살펴보는 것**이다.

## 2.1 `pwd` — 현재 위치 확인

### 왜 필요한가

지금 내가 어느 디렉토리에서 작업 중인지 알기 위해 쓴다.

### 실무에서 언제 쓰나

* 서버에 SSH로 접속한 직후
* 스크립트를 실행하기 전 현재 경로 확인
* 파일이 안 보일 때 위치를 확인

### 예시

```bash
pwd
```

### 예상 출력

```text
/home/ubuntu
```

### 설명

현재 작업 디렉토리가 `/home/ubuntu` 라는 뜻이다.

### 주의

상대 경로로 작업할 때는 `pwd`를 자주 확인하는 습관이 중요하다.

---

## 2.2 `ls` — 파일 목록 보기

### 왜 필요한가

현재 폴더 안에 어떤 파일과 디렉토리가 있는지 확인한다.

### 자주 쓰는 옵션

* `ls`: 간단 목록
* `ls -l`: 자세한 정보
* `ls -a`: 숨김 파일 포함
* `ls -al`: 자세한 정보 + 숨김 파일 포함

### 예시

```bash
ls -al
```

### 예상 출력

```text
total 20
drwxr-xr-x 3 ubuntu ubuntu 4096 Mar 13 10:00 .
drwxr-xr-x 5 root   root   4096 Mar 13 09:50 ..
-rw-r--r-- 1 ubuntu ubuntu   32 Mar 13 09:58 app.log
-rw-r--r-- 1 ubuntu ubuntu  120 Mar 13 09:59 config.yaml
drwxr-xr-x 2 ubuntu ubuntu 4096 Mar 13 09:57 scripts
```

### 설명

* `d`로 시작하면 디렉토리
* `-`로 시작하면 일반 파일
* `rw-r--r--` 는 권한 정보
* 뒤쪽 날짜는 수정 시각

### 실무 팁

배포 직후 파일이 생성됐는지 확인할 때 `ls -al` 을 자주 쓴다.

---

## 2.3 `cd` — 디렉토리 이동

### 왜 필요한가

작업할 폴더로 이동할 때 사용한다.

### 예시

```bash
cd /var/log
```

### 예상 결과

출력은 보통 없다.
대신 현재 디렉토리가 `/var/log` 로 바뀐다.

이후 확인:

```bash
pwd
```

예상 출력:

```text
/var/log
```

### 자주 쓰는 형태

```bash
cd ..
cd ~
cd -
```

### 설명

* `cd ..` : 상위 디렉토리로 이동
* `cd ~` : 홈 디렉토리로 이동
* `cd -` : 직전 디렉토리로 복귀

### 실무 팁

`cd -` 는 두 폴더를 왔다 갔다 할 때 매우 편하다.

---

## 2.4 `mkdir` — 디렉토리 생성

### 왜 필요한가

로그 보관 폴더, 백업 폴더, 작업 디렉토리를 만들 때 사용한다.

### 예시

```bash
mkdir backup
```

### 예상 결과

보통 출력 없음.

이후 확인:

```bash
ls
```

예상 출력:

```text
backup  app.log  config.yaml  scripts
```

### 실무에서 자주 쓰는 형태

```bash
mkdir -p /opt/myapp/releases/20260313
```

### 설명

`-p` 옵션은 중간 폴더가 없어도 한 번에 생성해 준다.

---

## 2.5 `cp` — 파일 복사

### 왜 필요한가

설정 파일 백업, 배포 파일 복제, 템플릿 복사에 사용한다.

### 예시

```bash
cp config.yaml config.yaml.bak
```

### 예상 결과

출력 없음.

확인:

```bash
ls
```

예상 출력:

```text
app.log  config.yaml  config.yaml.bak  scripts
```

### 실무 팁

설정 파일 수정 전에는 항상 백업본을 남겨두는 습관이 좋다.

---

## 2.6 `mv` — 파일 이동 또는 이름 변경

### 왜 필요한가

파일 이름을 바꾸거나 다른 폴더로 옮길 때 사용한다.

### 예시 1: 이름 변경

```bash
mv app.log app.log.1
```

### 예상 결과

출력 없음.

확인:

```bash
ls
```

예상 출력:

```text
app.log.1  config.yaml  scripts
```

### 예시 2: 폴더 이동

```bash
mv app.log.1 backup/
```

### 예상 결과

`backup` 폴더 안으로 파일이 이동한다.

---

## 2.7 `rm` — 파일 삭제

### 왜 필요한가

불필요한 파일, 임시 파일, 오래된 아티팩트를 삭제한다.

### 예시

```bash
rm temp.txt
```

### 예상 결과

출력 없음.

### 주의

삭제 후 휴지통으로 가지 않는 경우가 많다. 즉시 사라질 수 있다.

---

## 2.8 `rm -rf` — 디렉토리 강제 삭제

### 왜 필요한가

빌드 디렉토리나 임시 디렉토리를 통째로 삭제할 때 사용한다.

### 예시

```bash
rm -rf build
```

### 주의

이 명령은 매우 강력하다.

* `-r`: 재귀적으로 하위까지 삭제
* `-f`: 확인 없이 강제 삭제

잘못 치면 큰 사고가 날 수 있다.
특히 `/`, `/var`, `/etc` 같은 시스템 경로에서는 매우 조심해야 한다.

---

## 2.9 `touch` — 빈 파일 생성

### 왜 필요한가

새 파일을 만들거나, 파일 수정 시간을 갱신할 때 쓴다.

### 예시

```bash
touch deploy.log
```

### 예상 출력

보통 출력 없음.

확인:

```bash
ls
```

예상 출력:

```text
deploy.log  app.log  config.yaml
```

---

# 3. 파일 내용 확인

운영 서버에서는 파일을 수정하는 것보다 **로그를 읽는 일**이 더 많다.

## 3.1 `cat` — 파일 전체 출력

### 왜 필요한가

작은 설정 파일이나 짧은 텍스트 파일 내용을 빠르게 확인한다.

### 예시

```bash
cat config.yaml
```

### 예상 출력

```text
server:
  port: 8080
logging:
  level: INFO
```

### 주의

로그 파일처럼 큰 파일에 `cat` 을 쓰면 너무 많은 내용이 한 번에 출력돼 보기 힘들다.

---

## 3.2 `less` — 페이지 단위로 보기

### 왜 필요한가

긴 파일을 위아래로 이동하며 읽을 수 있다.

### 예시

```bash
less /var/log/syslog
```

### 사용 중 자주 쓰는 키

* `/문자열` : 검색
* `n` : 다음 검색 결과
* `q` : 종료

### 예상 결과

터미널 전체가 파일 뷰어처럼 바뀌며 내용을 스크롤해서 볼 수 있다.

### 실무 팁

대용량 로그를 처음 열 때는 `cat` 보다 `less` 가 훨씬 안전하다.

---

## 3.3 `head` — 파일 앞부분 보기

### 왜 필요한가

파일 시작 부분만 빠르게 확인한다.

### 예시

```bash
head -n 5 app.log
```

### 예상 출력

```text
2026-03-13 09:00:01 INFO App start
2026-03-13 09:00:02 INFO DB connected
2026-03-13 09:00:03 INFO Cache warmup
2026-03-13 09:00:04 WARN Slow query
2026-03-13 09:00:05 INFO Ready
```

---

## 3.4 `tail` — 파일 뒷부분 보기

### 왜 필요한가

로그는 최신 내용이 아래쪽에 쌓이는 경우가 많기 때문에, 최근 로그를 보는 데 사용한다.

### 예시

```bash
tail -n 5 app.log
```

### 예상 출력

```text
2026-03-13 10:11:01 INFO Request start
2026-03-13 10:11:02 INFO Request done
2026-03-13 10:11:03 ERROR DB timeout
2026-03-13 10:11:04 INFO Retry start
2026-03-13 10:11:05 INFO Retry success
```

### 가장 중요한 형태

```bash
tail -f app.log
```

### 설명

`-f` 는 파일 끝을 계속 따라간다는 뜻이다.
새 로그가 생길 때마다 실시간으로 화면에 나타난다.

### 예상 출력 예시

처음 실행 시:

```text
2026-03-13 10:11:03 ERROR DB timeout
2026-03-13 10:11:04 INFO Retry start
2026-03-13 10:11:05 INFO Retry success
```

몇 초 뒤 새로운 로그가 추가되면:

```text
2026-03-13 10:11:10 INFO Health check ok
2026-03-13 10:11:12 ERROR Connection reset
```

### 실무에서 매우 자주 쓰는 이유

* 배포 직후 애플리케이션이 정상 기동하는지 확인
* 장애 발생 시 에러 메시지 실시간 확인
* 트래픽 유입 확인

---

## 3.5 `wc` — 줄 수, 단어 수, 문자 수 세기

### 왜 필요한가

로그 줄 수, 파일 크기 감, 데이터 개수 확인에 사용한다.

### 예시

```bash
wc -l app.log
```

### 예상 출력

```text
1523 app.log
```

### 설명

`app.log` 파일이 1523줄이라는 뜻이다.

---

# 4. 검색과 필터링

DevOps 실무에서는 **찾는 능력**이 중요하다.
수만 줄 로그에서 필요한 줄만 골라내는 데 이 영역이 핵심이다.

## 4.1 `grep` — 문자열 포함 줄 찾기

### 왜 필요한가

특정 에러, 특정 요청, 특정 사용자 흔적을 찾는다.

### 예시

```bash
grep ERROR app.log
```

### 예상 출력

```text
2026-03-13 10:11:03 ERROR DB timeout
2026-03-13 10:11:12 ERROR Connection reset
```

### 설명

`app.log` 에서 `ERROR` 라는 문자열이 포함된 줄만 보여준다.

### 자주 쓰는 옵션

* `-i` : 대소문자 무시
* `-n` : 줄 번호 표시
* `-v` : 제외
* `-r` : 하위 디렉토리까지 재귀 검색

### 예시 2

```bash
grep -n ERROR app.log
```

### 예상 출력

```text
120:2026-03-13 10:11:03 ERROR DB timeout
125:2026-03-13 10:11:12 ERROR Connection reset
```

---

## 4.2 `find` — 파일 찾기

### 왜 필요한가

특정 이름의 로그 파일, 설정 파일, 오래된 백업 파일을 찾는다.

### 예시

```bash
find /var/log -name "*.log"
```

### 예상 출력

```text
/var/log/app.log
/var/log/nginx/access.log
/var/log/nginx/error.log
```

### 설명

`/var/log` 아래에서 `.log` 확장자를 가진 파일을 모두 찾는다.

### 실무 팁

파일이 어디 있는지 기억 안 날 때 매우 유용하다.

---

## 4.3 `which` — 실행 파일 위치 찾기

### 예시

```bash
which python3
```

### 예상 출력

```text
/usr/bin/python3
```

### 왜 필요한가

어떤 실행 파일이 실제로 사용되는지 확인한다.
환경이 꼬였을 때 중요하다.

---

# 5. 프로세스 관리

애플리케이션이 죽었는지, 여러 개 떠 있는지, CPU를 많이 먹는지 확인해야 한다.

## 5.1 `ps aux` — 현재 프로세스 목록 보기

### 예시

```bash
ps aux
```

### 예상 출력 일부

```text
root       1  0.0  0.1  22568  4100 ?        Ss   09:00   0:01 /sbin/init
ubuntu  2048  1.2  2.3 512000 48000 ?       Sl   10:10   0:12 java -jar app.jar
ubuntu  2101  0.0  0.0   6432   820 pts/0    S+   10:12   0:00 grep java
```

### 설명

* 어떤 프로그램이 떠 있는지
* 누가 실행했는지
* CPU/메모리를 얼마나 쓰는지 볼 수 있다.

---

## 5.2 `ps aux | grep 이름` — 특정 프로세스 찾기

### 예시

```bash
ps aux | grep nginx
```

### 예상 출력

```text
root     1100  0.0  0.2  10364  5200 ?        Ss   09:55   0:00 nginx: master process
www-data 1101  0.0  0.4  12000  9300 ?        S    09:55   0:00 nginx: worker process
ubuntu   2103  0.0  0.0   6432   800 pts/0    S+   10:13   0:00 grep nginx
```

### 설명

마지막 줄의 `grep nginx` 는 검색 명령 자체가 잡힌 것이다.

---

## 5.3 `top` — 실시간 시스템 상태 보기

### 왜 필요한가

CPU나 메모리를 많이 쓰는 프로세스를 빠르게 찾는다.

### 예시

```bash
top
```

### 예상 화면 예시

```text
top - 10:14:01 up 2 days,  3:10,  2 users,  load average: 1.20, 0.95, 0.80
Tasks: 132 total,   1 running, 131 sleeping,   0 stopped,   0 zombie
%Cpu(s): 12.0 us,  3.0 sy,  0.0 ni, 84.0 id
MiB Mem :   7980.0 total,   1200.0 free,   3400.0 used,   3380.0 buff/cache
```

### 설명

* CPU 사용률
* 메모리 사용량
* load average
* 상위 프로세스
  등을 실시간으로 확인할 수 있다.

---

## 5.4 `kill` — 프로세스 종료

### 왜 필요한가

비정상 프로세스를 종료할 때 사용한다.

### 예시

```bash
kill 2048
```

### 설명

PID 2048 프로세스에 종료 신호를 보낸다.

### 강제 종료

```bash
kill -9 2048
```

### 주의

`-9` 는 강제 종료이므로 최후의 수단으로 쓰는 편이 좋다.

---

## 5.5 `pkill` — 이름으로 종료

### 예시

```bash
pkill nginx
```

### 설명

프로세스 이름이 `nginx` 인 것들을 종료한다.

### 주의

이름이 겹치면 의도하지 않은 프로세스도 종료될 수 있다.

---

# 6. 시스템 상태 확인

서버가 느릴 때는 보통 CPU, 메모리, 디스크를 먼저 본다.

## 6.1 `free -h` — 메모리 사용량 확인

### 예시

```bash
free -h
```

### 예상 출력

```text
               total        used        free      shared  buff/cache   available
Mem:           7.8Gi       3.2Gi       1.1Gi       120Mi       3.5Gi       4.1Gi
Swap:          2.0Gi       0.0Gi       2.0Gi
```

### 설명

* `used`: 현재 사용 중
* `free`: 완전한 여유 메모리
* `available`: 실제로 쓸 수 있는 여유량

입문자는 `free` 만 보기보다 `available` 을 같이 보는 게 좋다.

---

## 6.2 `df -h` — 디스크 사용량 확인

### 예시

```bash
df -h
```

### 예상 출력

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/xvda1       50G   35G   13G  74% /
tmpfs           1.0G     0  1.0G   0% /run/user/1000
```

### 설명

어떤 파일시스템이 얼마나 찼는지 보여준다.

### 실무 팁

디스크가 90% 이상 차면 로그 적재, DB, 배포에서 문제가 터질 수 있다.

---

## 6.3 `du -sh` — 폴더 용량 확인

### 예시

```bash
du -sh /var/log
```

### 예상 출력

```text
2.4G    /var/log
```

### 자주 쓰는 형태

```bash
du -sh *
```

### 예상 출력

```text
1.2G logs
300M backup
24K scripts
```

### 설명

현재 폴더 안의 각 파일/폴더가 얼마나 용량을 차지하는지 볼 수 있다.

---

## 6.4 `uname -a` — 운영체제 정보 확인

### 예시

```bash
uname -a
```

### 예상 출력

```text
Linux ip-10-0-0-12 5.15.0-1031-aws #36-Ubuntu SMP x86_64 GNU/Linux
```

### 왜 필요한가

OS 종류, 커널 버전, 아키텍처를 확인할 수 있다.

---

# 7. 네트워크 확인

DevOps는 결국 서비스 연결 상태를 보는 일이 많다.

## 7.1 `ping` — 대상 서버가 응답하는지 확인

### 예시

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
```

### 설명

* 네트워크 연결 여부
* 지연 시간
  을 간단히 확인한다.

### 주의

일부 서버는 보안상 ping 을 막아둔다. ping 이 안 된다고 무조건 서비스 장애는 아니다.

---

## 7.2 `curl` — HTTP 요청 보내기

### 왜 필요한가

서비스가 HTTP 레벨에서 정상 응답하는지 확인한다.

### 예시

```bash
curl http://localhost:8080/health
```

### 예상 출력

```text
{"status":"ok"}
```

### 헤더까지 보기

```bash
curl -I http://localhost:8080
```

### 예상 출력

```text
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1234
```

### 실무 팁

애플리케이션이 떠 있는지 볼 때 `ping` 보다 `curl` 이 더 직접적이다.

---

## 7.3 `ss -tulnp` — 열려 있는 포트 확인

### 예시

```bash
ss -tulnp
```

### 예상 출력 일부

```text
Netid State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process
tcp   LISTEN 0      128    0.0.0.0:22         0.0.0.0:*     users:(("sshd",pid=900,fd=3))
tcp   LISTEN 0      100    0.0.0.0:8080       0.0.0.0:*     users:(("java",pid=2048,fd=45))
```

### 설명

* 어떤 포트가 열려 있는지
* 어떤 프로세스가 점유 중인지
  확인할 수 있다.

### 실무 예시

8080 포트가 열려 있는지 보려면:

```bash
ss -tulnp | grep 8080
```

예상 출력:

```text
tcp   LISTEN 0      100    0.0.0.0:8080       0.0.0.0:*     users:(("java",pid=2048,fd=45))
```

---

# 8. 권한 관리

리눅스에서는 실행이 안 되는 이유가 **권한 문제**인 경우가 정말 많다.

## 8.1 `chmod` — 권한 변경

### 예시

```bash
chmod 755 deploy.sh
```

### 설명

`deploy.sh` 에 실행 권한을 부여한다.

### 권한 의미

* 7 = 읽기 + 쓰기 + 실행
* 5 = 읽기 + 실행
* 5 = 읽기 + 실행

즉 `755` 는 소유자는 다 가능, 나머지는 읽기/실행만 가능.

### 예상 결과 확인

```bash
ls -l deploy.sh
```

예상 출력:

```text
-rwxr-xr-x 1 ubuntu ubuntu 120 Mar 13 10:20 deploy.sh
```

---

## 8.2 `chown` — 소유자 변경

### 예시

```bash
chown ubuntu:ubuntu app.log
```

### 설명

파일 소유자와 그룹을 `ubuntu` 로 바꾼다.

### 확인

```bash
ls -l app.log
```

예상 출력:

```text
-rw-r--r-- 1 ubuntu ubuntu 2048 Mar 13 10:20 app.log
```

---

## 8.3 `sudo` — 관리자 권한으로 실행

### 예시

```bash
sudo systemctl restart nginx
```

### 설명

일반 권한으로는 불가능한 작업을 관리자 권한으로 실행한다.

### 주의

`sudo` 를 붙이면 영향 범위가 커지므로, 명령어를 정확히 확인하고 실행해야 한다.

---

# 9. 압축과 백업

배포 아티팩트나 로그 백업에서 자주 등장한다.

## 9.1 `tar` — 묶고 압축하기

### 예시

```bash
tar -czvf backup.tar.gz logs/
```

### 설명

* `c`: 새 아카이브 생성
* `z`: gzip 압축
* `v`: 진행 내용 표시
* `f`: 파일 이름 지정

### 예상 출력

```text
logs/
logs/app.log
logs/error.log
```

### 압축 해제

```bash
tar -xzvf backup.tar.gz
```

### 예상 출력

```text
logs/
logs/app.log
logs/error.log
```

---

# 10. 패키지 관리

서버에 필요한 프로그램을 설치할 때 사용한다.

## 10.1 Ubuntu / Debian 계열 `apt`

### 예시

```bash
sudo apt update
sudo apt install nginx
```

### 예상 출력 일부

```text
Get:1 http://archive.ubuntu.com/ubuntu jammy InRelease [270 kB]
Reading package lists... Done
Building dependency tree... Done
```

### 설명

* `apt update`: 패키지 목록 최신화
* `apt install nginx`: nginx 설치

---

## 10.2 CentOS / RHEL 계열 `yum` 또는 `dnf`

### 예시

```bash
sudo dnf install docker
```

### 설명

배포판에 따라 `yum` 또는 `dnf` 를 사용한다.

---

# 11. DevOps에서 가장 자주 쓰는 명령어 TOP 10

아래 10개는 정말 자주 마주친다.

```bash
ls
cd
grep
tail -f
ps aux
top
df -h
free -h
curl
ss -tulnp
```

이 10개만 잘 써도 서버 상태 확인의 큰 부분을 커버할 수 있다.

---

# 12. `grep + awk + sed + xargs` 가 중요한 이유

이 네 개는 리눅스 텍스트 처리의 핵심 조합이다.

* `grep`: **원하는 줄만 고른다**
* `awk`: **줄 안에서 필요한 컬럼만 뽑는다**
* `sed`: **문자열을 바꾸거나 정리한다**
* `xargs`: **앞 단계의 결과를 다음 명령의 인자로 넘겨 실행한다**

즉 다음 같은 흐름이 가능해진다.

```text
필터링 → 추출 → 변환 → 실행
```

예를 들어:

```bash
grep ERROR app.log | awk '{print $5}' | sed 's/:$//' | sort | uniq -c
```

이 명령은 대략 이런 순서로 동작한다.

1. `ERROR` 가 포함된 줄만 고른다.
2. 각 줄의 5번째 컬럼만 뽑는다.
3. 뒤에 붙은 `:` 같은 문자를 정리한다.
4. 정렬한다.
5. 같은 값이 몇 번 나왔는지 센다.

---

# 13. `grep` 상세 설명

## 13.1 기본 사용

```bash
grep ERROR app.log
```

예상 로그:

```text
2026-03-13 10:00:01 INFO App start
2026-03-13 10:00:05 ERROR DB timeout
2026-03-13 10:00:08 WARN Slow query
2026-03-13 10:00:10 ERROR Connection reset
```

예상 출력:

```text
2026-03-13 10:00:05 ERROR DB timeout
2026-03-13 10:00:10 ERROR Connection reset
```

### 해석

`ERROR` 가 들어간 줄만 출력한다.

---

## 13.2 줄 번호와 함께 보기

```bash
grep -n ERROR app.log
```

예상 출력:

```text
2:2026-03-13 10:00:05 ERROR DB timeout
4:2026-03-13 10:00:10 ERROR Connection reset
```

### 해석

어느 줄에 에러가 있는지 함께 보여준다.

---

## 13.3 제외 검색

```bash
grep -v INFO app.log
```

예상 출력:

```text
2026-03-13 10:00:05 ERROR DB timeout
2026-03-13 10:00:08 WARN Slow query
2026-03-13 10:00:10 ERROR Connection reset
```

### 해석

`INFO` 가 없는 줄만 보여준다.

---

# 14. `awk` 상세 설명

`awk` 는 **컬럼 기반 처리**에 매우 강하다.
로그가 공백으로 구분되어 있으면 컬럼을 뽑아내기 쉽다.

예시 로그:

```text
2026-03-13 10:00:05 ERROR DB timeout
2026-03-13 10:00:10 ERROR Connection reset
```

컬럼 번호는 이렇게 생각하면 된다.

* `$1` = `2026-03-13`
* `$2` = `10:00:05`
* `$3` = `ERROR`
* `$4` = `DB`
* `$5` = `timeout`

## 14.1 특정 컬럼 출력

```bash
awk '{print $1, $2}' app.log
```

예상 출력:

```text
2026-03-13 10:00:01
2026-03-13 10:00:05
2026-03-13 10:00:08
2026-03-13 10:00:10
```

### 해석

각 줄에서 날짜와 시간만 출력한다.

---

## 14.2 조건 걸기

```bash
awk '$3 == "ERROR" {print $0}' app.log
```

예상 출력:

```text
2026-03-13 10:00:05 ERROR DB timeout
2026-03-13 10:00:10 ERROR Connection reset
```

### 해석

3번째 컬럼이 `ERROR` 인 줄만 출력한다.

---

## 14.3 원하는 컬럼만 추출

```bash
awk '{print $5}' app.log
```

예상 출력:

```text
start
timeout
query
reset
```

### 해석

각 줄의 5번째 컬럼만 출력한다.

---

# 15. `sed` 상세 설명

`sed` 는 문자열 치환, 삭제, 정리에 많이 쓰인다.

## 15.1 문자열 치환

```bash
echo "ERROR:timeout" | sed 's/ERROR://'
```

예상 출력:

```text
timeout
```

### 해석

`ERROR:` 부분을 빈 문자열로 바꿔 없앤다.

---

## 15.2 파일 내 문자열 변경 결과 보기

```bash
echo "server.port=8080" | sed 's/8080/9090/'
```

예상 출력:

```text
server.port=9090
```

### 해석

8080 을 9090 으로 치환했다.

---

## 15.3 로그에서 IP 마스킹하기

```bash
echo "192.168.1.10 login success" | sed 's/[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+/IP_MASK/'
```

예상 출력:

```text
IP_MASK login success
```

### 해석

IP 주소를 `IP_MASK` 로 치환한다.

---

# 16. `xargs` 상세 설명

`xargs` 는 **앞 단계의 결과를 받아 다음 명령의 인자로 넣어 실행**할 때 쓴다.

## 16.1 기본 개념

```bash
echo "file1.txt file2.txt" | xargs rm
```

### 해석

표준 입력으로 받은 파일 이름들을 `rm` 명령의 인자로 넘긴다.

실제로는 다음과 비슷하게 동작한다.

```bash
rm file1.txt file2.txt
```

---

## 16.2 파일 목록을 받아 명령 실행

```bash
find . -name "*.log" | xargs ls -l
```

### 예상 출력 예시

```text
-rw-r--r-- 1 ubuntu ubuntu 1024 Mar 13 10:00 ./app.log
-rw-r--r-- 1 ubuntu ubuntu 2048 Mar 13 10:01 ./nginx/error.log
```

### 해석

찾은 로그 파일들에 대해 `ls -l` 을 실행한다.

### 주의

파일 이름에 공백이 있는 경우는 `xargs` 사용 시 주의가 필요하다.
입문 단계에서는 보통 공백 없는 파일명을 다루는 것으로 이해하면 된다.

---

# 17. 실무에서 자주 쓰이는 조합

여기부터는 DevOps 실무에서 진짜 많이 쓰는 패턴이다.

---

## 17.1 `grep + awk` — 로그 필터 후 컬럼 추출

### 목적

에러 줄만 뽑아서 시간 정보 또는 특정 필드만 보고 싶을 때

### 예시

```bash
grep ERROR app.log | awk '{print $1, $2}'
```

예상 입력 로그:

```text
2026-03-13 10:01:20 ERROR DB connection failed
2026-03-13 10:02:11 ERROR timeout
```

예상 출력:

```text
2026-03-13 10:01:20
2026-03-13 10:02:11
```

### 해석

* `grep ERROR` 로 에러 줄만 고른다.
* `awk '{print $1, $2}'` 로 날짜와 시간만 뽑는다.

### 실무 활용

장애가 언제 발생했는지 타임라인을 빠르게 볼 때 유용하다.

---

## 17.2 `grep + awk + sort + uniq -c` — 에러 종류 통계

### 목적

어떤 에러가 가장 많이 발생했는지 본다.

### 예시

```bash
grep ERROR app.log | awk '{print $5}' | sort | uniq -c
```

예상 입력 로그:

```text
2026-03-13 10:00:05 ERROR DB timeout
2026-03-13 10:00:06 ERROR DB timeout
2026-03-13 10:00:07 ERROR DB reset
2026-03-13 10:00:08 ERROR DB timeout
```

예상 출력:

```text
1 reset
3 timeout
```

### 해석

* 에러 줄만 추출
* 다섯 번째 컬럼만 추출
* 정렬
* 같은 단어 개수 집계

### 실무 활용

반복적으로 많이 발생하는 장애 원인을 빠르게 찾을 수 있다.

---

## 17.3 `grep + sed` — 특정 문자열 정리

### 목적

로그 데이터에서 불필요한 문자열을 치환하거나 마스킹한다.

### 예시

```bash
grep login access.log | sed 's/[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+/IP_MASK/g'
```

예상 입력 로그:

```text
192.168.1.10 login success
10.0.0.3 login failed
```

예상 출력:

```text
IP_MASK login success
IP_MASK login failed
```

### 해석

로그 안의 IP 주소를 가려서 공유 가능한 형태로 만든다.

### 실무 활용

개인정보 또는 민감한 접속 정보를 감춘 뒤 티켓이나 메신저에 붙여 넣을 때 유용하다.

---

## 17.4 `find + xargs + grep` — 여러 파일에서 에러 찾기

### 목적

여러 로그 파일을 한 번에 검색한다.

### 예시

```bash
find . -name "*.log" | xargs grep ERROR
```

### 예상 출력

```text
./app.log:2026-03-13 10:11:03 ERROR DB timeout
./nginx/error.log:2026-03-13 10:11:12 ERROR upstream timed out
```

### 해석

* `.log` 파일을 모두 찾는다.
* 각 파일에 대해 `grep ERROR` 를 실행한다.

### 실무 활용

어느 로그 파일에서 문제가 발생했는지 빠르게 좁힐 수 있다.

---

## 17.5 `ps aux | grep | awk | xargs` — 특정 프로세스 종료

### 목적

특정 이름의 프로세스를 찾아 PID를 뽑고 종료한다.

### 예시

```bash
ps aux | grep node | awk '{print $2}' | xargs kill -9
```

### 예상 중간 출력 개념

`ps aux | grep node` 결과 예:

```text
ubuntu  2201  0.2  1.2 500000 22000 ? Sl 10:30 0:01 node server.js
ubuntu  2208  0.0  0.0   6432   820 pts/0 S+ 10:31 0:00 grep node
```

`awk '{print $2}'` 결과 예:

```text
2201
2208
```

### 해석

* `ps aux` : 프로세스 목록
* `grep node` : node 포함 줄 필터
* `awk '{print $2}'` : PID만 추출
* `xargs kill -9` : PID를 강제 종료

### 매우 중요한 주의

이 방식은 마지막 `grep node` 프로세스까지 잡힐 수 있다.
또 `kill -9` 는 강제 종료라 위험하다.

입문자는 개념 이해용으로만 보고, 실무에서는 더 안전하게 쓰는 편이 좋다. 예를 들면:

```bash
pgrep -f node
pkill -f node
```

그래도 파이프라인 구조를 이해하는 데는 좋은 예시다.

---

## 17.6 `awk | sort | uniq -c | sort -nr` — 가장 많이 요청한 IP 찾기

### 목적

access log 에서 어떤 IP가 가장 많은 요청을 보냈는지 확인한다.

### 예시

```bash
awk '{print $1}' access.log | sort | uniq -c | sort -nr | head
```

예상 입력 로그:

```text
192.168.1.10 - - [13/Mar/2026:10:00:01] "GET /" 200 123
192.168.1.11 - - [13/Mar/2026:10:00:02] "GET /api" 200 532
192.168.1.10 - - [13/Mar/2026:10:00:03] "GET /" 200 123
192.168.1.10 - - [13/Mar/2026:10:00:04] "GET /login" 401 88
```

예상 출력:

```text
3 192.168.1.10
1 192.168.1.11
```

### 해석

* 첫 번째 컬럼(IP) 추출
* 정렬
* 개수 세기
* 많은 순서대로 정렬
* 상위 결과만 보기

### 실무 활용

봇 트래픽이나 비정상 요청 폭주를 찾을 때 유용하다.

---

## 17.7 `awk '{print $9}'` — HTTP 상태코드 통계

### 목적

웹 서버가 200, 404, 500 등을 얼마나 반환했는지 본다.

### 예시

```bash
awk '{print $9}' access.log | sort | uniq -c
```

예상 입력 로그:

```text
192.168.1.10 - - [13/Mar/2026:10:00:01] "GET /" 200 123
192.168.1.11 - - [13/Mar/2026:10:00:02] "GET /notfound" 404 25
192.168.1.10 - - [13/Mar/2026:10:00:03] "GET /api" 500 99
192.168.1.10 - - [13/Mar/2026:10:00:04] "GET /" 200 123
```

예상 출력:

```text
2 200
1 404
1 500
```

### 해석

9번째 컬럼인 HTTP 상태코드만 뽑아 개수를 센다.

### 실무 활용

장애 시 500 응답이 얼마나 늘었는지 빠르게 파악할 수 있다.

---

## 17.8 `tail -f | grep` — 실시간 에러 모니터링

### 목적

새로 발생하는 에러만 실시간으로 보고 싶을 때

### 예시

```bash
tail -f app.log | grep ERROR
```

### 예상 출력 흐름

초기 출력:

```text
2026-03-13 10:40:01 ERROR DB timeout
```

몇 초 후 새 로그 발생 시:

```text
2026-03-13 10:40:05 ERROR Connection refused
2026-03-13 10:40:09 ERROR Retry failed
```

### 해석

로그를 실시간으로 따라가면서, 그중 `ERROR` 가 포함된 줄만 본다.

### 실무 활용

배포 직후, 장애 대응 중, 롤백 판단 시 매우 자주 쓴다.

---

## 17.9 `du -sh * | sort -h` — 용량 많이 먹는 폴더 찾기

### 목적

디스크가 찼을 때 어떤 폴더가 큰지 찾는다.

### 예시

```bash
du -sh * | sort -h
```

### 예상 출력

```text
4.0K scripts
20M backup
350M build
2.4G logs
```

### 해석

현재 디렉토리 안의 항목들을 용량 순으로 정렬한다.

### 실무 활용

디스크 사용량이 갑자기 증가했을 때 원인을 찾는 첫 단계다.

---

## 17.10 `ss -tulnp | grep 포트번호` — 특정 포트 점유 확인

### 목적

서비스가 포트를 정상적으로 열었는지 본다.

### 예시

```bash
ss -tulnp | grep 8080
```

### 예상 출력

```text
tcp   LISTEN 0 100 0.0.0.0:8080 0.0.0.0:* users:(("java",pid=2048,fd=45))
```

### 해석

8080 포트를 `java` 프로세스가 열고 대기하고 있다는 뜻이다.

### 실무 활용

애플리케이션은 실행했다고 했는데 접속이 안 될 때 많이 확인한다.

---

# 18. 입문자가 특히 알아두면 좋은 파이프(`|`) 개념

파이프는 **앞 명령의 결과를 뒤 명령의 입력으로 넘기는 것**이다.

예시:

```bash
grep ERROR app.log | awk '{print $5}'
```

이걸 말로 풀면:

1. `app.log` 에서 `ERROR` 가 들어간 줄만 찾는다.
2. 그 결과를 `awk` 에 넘긴다.
3. `awk` 는 각 줄의 5번째 컬럼만 출력한다.

즉, 여러 명령을 연결해 **작은 작업을 단계별로 처리**하는 방식이다.

이 개념이 익숙해지면 리눅스가 훨씬 강력해진다.

---

# 19. 실무에서 자주 보는 원라이너 모음

## 19.1 최근 에러 20줄만 보기

```bash
grep ERROR app.log | tail -n 20
```

### 예상 출력

```text
2026-03-13 10:20:01 ERROR timeout
2026-03-13 10:20:05 ERROR connection reset
...
```

### 활용

에러는 많은데 가장 최근 것만 보고 싶을 때 사용한다.

---

## 19.2 에러 로그 TOP 10

```bash
grep ERROR app.log | awk '{print $5}' | sort | uniq -c | sort -nr | head
```

### 예상 출력

```text
25 timeout
10 reset
3 refused
```

### 활용

장애의 주원인이 무엇인지 빠르게 본다.

---

## 19.3 특정 IP 요청만 보기

```bash
grep "192.168.1.10" access.log
```

### 예상 출력

```text
192.168.1.10 - - [13/Mar/2026:10:00:01] "GET /" 200 123
192.168.1.10 - - [13/Mar/2026:10:00:03] "GET /login" 401 88
```

### 활용

특정 사용자, 특정 서버, 특정 프록시 요청을 추적한다.

---

## 19.4 access log 에서 500 에러만 보기

```bash
awk '$9 == 500 {print $0}' access.log
```

### 예상 출력

```text
192.168.1.10 - - [13/Mar/2026:10:00:03] "GET /api" 500 99
```

### 활용

서버 내부 오류 응답만 빠르게 추린다.

---

## 19.5 최근 로그를 보면서 500 에러만 추적

```bash
tail -f access.log | grep ' 500 '
```

### 예상 출력

```text
192.168.1.12 - - [13/Mar/2026:10:50:01] "GET /api/pay" 500 120
```

### 활용

배포 후 500 응답이 생기는지 실시간 감시한다.

---

# 20. 초보자가 자주 헷갈리는 부분

## 20.1 `cat` 과 `less` 차이

* `cat`: 파일 전체를 한 번에 출력
* `less`: 페이지 단위로 천천히 읽기

큰 파일은 `less` 가 안전하다.

## 20.2 `tail` 과 `tail -f` 차이

* `tail -n 10 file`: 마지막 10줄만 한 번 출력
* `tail -f file`: 마지막 부분을 계속 따라감

## 20.3 `grep` 과 `find` 차이

* `grep`: **파일 내용**에서 문자열 검색
* `find`: **파일 이름/속성**으로 파일 검색

## 20.4 `rm` 과 `rm -rf` 차이

* `rm`: 보통 파일 삭제
* `rm -rf`: 디렉토리까지 강제 삭제

`rm -rf` 는 특히 조심해야 한다.

## 20.5 `kill` 과 `kill -9` 차이

* `kill PID`: 일반 종료 요청
* `kill -9 PID`: 강제 종료

정상 종료가 가능하면 먼저 일반 `kill` 을 시도하는 편이 좋다.

---

# 21. DevOps 입문자가 처음 익히면 좋은 순서

처음부터 모든 명령어를 외우려고 하지 말고 아래 순서로 익히는 것이 좋다.

## 1단계: 기본 이동과 파일 보기

```bash
pwd
ls -al
cd
cat
less
head
tail
```

## 2단계: 검색과 필터링

```bash
grep
find
awk
sed
```

## 3단계: 시스템 점검

```bash
ps aux
top
free -h
df -h
ss -tulnp
curl
```

## 4단계: 조합 익히기

```bash
grep ERROR app.log | tail -n 20
grep ERROR app.log | awk '{print $5}' | sort | uniq -c
awk '{print $1}' access.log | sort | uniq -c | sort -nr | head
```

---

# 22. 마지막 요약

리눅스 실무에서 핵심은 **명령어를 많이 아는 것**보다 **기본 도구를 연결해서 문제를 좁혀 가는 능력**이다.

특히 아래 흐름을 익히면 좋다.

1. `tail -f` 로 실시간 로그를 본다.
2. `grep` 으로 필요한 줄만 고른다.
3. `awk` 로 필요한 컬럼만 추출한다.
4. `sed` 로 문자열을 정리한다.
5. `sort`, `uniq -c`, `head` 로 통계를 본다.
6. 필요하면 `xargs` 로 결과를 다음 명령에 넘겨 자동화한다.

가장 실무적인 대표 예시는 아래와 같다.

```bash
grep ERROR app.log | awk '{print $5}' | sort | uniq -c | sort -nr | head
```

이 한 줄은 다음을 한 번에 한다.

* 에러 줄만 찾고
* 에러 키워드만 뽑고
* 같은 에러를 묶고
* 많이 발생한 순으로 보여준다

즉, **로그에서 문제의 핵심을 빠르게 찾는 기본 패턴**이다.

---

# 23. 빠른 치트시트

## 파일/디렉토리

```bash
pwd
ls -al
cd /var/log
mkdir backup
cp config.yaml config.yaml.bak
mv app.log backup/
rm temp.txt
rm -rf build
```

## 파일 보기

```bash
cat config.yaml
less app.log
head -n 20 app.log
tail -n 20 app.log
tail -f app.log
wc -l app.log
```

## 검색

```bash
grep ERROR app.log
grep -n ERROR app.log
find /var/log -name "*.log"
which python3
```

## 프로세스/시스템

```bash
ps aux | grep nginx
top
free -h
df -h
du -sh *
uname -a
```

## 네트워크

```bash
ping -c 4 google.com
curl http://localhost:8080/health
ss -tulnp | grep 8080
```

## 권한

```bash
chmod 755 deploy.sh
chown ubuntu:ubuntu app.log
sudo systemctl restart nginx
```

## 실무 조합

```bash
grep ERROR app.log | tail -n 20
grep ERROR app.log | awk '{print $1, $2}'
grep ERROR app.log | awk '{print $5}' | sort | uniq -c | sort -nr
find . -name "*.log" | xargs grep ERROR
awk '{print $1}' access.log | sort | uniq -c | sort -nr | head
awk '{print $9}' access.log | sort | uniq -c
tail -f app.log | grep ERROR
du -sh * | sort -h
ss -tulnp | grep 8080
```

---

