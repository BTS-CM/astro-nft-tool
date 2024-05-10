import Apis from "@/blockchain/ws/ApiInstances";
import { closeWSS } from "@/lib/common.js";

interface Params {
  account: string;
  chain: string;
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

  let object;
  try {
    object = await currentAPI.db_api().exec("get_accounts", [[account]]);
  } catch (error) {
    console.log({ error });
  }

  try {
    await closeWSS(currentAPI);
  } catch (error) {
    console.log({ error, location: "closing wss" });
  }

  if (!object || !object.length) {
    return new Response(JSON.stringify({ error: "Invalid account" }), {
      status: 404,
      statusText: "Error fetching Bitshares address",
    });
  }

  const finalResult =
    object && object.length
      ? {
          username: object[0].name,
          id: object[0].id,
          chain,
          referrer: object[0].referrer,
        }
      : null;

  return new Response(JSON.stringify(finalResult), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
