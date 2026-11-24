# PortfolioProject — Campus 3D

Portfólio explorável em Three.js, baseado na planta 2D aprovada: **Casa (esquerda) → Jardim com fonte (centro) → Projetos / Centro Tecnológico (direita)**. Dachser, UAb e blocos residenciais são áreas adicionais de exploração.

## Estado atual: protótipo 3D 01

Esta versão contém **volumes 3D preliminares** e não representa o aspeto final:
- Terreno alongado (64 × 96 unidades), caminhos, relva e fonte;
- Casa com três prédios unidos, Projetos à direita, Dachser no topo, UAb em baixo à direita e edifícios residenciais;
- Árvores, bancos, iluminação e outdoors demonstrativos;
- Câmara orbital para inspeção da escala e do layout;
- Protótipo anterior de avatar preservado em `avatar.html`.

**Ainda por fazer:** movimento first-person, colisões, interiores, teto que desvanece na entrada, apresentação interativa dos projetos, otimizações e validação do percurso de ~10 segundos até aos Projetos.

## Executar

O projeto atual usa **Three.js r160 via CDN**, pelo que necessita de Internet para carregar a biblioteca. Requer um servidor HTTP local; não abrir o HTML diretamente por `file://`.

Com Python instalado, na pasta do projeto:

```bash
python3 -m http.server 8000
```

Abrir `http://localhost:8000/` (campus) ou `http://localhost:8000/avatar.html` (protótipo de personagem).

Alternativamente, abrir com a extensão VS Code Live Server.

## Controlos atuais

Arrastar: rodar a câmara. Roda do rato: zoom. Não há ainda movimento WASD.

## Estrutura

- `index.html` — entrada do campus 3D.
- `src/campus.js` — geometria procedural do campus, materiais, câmara e renderização.
- `avatar.html` — acesso ao protótipo anterior de personagem.
- `src/main.js` — cena do avatar.
- `src/avatar.js` — `createAvatar()`, `update()`.
- `ROADMAP.md` — fases e subtarefas até à entrega.

## Normalização de escala (24/11/2026)

Usa-se **1 unidade = 1 metro virtual**. Nesta revisão foram ajustados:

- Banco: assento a **0,45 m**, comprimento **1,60 m**, profundidade **0,43 m**, encosto a cerca de **0,83 m**;
- Portas visuais: **2,15 × 1,20 m**, incluindo entradas na Casa (continuam sem abertura física);
- Fonte: diâmetro **5 m**, borda a **0,50 m**;
- Árvores: copa e tronco redimensionados para aproximadamente **4 m** antes dos fatores de escala;
- Outdoors: painel **4,5 × 2 m** com a parte inferior a **2,2 m**;
- Tecla **H** mostra/esconde uma referência humana temporária de **1,75 m**, com marcador de olhos a **1,68 m**.

A vista do campus permanece orbital; **não foi alterada para first-person**. A próxima etapa é implementar a navegação FPV com altura dos olhos de 1,68 m, FOV de aproximadamente 70°, colisões e medição da rota Casa → Projetos.

## Próximos passos

1. Inspecionar e corrigir a posição, a proporção e a orientação dos volumes.
2. Implementar first-person com WASD e colisões básicas.
3. Medir o tempo do percurso Casa → porta de Projetos e ajustar escala/velocidade para cerca de 10 segundos.
4. Criar os interiores da Dachser e do Centro Tecnológico, mantendo os tetos separados.
5. Implementar desvanecimento dos tetos ao entrar e destacar até três funcionalidades técnicas.

## Autoria e recursos

A geometria de base do campus e os outdoors de texto são criados proceduralmente em JavaScript/Three.js. A primeira implementação foi desenvolvida com assistência de IA (ChatGPT/OpenAI), com decisões de layout baseadas no desenho e orientações do autor. Biblioteca: Three.js (licença MIT). A biblioteca é carregada por CDN, não incluída localmente nesta versão; isso deverá ser revisto no empacotamento final.

Este projeto é um trabalho em desenvolvimento para o e-Fólio B de Computação Gráfica, com entrega prevista para **14/12/2026 às 23:59**.
