# GitHub Actions Self-Hosted Runner Troubleshooting

## Issue: Workflow is waiting for runner to pick up job

If your workflow shows "Waiting for a runner to pick up this job..." for extended periods, the runner service is likely not running or not connected.

## Quick Fix Steps

### 1. Check if Runner Service is Running

**On Linux (systemd):**
```bash
# Check status
sudo systemctl status actions.runner.*.service

# If not running, start it
sudo systemctl start actions.runner.*.service

# Enable auto-start on boot
sudo systemctl enable actions.runner.*.service
```

**On Linux (manual):**
```bash
# Navigate to runner directory
cd ~/actions-runner  # or wherever you installed it

# Check if process is running
ps aux | grep Runner.Listener

# If not running, start it
./run.sh
```

**On Windows:**
```powershell
# Check service status
Get-Service | Where-Object {$_.Name -like "*actions*"}

# Or check Task Manager for "Runner.Listener.exe"
```

### 2. Verify Runner is Connected to GitHub

1. Go to your repository on GitHub
2. Navigate to: **Settings** → **Actions** → **Runners**
3. Check if your runner shows as:
   - ✅ **Online** (green) - Runner is connected and ready
   - ❌ **Offline** (gray) - Runner is not connected

### 3. Restart the Runner Service

**Linux (systemd):**
```bash
sudo systemctl restart actions.runner.*.service
```

**Linux (manual):**
```bash
cd ~/actions-runner
./run.sh
```

**Windows:**
```powershell
# Restart the service
Restart-Service -Name "actions.runner.*"
```

### 4. Check Runner Logs

**Linux:**
```bash
# View recent logs
tail -f ~/actions-runner/_diag/Runner_*.log

# Or for systemd service
sudo journalctl -u actions.runner.*.service -f
```

**Windows:**
```
# Check logs in:
C:\actions-runner\_diag\Runner_*.log
```

### 5. Reconfigure Runner (if needed)

If the runner is offline and won't connect:

```bash
cd ~/actions-runner
./config.sh remove --token YOUR_TOKEN
./config.sh --url https://github.com/YOUR_USERNAME/YOUR_REPO --token YOUR_TOKEN
```

Get a new token from: **Settings** → **Actions** → **Runners** → **New self-hosted runner**

### 6. Verify Runner Labels

Ensure your runner has the `self-hosted` label:
- Go to **Settings** → **Actions** → **Runners**
- Click on your runner
- Verify it has the `self-hosted` label

### 7. Test Runner Connection

Run this command on your runner machine:
```bash
curl -H "Authorization: token YOUR_PAT" https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/actions/runners
```

## Common Issues

### Issue: Runner shows as "Offline"
**Solution:** The runner service is not running. Start it using the commands above.

### Issue: Runner shows as "Online" but jobs don't start
**Solution:** 
- Check if runner is busy with another job
- Verify runner has correct labels (`self-hosted`)
- Check runner logs for errors

### Issue: Runner keeps disconnecting
**Solution:**
- Check network connectivity
- Verify firewall allows outbound HTTPS to GitHub
- Check if runner machine has enough resources (CPU, memory, disk)

### Issue: Permission errors
**Solution:**
- Ensure runner user has necessary permissions
- For PM2, ensure user can run `sudo npm` or has global npm access
- Check file permissions in the repository directory

## Prevent Future Issues

1. **Set up as a service (Linux):**
   ```bash
   sudo ./svc.sh install
   sudo ./svc.sh start
   sudo ./svc.sh enable
   ```

2. **Monitor runner health:**
   - Set up alerts for runner going offline
   - Monitor runner logs regularly
   - Check GitHub Actions runner status page

3. **Keep runner updated:**
   ```bash
   cd ~/actions-runner
   ./run.sh --update
   ```

## Still Not Working?

1. Check GitHub Actions status: https://www.githubstatus.com/
2. Verify repository settings allow Actions
3. Check if there are any rate limits on your GitHub account
4. Review runner logs for specific error messages

