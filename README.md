# CAPRI Restoration Services - Control Total (Reporte a Factura)

App de control de proyectos para Capri: el tecnico manda su reporte con fotos, la oficina arma el estimado con el catalogo de precios y genera la factura en PDF, y el cliente puede ver el status de su caso en linea.

## Que incluye

- `public/index.html` — login con 3 roles: Tecnico, Oficina (admin), Cliente
- `public/tecnico.html` — el tecnico crea el reporte de dano (fotos, descripcion, categoria de agua IICRC)
- `public/admin.html` — panel de oficina: ve todos los casos, arma el estimado desde el catalogo, aprueba, genera factura en PDF, marca pagos
- `public/cliente.html` — el cliente entra con folio + ultimos 4 digitos de su telefono, ve el avance de su caso y su factura
- `netlify/functions/api.mjs` — backend (Netlify Function) que guarda todo en **Netlify Blobs** (no necesitas contratar base de datos externa)

## Flujo del sistema

```
Tecnico llena reporte (fotos + descripcion)
        |
Oficina arma estimado con catalogo de precios
        |
Cliente ve el estimado -> Oficina lo marca "aprobado"
        |
Oficina genera factura (PDF descargable)
        |
Oficina marca "pagado" cuando se cobra
```

## Como subirlo a tu proyecto "classy-beignet-607e5f"

Como ya tienes ese proyecto conectado a un repo de GitHub, la forma mas facil es:

1. Clona o abre tu repo local del proyecto (el mismo que esta conectado a Netlify).
2. Copia estas carpetas y archivos dentro del repo, reemplazando lo que ya tengas de `public/` si aplica:
   - `public/` (todas las paginas .html, `css/`, `js/`)
   - `netlify/functions/api.mjs`
   - `netlify.toml`
   - `package.json` (o agrega la dependencia `@netlify/blobs` a tu package.json existente)
3. Haz commit y push a GitHub:
   ```
   git add .
   git commit -m "Sistema de control Capri: reporte a factura"
   git push
   ```
4. Netlify va a detectar el push y desplegar automaticamente (ya que tu proyecto ya esta conectado a GitHub, como se ve en tu dashboard).
5. Netlify Blobs se activa automaticamente, no necesitas configurar nada extra ni variables de entorno.

## Usuarios de prueba (se crean solos la primera vez que se usa la app)

- **Oficina/Admin:** usuario `admin`, contrasena `admin123`
- **Tecnico:** usuario `tecnico1`, contrasena `tecnico123`

**IMPORTANTE:** cambia estas contrasenas antes de usarlo en produccion real (puedo ayudarte a agregar una pantalla de "cambiar contrasena" o agregar mas tecnicos/usuarios cuando quieras).

## Catalogo de precios

Se siembra un catalogo basico de 12 items (extraccion de agua, deshumidificadores, demolicion, etc.) la primera vez que se usa. Si ya tienes tu catalogo de 110+ items de la app anterior (CAPRI JR CLAIMS), lo podemos importar directo — mandamelo en un Excel o dime los items y te armo el script de carga.

## Siguientes pasos sugeridos

- Importar tu catalogo completo de precios existente
- Agregar mas tecnicos desde un panel de administracion de usuarios
- Notificaciones por WhatsApp/email cuando cambia el status de un caso
- Firma digital del cliente al aprobar el estimado
