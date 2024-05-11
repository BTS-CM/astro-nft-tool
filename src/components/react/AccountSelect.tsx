import React, { useState, useEffect, useSyncExternalStore } from "react";
import { FixedSizeList as List } from "react-window";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/react/Avatar.tsx";

import {
  type User,
  $currentUser,
  setCurrentUser,
  $userStorage,
  removeUser,
} from "@/stores/users.ts";

interface SearchResponse {
  id: string;
  username: string;
  referrer: string;
}

interface AccountRowProps {
  index: number;
  style: React.CSSProperties;
}

export default function AccountSelect() {
  const [chosenChain, setChosenChain] = useState<string | null>();
  const [mode, setMode] = useState<string | null>();
  const [accountInput, setAccountInput] = useState<string | null>();
  const [errorMessage, setErrorMessage] = useState<string | null>();

  const [users, setUsers] = useState<User[]>();
  useEffect(() => {
    const unsubscribe = $userStorage.subscribe((value) => {
      setUsers(value.users);
    });
    return unsubscribe;
  }, [$userStorage]);

  const [inProgress, setInProgress] = useState<boolean>(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>();

  async function performSearch() {
    const response = await fetch(`/endpoints/${chosenChain}/account/${accountInput}.json`, {
      method: "GET",
    });

    if (!response.ok) {
      console.log("Couldn't find account.");
      setInProgress(false);
      return;
    }

    const responseContents = await response.json();

    if (responseContents) {
      setInProgress(false);
      setSearchResponse(responseContents);
      setErrorMessage(null);
      return;
    }

    setInProgress(false);
    setErrorMessage("Couldn't find account.");
  }

  const firstResponse =
    chosenChain && searchResponse ? (
      <Card
        className="w-1/2"
        key={searchResponse.id}
        onClick={() => {
          setCurrentUser(
            searchResponse.username,
            searchResponse.id,
            searchResponse.referrer,
            chosenChain
          );
        }}
      >
        <div className="grid grid-cols-4">
          <div className="col-span-1 pt-6 pl-4">
            <Avatar
              size={40}
              name={searchResponse.username}
              extra=""
              expression={{
                eye: "normal",
                mouth: "open",
              }}
              colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
            />
          </div>
          <div className="col-span-3">
            <CardHeader>
              <CardTitle
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {searchResponse.username}
              </CardTitle>
              <CardDescription>{searchResponse.id}</CardDescription>
            </CardHeader>
          </div>
        </div>
      </Card>
    ) : null;

  const AccountRow: React.FC<AccountRowProps> = ({ index, style }) => {
    if (!users || !users.length || !users[index]) {
      return;
    }

    let res = users[index];

    return (
      <div style={{ ...style }} key={`addresscard-${res}`}>
        <HoverCard key={res.id}>
          <HoverCardTrigger asChild>
            <Card
              onClick={() => {
                if (res.username && res.id && res.referrer && res.chain) {
                  setCurrentUser(res.username, res.id, res.referrer, res.chain);
                }
              }}
            >
              <div className="grid grid-cols-4">
                <div className="col-span-1 pt-6 pl-2">
                  <Avatar
                    size={40}
                    name={res.username}
                    extra=""
                    expression={{
                      eye: "normal",
                      mouth: "open",
                    }}
                    colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
                  />
                </div>
                <div className="col-span-3">
                  <CardHeader>
                    <CardTitle
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {res.username}
                    </CardTitle>
                    <CardDescription>{res.id}</CardDescription>
                  </CardHeader>
                </div>
              </div>
            </Card>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            Account: {res.username}
            <br />
            <Button
              className="w-full mt-2 text-bold text-white"
              variant="destructive"
              onClick={() => {
                if (res.id) {
                  removeUser(res.id);
                }
              }}
            >
              Forget this account
            </Button>
          </HoverCardContent>
        </HoverCard>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1">
      {!chosenChain ? (
        <>
          <p className="mt-2">Which blockchain do you want to use?</p>
          <span className="grid grid-cols-2 mt-5">
            <span className="col-span-1">
              <Button className="mr-2" onClick={() => setChosenChain("bitshares")}>
                Bitshares (BTS)
              </Button>
            </span>
            <span className="col-span-1">
              <Button onClick={() => setChosenChain("bitshares_testnet")}>
                Bitshares testnet (TEST)
              </Button>
            </span>
          </span>
        </>
      ) : null}
      {chosenChain && !mode ? (
        <>
          <h4>
            {chosenChain === "bitshares"
              ? "Use a new or existing Bitshares account?"
              : "Use a new or existing Bitshares testnet account?"}
          </h4>
          <p>How do you want to proceed?</p>
          <span className="grid grid-cols-2 mt-5">
            <span className="col-span-1">
              <Button className="mr-2" onClick={() => setMode("new")}>
                New account
              </Button>
            </span>
            <span className="col-span-1">
              <Button onClick={() => setMode("existing")}>Existing account</Button>
            </span>
            <span className="col-span-1">
              <Button className="mt-2" onClick={() => setChosenChain(null)}>
                Back
              </Button>
            </span>
          </span>
        </>
      ) : null}
      {chosenChain && mode && mode === "new" && !searchResponse ? (
        <span className="grid grid-cols-2">
          <span className="col-span-2">
            <h4>
              {chosenChain === "bitshares"
                ? "Searching for a replacement Bitshares (BTS) account"
                : "Searching for a replacement Bitshares testnet (TEST) account"}
            </h4>
            <Input
              value={accountInput || ""}
              placeholder="Account name or ID"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !inProgress) {
                  setInProgress(true);
                  performSearch();
                }
              }}
              onChange={(event) => {
                const regex = /^[a-zA-Z0-9.-]*$/;
                if (regex.test(event.target.value)) {
                  setAccountInput(event.target.value);
                  setErrorMessage(null);
                  setSearchResponse(null);
                }
              }}
              className="mt-3"
            />
            {errorMessage ? (
              <p className="text-red-500 text-xs italic">{errorMessage || "ERROR"}</p>
            ) : null}
          </span>
          <span className="col-span-1 text-left mt-4">
            {accountInput && !inProgress ? (
              <Button onClick={() => performSearch()}>Search</Button>
            ) : null}
            {accountInput && inProgress ? <Button disabled>Searching...</Button> : null}
            {!accountInput ? <Button disabled>Search</Button> : null}
          </span>
          <span className="col-span-1 text-right mt-4">
            <Button className="mr-2" onClick={() => setMode(null)}>
              Go back
            </Button>
          </span>
        </span>
      ) : null}
      {searchResponse ? (
        <span className="grid grid-cols-1">
          <span>
            {chosenChain === "bitshares"
              ? "Found the following Bitshares (BTS) account!"
              : "Found the following Bitshares testnet (TEST) account!"}
          </span>
          <span className="mt-4">
            <a href={window.location.pathname}>{firstResponse}</a>
          </span>
          <span className="mt-5">
            <Button
              variant="outline"
              className="mr-2"
              onClick={() => {
                setErrorMessage(null);
                setSearchResponse(null);
              }}
            >
              Go back
            </Button>
          </span>
        </span>
      ) : null}
      {mode && mode === "existing" ? (
        <span className="grid grid-cols-1">
          <CardTitle>
            {chosenChain === "bitshares"
              ? "Selecting a previously used Bitshares (BTS) account"
              : "Selecting a previously used Bitshares testnet (TEST) account"}
          </CardTitle>
          <div className="grid grid-cols-3 gap-3 mt-5">
            {users && users.filter((user: User) => user.chain === chosenChain).length ? (
              <List
                width={"100%"}
                height={300}
                itemCount={users.filter((user: User) => user.chain === chosenChain).length}
                itemSize={95}
                className="w-full"
              >
                {({ index, style }) => <AccountRow index={index} style={style} />}
              </List>
            ) : (
              <p className="text-red-500 text-xs italic">No accounts found.</p>
            )}
          </div>
          <span className="mt-4">
            <Button className="mr-2" onClick={() => setMode(null)}>
              Go back
            </Button>
          </span>
        </span>
      ) : null}
    </div>
  );
}
