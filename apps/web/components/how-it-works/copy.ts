const locales = ["en", "es", "pt"] as const;

type Locale = (typeof locales)[number];

function getLocale(lang: string | string[] | undefined): Locale {
  return locales.find((locale) => locale === lang) ?? "en";
}

const en = {
  meta: {
    title: "How it works",
    description:
      "Pay by QR with any supported Latin American stablecoin. The merchant receives the one they want.",
  },
  languageLabel: "Language",
  brand: "Stablecoin QR payments",
  hero: {
    eyebrow: "How it works",
    title: "Pay with the stablecoin you have. Get paid in the one you want.",
    lede: "Scan a QR code and pay in any supported Latin American stablecoin. The conversion happens inside the payment, and customers never pay gas.",
    diagramLabel:
      "A customer pays in BRAt, the payment converts it in one transaction, and the merchant receives ARGt.",
    customer: "Customer",
    paysIn: "pays in",
    converted: "Converted automatically",
    sameTransaction: "in the same transaction",
    merchant: "Merchant",
    receives: "receives",
  },
  steps: {
    title: "One payment, four steps",
    lede: "Here is a merchant in Buenos Aires charging a customer who holds Brazilian reais.",
    disclaimer: "Amounts are illustrative. Real quotes follow live market rates.",
    merchant: {
      title: "The merchant shows a QR",
      body: "They enter the amount in the currency they get paid in. The app signs the order automatically, with no wallet popup, and turns it into a QR.",
    },
    scan: {
      title: "The customer scans it",
      body: "The app checks that the QR really comes from that merchant, then shows what they're asking for. A forged QR gets rejected.",
    },
    pick: {
      title: "The customer picks how to pay",
      body: "Each stablecoin shows a live quote with the amount, fee and route. One signature and it's sent. No gas, no ETH.",
    },
    done: {
      title: "Both sides get confirmed",
      body: "The payment settles on Arbitrum in a single transaction. The merchant sees it in real time.",
    },
    mock: {
      newCharge: "New charge",
      amount: "15,000",
      scanToPay: "Scan to pay",
      scanning: "Scanning",
      verified: "Signed by the merchant",
      merchantAsks: "The merchant asks for",
      payWith: "Pay with",
      bratQuote: "57.40",
      usdtQuote: "10.40",
      twoSwaps: "2 swaps",
      oneSwap: "1 swap",
      direct: "Direct",
      sign: "Sign payment",
      paid: "Order paid",
      order: "Order #1042",
    },
  },
  routing: {
    title: "USDT connects every currency",
    lede: "Every Twin token has a Curve pool paired with USDT, so any two currencies are at most two swaps apart. All of it happens in one transaction.",
    mapLabel: "USDT sits at the center, connected to ARGt, BRAt, COLt, PERt, MEXt, CHLt and BOLt.",
    swap: "swap",
    transfer: "transfer",
    same: {
      title: "Same token",
      body: "A direct transfer. No swap, no swap cost.",
    },
    one: {
      title: "USDT and a Twin token",
      body: "One swap, in either direction.",
    },
    two: {
      title: "Twin token to Twin token",
      body: "Two swaps through USDT, signed once.",
    },
  },
  roles: {
    title: "What each side does",
    merchants: "For merchants",
    customers: "For customers",
    once: "Once",
    everySale: "Every sale",
    everyPayment: "Every payment",
    merchantOnce: [
      "Sign in with your wallet.",
      "Register a signing key. It's created on your device and stays there.",
      "Pick the stablecoin you want to receive.",
      "Optionally, set another address to receive your payments.",
    ],
    merchantEach: [
      "Enter the amount and show the QR.",
      "Get a real-time confirmation when it settles.",
    ],
    merchantNote:
      "Signing key and payout address are saved on-chain from your wallet, so changing them needs a little ETH on Arbitrum.",
    customerOnce: [
      "Sign in with your wallet. It's a signature, not a transaction, so it costs nothing.",
      "Paying with a Twin token for the first time? Approve it once. We send the ETH for that.",
    ],
    customerEach: [
      "Scan the QR and check the amount.",
      "Pick a stablecoin, review the quote and sign.",
    ],
    customerNote: "No username, no password, and no ETH needed to pay.",
  },
  safety: {
    title: "Why you can trust it",
    items: [
      {
        title: "QR codes can't be faked",
        body: "Each order is signed by a key that never leaves the merchant's device. Our servers can't forge an order or change where it pays out.",
      },
      {
        title: "You sign the exact order",
        body: "Your signature covers that order and a maximum amount. The payment can never take more than that maximum.",
      },
      {
        title: "Each order is paid once",
        body: "Orders expire, and the contract rejects any repeat of an order that was already paid.",
      },
      {
        title: "We never hold your funds",
        body: "The contract moves the money from customer to merchant in one transaction. Nothing sits in an account with us.",
      },
    ],
  },
  costs: {
    title: "Who pays what",
    lede: "No surprises: customers see the full cost in the quote before they sign.",
    items: [
      {
        who: "Customer",
        value: "$0",
        title: "Network gas",
        body: "Our relayer submits every payment and pays the gas. The payment fee covers it.",
      },
      {
        who: "Customer",
        value: "0.3%",
        title: "Per swap, paid to Curve",
        body: "Nothing on same-token payments, and about 0.6% when two swaps are needed. It's already included in your quote.",
      },
      {
        who: "Merchant",
        value: "Up to 2%",
        title: "Payment fee",
        body: "Deducted from what the merchant receives when the payment settles, the way card processors charge. The contract caps it at 2%.",
      },
    ],
  },
  faq: {
    title: "Common questions",
    items: [
      {
        question: "What are Twin tokens?",
        answer:
          "Stablecoins that bring local currencies onchain: ARGt (Argentine peso), BRAt (Brazilian real), COLt (Colombian peso), PERt (Peruvian sol), MEXt (Mexican peso), CHLt (Chilean peso) and BOLt (Bolivian boliviano).",
      },
      {
        question: "Why does my first Twin token payment have an extra step?",
        answer:
          "Twin tokens need one approval transaction from your own wallet before a contract can move them. We send you just enough ETH to cover it, and you only do it once per token. USDT doesn't need this step.",
      },
      {
        question: "Which wallets work?",
        answer: "Regular Ethereum wallets on Arbitrum. Smart wallets such as Safe can't sign in.",
      },
      {
        question: "What if a QR expires?",
        answer:
          "The payment is rejected and no money moves. The merchant creates a new QR and you scan again.",
      },
      {
        question: "Is USDT the same as USDT0?",
        answer:
          "On Arbitrum, yes. The USDT contract was upgraded in place to USDT0 in 2025, keeping its address and balances. We show it as USDT.",
      },
    ],
  },
  cta: {
    title: "Ready to try it?",
    action: "Sign in with your wallet",
  },
};

