#!/usr/bin/env bash
# Builds the web app and uploads it to a web host over SSH (e.g. DreamHost).
#
# Usage: scripts/deploy-web.sh [options]
#   --site-url URL        Public URL of the site, e.g. https://qr.example.com or https://example.com/qr/
#   --ssh USER@HOST       SSH login, e.g. myuser@pdx1-shared-a1-01.dreamhost.com
#   --path DIR            Folder on the server to upload into (default: the site's domain,
#                         which is where DreamHost serves each domain from: ~/qr.example.com)
#   --app-id ID           QR Tracker's application id from the admin portal
#   --api-url URL         Where api.etiennethompson.com is deployed (default: https://project-hfhq4.vercel.app)
#   -y, --yes             Don't ask for confirmation
#
# Options are remembered in .deploy-web.local, so later runs need no arguments.
set -euo pipefail
cd "$(dirname "$0")/.."

CONFIG=.deploy-web.local
SITE_URL="" SSH_TARGET="" REMOTE_PATH="" APP_ID="" API_URL="https://project-hfhq4.vercel.app"
# shellcheck source=/dev/null
[ -f "$CONFIG" ] && . "$CONFIG"
ASSUME_YES=false

while [ $# -gt 0 ]; do
  case "$1" in
    --site-url) SITE_URL="$2"; shift 2 ;;
    --ssh) SSH_TARGET="$2"; shift 2 ;;
    --path) REMOTE_PATH="$2"; shift 2 ;;
    --app-id) APP_ID="$2"; shift 2 ;;
    --api-url) API_URL="$2"; shift 2 ;;
    -y|--yes) ASSUME_YES=true; shift ;;
    -h|--help) sed -n '2,15p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [ -z "$SITE_URL" ] || [ -z "$SSH_TARGET" ] || [ -z "$APP_ID" ]; then
  echo "First run needs --site-url, --ssh and --app-id (see --help)." >&2
  exit 1
fi
SITE_URL="${SITE_URL%/}/"                                  # always ends in /
SITE_ORIGIN=$(echo "$SITE_URL" | sed -E 's#^(https?://[^/]+).*#\1#')
SITE_HOST=$(echo "$SITE_ORIGIN" | sed -E 's#^https?://##')
REMOTE_PATH="${REMOTE_PATH:-$SITE_HOST}"
REMOTE_PATH="${REMOTE_PATH%/}"

case "$REMOTE_PATH" in
  ""|"/"|"~"|"."|"..") echo "Refusing to upload into '$REMOTE_PATH'; pass --path." >&2; exit 1 ;;
esac

# --- Check SSH before doing anything else ------------------------------------------------------
if ! ssh -o BatchMode=yes -o ConnectTimeout=15 "$SSH_TARGET" true 2>/dev/null; then
  cat >&2 <<EOF
Can't log in to $SSH_TARGET with an SSH key. One-time setup:

  1. In the DreamHost panel (Websites → SFTP Users & Files), make sure the user has SSH access.
  2. Create a key if you don't have one:   ssh-keygen -t ed25519
  3. Copy it to DreamHost:                 ssh-copy-id $SSH_TARGET
     (asks for the user's password once)
  4. Test it:                               ssh $SSH_TARGET
EOF
  exit 1
fi
# shellcheck disable=SC2029  # REMOTE_PATH is expanded locally on purpose
if ! ssh -o BatchMode=yes "$SSH_TARGET" "test -d $REMOTE_PATH"; then
  echo "Folder '$REMOTE_PATH' doesn't exist on $SSH_TARGET. Check --path (DreamHost: ~/your-domain)." >&2
  exit 1
fi

cat <<EOF
Deploying QR Tracker website
  Site:        $SITE_URL
  Upload to:   $SSH_TARGET:$REMOTE_PATH/
  API:         $API_URL
  App id:      $APP_ID
EOF
if ! $ASSUME_YES; then
  read -r -p "Continue? [y/N] " answer
  [[ "$answer" =~ ^[Yy]$ ]] || exit 1
fi

printf 'SITE_URL=%q\nSSH_TARGET=%q\nREMOTE_PATH=%q\nAPP_ID=%q\nAPI_URL=%q\n' \
  "$SITE_URL" "$SSH_TARGET" "$REMOTE_PATH" "$APP_ID" "$API_URL" > "$CONFIG"

# --- Build & upload ----------------------------------------------------------------------------
echo "==> Building"
(
  cd web
  npm ci --silent
  VITE_API_BASE_URL="$API_URL" \
  VITE_APPLICATION_ID="$APP_ID" \
    npm run build --silent
)

echo "==> Uploading"
# Assets first (old hashed files are removed, nothing outside qr-assets/ is ever deleted),
# then index.html, so visitors never load a page whose assets aren't there yet.
rsync -rz --delete web/dist/qr-assets/ "$SSH_TARGET:$REMOTE_PATH/qr-assets/"
rsync -rz --exclude qr-assets/ web/dist/ "$SSH_TARGET:$REMOTE_PATH/"

echo "==> Checking the site"
status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$SITE_URL" || true)
echo "    $SITE_URL returned HTTP $status"

cat <<EOF

Done: $SITE_URL

If this is the first deploy to this address (once):
  - Admin portal → Applications → QR Tracker: set the redirect URL to  $SITE_URL
  - api.etiennethompson.com: add  $SITE_ORIGIN  to corsOptions in src/index.ts and redeploy
EOF
