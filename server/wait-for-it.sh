#!/bin/sh
# wait-for-it.sh host:port [-t timeout] -- attend qu'un port TCP soit ouvert (compatible busybox/alpine)
HOSTPORT="$1"; shift
TIMEOUT=60
if [ "$1" = "-t" ]; then TIMEOUT="$2"; shift 2; fi
HOST="${HOSTPORT%:*}"; PORT="${HOSTPORT#*:}"
echo "⏳ Attente de $HOST:$PORT (timeout ${TIMEOUT}s)..."
i=0
until nc -z "$HOST" "$PORT" >/dev/null 2>&1; do
  i=$((i+1))
  if [ "$i" -ge "$TIMEOUT" ]; then echo "❌ Timeout en attendant $HOST:$PORT"; exit 1; fi
  sleep 1
done
echo "✅ $HOST:$PORT disponible"
