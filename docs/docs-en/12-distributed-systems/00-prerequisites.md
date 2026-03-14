# Preparing the Distributed Systems Learning Environment

> The distributed systems course is **theory-focused**, but to truly grasp the core concepts, the most effective approach is to spin up distributed components yourself and experiment with them. This document walks you through preparing the distributed storage, cache, and message queue systems using Docker for hands-on exercises.

---

## Prerequisites

```
Required prerequisite knowledge:

[01-linux]      Basic Linux commands        -> Terminal usage, process management
[03-containers]  Basic Docker usage         -> Running containers, port mapping, volumes
[02-networking]  Networking fundamentals    -> IP, ports, DNS, TCP/UDP concepts

Recommended prerequisite knowledge:

[04-kubernetes]  Kubernetes basics          -> Service mesh, distributed scheduling (advanced topics)
[11-scripting]   Python or Go              -> Needed for writing client code
```

The theory portion of this course can be understood without programming experience. However, in the exercises, you will spin up components with Docker and write simple client code in Python or Go.

---

## 1. Installing Docker + Docker Compose

Distributed systems exercises require running multiple containers simultaneously. Docker and Docker Compose are essential.

If you haven't installed them yet, refer to [03-containers](../03-containers/02-docker-basics).

### Check version

```bash
docker --version
```

### Expected output

```text
Docker version 27.1.1, build 6312585
```

```bash
docker compose version
```

### Expected output

```text
Docker Compose version v2.29.1
```

### Docker functionality test

```bash
docker run --rm hello-world
```

### Expected output (key portion)

```text
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

### Notes

- This course may run **5 or more containers simultaneously**. Your system should have at least **8GB of memory** for smooth operation.
- Docker Desktop users should check memory allocation under Settings > Resources. At least 4GB is recommended.

---

## 2. Installing etcd (Distributed Key-Value Store)

etcd is a key-value store for managing configuration data and service discovery in distributed environments. It is also a core component of Kubernetes. It is a prime example of a system that uses the Raft consensus algorithm in practice.

### Run with Docker

```bash
docker run -d \
  --name etcd \
  -p 2379:2379 \
  -p 2380:2380 \
  -e ALLOW_NONE_AUTHENTICATION=yes \
  bitnami/etcd:latest
```

### Verify it is running

```bash
docker ps --filter name=etcd
```

### Expected output

```text
CONTAINER ID   IMAGE                COMMAND                  CREATED         STATUS         PORTS                              NAMES
a1b2c3d4e5f6   bitnami/etcd:latest  "/opt/bitnami/luftx..."  10 seconds ago  Up 9 seconds   0.0.0.0:2379->2379/tcp, 2380/tcp   etcd
```

---

### Using etcdctl

etcdctl is the CLI tool for interacting with etcd. You can run it inside the Docker container.

#### Store data (Put)

```bash
docker exec etcd etcdctl put mykey "hello distributed world"
```

### Expected output

```text
OK
```

#### Retrieve data (Get)

```bash
docker exec etcd etcdctl get mykey
```

### Expected output

```text
mykey
hello distributed world
```

#### Check cluster health

```bash
docker exec etcd etcdctl endpoint health
```

### Expected output

```text
127.0.0.1:2379 is healthy: successfully committed proposal: took = 1.234ms
```

#### List keys

```bash
# List all keys (prefix-based)
docker exec etcd etcdctl get "" --prefix --keys-only
```

#### Delete a key

```bash
docker exec etcd etcdctl del mykey
```

### Expected output

```text
1
```

### Practical tips

- etcd clusters are configured with an **odd number of nodes** (3, 5, 7). Here we practice with a single node, but to properly experiment with the Raft consensus algorithm, a 3-node cluster is needed. This is covered in the course.
- etcd is designed for storing small data (configuration values, service addresses, etc.). It is not a large-scale data store. The default maximum value size is 1.5MB.

---

## 3. Installing Redis (Distributed Cache)

Redis is an in-memory key-value store used for caching, session storage, message brokering, and more. In this course, it is used for practicing cache coherence and distributed locks in distributed environments.

### Run with Docker

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:latest
```

### Verify it is running

```bash
docker ps --filter name=redis
```

### Expected output

```text
CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                    NAMES
b2c3d4e5f6a7   redis:latest   "docker-entrypoint.s..." 5 seconds ago   Up 4 seconds   0.0.0.0:6379->6379/tcp   redis
```

---

### Basic redis-cli usage

#### Connect

```bash
docker exec -it redis redis-cli
```

After connecting, the `127.0.0.1:6379>` prompt will appear.

#### PING test

```bash
docker exec -it redis redis-cli ping
```

