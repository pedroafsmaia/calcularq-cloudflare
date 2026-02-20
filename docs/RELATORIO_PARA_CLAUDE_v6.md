# Relatório para Auditoria — calcularq-cloudflare (v6)

**Data:** 20/02/2026  
**Objetivo desta versão:** última rodada de “polimento” antes do deploy de testes.

## Mudanças feitas na v6 (em relação à v5)

### 1) Remoção de configuração redundante do Vite
- Removido o bloco `optimizeDeps.exclude: ['jose']` do `vite.config.ts`.

**Motivo:** `jose` não é importado em nenhum arquivo dentro de `src/`, então o Vite não o inclui no bundle do navegador durante o build de produção. O `optimizeDeps` afeta principalmente o pré-bundling em modo dev e era redundante.

### 2) Remoção de código morto `syncUser`
- Removido o método `syncUser()` de `src/lib/api.ts`.
- Removida a interface `SyncUserResponse` associada.
- Removido o endpoint `functions/api/user/sync.js`.

**Motivo:** não existe uso de `syncUser` no frontend nesta versão; manter isso só adiciona ruído e chance de confusão futura.

## O que NÃO mudou
- Nenhuma regra de autenticação/sessão foi alterada.
- Nenhum schema/tabela do D1 foi alterado.
- Nenhuma rota usada pelo frontend foi removida além de `/api/user/sync` (que não era utilizada).

## Checklist rápido para validação pelo auditor
- `grep -rn "syncUser" src/` → sem resultados.
- `grep -rn "/api/user/sync" src/` → sem resultados.
- `functions/api/user/sync.js` → inexistente.
- `grep -rn "jose" src/` → sem resultados (continua apenas em `functions/`).
- Build do frontend continua gerando `dist/` normalmente.

