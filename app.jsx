// app.jsx — portfolio shell, content data, side panel

(function () {
  const { useState, useEffect, useMemo, useRef } = React;

  // ── Content ─────────────────────────────────────────────────────────────
  // Placeholder name — user should rename in source or via direct edit.
  const PERFIL = {
    nome: 'Felipe E. Vilhalva',
    titulo: 'Ciência da Computação · Redes & IA',
    bio: 'Formando em Ciência da Computação. Trabalho na interseção entre ciência de redes, aprendizado em grafos e ciência de dados — modelando sistemas complexos como tecidos de relações, não como tabelas de linhas.',
    local: 'São Paulo, BR',
    email: 'felipefelipevilhalva@gmail.com',
    github: 'github.com/fvilhalva',
    linkedin: 'linkedin.com/in/felipevilhalva',
    scholar: 'scholar.google.com/...',
  };

  const NODES = [
    { id: 'self',       cat: 'self',       label: PERFIL.nome,                 size: 18 },
    // pesquisa
    { id: 'redes',      cat: 'pesquisa',   label: 'Redes Complexas',           size: 15 },
    { id: 'gnn',        cat: 'pesquisa',   label: 'Graph Neural Networks',     size: 16 },
    { id: 'comm',       cat: 'pesquisa',   label: 'Detecção de Comunidades',   size: 13 },
    // projetos
    { id: 'p_soc',      cat: 'projeto',    label: 'Análise de Redes Sociais',  size: 14 },
    { id: 'p_rec',      cat: 'projeto',    label: 'Recomendação por Grafo',    size: 14 },
    { id: 'p_nlp',      cat: 'projeto',    label: 'Pipeline NLP · Citações',   size: 12 },
    { id: 'p_viz',      cat: 'projeto',    label: 'Visualizador de Grafos',    size: 12 },
    // skills
    { id: 's_py',       cat: 'skill',      label: 'Python',                    size: 9 },
    { id: 's_torch',    cat: 'skill',      label: 'PyTorch · PyG',             size: 9 },
    { id: 's_nx',       cat: 'skill',      label: 'NetworkX · igraph',         size: 9 },
    { id: 's_sql',      cat: 'skill',      label: 'SQL · DuckDB',              size: 9 },
    // publicações
    { id: 'pub_tcc',    cat: 'publicacao', label: 'TCC · 2025',                size: 12 },
    { id: 'pub_w',      cat: 'publicacao', label: 'Workshop · 2024',           size: 11 },
    // contato
    { id: 'contato',    cat: 'contato',    label: 'Contato',                   size: 13 },
  ];

  const EDGES = [
    ['self','redes'], ['self','gnn'], ['self','comm'], ['self','contato'],
    ['redes','comm'], ['redes','s_nx'],
    ['gnn','s_torch'], ['gnn','p_rec'], ['gnn','p_soc'],
    ['comm','p_soc'], ['comm','p_viz'],
    ['p_soc','s_py'], ['p_soc','s_nx'],
    ['p_rec','s_torch'], ['p_rec','s_sql'],
    ['p_nlp','s_py'], ['p_nlp','s_sql'],
    ['p_viz','s_py'], ['p_viz','s_nx'],
    ['pub_tcc','gnn'], ['pub_tcc','p_rec'],
    ['pub_w','comm'], ['pub_w','p_soc'],
  ];

  // ── Detail content per node ────────────────────────────────────────────
  const DETAILS = {
    self: {
      kind: 'Sobre',
      title: PERFIL.nome,
      lede: PERFIL.titulo,
      body: [
        PERFIL.bio,
        'Interesses: aprendizado em grafos (GNNs, embeddings), modelos generativos de redes, deteção de estrutura de comunidades, e aplicações em redes sociais e sistemas de recomendação.',
        'Atualmente buscando posição de pesquisa ou ML engineer — preferencialmente envolvendo dados relacionais.',
      ],
      meta: [
        ['local', PERFIL.local],
        ['formação', 'B.Sc. Ciência da Computação · 2026'],
        ['idiomas', 'PT · EN · ES'],
      ],
    },
    redes: {
      kind: 'Pesquisa',
      title: 'Redes Complexas',
      lede: 'Modelagem estatística de redes do mundo real.',
      body: [
        'Estudo de propriedades estruturais (distribuição de graus, mundo pequeno, clustering, assortatividade) em redes de coautoria, transporte e infraestrutura.',
        'Comparação de modelos generativos: Erdős–Rényi, Barabási–Albert, Watts–Strogatz, e modelos de configuração.',
      ],
      meta: [['ferramentas', 'NetworkX · graph-tool · igraph']],
    },
    gnn: {
      kind: 'Pesquisa',
      title: 'Graph Neural Networks',
      lede: 'Aprendizado de representações em dados não-euclidianos.',
      body: [
        'Foco em arquiteturas de message-passing (GCN, GAT, GraphSAGE) e suas variantes para tarefas de classificação de nós, predição de elos e classificação de grafos.',
        'Investigação de problemas práticos: over-smoothing, sensibilidade a perturbações estruturais, escalabilidade para grafos com >10⁶ nós.',
      ],
      meta: [['ferramentas', 'PyTorch Geometric · DGL']],
    },
    comm: {
      kind: 'Pesquisa',
      title: 'Detecção de Comunidades',
      lede: 'Encontrar estrutura mesoscópica em redes.',
      body: [
        'Comparação empírica de Louvain, Leiden, Infomap e abordagens baseadas em GNN para detecção não-supervisionada de comunidades em redes reais e sintéticas.',
        'Métricas: modularidade, NMI, e estabilidade sob amostragem.',
      ],
      meta: [],
    },
    p_soc: {
      kind: 'Projeto',
      title: 'Análise de Redes Sociais',
      lede: 'Pipeline de coleta, modelagem e visualização de redes de interação online.',
      body: [
        'Construção de grafo de menções a partir de ~2M de posts públicos. Detecção de comunidades temáticas, identificação de hubs e análise de difusão.',
        'Resultado: dashboard interativo mostrando evolução temporal de comunidades durante um evento de 30 dias.',
      ],
      meta: [['stack', 'Python · NetworkX · DuckDB · D3']],
    },
    p_rec: {
      kind: 'Projeto',
      title: 'Recomendação por Grafo',
      lede: 'Sistema de recomendação baseado em embeddings de grafo bipartido.',
      body: [
        'Implementação de LightGCN e comparação com matriz-fatoração clássica em dataset interno de ~500k interações usuário–item.',
        'Ganho de +12% em Recall@20 sobre baseline; análise de cold-start usando features de conteúdo.',
      ],
      meta: [['stack', 'PyTorch · PyG · FAISS']],
    },
    p_nlp: {
      kind: 'Projeto',
      title: 'Pipeline NLP · Citações',
      lede: 'Extração de redes de citação a partir de PDFs de artigos.',
      body: [
        'OCR + parsing estruturado de seções de referências, ligação a DOIs, construção de grafo de citação direcionado.',
        'Análise de cascatas de citação e identificação de "papers ponte" entre subáreas.',
      ],
      meta: [['stack', 'Python · spaCy · regex · grobid']],
    },
    p_viz: {
      kind: 'Projeto',
      title: 'Visualizador de Grafos',
      lede: 'Biblioteca leve de layout force-directed em WebGL.',
      body: [
        'Renderização performática de grafos de até 10⁴ nós no navegador, com pan/zoom, drag, e atalhos para filtragem por atributo.',
        'Open source — pretende substituir uso interno de gephi para protótipos rápidos.',
      ],
      meta: [['stack', 'TypeScript · regl · webworker']],
    },
    s_py:    { kind: 'Habilidade', title: 'Python', lede: 'Linguagem principal há 5+ anos.', body: ['Uso diário para pesquisa, prototipagem e produção. Confortável com ecossistema científico (numpy, pandas, polars, scikit-learn) e backend (FastAPI).'], meta: [] },
    s_torch: { kind: 'Habilidade', title: 'PyTorch + PyG', lede: 'Framework principal para experimentos em ML.', body: ['Familiaridade com treino distribuído, custom dataloaders, e implementação de camadas personalizadas. PyTorch Geometric para tarefas em grafos.'], meta: [] },
    s_nx:    { kind: 'Habilidade', title: 'NetworkX + igraph', lede: 'Análise estrutural de redes.', body: ['NetworkX para protótipos e expressividade; igraph quando performance importa. Confortável com algoritmos clássicos (centralidades, fluxos, comunidades).'], meta: [] },
    s_sql:   { kind: 'Habilidade', title: 'SQL + DuckDB', lede: 'Manipulação de dados em escala.', body: ['SQL analítico, window functions, CTEs recursivas. DuckDB como substituto leve para spark em datasets de até centenas de GB.'], meta: [] },
    pub_tcc: {
      kind: 'Publicação',
      title: 'Detecção robusta de comunidades via GNN auto-supervisionada',
      lede: 'TCC · 2025',
      body: ['Proposta de método híbrido combinando aprendizado contrastivo em grafos com perda de modularidade para detecção não-supervisionada de comunidades robusta a perturbações estruturais.'],
      meta: [['orientador', 'Prof. Dr. [Nome]'], ['estado', 'em redação']],
    },
    pub_w: {
      kind: 'Publicação',
      title: 'Análise temporal de comunidades em redes de menção',
      lede: 'Workshop · 2024',
      body: ['Trabalho aceito em workshop nacional. Estudo da evolução de comunidades em redes sociais durante eventos curtos.'],
      meta: [['evento', 'BraSNAM 2024']],
    },
    contato: {
      kind: 'Contato',
      title: 'Vamos conversar',
      lede: 'Aberto a oportunidades de pesquisa e engenharia.',
      body: ['Resposta em até 48h. Prefira email para propostas formais.'],
      meta: [
        ['email', PERFIL.email],
        ['github', PERFIL.github],
        ['linkedin', PERFIL.linkedin],
        ['scholar', PERFIL.scholar],
      ],
    },
  };

  // ── Tweaks defaults (rewritten on disk by host) ────────────────────────
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "theme": "light",
    "accent": "#c2410c",
    "density": "sparse",
    "showLegend": true,
    "labelMode": "always"
  }/*EDITMODE-END*/;

  const ACCENT_OPTS = ['#c2410c', '#1d4ed8', '#15803d', '#7c3aed', '#0f172a'];

  // ── Detail Panel ───────────────────────────────────────────────────────
  function DetailPanel({ id, onClose, accent }) {
    if (!id) return null;
    const d = DETAILS[id];
    if (!d) return null;
    return (
      <aside className="panel" key={id}>
        <div className="panel-inner">
          <div className="panel-top">
            <span className="kind-tag" style={{ color: accent, borderColor: accent }}>{d.kind}</span>
            <button className="panel-close" onClick={onClose} aria-label="Fechar">
              <span>fechar</span>
              <span className="x">×</span>
            </button>
          </div>
          <h2 className="panel-title">{d.title}</h2>
          {d.lede && <p className="panel-lede">{d.lede}</p>}
          <div className="panel-body">
            {d.body.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {d.meta && d.meta.length > 0 && (
            <dl className="panel-meta">
              {d.meta.map(([k, v]) => (
                <div className="meta-row" key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </aside>
    );
  }

  // ── Legend ─────────────────────────────────────────────────────────────
  function Legend({ accent, theme }) {
    const items = [
      { glyph: '◉', label: 'eu' },
      { glyph: '▲', label: 'pesquisa' },
      { glyph: '■', label: 'projeto' },
      { glyph: '·', label: 'habilidade' },
      { glyph: '✦', label: 'publicação' },
      { glyph: '◇', label: 'contato' },
    ];
    return (
      <div className="legend">
        <div className="legend-title">legenda</div>
        <div className="legend-rows">
          {items.map(it => (
            <div className="legend-row" key={it.label}>
              <span className="legend-glyph" style={{ color: it.label === 'eu' || it.label === 'contato' ? accent : 'currentColor' }}>{it.glyph}</span>
              <span className="legend-lbl">{it.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── App ────────────────────────────────────────────────────────────────
  function App() {
    const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
    const [selected, setSelected] = useState(null);

    // Apply theme to body
    useEffect(() => {
      document.documentElement.dataset.theme = t.theme;
    }, [t.theme]);

    // Esc closes panel
    useEffect(() => {
      const onKey = (e) => { if (e.key === 'Escape') setSelected(null); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
      <div className="app" data-label-mode={t.labelMode}>
        {/* Top bar */}
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark" style={{ background: t.accent }} />
            <span className="brand-name">{PERFIL.nome}</span>
            <span className="brand-sep">·</span>
            <span className="brand-title">{PERFIL.titulo}</span>
          </div>
          <nav className="topnav">
            <span className="nav-item">Portfólio</span>
            <span className="nav-item" onClick={() => setSelected('self')}>Sobre</span>
            <span className="nav-item" onClick={() => setSelected('contato')}>Contato</span>
          </nav>
        </header>

        {/* Hero text — only when nothing selected */}
        {!selected && (
          <div className="hero">
            <div className="hero-eyebrow">
              <span className="dot" style={{ background: t.accent }} />
              <span>portfólio interativo · 2026</span>
            </div>
            <h1 className="hero-h">
              Um portfólio que é, ele próprio,<br/>
              <em>um grafo.</em>
            </h1>
            <p className="hero-sub">
              Cada nó é um fragmento — pesquisa, projeto, ideia, contato. As arestas mostram as conexões reais.
              <span className="hero-cta">arraste, explore, clique.</span>
            </p>
          </div>
        )}

        {/* Graph fills the viewport */}
        <main className="canvas">
          <window.Graph
            nodes={NODES}
            edges={EDGES}
            accent={t.accent}
            theme={t.theme}
            density={t.density}
            onSelect={setSelected}
            selectedId={selected}
          />
        </main>

        {/* Legend bottom-left */}
        {t.showLegend && <Legend accent={t.accent} theme={t.theme} />}

        {/* Crosshair / coordinates corner (decorative metadata) */}
        <div className="meta-corner">
          <div>nós: {NODES.length}</div>
          <div>arestas: {EDGES.length}</div>
          <div>densidade: {(EDGES.length / (NODES.length * (NODES.length-1) / 2)).toFixed(3)}</div>
        </div>

        {/* Side panel */}
        {selected && <DetailPanel id={selected} onClose={() => setSelected(null)} accent={t.accent} />}

        {/* Tweaks */}
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection label="Tema" />
          <window.TweakRadio
            label="modo" value={t.theme}
            options={['light', 'dark']}
            onChange={(v) => setTweak('theme', v)}
          />
          <window.TweakColor
            label="acento" value={t.accent}
            options={ACCENT_OPTS}
            onChange={(v) => setTweak('accent', v)}
          />
          <window.TweakSection label="Grafo" />
          <window.TweakRadio
            label="densidade" value={t.density}
            options={['sparse', 'regular', 'dense']}
            onChange={(v) => setTweak('density', v)}
          />
          <window.TweakToggle
            label="legenda" value={t.showLegend}
            onChange={(v) => setTweak('showLegend', v)}
          />
        </window.TweaksPanel>
      </div>
    );
  }

  Object.assign(window, { App });

  // Mount when DOM ready
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
})();

