/**
 * Configuração de recursos prioritários para carregamento
 * Este arquivo define quais recursos devem ser carregados com prioridade
 * para otimizar o LCP (Largest Contentful Paint) e outras métricas de performance
 */

export const priorityResources = {
  // Recursos críticos para o LCP
  lcp: {
    // Fontes críticas para o título principal
    fonts: [
      {
        href: "https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_KU7NSg.woff2",
        type: "font/woff2",
        crossOrigin: "anonymous",
        weight: "700",
      },
      {
        href: "https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_KU7NSg.woff2",
        type: "font/woff2",
        crossOrigin: "anonymous",
        weight: "800",
      },
    ],

    // Imagens críticas para o LCP
    images: [
      {
        src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/time-vfx-janeiro2025-01-J9DciN1bitBBew1VXRIqqJGY97JaO2.webp",
        width: 1200,
        height: 675,
        alt: "Time VFX Janeiro 2025",
      },
    ],

    // Componentes críticos para o LCP
    components: [
      "app/layout.tsx",
      "app/page.tsx",
      "components/hero-title.tsx",
      "components/header.tsx",
      "components/hero.tsx",
    ],
  },

  // Recursos para preconnect (conexões antecipadas)
  preconnect: [
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com",
  ],

  // Recursos para prefetch (busca antecipada)
  prefetch: ["/offline", "/manifest.json"],

  // Recursos para preload (carregamento antecipado)
  preload: [
    {
      href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=swap",
      as: "style",
    },
    {
      href: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/time-vfx-janeiro2025-01-J9DciN1bitBBew1VXRIqqJGY97JaO2.webp",
      as: "image",
      type: "image/webp",
    },
  ],

  // Componentes abaixo da dobra que podem ser carregados com menor prioridade
  belowFold: [
    "components/features.tsx",
    "components/team.tsx",
    "components/sales-funnel.tsx",
    "components/success-cases.tsx",
    "components/testimonials.tsx",
    "components/why-choose-us.tsx",
    "components/contact-form.tsx",
    "components/footer.tsx",
  ],

  // Recursos que podem ser carregados após o LCP
  afterLcp: [
    {
      href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&display=swap",
      as: "style",
    },
  ],
}

/**
 * Função para gerar tags de preload para recursos críticos
 * Esta função pode ser usada no layout.tsx para gerar dinamicamente as tags de preload
 */
export function generatePreloadTags() {
  const tags = []

  // Preload de fontes críticas
  priorityResources.lcp.fonts.forEach((font) => {
    tags.push(
      `<link rel="preload" as="font" href="${font.href}" type="${font.type}" crossOrigin="${font.crossOrigin}" fetchPriority="high" />`,
    )
  })

  // Preload de imagens críticas
  priorityResources.lcp.images.forEach((image) => {
    tags.push(`<link rel="preload" as="image" href="${image.src}" fetchPriority="high" />`)
  })

  // Preconnect para domínios externos
  priorityResources.preconnect.forEach((url) => {
    tags.push(`<link rel="preconnect" href="${url}" crossOrigin="anonymous" />`)
  })

  return tags.join("\n")
}

/**
 * Função para determinar se um componente é crítico para o LCP
 * Esta função pode ser usada para decidir se um componente deve ser carregado estaticamente ou dinamicamente
 */
export function isLcpCritical(componentPath: string): boolean {
  return priorityResources.lcp.components.includes(componentPath)
}

