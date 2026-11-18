-- EntradasYa v1 · Una base de datos y un usuario por servicio (sección 7 del documento).
-- Se ejecuta UNA vez como superusuario:
--   psql -U postgres -h localhost -f infra/postgres/crear-bases.sql
-- Las contraseñas de abajo son solo para desarrollo local.
-- En el servidor Ubuntu se cambian con: ALTER ROLE <usuario> PASSWORD '<secreto>';
-- (ver docs/servidor-ubuntu.md).

CREATE ROLE auth_user     LOGIN PASSWORD 'auth_pass';
CREATE ROLE events_user   LOGIN PASSWORD 'events_pass';
CREATE ROLE orders_user   LOGIN PASSWORD 'orders_pass';
CREATE ROLE payments_user LOGIN PASSWORD 'payments_pass';
CREATE ROLE tickets_user  LOGIN PASSWORD 'tickets_pass';
CREATE ROLE checkin_user  LOGIN PASSWORD 'checkin_pass';

-- Cada base pertenece a su usuario: ningún servicio puede leer la base de otro.
CREATE DATABASE auth_db     OWNER auth_user;
CREATE DATABASE events_db   OWNER events_user;
CREATE DATABASE orders_db   OWNER orders_user;
CREATE DATABASE payments_db OWNER payments_user;
CREATE DATABASE tickets_db  OWNER tickets_user;
CREATE DATABASE checkin_db  OWNER checkin_user;

REVOKE CONNECT ON DATABASE auth_db, events_db, orders_db, payments_db, tickets_db, checkin_db FROM PUBLIC;
