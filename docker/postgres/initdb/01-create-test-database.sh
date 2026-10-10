#!/bin/sh
# Executed by the postgres image only when the data volume is initialised for the first time.
# Creates a separate "<POSTGRES_DB>_test" database so the API test suite never touches dev data.
# (No `set` flags: the entrypoint may source this file instead of executing it.)

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
CREATE DATABASE "${POSTGRES_DB}_test";
SQL
