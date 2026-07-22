const API_BASE = "/api";

async function apiCall(resource, { id, action, method = "GET", body } = {}) {
  const params = new URLSearchParams({ resource });
  if (id) params.set("id", id);
  if (action) params.set("action", action);
  const res = await fetch(`${API_BASE}?${params.toString()}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error de servidor");
  return data;
}

const Session = {
  save(user) {
    sessionStorage.setItem("capri_user", JSON.stringify(user));
  },
  get() {
    const raw = sessionStorage.getItem("capri_user");
    return raw ? JSON.parse(raw) : null;
  },
  clear() {
    sessionStorage.removeItem("capri_user");
  },
  requireRole(role) {
    const user = this.get();
    if (!user || user.role !== role) {
      window.location.href = "/index.html";
      return null;
    }
    return user;
  },
  requireAnyRole(roles) {
    const user = this.get();
    if (!user || !roles.includes(user.role)) {
      window.location.href = "/index.html";
      return null;
    }
    return user;
  },
};

// Comprime y convierte una imagen a base64 (max 900px de ancho, jpeg 0.6) para no saturar el storage
function compressImage(file, maxWidth = 900, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function money(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
}

function genFolio() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 900 + 100);
  return `CAPRI-${stamp}-${rand}`;
}