const es: typeof en = {
  meta: {
    title: "Cómo funciona",
    description:
      "Paga con QR en cualquier stablecoin latinoamericana compatible. El comercio recibe la que quiere.",
  },
  languageLabel: "Idioma",
  brand: "Pagos QR con stablecoins",
  hero: {
    eyebrow: "Cómo funciona",
    title: "Paga con la stablecoin que tienes. Cobra en la que quieres.",
    lede: "Escanea un código QR y paga en cualquier stablecoin latinoamericana compatible. La conversión ocurre dentro del pago y el cliente nunca paga gas.",
    diagramLabel:
      "Un cliente paga en BRAt, el pago lo convierte en una sola transacción y el comercio recibe ARGt.",
    customer: "Cliente",
    paysIn: "paga en",
    converted: "Conversión automática",
    sameTransaction: "en la misma transacción",
    merchant: "Comercio",
    receives: "recibe",
  },
  steps: {
    title: "Un pago, cuatro pasos",
    lede: "Un comercio de Buenos Aires le cobra a un cliente que tiene reales brasileños.",
    disclaimer: "Los montos son ilustrativos. Las cotizaciones reales siguen el mercado en vivo.",
    merchant: {
      title: "El comercio muestra un QR",
      body: "Ingresa el monto en la moneda en la que cobra. La app firma la orden sola, sin ventanas de la wallet, y la convierte en un QR.",
    },
    scan: {
      title: "El cliente lo escanea",
      body: "La app comprueba que el QR viene de ese comercio y muestra lo que pide. Un QR falsificado se rechaza.",
    },
    pick: {
      title: "El cliente elige cómo pagar",
      body: "Cada stablecoin muestra una cotización en vivo con monto, comisión y ruta. Una firma y listo. Sin gas ni ETH.",
    },
    done: {
      title: "Ambos reciben la confirmación",
      body: "El pago se liquida en Arbitrum en una sola transacción. El comercio lo ve en tiempo real.",
    },
    mock: {
      newCharge: "Nuevo cobro",
      amount: "15.000",
      scanToPay: "Escanea para pagar",
      scanning: "Escaneando",
      verified: "Firmado por el comercio",
      merchantAsks: "El comercio pide",
      payWith: "Pagar con",
      bratQuote: "57,40",
      usdtQuote: "10,40",
      twoSwaps: "2 swaps",
      oneSwap: "1 swap",
      direct: "Directo",
      sign: "Firmar pago",
      paid: "Orden pagada",
      order: "Orden n.º 1042",
    },
  },
  routing: {
    title: "USDT conecta todas las monedas",
    lede: "Cada token Twin tiene un pool de Curve emparejado con USDT, así que dos monedas cualesquiera están a dos swaps como máximo. Todo ocurre en una sola transacción.",
    mapLabel: "USDT está en el centro, conectado con ARGt, BRAt, COLt, PERt, MEXt, CHLt y BOLt.",
    swap: "swap",
    transfer: "transferencia",
    same: {
      title: "Mismo token",
      body: "Una transferencia directa. Sin swap ni costo de swap.",
    },
    one: {
      title: "USDT y un token Twin",
      body: "Un swap, en cualquier dirección.",
    },
    two: {
      title: "De token Twin a token Twin",
      body: "Dos swaps a través de USDT, con una sola firma.",
    },
  },
  roles: {
    title: "Qué hace cada parte",
    merchants: "Para comercios",
    customers: "Para clientes",
    once: "Una vez",
    everySale: "En cada venta",
    everyPayment: "En cada pago",
    merchantOnce: [
      "Inicia sesión con tu wallet.",
      "Registra una clave de firma. Se crea en tu dispositivo y se queda ahí.",
      "Elige la stablecoin que quieres recibir.",
      "Si quieres, define otra dirección para recibir tus pagos.",
    ],
    merchantEach: [
      "Ingresa el monto y muestra el QR.",
      "Recibe la confirmación en tiempo real cuando se liquida.",
    ],
    merchantNote:
      "La clave de firma y la dirección de cobro se guardan on-chain desde tu wallet, así que cambiarlas requiere un poco de ETH en Arbitrum.",
    customerOnce: [
      "Inicia sesión con tu wallet. Es una firma, no una transacción, así que no cuesta nada.",
      "¿Primera vez que pagas con un token Twin? Apruébalo una vez. Nosotros enviamos el ETH para eso.",
    ],
    customerEach: [
      "Escanea el QR y revisa el monto.",
      "Elige una stablecoin, revisa la cotización y firma.",
    ],
    customerNote: "Sin usuario, sin contraseña y sin necesidad de ETH para pagar.",
  },
  safety: {
    title: "Por qué puedes confiar",
    items: [
      {
        title: "Los QR no se pueden falsificar",
        body: "Cada orden se firma con una clave que nunca sale del dispositivo del comercio. Nuestros servidores no pueden falsificar una orden ni cambiar a dónde se paga.",
      },
      {
        title: "Firmas la orden exacta",
        body: "Tu firma cubre esa orden y un monto máximo. El pago nunca puede tomar más que ese máximo.",
      },
      {
        title: "Cada orden se paga una vez",
        body: "Las órdenes vencen, y el contrato rechaza cualquier repetición de una orden ya pagada.",
      },
      {
        title: "Nunca guardamos tus fondos",
        body: "El contrato mueve el dinero del cliente al comercio en una sola transacción. Nada queda en una cuenta nuestra.",
      },
    ],
  },
  costs: {
    title: "Quién paga qué",
    lede: "Sin sorpresas: el cliente ve el costo total en la cotización antes de firmar.",
    items: [
      {
        who: "Cliente",
        value: "$0",
        title: "Gas de la red",
        body: "Nuestro relayer envía cada pago y paga el gas. La comisión del pago lo cubre.",
      },
      {
        who: "Cliente",
        value: "0,3%",
        title: "Por swap, para Curve",
        body: "Nada en pagos con el mismo token, y cerca de 0,6% cuando hacen falta dos swaps. Ya está incluido en tu cotización.",
      },
      {
        who: "Comercio",
        value: "Hasta 2%",
        title: "Comisión del pago",
        body: "Se descuenta de lo que recibe el comercio cuando se liquida el pago, igual que en los procesadores de tarjetas. El contrato la limita a 2%.",
      },
    ],
  },
  faq: {
    title: "Preguntas frecuentes",
    items: [
      {
        question: "¿Qué son los tokens Twin?",
        answer:
          "Stablecoins que llevan monedas locales onchain: ARGt (peso argentino), BRAt (real brasileño), COLt (peso colombiano), PERt (sol peruano), MEXt (peso mexicano), CHLt (peso chileno) y BOLt (boliviano).",
      },
      {
        question: "¿Por qué mi primer pago con un token Twin tiene un paso más?",
        answer:
          "Los tokens Twin necesitan una transacción de aprobación desde tu propia wallet antes de que un contrato pueda moverlos. Te enviamos el ETH justo para cubrirla, y solo lo haces una vez por token. USDT no necesita este paso.",
      },
      {
        question: "¿Qué wallets funcionan?",
        answer:
          "Wallets comunes de Ethereum en Arbitrum. Las smart wallets como Safe no pueden iniciar sesión.",
      },
      {
        question: "¿Qué pasa si un QR vence?",
        answer:
          "El pago se rechaza y no se mueve dinero. El comercio crea un QR nuevo y lo escaneas otra vez.",
      },
      {
        question: "¿USDT es lo mismo que USDT0?",
        answer:
          "En Arbitrum, sí. El contrato de USDT se actualizó a USDT0 en 2025, conservando su dirección y sus saldos. Lo mostramos como USDT.",
      },
    ],
  },
  cta: {
    title: "¿Listo para probarlo?",
    action: "Inicia sesión con tu wallet",
  },
};

