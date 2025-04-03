export function HeroTitleDesktop() {
  return (
    <h1
      id="hero-title-desktop"
      className="hidden md:block text-5xl lg:text-6xl font-bold leading-tight mb-6"
      // Inline styles para máxima otimização do LCP
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "0px 150px",
        fontDisplay: "swap",
        contain: "layout style", // Ajuda na renderização
        visibility: "visible", // Força a visibilidade
        minHeight: "120px", // Altura mínima fixa para evitar layout shift
        fontFamily:
          "var(--font-plus-jakarta), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <span className="font-extrabold">Comunique</span> Melhor,{" "}
      <span className="text-primary font-extrabold">Anuncie Para as Pessoas Certas</span> e{" "}
      <span className="font-extrabold">VENDA MAIS!</span>
    </h1>
  )
}

