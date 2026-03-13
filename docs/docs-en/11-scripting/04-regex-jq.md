# Regular Expressions and Data Processing (Regex, jq, yq, sed, awk)

> Every day, a DevOps engineer **fights with text data**. You need to find errors in logs, extract values from JSON responses, auto-modify YAML configs, and generate CSV reports. The foundation of all these tasks is **Regular Expressions (Regex)** and **data processing tools (jq, yq, sed, awk)**. Now that you've learned shell basics in [Bash Scripting](./01-bash), let's master the skill of **precisely handling text**.

---

## 🎯 Why Do You Need Regular Expressions and Data Processing?

### Daily Analogy: Librarian's Search Skills

Imagine a massive library with 1 million books.

- **General search** (simple string matching): "Python" → includes "Python Snake Cooking" cookbook
- **Precise search** (regex): Only find "Python as a Programming Language" → exactly what you need
- **Data processing** (jq/sed/awk): Turn results into tables, create statistics, generate reports

DevOps requires this **precise search and data processing** daily.

```
Real-world moments when you need this skill:

• "Extract only 5xx errors from Nginx logs and aggregate by IP"         → grep + awk
• "Extract only instance IDs from AWS CLI JSON response"               → jq
• "Change image tags in 100 K8s manifests at once"                    → yq + sed
• "Mask email addresses in logs and save"                              → sed + regex
• "Analyze access logs and create hourly traffic report"               → awk
• "Parse test results in CI/CD pipeline"                               → grep + regex
• "Replace sensitive info with environment variables in config"        → sed + envsubst
```

### Without Tools vs With Tools

**Without tools** (manual work):
1. Open 10GB log file
2. Scroll with eyes, Ctrl+F repeat
3. Copy error lines, paste to Excel
4. Manual aggregation (2 hours)
5. Report done (but might be wrong)

**With tools** (automation):
1. Log file → grep + regex (filter errors) → awk (extract fields) → sort/uniq -c (auto aggregate) → Report done (30 seconds, accurate)

---

## 🧠 Grasping Core Concepts

### 1. Text Processing Tool Ecosystem

Each text processing tool in DevOps has a different role—like kitchen knives for different purposes.

| Tool | One-liner | Analogy | Main Use Case |
|------|-----------|---------|---------------|
| **Regex** | Text pattern definition language | Search filter syntax | Extract IPs, emails |
| **grep** | Search lines by pattern | "Find lines containing this word" | Find ERROR lines in logs |
| **sed** | Stream editor | "Find and replace" | Bulk modify config files |
| **awk** | Field-based processor | "Process table data" | Aggregate log fields |
| **jq** | JSON processor | "Extract value from JSON" | Parse AWS CLI responses |
| **yq** | YAML processor | "Extract value from YAML" | Modify K8s manifests |
| **xargs** | Argument passer | "Execute this for each item in list" | Bulk process files |

### 2. Unix Philosophy: Data Pipeline Core

```
"Connect small tools that do one thing well with pipes (|)"
```

Real data pipeline example:
```bash
# Nginx log → 5xx errors only → Extract IP → Aggregate → Top 10
cat /var/log/nginx/access.log \
  | grep -E ' (5[0-9]{2}) '    \  # Regex: 5xx status code
  | awk '{print $1}'            \  # awk: Extract first field (IP)
  | sort | uniq -c | sort -rn   \  # Sort + aggregate
  | head -10                        # Top 10
```

---

## 🔍 Understanding Each Topic in Detail

### 1. Regular Expressions: From Basics to Advanced

#### What is Regex?

Regex is a **mini-language for expressing text patterns**. You can express "3 digits - 4 digits" as `\d{3}-\d{4}`.

```bash
# Without regex: Finding phone numbers requires many cases
# "010-1234-5678" and "02-123-4567" have different patterns...

# With regex: One pattern matches all phone numbers
echo "Contact: 010-1234-5678, 02-123-4567" | grep -oE '[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}'
# Output:
# 010-1234-5678
# 02-123-4567
```

#### Basic Metacharacters (Character Classes)

```bash
# === Basic metacharacters ===

.       # Any single character (except newline)
\d      # Single digit [0-9]
\D      # Non-digit [^0-9]
\w      # Word character [a-zA-Z0-9_]
\W      # Non-word character
\s      # Whitespace (space, tab, newline)
\S      # Non-whitespace
\b      # Word boundary

# === Character classes (brackets) ===

[abc]       # a, b, or c
[a-z]       # Lowercase letter
[A-Z]       # Uppercase letter
[0-9]       # Single digit
[a-zA-Z]    # Alphabetic character
[^abc]      # Anything except a, b, c (^ = negation)

# === Position anchors ===

^       # Start of line
$       # End of line
\b      # Word boundary
```

#### Quantifiers (How Many Times)

```bash
a       # Exactly one 'a'
a*      # Zero or more 'a'
a+      # One or more 'a'
a?      # Zero or one 'a'
a{3}    # Exactly 3 'a'
a{3,}   # 3 or more 'a'
a{3,5}  # 3 to 5 'a'
```

