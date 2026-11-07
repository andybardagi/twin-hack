# 🪙 

## HackaTwin · Track Stablecoins 

Este es el track de Twin en HackaTwin. Queremos ver qué construís cuando el peso, el real o el sol viven onchain como dinero programable y componible. 

### Lo esencial 

|Dato|Detalle|
|---|---|
|Cuándo y dónde|Sábado7de noviembre de2026,Digital House,Buenos Aires,de8a21hs,presencial|
|Equipos|Hasta4personas|
|Agenda|9:00kickoff, 18:00cierre de entregas, 19:00a21:00demo day y premiación|
|Premio del track|500USDT y kit de merch para el equipo ganador|
|Presentan|Twin,Digital House,Avalanche,belo y Tether|



### La consigna 

Construí en 9 horas un producto que explore qué se puede hacer con moneda local en una infraestructura programable y componible, usando las Twin Stablecoins, con al menos una transacción onchain real en la demo. 

#### La oportunidad 

Hasta ahora, operar en moneda local significaba quedar dentro de sistemas cerrados: bancos, procesadores y apps que no se hablan entre sí. Las Twin Stablecoins llevan el peso argentino, el real, el peso colombiano, el sol, el peso mexicano, el peso chileno y el boliviano onchain, como tokens ERC-20 que cualquier contrato, wallet, protocolo o agente puede leer, mover y combinar sin pedir permiso. Mover dinero entre países es un caso fuerte, pero es solo el punto de partida: la pregunta es qué aparece cuando la moneda local se vuelve programable y componible. 

#### El desafío 

Explorá casos de uso que solo son posibles con moneda local onchain: combinala con contratos inteligentes, con protocolos DeFi, con agentes de IA o con las otras monedas de la región. Buscamos ideas nuevas, no versiones onchain de productos que ya existen. El token tiene que ser parte central de tu producto, no un agregado decorativo. 

#### Tres ideas para arrancar 

Son disparadores, no un límite: podés construir cualquier otra cosa. 

1. Pagos agénticos (pagos y transferencias): agentes de IA que pagan, cobran o dividen gastos en moneda local de forma autónoma, dentro de límites que define el usuario. 

2. Capital de trabajo para comercios (crédito): crédito desembolsado y cobrado en moneda local, con scoring basado en el historial de cobros onchain del comercio y repago automático como porcentaje de cada venta. Podés apoyarte en los vaults de Morpho. 

3. FX entre monedas locales (conversión): conversión directa entre monedas de la región (por ejemplo BRL a MXN) con cotización transparente y ruteo por los pools de Curve, o cobertura cambiaria para empresas que cobran en una moneda y pagan en otra. 

#### Requisitos para competir 

Usá al menos una Twin Stablecoin (ARGt, BRAt, COLt, PERt, MEXt, CHLt o BOLt) en una de las chains elegibles. 

- Mostrá en la demo al menos una transacción onchain ejecutada por tu producto, con el hash verificable en el explorer. 

### Recursos técnicos 

Todo lo que necesitás para integrar las Twin Stablecoins. Durante el evento vas a tener mentores de Twin en el venue y soporte en Discord. 

HackaTwin · Track Stablecoins 

1 

|Recurso|Detalle|
|---|---|
|Tokens|ARGt,BRAt,COLt,PERt,MEXt,CHLt,BOLt|
|Chains|Arbitrum,Base,Polygon,Ethereum y Avalanche|
|Estándar|ERC-20Upgradeable de OpenZeppelin(beacon proxy);las transferencias son permissionless|
|Decimals|18en todos los tokens|
|Precio de referencia|API pública de belo:<br>`https://api.belo.app/public/price`(bid,ask y mid por par)|
|Logos|`https://assets.twin.finance/media/tokens/32x32/<TICKER>.svg`(ej:<br>`<TICKER>`=<br>`ARGt` )|
|Soporte y acceso a|Pedí tokens para testear y resolvé dudas con los mentores de Twin en el venue o por el Discord de Twin:|
|tokens|discord.gg/whU99xqnZ|



#### Contratos de los tokens 

|Token|Arbitrum|Base|Pol|
|---|---|---|---|
|ARGt|0x59863989d080B22476DB95656d0C3CC18be92214|0xf016413834E6D1A14F3D628B11D6Ef725a6bdbDD|0x5|
|BRAt|0xC4ed6Aba5373D78E160F4df39e011F078Be54df8|0xFEE29845569570F8e0119291dff77B7b93283aaB|0x5|
|COLt|0xa16d5DB80A45157E0e451750B81FF0CC0b61d558|0xD70ad085684b2A9f4B5d54D7BDB2ecA37a273216|0x1|
|PERt|0x899438713f62B04d6CD8e8709986F7256fB6E3d9|0xD09ABA2969B822d66DC4Bc3bB58eE520Bcf9f0C3|0x5|
|MEXt|0xb96aA6babCcD738d6644ADd4912fE5eFbEBF5a25|0x59863989d080B22476DB95656d0C3CC18be92214|0xb|
|CHLt|0xe8dbC4680235cCAeFf48e4C0B0EaceeBb89E5e17|0x95ef2370166b250e7CE3b8F236c7e7E9feD12c2e|0xf|
|BOLt|0x1edF5E61B6a4Fe19FEf3A695328F61aAa07728eA|0x1d2E8C1Fe82ab2AD8dc43eD98A2F507Dfb5b4995|0x2|



