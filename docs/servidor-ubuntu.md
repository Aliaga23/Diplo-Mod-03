# Servidor Ubuntu: instalación a mano y pipeline

En la versión 1 todo se instala **a mano** en **un** servidor Ubuntu (sección 3 del documento).
Esta guía va en orden. Cada bloque indica dónde se ejecuta: **[PC]** es PowerShell en Windows y **[VM]** es
la terminal de la VM.

| Ruta en la VM | Contenido |
|---|---|
| `/opt/entradasya/<servicio>` | Código o binario de cada servicio (lo actualiza el pipeline) |
| `/etc/entradasya/<servicio>.env` | Variables de entorno y secretos de cada servicio (no se versiona) |
| `/var/lib/entradasya/tickets` | PDFs de las entradas (carpeta local de tickets) |
| `/var/www/entradasya` | Web compilada que sirve Nginx |

## 1. Crear la VM [PC]

```powershell
winget install --exact --id Canonical.Multipass
multipass launch 24.04 --name entradasya --cpus 2 --memory 4G --disk 20G
multipass info entradasya            # anota la IPv4 (ej. 172.x.x.x)
multipass shell entradasya           # entra a la VM
```

Necesita 4 GB de RAM: corren 7 servicios (con .NET y dos Python), PostgreSQL y Mailpit.

## 2. Paquetes del sistema [VM]

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y nginx postgresql curl git rsync jq ca-certificates gnupg unzip
```

## 3. Runtimes [VM]

```bash
# Node.js 24 LTS + pnpm (auth, notifications, compilación de la web)
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo corepack enable

# .NET 10 SDK (orders)
sudo add-apt-repository -y ppa:dotnet/backports
sudo apt-get install -y dotnet-sdk-10.0

# Go (payments, checkin): los go.mod piden Go 1.26
curl -fsSL https://go.dev/dl/go1.26.0.linux-amd64.tar.gz | sudo tar -C /usr/local -xz
echo 'export PATH=$PATH:/usr/local/go/bin' | sudo tee /etc/profile.d/go.sh

# uv (events, tickets); instala y gestiona Python por proyecto
curl -LsSf https://astral.sh/uv/install.sh | sudo env UV_INSTALL_DIR=/usr/local/bin sh

# Mailpit (correo de prueba)
curl -sL https://raw.githubusercontent.com/axllent/mailpit/develop/install.sh | sudo bash
```

Verifica: `node -v && pnpm -v && dotnet --list-sdks && /usr/local/go/bin/go version && uv --version && mailpit version`.

## 4. Usuarios, carpetas y Mailpit [VM]

```bash
# Usuario que ejecuta los servicios (sin login) y usuario que despliega (runner del pipeline)
sudo useradd --system --no-create-home --shell /usr/sbin/nologin entradasya
sudo useradd --create-home --shell /bin/bash deploy
sudo usermod -aG systemd-journal deploy

for s in auth events orders payments tickets notifications checkin; do
  sudo install -d -o deploy -g entradasya -m 755 /opt/entradasya/$s
done
sudo install -d -o deploy -g entradasya -m 755 /opt/entradasya/.python   # Python gestionado por uv
sudo install -d -o entradasya -g entradasya -m 750 /var/lib/entradasya/tickets
sudo install -d -o deploy -g www-data -m 755 /var/www/entradasya
sudo install -d -o root -g deploy -m 750 /etc/entradasya

# deploy solo puede reiniciar los servicios de EntradasYa, nada más
echo 'deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart entradasya-*' | sudo tee /etc/sudoers.d/entradasya-deploy
sudo chmod 440 /etc/sudoers.d/entradasya-deploy

