import React, { useState, useEffect, useSyncExternalStore } from "react";

import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { $currentUser } from "@/stores/users.ts";
import { useInitCache } from "@/effects/Init.ts";

interface RowProps {
  index: number;
  style: React.CSSProperties;
}

let asset_regex = /\b\d+\.\d+\.(\d+)\b/;

export default function SelectedIssuedAsset() {
  const usr = useSyncExternalStore($currentUser.subscribe, $currentUser.get, $currentUser.get);

  useInitCache();

  const [existingNFT, setExistingNFT] = useState<string>();
  useEffect(() => {
    async function parseUrlParams() {
      if (window.location.search) {
        const urlSearchParams = new URLSearchParams(window.location.search);
        const params = Object.fromEntries(urlSearchParams.entries());

        if (params.nft && !params.nft.match(asset_regex)) {
          setExistingNFT(params.nft);
        }
      }
    }
    parseUrlParams();
  }, []);

  return existingNFT ? <p>Editing NFT: {existingNFT}</p> : <p>Create NFT form</p>;
}
