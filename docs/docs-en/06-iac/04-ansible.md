# Ansible Complete Guide

> Imagine needing to install Nginx on 100 servers. Would you SSH into each one and run `apt install nginx` 100 times? Ansible is like a **universal remote control that manages hundreds of servers simultaneously** — applying "infrastructure as code" in practice.

---

## 🎯 Why Should You Learn Ansible?

```
Situations where Ansible is needed:

• Install identical packages on 50 servers                    → ansible all -m apt
• Automatically configure new servers                        → Playbook
• Change Nginx config and apply to all servers              → handler + template
• Manage dev/staging/production separately                   → Inventory + group_vars
• Safely manage sensitive info like DB passwords            → Ansible Vault
• Install software on EC2 created by Terraform             → Terraform + Ansible
• Web UI for team to manage automation                      → AWX / Ansible Tower
```

### Ansible vs Terraform

```
Terraform = Architect      → "Build the building" (Provisioning)
                            Create EC2, VPC, RDS
                            Manage infrastructure existence

Ansible   = Interior Designer → "Furnish the building" (Configuration)
                            Install packages, deploy configs, start services
                            Manage server state
```

---

## Core Concepts

### Architecture

```
Control Node (where Ansible runs)
├── Inventory (server list)
├── Playbook (automation script)
├── Roles (reusable modules)
└── Vault (secret management)
    │
    └─→ SSH → Managed Nodes (servers to configure)
```

### Key Features

1. **Agentless** - No agent installation, just SSH
2. **Idempotent** - Running same playbook multiple times produces same result
3. **YAML-based** - Human-readable configuration language
4. **Push model** - Administrator pushes configuration to servers

---

## Installation

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y ansible

# Amazon Linux / RHEL
sudo yum install -y ansible

# Via pip (latest)
pip install ansible

# Verify
ansible --version
```

---

## Inventory Management

Define which servers to manage:

```ini
# inventory.ini
[webservers]
web-01 ansible_host=10.0.1.10
web-02 ansible_host=10.0.1.11
web-03 ansible_host=10.0.1.12

[dbservers]
db-01 ansible_host=10.0.2.10
db-02 ansible_host=10.0.2.11

[webservers:vars]
ansible_user=ubuntu
ansible_ssh_private_key_file=~/.ssh/web-key.pem
http_port=80
```

---

## Ad-hoc Commands

Quick one-liners:

```bash
# Check connection
ansible all -i inventory.ini -m ping

# Run shell command
ansible webservers -i inventory.ini -m shell -a "uptime"

# Install package
ansible webservers -i inventory.ini -m apt -a "name=nginx state=present" --become

# Copy file
ansible webservers -i inventory.ini -m copy -a "src=./file.txt dest=/tmp/"

# Start service
ansible webservers -i inventory.ini -m service -a "name=nginx state=started enabled=yes" --become
```

---

## Playbooks

YAML files defining automation:

```yaml
# site.yml
---
- name: Configure web servers
  hosts: webservers
  become: yes
  vars:
    http_port: 80

  tasks:
    - name: Install Nginx
      apt:
        name: nginx
        state: present

    - name: Start Nginx
      service:
        name: nginx
        state: started
        enabled: yes

    - name: Deploy index.html
      copy:
        src: files/index.html
        dest: /var/www/html/
        mode: '0644'

  handlers:
    - name: Restart Nginx
      service:
        name: nginx
        state: restarted
```

Execute:

```bash
ansible-playbook -i inventory.ini site.yml
```

---

## Roles

Organize playbooks into reusable units:

```
roles/
└── nginx/
    ├── tasks/
    │   └── main.yml
    ├── handlers/
    │   └── main.yml
    ├── templates/
    │   └── nginx.conf.j2
    ├── files/
    │   └── index.html
    ├── defaults/
    │   └── main.yml
    └── meta/
        └── main.yml
```

Create role:

```bash
ansible-galaxy init roles/nginx
```

Usage:

```yaml
---
- name: Deploy web server
  hosts: webservers
  roles:
    - common
    - nginx
    - certbot
```

---

## Variables

Use variables for flexibility:

```yaml
---
- name: Web server setup
  hosts: webservers
  vars:
    web_port: 80
    app_user: deploy

  tasks:
    - name: Create app user
      user:
        name: "{{ app_user }}"
        shell: /bin/bash

    - name: Show system info
      debug:
        msg: "{{ ansible_os_family }} {{ ansible_distribution_version }}"
