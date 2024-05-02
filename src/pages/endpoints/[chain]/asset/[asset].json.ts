import { Apis } from "bitsharesjs-ws";

interface Params {
  asset: string;
  chain: string;
}

let asset_regex = /\b\d+\.\d+\.(\d+)\b/;

export async function GET({ params }: { params: Params }) {
  const { asset, chain } = params;

  if (asset.match(asset_regex)) {
    return new Response(JSON.stringify({ error: "Invalid asset" }), {
      status: 404,
      statusText: "Error fetching Bitshares asset",
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

  let object;
  try {
    object = await Apis.instance()
      .db_api()
      .exec("lookup_asset_symbols", [[asset]]);
  } catch (error) {
    console.log({ error });
  }

  try {
    await Apis.close();
  } catch (error) {
    console.log({ error, msg: "Error closing connection" });
  }

  if (!object || !object.length) {
    return new Response(JSON.stringify({ error: "Invalid asset" }), {
      status: 404,
      statusText: "Error fetching Bitshares address",
    });
  }

  return new Response(JSON.stringify(object[0]), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
