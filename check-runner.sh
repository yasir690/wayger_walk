#!/bin/bash
# GitHub Actions Runner Health Check Script

echo "=========================================="
echo "GitHub Actions Runner Health Check"
echo "=========================================="
echo ""

# Check if runner directory exists
RUNNER_DIR="${HOME}/actions-runner"
if [ ! -d "$RUNNER_DIR" ]; then
    echo "❌ Runner directory not found at: $RUNNER_DIR"
    echo "   Please update RUNNER_DIR in this script if runner is installed elsewhere"
    exit 1
fi

echo "✅ Runner directory found: $RUNNER_DIR"
echo ""

# Check if Runner.Listener process is running
if pgrep -f "Runner.Listener" > /dev/null; then
    echo "✅ Runner.Listener process is RUNNING"
    ps aux | grep Runner.Listener | grep -v grep
else
    echo "❌ Runner.Listener process is NOT RUNNING"
    echo ""
    echo "To start the runner:"
    echo "  cd $RUNNER_DIR"
    echo "  ./run.sh"
    echo ""
    echo "Or if installed as a service:"
    echo "  sudo systemctl start actions.runner.*.service"
fi
echo ""

# Check systemd service status (if exists)
if systemctl list-unit-files | grep -q "actions.runner"; then
    echo "=== Systemd Service Status ==="
    systemctl status actions.runner.*.service --no-pager -l || true
    echo ""
fi

# Check recent logs
echo "=== Recent Runner Logs (last 20 lines) ==="
if [ -d "$RUNNER_DIR/_diag" ]; then
    LATEST_LOG=$(ls -t "$RUNNER_DIR/_diag"/Runner_*.log 2>/dev/null | head -1)
    if [ -n "$LATEST_LOG" ]; then
        echo "Log file: $LATEST_LOG"
        tail -20 "$LATEST_LOG"
    else
        echo "No log files found"
    fi
else
    echo "Log directory not found"
fi
echo ""

# Check disk space
echo "=== Disk Space ==="
df -h . | tail -1
echo ""

# Check network connectivity to GitHub
echo "=== Network Connectivity ==="
if curl -s --max-time 5 https://github.com > /dev/null; then
    echo "✅ Can reach GitHub"
else
    echo "❌ Cannot reach GitHub - check network/firewall"
fi
echo ""

# Check if runner is configured
if [ -f "$RUNNER_DIR/.runner" ]; then
    echo "✅ Runner is configured"
    echo "Repository: $(grep -oP '(?<=repositoryUrl":")[^"]*' "$RUNNER_DIR/.runner" 2>/dev/null || echo 'Unknown')"
else
    echo "❌ Runner is not configured"
    echo "   Run: cd $RUNNER_DIR && ./config.sh"
fi
echo ""

echo "=========================================="
echo "Health check complete"
echo "=========================================="

