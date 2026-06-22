# Makefile – builds Rust WASM, compiles Nim → JS, and copies assets

# ---------- CONFIG ----------
CARGO          := cargo
NIM            := nim
RUST_TARGET    := wasm32-unknown-unknown
RUST_DIR       := al67x_physics
NIM_SRC_DIR    := nim
OUT_DIR        := .
# --------------------------------------------------------------

# Default target
all: build

# ---------- BUILD ----------
build: wasm nim-js copy-assets

# 1️⃣ Compile Rust → WASM
wasm:
	@echo "🔨 Building Rust WASM..."
	$(CARGO) build --release --target $(RUST_TARGET) --manifest-path $(RUST_DIR)/Cargo.toml
	@echo "✅ Rust WASM built."

# 2️⃣ Compile Nim → JS
nim-js:
	@echo "🔨 Compiling Nim helpers..."
	$(NIM) c -d:release --js:game_state $(NIM_SRC_DIR)/game_state.nim -o:$(OUT_DIR)/game_state.js
	$(NIM) c -d:release --js:swipe_detector $(NIM_SRC_DIR)/swipe_detector.nim -o:$(OUT_DIR)/swipe_detector.js
	@echo "✅ Nim → JS compiled."

# 3️⃣ Copy the generated WASM glue + assets
copy-assets:
	@echo "📦 Copying WASM glue files..."
	cp $(RUST_DIR)/target/$(RUST_TARGET)/release/al67x_physics.js $(OUT_DIR)/al67x_physics.js
	cp $(RUST_DIR)/target/$(RUST_TARGET)/release/al67x_physics_bg.wasm $(OUT_DIR)/al67x_physics_bg.wasm
	@echo "✅ Assets copied."

# ---------- CLEAN ----------
clean:
	@echo "🧹 Cleaning build artefacts..."
	$(CARGO) clean --manifest-path $(RUST_DIR)/Cargo.toml
	rm -f $(OUT_DIR)/game_state.js $(OUT_DIR)/swipe_detector.js $(OUT_DIR)/al67x_physics.js $(OUT_DIR)/al67x_physics_bg.wasm
	@echo "✅ Clean complete."

.PHONY: all build wasm nim-js copy-assets clean
