export function HeroTitleMobile() {
  return (
    <h1
      id="hero-title-mobile"
      className="block md:hidden text-[36px] font-bold leading-tight mb-6"
      // Inline styles para máxima otimização do LCP
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "0px 120px",
        fontDisplay: "swap",
        contain: "layout style", // Ajuda na renderização
        visibility: "visible", // Força a visibilidade
        minHeight: "100px", // Altura mínima fixa para evitar layout shift
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

