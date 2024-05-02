import { nanoquery } from "@nanostores/query";

const [createAssetStore] = nanoquery({
  fetcher: async (...args: unknown[]) => {
    const chain = args[0] as string;
    const assetID = args[1] as string;
    return fetch(`/endpoints/${chain}/asset/${assetID}.json`).then((response) => response.json());
  },
});

const [createIssuedAssetStore] = nanoquery({
  fetcher: async (...args: unknown[]) => {
    const chain = args[0] as string;
    const username = args[1] as string;
    return fetch(`/endpoints/${chain}/issued/${username}.json`).then((response) => response.json());
  },
});

export { createAssetStore, createIssuedAssetStore };
