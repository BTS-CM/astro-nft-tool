import React, { useState, useEffect, useSyncExternalStore } from "react";
import { FixedSizeList as List } from "react-window";

import HoverInfo from "@/components/react/HoverInfo.tsx";
import AssetPermission from "@/components/react/AssetPermission.tsx";
import AssetFlag from "@/components/react/AssetFlag.tsx";
import DeepLinkDialog from "@/components/react/DeepLinkDialog.tsx";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { $currentUser } from "@/stores/users.ts";
import { useInitCache } from "@/effects/Init.ts";
import { createAssetStore } from "@/effects/Queries.ts";
import { getPermissions, getFlags, getFlagBooleans } from "@/lib/permissions.ts";

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

interface RowProps {
  index: number;
  style: React.CSSProperties;
}

interface NFTMEDIA {
  url: string;
  type: string;
}

let asset_regex = /\b\d+\.\d+\.(\d+)\b/;

function getImages(nft_object: NFTObject): NFTMEDIA[] {
  if (!nft_object) return [];

  const object_keys = Object.keys(nft_object);

  if (object_keys.find((x) => x.includes("media_") && x.includes("_multihashes"))) {
    return (
      object_keys
        .filter((key: string) => key.includes("media_") && key.includes("_multihashes"))
        .map((key: string) => {
          const current: any = nft_object[key as keyof NFTObject];
          const type = key.split("_")[1].toUpperCase();
          return current.map((image: any) => ({ url: image.url, type }));
        })
        .flat() || []
    );
  }

  // Looking for a single multihash

  return (
    object_keys
      .filter((key: string) => key.includes("media_") && !key.includes("_multihash"))
      .map((key: string) => {
        const current: any = nft_object[key as keyof NFTObject];
        const type = key.split("_")[1].toUpperCase();
        return { url: current, type };
      })
      .flat() || []
  );
}

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
  useEffect(() => {
    if (!usr || !usr.chain || !existingNFT) return;

    const assetStore = createAssetStore([usr.chain, existingNFT]);

    const unsub = assetStore.subscribe((result) => {
      if (result.error) {
        console.error(result.error);
      }

      if (!result.loading) {
        if (result.data) {
          const res = result.data;
          setResponse(res as ApiResponse);
        }
      }
    });

    return () => {
      unsub();
    };
  }, [usr, existingNFT]);

  // NFT info
  const [acknowledgements, setAcknowledgements] = useState<string>("");
  const [artist, setArtist] = useState<string>("");
  const [attestation, setAttestation] = useState<string>("");
  const [holderLicense, setHolderLicense] = useState<string>("");
  const [license, setLicense] = useState<string>("");
  const [narrative, setNarrative] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [type, setType] = useState<string>("NFT/ART/VISUAL");
  const [main, setMain] = useState<string>("");

  // Asset info
  const [market, setMarket] = useState<string>(usr.chain === "bitshares" ? "BTS" : "TEST");
  const [shortName, setShortName] = useState<string>("");
  const [symbol, setSymbol] = useState<string>("");
  const [precision, setPrecision] = useState<number>(0);
  const [maxSupply, setMaxSupply] = useState<number>(1);
  const [cerBaseAmount, setCerBaseAmount] = useState<number>(1);
  const [cerBaseAssetId, setCerBaseAssetId] = useState<string>("1.3.0");
  const [cerQuoteAmount, setCerQuoteAmount] = useState<number>(1);
  const [cerQuoteAssetId, setCerQuoteAssetId] = useState<string>("1.3.1");

  // Check if the permissions have been permanently disabled:
  const [disabledChargeMarketFee, setDisabledChargeMarketFee] = useState<boolean>(false); // For
  const [disabledWhiteList, setDisabledWhiteList] = useState<boolean>(false);
  const [disabledOverrideAuthority, setDisabledOverrideAuthority] = useState<boolean>(false);
  const [disabledTransferRestricted, setDisabledTransferRestricted] = useState<boolean>(false);
  const [disabledDisableConfidential, setDisabledDisableConfidential] = useState<boolean>(false);

  // Initializing permissions
  const [permChargeMarketFee, setPermChargeMarketFee] = useState<boolean>(true);
  const [permWhiteList, setPermWhiteList] = useState<boolean>(true);
  const [permOverrideAuthority, setPermOverrideAuthority] = useState<boolean>(true);
  const [permTransferRestricted, setPermTransferRestricted] = useState<boolean>(true);
  const [permDisableConfidential, setPermDisableConfidential] = useState<boolean>(true);

  // Initializing flags
  const [flagChargeMarketFee, setFlagChargeMarketFee] = useState<boolean>(false);
  const [flagWhiteList, setFlagWhiteList] = useState<boolean>(false);
  const [flagOverrideAuthority, setFlagOverrideAuthority] = useState<boolean>(false);
  const [flagTransferRestricted, setFlagTransferRestricted] = useState<boolean>(false);
  const [flagDisableConfidential, setFlagDisableConfidential] = useState<boolean>(false);

  const [nftMedia, setNFTMedia] = useState<NFTMEDIA[]>([]);
  const [newMediaType, setNewMediaType] = useState<string>("");
  const [newMediaUrl, setNewMediaUrl] = useState<string>("");

  const [trx, setTRX] = useState<object[]>();

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

      setAcknowledgements(nft_object.acknowledgements);
      setArtist(nft_object.artist);
      setAttestation(nft_object.attestation);
      setHolderLicense(nft_object.holder_license);
      setLicense(nft_object.license);
      setNarrative(nft_object.narrative);
      setTitle(nft_object.title);
      setTags(nft_object.tags);
      setType(nft_object.type);
      setMain(description.main);
      setMarket(description.market);
      setShortName(description.short_name);
      setSymbol(response.symbol);
      setPrecision(response.precision);
      setMaxSupply(options.max_supply);
      setCerBaseAmount(options.core_exchange_rate.base.amount);
      setCerBaseAssetId(options.core_exchange_rate.base.asset_id);
      setCerQuoteAmount(options.core_exchange_rate.quote.amount);
      setCerQuoteAssetId(options.core_exchange_rate.quote.asset_id);

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

      setPermChargeMarketFee(permissionBooleans.charge_market_fee || false);
      setPermWhiteList(permissionBooleans.white_list || false);
      setPermOverrideAuthority(permissionBooleans.override_authority || false);
      setPermTransferRestricted(permissionBooleans.transfer_restricted || false);
      setPermDisableConfidential(permissionBooleans.disable_confidential || false);

      if (permissionBooleans.charge_market_fee === true) {
        setDisabledChargeMarketFee(true);
      }

      if (permissionBooleans.white_list === true) {
        setDisabledWhiteList(true);
      }

      if (permissionBooleans.override_authority === true) {
        setDisabledOverrideAuthority(true);
      }

      if (permissionBooleans.transfer_restricted === true) {
        setDisabledTransferRestricted(true);
      }

      if (permissionBooleans.disable_confidential === true) {
        setDisabledDisableConfidential(true);
      }

      setFlagChargeMarketFee(flagBooleans.charge_market_fee || false);
      setFlagWhiteList(flagBooleans.white_list || false);
      setFlagOverrideAuthority(flagBooleans.override_authority || false);
      setFlagTransferRestricted(flagBooleans.transfer_restricted || false);
      setFlagDisableConfidential(flagBooleans.disable_confidential || false);

      if (nft_object) {
        //const blah: NFTMEDIA[] = getImages(nft_object);
        setNFTMedia(getImages(nft_object));
      }
    }
  }, [response]);

  const MediaRow: React.FC<RowProps> = ({ index, style }) => {
    if (!nftMedia || !nftMedia.length || !nftMedia[index]) {
      return;
    }

    let res = nftMedia[index] as { url: string; type: string };

    return (
      <div style={{ ...style }} key={`dialogrow-${index}`} className="grid grid-cols-4">
        <div className="col-span-1">{res.type}</div>
        <div className="col-span-1">
          <Dialog>
            <DialogTrigger>
              <Button className="h-5" variant="outline">
                Full URL
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white w-full max-w-4xl bg-gray-100">
              <DialogHeader>
                <DialogTitle>Full IPFS URL</DialogTitle>
              </DialogHeader>
              <p>{res.url}</p>
            </DialogContent>
          </Dialog>
        </div>
        <div className="col-span-1">{res.url.split("/").pop()}</div>
        <div className="col-span-1">
          <Button
            variant="outline"
            className="w-5 h-5"
            onClick={() => {
              setNFTMedia(nftMedia.filter((x) => x.url !== res.url));
            }}
          >
            ❌
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-5">
      <div className="col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              <h4>NFT multimedia details</h4>
            </CardTitle>
            <CardDescription>
              <Label>This NFT currently contains {nftMedia.length} IPFS file URLs.</Label>
              <br />
              <Label>
                Supported filetypes include images, video, audio, 3d files, documents, etc.
              </Label>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog
              onOpenChange={(open) => {
                if (!open) {
                  setNewMediaUrl("");
                }
              }}
            >
              <DialogTrigger>
                <Button className="h-8" variant="outline">
                  Modify multimedia contents
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white w-full max-w-4xl bg-gray-100">
                <DialogHeader>
                  <DialogTitle>Modifying this NFT's multimedia contents</DialogTitle>
                </DialogHeader>
                <Card>
                  <CardHeader>
                    <CardTitle>Current IPFS media</CardTitle>
                    <CardDescription>
                      This NFT currently references {nftMedia.length} IPFS objects, feel free to
                      add/remove more.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!nftMedia || !nftMedia.length ? (
                      <p>No IPFS media found</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-4">
                          <div className="col-span-1">Type</div>
                          <div className="col-span-1">Content Identifier</div>
                          <div className="col-span-1">Filename</div>
                          <div className="col-span-1">Delete?</div>
                        </div>
                        <List
                          width={"100%"}
                          height={125}
                          itemCount={nftMedia.length}
                          itemSize={25}
                          className="w-full"
                        >
                          {({ index, style }) => <MediaRow index={index} style={style} />}
                        </List>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Add new IPFS media</CardTitle>
                    <CardDescription>
                      Don't include an IPFS gateway host in NFT media URLs, as 3rd parties will use
                      their own gateways to access the content.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4">
                      <div className="col-span-3 mr-3">
                        <Input
                          placeholder="/ipfs/cid/image.png"
                          type="text"
                          onInput={(e) => setNewMediaUrl(e.currentTarget.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newMediaUrl && newMediaType) {
                              const temp_urls = nftMedia.map((x) => x.url);
                              if (temp_urls.includes(newMediaUrl)) {
                                console.log("Already exists");
                                setNewMediaUrl("");
                                return;
                              }

                              setNFTMedia(
                                nftMedia && nftMedia.length
                                  ? [...nftMedia, { url: newMediaUrl, type: newMediaType }]
                                  : [{ url: newMediaUrl, type: newMediaType }]
                              );
                              setNewMediaUrl("");
                            }
                          }}
                          value={newMediaUrl}
                        />
                      </div>
                      <div className="col-span-1">
                        <Select onValueChange={setNewMediaType}>
                          <SelectTrigger className="w-[105px]">
                            <SelectValue placeholder="File type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Image formats</SelectLabel>
                              <SelectItem value="PNG">PNG</SelectItem>
                              <SelectItem value="WEBP">WEBP</SelectItem>
                              <SelectItem value="JPEG">JPEG</SelectItem>
                              <SelectItem value="GIF">GIF</SelectItem>
                              <SelectItem value="TIFF">TIFF</SelectItem>
                              <SelectItem value="BMP">BMP</SelectItem>
                              <SelectLabel>Audio formats</SelectLabel>
                              <SelectItem value="MP3">MP3</SelectItem>
                              <SelectItem value="MP4">MP4</SelectItem>
                              <SelectItem value="M4A">M4A</SelectItem>
                              <SelectItem value="OGG">OGG</SelectItem>
                              <SelectItem value="FLAC">FLAC</SelectItem>
                              <SelectItem value="WAV">WAV</SelectItem>
                              <SelectItem value="WMA">WMA</SelectItem>
                              <SelectItem value="AAC">AAC</SelectItem>
                              <SelectLabel>Video formats</SelectLabel>
                              <SelectItem value="WEBM">WEBM</SelectItem>
                              <SelectItem value="MOV">MOV</SelectItem>
                              <SelectItem value="QT">QT</SelectItem>
                              <SelectItem value="AVI">AVI</SelectItem>
                              <SelectItem value="WMV">WMV</SelectItem>
                              <SelectItem value="MPEG">MPEG</SelectItem>
                              <SelectLabel>Document formats</SelectLabel>
                              <SelectItem value="PDF">PDF</SelectItem>
                              <SelectItem value="DOCX">DOCX</SelectItem>
                              <SelectItem value="ODT">ODT</SelectItem>
                              <SelectItem value="XLSX">XLSX</SelectItem>
                              <SelectItem value="ODS">ODS</SelectItem>
                              <SelectItem value="PPTX">PPTX</SelectItem>
                              <SelectItem value="TXT">TXT</SelectItem>
                              <SelectLabel>3D files</SelectLabel>
                              <SelectItem value="OBJ">OBJ</SelectItem>
                              <SelectItem value="FBX">FBX</SelectItem>
                              <SelectItem value="GLTF">GLTF</SelectItem>
                              <SelectItem value="3DS">3DS</SelectItem>
                              <SelectItem value="STL">STL</SelectItem>
                              <SelectItem value="COLLADA">COLLADA</SelectItem>
                              <SelectItem value="3MF">3MF</SelectItem>
                              <SelectItem value="BLEND">BLEND</SelectItem>
                              <SelectItem value="SKP">SKP</SelectItem>
                              <SelectItem value="VOX">VOX</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4">
                        {newMediaType &&
                        newMediaType.length &&
                        newMediaUrl &&
                        newMediaUrl.length ? (
                          <Button
                            className="mt-3"
                            onClick={() => {
                              const temp_urls = nftMedia.map((x) => x.url);
                              if (temp_urls.includes(newMediaUrl)) {
                                console.log("Already exists");
                                setNewMediaUrl("");
                                return;
                              }

                              setNFTMedia([...nftMedia, { url: newMediaUrl, type: newMediaType }]);
                              setNewMediaUrl("");
                            }}
                          >
                            Submit
                          </Button>
                        ) : (
                          <Button className="mt-3" disabled>
                            Submit
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger>
                            <Button className="mt-3 ml-3">IPFS Hosting solutions</Button>
                          </DialogTrigger>
                          <DialogContent className="bg-white">
                            <DialogHeader>
                              <DialogTitle>IPFS Hosting solutions</DialogTitle>
                              <DialogDescription>
                                Check out the following example IPFS hosting/pinning services!
                                <br />
                                By uploading to IPFS you save yourself considerably on fees!
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-3 gap-3">
                              <a href="https://www.pinata.cloud/">
                                <Button>Pinata.cloud</Button>
                              </a>
                              <a href="https://nft.storage/">
                                <Button>NFT.storage</Button>
                              </a>
                              <a href="https://web3.storage/">
                                <Button>Web3.storage</Button>
                              </a>
                              <a href="https://fleek.co/ipfs-gateway/">
                                <Button>Fleek.co</Button>
                              </a>
                              <a href="https://infura.io/product/ipfs">
                                <Button>Infura.io</Button>
                              </a>
                              <a href="https://landing.storj.io/permanently-pin-with-storj-dcs">
                                <Button>StorJ</Button>
                              </a>
                              <a href="https://www.eternum.io/">
                                <Button>Eternum.io</Button>
                              </a>
                              <a href="https://blog.ipfs.io/2021-04-05-storing-nfts-on-ipfs/">
                                <Button>IPFS Docs</Button>
                              </a>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
      <div className="col-span-1">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Asset details</CardTitle>
            <CardDescription></CardDescription>
          </CardHeader>
          <CardContent>
            <Label>Bitshares account used for NFT issuance</Label>
            <Input
              placeholder="Account"
              value={usr && usr.id ? usr.id : "???"}
              type="text"
              readOnly
              disabled
            />
            <Label>Asset symbol</Label>
            <Input
              placeholder="Symbol"
              value={symbol}
              type="text"
              onInput={(e) => setSymbol(e.currentTarget.value)}
            />
            <Label>Main description</Label>
            <Input
              placeholder="Description"
              value={main}
              type="text"
              onInput={(e) => setMain(e.currentTarget.value)}
            />
            <Label>Short name</Label>
            <Input
              placeholder="Short name"
              value={shortName}
              type="text"
              onInput={(e) => setShortName(e.currentTarget.value)}
            />
            <Label>Market</Label>
            <Input
              placeholder="Market"
              value={market}
              type="text"
              onInput={(e) => setMarket(e.currentTarget.value)}
            />
            <Label>Maximum supply</Label>
            <Input
              placeholder="Max supply"
              value={maxSupply}
              type="number"
              onInput={(e) => setMaxSupply(parseInt(e.currentTarget.value))}
            />
            <Label>Asset precision</Label>
            <Input
              placeholder="Precision"
              value={precision}
              type="number"
              onInput={(e) => setPrecision(parseInt(e.currentTarget.value))}
            />
          </CardContent>
        </Card>
      </div>
      <div className="col-span-1">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Core Exchange Rate</CardTitle>
            <CardDescription></CardDescription>
          </CardHeader>
          <CardContent>
            <Label>Base amount</Label>
            <Input
              placeholder="Base amount"
              value={cerBaseAmount}
              type="text"
              onInput={(e) => setCerBaseAmount(parseInt(e.currentTarget.value))}
            />
            <Label>Base asset ID</Label>
            <Input
              placeholder="Base asset ID"
              value={cerBaseAssetId}
              type="text"
              onInput={(e) => setCerBaseAssetId(e.currentTarget.value)}
            />
            <Label>Quote amount</Label>
            <Input
              placeholder="Quote amount"
              value={cerQuoteAmount}
              type="text"
              onInput={(e) => setCerQuoteAmount(parseInt(e.currentTarget.value))}
            />
            <Label>Quote Asset ID</Label>
            <Input
              placeholder="Quote asset ID"
              value={cerQuoteAssetId}
              type="text"
              onInput={(e) => setCerQuoteAssetId(e.currentTarget.value)}
            />
          </CardContent>
        </Card>
      </div>
      <div className="col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>NFT Details</CardTitle>
            <CardDescription>
              These NFT detail fields are required by the{" "}
              <a
                href="https://github.com/Bit20-Creative-Group/BitShares-NFT-Specification"
                className="text-purple-500"
              >
                Bitshares NFT spec
              </a>
              , use the spec to properly describe your NFT.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-1">
                <HoverInfo
                  content="This is the title of your NFT, make sure it's unique and descriptive as it may be presented within various NFT galleries/explorers."
                  header="NFT Title"
                />
                <Input
                  placeholder="Title"
                  value={title}
                  type="text"
                  onInput={(e) => setTitle(e.currentTarget.value)}
                />
                <HoverInfo
                  content="Name or pseudonym of the artist. May also include aliases or online names or handles, to include blockchain account names or addresses which might facilitate authenticating a signing key. "
                  header="NFT Artist"
                />
                <Input
                  placeholder="Artist"
                  value={artist}
                  type="text"
                  onInput={(e) => setArtist(e.currentTarget.value)}
                />
                <HoverInfo
                  content="A personal statement from the artist describing the work, such as what the work means to them, or what inspired it. May include details of it's creation, etc. It's a freeform field, and can be adapted as appropriate for the piece. Example, if the work is an avatar, playing card, role playing character, etc., then this field may also include stats and abilities, strengths, weaknesses, etc."
                  header="NFT Narrative"
                />
                <Input
                  placeholder="Narrative"
                  value={narrative}
                  type="text"
                  onInput={(e) => setNarrative(e.currentTarget.value)}
                />
                <HoverInfo
                  content="Comma-separated list of keywords to facilitate topic/interest searches."
                  header="NFT Tags"
                />
                <Input
                  placeholder="Tags"
                  value={tags}
                  type="text"
                  onInput={(e) => setTags(e.currentTarget.value)}
                />
                <HoverInfo
                  content="A string which describes the type of NFT, such as 'NFT/ART/VISUAL', 'NFT/ART/3D', 'NFT/ART/ANIMATION', 'NFT/ART/AUDIO', 'NFT/ART/VIDEO', 'NFT/ART/TEXT', 'NFT/ART/DOCUMENT', 'NFT/ART/OTHER', etc"
                  header="NFT Type"
                />
                <Input
                  placeholder="Type"
                  value={type}
                  type="text"
                  onInput={(e) => setType(e.currentTarget.value)}
                />
              </div>
              <div className="col-span-1">
                <HoverInfo
                  content="Here the artist or originator of the encapsulated material commits or dedicates the material to the blockchain, expressly naming the token or asset ID under which the work will live, and attests to its qualified or unqualified uniqueness. E.g., an artist may attest that no other NFT encapsulation of this work exists, and may declare intent as to future re-issues, or tokenization on other chains, etc."
                  header="NFT Attestation"
                />
                <Input
                  placeholder="Attestation"
                  value={attestation}
                  type="text"
                  onInput={(e) => setAttestation(e.currentTarget.value)}
                />
                <HoverInfo
                  content="Acknowledgments or additional credits for the digital token."
                  header="NFT Acknowledgements"
                />
                <Input
                  placeholder="Acknowledgements"
                  value={acknowledgements}
                  type="text"
                  onInput={(e) => setAcknowledgements(e.currentTarget.value)}
                />
                <HoverInfo
                  content="If the token grants additional license for the use of the creative work specifically to token holders, this can be specified here. An example of such a license might be granting to the holder of the NFT token the right print and sell physical copies of the tokenized artwork, or to collect royalties for commercial use of the artwork, etc."
                  header="NFT holders license"
                />
                <Input
                  placeholder="Holder license"
                  value={holderLicense}
                  type="text"
                  onInput={(e) => setHolderLicense(e.currentTarget.value)}
                />
                <HoverInfo
                  content="License under which the artwork is released. Often, this will be a simple license identifier, such as 'CC BY-NC-SA 2.0', though it can also be a fully specified verbose license."
                  header="NFT license"
                />
                <Input
                  placeholder="License"
                  value={license}
                  type="text"
                  onInput={(e) => setLicense(e.currentTarget.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="col-span-2">
        <div className="grid grid-cols-2 gap-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Permissions</CardTitle>
              <CardDescription>Note: Disabling permissions is a permanent decision</CardDescription>
            </CardHeader>
            <CardContent>
              <AssetPermission
                alreadyDisabled={disabledChargeMarketFee}
                id={"charge_market_fee"}
                allowedText={"Market fees allowed (charge_market_fee)"}
                disabledText={"Market fees disabled"}
                permission={permChargeMarketFee}
                setPermission={setPermChargeMarketFee}
                flag={flagChargeMarketFee}
                setFlag={setFlagChargeMarketFee}
              />
              <AssetPermission
                alreadyDisabled={disabledWhiteList}
                id={"white_list"}
                allowedText={"White list allowed (white_list)"}
                disabledText={"White list disabled"}
                permission={permWhiteList}
                setPermission={setPermWhiteList}
                flag={flagWhiteList}
                setFlag={setFlagWhiteList}
              />
              <AssetPermission
                alreadyDisabled={disabledOverrideAuthority}
                id={"override_authority"}
                allowedText={"Override authority allowed (override_authority)"}
                disabledText={"Override authority disabled"}
                permission={permOverrideAuthority}
                setPermission={setPermOverrideAuthority}
                flag={flagOverrideAuthority}
                setFlag={setFlagOverrideAuthority}
              />
              <AssetPermission
                alreadyDisabled={disabledTransferRestricted}
                id={"transfer_restricted"}
                allowedText={"Transfer restricted allowed (transfer_restricted)"}
                disabledText={"Transfer restricted disabled"}
                permission={permTransferRestricted}
                setPermission={setPermTransferRestricted}
                flag={flagTransferRestricted}
                setFlag={setFlagTransferRestricted}
              />
              <AssetPermission
                alreadyDisabled={disabledDisableConfidential}
                id={"disable_confidential"}
                allowedText={"Disable confidential allowed (disable_confidential)"}
                disabledText={"Disable confidential disabled"}
                permission={permDisableConfidential}
                setPermission={setPermDisableConfidential}
                flag={flagDisableConfidential}
                setFlag={setFlagDisableConfidential}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Permission flags</CardTitle>
              <CardDescription>
                Each allowed asset permission can be toggled on/off.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssetFlag
                alreadyDisabled={disabledChargeMarketFee}
                id={"charge_market_fee_flag"}
                allowedText={"Market fees enabled"}
                disabledText={"Market fees disabled"}
                permission={permChargeMarketFee}
                flag={flagChargeMarketFee}
                setFlag={setFlagChargeMarketFee}
              />
              <AssetFlag
                alreadyDisabled={disabledWhiteList}
                id={"white_list_flag"}
                allowedText={"White list enabled"}
                disabledText={"White list disabled"}
                permission={permWhiteList}
                flag={flagWhiteList}
                setFlag={setFlagWhiteList}
              />
              <AssetFlag
                alreadyDisabled={disabledOverrideAuthority}
                id={"override_authority_flag"}
                allowedText={"Override authority enabled"}
                disabledText={"Override authority disabled"}
                permission={permOverrideAuthority}
                flag={flagOverrideAuthority}
                setFlag={setFlagOverrideAuthority}
              />
              <AssetFlag
                alreadyDisabled={disabledTransferRestricted}
                id={"transfer_restricted_flag"}
                allowedText={"Transfer restricted enabled"}
                disabledText={"Transfer restricted disabled"}
                permission={permTransferRestricted}
                flag={flagTransferRestricted}
                setFlag={setFlagTransferRestricted}
              />
              <AssetFlag
                alreadyDisabled={disabledDisableConfidential}
                id={"disable_confidential_flag"}
                allowedText={"Disable confidential enabled"}
                disabledText={"Disable confidential disabled"}
                permission={permDisableConfidential}
                flag={flagDisableConfidential}
                setFlag={setFlagDisableConfidential}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Broadcast via Beet/BeetEOS clients</CardTitle>
            <CardDescription>
              You can use either the{" "}
              <a href="" className="text-purple-500">
                Bitshares Beet multiwallet
              </a>{" "}
              or the{" "}
              <a href="" className="text-purple-500">
                BeetEOS multiwallet
              </a>{" "}
              to broadcast your NFT operations.
              <br />
              Once you're ready to broadcast your create/update asset operation using the above form
              data, simple click the button below to proceed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="h-8"
              onClick={async () => {
                const nft_object: NFTObject = {
                  acknowledgements: acknowledgements,
                  artist: artist,
                  attestation: attestation,
                  encoding: "ipfs",
                  holder_license: holderLicense,
                  license: license,
                  narrative: narrative,
                  title: title,
                  tags: tags,
                  type: type,
                };

                nftMedia.forEach((image) => {
                  // Supports png, jpeg & gif, following the NFT spec
                  const imageType = image.type;
                  if (!nft_object[`media_${imageType}_multihash`]) {
                    // only the first image is used for the main image
                    nft_object[`media_${imageType}_multihash`] = image.url;
                  }

                  const sameTypeFiles = nftMedia.filter((img) => img.type === imageType);
                  if (sameTypeFiles && sameTypeFiles.length > 1) {
                    if (!nft_object[`media_${imageType}_multihashes`]) {
                      // initialise the ipfs multihashes array
                      nft_object[`media_${imageType}_multihashes`] = [
                        {
                          url: image.url,
                        },
                      ];
                    } else {
                      // add the image to the ipfs multihashes array
                      nft_object[`media_${imageType}_multihashes`].push({
                        url: image.url,
                      });
                    }
                  }
                });

                const issuer_permissions = getPermissions(
                  {
                    charge_market_fee: permChargeMarketFee,
                    white_list: permWhiteList,
                    override_authority: permOverrideAuthority,
                    transfer_restricted: permTransferRestricted,
                    disable_confidential: permDisableConfidential,
                  },
                  false
                );

                const flags = getFlags({
                  charge_market_fee: flagChargeMarketFee,
                  white_list: flagWhiteList,
                  override_authority: flagOverrideAuthority,
                  transfer_restricted: flagTransferRestricted,
                  disable_confidential: flagDisableConfidential,
                });

                const description = JSON.stringify({
                  main: main,
                  market: market,
                  nft_object: nft_object,
                  short_name: shortName,
                });

                setTRX(
                  !existingNFT
                    ? [
                        {
                          // create asset json
                          issuer: usr.id,
                          symbol: symbol,
                          precision: precision,
                          common_options: {
                            max_supply: maxSupply,
                            market_fee_percent: 0,
                            max_market_fee: 0,
                            issuer_permissions,
                            flags,
                            core_exchange_rate: {
                              base: {
                                amount: cerBaseAmount,
                                asset_id: cerBaseAssetId,
                              },
                              quote: {
                                amount: cerQuoteAmount,
                                asset_id: cerQuoteAssetId,
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
                        },
                      ]
                    : [
                        {
                          // edit asset json
                          issuer: usr.id,
                          asset_to_update: response ? response.id : "",
                          new_options: {
                            max_supply: parseInt(maxSupply.toString(), 10),
                            market_fee_percent: 0,
                            max_market_fee: 0,
                            issuer_permissions,
                            flags,
                            core_exchange_rate: {
                              base: {
                                amount: parseInt(cerBaseAmount.toString(), 10),
                                asset_id: cerBaseAssetId,
                              },
                              quote: {
                                amount: parseInt(cerQuoteAmount.toString(), 10),
                                asset_id: cerQuoteAssetId,
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
                        },
                      ]
                );
              }}
            >
              Broadcast operation
            </Button>
            {trx ? (
              <DeepLinkDialog
                trxJSON={trx}
                operationName={existingNFT ? "asset_update" : "asset_create"}
                dismissCallback={() => setTRX(undefined)}
                headerText={`Ready to ${existingNFT ? "update" : "create"} your NFT!`}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
