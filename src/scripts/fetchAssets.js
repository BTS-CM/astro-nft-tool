import fs from "fs";
import { fetchAllAssets } from "./common.js";

const chains = ["bitshares", "bitshares_testnet"];

const getAllAssetData = async (chain) => {
  const allData = [];

  if (fs.existsSync(`./src/data/${chain}/allAssets.json`)) {
    return;
  }

  let assetData;
  try {
    assetData = await fetchAllAssets(chain);
  } catch (error) {
    console.log(error);
    console.log(`Check you're not fetching ${chain} assets which don't exist.`);
    return;
  }

  allData.push(
    ...assetData.map((asset) => {
      const isNFT =
        asset.options.description && JSON.stringify(asset).includes("nft_object") ? true : false;

      const mappedResponse = {
        id: asset.id,
        symbol: asset.symbol,
        issuer: asset.issuer,
        isNFT: isNFT,
      };

      return mappedResponse;
    })
  );

  return allData;
};

function writeToFile(data, chain, fileName, prettyPrint = true) {
  console.log(`Writing to ./src/data/${chain}/${fileName}.json`);
  fs.writeFileSync(
    `./src/data/${chain}/${fileName}.json`,
    prettyPrint ? JSON.stringify(data, undefined, 4) : JSON.stringify(data)
  );
}

const main = async () => {
  for (const chain of chains) {
    const allData = await getAllAssetData(chain);

    if (!allData) {
      console.log(`No data to write for ${chain}`);
      continue;
    }

    if (allData) {
      writeToFile(allData, chain, "allAssets");
      const minimumAssetInfo = allData.map((asset) => {
        return {
          x: asset.id.replace("1.3.", ""),
          s: asset.symbol,
          i: asset.issuer.replace("1.2.", ""),
          y: asset.isNFT,
        };
      });
      writeToFile(minimumAssetInfo, chain, "minAssets", false);
    }
  }

  process.exit(0);
};

main();
