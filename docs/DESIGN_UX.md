# Diretrizes de design e UX — Finance Manager

## Princípios gerais

- **Minimalista e atrativa:** interface limpa, sem excesso de elementos, mas visualmente agradável. Cada elemento deve ter propósito; nada de enfeite por enfeite.
- **Evitar o “visual de IA”:** não seguir o padrão genérico de muitos SaaS atuais (gradientes roxos, mesma combinação Inter + Tailwind, cards idênticos em todo lugar). Buscar referências em sites e apps modernos com identidade própria.
- **Temas:** oferecer mais de uma opção de tema (ex.: claro, escuro e possivelmente outras variantes). O usuário escolhe e a preferência é respeitada.

## Implementação

- **Toggle claro/escuro no header:** controle visível no header da plataforma (após login) para alternar entre tema claro e escuro. A escolha deve persistir (ex.: `localStorage` ou conta do usuário no backend).
- **Paleta por tema:** tema claro e escuro com paletas definidas (cores do Planejamento adaptadas para cada modo). Cores de destaque (verde receita, vermelho despesa) funcionam nos dois temas.
- **Referências:** inspirar-se em interfaces atuais que sejam minimalistas, distintas e bem resolvidas — evitando o “template único” que muitos produtos compartilham.

## Uso no desenvolvimento

- Etapa 4 (layout base) e etapas seguintes devem seguir estas diretrizes.
- Ao definir componentes, cores e tipografia, priorizar minimalismo, atratividade e suporte a temas (começando por claro/escuro no header).
