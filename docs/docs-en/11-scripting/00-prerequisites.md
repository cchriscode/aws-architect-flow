# Preparing the Scripting Learning Environment

> The scripting course covers three languages: Bash, Python, and Go. Each serves a different role, and all three are actively used in real-world DevOps environments. This document walks you through setting up the development environment for all three languages and preparing the auxiliary tools needed for exercises.

---

## Prerequisites

```
Required prerequisite knowledge:

[01-linux]  Basic Linux commands   -> Terminal usage, file/directory manipulation, permission management
```

The scripting course assumes you are familiar with basic Linux commands. If you are not comfortable with basic commands like `cd`, `ls`, `cat`, `chmod`, and `grep`, complete [01-linux](../01-linux/00-linux-commands) first.

---

## 1. Verifying the Bash Environment

Bash rarely needs to be installed separately. It is included by default on Linux and Mac. On Windows, you can use WSL2 or Git Bash.

### Linux / Mac

```bash
bash --version
```

### Expected output

```text
GNU bash, version 5.2.21(1)-release (x86_64-pc-linux-gnu)
Copyright (C) 2022 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
```

### Windows users

There are two ways to use Bash on Windows.

#### Method 1: WSL2 (Recommended)

WSL2 runs a real Linux environment inside Windows. You can use not just Bash but the entire suite of Linux tools, making it the best approach for DevOps learning.

```powershell
# Run PowerShell as Administrator
wsl --install
```

After installation and a reboot, Ubuntu is installed by default. Set up a username and password, and you are done.

```powershell
# Verify installation
wsl --list --verbose
```

### Expected output

```text
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

Check the Bash version inside the WSL2 terminal.

```bash
bash --version
```

#### Method 2: Git Bash

Installing Git for Windows includes Git Bash. It is sufficient for simple Bash script exercises, but Linux tools are limited.

- Download: https://git-scm.com/download/win
- During installation, make sure to check the "Git Bash Here" option.

### Notes

- **WSL2 is strongly recommended.** Git Bash does not support some Linux commands (e.g., `apt`, `systemctl`).
- Inside WSL2, the environment is identical to Linux, so you can follow the Linux installation instructions for everything that follows.

---

## 2. Installing Python 3

Python is used for complex tasks such as API calls, data processing, and automation scripts. Install **Python 3.10 or later**.

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

Choose one of the two methods below.

#### Method 1: Download from python.org

1. Go to https://www.python.org/downloads/
2. Download the latest Python 3.x version
3. During installation, check **"Add Python to PATH"** (important!)
4. Click "Install Now"

#### Method 2: Microsoft Store

Search for "Python" in the Windows search bar and install it from the Microsoft Store. This method automatically configures PATH, which is convenient.

### Verify installation

```bash
python3 --version
```

### Expected output

```text
Python 3.12.4
```

```bash
pip3 --version
```

### Expected output

```text
pip 24.0 from /usr/lib/python3/dist-packages/pip (python 3.12)
```

### Notes

- On Windows, you may need to use `python` instead of `python3`.
- On Mac, `python` may point to the system Python (2.x). Always use `python3`.

---

### Setting up a Python virtual environment

To manage dependencies independently for each Python project, you should use a virtual environment (venv). This approach will be used consistently throughout the exercises.

```bash
# Create a virtual environment
python3 -m venv myenv

# Activate the virtual environment
source myenv/bin/activate
```

### Expected output (the prompt changes)

```text
(myenv) user@hostname:~$
```

When `(myenv)` appears before the prompt, the virtual environment is active.

```bash
# Verify package installation inside the virtual environment
pip install requests
python -c "import requests; print(requests.__version__)"
```

### Expected output

```text
2.32.3
```

```bash
# Deactivate the virtual environment
deactivate
```

### Practical tips

- It is best to create a separate virtual environment for each project. Mixing dependencies leads to "it works on my machine..." problems.
- Manage dependencies with `requirements.txt`: `pip freeze > requirements.txt`
- Add the virtual environment folder (`myenv/`) to `.gitignore`. Do not commit it to Git.

---

## 3. Installing Go

Go is used for building CLI tools, system utilities, and scripts that require high performance. Core DevOps tools like Kubernetes, Docker, and Terraform are built in Go, so knowing Go allows you to read their source code as well.

### Linux

```bash
# Download the latest version (check the version number at https://go.dev/dl/)
wget https://go.dev/dl/go1.22.5.linux-amd64.tar.gz

# Remove any existing Go installation and install
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.22.5.linux-amd64.tar.gz

# Add Go to PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export PATH=$PATH:$(go env GOPATH)/bin' >> ~/.bashrc
source ~/.bashrc
```

### Mac

```bash
brew install go
```

### Windows

1. Download the Windows MSI installer from https://go.dev/dl/
2. Follow the installation wizard (default path: `C:\Program Files\Go`)
3. Open a new terminal after installation for PATH changes to take effect

### Verify installation

```bash
go version
```

### Expected output

```text
go version go1.22.5 linux/amd64
```

### Check GOPATH

```bash
go env GOPATH
```

### Expected output

```text
/home/user/go
```

### If GOPATH is not set

```bash
# Add to ~/.bashrc or ~/.zshrc
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin
```

```bash
source ~/.bashrc
```

### Quick test

```bash
mkdir -p ~/go-test && cd ~/go-test
```

Create a `main.go` file.

```go
package main

import "fmt"