Los deploys no son determinísticos: la misma dirección puede ser un token distinto en otra chain (por ejemplo, 0x5986...2214 es ARGt en Arbitrum y Ethereum, MEXt en Base y BRAt en Polygon). Usá siempre la combinación de dirección y chain. 

#### Pools 

Pools de Curve en Arbitrum, uno por token, pareados con USDT0. Sirven para convertir entre moneda local y USDT y para cotizar. 

|Token|Par|Pool|
|---|---|---|
|ARGt|ARGt/USDT0|0x356d349da9add7efb56a35fab939a2c6d852f853|
|BRAt|BRAt/USDT0|0xeef48df5f1c509cd9730774b4e8a4464626ef8d5|
|COLt|COLt/USDT0|0x7d2dffa9e903b8377c96196da424c7965b06bcc3|
|PERt|PERt/USDT0|0x41af8cc0811dd07f167752b821cf5b11dba7ca85|
|MEXt|MEXt/USDT0|0x6edbf3ada7b6d9524c3248955538d573aae449cf|
|CHLt|CHLt/USDT0|0xa087f05ecd245476d7844f6eab28d98724696ac2|
|BOLt|BOLt/USDT0|0x9c7809c813bcc67e288c56d5ce5e0225996bfcd2|



#### Vaults 

Vaults de Morpho en Arbitrum, uno por token. Te permiten integrar crédito en moneda local del lado de quien toma el préstamo. 

|Token|Vault|Dirección|
|---|---|---|
|ARGt|ARGt Prime|0x9Dd3F844747AB78d616BF76DB92756E17A064aDD|
|BRAt|BRAt Prime|0x207396cbe2f6f50670eaa69584c9f723924c7fe9|
|COLt|COLt Prime|0x596FD4C6cAb1aeBCe2a847773Ca87F24349D0c56|
|PERt|PERt Prime|0x5eD1aeFACb3B6CCC3F924B1d8915754Ed780266F|
|MEXt|MEXt Prime|0x3046bc254bD2269eC5C3478692be619441Bb11A5|
|CHLt|CHLt Prime|0xb5cd19e8e884e8e0e6dD8eDF54C172BD865A7BAd|
|BOLt|BOLt Prime|0x8dE92AFea0266A67c451b5AD1318bc0A9d834a7E|



Los pools y vaults son de protocolos de terceros que operan de forma independiente de Twin. Cualquier rendimiento, retorno o resultado financiero de usar Twin Stablecoins en protocolos DeFi lo determinan esos 

HackaTwin · Track Stablecoins 

2 

protocolos, no Twin. Twin no avala, garantiza ni asume responsabilidad por ninguna aplicación DeFi de terceros. 

#### Bridges 

El bridge de Twin está construido sobre LayerZero V2 (estándar OFT): cada chain tiene un contrato adaptador que quema el token en la chain de origen y lo emite en la de destino. Hoy está activo para ARGt entre Arbitrum, Base, Polygon y Ethereum. El resto de los tokens y rutas se están deployando: si tu proyecto los necesita, consultá con los mentores antes de integrarlos. 

|Chain|Chain ID|LayerZero EID|Adaptador de ARGt|
|---|---|---|---|
|Arbitrum|42161|30110|0x4821FBf47B261F0D52Ba0F941CF67b8648f82691|
|Base|8453|30184|0xe80Af1d12426dB4394b147e04f179a38e7C5Dfe7|
|Polygon|137|30109|0xD70ad085684b2A9f4B5d54D7BDB2ecA37a273216|
|Ethereum|1|30101|0x5Eaa8760c3290eb78A2BE5E33b6696bE42e47DD9|



Cómo funciona: 

1. En la chain de origen, aprobá ARGt al adaptador de esa chain (approve del ERC-20). 

2. Llamá a `quoteSend` con el `SendParam` para obtener el fee de mensajería cross-chain ( `nativeFee` ). 

3. Llamá a `send` con el mismo `SendParam` , el fee y tu refund address, enviando `nativeFee` como value de la transacción. 

En el `SendParam` , `dstEid` es el endpoint ID de LayerZero de la chain de destino (no el chain ID), `to` es la dirección receptora como bytes32 (rellenada con ceros a la izquierda) y `amountLD` y `minAmountLD` van con 18 decimals. `extraOptions` , `composeMsg` y `oftCmd` van como `0x` salvo que necesites opciones adicionales. 

##### ABI del adaptador: 

