# Linux Command Guide for DevOps Engineers

This document is designed so that **even someone new to Linux can understand it**.
Rather than simply listing command names, each command is explained in the following order:

1. **Why this command is needed**
2. **When it's used in practice**
3. **Usage examples**
4. **Expected output**
5. **Things to watch out for**

Additionally, the latter sections cover **`grep + awk + sed + xargs` combinations** frequently used in DevOps work.

---

# 1. Before Looking at Linux Commands

In Linux, you typically enter commands in a **terminal**.
Commands usually follow this structure:

```bash
command options target
```

For example:

```bash
ls -al /var/log
```

This means:

* `ls`: list contents
* `-al`: detailed view, including hidden files
* `/var/log`: the target directory

In other words, it means **"Show me the files in /var/log in detail"**.

---

# 2. File and Directory Management

The first thing you do when connecting to a server is **check your current location and browse files and folders**.

## 2.1 `pwd` — Check Current Location

### Why It's Needed

To know which directory you're currently working in.

### When It's Used in Practice

* Right after connecting to a server via SSH
* Checking the current path before running a script
* Verifying your location when a file can't be found

### Example

```bash
pwd
```

### Expected Output

```text
/home/ubuntu
```

### Explanation

This means the current working directory is `/home/ubuntu`.

### Note

When working with relative paths, it's important to frequently check with `pwd`.

---

## 2.2 `ls` — List Files

### Why It's Needed

To see what files and directories exist in the current folder.

### Commonly Used Options

* `ls`: simple listing
* `ls -l`: detailed information
* `ls -a`: include hidden files
* `ls -al`: detailed information + hidden files

### Example

```bash
ls -al
```

### Expected Output

```text
total 20
drwxr-xr-x 3 ubuntu ubuntu 4096 Mar 13 10:00 .
drwxr-xr-x 5 root   root   4096 Mar 13 09:50 ..
-rw-r--r-- 1 ubuntu ubuntu   32 Mar 13 09:58 app.log
-rw-r--r-- 1 ubuntu ubuntu  120 Mar 13 09:59 config.yaml
drwxr-xr-x 2 ubuntu ubuntu 4096 Mar 13 09:57 scripts
```

### Explanation

* Starts with `d`: directory
* Starts with `-`: regular file
* `rw-r--r--`: permission information
* The date at the end is the modification time

### Practical Tip

After a deployment, `ls -al` is frequently used to verify that files were created.

---

## 2.3 `cd` — Change Directory

### Why It's Needed

Used to navigate to the folder you want to work in.

### Example

```bash
cd /var/log
```

### Expected Result

Usually no output.
Instead, the current directory changes to `/var/log`.

To verify:

```bash
pwd
```

Expected output:

```text
/var/log
```

### Common Forms

```bash
cd ..
cd ~
cd -
```

### Explanation

* `cd ..` : move to parent directory
* `cd ~` : move to home directory
* `cd -` : return to previous directory

### Practical Tip

`cd -` is very convenient when switching back and forth between two folders.

---

## 2.4 `mkdir` — Create Directory

### Why It's Needed

Used to create log storage folders, backup folders, or working directories.

### Example

```bash
mkdir backup
```

### Expected Result

Usually no output.

To verify:

```bash
ls
```

Expected output:

```text
backup  app.log  config.yaml  scripts
```

### Common Form in Practice

```bash
mkdir -p /opt/myapp/releases/20260313
```

### Explanation

The `-p` option creates intermediate directories even if they don't exist.

---

## 2.5 `cp` — Copy Files

### Why It's Needed

Used for backing up configuration files, duplicating deployment files, or copying templates.

### Example

```bash
cp config.yaml config.yaml.bak
```

### Expected Result

No output.

To verify:

```bash
ls
```

Expected output:

```text
app.log  config.yaml  config.yaml.bak  scripts
```

### Practical Tip

It's good practice to always keep a backup before modifying configuration files.

---

## 2.6 `mv` — Move or Rename Files

### Why It's Needed

Used to rename files or move them to another folder.

### Example 1: Rename

```bash
mv app.log app.log.1
```

### Expected Result

No output.

To verify:

```bash
ls
```

Expected output:

```text
app.log.1  config.yaml  scripts
```

### Example 2: Move to Folder

```bash
mv app.log.1 backup/
```

### Expected Result

The file is moved into the `backup` folder.

---

## 2.7 `rm` — Delete Files

