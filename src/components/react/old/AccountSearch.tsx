import React, { useState, useEffect } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/react/Avatar.tsx";

interface AccountSearchProperties {
  chain: string;
  setChosenAccount: Function;
}

export default function AccountSearch(properties: AccountSearchProperties) {
  const { chain, setChosenAccount } = properties;

  const [accountInput, setAccountInput] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  const [inProgress, setInProgress] = useState<boolean>(false);
  const [searchResponse, setSearchResponse] = useState<object>();

  async function lookupAccount() {
    function _reject(error: Error | string, msg: string) {
      console.log({ error, msg });
      setInProgress(false);
      setErrorMessage(msg);
      return;
    }

    const response = await fetch(`/endpoints/accounts/${accountInput}.json`, {
      method: "GET",
    });

    if (!response.ok) {
      return _reject(
        new Error(`${response.status} ${response.statusText}`),
        "Couldn't find account."
      );
    }

    const responseContents = await response.json();

    if (!responseContents) {
      return _reject(new Error("No response from server."), "Couldn't find account.");
    }

    setInProgress(false);
    setSearchResponse(responseContents);
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3">
        {!searchResponse ? (
          <>
            <div className="col-span-1">Please enter a blockchain account name</div>
            <div className="col-span-1">
              <Input
                value={accountInput || ""}
                placeholder={"Account name or ID"}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !inProgress) {
                    setInProgress(true);
                    lookupAccount();
                  }
                }}
                onChange={(event) => {
                  const regex = /^[a-zA-Z0-9.-]*$/;
                  if (regex.test(event.target.value)) {
                    setAccountInput(event.target.value);
                    setErrorMessage();
                    setSearchResponse();
                  }
                }}
              />
              {errorMessage ? (
                <p className="text-red-500 text-xs italic">{errorMessage || "ERROR"}</p>
              ) : null}
            </div>
            <div className="col-span-1">
              {accountInput ? (
                <Button onClick={() => lookupAccount()}>Continue</Button>
              ) : (
                <Button disabled>Continue</Button>
              )}
            </div>
          </>
        ) : null}
        {searchResponse ? (
          <>
            <div className="col-span-1">
              {chain === "bitshares"
                ? "Proceed with the following Bitshares account?"
                : "Proceed with the following Bitshares testnet (TEST) account?"}
            </div>
            <div className="col-span-1">
              <Card
                key={searchResponse.id}
                className="mb-2 mt-1 text-center"
                onClick={() => {
                  setChosenAccount({
                    name: searchResponse.name,
                    id: searchResponse.id,
                  });
                }}
              >
                <div className="grid grid-cols-4">
                  <div className="col-span-1 pt-6 pl-7">
                    <Avatar
                      size={40}
                      name={searchResponse.name}
                      extra="AS"
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
                        {searchResponse.name}
                      </CardTitle>
                      <CardDescription>{searchResponse.id}</CardDescription>
                    </CardHeader>
                  </div>
                </div>
              </Card>
            </div>
            <div className="col-span-1">
              <div className="grid grid-cols-2">
                <div>
                  <Button
                    variant="outline"
                    className="mr-2"
                    onClick={() => {
                      setErrorMessage();
                      setSearchResponse();
                    }}
                  >
                    Go back
                  </Button>
                </div>
                <div className="text-right">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setChosenAccount({
                        name: searchResponse.name,
                        id: searchResponse.id,
                      });
                    }}
                  >
                    Proceed
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
