import React, { useState, useEffect, useSyncExternalStore, useRef } from "react";

import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { $currentUser } from "@/stores/users.ts";
import { useInitCache } from "@/effects/Init.ts";
import { createAssetStore } from "@/effects/Queries.ts";
import { getFlagBooleans } from "@/lib/common.ts";

interface NFTObject {
  acknowledgements: string;
  artist: string;
  attestation: string;
  encoding: string;
  holder_license: string;
  license: string;
  narrative: string;
  title: string;
  tags: string;
  type: string;
  sig_pubkey_or_address?: string;
  [key: `media_${string}_multihash`]: string;
  [key: `media_${string}_multihashes`]: Array<{ url: string }>;
}

interface Description {
  main: string;
  market: string;
  nft_object: NFTObject;
  nft_signature?: string;
  short_name: string;
}

interface AssetOptions {
  max_supply: number;
  market_fee_percent: number;
  max_market_fee: number;
  issuer_permissions: number;
  flags: number;
  core_exchange_rate: {
    base: {
      amount: number;
      asset_id: string;
    };
    quote: {
      amount: number;
      asset_id: string;
    };
  };
  whitelist_authorities: string[];
  blacklist_authorities: string[];
  whitelist_markets: string[];
  blacklist_markets: string[];
  description: string;
  extensions?: {
    reward_percent?: number;
    whitelist_market_fee_sharing?: string[];
  };
}

interface ApiResponse {
  id: string;
  symbol: string;
  precision: number;
  issuer: string;
  options: AssetOptions;
  dynamic_asset_data_id: string;
  creation_block_num: number;
  creation_time: string;
  total_in_collateral: number;
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

  const [response, setResponse] = useState<ApiResponse>();
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    if (!usr || !usr.chain || !existingNFT) return;
    setLoading(true); // Start loading

    const assetStore = createAssetStore([usr.chain, existingNFT]);

    const unsub = assetStore.subscribe((result) => {
      if (result.error) {
        console.error(result.error);
        setLoading(false);
      }

      if (!result.loading) {
        if (result.data) {
          const res = result.data;
          console.log({ res });
          setResponse(res as ApiResponse);
        }
        setLoading(false);
      }
    });