### Why It's Needed

Used to delete unnecessary files, temporary files, or old artifacts.

### Example

```bash
rm temp.txt
```

### Expected Result

No output.

### Note

Deleted files often don't go to a trash bin. They may be permanently removed immediately.

---

## 2.8 `rm -rf` — Force Delete Directory

### Why It's Needed

Used to delete entire build directories or temporary directories.

### Example

```bash
rm -rf build
```

### Note

This command is very powerful.

* `-r`: recursively delete subdirectories
* `-f`: force delete without confirmation

A mistake can cause serious damage.
Be especially careful with system paths like `/`, `/var`, `/etc`.

---

## 2.9 `touch` — Create Empty File

### Why It's Needed

Used to create a new file or update a file's modification time.

### Example

```bash
touch deploy.log
```

### Expected Output

Usually no output.

To verify:

```bash
ls
```

Expected output:

```text
deploy.log  app.log  config.yaml
```

---

# 3. Viewing File Contents

On production servers, **reading logs** is more common than editing files.

## 3.1 `cat` — Print Entire File

### Why It's Needed

Quickly view the contents of small configuration files or short text files.

### Example

```bash
cat config.yaml
```

### Expected Output

```text
server:
  port: 8080
logging:
  level: INFO
```

### Note

Using `cat` on large files like logs will dump too much content at once, making it hard to read.

---

## 3.2 `less` — View Page by Page

### Why It's Needed

Allows you to scroll up and down through long files.

### Example

```bash
less /var/log/syslog
```

### Commonly Used Keys

* `/string` : search
* `n` : next search result
* `q` : quit

### Expected Result

The terminal turns into a file viewer where you can scroll through the contents.

### Practical Tip

When opening large logs for the first time, `less` is much safer than `cat`.

---

## 3.3 `head` — View Beginning of File

### Why It's Needed

Quickly check only the beginning of a file.

### Example

```bash
head -n 5 app.log
```

### Expected Output

```text
2026-03-13 09:00:01 INFO App start
2026-03-13 09:00:02 INFO DB connected
2026-03-13 09:00:03 INFO Cache warmup
2026-03-13 09:00:04 WARN Slow query
2026-03-13 09:00:05 INFO Ready
```

---

## 3.4 `tail` — View End of File

### Why It's Needed

Since logs usually append new entries at the bottom, this is used to view the most recent logs.

### Example

```bash
tail -n 5 app.log
```

### Expected Output

```text
2026-03-13 10:11:01 INFO Request start
2026-03-13 10:11:02 INFO Request done
2026-03-13 10:11:03 ERROR DB timeout
2026-03-13 10:11:04 INFO Retry start
2026-03-13 10:11:05 INFO Retry success
```

### Most Important Form

```bash
tail -f app.log
```

### Explanation

`-f` means to continuously follow the end of the file.
New log entries appear on screen in real-time as they're written.

### Expected Output Example

Initial output:

```text
2026-03-13 10:11:03 ERROR DB timeout
2026-03-13 10:11:04 INFO Retry start
2026-03-13 10:11:05 INFO Retry success
```

A few seconds later when new logs are added:

```text
2026-03-13 10:11:10 INFO Health check ok
2026-03-13 10:11:12 ERROR Connection reset
```

### Why It's Used So Often in Practice

* Verifying that an application starts normally right after deployment
* Checking error messages in real-time during incidents
* Monitoring incoming traffic

---

## 3.5 `wc` — Count Lines, Words, Characters

### Why It's Needed

Used to check log line counts, estimate file sizes, or count data entries.

### Example

```bash
wc -l app.log
```

### Expected Output

```text
1523 app.log
```

### Explanation

This means the `app.log` file has 1523 lines.

---

# 4. Search and Filtering

In DevOps work, **the ability to search** is crucial.
This section is essential for extracting only the lines you need from tens of thousands of log lines.

## 4.1 `grep` — Find Lines Containing a String

### Why It's Needed

Used to find specific errors, specific requests, or traces of specific users.

### Example

```bash
grep ERROR app.log
```

### Expected Output

```text
2026-03-13 10:11:03 ERROR DB timeout
2026-03-13 10:11:12 ERROR Connection reset
```

### Explanation

Shows only lines from `app.log` that contain the string `ERROR`.

### Commonly Used Options

* `-i` : case-insensitive
* `-n` : show line numbers
* `-v` : exclude matches
* `-r` : recursive search through subdirectories

