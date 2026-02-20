# Relatório de Alteração — calcularq-cloudflare v8

## Mudança solicitada
Restaurar a configuração `optimizeDeps.exclude: ['jose']` no `vite.config.ts`, conforme recomendação da auditoria v7.

## Arquivos alterados
- `vite.config.ts`
  - Adicionado:
    ```ts
    optimizeDeps: {
      exclude: ['jose'],
    }
    ```

## Escopo / Impacto
- Nenhuma mudança funcional no runtime de produção.
- Mudança é inofensiva e afeta apenas o pré-bundling do Vite em desenvolvimento.

## Checklist rápido
- [x] Projeto continua Cloudflare-only (Pages + Functions + D1)
- [x] Sem outros arquivos modificados
