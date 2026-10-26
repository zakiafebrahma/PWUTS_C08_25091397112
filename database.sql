-- Jalankan di phpMyAdmin (tab SQL) atau: mysql -u root < database.sql
CREATE DATABASE IF NOT EXISTS washmate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE washmate;

CREATE TABLE IF NOT EXISTS pesanan (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kode_pesanan VARCHAR(30)   NOT NULL UNIQUE,
    nama         VARCHAR(100)  NOT NULL,
    telepon      VARCHAR(20)   NOT NULL,
    alamat       TEXT          NOT NULL,
    layanan      VARCHAR(50)   NOT NULL,
    berat        DECIMAL(6,2)  NOT NULL,
    jadwal       DATE          NOT NULL,
    catatan      TEXT          NULL,
    total_biaya  INT UNSIGNED  NOT NULL,
    status       VARCHAR(40)   NOT NULL DEFAULT 'Menunggu Konfirmasi',
    created_at   TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
