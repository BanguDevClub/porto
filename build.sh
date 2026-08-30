#!/usr/bin/env bash
# ==============================================================================
# Porto by BanguDevClub — Cross-Platform Multi-Target Build Orchestrator
# Builds Linux GLIBC (GNU), Linux MUSL, and Windows (x86_64) binaries and bundles
# ==============================================================================

set -euo pipefail

# Output colors
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
CYAN="\033[0;36m"
RED="\033[0;31m"
NC="\033[0m"

DIST_DIR="${DIST_DIR:-./dist-artifacts}"
mkdir -p "${DIST_DIR}"

BUILD_GNU=true
BUILD_MUSL=true
BUILD_WINDOWS=true

# Parse command line flags if specified
while [[ $# -gt 0 ]]; do
  case "$1" in
    --linux-gnu|--gnu)
      BUILD_GNU=true
      BUILD_MUSL=false
      BUILD_WINDOWS=false
      shift
      ;;
    --linux-musl|--musl)
      BUILD_GNU=false
      BUILD_MUSL=true
      BUILD_WINDOWS=false
      shift
      ;;
    --windows|--win)
      BUILD_GNU=false
      BUILD_MUSL=false
      BUILD_WINDOWS=true
      shift
      ;;
    --all)
      BUILD_GNU=true
      BUILD_MUSL=true
      BUILD_WINDOWS=true
      shift
      ;;
    -h|--help)
      echo "Usage: ./build.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --all         Build for all targets (Linux GNU, Linux MUSL, Windows) [Default]"
      echo "  --linux-gnu   Build Linux GNU (GLIBC) binary & Tauri bundles (.deb, AppImage)"
      echo "  --linux-musl  Build Linux MUSL static binary"
      echo "  --windows     Cross-compile Windows x86_64 binary (.exe)"
      echo "  -h, --help    Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

echo -e "${CYAN}==============================================================================${NC}"
echo -e "${CYAN}🚀  Porto by BanguDevClub — Multi-Target Build Pipeline${NC}"
echo -e "${CYAN}==============================================================================${NC}"

# 1. Compile Frontend Assets
echo -e "\n${BLUE}📦 Step 1: Compiling Frontend (Svelte 5 + Vite)...${NC}"
npm install
npm run build
echo -e "${GREEN}✓ Frontend compiled successfully.${NC}"

# 2. Build Linux GLIBC (GNU) target
if [ "${BUILD_GNU}" = true ]; then
  echo -e "\n${BLUE}🐧 Step 2: Building Linux GNU (GLIBC) [x86_64-unknown-linux-gnu]...${NC}"
  cargo tauri build --target x86_64-unknown-linux-gnu || {
    echo -e "${YELLOW}Falling back to direct cargo release build for Linux GNU...${NC}"
    cargo build --release --target x86_64-unknown-linux-gnu --manifest-path src-tauri/Cargo.toml
  }

  # Copy GNU outputs
  if [ -d "src-tauri/target/x86_64-unknown-linux-gnu/release/bundle" ]; then
    mkdir -p "${DIST_DIR}/bundle"
    cp -r src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/* "${DIST_DIR}/bundle/" 2>/dev/null || true
  elif [ -d "src-tauri/target/release/bundle" ]; then
    mkdir -p "${DIST_DIR}/bundle"
    cp -r src-tauri/target/release/bundle/* "${DIST_DIR}/bundle/" 2>/dev/null || true
  fi

  if [ -f "src-tauri/target/x86_64-unknown-linux-gnu/release/porto" ]; then
    cp "src-tauri/target/x86_64-unknown-linux-gnu/release/porto" "${DIST_DIR}/porto-linux-x86_64-gnu"
  elif [ -f "src-tauri/target/release/porto" ]; then
    cp "src-tauri/target/release/porto" "${DIST_DIR}/porto-linux-x86_64-gnu"
  fi
  echo -e "${GREEN}✓ Linux GNU build completed.${NC}"
fi

# 3. Build Linux MUSL target
if [ "${BUILD_MUSL}" = true ]; then
  echo -e "\n${BLUE}🐧 Step 3: Building Linux MUSL Target [x86_64-unknown-linux-musl]...${NC}"
  export PKG_CONFIG_ALLOW_CROSS=1
  export RUSTFLAGS="-C target-feature=-crt-static -C link-arg=-lm"
  cargo build --release --target x86_64-unknown-linux-musl --manifest-path src-tauri/Cargo.toml || {
    echo -e "${YELLOW}Warning: MUSL build encountered an issue, skipping...${NC}"
  }
  unset RUSTFLAGS

  if [ -f "src-tauri/target/x86_64-unknown-linux-musl/release/porto" ]; then
    cp "src-tauri/target/x86_64-unknown-linux-musl/release/porto" "${DIST_DIR}/porto-linux-x86_64-musl"
    echo -e "${GREEN}✓ Linux MUSL build completed: ${DIST_DIR}/porto-linux-x86_64-musl${NC}"
  fi
fi

# 4. Cross-compile Windows target
if [ "${BUILD_WINDOWS}" = true ]; then
  echo -e "\n${BLUE}🪟 Step 4: Cross-compiling Windows Binary [x86_64-pc-windows-gnu]...${NC}"
  export CC_x86_64_pc_windows_gnu=x86_64-w64-mingw32-gcc
  export CXX_x86_64_pc_windows_gnu=x86_64-w64-mingw32-g++
  export CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER=x86_64-w64-mingw32-gcc

  cargo build --release --target x86_64-pc-windows-gnu --manifest-path src-tauri/Cargo.toml || {
    echo -e "${YELLOW}Warning: Windows MinGW build encountered an issue, skipping...${NC}"
  }

  if [ -f "src-tauri/target/x86_64-pc-windows-gnu/release/porto.exe" ]; then
    cp "src-tauri/target/x86_64-pc-windows-gnu/release/porto.exe" "${DIST_DIR}/porto-windows-x86_64.exe"
    echo -e "${GREEN}✓ Windows build completed: ${DIST_DIR}/porto-windows-x86_64.exe${NC}"
  fi
fi

# 5. Generate SHA256 Checksums
echo -e "\n${BLUE}🔒 Step 5: Generating SHA256 Checksums...${NC}"
cd "${DIST_DIR}"
sha256sum porto-* bundle/*/* 2>/dev/null > SHA256SUMS.txt || sha256sum * > SHA256SUMS.txt 2>/dev/null || true
cd - > /dev/null

# 6. Ensure Host File Permissions
chmod -R a+rwX "${DIST_DIR}" /app/node_modules /app/dist 2>/dev/null || true

echo -e "\n${GREEN}==============================================================================${NC}"
echo -e "${GREEN}✨  Porto Build Pipeline Finished Successfully!${NC}"
echo -e "${GREEN}📁  Artifacts exported to: ${DIST_DIR}${NC}"
echo -e "${GREEN}==============================================================================${NC}"
ls -la "${DIST_DIR}" || true
