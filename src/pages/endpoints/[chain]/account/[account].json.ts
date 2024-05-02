import { Apis } from "bitsharesjs-ws";

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

  try {
    await Apis.instance(_node, true, 4000).init_promise;
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
      .exec("get_accounts", [[account]]);
  } catch (error) {
    console.log({ error });
  }

  try {
    await Apis.close();
  } catch (error) {
    console.log({ error, msg: "Error closing connection" });
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
