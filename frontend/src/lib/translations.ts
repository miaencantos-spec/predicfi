export const translations = {
  es: {
    nav: {
      home: "Inicio",
      dashboard: "Dashboard",
      create: "Crear",
      admin: "Admin",
      trending: "Tendencias",
      search: "Buscar mercados...",
      connect: "Conectar"
    },
    home: {
      heroTitle: "Predice el futuro",
      heroSubtitle: "impulsado por IA",
      heroDesc: "El primer mercado de predicción descentralizado en Base con resolución autónoma mediante Gemini.",
      activeMarkets: "Mercados Activos",
      stats: {
        active: "Mercados Activos",
        volume: "Volumen Total",
        users: "Usuarios"
      }
    },
    market: {
      ends: "Expira",
      volume: "Volumen",
      probability: "Probabilidad",
      aiAnalysis: "Análisis de Gemini",
      betTerminal: "TERMINAL DE APUESTAS",
      buyYes: "COMPRAR SÍ",
      buyNo: "COMPRAR NO",
      activity: "Actividad Reciente"
    },
    dashboard: {
      title: "DASHBOARD",
      terminal: "Terminal de Usuario",
      propose: "Proponer Mercado",
      stats: {
        balance: "Balance USDC",
        predictions: "Predicciones",
        pending: "En Curso"
      },
      history: "Historial de Operaciones",
      claim: "RECLAMAR",
      claimed: "Liquidado",
      lost: "Perdida"
    }
  },
  en: {
    nav: {
      home: "Home",
      dashboard: "Dashboard",
      create: "Create",
      admin: "Admin",
      trending: "Trending",
      search: "Search markets...",
      connect: "Connect"
    },
    home: {
      heroTitle: "Predict the future",
      heroSubtitle: "AI-Powered",
      heroDesc: "The first decentralized prediction market on Base with autonomous resolution via Gemini.",
      activeMarkets: "Active Markets",
      stats: {
        active: "Active Markets",
        volume: "Total Volume",
        users: "Users"
      }
    },
    market: {
      ends: "Expires",
      volume: "Volume",
      probability: "Probability",
      aiAnalysis: "Gemini Analysis",
      betTerminal: "BETTING TERMINAL",
      buyYes: "BUY YES",
      buyNo: "BUY NO",
      activity: "Recent Activity"
    },
    dashboard: {
      title: "DASHBOARD",
      terminal: "User Terminal",
      propose: "Propose Market",
      stats: {
        balance: "USDC Balance",
        predictions: "Predictions",
        pending: "Ongoing"
      },
      history: "Operations History",
      claim: "CLAIM",
      claimed: "Settled",
      lost: "Lost"
    }
  }
};

export type Language = 'es' | 'en';
export type TranslationKey = typeof translations.es;
