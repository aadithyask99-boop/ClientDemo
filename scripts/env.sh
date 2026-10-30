#!/usr/bin/env bash
# Encrypted, editable env file backed by age.
#
#   scripts/env.sh init                 create a keypair + empty secrets/env.age
#   scripts/env.sh edit                 decrypt -> $EDITOR -> re-encrypt
#   scripts/env.sh set NAME             set one value (prompted silently, never in shell history)
#   scripts/env.sh get NAME             print one value
#   scripts/env.sh list                 print variable names only
#   scripts/env.sh run -- CMD [ARGS]    run CMD with the variables exported
#   scripts/env.sh export               print `export NAME=...` lines (for eval)
#   scripts/env.sh add-recipient KEY    let another public key decrypt (re-encrypts)
#
# Private key lookup: $AGE_SECRET_KEY (cloud/CI secret), else $AGE_KEY_FILE,
# else .age-key.txt in the repo root (gitignored). Never commit the private key.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
enc="$root/secrets/env.age"
recipients="$root/secrets/recipients.txt"
keyfile="${AGE_KEY_FILE:-$root/.age-key.txt}"

die() { echo "env.sh: $*" >&2; exit 1; }

# Prefer RAM-backed tmp so plaintext never touches disk.
mktmp() {
  local dir=/dev/shm
  [ -d "$dir" ] && [ -w "$dir" ] || dir="${TMPDIR:-/tmp}"
  mktemp "$dir/envsh.XXXXXX"
}

decrypt() {
  [ -f "$enc" ] || die "no $enc; run: scripts/env.sh init"
  if [ -n "${AGE_SECRET_KEY:-}" ]; then
    age -d -i <(printf '%s\n' "$AGE_SECRET_KEY") "$enc"
  elif [ -f "$keyfile" ]; then
    age -d -i "$keyfile" "$enc"
  else
    die "no private key: set AGE_SECRET_KEY or create $keyfile (see: init)"
  fi
}

encrypt() { # stdin plaintext -> secrets/env.age
  [ -s "$recipients" ] || die "missing $recipients"
  local out; out="$(mktemp "$root/secrets/.env.age.XXXXXX")"
  if age -R "$recipients" -o "$out" ; then mv "$out" "$enc"; else rm -f "$out"; die "encryption failed"; fi
}

valid() { # reject lines that are not blank, comments, or NAME=value
  ! grep -nvE '^\s*(#.*)?$|^[A-Za-z_][A-Za-z0-9_]*=' "$1" >&2
}

cmd="${1:-}"; shift || true
case "$cmd" in
  init)
    mkdir -p "$root/secrets"
    [ -f "$enc" ] && die "$enc already exists; refusing to overwrite"
    if [ ! -f "$keyfile" ]; then
      age-keygen -o "$keyfile" 2>/dev/null
      chmod 600 "$keyfile"
      echo "Created private key: $keyfile  (back it up somewhere safe; it is gitignored)"
    fi
    age-keygen -y "$keyfile" >> "$recipients"
    sort -u "$recipients" -o "$recipients"
    printf '# Add NAME=value lines. Edit with: scripts/env.sh edit\n' | encrypt
    echo "Created $enc"
    ;;
  edit)
    tmp="$(mktmp)"; trap 'rm -f "$tmp"' EXIT
    decrypt > "$tmp"
    before="$(sha256sum < "$tmp")"
    "${VISUAL:-${EDITOR:-vi}}" "$tmp"
    [ "$(sha256sum < "$tmp")" = "$before" ] && { echo "No changes."; exit 0; }
    valid "$tmp" || die "invalid lines above (need NAME=value); nothing saved"
    encrypt < "$tmp"; echo "Saved $enc"
    ;;
  set)
    name="${1:-}"; [[ "$name" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || die "usage: set NAME"
    if [ -t 0 ]; then read -rsp "Value for $name: " value; echo; else IFS= read -r value; fi
    [ -n "$value" ] || die "empty value"
    [[ "$value" != *$'\n'* ]] || die "value must be a single line"
    tmp="$(mktmp)"; trap 'rm -f "$tmp"' EXIT
    decrypt | grep -vE "^${name}=" > "$tmp" || true
    printf '%s=%s\n' "$name" "$value" >> "$tmp"
    encrypt < "$tmp"; echo "Set $name"
    ;;
  get)
    name="${1:-}"; [ -n "$name" ] || die "usage: get NAME"
    decrypt | grep -E "^${name}=" | head -n1 | cut -d= -f2-
    ;;
  list)
    decrypt | grep -E '^[A-Za-z_][A-Za-z0-9_]*=' | cut -d= -f1
    ;;
  export)
    decrypt | grep -E '^[A-Za-z_][A-Za-z0-9_]*=' | while IFS= read -r l; do
      printf 'export %s=%q\n' "${l%%=*}" "${l#*=}"
    done
    ;;
  run)
    [ "${1:-}" = "--" ] && shift
    [ $# -gt 0 ] || die "usage: run -- CMD [ARGS]"
    eval "$("$0" export)"
    exec "$@"
    ;;
  add-recipient)
    pub="${1:-}"; [[ "$pub" == age1* ]] || die "usage: add-recipient age1..."
    tmp="$(mktmp)"; trap 'rm -f "$tmp"' EXIT
    decrypt > "$tmp"
    echo "$pub" >> "$recipients"; sort -u "$recipients" -o "$recipients"
    encrypt < "$tmp"; echo "Added recipient and re-encrypted"
    ;;
  *) sed -n '2,15p' "$0"; exit 1 ;;
esac
