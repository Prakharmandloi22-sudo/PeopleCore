#!/usr/bin/env bash
# ==============================================================================
# PeopleCore HRMS - Automated Encrypted PostgreSQL Backup Script (Assessment 14)
# Performs atomic pg_dump, SHA-256 integrity hashing, and AES-256 encryption.
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-peoplecore}"
ENCRYPTION_PASSPHRASE="${BACKUP_ENCRYPTION_KEY:-peoplecore_secure_backup_encryption_passphrase_2026}"

mkdir -p "${BACKUP_DIR}"

RAW_BACKUP_FILE="${BACKUP_DIR}/peoplecore_${TIMESTAMP}.sql.gz"
ENCRYPTED_BACKUP_FILE="${BACKUP_DIR}/peoplecore_${TIMESTAMP}.sql.gz.enc"
CHECKSUM_FILE="${BACKUP_DIR}/peoplecore_${TIMESTAMP}.sha256"

echo "==> [$(date '+%Y-%m-%d %H:%M:%S')] Starting automated database backup for '${DB_NAME}'..."

# 1. Execute compressed PostgreSQL dump
PGPASSWORD="${DB_PASSWORD:-postgres}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -F p \
  --clean \
  --if-exists \
  | gzip -9 > "${RAW_BACKUP_FILE}"

# 2. Compute SHA-256 Checksum prior to encryption
sha256sum "${RAW_BACKUP_FILE}" > "${CHECKSUM_FILE}"
echo "==> Integrity Checksum: $(cat "${CHECKSUM_FILE}")"

# 3. Encrypt backup file using AES-256-CBC
openssl enc -aes-256-cbc -salt -pbkdf2 \
  -in "${RAW_BACKUP_FILE}" \
  -out "${ENCRYPTED_BACKUP_FILE}" \
  -pass "pass:${ENCRYPTION_PASSPHRASE}"

# Remove unencrypted plain archive
rm -f "${RAW_BACKUP_FILE}"

echo "==> [$(date '+%Y-%m-%d %H:%M:%S')] Encrypted backup completed successfully: ${ENCRYPTED_BACKUP_FILE}"
echo "==> File Size: $(du -h "${ENCRYPTED_BACKUP_FILE}" | cut -f1)"

# 4. Enforce 30-day retention cleanup
echo "==> Purging backups older than 30 days..."
find "${BACKUP_DIR}" -type f -name "peoplecore_*.enc" -mtime +30 -delete
find "${BACKUP_DIR}" -type f -name "peoplecore_*.sha256" -mtime +30 -delete
echo "==> Retention cleanup complete."