### Example 2

```bash
grep -n ERROR app.log
```

### Expected Output

```text
120:2026-03-13 10:11:03 ERROR DB timeout
125:2026-03-13 10:11:12 ERROR Connection reset
```

---

## 4.2 `find` — Find Files

### Why It's Needed

Used to find specific log files, configuration files, or old backup files by name.

### Example

```bash
find /var/log -name "*.log"
```

### Expected Output

```text
/var/log/app.log
/var/log/nginx/access.log
/var/log/nginx/error.log
```

### Explanation

Finds all files with the `.log` extension under `/var/log`.

### Practical Tip

Very useful when you can't remember where a file is located.

---

## 4.3 `which` — Find Executable Location

### Example

```bash
which python3
```

### Expected Output

```text
/usr/bin/python3
```

### Why It's Needed

To verify which executable is actually being used.
Important when environments get mixed up.

---

# 5. Process Management

You need to check whether an application has died, if multiple instances are running, or if it's consuming too much CPU.

## 5.1 `ps aux` — View Current Process List

### Example

```bash
ps aux
```

### Partial Expected Output

```text
root       1  0.0  0.1  22568  4100 ?        Ss   09:00   0:01 /sbin/init
ubuntu  2048  1.2  2.3 512000 48000 ?       Sl   10:10   0:12 java -jar app.jar
ubuntu  2101  0.0  0.0   6432   820 pts/0    S+   10:12   0:00 grep java
```

### Explanation

* Which programs are running
* Who started them
* How much CPU/memory they're using

---

## 5.2 `ps aux | grep name` — Find Specific Process

### Example

```bash
ps aux | grep nginx
```

### Expected Output

```text
root     1100  0.0  0.2  10364  5200 ?        Ss   09:55   0:00 nginx: master process
www-data 1101  0.0  0.4  12000  9300 ?        S    09:55   0:00 nginx: worker process
ubuntu   2103  0.0  0.0   6432   800 pts/0    S+   10:13   0:00 grep nginx
```

### Explanation

The last line `grep nginx` is the search command itself being caught in the results.

---

## 5.3 `top` — Real-time System Status

### Why It's Needed

Quickly identify processes using the most CPU or memory.

### Example

```bash
top
```

### Expected Screen Example

```text
top - 10:14:01 up 2 days,  3:10,  2 users,  load average: 1.20, 0.95, 0.80
Tasks: 132 total,   1 running, 131 sleeping,   0 stopped,   0 zombie
%Cpu(s): 12.0 us,  3.0 sy,  0.0 ni, 84.0 id
MiB Mem :   7980.0 total,   1200.0 free,   3400.0 used,   3380.0 buff/cache
```

### Explanation

* CPU usage
* Memory usage
* Load average
* Top processes
  can all be monitored in real-time.

---

## 5.4 `kill` — Terminate Process

### Why It's Needed

Used to terminate abnormal processes.

### Example

```bash
kill 2048
```

### Explanation

Sends a termination signal to process with PID 2048.

### Force Kill

```bash
kill -9 2048
```

### Note

`-9` is a force kill, so it should be used as a last resort.

---

## 5.5 `pkill` — Kill by Name

### Example

```bash
pkill nginx
```

### Explanation

Terminates all processes named `nginx`.

### Note

If names overlap, unintended processes may also be terminated.

---

# 6. System Status Check

When a server is slow, you typically check CPU, memory, and disk first.

## 6.1 `free -h` — Check Memory Usage

### Example

```bash
free -h
```

### Expected Output

```text
               total        used        free      shared  buff/cache   available
Mem:           7.8Gi       3.2Gi       1.1Gi       120Mi       3.5Gi       4.1Gi
Swap:          2.0Gi       0.0Gi       2.0Gi
```

### Explanation

* `used`: currently in use
* `free`: completely free memory
* `available`: actually available free memory

For beginners, it's better to look at `available` alongside `free` rather than just `free` alone.

---

## 6.2 `df -h` — Check Disk Usage

### Example

```bash
df -h
```

