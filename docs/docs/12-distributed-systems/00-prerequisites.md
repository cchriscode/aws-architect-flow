# 분산 시스템 학습 환경 준비

> 분산 시스템 과정은 **이론 중심**으로 진행되지만, 핵심 개념을 체감하려면 직접 분산 컴포넌트를 띄워보고 실험해 보는 것이 가장 효과적이에요. 이 문서에서는 실습에 사용할 분산 저장소, 캐시, 메시지 큐를 Docker로 준비해요.

---

## 선수 과목

```
필수 선수 지식:

[01-linux]      리눅스 기본 명령어     → 터미널 사용, 프로세스 관리
[03-containers]  Docker 기본 사용법    → 컨테이너 실행, 포트 매핑, 볼륨
[02-networking]  네트워킹 기초         → IP, 포트, DNS, TCP/UDP 개념

권장 선수 지식:

[04-kubernetes]  Kubernetes 기초      → 서비스 메시, 분산 스케줄링 (고급 주제)
[11-scripting]   Python 또는 Go       → 클라이언트 코드 작성 시 필요
```

이 과정의 이론 파트는 프로그래밍 경험 없이도 이해할 수 있어요. 하지만 실습에서는 Docker로 컴포넌트를 띄우고, Python 또는 Go로 간단한 클라이언트 코드를 작성할 거예요.

---

## 1. Docker + Docker Compose 설치

분산 시스템 실습에서는 여러 컨테이너를 동시에 띄워야 해요. Docker와 Docker Compose가 필수예요.

아직 설치하지 않았다면 [03-containers](../03-containers/02-docker-basics)를 참고하세요.

### 버전 확인

```bash
docker --version
```

### 예상 출력

```text
Docker version 27.1.1, build 6312585
```

```bash
docker compose version
```

### 예상 출력

```text
Docker Compose version v2.29.1
```

### Docker 정상 동작 테스트

```bash
docker run --rm hello-world
```

### 예상 출력 (핵심 부분)

```text
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

### 주의

- 이 과정에서는 **5개 이상의 컨테이너를 동시에** 실행할 수 있어요. 시스템 메모리가 최소 **8GB 이상**이어야 원활해요.
- Docker Desktop 사용자는 Settings > Resources에서 메모리 할당을 확인하세요. 4GB 이상을 권장해요.

---

## 2. etcd 설치 (분산 키-값 저장소)

etcd는 분산 환경에서 설정 데이터와 서비스 디스커버리를 관리하는 키-값 저장소예요. Kubernetes의 핵심 컴포넌트이기도 해요. Raft 합의 알고리즘을 실제로 사용하는 대표적인 시스템이에요.

### Docker로 실행

```bash
docker run -d \
  --name etcd \
  -p 2379:2379 \
  -p 2380:2380 \
  -e ALLOW_NONE_AUTHENTICATION=yes \
  bitnami/etcd:latest
```

### 실행 확인

```bash
docker ps --filter name=etcd
```

### 예상 출력

```text
CONTAINER ID   IMAGE                COMMAND                  CREATED         STATUS         PORTS                              NAMES
a1b2c3d4e5f6   bitnami/etcd:latest  "/opt/bitnami/luftx..."  10 seconds ago  Up 9 seconds   0.0.0.0:2379->2379/tcp, 2380/tcp   etcd
```

---

### etcdctl 사용법

etcdctl은 etcd와 상호작용하는 CLI 도구예요. Docker 컨테이너 안에서 실행할 수 있어요.

#### 데이터 저장 (Put)

```bash
docker exec etcd etcdctl put mykey "hello distributed world"
```

### 예상 출력

```text
OK
```

#### 데이터 조회 (Get)

```bash
docker exec etcd etcdctl get mykey
```

### 예상 출력

```text
mykey
hello distributed world
```

#### 클러스터 상태 확인

```bash
docker exec etcd etcdctl endpoint health
```

### 예상 출력

```text
127.0.0.1:2379 is healthy: successfully committed proposal: took = 1.234ms
```

#### 키 목록 조회

```bash
# 모든 키 조회 (prefix 기반)
docker exec etcd etcdctl get "" --prefix --keys-only
```

#### 키 삭제

```bash
docker exec etcd etcdctl del mykey
```

### 예상 출력

```text
1
```

### 실무 팁

- etcd는 **홀수 개의 노드**(3, 5, 7)로 클러스터를 구성해요. 여기서는 단일 노드로 실습하지만, Raft 합의 알고리즘을 제대로 실험하려면 3노드 클러스터가 필요해요. 이 부분은 강의에서 다뤄요.
- etcd에는 작은 데이터(설정값, 서비스 주소 등)를 저장해요. 대용량 데이터 저장소가 아니에요. 기본 최대 값 크기는 1.5MB예요.

---

## 3. Redis 설치 (분산 캐시)

Redis는 인메모리 키-값 저장소로, 캐시, 세션 저장소, 메시지 브로커 등 다양한 용도로 사용돼요. 분산 환경에서의 캐시 일관성(Cache Coherence)과 분산 락(Distributed Lock) 실습에 사용해요.

### Docker로 실행

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:latest
```

