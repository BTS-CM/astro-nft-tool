import React, { useState, useEffect, useSyncExternalStore } from "react";
import { FixedSizeList as List } from "react-window";

import { $currentUser } from "@/stores/users.ts";
import { createAssetStore } from "@/effects/Queries.ts";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

interface SearchResponse {
  id: string;
  symbol: string;
  issuer: string;
  precision: number;
}

interface RowProps {
  index: number;
  style: React.CSSProperties;
}

import { createIssuedAssetStore } from "@/effects/Queries.ts";

export default function SelectedIssuedAsset() {
  const usr = useSyncExternalStore($currentUser.subscribe, $currentUser.get, $currentUser.get);

  const [response, setResponse] = useState<object[]>();
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    if (!usr || !usr.username || !usr.chain) return;
    setLoading(true); // Start loading

    const userIssuedAssetStore = createIssuedAssetStore([usr.chain, usr.username]);

    const unsub = userIssuedAssetStore.subscribe((result) => {
      if (result.error) {
        console.error(result.error);
        setLoading(false);
      }

      if (!result.loading) {
        if (result.data) {
          const res = result.data;
          setResponse(res as object[]);
        }
        setLoading(false);
      }
    });

    return () => {
      unsub();
      setLoading(false);
    };
  }, [usr]);

  const [searchInProgress, setSearchInProgress] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchResponse, setSearchResponse] = useState<SearchResponse>();

  function performSearch() {
    if (!searchInput || !usr || !usr.chain) {
      return;
    }

    setSearchInProgress(true);
    setSearchResponse(undefined); // clear previous search result

    // Perform search
    const assetStore = createAssetStore([usr.chain, searchInput, "min"]);

    const unsub = assetStore.subscribe((result) => {
      if (result.error) {
        console.error(result.error);
        setSearchInProgress(false);
      }

      if (!result.loading) {
        if (result.data) {
          const res = result.data as SearchResponse;
          if (res && res.id) {
            setSearchResponse(res);
          }
          setSearchInProgress(false);
        }
      }
    });

    return () => {
      unsub();
    };
  }

  const Row: React.FC<RowProps> = ({ index, style }) => {
    if (!response || !response.length || !response[index]) {
      return;
    }

    let res = response[index] as { id: string; symbol: string };

    return (
      <div style={{ ...style }} key={`row-${res.id}`}>
        <div className="flex border-solid border-2 p-5 mr-5">
          <div className="flex-grow">
            {index}: {res.symbol} ({res.id})
          </div>
          <div className="flex-shrink-0 ml-auto">
            <a href={`/create?nft=${res.symbol}`}>
              <Button className="mr-3">Edit</Button>
            </a>
            <a href={`/issue?nft=${res.symbol}`}>
              <Button>Issue</Button>
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <p className="pb-2">
        {`The user "${usr.username}" (${usr.id}) has issued ${
          response ? response.length : 0
        } NFTs on the ${usr.chain} blockchain:`}
      </p>
      {response && response.length ? (
        <List
          width={"100%"}
          height={300}
          itemCount={response.length}
          itemSize={100}
          className="w-full"
        >
          {({ index, style }) => <Row index={index} style={style} />}
        </List>
      ) : (
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          {" "}
          {!loading && (!response || !response.length) ? (
            <>
              The user {usr.username} hasn't issued any NFTs yet, want to{" "}
              <a href="/create">create a new nft</a>?
            </>
          ) : (
            "Loading..."
          )}
        </p>
      )}
      <Separator className="w-full" />
      <h4 className="scroll-m-20 text-xl tracking-tight mt-3">Search for an NFT by symbol</h4>
      <div className="grid grid-cols-4 mt-2">
        <div className="col-span-3">
          <Input
            placeholder="SYMBOL"
            type="text"
            onInput={(e) => setSearchInput(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                performSearch();
              }
            }}
            value={searchInput}
            className="w-3/4"
          />
        </div>
        <div className="col-span-1 align-center">
          <Button onClick={performSearch}>Perform search</Button>
        </div>
      </div>

      {searchInProgress ? <p>Searching...</p> : null}
      {searchResponse ? (
        <div className="mt-3">
          <h4 className="scroll-m-20 text-xl tracking-tight mt-3">Search result</h4>
          <p>
            Symbol: {searchResponse.symbol} (ID: {searchResponse.id})<br />
            Issuer: {searchResponse.issuer} (
            {searchResponse.issuer === usr.id ? "you" : "someone else"})
          </p>
          <a href={`/create?nft=${searchResponse.symbol}`}>
            <Button className="mr-3 mt-2">Edit {searchResponse.symbol}</Button>
          </a>
          <a href={`/issue?nft=${searchResponse.symbol}`}>
            <Button>Issue {searchResponse.symbol}</Button>
          </a>
        </div>
      ) : null}
    </>
  );
}
