# Preparing the Networking Learning Environment

This document explains how to **install the necessary tools and prepare your environment before starting the networking course**.
It walks through installing and verifying each tool needed for network analysis, DNS lookups, packet capture, and other hands-on exercises.

Complete all steps in this document before starting the course, and make sure the final verification commands produce the expected output.

---

# 1. Prerequisite: Linux Environment

Networking exercises are conducted in a Linux environment.
If you have not yet set up a Linux environment, first refer to the **01-linux/00-prerequisites.md** document to prepare it.

Verify that your Linux environment is working properly with the following command:

```bash
uname -a
```

### Expected Output

```text
Linux DESKTOP-XXXXXX 5.15.153.1-microsoft-standard-WSL2 #1 SMP x86_64 GNU/Linux
```

If Linux kernel information is displayed, you are ready.

Update the package list first:

```bash
sudo apt update
```

---

# 2. Verifying curl Installation

curl is a tool for sending HTTP requests and examining responses.
It is used to check whether web services are working correctly or to call APIs.

```bash
curl --version
```

### Expected Output

```text
curl 7.81.0 (x86_64-pc-linux-gnu) libcurl/7.81.0 OpenSSL/3.0.2
Release-Date: 2022-01-05
Protocols: dict file ftp ftps gopher gophers http https imap imaps ...
```

If version information is displayed, it is already installed.

### If Not Installed

```bash
sudo apt install curl -y
```

### Verification

```bash
curl -I https://google.com
```

### Expected Output

```text
HTTP/2 301
location: https://www.google.com/
content-type: text/html; charset=UTF-8
```

If HTTP response headers are displayed, everything is working correctly.

### Explanation

* `curl -I` fetches only the response headers.
* `301` is a redirect response. google.com is redirecting to www.google.com.

---

# 3. Installing DNS Lookup Tools (dig / nslookup)

dig and nslookup are tools for checking which IP address a domain name resolves to.
They are essential for diagnosing DNS issues.

```bash
dig -v
```

### Expected Output

```text
DiG 9.18.18-0ubuntu0.22.04.2-Ubuntu
```

### If Not Installed

```bash
sudo apt install dnsutils -y
```

### Explanation

The `dnsutils` package includes both `dig` and `nslookup`.

### Verification: dig

```bash
dig google.com
```

### Expected Output (key portion)

```text
;; QUESTION SECTION:
;google.com.                    IN      A

;; ANSWER SECTION:
google.com.             300     IN      A       142.250.196.14

;; Query time: 24 msec
;; SERVER: 8.8.8.8#53(8.8.8.8) (UDP)
```

### Explanation

* The `ANSWER SECTION` shows the IP address.
* `Query time` is the time taken for the DNS lookup.
* `SERVER` is the DNS server that was queried.

### Verification: nslookup

```bash
nslookup google.com
```

### Expected Output

```text
Server:         8.8.8.8
Address:        8.8.8.8#53

Non-authoritative answer:
Name:   google.com
Address: 142.250.196.14
```

### Practical Tip

dig provides more detailed information than nslookup. In practice, dig is used more frequently.

---

# 4. Installing Wireshark

Wireshark is a GUI tool for capturing and analyzing network packets.
It allows you to visually inspect HTTP requests, TCP handshakes, DNS lookup processes, and more.

## 4.1 Windows Installation

1. Download the Windows Installer from https://www.wireshark.org/download.html.
2. Run the installation wizard and proceed with the default options.
3. When the "Install Npcap" checkbox appears, make sure it is checked (required for packet capture).
4. After installation is complete, launch Wireshark.

## 4.2 Mac Installation

```bash
brew install --cask wireshark
```

### Expected Output (final portion)

```text
==> Installing Cask wireshark
==> Moving App 'Wireshark.app' to '/Applications/Wireshark.app'
wireshark was successfully installed!
```

## 4.3 Linux Installation

```bash
sudo apt install wireshark -y
```

During installation, if prompted with "Should non-superusers be able to capture packets?", select `Yes`.

After installation, add the current user to the wireshark group:

```bash
sudo usermod -aG wireshark $USER
```

### Warning

You must log out and log back in (or reboot) for the group change to take effect.

### Verification

```bash
wireshark --version
```

### Expected Output

```text
Wireshark 3.6.2 (Git v3.6.2 packaged as 3.6.2-2)
```

### Practical Tip

