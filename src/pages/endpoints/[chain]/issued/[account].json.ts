import { Apis } from "bitsharesjs-ws";

interface Params {
  account: string;
  chain: string;
}

function sliceIntoChunks(arr: string[], size: number) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    const chunk = arr.slice(i, i + size);
    chunks.push(chunk);
  }
  return chunks;
}

let account_regex = /\b\d+\.\d+\.(\d+)\b/;

export async function GET({ params }: { params: Params }) {
  const { account, chain } = params;

  if (account.match(account_regex)) {
    return new Response(JSON.stringify({ error: "Invalid account" }), {
      status: 404,
      statusText: "Error fetching Bitshares address",
    });
  }

  const _node = chain === "bitshares" ? "wss://node.xbts.io/ws" : "wss://testnet.xbts.io/ws";

  let connection;
  try {
    connection = await Apis.instance(_node, true, 4000).init_promise;
  } catch (error) {
    console.log({ error });
    return new Response(JSON.stringify({ error: "connection issues" }), {
      status: 500,
      statusText: "Error connecting to blockchain",
    });
  }

  let fullAccounts;
  try {
    fullAccounts = await Apis.instance()
      .db_api()
      .exec("get_full_accounts", [[account], true]);
  } catch (error) {
    console.log(error);
  }

  if (!fullAccounts.length || !fullAccounts[0].length) {
    return new Response(JSON.stringify({ error: "Invalid account" }), {
      status: 404,
      statusText: "Could not find requested Bitshares account",
    });
  }

  let accountAssets = fullAccounts[0][1].assets;

  if (!accountAssets || !accountAssets.length) {
    return new Response(JSON.stringify({ error: "No assets found" }), {
      status: 404,
      statusText: "Could not find any assets for requested Bitshares account",
    });
  }

  let chunks = sliceIntoChunks(accountAssets, 100);
  let chunkResponses: object[] = [];
  for (let i = 0; i < chunks.length; i++) {
    let response;
    try {
      response = await Apis.instance().db_api().exec("lookup_asset_symbols", [chunks[i]]);
    } catch (error) {
      console.log({ error });
    }

    if (response && response.length) {
      chunkResponses = chunkResponses.concat(response);
    }
  }

  Apis.instance().close();

  let finalResult = chunkResponses.map((x: any) => {
    const desc =
      x.options.description && JSON.parse(x.options.description)
        ? JSON.parse(x.options.description)
        : null;

    return {
      id: x.id,
      symbol: x.symbol,
      isNFT: desc && desc.nft_object ? true : false,
    };
  });

  return new Response(
    JSON.stringify(
      finalResult
        .filter((x) => x.isNFT)
        .map((x) => {
          return { id: x.id, symbol: x.symbol };
        })
    ),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