# Mailpit como servicio: SMTP en 127.0.0.1:1025 y la bandeja web en :8025
sudo tee /etc/systemd/system/mailpit.service >/dev/null <<'EOF'
[Unit]
Description=Mailpit
After=network.target
[Service]
User=entradasya
ExecStart=/usr/local/bin/mailpit --smtp 127.0.0.1:1025 --listen 0.0.0.0:8025
Restart=on-failure
[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload && sudo systemctl enable --now mailpit
```

## 5. PostgreSQL: una base y un usuario por servicio [VM]

Desde la carpeta del repositorio clonado en la VM (`git clone <url> ~/entradasya`):

```bash
sudo -u postgres psql -f ~/entradasya/infra/postgres/crear-bases.sql

# Cambia las contraseñas de desarrollo por unas reales; se imprimen para usarlas en el paso 6
for s in auth events orders payments tickets checkin; do
  p=$(openssl rand -hex 16)
  sudo -u postgres psql -qc "ALTER ROLE ${s}_user PASSWORD '$p';" && echo "${s}_user  $p"
done
```

Guarda esa salida. PostgreSQL solo escucha en `127.0.0.1`, que es lo que trae Ubuntu por defecto.

## 6. Variables de entorno de cada servicio [VM]

Crea un archivo por servicio en `/etc/entradasya/` partiendo del `.env.example` de su carpeta. Hay tres
diferencias con el entorno local:

- PostgreSQL usa el puerto **5432**, y cada servicio lleva **su** contraseña real.
- `JWT_SECRET` e `INTERNAL_API_TOKEN` son **nuevos y comunes** a todos. Genéralos con `openssl rand -hex 32`.
- tickets lleva `TICKETS_DIR=/var/lib/entradasya/tickets`.
- notifications lleva `WEB_BASE_URL=http://<IP-de-la-VM>`.

```bash
cd ~/entradasya
for pair in auth:node-auth events:python-events orders:dotnet-orders payments:go-payments \
            tickets:python-tickets notifications:node-notifications checkin:go-checkin; do
  s=${pair%%:*}; dir=${pair#*:}
  sudo cp backend/$dir/.env.example /etc/entradasya/$s.env
done
sudo nano /etc/entradasya/auth.env     # …y así con cada uno
sudo chown root:deploy /etc/entradasya/*.env && sudo chmod 640 /etc/entradasya/*.env
```

## 7. Servicios (systemd) y Nginx [VM]

```bash
cd ~/entradasya
sudo cp infra/systemd/entradasya-*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable entradasya-{auth,events,orders,payments,tickets,notifications,checkin}

sudo cp infra/nginx/entradasya.conf /etc/nginx/sites-available/entradasya
sudo ln -sf /etc/nginx/sites-available/entradasya /etc/nginx/sites-enabled/entradasya
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Los servicios arrancan en cuanto el pipeline publica su código (paso 9).

## 8. Runner self-hosted de GitHub Actions [VM]

El runner vive **dentro** de la VM y es él quien se conecta a GitHub. Por eso no hace falta abrir el puerto SSH
a Internet.

1. Entra en GitHub → repositorio → *Settings → Actions → Runners → New self-hosted runner → Linux*.
2. Como usuario `deploy`, ejecuta los comandos que muestra GitHub. Cuando pida etiquetas, agrega `entradasya`:

```bash
sudo -iu deploy
mkdir actions-runner && cd actions-runner
# curl … && tar xzf …     (copiar de la página de GitHub)
./config.sh --url https://github.com/<usuario>/<repo> --token <TOKEN> --labels entradasya --unattended
exit
cd /home/deploy/actions-runner && sudo ./svc.sh install deploy && sudo ./svc.sh start
```

3. Para que el runner encuentre Go y guarde el Python de uv en `/opt`, agrega estas dos líneas a
`/home/deploy/actions-runner/.env` y reinicia el runner con `sudo ./svc.sh stop && sudo ./svc.sh start`:

```
PATH=/usr/local/go/bin:/usr/local/bin:/usr/bin:/bin
UV_PYTHON_INSTALL_DIR=/opt/entradasya/.python
```

## 9. Primer despliegue y verificación

En GitHub → *Actions*, ejecuta a mano (*Run workflow*) cada `deploy-*` una vez. A partir de ahí, **cada push
a `main` que toque la carpeta de un servicio despliega solo ese servicio** (criterio 4).

**[VM]** — crea las cuentas de demostración, luego del primer despliegue de auth:

```bash
sudo -iu deploy bash -c 'cd /opt/entradasya/auth && set -a && . /etc/entradasya/auth.env && set +a && node src/scripts/seed.ts'
```

**[PC]** — prueba de punta a punta, contra el servidor:

```bash
BASE=http://<IP-de-la-VM> MAILPIT=http://<IP-de-la-VM>:8025 bash scripts/e2e.sh
```

Para revisar los logs: `journalctl -u entradasya-orders -f`. Para ver el estado: `systemctl status 'entradasya-*'`.