    return () => {
      unsub();
      setLoading(false);
    };
  }, [usr, existingNFT]);

  const acknowledgements_ref = useRef<string>("");
  const artist_ref = useRef<string>("");
  const attestation_ref = useRef<string>("");
  const holder_license_ref = useRef<string>("");
  const license_ref = useRef<string>("");
  const narrative_ref = useRef<string>("");
  const title_ref = useRef<string>("");
  const tags_ref = useRef<string>("");
  const type_ref = useRef<string>("NFT/ART/VISUAL");
  const main_ref = useRef<string>("");
  const market_ref = useRef<string>(usr.chain === "bitshares" ? "BTS" : "TEST");
  const short_name_ref = useRef<string>("");
  const symbol_ref = useRef<string>("");
  const precision_ref = useRef<number>(0);
  const max_supply_ref = useRef<number>(1);
  const cer_base_amount_ref = useRef<number>(1);
  const cer_base_asset_id_ref = useRef<string>("1.3.0");
  const cer_quote_amount_ref = useRef<number>(1);
  const cer_quote_asset_id_ref = useRef<string>("1.3.1");
  const perm_charge_market_fee_ref = useRef<boolean>(true);
  const perm_white_list_ref = useRef<boolean>(true);
  const perm_override_authority_ref = useRef<boolean>(true);
  const perm_transfer_restricted_ref = useRef<boolean>(true);
  const perm_disable_confidential_ref = useRef<boolean>(true);
  const flag_charge_market_fee_ref = useRef<boolean>(false);
  const flag_white_list_ref = useRef<boolean>(false);
  const flag_override_authority_ref = useRef<boolean>(false);
  const flag_transfer_restricted_ref = useRef<boolean>(false);
  const flag_disable_confidential_ref = useRef<boolean>(false);

  useEffect(() => {
    if (
      response &&
      response.options &&
      response.options.description &&
      response.options.description.length
    ) {
      const options = response.options;
      const description: Description = JSON.parse(options.description);
      const nft_object = description.nft_object;

      acknowledgements_ref.current = nft_object.acknowledgements;
      artist_ref.current = nft_object.artist;
      attestation_ref.current = nft_object.attestation;
      holder_license_ref.current = nft_object.holder_license;
      license_ref.current = nft_object.license;
      narrative_ref.current = nft_object.narrative;
      title_ref.current = nft_object.title;
      tags_ref.current = nft_object.tags;
      type_ref.current = nft_object.type;
      main_ref.current = description.main;
      market_ref.current = description.market;
      short_name_ref.current = description.short_name;
      symbol_ref.current = response.symbol;
      precision_ref.current = response.precision;
      max_supply_ref.current = options.max_supply;
      cer_base_amount_ref.current = options.core_exchange_rate.base.amount;
      cer_base_asset_id_ref.current = options.core_exchange_rate.base.asset_id;
      cer_quote_amount_ref.current = options.core_exchange_rate.quote.amount;
      cer_quote_asset_id_ref.current = options.core_exchange_rate.quote.asset_id;

      let permissionBooleans =
        options && options.issuer_permissions
          ? getFlagBooleans(options.issuer_permissions)
          : {
              charge_market_fee: true,
              white_list: true,
              override_authority: true,
              transfer_restricted: true,
              disable_confidential: true,
            };

      let flagBooleans =
        options && options.flags
          ? getFlagBooleans(options.flags)
          : {
              charge_market_fee: false,
              white_list: false,
              override_authority: false,
              transfer_restricted: false,
              disable_confidential: false,
            };

      perm_charge_market_fee_ref.current = permissionBooleans.charge_market_fee;
      perm_white_list_ref.current = permissionBooleans.white_list;
      perm_override_authority_ref.current = permissionBooleans.override_authority;
      perm_transfer_restricted_ref.current = permissionBooleans.transfer_restricted;
      perm_disable_confidential_ref.current = permissionBooleans.disable_confidential;

      flag_charge_market_fee_ref.current = flagBooleans.charge_market_fee;
      flag_white_list_ref.current = flagBooleans.white_list;
      flag_override_authority_ref.current = flagBooleans.override_authority;
      flag_transfer_restricted_ref.current = flagBooleans.transfer_restricted;
      flag_disable_confidential_ref.current = flagBooleans.disable_confidential;
    }
  }, [response]);

  if (loading) {
    return <p>Loading {existingNFT}...</p>;
  }

  /**
   * Generate booleans for the permissions
   * @param {Object} values
   * @returns {Object}
   */
  function generatePermissionBooleans(values: any) {
    return {
      charge_market_fee: values.perm_charge_market_fee,
      white_list: values.perm_white_list,
      override_authority: values.perm_override_authority,
      transfer_restricted: values.perm_transfer_restricted,
      disable_confidential: values.perm_disable_confidential,
    };
  }

  /**
   * Generate booleans for the flags
   * @param {Object} values
   * @returns {Object}
   */
  function generateFlagBooleans(values: any) {
    return {
      charge_market_fee: values.flag_charge_market_fee,
      white_list: values.flag_white_list,
      override_authority: values.flag_override_authority,
      transfer_restricted: values.flag_transfer_restricted,
      disable_confidential: values.flag_disable_confidential,
    };
  }

  /**
   * Generate the NFT object
   * @param {Object} values
   * @returns {Object}
   */
  /*
  function generateNFTObj(values) {
    const nft_object = {
      acknowledgements: values.acknowledgements,
      artist: values.artist,
      attestation: values.attestation,
      encoding: 'ipfs',
      holder_license: values.holder_license,
      license: values.license,
      narrative: values.narrative,
      title: values.title,
      tags: values.tags,
      type: values.type,
      sig_pubkey_or_address: values.sig_pubkey_or_address,
    };

    asset_images.forEach((image) => {
      // Supports png, jpeg & gif, following the NFT spec
      const imageType = image.type;
      if (!nft_object[`media_${imageType}_multihash`]) {
        // only the first image is used for the main image
        nft_object[`media_${imageType}_multihash`] = image.url;
      }

      const sameTypeFiles = asset_images.filter((img) => img.type === imageType);
      if (sameTypeFiles && sameTypeFiles.length > 1) {
        if (!nft_object[`media_${imageType}_multihashes`]) {
          // initialise the ipfs multihashes array
          nft_object[`media_${imageType}_multihashes`] = [{
            url: image.url,
          }];
        } else {
          // add the image to the ipfs multihashes array
          nft_object[`media_${imageType}_multihashes`].push({
            url: image.url,
          });
        }
      }
    });

    return nft_object;
  }
  */

  /**
   * Signing primary form values with memo key prior to broadcast
   * @param {Object} values
   */
  /*
    async function processForm(values) {
      setInProgress(true);
      const permissionBooleans = generatePermissionBooleans(values);
      const flagBooleans = generateFlagBooleans(values);
      const nft_object = generateNFTObj(values);
  
      const issuer_permissions = getPermissions(permissionBooleans, false);
      const flags = getFlags(flagBooleans);
  
        const description = JSON.stringify({
          main: values.main,
          market: values.market,
          nft_object: nft_object,
          short_name: values.short_name,
        });
  
        const operation = mode === 'create'
          ? {
            // create asset json
            issuer: userID,
            symbol: values.symbol,
            precision: values.precision,
            common_options: {
              max_supply: values.max_supply,
              market_fee_percent: 0,
              max_market_fee: 0,
              issuer_permissions,
              flags,
              core_exchange_rate: {
                base: {
                  amount: values.cer_base_amount,
                  asset_id: values.cer_base_asset_id,
                },
                quote: {
                  amount: values.cer_quote_amount,
                  asset_id: values.cer_quote_asset_id,
                },
              },
              whitelist_authorities: [],
              blacklist_authorities: [],
              whitelist_markets: [],
              blacklist_markets: [],
              description,
              extensions: {
                reward_percent: 0,
                whitelist_market_fee_sharing: [],
              },
            },
            is_prediction_market: false,
            extensions: null,
          }
          : {
            // edit asset json
            issuer: userID,
            asset_to_update: asset.id,
            new_options: {
              max_supply: parseInt(values.max_supply, 10),
              market_fee_percent: 0,
              max_market_fee: 0,
              issuer_permissions,
              flags,
              core_exchange_rate: {
                base: {
                  amount: parseInt(values.cer_base_amount, 10),
                  asset_id: values.cer_base_asset_id,
                },
                quote: {
                  amount: parseInt(values.cer_quote_amount, 10),
                  asset_id: values.cer_quote_asset_id,
                },
              },
              whitelist_authorities: [],
              blacklist_authorities: [],
              whitelist_markets: [],
              blacklist_markets: [],
              description,
              extensions: {
                reward_percent: 0,
                whitelist_market_fee_sharing: [],
              },
            },
            is_prediction_market: false,
            extensions: null,
          };
  
        if (accountType === 'BEET') {
          let tx;
          try {
            tx = await broadcastOperation(
              connection,
              wsURL,
              mode === 'create' ? 'asset_create' : 'asset_update',
              operation,
            );
          } catch (error) {
            console.log(error);
            setInProgress(false);
            return;
          }
  
          setBroadcastResult(tx);
        } else {
          let generatedLocalContents;
          try {
            generatedLocalContents = await generateDeepLink(
              'nft_creator',
              environment === "bitshares" ? "BTS" : "BTS_TEST",
              wsURL,
              mode === 'create'
                ? 'asset_create'
                : 'asset_update',
              [operation],
            );
          } catch (error) {
            console.log(error);
            setInProgress(false);
            return;
          }
  
          if (generatedLocalContents) {
            setLocalContents(generatedLocalContents);
          }
        }
  
        setInProgress(false);
    }
    */

  const handleSubmit = (event: any) => {
    event.preventDefault();

    console.log("Form submitted");
  };

  return (
    <div className="grid grid-cols-1">
      <div className="col-span-1">Result</div>
    </div>
  );
}
