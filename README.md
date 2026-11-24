# PortfolioProject — Campus 3D

Portfólio explorável em Three.js, baseado na planta 2D aprovada: **Casa (esquerda) → Jardim com fonte (centro) → Projetos / Centro Tecnológico (direita)**. Dachser, UAb e blocos residenciais são áreas adicionais de exploração.

## Estado atual: protótipo 3D 02 — navegação first-person

Esta versão contém **volumes 3D preliminares** e não representa o aspeto final:
- Terreno alongado (64 × 96 unidades), caminhos, relva e fonte;
- Casa com três prédios unidos, Projetos à direita, Dachser no topo, UAb em baixo à direita e edifícios residenciais;
- Árvores, bancos, iluminação e outdoors demonstrativos;
- Câmara orbital para inspeção da escala e do layout e first-person com WASD, rato e Shift;
- Colisões simples (círculo contra edifícios, troncos, bancos e fonte); cronómetro Casa → porta dos Projetos;
- Protótipo anterior de avatar preservado em `avatar.html`.

**Ainda por fazer:** validar o tempo real do percurso (~10 s em corrida, sujeito a teste), criar portas transitáveis e interiores, efeito de teto desvanecente, apresentação dos projetos e otimizações. As colisões atuais são aproximações 2D em XZ.

## Executar

O projeto atual usa **Three.js r160 via CDN**, pelo que necessita de Internet para carregar a biblioteca. Requer um servidor HTTP local; não abrir o HTML diretamente por `file://`.

Com Python instalado, na pasta do projeto:

```bash
python3 -m http.server 8000
```

Abrir `http://localhost:8000/` (campus) ou `http://localhost:8000/avatar.html` (protótipo de personagem).

Alternativamente, abrir com a extensão VS Code Live Server.

## Controlos atuais

**Vista aérea:** arrastar para rodar e roda do rato para zoom. **V** alterna entre vista aérea e first-person (também existe botão). Na vista first-person, **clica no cenário** para capturar o rato; **Esc** liberta o cursor. **WASD** ou setas movem-se, **Shift** corre, **R** reinicia percurso/cronómetro. O relógio começa ao mover-se e para ao chegar ao círculo verde junto à entrada dos Projetos. **H** alterna a referência humana de escala.

A primeira versão de colisões impede atravessar os blocos, mas ainda não tem portas abertas nem interiores. O cronómetro mede a tentativa em first-person, incluindo paragens, e **não** mede um tempo já validado.

## Estrutura

- `index.html` — entrada do campus 3D.
- `src/campus.js` — geometria procedural, materiais e integração dos obstáculos e do marcador de destino.
- `src/navigation.js` — movimento FPV, pointer lock, alternância com a vista aérea, colisões, reinício e cronómetro.
- `avatar.html` — acesso ao protótipo anterior de personagem.
- `src/main.js` — cena do avatar.
- `src/avatar.js` — `createAvatar()`, `update()`.
- `ROADMAP.md` — fases e subtarefas até à entrega.

## Normalização de escala (24/11/2026)

Usa-se **1 unidade = 1 metro virtual**. Nesta revisão foram ajustados:

- Banco: assento a **0,45 m**, comprimento **1,60 m**, profundidade **0,43 m**, encosto a cerca de **0,83 m**;
- Portas visuais: **2,15 × 1,20 m**, incluindo entradas na Casa (continuam sem abertura física);
- Fonte: diâmetro **5 m**, borda a **0,50 m**;
- Árvores: copa e tronco redimensionados para aproximadamente **6 m** antes dos fatores de escala (as instâncias usam fatores de 0,85–0,90);
- Outdoors: painel **4,5 × 2 m** com a parte inferior a **2,2 m**;
- Tecla **H** ou botão **Mostrar pessoa (H)** mostra/esconde uma referência humana temporária de **1,75 m**, com marcador de olhos a **1,68 m**; ao ativar, a câmara aproxima-se e o estado aparece no ecrã.

A vista orbital continua disponível com **V**, juntamente com first-person de olhos a **1,68 m** e FOV **70°**. A corrida usa 6,2 unidades/s e a caminhada 3,8 unidades/s; são valores experimentais a aferir após testar o trajeto.

## Próximos passos

1. Testar a navegação FPV e colisões num browser e corrigir possíveis problemas.
2. Cronometrar Casa → porta dos Projetos e ajustar escala/velocidade para cerca de 10 segundos.
3. Melhorar fachadas e a legibilidade dos caminhos.
4. Criar os interiores da Dachser e do Centro Tecnológico, mantendo os tetos separados.
5. Implementar desvanecimento dos tetos ao entrar e destacar até três funcionalidades técnicas.

## Autoria e recursos

A geometria de base do campus e os outdoors de texto são criados proceduralmente em JavaScript/Three.js. A primeira implementação foi desenvolvida com assistência de IA (ChatGPT/OpenAI), com decisões de layout baseadas no desenho e orientações do autor. Biblioteca: Three.js (licença MIT). A biblioteca é carregada por CDN, não incluída localmente nesta versão; isso deverá ser revisto no empacotamento final.

Este projeto é um trabalho em desenvolvimento para o e-Fólio B de Computação Gráfica, com entrega prevista para **14/12/2026 às 23:59**.
