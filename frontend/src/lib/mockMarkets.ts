export const mockMatches = [
  {
    league: "Copa Mundial",
    time: "6:00 PM",
    homeTeam: "Colombia",
    awayTeam: "Brasil",
    homeColor: "bg-yellow-400",
    awayColor: "bg-green-500",
    homePrice: "30¢",
    drawPrice: "20¢",
    awayPrice: "50¢",
    homeButtonColor: "bg-yellow-500",
    awayButtonColor: "bg-green-600"
  },
  {
    league: "Copa Mundial",
    time: "8:00 PM",
    homeTeam: "Argentina",
    awayTeam: "México",
    homeColor: "bg-blue-400",
    awayColor: "bg-green-600",
    homePrice: "45¢",
    drawPrice: "25¢",
    awayPrice: "30¢",
    homeButtonColor: "bg-blue-500",
    awayButtonColor: "bg-green-700"
  },
  {
    league: "Copa Mundial",
    time: "9:00 PM",
    homeTeam: "Panamá",
    awayTeam: "Estados Unidos",
    homeColor: "bg-red-600",
    awayColor: "bg-blue-800",
    homePrice: "15¢",
    drawPrice: "20¢",
    awayPrice: "65¢",
    homeButtonColor: "bg-red-600",
    awayButtonColor: "bg-blue-800"
  },
  {
    league: "Copa Mundial",
    time: "3:00 PM",
    homeTeam: "España",
    awayTeam: "Francia",
    homeColor: "bg-red-500",
    awayColor: "bg-blue-900",
    homePrice: "35¢",
    drawPrice: "30¢",
    awayPrice: "35¢",
    homeButtonColor: "bg-red-600",
    awayButtonColor: "bg-blue-900"
  },
  {
    league: "Copa Mundial",
    time: "12:00 PM",
    homeTeam: "Inglaterra",
    awayTeam: "Alemania",
    homeColor: "bg-zinc-100",
    awayColor: "bg-red-700",
    homePrice: "40¢",
    drawPrice: "20¢",
    awayPrice: "40¢",
    homeButtonColor: "bg-zinc-400",
    awayButtonColor: "bg-red-700"
  },
  {
    league: "Copa Mundial",
    time: "10:00 AM",
    homeTeam: "Italia",
    awayTeam: "Portugal",
    homeColor: "bg-blue-600",
    awayColor: "bg-red-600",
    homePrice: "33¢",
    drawPrice: "33¢",
    awayPrice: "34¢",
    homeButtonColor: "bg-blue-700",
    awayButtonColor: "bg-red-600"
  }
];

export const mockPollaVaults = [
  {
    title: "Polla Oficina Central",
    participants: "12/15",
    pool: "120 USDC",
    entryFee: "10 USDC"
  },
  {
    title: "Crypto Degens VIP",
    participants: "5/15",
    pool: "500 USDC",
    entryFee: "100 USDC"
  },
  {
    title: "Torneo Zona Libre",
    participants: "8/20",
    pool: "80 USDC",
    entryFee: "10 USDC"
  },
  {
    title: "Mundialistas Pro",
    participants: "15/15",
    pool: "300 USDC",
    entryFee: "20 USDC"
  },
  {
    title: "Betting Syndicate",
    participants: "10/10",
    pool: "1000 USDC",
    entryFee: "100 USDC"
  },
  {
    title: "Futboleros Unidos",
    participants: "3/15",
    pool: "30 USDC",
    entryFee: "10 USDC"
  }
];