### 실행 확인

```bash
docker ps --filter name=redis
```

### 예상 출력

```text
CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                    NAMES
b2c3d4e5f6a7   redis:latest   "docker-entrypoint.s..." 5 seconds ago   Up 4 seconds   0.0.0.0:6379->6379/tcp   redis
```

---

### redis-cli 기본 사용법

#### 접속

```bash
docker exec -it redis redis-cli
```

접속하면 `127.0.0.1:6379>` 프롬프트가 나타나요.

#### PING 테스트

```bash
docker exec -it redis redis-cli ping
```

### 예상 출력

```text
PONG
```

#### 데이터 저장과 조회

```bash
docker exec redis redis-cli SET user:1 "김철수"
```

### 예상 출력

```text
OK
```

```bash
docker exec redis redis-cli GET user:1
```

### 예상 출력

```text
"김철수"
```

#### TTL 설정 (자동 만료)

```bash
# 10초 후 자동 삭제
docker exec redis redis-cli SET session:abc "active" EX 10
```

```bash
# TTL 확인 (남은 시간)
docker exec redis redis-cli TTL session:abc
```

### 예상 출력

```text
(integer) 8
```

#### 서버 정보 확인

```bash
docker exec redis redis-cli INFO server | head -10
```

### 예상 출력

```text
# Server
redis_version:7.2.5
redis_git_sha1:00000000
redis_git_dirty:0
redis_build_id:abc123def456
redis_mode:standalone
os:Linux 6.5.0-35-generic x86_64
arch_bits:64
monotonic_clock:POSIX clock_gettime
```

### 실무 팁

- Redis는 기본적으로 인증 없이 접근할 수 있어요. 실습 환경에서는 괜찮지만, 실무에서는 반드시 `--requirepass` 옵션으로 비밀번호를 설정하세요.
- `redis-cli` 대화형 모드에서 나가려면 `exit` 또는 `quit`을 입력하세요.
- 분산 락 실습에서는 Redis의 `SET key value NX EX seconds` 패턴을 사용해요.

---

## 4. 메시지 큐 설치

분산 시스템에서 서비스 간 비동기 통신을 구현하는 핵심 컴포넌트예요. RabbitMQ와 Kafka 중 하나 이상을 설치하세요.

### 4.1 RabbitMQ (메시지 브로커)

전통적인 메시지 큐로, Producer-Consumer 패턴과 Pub/Sub 패턴을 실습할 수 있어요. 관리 UI가 기본 내장되어 있어서 초보자에게 적합해요.

```bash
docker run -d \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:management
```

- **5672**: AMQP 프로토콜 포트 (애플리케이션이 연결하는 포트)
- **15672**: 관리 UI 웹 포트

### 실행 확인

```bash
docker ps --filter name=rabbitmq
```

### 예상 출력

```text
CONTAINER ID   IMAGE                  COMMAND                  CREATED         STATUS         PORTS                                                                    NAMES
c3d4e5f6a7b8   rabbitmq:management    "docker-entrypoint.s..." 8 seconds ago   Up 7 seconds   0.0.0.0:5672->5672/tcp, 0.0.0.0:15672->15672/tcp, ...                     rabbitmq
```

### 관리 UI 접속

브라우저에서 http://localhost:15672 접속

- **Username**: guest
- **Password**: guest

### 주의

- RabbitMQ는 시작까지 10~15초 정도 걸려요. 바로 접속이 안 되면 잠시 기다리세요.
- `docker logs rabbitmq`으로 시작 로그를 확인할 수 있어요. "Server startup complete"가 나오면 준비 완료예요.

---

### 4.2 Kafka (분산 이벤트 스트리밍, Optional)

Kafka는 대용량 실시간 데이터 스트리밍에 특화된 분산 메시지 시스템이에요. RabbitMQ보다 구조가 복잡하지만, 현대 분산 시스템에서 빠지지 않는 핵심 컴포넌트예요.

#### Docker Compose로 설치