### Expected Output

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/xvda1       50G   35G   13G  74% /
tmpfs           1.0G     0  1.0G   0% /run/user/1000
```

### Explanation

Shows how full each filesystem is.

### Practical Tip

When disk usage exceeds 90%, problems can arise with log storage, databases, and deployments.

---

## 6.3 `du -sh` — Check Folder Size

### Example

```bash
du -sh /var/log
```

### Expected Output

```text
2.4G    /var/log
```

### Common Form

```bash
du -sh *
```

### Expected Output

```text
1.2G logs
300M backup
24K scripts
```

### Explanation

Shows how much space each file/folder in the current directory occupies.

---

## 6.4 `uname -a` — Check OS Information

### Example

```bash
uname -a
```

### Expected Output

```text
Linux ip-10-0-0-12 5.15.0-1031-aws #36-Ubuntu SMP x86_64 GNU/Linux
```

### Why It's Needed

To check the OS type, kernel version, and architecture.

---

# 7. Network Checks

DevOps ultimately involves a lot of checking service connection states.

## 7.1 `ping` — Check if Target Server Responds

### Example

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
```

### Explanation

* Network connectivity
* Latency
  can be quickly verified.

### Note

Some servers block ping for security reasons. A failed ping doesn't necessarily mean a service outage.

---

## 7.2 `curl` — Send HTTP Requests

### Why It's Needed

To verify that a service responds normally at the HTTP level.

### Example

```bash
curl http://localhost:8080/health
```

### Expected Output

```text
{"status":"ok"}
```

### View Headers

```bash
curl -I http://localhost:8080
```

### Expected Output

```text
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1234
```

### Practical Tip

When checking if an application is running, `curl` is more direct than `ping`.

---

## 7.3 `ss -tulnp` — Check Open Ports

### Example

```bash
ss -tulnp
```

### Partial Expected Output

```text
Netid State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process
tcp   LISTEN 0      128    0.0.0.0:22         0.0.0.0:*     users:(("sshd",pid=900,fd=3))
tcp   LISTEN 0      100    0.0.0.0:8080       0.0.0.0:*     users:(("java",pid=2048,fd=45))
```

### Explanation

* Which ports are open
* Which processes are occupying them

### Practical Example

To check if port 8080 is open:

```bash
ss -tulnp | grep 8080
```

Expected output:

```text
tcp   LISTEN 0      100    0.0.0.0:8080       0.0.0.0:*     users:(("java",pid=2048,fd=45))
```

---

# 8. Permission Management

In Linux, the reason something won't execute is very often a **permission issue**.

## 8.1 `chmod` — Change Permissions

### Example

```bash
chmod 755 deploy.sh
```

### Explanation

Grants execution permission to `deploy.sh`.

### Permission Meaning

* 7 = read + write + execute
* 5 = read + execute
* 5 = read + execute

So `755` means the owner can do everything, others can only read/execute.

### Verify Result

```bash
ls -l deploy.sh
```

Expected output:

```text
-rwxr-xr-x 1 ubuntu ubuntu 120 Mar 13 10:20 deploy.sh
```

---

## 8.2 `chown` — Change Owner

### Example

```bash
chown ubuntu:ubuntu app.log
```

### Explanation

Changes the file owner and group to `ubuntu`.

### Verify

```bash
ls -l app.log
```

Expected output:

```text
-rw-r--r-- 1 ubuntu ubuntu 2048 Mar 13 10:20 app.log
```

---

## 8.3 `sudo` — Run as Administrator

### Example

```bash
sudo systemctl restart nginx
```

### Explanation

Executes tasks that require administrator privileges which are not possible with regular permissions.

### Note

When using `sudo`, the scope of impact increases, so verify the command carefully before executing.

---

# 9. Compression and Backup

Frequently used for deployment artifacts and log backups.

## 9.1 `tar` — Bundle and Compress

### Example

```bash
tar -czvf backup.tar.gz logs/
```

### Explanation

* `c`: create new archive
* `z`: gzip compression
* `v`: show progress
* `f`: specify filename

### Expected Output

```text
logs/
logs/app.log
logs/error.log
```

### Extract

```bash
tar -xzvf backup.tar.gz
```

### Expected Output

```text
logs/
logs/app.log
logs/error.log
```

---

# 10. Package Management

Used to install programs needed on the server.

## 10.1 Ubuntu / Debian: `apt`

### Example

```bash
sudo apt update
sudo apt install nginx
```

### Partial Expected Output

```text
Get:1 http://archive.ubuntu.com/ubuntu jammy InRelease [270 kB]
Reading package lists... Done
Building dependency tree... Done
```

### Explanation

* `apt update`: refresh package list
* `apt install nginx`: install nginx

---

## 10.2 CentOS / RHEL: `yum` or `dnf`