const pt: typeof en = {
  meta: {
    title: "Como funciona",
    description:
      "Pague por QR com qualquer stablecoin latino-americana compatível. O comerciante recebe a que preferir.",
  },
  languageLabel: "Idioma",
  brand: "Pagamentos QR com stablecoins",
  hero: {
    eyebrow: "Como funciona",
    title: "Pague com a stablecoin que você tem. Receba na que você quer.",
    lede: "Escaneie um QR code e pague em qualquer stablecoin latino-americana compatível. A conversão acontece dentro do pagamento, e o cliente nunca paga gas.",
    diagramLabel:
      "Um cliente paga em BRAt, o pagamento converte em uma única transação e o comerciante recebe ARGt.",
    customer: "Cliente",
    paysIn: "paga em",
    converted: "Conversão automática",
    sameTransaction: "na mesma transação",
    merchant: "Comerciante",
    receives: "recebe",
  },
  steps: {
    title: "Um pagamento, quatro passos",
    lede: "Um comerciante de Buenos Aires cobra um cliente que tem reais brasileiros.",
    disclaimer: "Os valores são ilustrativos. As cotações reais seguem o mercado ao vivo.",
    merchant: {
      title: "O comerciante mostra um QR",
      body: "Ele informa o valor na moeda em que recebe. O app assina o pedido sozinho, sem pop-up da carteira, e o transforma em um QR.",
    },
    scan: {
      title: "O cliente escaneia",
      body: "O app confere se o QR veio mesmo daquele comerciante e mostra o que ele pede. Um QR falsificado é rejeitado.",
    },
    pick: {
      title: "O cliente escolhe como pagar",
      body: "Cada stablecoin mostra uma cotação ao vivo com valor, taxa e rota. Uma assinatura e pronto. Sem gas, sem ETH.",
    },
    done: {
      title: "Os dois lados recebem a confirmação",
      body: "O pagamento é liquidado na Arbitrum em uma única transação. O comerciante vê em tempo real.",
    },
    mock: {
      newCharge: "Nova cobrança",
      amount: "15.000",
      scanToPay: "Escaneie para pagar",
      scanning: "Escaneando",
      verified: "Assinado pelo comerciante",
      merchantAsks: "O comerciante pede",
      payWith: "Pagar com",
      bratQuote: "57,40",
      usdtQuote: "10,40",
      twoSwaps: "2 swaps",
      oneSwap: "1 swap",
      direct: "Direto",
      sign: "Assinar pagamento",
      paid: "Pedido pago",
      order: "Pedido nº 1042",
    },
  },
  routing: {
    title: "USDT conecta todas as moedas",
    lede: "Cada token Twin tem um pool na Curve pareado com USDT, então quaisquer duas moedas estão a no máximo dois swaps de distância. Tudo acontece em uma única transação.",
    mapLabel: "USDT fica no centro, conectado a ARGt, BRAt, COLt, PERt, MEXt, CHLt e BOLt.",
    swap: "swap",
    transfer: "transferência",
    same: {
      title: "Mesmo token",
      body: "Uma transferência direta. Sem swap e sem custo de swap.",
    },
    one: {
      title: "USDT e um token Twin",
      body: "Um swap, em qualquer direção.",
    },
    two: {
      title: "De token Twin para token Twin",
      body: "Dois swaps por meio de USDT, com uma só assinatura.",
    },
  },
  roles: {
    title: "O que cada lado faz",
    merchants: "Para comerciantes",
    customers: "Para clientes",
    once: "Uma vez",
    everySale: "A cada venda",
    everyPayment: "A cada pagamento",
    merchantOnce: [
      "Entre com a sua carteira.",
      "Registre uma chave de assinatura. Ela é criada no seu dispositivo e fica lá.",
      "Escolha a stablecoin que quer receber.",
      "Se quiser, defina outro endereço para receber seus pagamentos.",
    ],
    merchantEach: [
      "Informe o valor e mostre o QR.",
      "Receba a confirmação em tempo real quando for liquidado.",
    ],
    merchantNote:
      "A chave de assinatura e o endereço de recebimento ficam on-chain e são definidos pela sua carteira, então alterá-los exige um pouco de ETH na Arbitrum.",
    customerOnce: [
      "Entre com a sua carteira. É uma assinatura, não uma transação, então não custa nada.",
      "Primeira vez pagando com um token Twin? Aprove uma vez. Nós enviamos o ETH para isso.",
    ],
    customerEach: [
      "Escaneie o QR e confira o valor.",
      "Escolha uma stablecoin, revise a cotação e assine.",
    ],
    customerNote: "Sem usuário, sem senha e sem precisar de ETH para pagar.",
  },
  safety: {
    title: "Por que você pode confiar",
    items: [
      {
        title: "QR codes não podem ser falsificados",
        body: "Cada pedido é assinado por uma chave que nunca sai do dispositivo do comerciante. Nossos servidores não podem falsificar um pedido nem mudar para onde ele paga.",
      },
      {
        title: "Você assina o pedido exato",
        body: "Sua assinatura cobre aquele pedido e um valor máximo. O pagamento nunca pode levar mais do que esse máximo.",
      },
      {
        title: "Cada pedido é pago uma vez",
        body: "Os pedidos expiram, e o contrato rejeita qualquer repetição de um pedido já pago.",
      },
      {
        title: "Nunca guardamos seus fundos",
        body: "O contrato move o dinheiro do cliente para o comerciante em uma única transação. Nada fica em uma conta nossa.",
      },
    ],
  },
  costs: {
    title: "Quem paga o quê",
    lede: "Sem surpresas: o cliente vê o custo total na cotação antes de assinar.",
    items: [
      {
        who: "Cliente",
        value: "$0",
        title: "Gas da rede",
        body: "Nosso relayer envia cada pagamento e paga o gas. A taxa do pagamento cobre esse custo.",
      },
      {
        who: "Cliente",
        value: "0,3%",
        title: "Por swap, para a Curve",
        body: "Nada em pagamentos com o mesmo token, e cerca de 0,6% quando são necessários dois swaps. Já está incluído na sua cotação.",
      },
      {
        who: "Comerciante",
        value: "Até 2%",
        title: "Taxa do pagamento",
        body: "Descontada do que o comerciante recebe quando o pagamento é liquidado, como nas maquininhas de cartão. O contrato limita a taxa a 2%.",
      },
    ],
  },
  faq: {
    title: "Perguntas frequentes",
    items: [
      {
        question: "O que são tokens Twin?",
        answer:
          "Stablecoins que levam moedas locais para onchain: ARGt (peso argentino), BRAt (real brasileiro), COLt (peso colombiano), PERt (sol peruano), MEXt (peso mexicano), CHLt (peso chileno) e BOLt (boliviano).",
      },
      {
        question: "Por que meu primeiro pagamento com um token Twin tem um passo a mais?",
        answer:
          "Tokens Twin precisam de uma transação de aprovação da sua própria carteira antes que um contrato possa movê-los. Enviamos o ETH exato para cobri-la, e você só faz isso uma vez por token. USDT não precisa desse passo.",
      },
      {
        question: "Quais carteiras funcionam?",
        answer:
          "Carteiras Ethereum comuns na Arbitrum. Smart wallets como a Safe não conseguem entrar.",
      },
      {
        question: "E se um QR expirar?",
        answer:
          "O pagamento é rejeitado e nenhum dinheiro se move. O comerciante cria um novo QR e você escaneia de novo.",
      },
      {
        question: "USDT é o mesmo que USDT0?",
        answer:
          "Na Arbitrum, sim. O contrato do USDT foi atualizado para USDT0 em 2025, mantendo o endereço e os saldos. Mostramos como USDT.",
      },
    ],
  },
  cta: {
    title: "Pronto para testar?",
    action: "Entre com a sua carteira",
  },
};

type Copy = typeof en;

const copy: Record<Locale, Copy> = { en, es, pt };

export { copy, getLocale, locales };
export type { Copy, Locale };
