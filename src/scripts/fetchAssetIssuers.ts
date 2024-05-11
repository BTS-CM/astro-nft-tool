import fs from "fs";
import { getObjects } from "./common.ts";

const chains = ["bitshares", "bitshares_testnet"];

function writeToFile(data: object, chain: string, fileName: string) {
  console.log(`Writing to ./src/data/${chain}/${fileName}.json`);
  fs.writeFileSync(`./src/data/${chain}/${fileName}.json`, JSON.stringify(data));
}

const main = async () => {
  for (const chain of chains) {
    if (fs.existsSync(`./src/data/${chain}/finalAssetData.json`)) {
      console.log(`Data already exists for ${chain}`);
      continue;
    }

    const minData = JSON.parse(fs.readFileSync(`./src/data/${chain}/minAssets.json`).toString());

    const objectIds: string[] = Array.from(
      new Set(minData.map((asset: any) => `1.2.${asset.i}`))
    ) as string[];

    let assetIssuers: any[];
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

    let finalData = minData.map((asset: any) => {
      const issuer = parsedIssuerResponse.find((issuer) => issuer.id === `1.2.${asset.i}`);
      return {
        x: asset.x,
        s: asset.s,
        i: asset.i,
        n: issuer && issuer.name ? issuer.name : "Unknown",
        y: asset.y,
      };
    });

    writeToFile(finalData, chain, "finalAssetData");
  }
  process.exit(0);
};

main();
