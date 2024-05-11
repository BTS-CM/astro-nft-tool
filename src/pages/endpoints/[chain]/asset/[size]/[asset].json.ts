import Apis from "@/blockchain/ws/ApiInstances";
import { closeWSS } from "@/lib/common.js";

interface Params {
  asset: string;
  chain: string;
  size: string;
}

let asset_regex = /\b\d+\.\d+\.(\d+)\b/;

export async function GET({ params }: { params: Params }) {
  const { asset, chain, size } = params;

  if (asset.match(asset_regex)) {
    return new Response(JSON.stringify({ error: "Invalid asset" }), {
      status: 404,
      statusText: "Error fetching Bitshares asset",
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

  let object;
  try {
    object = await currentAPI.db_api().exec("lookup_asset_symbols", [[asset]]);
  } catch (error) {
    console.log({ error });
  }

  try {
    await closeWSS(currentAPI);
  } catch (error) {
    console.log({ error, location: "closing wss" });
  }

  if (!object || !object.length || !object[0]) {
    return new Response(JSON.stringify({ error: "Invalid asset" }), {
      status: 404,
      statusText: "Error fetching Bitshares address",
    });
  }

  return new Response(
    JSON.stringify(
      size === "max"
        ? object[0]
        : {
            symbol: object[0].symbol,
            id: object[0].id,
            issuer: object[0].issuer,
            precision: object[0].precision,
          }
    ),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
