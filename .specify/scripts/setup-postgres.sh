#!/usr/bin/env bash

# Setup script for local Postgres development environment
# Sources .env.example or .env for configuration

set -e

# Load environment variables
if [ -f .env ]; then
    set -a
    source .env
    set +a
else
    set -a
    source .env.example
    set +a
fi

echo "[setup-postgres] Starting PostgreSQL setup..."

# Create PostgreSQL database and user
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_USER=${POSTGRES_USER:-employeeadmin}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-securepassword123}
POSTGRES_DB=${POSTGRES_DB:-employee_management}

# Create the database and user
echo "[setup-postgres] Creating database '$POSTGRES_DB' with user '$POSTGRES_USER'..."
psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U postgres <<EOF
CREATE USER "$POSTGRES_USER" WITH PASSWORD '$POSTGRES_PASSWORD';
CREATE DATABASE "$POSTGRES_DB" OWNER "$POSTGRES_USER";
EOF

echo "[setup-postgres] Database setup complete!"
echo "[setup-postgres] Connection string: postgresql://$POSTGRES_USER:*****@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"