### Example

```bash
sudo dnf install docker
```

### Explanation

Use `yum` or `dnf` depending on the distribution.

---

# 11. Top 10 Most Used DevOps Commands

These 10 are encountered very frequently:

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

Mastering just these 10 covers a large portion of server status checking.

---

# 12. Why `grep + awk + sed + xargs` Are Important

These four form the core combination for Linux text processing:

* `grep`: **selects only the lines you want**
* `awk`: **extracts only the columns you need from a line**
* `sed`: **replaces or cleans up strings**
* `xargs`: **passes the results from the previous step as arguments to the next command**

This enables the following workflow:

```text
Filter → Extract → Transform → Execute
```

For example:

```bash
grep ERROR app.log | awk '{print $5}' | sed 's/:$//' | sort | uniq -c
```

This command works roughly in this order:

1. Select only lines containing `ERROR`.
2. Extract only the 5th column from each line.
3. Clean up trailing characters like `:`.
4. Sort the results.
5. Count how many times each value appears.

---

# 13. `grep` Detailed Explanation

## 13.1 Basic Usage

```bash
grep ERROR app.log
```

Sample log:

```text
2026-03-13 10:00:01 INFO App start
2026-03-13 10:00:05 ERROR DB timeout
2026-03-13 10:00:08 WARN Slow query
2026-03-13 10:00:10 ERROR Connection reset
```

Expected output:

```text
2026-03-13 10:00:05 ERROR DB timeout
2026-03-13 10:00:10 ERROR Connection reset
```

### Interpretation

Only outputs lines containing `ERROR`.

---

## 13.2 View with Line Numbers

```bash
grep -n ERROR app.log
```

Expected output:

```text
2:2026-03-13 10:00:05 ERROR DB timeout
4:2026-03-13 10:00:10 ERROR Connection reset
```

### Interpretation

Shows which line numbers contain errors.

---

## 13.3 Exclusion Search

```bash
grep -v INFO app.log
```

Expected output:

```text
2026-03-13 10:00:05 ERROR DB timeout
2026-03-13 10:00:08 WARN Slow query
2026-03-13 10:00:10 ERROR Connection reset
```

### Interpretation

Shows only lines that do NOT contain `INFO`.

---

# 14. `awk` Detailed Explanation

`awk` is very powerful for **column-based processing**.
If logs are separated by spaces, it's easy to extract columns.

Sample log:

```text
2026-03-13 10:00:05 ERROR DB timeout
2026-03-13 10:00:10 ERROR Connection reset
```

Think of column numbers like this:

* `$1` = `2026-03-13`
* `$2` = `10:00:05`
* `$3` = `ERROR`
* `$4` = `DB`
* `$5` = `timeout`

## 14.1 Print Specific Columns

```bash
awk '{print $1, $2}' app.log
```

Expected output:

```text
2026-03-13 10:00:01
2026-03-13 10:00:05
2026-03-13 10:00:08
2026-03-13 10:00:10
```

### Interpretation

Prints only the date and time from each line.

---

## 14.2 Adding Conditions

```bash
awk '$3 == "ERROR" {print $0}' app.log
```

Expected output:

```text
2026-03-13 10:00:05 ERROR DB timeout
2026-03-13 10:00:10 ERROR Connection reset
```

### Interpretation

Only prints lines where the 3rd column is `ERROR`.

---

## 14.3 Extract Only Desired Columns

```bash
awk '{print $5}' app.log
```

Expected output:

```text
start
timeout
query
reset
```

### Interpretation

Prints only the 5th column from each line.

---

# 15. `sed` Detailed Explanation

`sed` is widely used for string substitution, deletion, and cleanup.

## 15.1 String Substitution

```bash
echo "ERROR:timeout" | sed 's/ERROR://'
```

Expected output:

```text
timeout
```

### Interpretation

Replaces the `ERROR:` part with an empty string, effectively removing it.

---

## 15.2 Preview String Changes in Files

```bash
echo "server.port=8080" | sed 's/8080/9090/'
```

Expected output:

```text
server.port=9090
```

### Interpretation

Replaced 8080 with 9090.

---

## 15.3 Masking IPs in Logs

```bash
echo "192.168.1.10 login success" | sed 's/[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+/IP_MASK/'
```

Expected output:

```text
IP_MASK login success
```

### Interpretation

Replaces the IP address with `IP_MASK`.

---

# 16. `xargs` Detailed Explanation