```

Sources:
- `group_vars/` directory
- `host_vars/` directory
- playbook `vars` section
- `-e` command line
- `ansible_facts` (system info)

---

## Conditionals

Execute tasks conditionally:

```yaml
tasks:
  - name: Install on Ubuntu
    apt:
      name: nginx
    when: ansible_os_family == "Debian"

  - name: Install on CentOS
    yum:
      name: nginx
    when: ansible_os_family == "RedHat"
```

---

## Loops

Repeat tasks:

```yaml
tasks:
  - name: Install packages
    apt:
      name: "{{ item }}"
    loop:
      - nginx
      - git
      - curl
      - docker.io

  - name: Create users
    user:
      name: "{{ item.name }}"
      shell: "{{ item.shell }}"
    loop:
      - { name: 'deploy', shell: '/bin/bash' }
      - { name: 'monitor', shell: '/bin/bash' }
```

---

## Templates (Jinja2)

Generate config files dynamically:

```jinja2
{# templates/nginx.conf.j2 #}
worker_processes {{ nginx_workers | default('auto') }};

http {
    server {
        listen {{ http_port }};
        server_name {{ server_name }};

        root {{ doc_root }};

{% if ssl_enabled %}
        listen 443 ssl;
        ssl_certificate /etc/ssl/certs/server.crt;
{% endif %}

        location / {
            try_files $uri $uri/ =404;
        }
    }
}
```

Usage:

```yaml
tasks:
  - name: Deploy Nginx config
    template:
      src: templates/nginx.conf.j2
      dest: /etc/nginx/nginx.conf
    notify: Restart Nginx
```

---

## Vault (Secret Management)

Encrypt sensitive data:

```bash
# Create encrypted file
ansible-vault create group_vars/dbservers/vault.yml
# Enter password, then add values

# Edit encrypted file
ansible-vault edit group_vars/dbservers/vault.yml

# Run with Vault password
ansible-playbook site.yml --ask-vault-pass

# Or use password file
echo "VaultPassword" > .vault_pass
chmod 600 .vault_pass
ansible-playbook site.yml --vault-password-file .vault_pass
```

---

## Handlers

Trigger actions when configs change:

```yaml
tasks:
  - name: Update Nginx config
    template:
      src: nginx.conf.j2
      dest: /etc/nginx/nginx.conf
    notify: Restart Nginx  # Triggers only if changed

handlers:
  - name: Restart Nginx
    service:
      name: nginx
      state: restarted
```

---

## Terraform + Ansible Integration

Combine infrastructure creation with server configuration:

```hcl
# Terraform creates EC2
resource "aws_instance" "web" {
  count = 3
  ami   = "ami-0c55b159cbfafe1f0"

  tags = {
    Name = "web-${count.index + 1}"
  }
}

# Local exec to run Ansible
resource "null_resource" "ansible" {
  depends_on = [aws_instance.web]

  provisioner "local-exec" {
    command = "ansible-playbook -i '${join(",", aws_instance.web[*].private_ip)},' site.yml"
  }
}
```

---

## AWX / Ansible Tower

Web UI for enterprise Ansible:

- Visual playbook execution
- RBAC (role-based access)
- Inventory sync
- Job scheduling
- Credential management
- Audit logging

---

## Configuration

ansible.cfg for project settings:

```ini
[defaults]
inventory = inventory.ini
remote_user = ubuntu
private_key_file = ~/.ssh/mykey.pem
host_key_checking = False
forks = 20

[privilege_escalation]
become = True
become_method = sudo
become_user = root
```

---

## Key Modules

| Module | Purpose |
|--------|---------|
| `ping` | Test connectivity |
| `shell` | Execute shell commands |
| `apt` / `yum` | Package management |
| `service` | Manage services |
| `copy` | Copy files |
| `template` | Deploy templates |
| `user` | Manage users |
| `file` | Manage files/directories |

---

## Summary

| Concept | Purpose |
|---------|---------|
| Inventory | Define managed servers |
| Playbook | Automation script in YAML |
| Role | Reusable module of tasks |
| Variable | Parameterize configurations |
| Handler | Trigger action on change |
| Vault | Encrypt sensitive data |
| Template | Generate configs dynamically |

---

## Next Steps

Next lecture: **[CloudFormation / CDK / Pulumi](./05-cloudformation-pulumi)** — AWS-native IaC tools

**Related Lectures:**
- [IaC Concept](./01-concept) — Why infrastructure as code matters
- [Terraform Basics](./02-terraform-basics) — HCL and resource management
- [Linux SSH](../01-linux/10-ssh) — SSH configuration
- [Kubernetes](../04-kubernetes/) — K8s bootstrap with Ansible