func main() {
    fmt.Println("Go installation complete!")
}
```

```bash
go run main.go
```

### Expected output

```text
Go installation complete!
```

### Practical tips

- Binaries installed with `go install` are saved in `$GOPATH/bin`. This path must be included in your PATH.
- To use the Go module system, initialize your project with `go mod init`.

---

## 4. Installing jq (JSON Processing)

jq is a tool for parsing and filtering JSON data on the command line. It is used extensively in DevOps for processing API responses, modifying configuration files, and more.

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
# Using Chocolatey
choco install jq

# Or using Scoop
scoop install jq
```

### Verify installation

```bash
jq --version
```

### Expected output

```text
jq-1.7.1
```

### Simple usage examples

```bash
# Parse a JSON string
echo '{"name": "devops", "level": 1}' | jq '.name'
```

### Expected output

```text
"devops"
```

```bash
# Extract a specific field from an API response
echo '[{"id":1,"name":"ServerA"},{"id":2,"name":"ServerB"}]' | jq '.[].name'
```

### Expected output

```text
"ServerA"
"ServerB"
```

### Practical tips

- Combined with `curl`, you can process API responses directly: `curl -s https://api.example.com/data | jq '.results[]'`
- Use the `-r` option to output without quotes: `echo '{"name":"devops"}' | jq -r '.name'` outputs `devops`

---

## 5. Installing yq (YAML Processing, Optional)

yq is a tool for parsing and modifying YAML files on the command line. It is useful in DevOps environments that heavily use YAML, such as Kubernetes manifests, Docker Compose, and Ansible.

### Linux

```bash
# Using snap
sudo snap install yq

# Or direct binary download
wget https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 -O /usr/local/bin/yq
chmod +x /usr/local/bin/yq
```

### Mac

```bash
brew install yq
```

### Verify installation

```bash
yq --version
```

### Expected output

```text
yq (https://github.com/mikefarah/yq/) version v4.44.2
```

### Simple usage example

```bash
echo "name: devops
level: 1
tools:
  - docker
  - kubernetes" | yq '.tools[]'
```

### Expected output

```text
docker
kubernetes
```

### Notes

- There are multiple versions of yq. Install **mikefarah/yq**. There is also a Python-based version called `kislyuk/yq`, which has different syntax.
- Installing with `pip install yq` installs the kislyuk version. Do not confuse the two.

---

## 6. VS Code + Extensions

VS Code is an editor that supports all three languages. By installing extensions, you get code autocompletion, syntax checking, and debugging capabilities.

### Installing VS Code

- Download: https://code.visualstudio.com/

### Required extensions

Open VS Code and click the Extensions icon in the left sidebar, or press `Ctrl+Shift+X`.

| Extension | Search term | Purpose |
|-----------|-------------|---------|
| **Python** | `ms-python.python` | Python autocompletion, debugging, linting |
| **Go** | `golang.go` | Go autocompletion, debugging, testing |
| **ShellCheck** | `timonwong.shellcheck` | Bash script syntax checking |
| **YAML** | `redhat.vscode-yaml` | YAML syntax checking, autocompletion |

### Install from the command line

```bash
code --install-extension ms-python.python
code --install-extension golang.go
code --install-extension timonwong.shellcheck
code --install-extension redhat.vscode-yaml
```

### Practical tips

- Install the **Remote - WSL** extension for VS Code to directly edit files inside WSL2 from VS Code. Highly recommended for Windows users.
- When you first install the Go extension, an "Install All" prompt will appear. Install everything. This includes development tools like `gopls` and `dlv`.

---

## 7. Installing ShellCheck (Bash Syntax Checker)

ShellCheck is a tool that catches syntax errors, potential bugs, and style issues in Bash scripts. When used together with the VS Code extension, it provides real-time checking.

### Linux (Ubuntu/Debian)

```bash
sudo apt install -y shellcheck
```

### Mac

```bash
brew install shellcheck
```

### Verify installation

```bash
shellcheck --version
```

### Expected output

```text
ShellCheck - shell script analysis tool
version: 0.9.0
license: GNU General Public License, version 3
website: https://www.shellcheck.net
```

### Usage example

Create a `test.sh` file with the following content.

```bash
#!/bin/bash
echo $greeting
name = "devops"
```

```bash
shellcheck test.sh
```

### Expected output

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

### Practical tips

- Always run ShellCheck before committing scripts. Integrating it into your CI/CD pipeline is even better.
- An online version is also available: https://www.shellcheck.net/ (check scripts directly in the browser)
- To suppress a specific warning, add a `# shellcheck disable=SC2086` comment to the script.

---

## Final Environment Verification Checklist

Run all the following commands at once to verify that everything is installed correctly.

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
yq --version 2>/dev/null || echo "yq not installed (optional, so this is fine)"
```

### Expected output

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

### Notes

- Version numbers may differ depending on when you installed them. As long as the commands execute successfully, you are fine.
- Windows users should run the commands above inside a WSL2 terminal.
- For Python, use either `python3` or `python` depending on your environment.

---

## Troubleshooting

### Python: "command not found"

```bash
# If Python is installed under a different name
which python3 || which python

# If not in PATH (Linux)
sudo apt install -y python3

# If installed via brew on Mac
brew link python3
```

### Go: "go: command not found"

```bash
# Check PATH
echo $PATH | tr ':' '\n' | grep go

# Add Go to PATH if missing
export PATH=$PATH:/usr/local/go/bin
source ~/.bashrc
```

### ShellCheck: "shellcheck: command not found"

```bash
# Update package list and retry
sudo apt update && sudo apt install -y shellcheck

# Alternative: install via snap
sudo snap install shellcheck
```

### WSL2: "wsl --install" fails

```powershell
# Manually enable Windows features (Administrator PowerShell)
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Reboot and try again
wsl --install
```

---

## Next Steps

Once your environment is ready, start learning from [Bash Scripting](./01-bash). We begin with creating basic automation scripts in Bash.