`xargs` is used to **take results from the previous step and pass them as arguments to the next command**.

## 16.1 Basic Concept

```bash
echo "file1.txt file2.txt" | xargs rm
```

### Interpretation

Passes the filenames received via standard input as arguments to the `rm` command.

It effectively works like:

```bash
rm file1.txt file2.txt
```

---

## 16.2 Execute Commands on File Lists

```bash
find . -name "*.log" | xargs ls -l
```

### Expected Output Example

```text
-rw-r--r-- 1 ubuntu ubuntu 1024 Mar 13 10:00 ./app.log
-rw-r--r-- 1 ubuntu ubuntu 2048 Mar 13 10:01 ./nginx/error.log
```

### Interpretation

Runs `ls -l` on each log file found.

### Note

Be careful when filenames contain spaces when using `xargs`.
At the beginner level, it's fine to assume filenames don't contain spaces.

---

# 17. Frequently Used Combinations in Practice

From here on, these are patterns genuinely used often in DevOps work.

---

## 17.1 `grep + awk` — Filter Logs Then Extract Columns

### Purpose

When you want to extract only error lines and see time information or specific fields.

### Example

```bash
grep ERROR app.log | awk '{print $1, $2}'
```

Sample input log:

```text
2026-03-13 10:01:20 ERROR DB connection failed
2026-03-13 10:02:11 ERROR timeout
```

Expected output:

```text
2026-03-13 10:01:20
2026-03-13 10:02:11
```

### Interpretation

* `grep ERROR` selects only error lines.
* `awk '{print $1, $2}'` extracts only the date and time.

### Practical Use

Useful for quickly viewing a timeline of when incidents occurred.

---

## 17.2 `grep + awk + sort + uniq -c` — Error Type Statistics

### Purpose

See which errors occur most frequently.

### Example

```bash
grep ERROR app.log | awk '{print $5}' | sort | uniq -c
```

Sample input log:

```text
2026-03-13 10:00:05 ERROR DB timeout
2026-03-13 10:00:06 ERROR DB timeout
2026-03-13 10:00:07 ERROR DB reset
2026-03-13 10:00:08 ERROR DB timeout
```

Expected output:

```text
1 reset
3 timeout
```

### Interpretation

* Extract only error lines
* Extract 5th column
* Sort
* Count occurrences

### Practical Use

Quickly identify the most frequently occurring root causes of incidents.

---

## 17.3 `grep + sed` — Clean Up Specific Strings

### Purpose

Replace or mask unnecessary strings in log data.

### Example

```bash
grep login access.log | sed 's/[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+/IP_MASK/g'
```

Sample input log:

```text
192.168.1.10 login success
10.0.0.3 login failed
```

Expected output:

```text
IP_MASK login success
IP_MASK login failed
```

### Interpretation

Masks IP addresses in logs to create a shareable format.

### Practical Use

Useful when pasting into tickets or messaging tools after hiding personal information or sensitive connection details.

---

## 17.4 `find + xargs + grep` — Search for Errors Across Multiple Files

### Purpose

Search multiple log files at once.

### Example

```bash
find . -name "*.log" | xargs grep ERROR
```

### Expected Output

```text
./app.log:2026-03-13 10:11:03 ERROR DB timeout
./nginx/error.log:2026-03-13 10:11:12 ERROR upstream timed out
```

### Interpretation

* Find all `.log` files.
* Run `grep ERROR` on each file.

### Practical Use

Quickly narrow down which log file contains the problem.

---

## 17.5 `ps aux | grep | awk | xargs` — Kill Specific Processes

### Purpose

Find processes by name, extract their PIDs, and terminate them.

### Example

```bash
ps aux | grep node | awk '{print $2}' | xargs kill -9
```

### Conceptual Intermediate Output

`ps aux | grep node` result example:

```text
ubuntu  2201  0.2  1.2 500000 22000 ? Sl 10:30 0:01 node server.js
ubuntu  2208  0.0  0.0   6432   820 pts/0 S+ 10:31 0:00 grep node
```

`awk '{print $2}'` result example:

```text
2201
2208
```

### Interpretation

* `ps aux` : process list
* `grep node` : filter lines containing node
* `awk '{print $2}'` : extract only PIDs
* `xargs kill -9` : force kill the PIDs

### Very Important Note

This approach may also catch the `grep node` process itself.
Also, `kill -9` is a force kill and is dangerous.