### Expected output

```text
PONG
```

#### Store and retrieve data

```bash
docker exec redis redis-cli SET user:1 "Kim Cheolsu"
```

### Expected output

```text
OK
```

```bash
docker exec redis redis-cli GET user:1
```

### Expected output

```text
"Kim Cheolsu"
```

#### Set TTL (automatic expiration)

```bash
# Auto-delete after 10 seconds
docker exec redis redis-cli SET session:abc "active" EX 10
```

```bash
# Check TTL (remaining time)
docker exec redis redis-cli TTL session:abc
```

### Expected output

```text
(integer) 8
```

#### Check server information

```bash
docker exec redis redis-cli INFO server | head -10
```

### Expected output

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

### Practical tips

- Redis is accessible without authentication by default. This is fine for a lab environment, but in production, always set a password with the `--requirepass` option.
- To exit the `redis-cli` interactive mode, type `exit` or `quit`.
- For distributed lock exercises, we use the Redis `SET key value NX EX seconds` pattern.

---

## 4. Installing Message Queues

Message queues are a core component for implementing asynchronous communication between services in distributed systems. Install at least one of RabbitMQ or Kafka.

### 4.1 RabbitMQ (Message Broker)

A traditional message queue that supports both Producer-Consumer and Pub/Sub patterns. Its built-in management UI makes it well-suited for beginners.

```bash
docker run -d \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:management
```

- **5672**: AMQP protocol port (the port applications connect to)
- **15672**: Management UI web port

### Verify it is running

```bash
docker ps --filter name=rabbitmq
```

### Expected output

```text
CONTAINER ID   IMAGE                  COMMAND                  CREATED         STATUS         PORTS                                                                    NAMES
c3d4e5f6a7b8   rabbitmq:management    "docker-entrypoint.s..." 8 seconds ago   Up 7 seconds   0.0.0.0:5672->5672/tcp, 0.0.0.0:15672->15672/tcp, ...                     rabbitmq
```

### Accessing the management UI

Open http://localhost:15672 in your browser.

- **Username**: guest
- **Password**: guest

### Notes

- RabbitMQ takes about 10-15 seconds to start. If you cannot connect immediately, wait a moment.
- You can check the startup log with `docker logs rabbitmq`. When you see "Server startup complete," it is ready.

---

### 4.2 Kafka (Distributed Event Streaming, Optional)

Kafka is a distributed messaging system specialized for high-volume real-time data streaming. It has a more complex architecture than RabbitMQ, but it is an essential component in modern distributed systems.

#### Install with Docker Compose

Kafka requires ZooKeeper (or KRaft mode), so installing via Docker Compose is the most convenient approach.

Save the following content as a `docker-compose-kafka.yml` file.

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

#### Verify it is running

```bash
docker ps --filter name=kafka --filter name=zookeeper
```

### Expected output

```text
CONTAINER ID   IMAGE                              COMMAND                  STATUS         PORTS                    NAMES
d4e5f6a7b8c9   confluentinc/cp-kafka:latest       "/etc/confluent/dock..." Up 5 seconds   0.0.0.0:9092->9092/tcp   kafka
e5f6a7b8c9d0   confluentinc/cp-zookeeper:latest   "/etc/confluent/dock..." Up 6 seconds   0.0.0.0:2181->2181/tcp   zookeeper
```

#### Create a topic and test messages

```bash
# Create a topic
docker exec kafka kafka-topics --create \
  --topic test-topic \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1
```

### Expected output

```text
Created topic test-topic.
```

```bash
# List topics
docker exec kafka kafka-topics --list --bootstrap-server localhost:9092
```

### Expected output

```text
test-topic
```

### Practical tips

- Kafka uses a lot of memory. The Kafka + ZooKeeper combination requires **at least 2GB**. If you are low on memory, installing only RabbitMQ is sufficient for the exercises.
- Kafka's KRaft mode (operating without ZooKeeper) is supported starting from version 3.x. In practice, the trend is shifting toward KRaft, but for learning purposes, ZooKeeper mode is better for understanding the concepts.

---

## 5. Python / Go Client Environment

When writing client code to connect to distributed components, you will use Python or Go. If you already installed them from [11-scripting](../11-scripting/00-prerequisites), just install the additional libraries below.

### Python libraries

```bash
# Install after activating a virtual environment
python3 -m venv ~/distributed-lab
source ~/distributed-lab/bin/activate

pip install redis etcd3 pika kafka-python
```

- `redis`: Redis client
- `etcd3`: etcd client
- `pika`: RabbitMQ client (AMQP)
- `kafka-python`: Kafka client

### Verify installation