Kafka는 ZooKeeper(또는 KRaft 모드)가 필요해서 Docker Compose로 설치하는 것이 편해요.

아래 내용을 `docker-compose-kafka.yml` 파일로 저장하세요.

```yaml
version: "3.8"

services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    container_name: zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:latest
    container_name: kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
```

```bash
docker compose -f docker-compose-kafka.yml up -d
```

#### 실행 확인

```bash
docker ps --filter name=kafka --filter name=zookeeper
```

### 예상 출력

```text
CONTAINER ID   IMAGE                              COMMAND                  STATUS         PORTS                    NAMES
d4e5f6a7b8c9   confluentinc/cp-kafka:latest       "/etc/confluent/dock..." Up 5 seconds   0.0.0.0:9092->9092/tcp   kafka
e5f6a7b8c9d0   confluentinc/cp-zookeeper:latest   "/etc/confluent/dock..." Up 6 seconds   0.0.0.0:2181->2181/tcp   zookeeper
```

#### 토픽 생성 및 메시지 테스트

```bash
# 토픽 생성
docker exec kafka kafka-topics --create \
  --topic test-topic \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1
```

### 예상 출력

```text
Created topic test-topic.
```

```bash
# 토픽 목록 확인
docker exec kafka kafka-topics --list --bootstrap-server localhost:9092
```

### 예상 출력

```text
test-topic
```

### 실무 팁

- Kafka는 메모리를 많이 사용해요. Kafka + ZooKeeper 조합에 **최소 2GB**가 필요해요. 메모리가 부족하면 RabbitMQ만 설치해도 실습에 충분해요.
- Kafka의 KRaft 모드(ZooKeeper 없이 동작)는 3.x 버전부터 지원돼요. 실무에서는 KRaft로 전환하는 추세이지만, 학습 목적으로는 ZooKeeper 모드가 개념 이해에 좋아요.

---

## 5. Python / Go 클라이언트 환경

분산 컴포넌트에 접속하는 클라이언트 코드를 작성할 때 Python 또는 Go를 사용해요. [11-scripting](../11-scripting/00-prerequisites)에서 이미 설치했다면 아래 라이브러리만 추가로 설치하세요.

### Python 라이브러리

```bash
# 가상환경 활성화 후 설치
python3 -m venv ~/distributed-lab
source ~/distributed-lab/bin/activate

pip install redis etcd3 pika kafka-python
```

- `redis`: Redis 클라이언트
- `etcd3`: etcd 클라이언트
- `pika`: RabbitMQ 클라이언트 (AMQP)
- `kafka-python`: Kafka 클라이언트

### 설치 확인

```bash
python3 -c "import redis; print('redis:', redis.__version__)"
python3 -c "import pika; print('pika:', pika.__version__)"
```

### 예상 출력

```text
redis: 5.0.7
pika: 1.3.2
```

### Go 라이브러리 (대안)

Go를 선호한다면 아래 라이브러리를 사용하세요.

```bash
mkdir -p ~/distributed-lab-go && cd ~/distributed-lab-go
go mod init distributed-lab

go get github.com/redis/go-redis/v9
go get go.etcd.io/etcd/client/v3
go get github.com/rabbitmq/amqp091-go
```

### 실무 팁

- Python과 Go 중 익숙한 언어를 선택하면 돼요. 강의에서는 두 언어 모두 예시를 제공해요.
- etcd3 Python 라이브러리가 설치 실패하면 `grpcio` 의존성 문제일 수 있어요. `pip install grpcio` 를 먼저 설치해 보세요.

---

## 6. Kubernetes (Optional, 고급 주제)

서비스 메시(Service Mesh), 분산 스케줄링, Leader Election 등 고급 주제에서는 Kubernetes가 필요해요. **기본 과정에서는 필수가 아니에요.**

필요한 시점이 되면 [04-kubernetes](../04-kubernetes)를 참고해서 설치하세요. 로컬 환경에서는 아래 도구 중 하나를 사용해요.

| 도구 | 특징 | 권장 환경 |
|------|------|-----------|
| **minikube** | 가장 범용적, 다양한 드라이버 지원 | Linux, Mac, Windows |
| **kind** | Docker 안에서 K8s 실행, 가볍고 빠름 | CI/CD, 가벼운 실습 |
| **Docker Desktop** | 내장 K8s 클러스터 제공 | Windows, Mac |

### 간단 확인 (이미 설치한 경우)

```bash
kubectl version --client
```

### 예상 출력

```text
Client Version: v1.30.2
Kustomize Version: v5.0.4-0.20230601165947-6ce0bf390ce3
```

### 주의