In a WSL2 environment, it is more convenient to install Wireshark on the Windows side. Since it is a GUI application, run it directly on Windows and analyze the captured results.

---

# 5. Installing tcpdump

tcpdump is a tool for capturing packets from the terminal.
It is used to inspect network traffic directly on a server without a GUI.

```bash
tcpdump --version
```

### Expected Output

```text
tcpdump version 4.99.1
libpcap version 1.10.1 (with TPACKET_V3)
```

### If Not Installed

```bash
sudo apt install tcpdump -y
```

### Verification

```bash
sudo tcpdump -c 5 -i any
```

### Expected Output

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

### Explanation

* `-c 5`: Captures only 5 packets and then stops.
* `-i any`: Captures from all network interfaces.
* `sudo` is required. Packet capture requires administrator privileges.

---

# 6. Verifying ping

ping is the most basic tool for checking whether a target server is responding on the network.

```bash
ping -c 4 google.com
```

### Expected Output

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

### Explanation

* `-c 4`: Sends only 4 pings and stops. Without this option, you must press `Ctrl + C` to stop it manually.
* `time`: The round-trip time (RTT). Lower numbers mean faster responses.
* `0% packet loss`: No packets were lost.

### Warning

If ping is not installed:

```bash
sudo apt install iputils-ping -y
```

---

# 7. Installing traceroute

traceroute shows the path (routers) that packets take to reach a destination.
It is used to diagnose network routing issues.

```bash
traceroute --version
```

### If Not Installed

```bash
sudo apt install traceroute -y
```

### Verification

```bash
traceroute -m 10 google.com
```

### Expected Output

```text
traceroute to google.com (142.250.196.14), 10 hops max, 60 byte packets
 1  gateway (10.0.0.1)  1.234 ms  1.100 ms  1.050 ms
 2  isp-router (203.0.113.1)  5.432 ms  5.321 ms  5.210 ms
 3  * * *
 4  edge-router (72.14.215.85)  15.678 ms  15.543 ms  15.421 ms
 5  lax17s55-in-f14.1e100.net (142.250.196.14)  24.100 ms  24.050 ms  23.980 ms
```

### Explanation

* Each line represents a router (hop) that the packet passes through.
* `* * *` means that router did not respond (often blocked by security settings).
* `-m 10`: Traces up to a maximum of 10 hops.

---

# 8. Installing netcat (nc)

netcat is a simple tool for testing network connections.
It is used to check whether a specific port is open or to create simple TCP connections.

```bash
nc -h
```

### If Not Installed

```bash
sudo apt install netcat-openbsd -y
```

### Verification: Port Open Test

```bash
nc -zv google.com 443
```

### Expected Output

```text
Connection to google.com (142.250.196.14) 443 port [tcp/https] succeeded!
```

### Explanation

* `-z`: Only checks the connection without sending data.
* `-v`: Shows verbose output.
* `443`: The HTTPS port.
* `succeeded!` means the port is open.

### Output When a Port Is Closed

```bash
nc -zv -w 3 google.com 12345
```

### Expected Output

```text
nc: connect to google.com (142.250.196.14) port 12345 (tcp) timed out: Operation now in progress
```

### Explanation

* `-w 3`: Sets a 3-second timeout. Without this option, it may wait for a long time.

---

# 9. Installing nmap (Optional)

nmap is a network scanning tool. It can scan which ports are open on a target server.
It is not required at the beginning of the course, but it is useful when studying network security.

```bash
sudo apt install nmap -y
```

### Verification

```bash
nmap --version
```

### Expected Output

```text
Nmap version 7.80 ( https://nmap.org )
Platform: x86_64-pc-linux-gnu
```

### Usage Example

```bash
nmap -p 80,443 google.com
```

### Expected Output

```text
Starting Nmap 7.80 ( https://nmap.org ) at 2026-03-14 10:30 KST
Nmap scan report for google.com (142.250.196.14)
Host is up (0.024s latency).

PORT    STATE SERVICE
80/tcp  open  http
443/tcp open  https

Nmap done: 1 IP address (1 host up) scanned in 0.12 seconds
```

### Explanation

* `-p 80,443`: Scans only ports 80 and 443.
* `open`: The port is open.

### Warning

Using nmap extensively against external servers without permission may violate security policies. During learning, only use it against your own servers or well-known public services.

---

# 10. Browser Developer Tools (Network Tab)

