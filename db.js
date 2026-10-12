// db.js — cria o banco SQLite (um arquivo, sem instalar nada) e as tabelas.
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'mesa.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON'); // faz o banco respeitar as chaves estrangeiras

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id         INTEGER PRIMARY KEY,
    email      TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,                       -- nunca guardamos a senha, só o "hash"
    papel      TEXT NOT NULL DEFAULT 'usuario' CHECK (papel IN ('usuario','admin')),
    criado_em  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS aventuras (
    id         INTEGER PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    genero     TEXT NOT NULL,
    tom        TEXT NOT NULL,
    jogadores  INTEGER NOT NULL,
    conteudo   TEXT NOT NULL,                       -- a aventura inteira, em JSON
    criado_em  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_aventuras_usuario ON aventuras(usuario_id, criado_em);

  -- Controle do "teste sem login": quantas gerações cada IP já usou.
  CREATE TABLE IF NOT EXISTS testes_visitante (
    ip    TEXT PRIMARY KEY,
    total INTEGER NOT NULL DEFAULT 0
  );
`);

module.exports = db;
