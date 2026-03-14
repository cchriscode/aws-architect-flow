# Preparing the Linux Learning Environment

This document explains how to **prepare your environment before starting to learn Linux**.
It covers how to set up a Linux environment for each operating system, install essential tools, and learn basic terminal usage.

Complete all steps in this document before starting the course, and make sure the final verification commands produce the expected output.

---

# 1. Setting Up a Linux Environment by Operating System

To practice Linux commands, you need a Linux environment.
Choose one of the options below based on your current operating system.

---

## 1.1 Windows: Installing WSL2

WSL2 (Windows Subsystem for Linux 2) is the easiest way to run Linux inside Windows.
You can use a Linux terminal directly from Windows without a separate virtual machine.

### System Requirements

* Windows 10 version 2004 or later, or Windows 11
* 64-bit operating system
* Virtualization must be enabled in BIOS (enabled by default on most systems)

### Installation Steps

**Step 1: Run PowerShell as Administrator.**

Search for `PowerShell` in the Start menu and click "Run as administrator".

**Step 2: Run the WSL install command.**

```powershell
wsl --install
```

### Expected Output

```text
Installing: Virtual Machine Platform
Installing: Windows Subsystem for Linux
Installing: Ubuntu
The requested operation is successful. Changes will not be effective until the system is rebooted.
```

**Step 3: Reboot your computer.**

After rebooting, the Ubuntu installation window will appear automatically.

**Step 4: Set your Linux username and password.**

```text
Enter new UNIX username: myuser
New password:
Retype new password:
passwd: password updated successfully
```

### Warning

* Nothing will appear on screen while typing the password. This is normal. Just type it and press Enter.
* It is best to use only lowercase letters for the username. Avoid spaces or non-ASCII characters.

**Step 5: Verify the installed WSL version.**

Run this in PowerShell:

```powershell
wsl --list --verbose
```

### Expected Output

```text
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

If VERSION shows `2`, WSL2 has been installed successfully.

**Step 6: Enter the Ubuntu terminal.**

Search for `Ubuntu` in the Start menu and run it, or enter the following command in PowerShell:

```powershell
wsl
```

### Expected Output

```text
myuser@DESKTOP-XXXXXX:~$
```

If you see this prompt, you have entered the Linux environment.

### Practical Tip

Installing the Windows Terminal app lets you open PowerShell and Ubuntu in multiple tabs simultaneously, which is convenient.
Search for "Windows Terminal" in the Microsoft Store to install it.

---

## 1.2 Mac: Using the Built-in Terminal

macOS is Unix-based, so most Linux commands work in the default terminal.
You can start practicing right away without any additional installation.

### Opening the Terminal

* Press `Cmd + Space` to open Spotlight Search.
* Type `Terminal` and press Enter.

### Installing Homebrew

Homebrew is a package manager for macOS. It serves a similar role to `apt` on Linux.
It is needed for installing tools later, so install it first.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Expected Output (final portion)

```text
==> Installation successful!