Beginners should treat this as a conceptual example only. In practice, it's better to use safer alternatives:

```bash
pgrep -f node
pkill -f node
```

Still, it's a good example for understanding pipeline structure.

---

## 17.6 `awk | sort | uniq -c | sort -nr` — Find Most Requesting IPs

### Purpose

Check which IP sent the most requests in the access log.

### Example

```bash
awk '{print $1}' access.log | sort | uniq -c | sort -nr | head
```

Sample input log:

```text
192.168.1.10 - - [13/Mar/2026:10:00:01] "GET /" 200 123
192.168.1.11 - - [13/Mar/2026:10:00:02] "GET /api" 200 532
192.168.1.10 - - [13/Mar/2026:10:00:03] "GET /" 200 123
192.168.1.10 - - [13/Mar/2026:10:00:04] "GET /login" 401 88
```

Expected output:

```text
3 192.168.1.10
1 192.168.1.11
```

### Interpretation

* Extract first column (IP)
* Sort
* Count occurrences
* Sort by count descending
* Show top results

### Practical Use

Useful for finding bot traffic or abnormal request floods.

---

## 17.7 `awk '{print $9}'` — HTTP Status Code Statistics

### Purpose

See how many 200, 404, 500, etc. responses the web server returned.

### Example

```bash
awk '{print $9}' access.log | sort | uniq -c
```

Sample input log:

```text
192.168.1.10 - - [13/Mar/2026:10:00:01] "GET /" 200 123
192.168.1.11 - - [13/Mar/2026:10:00:02] "GET /notfound" 404 25
192.168.1.10 - - [13/Mar/2026:10:00:03] "GET /api" 500 99
192.168.1.10 - - [13/Mar/2026:10:00:04] "GET /" 200 123
```

Expected output:

```text
2 200
1 404
1 500
```

### Interpretation

Extracts only the 9th column (HTTP status code) and counts occurrences.

### Practical Use

Quickly assess how many 500 responses increased during an incident.

---

## 17.8 `tail -f | grep` — Real-time Error Monitoring

### Purpose

When you want to see only newly occurring errors in real-time.

### Example

```bash
tail -f app.log | grep ERROR
```

### Expected Output Flow

Initial output:

```text
2026-03-13 10:40:01 ERROR DB timeout
```

A few seconds later when new logs arrive:

```text
2026-03-13 10:40:05 ERROR Connection refused
2026-03-13 10:40:09 ERROR Retry failed
```

### Interpretation

Follows the log in real-time, showing only lines containing `ERROR`.

### Practical Use

Used very frequently right after deployment, during incident response, and when deciding on rollbacks.

---

## 17.9 `du -sh * | sort -h` — Find Folders Using the Most Space

### Purpose

Find which folders are largest when disk is full.

### Example

```bash
du -sh * | sort -h
```

### Expected Output

```text
4.0K scripts
20M backup
350M build
2.4G logs
```

### Interpretation

Sorts items in the current directory by size.

### Practical Use

The first step when investigating a sudden increase in disk usage.

---

## 17.10 `ss -tulnp | grep port` — Check Specific Port Occupancy

### Purpose

Verify that a service has successfully opened a port.

### Example

```bash
ss -tulnp | grep 8080
```

### Expected Output

```text
tcp   LISTEN 0 100 0.0.0.0:8080 0.0.0.0:* users:(("java",pid=2048,fd=45))
```

### Interpretation

This means the `java` process has opened port 8080 and is listening.

### Practical Use

Often checked when an application claims to be running but connections are failing.

---

# 18. Pipe (`|`) Concept That Beginners Should Know

A pipe **passes the output of one command as input to the next command**.

Example:

```bash
grep ERROR app.log | awk '{print $5}'
```

In plain words:

1. Find only lines containing `ERROR` in `app.log`.
2. Pass the results to `awk`.
3. `awk` prints only the 5th column of each line.

In other words, it's a method of connecting multiple commands to **process small tasks step by step**.

Once you're familiar with this concept, Linux becomes much more powerful.

---

# 19. Common One-Liners Used in Practice

## 19.1 View Only the Last 20 Error Lines

```bash
grep ERROR app.log | tail -n 20
```

### Expected Output

```text
2026-03-13 10:20:01 ERROR timeout
2026-03-13 10:20:05 ERROR connection reset
...
```

### Use Case

When there are many errors but you only want to see the most recent ones.

---

