interface LeadData {
  segment: string;
  monthlyRevenue: string;
  salesTeamSize: string;
}

interface LeadScoreResult {
  score: number;
  isQualified: boolean;
  reason?: string;
  logDetails: {
    segment: string;
    monthlyRevenue: string;
    salesTeamSize: string;
    baseScore: number;
    adjustments: string[];
    disqualificationReason?: string;
  };
}

export function calculateLeadScore(data: LeadData): LeadScoreResult {
  let leadScore = 0;
  const adjustments: string[] = [];

  // Verificar segmentos desqualificados
  const disqualifiedSegments = [
    "freelancer-marketing",
    "ecommerce",
    "infoproduto"
  ];

  if (disqualifiedSegments.includes(data.segment)) {
    return {
      score: 0,
      isQualified: false,
      reason: "Lead desqualificado por segmento",
      logDetails: {
        segment: data.segment,
        monthlyRevenue: data.monthlyRevenue,
        salesTeamSize: data.salesTeamSize,
        baseScore: 0,
        adjustments: ["Lead desqualificado por segmento"],
        disqualificationReason: "Segmento não elegível para qualificação"
      }
    };
  }

  // Verificar faturamento
  if (data.monthlyRevenue === "ate-10k") {
    return {
      score: 0,
      isQualified: false,
      reason: "Lead desqualificado por faturamento abaixo de 10k",
      logDetails: {
        segment: data.segment,
        monthlyRevenue: data.monthlyRevenue,
        salesTeamSize: data.salesTeamSize,
        baseScore: 0,
        adjustments: ["Lead desqualificado por faturamento"],
        disqualificationReason: "Faturamento abaixo do mínimo necessário"
      }
    };
  }

  // Pontuação por faturamento
  switch (data.monthlyRevenue) {
    case "11k-50k":
      leadScore += 5;
      adjustments.push("Faturamento 11k-50k: +5 pontos");
      break;
    case "51k-100k":
      leadScore += 30;
      adjustments.push("Faturamento 51k-100k: +30 pontos");
      break;
    case "101k-400k":
      leadScore += 40;
      adjustments.push("Faturamento 101k-400k: +40 pontos");
      break;
    case "401k-1m":
      leadScore += 80;
      adjustments.push("Faturamento 401k-1m: +80 pontos");
      break;
    case "1m+":
      leadScore += 100;
      adjustments.push("Faturamento 1m+: +100 pontos");
      break;
  }

  // Pontuação por tamanho da empresa
  switch (data.salesTeamSize) {
    case "somente-dono":
      leadScore += 1;
      adjustments.push("Tamanho da equipe: somente dono: +1 ponto");
      break;
    case "1-3":
      leadScore += 5;
      adjustments.push("Tamanho da equipe: 1-3: +5 pontos");
      break;
    case "4-10":
      leadScore += 15;
      adjustments.push("Tamanho da equipe: 4-10: +15 pontos");
      break;
    case "11-20":
      leadScore += 50;
      adjustments.push("Tamanho da equipe: 11-20: +50 pontos");
      break;
    case "20+":
      leadScore += 100;
      adjustments.push("Tamanho da equipe: 20+: +100 pontos");
      break;
  }

  // Ajustes por segmento
  const reducedScoreSegments = [
    "food-service",
    "varejo",
    "imobiliaria"
  ];

  if (reducedScoreSegments.includes(data.segment)) {
    leadScore = 1;
    adjustments.push(`Segmento ${data.segment}: score reduzido para 1 ponto`);
  }

  // Segmentos premium
  const premiumSegments = [
    "industria",
    "agro"
  ];

  if (premiumSegments.includes(data.segment)) {
    leadScore = 100;
    adjustments.push(`Segmento ${data.segment}: score definido como premium (100 pontos)`);
  }

  // Determinar qualificação baseada no score final
  const isQualified = leadScore > 0;
  const qualificationReason = isQualified 
    ? `Lead qualificado com score de ${leadScore} pontos`
    : "Lead não atingiu pontuação mínima para qualificação";

  return {
    score: leadScore,
    isQualified,
    reason: qualificationReason,
    logDetails: {
      segment: data.segment,
      monthlyRevenue: data.monthlyRevenue,
      salesTeamSize: data.salesTeamSize,
      baseScore: leadScore,
      adjustments,
      disqualificationReason: isQualified ? undefined : "Score insuficiente para qualificação"
    }
  };
}

// Função para converter score em valor monetário para o pixel
export function scoreToMonetaryValue(score: number): number {
  // Retornar o score diretamente, sem multiplicação
  // Exemplo: score 50 = valor 50
  return score;
}

