#!/bin/bash
# =============================================================
# VPS Setup Script - Social Media Blog Platform
# Chạy 1 lần duy nhất trên VPS mới
# Usage: bash setup-vps.sh
# =============================================================
set -e

echo "🚀 Bắt đầu setup VPS..."

# ── 1. Cài Docker ─────────────────────────────────────────────
echo "📦 Cài Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "✅ Docker đã cài xong"
else
  echo "✅ Docker đã có sẵn: $(docker --version)"
fi

# ── 2. Tạo thư mục app ────────────────────────────────────────
echo "📁 Tạo thư mục /opt/socialblog..."
mkdir -p /opt/socialblog
cd /opt/socialblog

# ── 3. Thêm Swap 2GB ─────────────────────────────────────────
echo "💾 Kiểm tra Swap..."
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "✅ Swap 2GB đã tạo"
else
  echo "✅ Swap đã có sẵn"
fi

# ── 4. Tối ưu kernel cho Docker ───────────────────────────────
echo "⚙️  Tối ưu kernel..."
cat >> /etc/sysctl.conf <<EOF
vm.swappiness=10
vm.overcommit_memory=1
EOF
sysctl -p

# ── 5. Mở firewall port 8080 ─────────────────────────────────
echo "🔥 Cấu hình firewall..."
if command -v ufw &> /dev/null; then
  ufw allow 22/tcp    # SSH
  ufw allow 8080/tcp  # API Gateway
  ufw --force enable
  echo "✅ Firewall OK (port 22, 8080 mở)"
fi

echo ""
echo "============================================="
echo "✅ Setup VPS hoàn tất!"
echo ""
echo "Tiếp theo: Thêm các GitHub Secrets sau:"
echo "  VPS_HOST      = $(curl -s ifconfig.me)"
echo "  VPS_USER      = root"
echo "  VPS_SSH_KEY   = (private key SSH của bạn)"
echo "  POSTGRES_USER = blog"
echo "  POSTGRES_PASSWORD = (đặt password mạnh)"
echo "  JWT_PRIVATE_KEY   = (RSA private key)"
echo "  JWT_PUBLIC_KEY    = (RSA public key)"
echo "============================================="
