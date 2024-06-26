import Apis from "@/blockchain/ws/ApiInstances";
import { closeWSS } from "@/lib/common.js";

import btsCachedAssets from "@/data/bitshares/finalAssetData.json";
import testCachedAssets from "@/data/bitshares_testnet/finalAssetData.json";

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

  let currentAPI;
  try {
    currentAPI = await Apis.instance(
      _node,
      true,
      4000,
      { enableDatabase: true, enableCrypto: false, enableOrders: false },
      (error: Error) => console.log({ error })
    );
  } catch (error) {
    console.log({ error, location: "api instance failed" });
    return new Response(JSON.stringify({ error: "connection issues" }), {
      status: 500,
      statusText: "Error connecting to blockchain",
    });
  }

  if (!currentAPI.db_api()) {
    console.log("no db_api");
    try {
      await closeWSS(currentAPI);
    } catch (error) {
      console.log({ error, location: "closing wss" });
    }
    return new Response(JSON.stringify({ error: "connection issues" }), {
      status: 500,
      statusText: "Error connecting to blockchain database",
    });
  }

  let fullAccounts;
  try {
    fullAccounts = await currentAPI.db_api().exec("get_full_accounts", [[account], true]);
  } catch (error) {
    console.log(error);
  }

  if (!fullAccounts || !fullAccounts.length || !fullAccounts[0].length) {
    try {
      await closeWSS(currentAPI);
    } catch (error) {
      console.log({ error, location: "closing wss" });
    }
    return new Response(JSON.stringify({ error: "Invalid account" }), {
      status: 404,
      statusText: "Could not find requested Bitshares account",
    });
  }

  let accountAssets = fullAccounts[0][1].assets;

  if (!accountAssets || !accountAssets.length) {
    try {
      await closeWSS(currentAPI);
    } catch (error) {
      console.log({ error, location: "closing wss" });
    }
    return new Response(JSON.stringify({ error: "No assets found" }), {
      status: 404,
      statusText: "Could not find any assets for requested Bitshares account",
    });
  }

  let cachedAssets = chain === "bitshares" ? btsCachedAssets : testCachedAssets;

  let parsedAssets = cachedAssets.map((asset: any) => {
    return {
      id: "1.3." + asset.x,
      symbol: asset.s,
      isNFT: asset.y,
      issuer: "1.2." + asset.i,
      precision: asset.p,
    };
  });

  let retrievedAssets = parsedAssets.filter((x: any) => accountAssets.includes(x.id) && x.isNFT);

  let remainingAssets = accountAssets.filter((x: string) => {
    return !parsedAssets.find((y: any) => y.id === x);
  });

  if (!remainingAssets.length && !retrievedAssets.length) {
    try {
      await closeWSS(currentAPI);
    } catch (error) {
      console.log({ error, location: "closing wss" });
    }
    return new Response(JSON.stringify({ error: "No NFT assets found" }), {
      status: 404,
      statusText: "Could not find any NFT assets for requested Bitshares account",
    });
  }

  if (!remainingAssets.length) {
    // All assets were cached
    console.log("Returning cached asset data");
    try {
      await closeWSS(currentAPI);
    } catch (error) {
      console.log({ error, location: "closing wss" });
    }
    return new Response(JSON.stringify(retrievedAssets), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  let chunks = sliceIntoChunks(remainingAssets, 100);
  let chunkResponses: object[] = [];
  for (let i = 0; i < chunks.length; i++) {
    let response;
    try {
      response = await currentAPI.db_api().exec("lookup_asset_symbols", [chunks[i]]);
    } catch (error) {
      console.log({ error });
    }

    if (response && response.length) {
      chunkResponses = chunkResponses.concat(response);
    }
  }

  try {
    await closeWSS(currentAPI);
  } catch (error) {
    console.log({ error, location: "closing wss" });
  }

  let finalResult = chunkResponses.map((x: any) => {
    const isNFT = x.options.description && JSON.stringify(x).includes("nft_object") ? true : false;
    return {
      id: x.id,
      symbol: x.symbol,
      precision: x.precision,
      issuer: x.issuer,
      isNFT: isNFT,
    };
  });

  if (retrievedAssets.length) {
    finalResult = finalResult.concat(retrievedAssets);
  }

  console.log("Returning retrieved asset data");
  return new Response(
    JSON.stringify(
      finalResult.filter((x) => x.isNFT)
      //.map((x) => {
      //  return { id: x.id, symbol: x.symbol };
      //})
    ),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
