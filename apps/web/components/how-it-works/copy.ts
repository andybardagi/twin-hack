const locales = ["en", "es", "pt"] as const;

type Locale = (typeof locales)[number];

function getLocale(lang: string | string[] | undefined): Locale {
  return locales.find((locale) => locale === lang) ?? "en";
}

const en = {
  meta: {
    title: "How it works",
    description:
      "Keep custody of your money and pay by QR in seconds, with any stablecoin. No gas, no swaps to manage, no KYC.",
  },
  languageLabel: "Language",
  hero: {
    eyebrow: "Not your keys, not your coins",
    title: "Keep custody of your money. Pay in seconds with any stablecoin.",
    lede: "Customers pay by QR from their own wallet, with whatever stablecoin they hold. No gas, no swaps to manage, no KYC. Merchants get paid in seconds, in the currency they choose, for 0.5%.",
    diagramLabel:
      "A self-custodial customer pays in any stablecoin, the payment converts it in the same transaction, and the merchant receives the stablecoin they chose.",
    customer: "Customer",
    customerTag: "Self-custodial wallet · No KYC",
    paysIn: "pays in any stablecoin",
    converted: "Converted automatically",
    sameTransaction: "in the same transaction",
    merchant: "Merchant",
    receives: "receives the one they choose",
  },
  problem: {
    title: "The problem",
    customers: {
      title: "Customers",
      items: [
        "Crypto has grown a lot, but most people still pay from wallets they don't control. Not your keys, not your coins.",
        "Those apps require KYC: ID and personal data before you can pay.",
        "Self-custody means handling gas, swaps and networks just to pay.",
      ],
    },
    merchants: {
      title: "Merchants",
      items: [
        "Card processors and payment apps charge high fees on every sale.",
        "Card payments can take days to clear.",
        "Customers hold different currencies, and the merchant wants one.",
      ],
    },
  },
  solution: {
    title: "Our solution",
    lede: "Keep custody of your money and pay in seconds, with the stablecoin you want, without thinking about swaps or gas.",
    customers: {
      title: "For customers",
      items: [
        {
          title: "Your keys, your coins",
          body: "You pay from your own wallet. The contract moves the money straight to the merchant, and we never hold it.",
        },
        {
          title: "Any stablecoin",
          body: "Pay with USDT or any Twin token. The swap happens inside the payment, and the quote shows the full cost.",
        },
        {
          title: "No gas",
          body: "Our relayer submits every payment and pays the gas.",
        },
        {
          title: "One signature, no KYC",
          body: "Scan, pick a stablecoin and sign. No account, no password, no ID.",
        },
      ],
    },
    merchants: {
      title: "For merchants",
      items: [
        {
          title: "Lower fees",
          body: "0.5% per payment. No fixed fees and no terminal to rent.",
        },
        {
          title: "Paid in seconds",
          body: "The money lands in the same transaction as the payment. No waiting days for it to clear.",
        },
        {
          title: "Your currency",
          body: "Get paid in ARGt, BRAt, USDT or any Twin token, whatever the customer holds.",
        },
      ],
    },
  },
  steps: {
    title: "How a payment works",
    lede: "A merchant in Buenos Aires charges a customer who holds Brazilian reais.",
    disclaimer: "Amounts are illustrative. Real quotes follow live market rates.",
    charge: {
      title: "The merchant enters the amount",
      body: "They type it on the keypad, in the stablecoin they get paid in. The app signs the order on their device, with no wallet popup.",
    },
    qr: {
      title: "A QR appears",
      body: "The signed order turns into a QR. The merchant's screen waits for the payment and updates in real time.",
    },
    scan: {
      title: "The customer scans it",
      body: "From their own wallet, with no account and no ID. The app checks that the QR really comes from that merchant, and rejects a forged one.",
    },
    pick: {
      title: "The customer picks how to pay",
      body: "Any stablecoin they hold, with a live quote that includes the swaps. One signature and it's sent. No gas, no ETH.",
    },
    done: {
      title: "Both sides get confirmed",
      body: "The payment settles on Arbitrum in a single transaction. The merchant sees it in real time.",
    },
    mock: {
      amount: "15,000.00",
      enterAmount: "Enter the amount to charge.",
      createOrder: "Create order",
      order: "Order",
      waitingPayment: "Waiting for payment",
      showCode: "Your customer scans this code and pays from their wallet.",
      copyLink: "Copy payment link",
      waitingScan: "Point the camera at the QR",
      scanning: "Scanning",
      paymentRequest: "Payment request",
      verified: "Verified: signed by the merchant's registered device.",
      payWith: "Pay with",
      quote: "You pay about 57.40 BRAt (at most 57.69). No gas needed.",
      payButton: "Pay with your wallet",
      signing: "Sign the payment in your wallet. It costs no gas.",
      paymentReceived: "Payment received",
      paid: "Order paid",
      merchantPhone: "Merchant",
      customerPhone: "Customer",
    },
  },
  business: {
    title: "Business model",
    lede: "A fee on every payment. Customers see the full cost in the quote before they sign.",
    items: [
      {
        who: "Merchant",
        value: "0.5%",
        title: "Per payment",
        body: "Our revenue. Deducted from what the merchant receives when the payment settles, the way card processors charge. The contract caps it at 2%.",
      },
      {
        who: "Customer",
        value: "$0",
        title: "Network gas",
        body: "Our relayer submits every payment and pays the gas out of the fee.",
      },
      {
        who: "Customer",
        value: "0.3%",
        title: "Per swap, paid to Curve",
        body: "Nothing on same-token payments, and about 0.6% when two swaps are needed. It's already included in the quote.",
      },
    ],
    points: [
      "A USD 20 payment earns USD 0.10. Relaying it costs a few cents on Arbitrum.",
      "No capital locked in liquidity: swaps use Curve's existing Twin pools.",
      "We never hold user funds, so there's no custody risk.",
    ],
  },
  distribution: {
    title: "Distribution",
    lede: "Nothing stands between a merchant and their first sale.",
    noKyc: {
      title: "No KYC, no sign-up",
      body: "A wallet is the account. Merchants start charging in minutes, with no forms or ID checks.",
    },
    payouts: {
      title: "Payouts to any address",
      body: "Merchants can send every payment to another address they set on-chain, like a treasury or an exchange account.",
    },
    belo: {
      title: "Cash out to fiat with Belo",
      body: "Point payouts at a Belo address and convert them to pesos at no cost.",
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
      "Paying with a Twin token for the first time? Approve it once from your wallet. It's a regular transaction, so it needs a little ETH on Arbitrum.",
    ],
    customerEach: [
      "Scan the QR and check the amount.",
      "Pick a stablecoin, review the quote and sign.",
    ],
    customerNote: "No username or password. Payments never cost you gas.",
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
  faq: {
    title: "Common questions",
    items: [
      {
        question: "Why does my first Twin token payment have an extra step?",
        answer:
          "Twin tokens need one approval transaction from your own wallet before a contract can move them. It needs a little ETH on Arbitrum for gas, and you only do it once per token. USDT doesn't need this step.",
      },
      {
        question: "What if a QR expires?",
        answer:
          "The payment is rejected and no money moves. The merchant creates a new QR and you scan again.",
      },
    ],
  },
  cta: {
    title: "Ready to try it?",
    action: "Sign in with your wallet",
    contract: "See the contract on Arbiscan",
  },
};

const es: typeof en = {
  meta: {
    title: "Cómo funciona",
    description:
      "Conserva la custodia de tu dinero y paga con QR en segundos, con cualquier stablecoin. Sin gas, sin swaps manuales, sin KYC.",
  },
  languageLabel: "Idioma",
  hero: {
    eyebrow: "Not your keys, not your coins",
    title: "Conserva la custodia de tu dinero. Paga en segundos con cualquier stablecoin.",
    lede: "El cliente paga con QR desde su propia wallet, con la stablecoin que tenga. Sin gas, sin swaps manuales, sin KYC. El comercio cobra en segundos, en la moneda que elige, por 0,5%.",
    diagramLabel:
      "Un cliente con wallet en autocustodia paga con cualquier stablecoin, el pago la convierte en la misma transacción y el comercio recibe la stablecoin que eligió.",
    customer: "Cliente",
    customerTag: "Wallet en autocustodia · Sin KYC",
    paysIn: "paga con cualquier stablecoin",
    converted: "Conversión automática",
    sameTransaction: "en la misma transacción",
    merchant: "Comercio",
    receives: "recibe la que elige",
  },
  problem: {
    title: "El problema",
    customers: {
      title: "Clientes",
      items: [
        "Crypto creció muchísimo, pero la mayoría sigue pagando desde wallets que no controla. Not your keys, not your coins.",
        "Esas apps exigen KYC: documento y datos personales antes de poder pagar.",
        "La autocustodia obliga a lidiar con gas, swaps y redes solo para pagar.",
      ],
    },
    merchants: {
      title: "Comercios",
      items: [
        "Los procesadores de tarjetas y las apps de pago cobran comisiones altas en cada venta.",
        "Los pagos con tarjeta pueden tardar días en acreditarse.",
        "Los clientes tienen monedas distintas y el comercio quiere cobrar en una.",
      ],
    },
  },
  solution: {
    title: "Nuestra solución",
    lede: "Conserva la custodia de tu dinero y paga en segundos, con la stablecoin que quieras, sin preocuparte por el swap ni por el gas.",
    customers: {
      title: "Para clientes",
      items: [
        {
          title: "Tus llaves, tus monedas",
          body: "Pagas desde tu propia wallet. El contrato mueve el dinero directo al comercio y nosotros nunca lo tenemos.",
        },
        {
          title: "Cualquier stablecoin",
          body: "Paga con USDT o cualquier token Twin. El swap ocurre dentro del pago y la cotización muestra el costo total.",
        },
        {
          title: "Sin gas",
          body: "Nuestro relayer envía cada pago y paga el gas.",
        },
        {
          title: "Una firma, sin KYC",
          body: "Escanea, elige una stablecoin y firma. Sin cuenta, sin contraseña, sin documento.",
        },
      ],
    },
    merchants: {
      title: "Para comercios",
      items: [
        {
          title: "Comisiones más bajas",
          body: "0,5% por pago. Sin costos fijos ni terminal que alquilar.",
        },
        {
          title: "Cobro en segundos",
          body: "El dinero llega en la misma transacción del pago. Sin esperar días a que se acredite.",
        },
        {
          title: "Tu moneda",
          body: "Cobra en ARGt, BRAt, USDT o cualquier token Twin, tenga lo que tenga el cliente.",
        },
      ],
    },
  },
  steps: {
    title: "Cómo funciona un pago",
    lede: "Un comercio de Buenos Aires le cobra a un cliente que tiene reales brasileños.",
    disclaimer: "Los montos son ilustrativos. Las cotizaciones reales siguen el mercado en vivo.",
    charge: {
      title: "El comercio ingresa el monto",
      body: "Lo escribe en el teclado, en la stablecoin en la que cobra. La app firma la orden en su dispositivo, sin ventanas de la wallet.",
    },
    qr: {
      title: "Aparece un QR",
      body: "La orden firmada se convierte en un QR. La pantalla del comercio espera el pago y se actualiza en tiempo real.",
    },
    scan: {
      title: "El cliente lo escanea",
      body: "Desde su propia wallet, sin cuenta ni documento. La app comprueba que el QR viene de ese comercio y rechaza uno falsificado.",
    },
    pick: {
      title: "El cliente elige cómo pagar",
      body: "Con cualquier stablecoin que tenga, con una cotización en vivo que incluye los swaps. Una firma y listo. Sin gas ni ETH.",
    },
    done: {
      title: "Ambos reciben la confirmación",
      body: "El pago se liquida en Arbitrum en una sola transacción. El comercio lo ve en tiempo real.",
    },
    mock: {
      amount: "15.000,00",
      enterAmount: "Ingresa el monto a cobrar.",
      createOrder: "Crear orden",
      order: "Orden",
      waitingPayment: "Esperando el pago",
      showCode: "Tu cliente escanea este código y paga desde su wallet.",
      copyLink: "Copiar link de pago",
      waitingScan: "Apunta la cámara al QR",
      scanning: "Escaneando",
      paymentRequest: "Solicitud de pago",
      verified: "Verificada: firmada por el dispositivo registrado del comercio.",
      payWith: "Pagar con",
      quote: "Pagas aprox. 57,40 BRAt (como máximo 57,69). Sin gas.",
      payButton: "Pagar con tu wallet",
      signing: "Firma el pago en tu wallet. No cuesta gas.",
      paymentReceived: "Pago recibido",
      paid: "Orden pagada",
      merchantPhone: "Comercio",
      customerPhone: "Cliente",
    },
  },
  business: {
    title: "Modelo de negocio",
    lede: "Una comisión por cada pago. El cliente ve el costo total en la cotización antes de firmar.",
    items: [
      {
        who: "Comercio",
        value: "0,5%",
        title: "Por pago",
        body: "Nuestro ingreso. Se descuenta de lo que recibe el comercio cuando se liquida el pago, igual que en los procesadores de tarjetas. El contrato la limita a 2%.",
      },
      {
        who: "Cliente",
        value: "$0",
        title: "Gas de la red",
        body: "Nuestro relayer envía cada pago y paga el gas con la comisión.",
      },
      {
        who: "Cliente",
        value: "0,3%",
        title: "Por swap, para Curve",
        body: "Nada en pagos con el mismo token, y cerca de 0,6% cuando hacen falta dos swaps. Ya está incluido en la cotización.",
      },
    ],
    points: [
      "Un pago de USD 20 deja USD 0,10. Enviarlo cuesta unos centavos en Arbitrum.",
      "Sin capital inmovilizado en liquidez: los swaps usan los pools Twin que ya existen en Curve.",
      "Nunca tenemos fondos de usuarios, así que no hay riesgo de custodia.",
    ],
  },
  distribution: {
    title: "Distribución",
    lede: "Nada se interpone entre un comercio y su primera venta.",
    noKyc: {
      title: "Sin KYC ni registro",
      body: "La wallet es la cuenta. Un comercio empieza a cobrar en minutos, sin formularios ni verificación de identidad.",
    },
    payouts: {
      title: "Cobro en cualquier dirección",
      body: "El comercio puede enviar cada pago a otra dirección que define on-chain, como una tesorería o una cuenta de exchange.",
    },
    belo: {
      title: "A fiat con Belo",
      body: "Apunta los cobros a una dirección de Belo y conviértelos a pesos sin costo.",
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
      "¿Primera vez que pagas con un token Twin? Apruébalo una vez desde tu wallet. Es una transacción normal, así que necesita un poco de ETH en Arbitrum.",
    ],
    customerEach: [
      "Escanea el QR y revisa el monto.",
      "Elige una stablecoin, revisa la cotización y firma.",
    ],
    customerNote: "Sin usuario ni contraseña. Los pagos nunca te cuestan gas.",
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
  faq: {
    title: "Preguntas frecuentes",
    items: [
      {
        question: "¿Por qué mi primer pago con un token Twin tiene un paso más?",
        answer:
          "Los tokens Twin necesitan una transacción de aprobación desde tu propia wallet antes de que un contrato pueda moverlos. Requiere un poco de ETH en Arbitrum para el gas, y solo lo haces una vez por token. USDT no necesita este paso.",
      },
      {
        question: "¿Qué pasa si un QR vence?",
        answer:
          "El pago se rechaza y no se mueve dinero. El comercio crea un QR nuevo y lo escaneas otra vez.",
      },
    ],
  },
  cta: {
    title: "¿Listo para probarlo?",
    action: "Inicia sesión con tu wallet",
    contract: "Ver el contrato en Arbiscan",
  },
};

const pt: typeof en = {
  meta: {
    title: "Como funciona",
    description:
      "Mantenha a custódia do seu dinheiro e pague por QR em segundos, com qualquer stablecoin. Sem gas, sem swaps manuais, sem KYC.",
  },
  languageLabel: "Idioma",
  hero: {
    eyebrow: "Not your keys, not your coins",
    title: "Mantenha a custódia do seu dinheiro. Pague em segundos com qualquer stablecoin.",
    lede: "O cliente paga por QR da própria carteira, com a stablecoin que tiver. Sem gas, sem swaps manuais, sem KYC. O comerciante recebe em segundos, na moeda que escolher, por 0,5%.",
    diagramLabel:
      "Um cliente com carteira autocustodial paga com qualquer stablecoin, o pagamento converte na mesma transação e o comerciante recebe a stablecoin que escolheu.",
    customer: "Cliente",
    customerTag: "Carteira autocustodial · Sem KYC",
    paysIn: "paga com qualquer stablecoin",
    converted: "Conversão automática",
    sameTransaction: "na mesma transação",
    merchant: "Comerciante",
    receives: "recebe a que escolher",
  },
  problem: {
    title: "O problema",
    customers: {
      title: "Clientes",
      items: [
        "Cripto cresceu muito, mas a maioria ainda paga com carteiras que não controla. Not your keys, not your coins.",
        "Esses apps exigem KYC: documento e dados pessoais antes de pagar.",
        "A autocustódia obriga a lidar com gas, swaps e redes só para pagar.",
      ],
    },
    merchants: {
      title: "Comerciantes",
      items: [
        "Processadoras de cartão e apps de pagamento cobram taxas altas em cada venda.",
        "Pagamentos com cartão podem levar dias para cair.",
        "Os clientes têm moedas diferentes, e o comerciante quer receber em uma só.",
      ],
    },
  },
  solution: {
    title: "Nossa solução",
    lede: "Mantenha a custódia do seu dinheiro e pague em segundos, com a stablecoin que quiser, sem se preocupar com swap nem com gas.",
    customers: {
      title: "Para clientes",
      items: [
        {
          title: "Suas chaves, suas moedas",
          body: "Você paga da sua própria carteira. O contrato move o dinheiro direto para o comerciante, e nós nunca ficamos com ele.",
        },
        {
          title: "Qualquer stablecoin",
          body: "Pague com USDT ou qualquer token Twin. O swap acontece dentro do pagamento, e a cotação mostra o custo total.",
        },
        {
          title: "Sem gas",
          body: "Nosso relayer envia cada pagamento e paga o gas.",
        },
        {
          title: "Uma assinatura, sem KYC",
          body: "Escaneie, escolha uma stablecoin e assine. Sem conta, sem senha, sem documento.",
        },
      ],
    },
    merchants: {
      title: "Para comerciantes",
      items: [
        {
          title: "Taxas menores",
          body: "0,5% por pagamento. Sem custos fixos e sem maquininha para alugar.",
        },
        {
          title: "Recebe em segundos",
          body: "O dinheiro chega na mesma transação do pagamento. Sem esperar dias para cair.",
        },
        {
          title: "Sua moeda",
          body: "Receba em ARGt, BRAt, USDT ou qualquer token Twin, seja qual for a moeda do cliente.",
        },
      ],
    },
  },
  steps: {
    title: "Como funciona um pagamento",
    lede: "Um comerciante de Buenos Aires cobra um cliente que tem reais brasileiros.",
    disclaimer: "Os valores são ilustrativos. As cotações reais seguem o mercado ao vivo.",
    charge: {
      title: "O comerciante informa o valor",
      body: "Ele digita no teclado, na stablecoin em que recebe. O app assina o pedido no dispositivo dele, sem pop-up da carteira.",
    },
    qr: {
      title: "Aparece um QR",
      body: "O pedido assinado vira um QR. A tela do comerciante aguarda o pagamento e atualiza em tempo real.",
    },
    scan: {
      title: "O cliente escaneia",
      body: "Da própria carteira, sem conta e sem documento. O app confere se o QR veio mesmo daquele comerciante e rejeita um falsificado.",
    },
    pick: {
      title: "O cliente escolhe como pagar",
      body: "Com qualquer stablecoin que tiver, com uma cotação ao vivo que já inclui os swaps. Uma assinatura e pronto. Sem gas, sem ETH.",
    },
    done: {
      title: "Os dois lados recebem a confirmação",
      body: "O pagamento é liquidado na Arbitrum em uma única transação. O comerciante vê em tempo real.",
    },
    mock: {
      amount: "15.000,00",
      enterAmount: "Informe o valor a cobrar.",
      createOrder: "Criar pedido",
      order: "Pedido",
      waitingPayment: "Aguardando o pagamento",
      showCode: "Seu cliente escaneia este código e paga da carteira dele.",
      copyLink: "Copiar link de pagamento",
      waitingScan: "Aponte a câmera para o QR",
      scanning: "Escaneando",
      paymentRequest: "Pedido de pagamento",
      verified: "Verificado: assinado pelo dispositivo registrado do comerciante.",
      payWith: "Pagar com",
      quote: "Você paga cerca de 57,40 BRAt (no máximo 57,69). Sem gas.",
      payButton: "Pagar com a sua carteira",
      signing: "Assine o pagamento na sua carteira. Não custa gas.",
      paymentReceived: "Pagamento recebido",
      paid: "Pedido pago",
      merchantPhone: "Comerciante",
      customerPhone: "Cliente",
    },
  },
  business: {
    title: "Modelo de negócio",
    lede: "Uma taxa em cada pagamento. O cliente vê o custo total na cotação antes de assinar.",
    items: [
      {
        who: "Comerciante",
        value: "0,5%",
        title: "Por pagamento",
        body: "Nossa receita. Descontada do que o comerciante recebe quando o pagamento é liquidado, como nas maquininhas de cartão. O contrato limita a taxa a 2%.",
      },
      {
        who: "Cliente",
        value: "$0",
        title: "Gas da rede",
        body: "Nosso relayer envia cada pagamento e paga o gas com a taxa.",
      },
      {
        who: "Cliente",
        value: "0,3%",
        title: "Por swap, para a Curve",
        body: "Nada em pagamentos com o mesmo token, e cerca de 0,6% quando são necessários dois swaps. Já está incluído na cotação.",
      },
    ],
    points: [
      "Um pagamento de USD 20 rende USD 0,10. Enviá-lo custa alguns centavos na Arbitrum.",
      "Sem capital parado em liquidez: os swaps usam os pools Twin que já existem na Curve.",
      "Nunca ficamos com fundos de usuários, então não há risco de custódia.",
    ],
  },
  distribution: {
    title: "Distribuição",
    lede: "Nada fica entre o comerciante e a primeira venda.",
    noKyc: {
      title: "Sem KYC, sem cadastro",
      body: "A carteira é a conta. O comerciante começa a cobrar em minutos, sem formulários nem verificação de identidade.",
    },
    payouts: {
      title: "Recebimento em qualquer endereço",
      body: "O comerciante pode enviar cada pagamento para outro endereço definido on-chain, como uma tesouraria ou uma conta de exchange.",
    },
    belo: {
      title: "Para fiat com a Belo",
      body: "Aponte os recebimentos para um endereço da Belo e converta para pesos sem custo.",
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
      "Primeira vez pagando com um token Twin? Aprove uma vez pela sua carteira. É uma transação comum, então precisa de um pouco de ETH na Arbitrum.",
    ],
    customerEach: [
      "Escaneie o QR e confira o valor.",
      "Escolha uma stablecoin, revise a cotação e assine.",
    ],
    customerNote: "Sem usuário nem senha. Os pagamentos nunca custam gas para você.",
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
  faq: {
    title: "Perguntas frequentes",
    items: [
      {
        question: "Por que meu primeiro pagamento com um token Twin tem um passo a mais?",
        answer:
          "Tokens Twin precisam de uma transação de aprovação da sua própria carteira antes que um contrato possa movê-los. Ela precisa de um pouco de ETH na Arbitrum para o gas, e você só faz isso uma vez por token. USDT não precisa desse passo.",
      },
      {
        question: "E se um QR expirar?",
        answer:
          "O pagamento é rejeitado e nenhum dinheiro se move. O comerciante cria um novo QR e você escaneia de novo.",
      },
    ],
  },
  cta: {
    title: "Pronto para testar?",
    action: "Entre com a sua carteira",
    contract: "Ver o contrato no Arbiscan",
  },
};

type Copy = typeof en;

const copy: Record<Locale, Copy> = { en, es, pt };

export { copy, getLocale, locales };
export type { Copy, Locale };
