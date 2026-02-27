# Estrategia de Commits (Pratica)

Objetivo: manter velocidade de iteracao sem perder legibilidade no historico.

## 1. Convencao de mensagem

Formato:

`type(scope): resumo curto`

Tipos recomendados:
- `feat`: nova funcionalidade
- `fix`: correcao de bug
- `style`: ajustes visuais/UX sem mudar regra de negocio
- `refactor`: reorganizacao interna sem alterar comportamento
- `docs`: documentacao
- `chore`: manutencao/infra/ferramentas

Scopes recomendados:
- `calculator`
- `manual`
- `home`
- `auth`
- `history`
- `results`
- `api`

Exemplos:
- `fix(calculator): corrige parse da hora tecnica manual`
- `style(results): padroniza fundo intermediario com cards de despesa`
- `docs(manual): atualiza copy de observacoes e referencias`

## 2. Granularidade (quando juntar ou separar)

Separar commit quando muda:
- area diferente do produto (ex.: `calculator` e `manual`)
- tipo diferente de mudanca (ex.: `fix` e `style`)
- risco diferente (ex.: backend auth junto com UI)

Juntar no mesmo commit quando:
- a mudanca precisa ser atomica para nao quebrar fluxo
- varios arquivos pertencem ao mesmo objetivo de UX/bug

## 3. Fluxo diario recomendado

1. Trabalhar em branch de tarefa:
   - `feat/calculator-discount`
   - `fix/auth-login-error`
2. Fazer commits pequenos durante implementacao.
3. Antes de merge/release:
   - agrupar por tema (squash local da branch)
   - manter 1 a 3 commits por tema
4. Enviar para `main` apenas commits organizados.

## 4. Politica para este repositorio

- Nao reescrever historico antigo de `main` (evita risco operacional).
- Aplicar organizacao **a partir de agora**.
- Toda entrega deve terminar com:
  - `npm run build`
  - backup pre-commit
  - commit + push

## 5. Checklist rapido de commit

Antes de `git commit`:
- [ ] Escopo esta claro?
- [ ] Tipo correto (`feat/fix/style/...`)?
- [ ] Mensagem descreve impacto real?
- [ ] Build passou?
- [ ] Nao incluiu arquivos gerados acidentalmente (`dist/`, etc.)?