export const mockBinaryMarkets = [
  {
    variant: 'classic' as const,
    title: "¿Llegará Solana a $250 antes de junio?",
    icon: "◎",
    chance: "65%",
    volume: "$2.5M",
    category: "CRYPTO",
    yesLabel: "SÍ",
    noLabel: "NO",
    customYesStyle: "bg-green-100 text-green-700 border-green-200 hover:bg-green-500 shadow-green-100",
    customNoStyle: "bg-red-100 text-red-700 border-red-200 hover:bg-red-500 shadow-red-100"
  },
  {
    variant: 'classic' as const,
    title: "¿Aprobará la SEC el próximo ETF?",
    icon: "🏛️",
    chance: "40%",
    volume: "$1.8M",
    category: "CRYPTO",
    yesLabel: "SÍ",
    noLabel: "NO",
    customYesStyle: "bg-green-100 text-green-700 border-green-200 hover:bg-green-500 shadow-green-100",
    customNoStyle: "bg-red-100 text-red-700 border-red-200 hover:bg-red-500 shadow-red-100"
  },
  {
    variant: 'classic' as const,
    title: "¿Superará BTC los $100k este mes?",
    icon: "₿",
    chance: "25%",
    volume: "$12.4M",
    category: "CRYPTO",
    yesLabel: "SÍ",
    noLabel: "NO",
    customYesStyle: "bg-green-100 text-green-700 border-green-200 hover:bg-green-500 shadow-green-100",
    customNoStyle: "bg-red-100 text-red-700 border-red-200 hover:bg-red-500 shadow-red-100"
  },
  {
    variant: 'classic' as const,
    title: "¿Será ETH deflacionario el resto del año?",
    icon: "⟠",
    chance: "80%",
    volume: "$4.2M",
    category: "CRYPTO",
    yesLabel: "SÍ",
    noLabel: "NO",
    customYesStyle: "bg-green-100 text-green-700 border-green-200 hover:bg-green-500 shadow-green-100",
    customNoStyle: "bg-red-100 text-red-700 border-red-200 hover:bg-red-500 shadow-red-100"
  },
  {
    variant: 'classic' as const,
    title: "¿Lanzará Apple su propia billetera crypto?",
    icon: "🍎",
    chance: "15%",
    volume: "$800K",
    category: "TECH",
    yesLabel: "SÍ",
    noLabel: "NO",
    customYesStyle: "bg-green-100 text-green-700 border-green-200 hover:bg-green-500 shadow-green-100",
    customNoStyle: "bg-red-100 text-red-700 border-red-200 hover:bg-red-500 shadow-red-100"
  },
  {
    variant: 'classic' as const,
    title: "¿Llegará la dominancia de BTC al 60%?",
    icon: "📈",
    chance: "55%",
    volume: "$3.1M",
    category: "CRYPTO",
    yesLabel: "SÍ",
    noLabel: "NO",
    customYesStyle: "bg-green-100 text-green-700 border-green-200 hover:bg-green-500 shadow-green-100",
    customNoStyle: "bg-red-100 text-red-700 border-red-200 hover:bg-red-500 shadow-red-100"
  }
];

export const mockMultiLevelMarkets = [
  {
    variant: 'multi' as const,
    title: "Precio de Ethereum a fin de mes",
    volume: "$850K",
    category: "CRYPTO",
    options: [
      { label: "↑ $2,800", chance: "15%" },
      { label: "↑ $3,000", chance: "45%" },
      { label: "↑ $3,200", chance: "10%" },
    ]
  },
  {
    variant: 'multi' as const,
    title: "Dominancia de BTC",
    volume: "$1.2M",
    category: "CRYPTO",
    options: [
      { label: "> 50%", chance: "90%" },
      { label: "> 55%", chance: "40%" },
      { label: "> 60%", chance: "10%" },
    ]
  },
  {
    variant: 'multi' as const,
    title: "TVL en L2s",
    volume: "$3.5M",
    category: "DEFI",
    options: [
      { label: "> $20B", chance: "85%" },
      { label: "> $30B", chance: "50%" },
      { label: "> $40B", chance: "20%" },
    ]
  },
  {
    variant: 'multi' as const,
    title: "Cierre Semanal de SOL",
    volume: "$900K",
    category: "CRYPTO",
    options: [
      { label: "> $150", chance: "70%" },
      { label: "> $180", chance: "30%" },
      { label: "> $210", chance: "15%" },
    ]
  },
  {
    variant: 'multi' as const,
    title: "Stablecoin Market Cap",
    volume: "$5.8M",
    category: "CRYPTO",
    options: [
      { label: "> $150B", chance: "95%" },
      { label: "> $160B", chance: "60%" },
      { label: "> $170B", chance: "30%" },
    ]
  },
  {
    variant: 'multi' as const,
    title: "NFT Volume",
    volume: "$400K",
    category: "NFT",
    options: [
      { label: "> $500M", chance: "60%" },
      { label: "> $1B", chance: "25%" },
      { label: "> $2B", chance: "5%" },
    ]
  }
];