==> Homebrew has enabled anonymous aggregate formulae and cask analytics.
==> Next steps:
- Run `brew help` to get started
```

Verify the installation:

```bash
brew --version
```

### Expected Output

```text
Homebrew 4.x.x
```

### Warning

* Homebrew installation may prompt you to install Xcode Command Line Tools. Click "Install" to proceed.
* On Apple Silicon (M1/M2/M3) Macs, you may need to configure PATH after installation. Follow the instructions shown in the installation completion message.

---

## 1.3 Linux: Already Included

If you are already using a Linux distribution such as Ubuntu, CentOS, or Fedora, no additional installation is needed.
Open the terminal and start practicing right away.

* Ubuntu: Open the terminal with `Ctrl + Alt + T`.
* If the terminal opens immediately, you are ready to go.

---

## 1.4 Virtual Machine (VirtualBox + Ubuntu) Installation (Alternative)

Use a virtual machine if WSL2 is not available or if you need a complete Linux environment.

### Installation Steps

1. **Download VirtualBox**: Get the version for your operating system from https://www.virtualbox.org.
2. **Download Ubuntu ISO**: Get the latest LTS version from https://ubuntu.com/download/desktop.
3. **Create a new virtual machine in VirtualBox**:
   * Name: `Ubuntu-Lab`
   * Memory: Minimum 2GB (recommended 4GB)
   * Disk: Minimum 20GB
4. **Attach the ISO file and boot.**
5. **Follow the Ubuntu installation wizard to install.**

### Practical Tip

For learning purposes, WSL2 is much lighter and faster. Use VirtualBox when you need to practice network configuration or require a complete server environment.

---

# 2. Package Update

Once the Linux environment is ready, the first thing to do is update the package list and upgrade installed packages.
This is the foundation for all subsequent installation tasks.

```bash
sudo apt update && sudo apt upgrade -y
```

### Expected Output (partial)

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

### Explanation

* `apt update`: Refreshes the list of available packages to the latest version.
* `apt upgrade -y`: Upgrades installed packages to their latest versions. The `-y` flag automatically answers "Yes" to confirmation prompts.

### Warning

* `sudo` means running the command with administrator privileges. You may be prompted for a password.
* The first run may take several minutes due to the large amount of data to download.

---

# 3. Installing Basic Editors

You will frequently need to edit files in the terminal. Install two basic editors.

## 3.1 Verifying nano Installation

nano is the easiest terminal editor. It is recommended for beginners.

```bash
nano --version
```

### Expected Output

```text
 GNU nano, version 6.2
```

If it is already installed, the version will be displayed as shown above.
If it is not installed, install it with the following command:

```bash
sudo apt install nano -y
```

### Basic nano Usage

Opening a file:

```bash
nano test.txt
```

Once the editor opens, you can start typing text immediately.

* **Save**: `Ctrl + O` (confirm the file name, then press Enter)
* **Exit**: `Ctrl + X`
* **Cut**: `Ctrl + K`
* **Paste**: `Ctrl + U`

### Practical Tip

nano's keyboard shortcuts are always displayed at the bottom of the screen. `^O` means `Ctrl + O`.

---

## 3.2 Verifying vim Installation

vim is the most widely used editor on Linux. It is often pre-installed on servers.

```bash
vim --version | head -n 1
```

### Expected Output

```text
VIM - Vi IMproved 8.2 (2019 Dec 12, compiled ...)
```

If it is not installed:

```bash
sudo apt install vim -y
```

### Basic vim Usage (Minimum Essentials)

```bash
vim test.txt
```

vim has **modes**:

* **Normal mode**: This is the mode when you first open a file. You cannot type text in this mode.
* **Insert mode**: Press `i` to switch to insert mode. You can now type text.
* **Return to normal mode**: Press the `Esc` key.
* **Save and exit**: In normal mode, type `:wq` and press Enter.
* **Exit without saving**: In normal mode, type `:q!` and press Enter.

### Warning

When you first enter vim, it may seem like no keys are working. You must press `i` to switch to insert mode before you can type. If you cannot exit, press `Esc` and then type `:q!`.

---

# 4. Basic Terminal Usage

Knowing a few basic operations will help you use the terminal efficiently.

## 4.1 Copy / Paste

Copy and paste shortcuts in the terminal differ from those in regular applications.

| Environment | Copy | Paste |
|------|------|----------|
| WSL2 / Windows Terminal | `Ctrl + Shift + C` | `Ctrl + Shift + V` |
| Mac Terminal | `Cmd + C` | `Cmd + V` |
| Linux (GNOME Terminal) | `Ctrl + Shift + C` | `Ctrl + Shift + V` |

### Warning

In the terminal, `Ctrl + C` does not copy -- it **stops the currently running command**. To copy, you must use `Ctrl + Shift + C`.

---

## 4.2 Useful Terminal Shortcuts

```text
Ctrl + C      Stop the currently running command
Ctrl + L      Clear the screen (same as clear)
Ctrl + A      Move the cursor to the beginning of the line
Ctrl + E      Move the cursor to the end of the line
Ctrl + R      Search previous commands
Tab           Auto-complete (file names, commands)
Up/Down arrows  Browse previous/next commands
```

### Practical Tip

`Tab` auto-completion is used very frequently. Type part of a file name or command and press `Tab` to auto-complete it.
Press it twice to see a list of possible candidates.

---

## 4.3 Command History

To view previously entered commands:

```bash
history
```

### Expected Output

```text
    1  sudo apt update
    2  sudo apt upgrade -y
    3  nano --version
    4  vim --version
    5  history
