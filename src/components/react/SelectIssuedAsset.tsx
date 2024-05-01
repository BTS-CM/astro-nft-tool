import React, { useState, useEffect, useSyncExternalStore } from "react";
import { FixedSizeList as List } from "react-window";

import { $currentUser } from "@/stores/users.ts";

interface RowProps {
  index: number;
  style: React.CSSProperties;
}

import { useInitCache } from "@/effects/Init.ts";
import { createIssuedAssetStore } from "@/effects/Queries.ts";

export default function SelectedIssuedAsset() {
  const usr = useSyncExternalStore($currentUser.subscribe, $currentUser.get, $currentUser.get);

  useInitCache();

  const [response, setResponse] = useState<object[]>();
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    if (!usr || !usr.username || !usr.chain) return;
    setLoading(true); // Start loading

    const userIssuedAssetStore = createIssuedAssetStore([usr.chain, usr.username]);

    const unsub = userIssuedAssetStore.subscribe((result) => {
      if (result.error) {
        console.error(result.error);
        setLoading(false); // Stop loading on error
      }

      if (!result.loading) {
        if (result.data) {
          const res = result.data;
          setResponse(res as object[]);
        }
        setLoading(false); // Stop loading when data is received or in case of an error
      }
    });

    return () => {
      unsub();
      setLoading(false); // Ensure loading is set to false when the component unmounts or the usr changes
    };
  }, [usr]);

  const Row: React.FC<RowProps> = ({ index, style }) => {
    if (!response || !response.length || !response[index]) {
      return;
    }

    let res = response[index] as { id: string; symbol: string };

    return (
      <div style={{ ...style }} key={`row-${res.id}`}>
        {index}:{" "}
        <a href={`/create?nft=${res.symbol}`} className="text-purple-500">
          {res.symbol}
        </a>{" "}
        (<span className="text-gray-400">{res.id}</span>)
      </div>
    );
  };

  return (
    <>
      <p>{usr.username}'s issued NFTs:</p>
      {response && response.length ? (
        <List
          width={"100%"}
          height={300}
          itemCount={response.length}
          itemSize={25}
          className="w-full"
        >
          {({ index, style }) => <Row index={index} style={style} />}
        </List>
      ) : (
        <p>
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
    </>
  );
}
