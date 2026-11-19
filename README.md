# Portfolio — Micael Santos

Portfólio experimental com avatar 3D **procedural** feito apenas com Three.js, sem ficheiros de modelos externos.

## Executar

Usar VS Code Live Server ou um servidor local, por exemplo:

```bash
python -m http.server 8000
```

Abrir http://localhost:8000

É necessária ligação à Internet para carregar Three.js do CDN.

## Estrutura

- `index.html`: página inicial, estilos e controlos
- `src/avatar.js`: `createAvatar()` devolve `{group, update}` para reutilização noutras cenas
- `src/main.js`: cena, câmara, luzes, OrbitControls e animação

## Funcionalidades

Rotação com rato/toque, zoom, repor vista, acenar, caminhar e animação idle. O avatar é uma interpretação estilizada das fotografias, não um scan 3D fiel.

## Próximos passos

Adicionar secções reais de projetos, experiência, contactos, navegação e acessibilidade; testar no browser e em dispositivos móveis.