```

To re-run a specific command:

```bash
!3
```

This will re-run command number 3 (`nano --version`).

---

# 5. Verifying the SSH Client

SSH will be used to connect to remote servers in later lessons.
Verify that the SSH client is installed.

```bash
ssh -V
```

### Expected Output

```text
OpenSSH_8.9p1 Ubuntu-3ubuntu0.6, OpenSSL 3.0.2 15 Mar 2022
```

If a version number is displayed, the SSH client is installed.

### If Not Installed

```bash
sudo apt install openssh-client -y
```

### Practical Tip

If you are using WSL2 on Windows, SSH is included by default within WSL2.
On Mac, SSH is also pre-installed, so no additional steps are needed.

---

# 6. Final Environment Verification

Once all settings are complete, run the following commands one by one to verify the results.

## 6.1 Checking OS Information

```bash
uname -a
```

### Expected Output

```text
Linux DESKTOP-XXXXXX 5.15.153.1-microsoft-standard-WSL2 #1 SMP x86_64 GNU/Linux
```

If Linux kernel information is displayed, everything is working correctly.

---

## 6.2 Checking the Current User

```bash
whoami
```

### Expected Output

```text
myuser
```

The username you created during WSL installation will be displayed.

---

## 6.3 Checking the Current Shell

```bash
echo $SHELL
```

### Expected Output

```text
/bin/bash
```

If `/bin/bash` or `/bin/zsh` is displayed, everything is normal.

---

## 6.4 Verifying the Package Manager

```bash
apt --version
```

### Expected Output

```text
apt 2.4.11 (amd64)
```

---

## 6.5 Verifying Editors

```bash
nano --version | head -n 1
vim --version | head -n 1
```

### Expected Output

```text
 GNU nano, version 6.2
VIM - Vi IMproved 8.2 (2019 Dec 12, compiled ...)
```

---

## 6.6 Verifying the SSH Client

```bash
ssh -V
```

### Expected Output

```text
OpenSSH_8.9p1 Ubuntu-3ubuntu0.6, OpenSSL 3.0.2 15 Mar 2022
```

---

# 7. All-in-One Verification

The following is a collection of commands to verify all items at once.

```bash
echo "=== OS ===" && uname -a && echo "" && \
echo "=== User ===" && whoami && echo "" && \
echo "=== Shell ===" && echo $SHELL && echo "" && \
echo "=== apt ===" && apt --version && echo "" && \
echo "=== nano ===" && nano --version | head -n 1 && echo "" && \
echo "=== vim ===" && vim --version | head -n 1 && echo "" && \
echo "=== SSH ===" && ssh -V
```

### Expected Output

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

If all items produce normal output, the Linux learning environment setup is complete.

---

# 8. Common Issues and Solutions

## 8.1 "Virtualization is disabled" During WSL Installation

You need to enable the virtualization feature in BIOS.

1. Reboot your computer.
2. Press the BIOS entry key during boot (usually one of `F2`, `F10`, or `Del`).
3. Change the `Virtualization Technology` or `VT-x` option to `Enabled`.
4. Save and reboot.

---

## 8.2 "Could not resolve" Error When Running `sudo apt update`

This is a DNS configuration issue.

```bash
sudo nano /etc/resolv.conf
```

Add or modify the following content:

```text
nameserver 8.8.8.8
nameserver 8.8.4.4
```

Save and try again:

```bash
sudo apt update
```

---

## 8.3 Forgot `sudo` Password in WSL

You can log in as root from PowerShell using the following command:

```powershell
wsl -u root
```

Then reset the password:

```bash
passwd myuser
```

### Expected Output

```text
New password:
Retype new password:
passwd: password updated successfully
```

---

## 8.4 `brew` Command Not Found on Mac

On Apple Silicon Macs, PATH configuration is needed after Homebrew installation.

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Verify after configuration:

```bash
brew --version
```

---

# 9. Next Steps

Once the environment setup is complete, proceed to the next document: the Linux Commands Guide.
That document covers commands needed in practice, such as file management, searching, and process management.

---