```
// TwinBridgeAdapter extends OFTCore (LayerZero V2)
// User flow: approve ARGt -> send() on adapter (burns on source, mints on dest)
exportconstBRIDGE_ADAPTER_ABI=[
// quoteSend: estimate LayerZero fees before sending
{
    inputs:[
{
        name:'_sendParam',
        type:'tuple',
        components:[
{ name:'dstEid', type:'uint32'},
{ name:'to', type:'bytes32'},
{ name:'amountLD', type:'uint256'},
{ name:'minAmountLD', type:'uint256'},
{ name:'extraOptions', type:'bytes'},
{ name:'composeMsg', type:'bytes'},
{ name:'oftCmd', type:'bytes'},
],
},
{ name:'_payInLzToken', type:'bool'},
],
    name:'quoteSend',
    outputs:[
{
        name:'msgFee',
        type:'tuple',
        components:[
{ name:'nativeFee', type:'uint256'},
{ name:'lzTokenFee', type:'uint256'},
],
},
],
    stateMutability:'view',
```

HackaTwin · Track Stablecoins 

3 

```
    type:'function',
},
// send: bridge tokens cross-chain
{
    inputs:[
{
        name:'_sendParam',
        type:'tuple',
        components:[
{ name:'dstEid', type:'uint32'},
{ name:'to', type:'bytes32'},
{ name:'amountLD', type:'uint256'},
{ name:'minAmountLD', type:'uint256'},
{ name:'extraOptions', type:'bytes'},
{ name:'composeMsg', type:'bytes'},
{ name:'oftCmd', type:'bytes'},
],
},
{
        name:'_fee',
        type:'tuple',
        components:[
{ name:'nativeFee', type:'uint256'},
{ name:'lzTokenFee', type:'uint256'},
],
},
{ name:'_refundAddress', type:'address'},
],
    name:'send',
    outputs:[
{
        name:'msgReceipt',
        type:'tuple',
        components:[
{ name:'guid', type:'bytes32'},
{ name:'nonce', type:'uint64'},
{
            name:'fee',
            type:'tuple',
            components:[
{ name:'nativeFee', type:'uint256'},
{ name:'lzTokenFee', type:'uint256'},
],
},
],
},
{
        name:'oftReceipt',
        type:'tuple',
        components:[
{ name:'amountSentLD', type:'uint256'},
{ name:'amountReceivedLD', type:'uint256'},
],
},
],
    stateMutability:'payable',
    type:'function',
```

HackaTwin · Track Stablecoins 

4 

```
},
]asconst;
```

### Entregables 

La entrega cierra a las 18:00 del sábado 7/11. Lo que llegue después no se evalúa. 

|Entregable|Detalle|
|---|---|
|Repositorio|Público,con un README que indique token(s),chain y direcciones de contrato que usaste|
|Prueba onchain|Al menos un hash de transacción ejecutada por tu producto,verificable en el explorer|
|Demo funcional|Link a la app desplegada o demo en vivo durante el pitch|
|Pitch|3minutos de presentación y2minutos de preguntas del jurado en el demo day|



Podés usar boilerplate, librerías y templates abiertos. La lógica del producto tiene que construirse durante el evento, y el historial de commits tiene que mostrarlo. 

### Cómo vamos a evaluar 

El jurado puntúa cada criterio de 1 a 5. Los cuatro pesan lo mismo, y el puntaje final es el promedio sobre 100. 

|Criterio|Qué buscamos|
|---|---|
|Idea|Que sea original y aproveche lo que solo es posible con moneda local onchain.Las Twin Stablecoins tienen que ser<br>el núcleo del producto|
|Problema|Que resuelva un problema real,con un usuario identificado y un dolor concreto en la región|
|Negocio|Que tenga un camino viable a usuarios o clientes y un modelo que tenga sentido después del hack|
|Pitch|Una historia clara en3minutos,con una demo funcionando que respalde lo que contás|



Desempate: los jurados debaten para definir al ganador. 

### Aviso legal 

Las Twin Stablecoins son emitidas por Twin Finance S.A.S. No son valores negociables, depósitos ni moneda de curso legal, no están garantizadas por ningún gobierno y no generan intereses, rendimientos ni retornos. Twin actúa únicamente como emisor y no presta servicios de intercambio, crédito, custodia ni transferencia. 

Los pools, vaults y demás protocolos mencionados son de terceros, operan bajo sus propios términos y se incluyen solo como referencia técnica para el Hackathon, no como recomendación ni oferta. Twin no los opera, controla ni garantiza, y cualquier rendimiento o resultado de usarlos lo determinan esos protocolos, no proviene de las Twin Stablecoins ni de sus reservas y es bajo exclusivo riesgo del usuario. 

Los proyectos son desarrollados por los participantes bajo su exclusiva responsabilidad, y cualquier uso comercial requiere cumplir con la regulación aplicable. Los tokens entregados para testear se otorgan en montos mínimos, solo para pruebas técnicas durante el evento, y no constituyen una emisión ni una venta ni otorgan derecho de redención frente a Twin. Este contenido no constituye oferta pública ni asesoramiento financiero, de inversión ni legal. 

HackaTwin · Track Stablecoins 

5 