export const mockHeadToHeadMarkets = [
  {
    variant: 'classic' as const,
    title: "Elecciones Presidenciales",
    icon: "🗳️",
    chance: "55%",
    volume: "$12.4M",
    category: "POLITICS",
    yesLabel: "Candidato A",
    noLabel: "Candidato B",
    customYesStyle: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-500 hover:text-white shadow-blue-50",
    customNoStyle: "bg-red-50 text-red-600 border-red-100 hover:bg-red-500 hover:text-white shadow-red-50"
  },
  {
    variant: 'classic' as const,
    title: "Batalla de Marcas: Coca vs Pepsi",
    icon: "🥤",
    chance: "60%",
    volume: "$1.5M",
    category: "BRANDS",
    yesLabel: "Coca Cola",
    noLabel: "Pepsi",
    customYesStyle: "bg-red-50 text-red-600 border-red-100 hover:bg-red-500 hover:text-white shadow-red-50",
    customNoStyle: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-500 hover:text-white shadow-blue-50"
  },
  {
    variant: 'classic' as const,
    title: "Final eSports: T1 vs Gen.G",
    icon: "🎮",
    chance: "45%",
    volume: "$800K",
    category: "GAMING",
    yesLabel: "T1",
    noLabel: "Gen.G",
    customYesStyle: "bg-zinc-800 text-white border-zinc-900 hover:bg-red-600 shadow-zinc-200",
    customNoStyle: "bg-yellow-500 text-black border-yellow-600 hover:bg-yellow-400 shadow-yellow-100"
  },
  {
    variant: 'classic' as const,
    title: "Mejor App de Trading: Robinhood vs Coinbase",
    icon: "📱",
    chance: "50%",
    volume: "$2.1M",
    category: "FINANCE",
    yesLabel: "Robinhood",
    noLabel: "Coinbase",
    customYesStyle: "bg-green-50 text-green-600 border-green-100 hover:bg-green-500 hover:text-white shadow-green-50",
    customNoStyle: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-500 hover:text-white shadow-blue-50"
  },
  {
    variant: 'classic' as const,
    title: "Lanzamiento Cohete: SpaceX vs Blue Origin",
    icon: "🚀",
    chance: "75%",
    volume: "$5.4M",
    category: "SPACE",
    yesLabel: "SpaceX",
    noLabel: "Blue Origin",
    customYesStyle: "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-700 shadow-zinc-300",
    customNoStyle: "bg-blue-400 text-white border-blue-500 hover:bg-blue-300 shadow-blue-100"
  },
  {
    variant: 'classic' as const,
    title: "Duelo de IAs: Gemini vs GPT-5",
    icon: "🤖",
    chance: "50%",
    volume: "$10M",
    category: "AI",
    yesLabel: "Gemini",
    noLabel: "GPT-5",
    customYesStyle: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-500 hover:text-white shadow-blue-50",
    customNoStyle: "bg-zinc-100 text-zinc-900 border-zinc-200 hover:bg-zinc-800 hover:text-white shadow-zinc-100"
  }
];

export const mockProMarkets = [
  ...mockBinaryMarkets,
  ...mockMultiLevelMarkets,
  ...mockHeadToHeadMarkets
];

export const pollaVaultMock = mockPollaVaults[0];