## 19.2 Top 10 Error Logs

```bash
grep ERROR app.log | awk '{print $5}' | sort | uniq -c | sort -nr | head
```

### Expected Output

```text
25 timeout
10 reset
3 refused
```

### Use Case

Quickly identify the primary root cause of an incident.

---

## 19.3 View Requests from a Specific IP Only

```bash
grep "192.168.1.10" access.log
```

### Expected Output

```text
192.168.1.10 - - [13/Mar/2026:10:00:01] "GET /" 200 123
192.168.1.10 - - [13/Mar/2026:10:00:03] "GET /login" 401 88
```

### Use Case

Track specific users, specific servers, or specific proxy requests.

---

## 19.4 View Only 500 Errors from Access Log

```bash
awk '$9 == 500 {print $0}' access.log
```

### Expected Output

```text
192.168.1.10 - - [13/Mar/2026:10:00:03] "GET /api" 500 99
```

### Use Case

Quickly filter out only server internal error responses.

---

## 19.5 Track 500 Errors While Watching Recent Logs

```bash
tail -f access.log | grep ' 500 '
```

### Expected Output

```text
192.168.1.12 - - [13/Mar/2026:10:50:01] "GET /api/pay" 500 120
```

### Use Case

Monitor in real-time whether 500 responses occur after deployment.

---

# 20. Common Points of Confusion for Beginners

## 20.1 Difference Between `cat` and `less`

* `cat`: prints the entire file at once
* `less`: read page by page

`less` is safer for large files.

## 20.2 Difference Between `tail` and `tail -f`

* `tail -n 10 file`: prints the last 10 lines once
* `tail -f file`: continuously follows the end of the file

## 20.3 Difference Between `grep` and `find`

* `grep`: searches for strings within **file contents**
* `find`: searches for files by **filename/attributes**

## 20.4 Difference Between `rm` and `rm -rf`

* `rm`: regular file deletion
* `rm -rf`: force delete including directories

`rm -rf` requires extra caution.

## 20.5 Difference Between `kill` and `kill -9`

* `kill PID`: normal termination request
* `kill -9 PID`: force kill

If normal termination is possible, try regular `kill` first.

---

# 21. Recommended Learning Order for DevOps Beginners

Don't try to memorize all commands from the start. It's better to learn in this order:

## Stage 1: Basic Navigation and File Viewing

```bash
pwd
ls -al
cd
cat
less
head
tail
```

## Stage 2: Search and Filtering

```bash
grep
find
awk
sed
```

## Stage 3: System Inspection

```bash
ps aux
top
free -h
df -h
ss -tulnp
curl
```

## Stage 4: Learning Combinations

```bash
grep ERROR app.log | tail -n 20
grep ERROR app.log | awk '{print $5}' | sort | uniq -c
awk '{print $1}' access.log | sort | uniq -c | sort -nr | head
```

---

# 22. Final Summary

The key to practical Linux work is not **knowing many commands** but **the ability to connect basic tools to narrow down problems**.

In particular, learn this workflow:

1. Use `tail -f` to watch logs in real-time.
2. Use `grep` to select only the lines you need.
3. Use `awk` to extract only the columns you need.
4. Use `sed` to clean up strings.
5. Use `sort`, `uniq -c`, `head` for statistics.
6. If needed, use `xargs` to pass results to the next command for automation.

The most practical representative example is:

```bash
grep ERROR app.log | awk '{print $5}' | sort | uniq -c | sort -nr | head
```

This single line does all of the following:

* Finds only error lines
* Extracts only error keywords
* Groups identical errors
* Shows them in order of most frequent

In other words, it's the **basic pattern for quickly finding the core of a problem in logs**.

---

# 23. Quick Cheat Sheet

## Files/Directories

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

## Viewing Files

```bash
cat config.yaml
less app.log
head -n 20 app.log
tail -n 20 app.log
tail -f app.log
wc -l app.log
```

## Search

```bash
grep ERROR app.log
grep -n ERROR app.log
find /var/log -name "*.log"
which python3
```

## Process/System

```bash
ps aux | grep nginx
top
free -h
df -h
du -sh *
uname -a
```

## Network

```bash
ping -c 4 google.com
curl http://localhost:8080/health
ss -tulnp | grep 8080
```

## Permissions

```bash
chmod 755 deploy.sh
chown ubuntu:ubuntu app.log
sudo systemctl restart nginx
```

## Practical Combinations

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
