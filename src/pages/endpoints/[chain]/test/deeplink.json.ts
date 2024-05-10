interface Params {
  chain: "bitshares" | "bitshares_testnet";
}

export async function GET({ params }: { params: Params }) {
  const { chain } = params;

  if (!chain || !["bitshares", "bitshares_testnet"].includes(chain)) {
    return new Response(JSON.stringify({ error: "Invalid account" }), {
      status: 404,
      statusText: "Error fetching Bitshares address",
    });
  }

  let response;
  try {
    response = await fetch(`http://localhost:4321/endpoints/${chain}/deeplink.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chain: "bitshares",
        opType: "asset_create",
        operations: [
          {
            issuer: "1.2.1804072",
            symbol: "TESTASSET123456789",
            precision: 0,
            common_options: {
              max_supply: 1,
              market_fee_percent: 0,
              max_market_fee: 0,
              issuer_permissions: 0,
              flags: 0,
              core_exchange_rate: {
                base: {
                  amount: 1,
                  asset_id: "1.3.0",
                },
                quote: {
                  amount: 1,
                  asset_id: "1.3.6027",
                },
              },
              whitelist_authorities: [],
              blacklist_authorities: [],
              whitelist_markets: [],
              blacklist_markets: [],
              description: "test",
              extensions: {
                reward_percent: 0,
                whitelist_market_fee_sharing: [],
              },
            },
            is_prediction_market: false,
            extensions: null,
          },
        ],
      }),
    });
  } catch (error) {
    console.log({ error });
  }

  let finalresponse = response ? await response.json() : null;

  if (!finalresponse) {
    return new Response(JSON.stringify({ error: "Invalid account" }), {
      status: 404,
      statusText: "Error fetching Bitshares address",
    });
  }

  return new Response(JSON.stringify(finalresponse), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