### 2. grep — Pattern Search

```bash
# Basic search
grep "error" /var/log/syslog

# Common options
grep -i "error"                 # Case insensitive
grep -n "error"                 # Show line numbers
grep -c "error"                 # Count matching lines
grep -r "TODO" /opt/app/        # Recursive search
grep -v "debug"                 # Invert (exclude)
grep -l "password" /etc/*.conf  # Show filenames only
grep -A 3 "error"               # Match + 3 lines after
grep -B 2 "error"               # Match + 2 lines before
grep -C 2 "error"               # Match + 2 before and after

# Extended regex (-E or egrep)
grep -E "error|warning|critical"
grep -E "^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}"
```

### 3. sed — Stream Editor

```bash
# Basic substitution: s/find/replace/
sed 's/old/new/' file.txt         # First on each line
sed 's/old/new/g' file.txt        # All occurrences
sed -i 's/old/new/g' file.txt     # Modify in-place
sed -i.bak 's/old/new/g' file.txt # Backup then modify

# Delete lines
sed '/^#/d' config.txt            # Delete comment lines
sed '/^$/d' config.txt            # Delete empty lines
sed '1,5d' config.txt             # Delete lines 1-5

# Add/insert lines
sed '3a\new line' file.txt        # Add after line 3
sed '3i\new line' file.txt        # Insert before line 3

# Real examples
sed -i 's/worker_processes.*/worker_processes 4;/' /etc/nginx/nginx.conf
sed -i "s/server_name .*/server_name ${NEW_DOMAIN};/" /etc/nginx/conf.d/app.conf
sed -e 's/foo/bar/g' -e 's/baz/qux/g' file.txt
```

### 4. awk — Field-based Text Processor

```bash
# Basic: access fields separated by whitespace
# $1 = first field, $2 = second, ... $NF = last field, $0 = entire line
echo "hello world bash" | awk '{print $2}'     # world

# Specify delimiter (-F)
awk -F: '{print $1}' /etc/passwd               # Username only

# Conditional output
awk '$3 > 1000 {print $1}' /etc/passwd
df -h | awk 'NR>1 {gsub(/%/,""); if($5>80) print $6, $5"%"}'

# Calculations
awk '{sum += $1} END {print "Total:", sum}' numbers.txt
awk '{sum += $1; count++} END {print "Average:", sum/count}' numbers.txt

# Built-in variables: NR (line number), NF (field count), FS/OFS
awk 'NR >= 10 && NR <= 20' file.txt       # Lines 10-20
awk '{print NR": "$0}' file.txt            # Add line numbers

# Real examples: Nginx log analysis
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10  # Top IPs
awk '{print $9}' access.log | sort | uniq -c | sort -rn             # Status codes
awk '{sum += $NF; count++} END {printf "Average: %.3f\n", sum/count}' access.log
```

### 5. jq — JSON Processing

```bash
# Extract field
echo '{"name":"web-server","replicas":3}' | jq '.name'

# Extract array element
echo '[1,2,3,4,5]' | jq '.[0]'

# Complex filtering
aws ec2 describe-instances | jq '.Reservations[].Instances[] | {id:.InstanceId, type:.InstanceType}'

# Select with conditions
jq '.[] | select(.status == "running")'

# Array operations
jq '[.[] | select(.replicas > 1)]'
jq 'map(.name)'
jq 'group_by(.app)'
```

### 6. yq — YAML Processing

```bash
# Read value
yq '.spec.replicas' deployment.yaml

# Modify value
yq '.spec.replicas = 5' deployment.yaml

# Bulk modify
yq '.spec.template.spec.containers[].image = "nginx:latest"' *.yaml

# Filter
yq '.spec.containers[] | select(.name == "app")'
```

---

## 💻 Practice

### Exercise: Log Analysis Pipeline

```bash
# Task: Analyze Nginx access log, find top 10 attacking IPs (5xx responses)

cat /var/log/nginx/access.log | \
  grep -oE ' (5[0-9]{2}) ' | \
  awk '{print $1}' | \
  sort | uniq -c | sort -rn | \
  head -10
```

---

## 📝 Summary

### Tool Selection Flowchart

```
Do I need to...?

Search/filter by pattern? → grep (+ regex)
Replace text? → sed
Process structured text (log fields)? → awk
Parse JSON? → jq
Parse YAML? → yq
Execute for each item in list? → xargs
```

### Regex Quick Reference

```
\d      Single digit
\w      Word character
[0-9]+  One or more digits
^start  Line start
end$    Line end
```

---

## 🔗 Next Steps

Master these tools by using them daily. Start with grep, then add sed, then awk. Practice building pipelines that solve real problems. The more you use them, the faster and more precise you'll become.

> **Pro Tip**: Always test your regex on a small sample first before running on huge log files. Use `grep -oE pattern` to test regex patterns in isolation.
