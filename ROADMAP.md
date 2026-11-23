# Roadmap — PortfolioProject (e-Fólio B de Computação Gráfica)

**Período:** 23 de novembro a 14 de dezembro de 2026  
**Entrega:** 14/12/2026 às **23:59**  
**Repositório:** [welele94/portfolioproject](https://github.com/welele94/portfolioproject) — branch `main`  
**Tecnologia central:** Three.js / JavaScript, com navegação 3D em tempo real programada no projeto.

> **Estado inicial:** existe um protótipo de avatar procedural em Three.js. As tarefas abaixo são planeadas e não devem ser consideradas concluídas sem teste. Os intervalos de datas são metas sugeridas e podem sobrepor-se.

## Princípios e decisão técnica

- **Plano principal:** portfólio explorável como uma sala 3D com objetos que representam os projetos.
- **Navegação-base:** first-person (WASD + rato), implementada antes de depender do avatar.
- **Opção extra:** third-person com personagem GLB ou avatar procedural, apenas se estiver estável.
- **Fallback:** manter first-person; nunca bloquear a entrega por problemas do modelo ou da animação.
- **Recursos:** preferir modelos/texturas locais e dependências controladas; declarar origem e licenças.
- **Prioridade:** 3 experiências muito bem executadas valem mais do que muitas incompletas.

## Fases e subtarefas

### 1. Planeamento e arquitetura — 23–24 nov.

- [ ] Definir conceito da sala e identidade visual do portfólio
- [ ] Definir zonas, projetos e objetos interativos
- [ ] Estabelecer escala do mundo e dimensões de referência
- [ ] Organizar ficheiros e módulos Three.js
- [ ] Definir e documentar comando único para execução
- [ ] Iniciar diário de decisões e ferramentas

**Concluída quando:** Conceito, decisões e estrutura definidos.

### 2. Construção do mundo 3D — 24–27 nov.

- [ ] Criar chão, paredes e teto
- [ ] Adicionar portas, janelas e divisões
- [ ] Construir secretária, computador e mobiliário básico
- [ ] Aplicar materiais, texturas e cores
- [ ] Adicionar iluminação ambiente e luzes locais
- [ ] Definir pontos de interesse para projetos

**Concluída quando:** Sala coerente e visível, com objetos posicionados.

### 3. Navegação e controlos — 26–29 nov.

- [ ] Implementar first-person (WASD + rato)
- [ ] Configurar altura da câmara e velocidade
- [ ] Criar colisões com chão, paredes e móveis
- [ ] Definir limites e áreas transitáveis
- [ ] Mostrar instruções e permitir desbloquear rato
- [ ] Testar suavidade e comportamento da câmara

**Concluída quando:** Sala explorável sem atravessar paredes.

### 4. Personagem 3D e fallback — 28–30 nov.

- [ ] Testar carregamento de GLB local (sem exigir serviços externos)
- [ ] Ajustar escala e posicionamento do modelo
- [ ] Avaliar rigging e animações idle/walk
- [ ] Experimentar third-person e seguimento de câmara
- [ ] Adicionar troca de modo apenas se viável
- [ ] Manter first-person totalmente funcional se avatar falhar

**Concluída quando:** Ter pelo menos um modo de navegação completo; o avatar não é bloqueante.

### 5. Portfólio e conteúdos — 30 nov.–3 dez.

- [ ] Selecionar 3 a 6 projetos relevantes
- [ ] Preparar título, descrição, tecnologias, data e papel desempenhado
- [ ] Associar objetos 3D aos projetos
- [ ] Implementar seleção por raycasting
- [ ] Criar painéis de informação, imagens e botões
- [ ] Ligar repositórios e demos existentes

**Concluída quando:** Projetos reais acessíveis através de navegação 3D.

### 6. Experiência e interatividade — 2–6 dez.

- [ ] Realçar objetos interativos
- [ ] Adicionar hover e animações de seleção
- [ ] Criar transições suaves da câmara
- [ ] Implementar uma interação especial no computador/objetos
- [ ] Facilitar navegação entre zonas
- [ ] Criar entrada, saída e reset da experiência

**Concluída quando:** Interações consistentes e compreensíveis.

### 7. Identidade visual e acabamento — 5–8 dez.

- [ ] Fixar paleta de cores e linguagem visual
- [ ] Afinar luzes, sombras e materiais
- [ ] Melhorar enquadramentos e composição
- [ ] Adicionar pequenas animações ambientais
- [ ] Incluir som opcional com controlo de mute
- [ ] Criar um momento visual memorável que se saiba explicar

**Concluída quando:** Experiência coerente e distinta.

### 8. Otimização e acessibilidade — 8–10 dez.

- [ ] Medir FPS e localizar gargalos
- [ ] Reduzir polígonos e peso de modelos
- [ ] Otimizar texturas e sombras
- [ ] Disponibilizar modo de qualidade reduzida
- [ ] Testar diferentes resoluções e portáteis
- [ ] Garantir instruções claras e comandos acessíveis

**Concluída quando:** Experiência fluida num portátil comum.

### 9. Documentação e avaliação — 10–12 dez.

- [ ] Escrever README com requisitos e execução
- [ ] Declarar IA, bibliotecas, recursos externos e licenças
- [ ] Registar evolução, falhas, versões e decisões
- [ ] Escolher até três destaques técnicos
- [ ] Escrever nota técnica ~meia página para cada destaque (funcionamento, parâmetros, tentativas e medições)
- [ ] Identificar autoria e papel nos projetos apresentados

**Concluída quando:** Documentação demonstra compreensão e transparência.

### 10. Entrega final — 12–14 dez.

- [ ] Testar uma cópia limpa do projeto
- [ ] Confirmar arranque pelo comando do README
- [ ] Gravar vídeo de 60–90 segundos
- [ ] Comprimir o vídeo
- [ ] Gerar ZIP com código, recursos e documentação
- [ ] Rever requisitos mínimos e submeter até 14/12 às 23:59

**Concluída quando:** ZIP validado, vídeo e materiais submetidos.

## Três destaques técnicos candidatos

1. **Interação contextual:** raycasting, seleção e realce de objetos, câmara reativa e feedback. Explicar cálculo, limiares e testes.
2. **Iluminação dinâmica:** transições entre ambientes conforme a interação; medir desempenho e justificar parâmetros.
3. **Efeito autoral:** shader próprio, transição visual ou efeito de partículas com desenvolvimento e medições documentados.

> Estes são candidatos, não compromissos inamovíveis; escolher até três destaques finais conforme o que funcionar melhor.

## Fallbacks e cortes de âmbito

| Risco | Alternativa |
| --- | --- |
| Avatar não parece o autor, não exporta, ou anima mal | First-person sem personagem |
| Third-person demasiado complexo | Manter apenas first-person |
| Colisões avançadas demoradas | Bounding boxes e geometria simples |
| Modelos/efeitos muito pesados | Geometria procedural, redução de qualidade e efeitos opcionais |
| Shader avançado pouco estável | Transições de câmara e materiais bem trabalhados |
| Tempo insuficiente | Priorizar 3 projetos sólidos e interação essencial |

## Requisitos do enunciado — verificar antes de entregar

- [ ] O ZIP arranca com **um único comando documentado** num browser atual.
- [ ] A navegação é feita com **computação gráfica em tempo real programada pelo autor**, e reage às ações do visitante.
- [ ] Projetos identificam o papel desempenhado e datas, quando aplicável.
- [ ] Ferramentas, IA, bibliotecas, modelos, fontes, sons e texturas de terceiros têm origem e licença declaradas.
- [ ] Vídeo demonstrativo com **60–90 segundos**, incluído na entrega.
- [ ] Até **3 destaques** com localização (atalho ou instante do vídeo), razão distintiva e nota técnica de ~meia página cada.
- [ ] Registo de processo com versões, decisões, tentativas falhadas e aprendizagens.
- [ ] README com objetivo, execução e requisitos de browser.
- [ ] Testar em portátil/browser moderno, com modo de qualidade reduzida caso necessário.
- [ ] Entregar até **14/12/2026 às 23:59**.

## Registo do processo (atualizar durante o desenvolvimento)

| Data | Decisão / experiência | Resultado | Próximo passo |
| --- | --- | --- | --- |
| 19–23/11/2026 | Protótipo de avatar procedural; testes de geradores online de personagens | Sem modelo externo satisfatório; evitar dependência de serviços pagos | Priorizar mundo e navegação first-person |
| 23/11/2026 | Definido roadmap com 10 fases e fallback FPV | Planeamento | Começar fase 1: conceito da sala |

## Próxima ação

**Fase 1.1 — conceito e mapa da sala:** definir a organização espacial e qual objeto vai abrir cada projeto. Depois implementar a sala-base em Three.js, mantendo o código modular.

---
*Roadmap de trabalho; datas estimadas, sujeito a ajustes. Baseado no briefing do e-Fólio B (17/11–14/12/2026).*
