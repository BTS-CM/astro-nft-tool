import React, { useState, useEffect, useSyncExternalStore, useRef } from "react";

import { $currentUser } from "@/stores/users.ts";
import { createAssetStore } from "@/effects/Queries.ts";

import DeepLinkDialog from "@/components/react/DeepLinkDialog.tsx";

import { blockchainFloat } from "@/lib/common.ts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AssetSearchResponse {
  id: string;
  symbol: string;
  issuer: string;
  precision: number;
}

interface AccountSearchResponse {
  id: string;
  username: string;
  chain: string;
  referrer: string;
}

let asset_regex = /\b\d+\.\d+\.(\d+)\b/;
let account_regex = /\b\d+\.\d+\.(\d+)\b/;

import { createIssuedAssetStore, createAccountStore } from "@/effects/Queries.ts";
import { Separator } from "@radix-ui/react-select";

export default function IssueAsset() {
  const usr = useSyncExternalStore($currentUser.subscribe, $currentUser.get, $currentUser.get);

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

  const [chosen, setChosen] = useState<AssetSearchResponse>();
  const [response, setResponse] = useState<AssetSearchResponse[]>();
  useEffect(() => {
    if (!usr || !usr.username || !usr.chain || existingNFT) return;

    const userIssuedAssetStore = createIssuedAssetStore([usr.chain, usr.username]);

    const unsub = userIssuedAssetStore.subscribe((result) => {
      if (result.error) {
        console.error(result.error);
      }

      if (!result.loading) {
        if (result.data) {
          const res = result.data;
          setResponse(res as AssetSearchResponse[]);
        }
      }
    });

    return () => {
      unsub();
    };
  }, [usr, existingNFT]);

  // Fetch the asset details for the existingNFT
  useEffect(() => {
    if (!usr || !usr.chain || !existingNFT) return;

    const assetStore = createAssetStore([usr.chain, existingNFT, "min"]);

    const unsub = assetStore.subscribe((result) => {
      if (result.error) {
        console.error(result.error);
      }

      if (!result.loading) {
        if (result.data) {
          const res = result.data;
          setResponse([res as AssetSearchResponse]);
          setChosen(res as AssetSearchResponse);
        }
      }
    });

    return () => {
      unsub();
    };
  }, [usr, existingNFT]);

  const [targetIssueAccount, setTargetIssueAccount] = useState<string>();
  const [qtyToIssue, setQtyToIssue] = useState<string>();
  const [ready, setReady] = useState<boolean>(false);

  const [searching, setSearching] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchResult, setSearchResult] = useState<AccountSearchResponse>();

  function performAccountSearch() {
    if (!searchInput || !usr || !usr.chain) {
      return;
    }

    setSearching(true);
    setSearchResult(undefined); // clear previous search result

    // Perform search
    const accountStore = createAccountStore([usr.chain, searchInput]);

    const unsub = accountStore.subscribe((result) => {
      if (result.error) {
        console.error(result.error);
        setSearching(false);
      }

      if (!result.loading) {
        if (result.data) {
          const res = result.data;
          if (res) {
            setSearchResult(res as AccountSearchResponse);
          }
          setSearching(false);
        }
      }
    });

    return () => {
      unsub();
    };
  }

  const [openDialog, setOpenDialog] = useState<boolean>(false);

  return (
    <>
      <div className="grid grid-cols-2 mt-2 gap-5">
        <div className="col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Asset details</CardTitle>
              <CardDescription></CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="account">Bitshares account used for NFT issuance</Label>
              <Input
                id="account"
                placeholder="Account"
                value={usr && usr.id ? usr.id : "???"}
                type="text"
                readOnly
                disabled
              />
              {chosen ? (
                <>
                  <Label htmlFor="identifiers">Asset symbol & id</Label>
                  <Input
                    id="identifiers"
                    placeholder="Asset"
                    value={`${chosen.symbol} (${chosen.id})`}
                    type="text"
                    readOnly
                    disabled
                  />
                  <Label htmlFor="issuer">Asset issuer</Label>
                  <Input
                    id="issuer"
                    placeholder="Issuer"
                    value={
                      chosen.issuer === usr.id
                        ? `${chosen.issuer} (you)`
                        : `${chosen.issuer} someone else...`
                    }
                    type="text"
                    readOnly
                    disabled
                  />
                  <Label htmlFor="precision">Asset precision</Label>
                  <Input
                    id="precision"
                    placeholder="precision"
                    value={chosen.precision}
                    type="text"
                    readOnly
                    disabled
                  />
                </>
              ) : null}
              {response && response.length && !chosen ? (
                <>
                  <Label>Choose from one of your issued NFTs</Label>
                  <Select onValueChange={(res) => setChosen(response.find((x) => x.id === res))}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select an NFT" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {response.map((res) => (
                          <SelectItem key={res.id} value={res.id}>
                            {res.symbol} ({res.id})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </>
              ) : null}
              <a href="/lookup">
                <Button className="mt-3">Locate another asset</Button>
              </a>
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Proceed with issuance?</CardTitle>
              <CardDescription>Change the receiving account and the amount.</CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="account_name">Target account (1.2.x) to issue NFT to</Label>
              <div className="flex">
                <div className="flex-grow mr-2">
                  <Input
                    id="account_name"
                    placeholder="1.2.x"
                    value={targetIssueAccount}
                    type="text"
                    onInput={(e) => {
                      const newValue = e.currentTarget.value;
                      if (newValue.startsWith("1.2.")) {
                        const integerPart = newValue.slice(4);
                        if (integerPart === "" || /^\d+$/.test(integerPart)) {
                          setTargetIssueAccount(newValue);
                        }
                      }
                    }}
                    onBlur={() => {
                      if (targetIssueAccount === "1.2.") {
                        setTargetIssueAccount("1.2.0");
                      }
                    }}
                  />
                </div>
                <div className="flex-shrink-1">
                  <Dialog
                    open={openDialog}
                    onOpenChange={(open) => {
                      if (!open) {
                        setSearchResult(undefined);
                        setSearchInput("");
                        setOpenDialog(false);
                      }
                    }}
                  >
                    <DialogTrigger onClick={() => setOpenDialog(true)}>
                      <Button variant="outline">Search</Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white w-1/2 max-w-4xl bg-gray-100">
                      <DialogHeader>
                        <DialogTitle>Search for a {usr.chain} account</DialogTitle>
                      </DialogHeader>
                      <Label htmlFor="search_target_account">Enter account name</Label>
                      <div className="flex">
                        <div className="flex-grow mr-3">
                          <Input
                            id="search_target_account"
                            placeholder="Account name"
                            type="text"
                            onInput={(e) => {
                              // Do something with the input
                              setSearchInput(e.currentTarget.value);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                performAccountSearch();
                              }
                            }}
                          />
                        </div>
                        <div className="flex-shrink-1">
                          <Button onClick={() => performAccountSearch()}>Search</Button>
                        </div>
                      </div>
                      <Separator />
                      {searching ? <p>Loading...</p> : null}
                      {searchResult ? (
                        <>
                          <Label htmlFor="search_result">Search result</Label>
                          <Input
                            id="search_result"
                            placeholder="Account name"
                            value={`${searchResult.username} ${searchResult.id}`}
                            type="text"
                            readOnly
                            disabled
                          />
                          <Button
                            onClick={() => {
                              setTargetIssueAccount(searchResult.id);
                              setSearchResult(undefined);
                              setOpenDialog(false);
                            }}
                          >
                            Proceed with this account
                          </Button>
                        </>
                      ) : null}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <Label htmlFor="qtyToIssue">Quantity of NFT to issue</Label>
              <Input
                placeholder="1"
                value={qtyToIssue}
                type="text"
                onInput={(e) => {
                  if (chosen) {
                    let regex;
                    if (chosen.precision === 0) {
                      regex = /^\d+$/; // Only allow whole numbers
                    } else {
                      regex = new RegExp(`^\\d*(\\.\\d{0,${chosen.precision}})?$`); // Allow decimals up to the specified precision
                    }
                    if (regex.test(e.currentTarget.value)) {
                      setQtyToIssue(e.currentTarget.value);
                    }
                  }
                }}
              />
              <Button className="mt-3" onClick={() => setReady(true)}>
                Broadcast to blockchain
              </Button>
              {ready && qtyToIssue && chosen && targetIssueAccount ? (
                <DeepLinkDialog
                  trxJSON={[
                    {
                      issuer: usr.id,
                      asset_to_issue: {
                        amount: blockchainFloat(parseFloat(qtyToIssue), chosen.precision),
                        asset_id: chosen.id,
                      },
                      //memo: "",
                      issue_to_account: targetIssueAccount,
                      extensions: [],
                    },
                  ]}
                  operationName={"asset_issue"}
                  dismissCallback={() => setReady(false)}
                  headerText={`Ready to issue your NFT!`}
                />
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
