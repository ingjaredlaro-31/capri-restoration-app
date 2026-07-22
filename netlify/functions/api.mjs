import { getStore } from "@netlify/blobs";

// Recursos permitidos = "tablas" de nuestra base de datos en Blobs
const RESOURCES = ["claims", "reports", "estimates", "invoices", "catalog", "users", "logs"];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Siembra datos iniciales la primera vez que se usa la app (usuarios demo + catalogo base)
async function seedIfEmpty() {
  const usersStore = getStore("users");
  const { blobs: existingUsers } = await usersStore.list();
  if (existingUsers.length === 0) {
    const adminPass = await sha256Hex("admin123");
    const tecPass = await sha256Hex("tecnico123");
    await usersStore.setJSON("admin", {
      id: "admin",
      username: "admin",
      passwordHash: adminPass,
      role: "admin",
      name: "Oficina Capri",
    });
    await usersStore.setJSON("tecnico1", {
      id: "tecnico1",
      username: "tecnico1",
      passwordHash: tecPass,
      role: "tecnico",
      name: "Tecnico de Campo",
    });
    const secPass = await sha256Hex("secretaria123");
    await usersStore.setJSON("secretaria1", {
      id: "secretaria1",
      username: "secretaria1",
      passwordHash: secPass,
      role: "secretaria",
      name: "Secretaria",
    });
  }

  const catalogStore = getStore("catalog");
  const { blobs: existingCatalog } = await catalogStore.list();
  if (existingCatalog.length === 0) {
    const items = [
      { desc: "Extraccion de agua (por sq ft)", unit: "sq ft", price: 0.65 },
      { desc: "Deshumidificador (por dia)", unit: "dia", price: 55 },
      { desc: "Turbo secador / air mover (por dia)", unit: "dia", price: 22 },
      { desc: "Demolicion de drywall danado (por sq ft)", unit: "sq ft", price: 2.5 },
      { desc: "Remocion de piso laminado/vinilo (por sq ft)", unit: "sq ft", price: 1.75 },
      { desc: "Remocion de alfombra y padding (por sq ft)", unit: "sq ft", price: 1.1 },
      { desc: "Aplicacion antimicrobial (por sq ft)", unit: "sq ft", price: 0.45 },
      { desc: "Monitoreo de humedad diario (por visita)", unit: "visita", price: 45 },
      { desc: "Contencion / barrera plastica (por linear ft)", unit: "linear ft", price: 3.2 },
      { desc: "Limpieza y desinfeccion final (por sq ft)", unit: "sq ft", price: 0.9 },
      { desc: "Mano de obra general (por hora)", unit: "hora", price: 45 },
      { desc: "Cargo de emergencia / after hours", unit: "servicio", price: 150 },
    ];
    for (let i = 0; i < items.length; i++) {
      await catalogStore.setJSON(`item-${i + 1}`, { id: `item-${i + 1}`, ...items[i] });
    }
  }
}

export default async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });

  const url = new URL(req.url);
  const resource = url.searchParams.get("resource");
  const id = url.searchParams.get("id");
  const action = url.searchParams.get("action");

  if (!resource || !RESOURCES.includes(resource)) {
    return json({ error: "Recurso invalido" }, 400);
  }

  await seedIfEmpty();

  // Login: valida usuario/password contra el store de usuarios
  if (resource === "users" && action === "login") {
    const body = await req.json();
    const store = getStore("users");
    const user = await store.get(body.username, { type: "json" });
    if (!user) return json({ error: "Usuario no encontrado" }, 401);
    const hash = await sha256Hex(body.password);
    if (hash !== user.passwordHash) return json({ error: "Contrasena incorrecta" }, 401);
    const { passwordHash, ...safeUser } = user;
    return json(safeUser);
  }

  // Login de cliente: por folio + ultimos 4 digitos de telefono
  if (resource === "claims" && action === "client-login") {
    const body = await req.json();
    const store = getStore("claims");
    const claim = await store.get(body.folio, { type: "json" });
    if (!claim) return json({ error: "Folio no encontrado" }, 404);
    const last4 = (claim.client_phone || "").replace(/\D/g, "").slice(-4);
    if (last4 !== (body.phoneLast4 || "").replace(/\D/g, "")) {
      return json({ error: "Los ultimos 4 digitos no coinciden" }, 401);
    }
    return json(claim);
  }

  const store = getStore(resource);

  if (req.method === "GET") {
    if (id) {
      const item = await store.get(id, { type: "json" });
      if (!item) return json({ error: "No encontrado" }, 404);
      return json(item);
    }
    const { blobs } = await store.list();
    const items = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
    return json(items.filter(Boolean));
  }

  if (req.method === "POST") {
    const body = await req.json();
    const newId = body.id || crypto.randomUUID();
    body.id = newId;
    body.created_at = body.created_at || new Date().toISOString();
    await store.setJSON(newId, body);
    return json(body, 201);
  }

  if (req.method === "PUT") {
    if (!id) return json({ error: "Falta id" }, 400);
    const existing = await store.get(id, { type: "json" });
    const body = await req.json();
    const updated = { ...existing, ...body, id, updated_at: new Date().toISOString() };
    await store.setJSON(id, updated);
    return json(updated);
  }

  if (req.method === "DELETE") {
    if (!id) return json({ error: "Falta id" }, 400);
    await store.delete(id);
    return json({ deleted: true });
  }

  return json({ error: "Metodo no permitido" }, 405);
};