```bash
python3 -c "import redis; print('redis:', redis.__version__)"
python3 -c "import pika; print('pika:', pika.__version__)"
```

### Expected output

```text
redis: 5.0.7
pika: 1.3.2
```

### Go libraries (alternative)

If you prefer Go, use the following libraries.

```bash
mkdir -p ~/distributed-lab-go && cd ~/distributed-lab-go
go mod init distributed-lab

go get github.com/redis/go-redis/v9
go get go.etcd.io/etcd/client/v3
go get github.com/rabbitmq/amqp091-go
```

### Practical tips

- Choose whichever language you are more comfortable with between Python and Go. The course provides examples in both languages.
- If the etcd3 Python library fails to install, it may be a `grpcio` dependency issue. Try installing `pip install grpcio` first.

---

## 6. Kubernetes (Optional, Advanced Topics)

Kubernetes is required for advanced topics such as Service Mesh, distributed scheduling, and Leader Election. **It is not required for the core course.**

When the time comes, refer to [04-kubernetes](../04-kubernetes) for installation. For local environments, use one of the following tools.

| Tool | Features | Recommended environment |
|------|----------|------------------------|
| **minikube** | Most versatile, supports various drivers | Linux, Mac, Windows |
| **kind** | Runs K8s inside Docker, lightweight and fast | CI/CD, lightweight exercises |
| **Docker Desktop** | Built-in K8s cluster | Windows, Mac |

### Quick check (if already installed)

```bash
kubectl version --client
```

### Expected output

```text
Client Version: v1.30.2
Kustomize Version: v5.0.4-0.20230601165947-6ce0bf390ce3
```

### Notes

- Kubernetes uses a lot of memory. If running K8s alongside the other components, **16GB or more** of RAM is recommended.
- The core distributed systems theory (CAP theorem, consensus algorithms, distributed transactions) can be fully covered without K8s.

---

## Final Environment Verification Checklist

Run the following commands in order to verify that everything is installed correctly.

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
echo "=== Python Client (optional) ==="
python3 -c "import redis, pika; print('Python client libraries OK')" 2>/dev/null || echo "Python libraries not installed (installation required)"

echo ""
echo "=== Kafka (optional) ==="
docker exec kafka kafka-topics --list --bootstrap-server localhost:9092 2>/dev/null || echo "Kafka not installed (optional, so this is fine)"
```

### Expected output

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

=== Python Client (optional) ===
Python client libraries OK

=== Kafka (optional) ===
test-topic
```

### Notes

- The verification script above requires the **etcd, Redis, and RabbitMQ containers to be running**. Check with `docker ps` first.
- It is fine if you did not install Kafka, as it is optional.
- When you are not running exercises, stop the containers to save resources.

```bash
# Stop containers (does not delete them, data is preserved)
docker stop etcd redis rabbitmq

# Start again
docker start etcd redis rabbitmq
```

---

## Troubleshooting

### Port conflicts

When running multiple services simultaneously, ports may conflict.

```bash
# Check which process is using a specific port
sudo lsof -i :6379
sudo lsof -i :2379
sudo lsof -i :5672
```

```bash
# Run on a different port (e.g., Redis on 6380)
docker run -d --name redis-alt -p 6380:6379 redis:latest
```

### Container startup failure

```bash
# Check logs
docker logs etcd
docker logs redis
docker logs rabbitmq

# If a previous container remains, remove it and recreate
docker rm -f etcd && docker run -d --name etcd ...
```

### etcd connection failure

```bash
# Check if the etcd container is running
docker ps --filter name=etcd

# Check directly inside the container
docker exec -it etcd bash
etcdctl endpoint health
```

### Redis connection failure

```bash
# Test connection directly from the host
docker exec -it redis redis-cli ping

# Check for network issues
docker inspect redis | grep IPAddress
```

### Out of memory

Running all containers simultaneously may exhaust available memory.

```bash
# Check current Docker memory usage
docker stats --no-stream
```

### Expected output

```text
CONTAINER ID   NAME        CPU %     MEM USAGE / LIMIT     MEM %
a1b2c3d4e5f6   etcd        0.50%     45.2MiB / 7.77GiB     0.57%
b2c3d4e5f6a7   redis       0.10%     12.8MiB / 7.77GiB     0.16%
c3d4e5f6a7b8   rabbitmq    1.20%     128.5MiB / 7.77GiB    1.61%
```

Run only the components you need for the current exercise. There is no need to run everything simultaneously.

---

## Next Steps

Once your environment is ready, start learning from [Distributed Systems Theory](./01-theory). The first lesson covers the core theory of distributed systems, including the CAP theorem, consistency models, and consensus algorithms.