Browser developer tools are also very useful when learning about networking.
You can visually inspect HTTP requests/responses, headers, status codes, loading times, and more.

### How to Open

| Browser | Shortcut |
|----------|--------|
| Chrome | `F12` or `Ctrl + Shift + I` (Mac: `Cmd + Option + I`) |
| Firefox | `F12` or `Ctrl + Shift + I` |
| Edge | `F12` or `Ctrl + Shift + I` |

### How to Use

1. Open any website in your browser.
2. Open the developer tools (`F12`).
3. Click the **Network** tab at the top.
4. Refresh the page (`F5` or `Ctrl + R`).
5. HTTP requests will appear in the list.

### Information You Can Check

* **Name**: The name of the requested resource (page, image, JS, CSS, etc.)
* **Status**: HTTP status code (200, 301, 404, 500, etc.)
* **Type**: Resource type (document, script, image, etc.)
* **Size**: Response size
* **Time**: Response time

### Practical Tip

Clicking on an individual request lets you view the request/response headers in the **Headers** tab. You will use this feature frequently when learning about the HTTP protocol in later lessons.

---

# 11. ss (Socket Statistics) Verification

ss is a tool for checking the current network connection status and open ports on the system.
It comes pre-installed on most Linux distributions.

```bash
ss -tulnp
```

### Expected Output

```text
Netid State  Recv-Q Send-Q  Local Address:Port  Peer Address:Port Process
tcp   LISTEN 0      128     0.0.0.0:22          0.0.0.0:*
udp   UNCONN 0      0       127.0.0.53%lo:53    0.0.0.0:*
```

### Explanation

* `-t`: Shows TCP connections.
* `-u`: Shows UDP connections.
* `-l`: Shows only those in LISTEN state (waiting for connections).
* `-n`: Displays numbers (IP addresses) instead of hostnames.
* `-p`: Shows which process is using each connection.

### Warning

The `-p` option may require `sudo`. If process information is empty, try again with `sudo ss -tulnp`.

---

# 12. Final Environment Verification

Run the following commands to verify that all tools are installed.

## 12.1 curl Verification

```bash
curl -I https://google.com
```

### Expected Output (first line)

```text
HTTP/2 301
```

---

## 12.2 dig Verification

```bash
dig google.com +short
```

### Expected Output

```text
142.250.196.14
```

If an IP address is displayed, everything is working correctly.

---

## 12.3 nslookup Verification

```bash
nslookup google.com
```

### Expected Output (partial)

```text
Name:   google.com
Address: 142.250.196.14
```

---

## 12.4 ss Verification

```bash
ss -tulnp
```

### Expected Output

A list of open ports will be displayed.

---

## 12.5 ping Verification

```bash
ping -c 2 google.com
```

### Expected Output (last line)

```text
2 packets transmitted, 2 received, 0% packet loss
```

---

## 12.6 traceroute Verification

```bash
traceroute -m 3 google.com
```

### Expected Output

At least 1 to 3 hop entries will be displayed.

---

## 12.7 netcat Verification

```bash
nc -zv google.com 443
```

### Expected Output

```text
Connection to google.com (142.250.196.14) 443 port [tcp/https] succeeded!
```

---

## 12.8 tcpdump Verification

```bash
tcpdump --version
```

### Expected Output

```text
tcpdump version 4.99.1
```

---

# 13. All-in-One Verification

Run the following command to check the installation status of all tools at once.

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

### Expected Output

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

If all items produce output, the networking learning environment setup is complete.

---

# 14. Common Issues and Solutions

## 14.1 `dig: command not found`

The `dnsutils` package is not installed.

```bash
sudo apt install dnsutils -y
```

---

## 14.2 `ping: permission denied`

This can occur in WSL2 environments. Set the permissions with the following command:

```bash
sudo sysctl -w net.ipv4.ping_group_range="0 2147483647"
```

---

## 14.3 `tcpdump: permission denied`

tcpdump requires administrator privileges. Always run it with `sudo`:

```bash
sudo tcpdump -c 5 -i any
```

---

## 14.4 `traceroute` Results Show All `* * *`

A firewall or network configuration may be blocking ICMP/UDP.
This is a characteristic of the network environment, not a tool issue. It does not affect learning.

---

# 15. Next Steps

Once the environment setup is complete, proceed to the next document: the OSI Model and TCP/UDP Guide.
With all practice tools ready, you can learn about each protocol through hands-on verification.

---
