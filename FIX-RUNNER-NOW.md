# 🚨 URGENT: Fix Your GitHub Actions Runner

## The Problem
Your workflow is waiting because **the runner service on your server is NOT running**.

## ⚡ IMMEDIATE ACTION REQUIRED

### Step 1: SSH into Your Server
```bash
ssh your-username@your-server-ip
```

### Step 2: Check Runner Status
```bash
# Check if runner process is running
ps aux | grep Runner.Listener

# OR check systemd service
sudo systemctl status actions.runner.*.service
```

### Step 3: Start the Runner

**If installed as a systemd service:**
```bash
sudo systemctl start actions.runner.*.service
sudo systemctl enable actions.runner.*.service  # Auto-start on boot
sudo systemctl status actions.runner.*.service  # Verify it's running
```

**If running manually:**
```bash
cd ~/actions-runner  # or wherever you installed it
./run.sh
```

### Step 4: Verify in GitHub
1. Go to: https://github.com/yasir690/wayger_walk/settings/actions/runners
2. Your runner should show as **🟢 Online** (green)
3. If it shows **⚪ Offline** (gray), the service isn't running

### Step 5: Test the Workflow
Once the runner is online, your workflow should start immediately!

---

## 🔍 Find Your Runner Directory

If you don't know where the runner is installed:

```bash
# Search for runner directory
find /home -name "actions-runner" -type d 2>/dev/null
find /opt -name "actions-runner" -type d 2>/dev/null
find /var -name "actions-runner" -type d 2>/dev/null

# Or search for the runner executable
find / -name "run.sh" -path "*/actions-runner/*" 2>/dev/null
```

---

## 📋 Quick Diagnostic Commands

Run these on your server to diagnose:

```bash
# 1. Check if runner process exists
pgrep -f Runner.Listener && echo "✅ Runner is running" || echo "❌ Runner is NOT running"

# 2. Check systemd services
systemctl list-units | grep actions

# 3. Check recent logs
find ~ -name "Runner_*.log" -path "*/_diag/*" -exec tail -20 {} \; 2>/dev/null

# 4. Check network connectivity
curl -s https://github.com > /dev/null && echo "✅ Can reach GitHub" || echo "❌ Cannot reach GitHub"
```

---

## 🛠️ If Runner Doesn't Exist

If you haven't set up a runner yet, you need to:

1. **Download and install runner:**
   ```bash
   mkdir actions-runner && cd actions-runner
   curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
   tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
   ```

2. **Configure runner:**
   - Go to: https://github.com/yasir690/wayger_walk/settings/actions/runners
   - Click "New self-hosted runner"
   - Copy the configuration command
   - Run it on your server

3. **Install as service (recommended):**
   ```bash
   sudo ./svc.sh install
   sudo ./svc.sh start
   sudo ./svc.sh enable
   ```

---

## ⚠️ IMPORTANT NOTES

- **The workflow file is correct** - the issue is the runner service not running
- **You must SSH into your server** - this cannot be fixed from your local machine
- **The runner must be online** for workflows to start
- **Once the runner is online, your workflow will start immediately**

---

## 📞 Still Having Issues?

1. Check runner logs: `tail -f ~/actions-runner/_diag/Runner_*.log`
2. Verify GitHub Actions is enabled in repository settings
3. Check if there are any firewall rules blocking GitHub
4. Ensure the server has internet connectivity

