# P2P.me, but decentralized

On-chain QR payments for agertinian merchants. User pays with USDT (for now), the merchant receives ARGt in their EVM address (might use the one's on Belo).

The USDTs are converted into ARGt through Curve DeFi pools. Look into hackathon [Docs](./hackatwin-track-twin.md)

- Merchant: 
    - webapp login user password
    - set Belo evm address (ARGt, BRAt, ...)
    - generate a QR with ARGt amount for the order

- Customer:
    - webapp where they connect their wallet
    - scans QR and see their available assets to pay (USDT, for now)
    - the QR makes the user to send an on-chain TX to an smart contract
    - the smartcontract must convert the asset into ARGt and sending the ARGt tokens to the merchant's address
    - must receive confirm notification

How do we make money?
We provide liquidity on USDT/ARGt liquidity pool, and we make money off fees because every tx will go thru this pool.
We get more liquidity thru offering a webapp to stake USDT/ARGt easily from your business Belo account, and we do revshare. 

Who pays for customer's tx?
Gasless. Customer doesn't pay for the on-chain tx.
Nowadays, fees are super low. we can charge the merchant when receiving the final amount to refill the relayer. 