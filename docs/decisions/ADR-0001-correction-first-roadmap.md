# ADR-0001: Roadmap com Foco em Correções

- Status: Aceito
- Data: 2026-07-10

## Contexto

As auditorias de 2026-07-02 e 2026-07-10 encontraram riscos concretos em
segurança nativa, persistência local, atualização, timer, pipeline de release e
documentação operacional. O antigo roadmap misturava histórico detalhado de
entregas, decisões já implementadas, dívida técnica e funcionalidades futuras,
o que dificultava identificar o próximo trabalho necessário.

## Decisão

- `docs/IMPROVEMENTS.md` passa a ser uma fila curta de correções abertas e
  priorizadas por risco.
- Correções com código, pipeline, dados ou comportamento verificável usam uma
  change OpenSpec antes da implementação.
- Funcionalidades de produto não serão apagadas, mas ficam em uma lista breve
  de backlog adiado, sem competir com correções no plano ativo.
- `CHANGELOG.md`, `CHANGELOG.pt.md`, auditorias e documentos de migração
  preservam histórico e não são usados como backlog operacional.
- `docs/RELEASE_OPERATIONS.md`, `docs/VERSIONS.md` e `RETOMADA.md` continuam
  sendo documentos operacionais e devem refletir apenas o estado atual.

## Consequências

- O planejamento atual fica menor, revisável e focado em risco mensurável.
- Detalhes de entregas já concluídas permanecem acessíveis pelo Git, changelogs,
  auditorias e changes OpenSpec, em vez de serem duplicados no roadmap.
- Funcionalidades adiadas só voltam ao plano ativo por priorização explícita do
  operador, depois que a fila de correções aplicável estiver controlada.
