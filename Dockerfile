# ==============================================================================
# Porto by BanguDevClub - Multi-Target Cross-Platform Containerized Builder
# Base: Official Rust Latest Image (Debian)
# Targets: Linux GLIBC (GNU), Linux MUSL, Windows (x86_64-pc-windows-gnu)
# ==============================================================================

FROM rust:latest AS builder

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js LTS (v22), WebKit2GTK, GTK3, AppIndicator, MinGW (Windows), and MUSL cross tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    build-essential \
    pkg-config \
    libssl-dev \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    patchelf \
    squashfs-tools \
    file \
    musl-tools \
    musl-dev \
    gcc-mingw-w64-x86-64 \
    g++-mingw-w64-x86-64 \
    binutils-mingw-w64 \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22.x LTS
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Add Rust cross-compilation targets
RUN rustup target add \
    x86_64-unknown-linux-gnu \
    x86_64-unknown-linux-musl \
    x86_64-pc-windows-gnu

# Install Tauri v2 CLI for Cargo
RUN cargo install tauri-cli --version "^2.0.0" --locked

# Set working directory
WORKDIR /app

# Copy dependency manifests first for optimal Docker layer caching
COPY package.json package-lock.json* ./
RUN npm install

COPY src-tauri/Cargo.toml src-tauri/Cargo.lock* ./src-tauri/

# Copy full application source code and build script
COPY . .

# Set execute permissions on build script
RUN chmod +x ./build.sh || true

# Create output artifacts directory
RUN mkdir -p /app/dist-artifacts

# Default execution: run the unified multi-target build script
CMD ["./build.sh", "--all"]
