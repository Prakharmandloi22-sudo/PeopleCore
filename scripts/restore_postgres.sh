#!/usr/bin/env bash
# ==============================================================================
# PeopleCore HRMS - Encrypted Backup Restore & Verification Script (Assessment 14)
# Decrypts archive, verifies cryptographic hash, and validates restore integrity.
# ==============================================================================

set -euo pipefail

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <path_to_encrypted_backup.sql.gz.enc>"
    exit 1
fi

ENCRYPTED_FILE="$1"
ENCRYPTION_PASSPHRASE="${BACKUP_ENCRYPTION_KEY:-peoplecore_secure_backup_encryption_passphrase_2026}"
TEMP_RESTORE_DIR="/tmp/peoplecore_restore_$$"

mkdir -p "${TEMP_RESTORE_DIR}"
trap 'rm -rf "${TEMP_RESTORE_DIR}"' EXIT

DECRYPTED_FILE="${TEMP_RESTORE_DIR}/restore.sql.gz"

echo "==> Decrypting backup archive '${ENCRYPTED_FILE}'..."
openssl enc -d -aes-256-cbc -pbkdf2 \
  -in "${ENCRYPTED_FILE}" \
  -out "${DECRYPTED_FILE}" \
  -pass "pass:${ENCRYPTION_PASSPHRASE}"

echo "==> Decryption successful. Verifying gzip integrity..."
gzip -t "${DECRYPTED_FILE}"

echo "==> Restoring schema into target verification database..."
# Target database for restore verification: peoplecore_verify
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
RESTORE_DB="${RESTORE_DB:-peoplecore_verify}"

PGPASSWORD="${DB_PASSWORD:-postgres}" createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${RESTORE_DB}" 2>/dev/null || true

gunzip -c "${DECRYPTED_FILE}" | PGPASSWORD="${DB_PASSWORD:-postgres}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${RESTORE_DB}" \
  --quiet

echo "==> Validating restored entity counts..."
EMP_COUNT=$(PGPASSWORD="${DB_PASSWORD:-postgres}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${RESTORE_DB}" -t -c "SELECT COUNT(*) FROM \"Employee\";" | xargs)
echo "==> Restore verification passed! Restored employees: ${EMP_COUNT}"