- Kubernetes는 메모리를 많이 사용해요. K8s까지 함께 실행하려면 **16GB 이상**의 RAM을 권장해요.
- 기본 분산 시스템 이론(CAP, 합의 알고리즘, 분산 트랜잭션)은 K8s 없이도 충분히 학습할 수 있어요.

---

## 최종 환경 확인 체크리스트

모든 설치가 완료되었는지 아래 명령어를 순서대로 실행해서 확인하세요.

```bash
echo "=== Docker ==="
docker --version
docker compose version

echo ""
echo "=== etcd ==="
docker exec etcd etcdctl endpoint health

echo ""
echo "=== Redis ==="
docker exec -it redis redis-cli ping

echo ""
echo "=== RabbitMQ ==="
curl -s -o /dev/null -w "RabbitMQ Management UI: HTTP %{http_code}\n" http://localhost:15672

echo ""
echo "=== Python 클라이언트 (optional) ==="
python3 -c "import redis, pika; print('Python 클라이언트 라이브러리 OK')" 2>/dev/null || echo "Python 라이브러리 미설치 (설치 필요)"

echo ""
echo "=== Kafka (optional) ==="
docker exec kafka kafka-topics --list --bootstrap-server localhost:9092 2>/dev/null || echo "Kafka 미설치 (optional이므로 괜찮아요)"
```

### 예상 출력

```text
=== Docker ===
Docker version 27.1.1, build 6312585
Docker Compose version v2.29.1

=== etcd ===
127.0.0.1:2379 is healthy: successfully committed proposal: took = 1.456ms

=== Redis ===
PONG

=== RabbitMQ ===
RabbitMQ Management UI: HTTP 200

=== Python 클라이언트 (optional) ===
Python 클라이언트 라이브러리 OK

=== Kafka (optional) ===
test-topic
```

### 주의

- 위 확인 스크립트는 **etcd, Redis, RabbitMQ 컨테이너가 실행 중**이어야 동작해요. `docker ps`로 먼저 확인하세요.
- Kafka는 optional이라 설치하지 않았어도 괜찮아요.
- 실습하지 않을 때는 컨테이너를 중지해서 리소스를 절약하세요.

```bash
# 컨테이너 중지 (삭제하지 않음, 데이터 보존)
docker stop etcd redis rabbitmq

# 다시 시작
docker start etcd redis rabbitmq
```

---

## 문제 해결

### 포트 충돌

여러 서비스를 동시에 띄우다 보면 포트가 겹칠 수 있어요.

```bash
# 특정 포트를 사용 중인 프로세스 확인
sudo lsof -i :6379
sudo lsof -i :2379
sudo lsof -i :5672
```

```bash
# 포트 변경해서 실행 (예: Redis를 6380으로)
docker run -d --name redis-alt -p 6380:6379 redis:latest
```

### 컨테이너 시작 실패

```bash
# 로그 확인
docker logs etcd
docker logs redis
docker logs rabbitmq

# 이전 컨테이너가 남아 있으면 삭제 후 재생성
docker rm -f etcd && docker run -d --name etcd ...
```

### etcd 접속 실패

```bash
# etcd 컨테이너가 실행 중인지 확인
docker ps --filter name=etcd

# 컨테이너 안에서 직접 확인
docker exec -it etcd bash
etcdctl endpoint health
```

### Redis 접속 실패

```bash
# 호스트에서 직접 연결 테스트
docker exec -it redis redis-cli ping

# 네트워크 문제인지 확인
docker inspect redis | grep IPAddress
```

### 메모리 부족

모든 컨테이너를 동시에 실행하면 메모리가 부족할 수 있어요.

```bash
# 현재 Docker가 사용 중인 메모리 확인
docker stats --no-stream
```

### 예상 출력

```text
CONTAINER ID   NAME        CPU %     MEM USAGE / LIMIT     MEM %
a1b2c3d4e5f6   etcd        0.50%     45.2MiB / 7.77GiB     0.57%
b2c3d4e5f6a7   redis       0.10%     12.8MiB / 7.77GiB     0.16%
c3d4e5f6a7b8   rabbitmq    1.20%     128.5MiB / 7.77GiB    1.61%
```

필요한 실습 컴포넌트만 선택적으로 실행하세요. 모든 것을 동시에 띄울 필요는 없어요.

---

## 다음 단계

환경 준비가 완료되었다면, [분산 시스템 이론](./01-theory)부터 학습을 시작하세요. 첫 번째 강의에서는 CAP 정리, 일관성 모델, 합의 알고리즘 등 분산 시스템의 핵심 이론을 다뤄요.
