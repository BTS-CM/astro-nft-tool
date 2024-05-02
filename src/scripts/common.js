import { Apis } from "bitsharesjs-ws";

/**
 * Split an array into array chunks
 */
function _sliceIntoChunks(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    const chunk = arr.slice(i, i + size);
    chunks.push(chunk);
  }
  return chunks;
}

/**
 * Get multiple objects such as accounts, assets, etc
 */
async function getObjects(chain, object_ids) {
  return new Promise(async (resolve, reject) => {
    const _node = chain === "bitshares" ? "wss://node.xbts.io/ws" : "wss://testnet.xbts.io/ws";

    let currentAPI;
    try {
      currentAPI = await Apis.instance(_node, true, 4000).init_promise;
    } catch (error) {
      console.log({ error, msg: "instance failed" });
      reject(error);
      return;
    }

    let retrievedObjects = [];
    const chunksOfInputs = _sliceIntoChunks(object_ids, chain === "bitshares" ? 50 : 10);

    for (let i = 0; i < chunksOfInputs.length; i++) {
      const currentChunk = chunksOfInputs[i];
      let got_objects;
      try {
        got_objects = await Apis.instance().db_api().exec("get_objects", [currentChunk, false]);
      } catch (error) {
        console.log({ error });
        continue;
      }

      if (got_objects && got_objects.length) {
        retrievedObjects = retrievedObjects.concat(got_objects.filter((x) => x !== null));
      }
    }

    if (!retrievedObjects || !retrievedObjects.length) {
      throw new Error("Couldn't retrieve objects");
    }

    try {
      await Apis.close();
    } catch (error) {
      console.log({ error, msg: "Error closing connection" });
    }
    return resolve(retrievedObjects);
  });
}

/**
 * Get the latest ID for an object in the blockchain
 */
async function getMaxObjectIDs(chain, space_id, type_id) {
  return new Promise(async (resolve, reject) => {
    const _node = chain === "bitshares" ? "wss://node.xbts.io/ws" : "wss://testnet.xbts.io/ws";

    try {
      await Apis.instance(_node, true, 4000).init_promise;
    } catch (error) {
      console.log({ error });
      reject(error);
      return;
    }

    let nextObjectId;
    try {
      nextObjectId = await Apis.instance()
        .db_api()
        .exec("get_next_object_id", [space_id, type_id, false]);
    } catch (error) {
      console.log({ error, space_id, type_id });
      return;
    }

    try {
      await Apis.close();
    } catch (error) {
      console.log({ error, msg: "Error closing connection" });
    }

    return resolve(parseInt(nextObjectId.split(".")[2]) - 1);
  });
}

/**
 * Get multiple objects such as accounts, assets, etc
 */
async function fetchAllAssets(chain) {
  return new Promise(async (resolve, reject) => {
    const _node = chain === "bitshares" ? "wss://node.xbts.io/ws" : "wss://testnet.xbts.io/ws";

    let currentAPI;
    try {
      currentAPI = await Apis.instance(_node, true, 4000).init_promise;
    } catch (error) {
      console.log({ error, msg: "instance failed" });
      reject(error);
      return;
    }

    let nextObjectId;
    try {
      nextObjectId = await Apis.instance().db_api().exec("get_next_object_id", [1, 3, false]);
    } catch (error) {
      console.log({ error });
    }

    if (!nextObjectId) {
      try {
        await Apis.close();
      } catch (error) {
        console.log({ error, msg: "Error closing connection" });
      }
      return reject("Couldn't get next object ID");
    }

    const maxObjectId = parseInt(nextObjectId.split(".")[2]) - 1;

    let objectIds = Array.from({ length: maxObjectId }, (_, i) => `1.3.${i}`);

    let retrievedObjects = [];
    const chunksOfInputs = _sliceIntoChunks(objectIds, chain === "bitshares" ? 50 : 10);

    for (let i = 0; i < chunksOfInputs.length; i++) {
      const currentChunk = chunksOfInputs[i];
      let got_objects;
      try {
        got_objects = await Apis.instance().db_api().exec("get_objects", [currentChunk, false]);
      } catch (error) {
        console.log({ error });
        continue;
      }

      if (got_objects && got_objects.length) {
        retrievedObjects = retrievedObjects.concat(got_objects.filter((x) => x !== null));
      }
    }

    try {
      await Apis.close();
    } catch (error) {
      console.log({ error, msg: "Error closing connection" });
    }

    if (!retrievedObjects || !retrievedObjects.length) {
      return reject("Couldn't retrieve objects");
    }

    Apis.instance().close();
    return resolve(retrievedObjects);
  });
}

export { getObjects, getMaxObjectIDs, fetchAllAssets };