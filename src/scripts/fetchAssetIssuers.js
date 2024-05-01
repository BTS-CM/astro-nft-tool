import fs from "fs";
import { getObjects } from "./common.js";

const chains = ["bitshares", "bitshares_testnet"];

function writeToFile(data, chain, fileName) {
  console.log(`Writing to ./src/pages/data/${chain}/${fileName}.json`);
  fs.writeFileSync(`./src/pages/data/${chain}/${fileName}.json`, JSON.stringify(data));
}

const main = async () => {
  for (const chain of chains) {
    if (fs.existsSync(`./src/pages/data/${chain}/finalAssetData.json`)) {
      console.log(`Data already exists for ${chain}`);
      continue;
    }

    const minData = JSON.parse(fs.readFileSync(`./src/pages/data/${chain}/minAssets.json`));
    const objectIds = [...new Set(minData.map((asset) => `1.2.${asset.i}`))];

    let assetIssuers;
    try {
      assetIssuers = await getObjects(chain, objectIds);
    } catch (error) {
      console.log(error);
      return;
    }

    const parsedIssuerResponse = assetIssuers.map((issuer) => {
      return {
        id: issuer.id,
        name: issuer.name,
      };
    });

    let finalData = minData.map((asset) => {
      const issuer = parsedIssuerResponse.find((issuer) => issuer.id === `1.2.${asset.i}`);
      return {
        x: asset.x,
        s: asset.s,
        i: asset.i,
        n: issuer.name,
      };
    });

    writeToFile(finalData, chain, "finalAssetData");
  }
  process.exit(0);
};

main();
