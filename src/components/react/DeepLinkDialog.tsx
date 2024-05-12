import React, { useState, useEffect, useSyncExternalStore } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { copyToClipboard } from "@/lib/common.js";
import { $currentUser } from "@/stores/users.ts";

interface DeepLinkDialogProps {
  trxJSON: object[];
  operationName: string;
  dismissCallback: (open: boolean) => void; // Assuming it's a function that returns void, adjust if needed
  headerText: string;
}

/**
 * Launches a dialog prompt, generating a deep link for the given operation.
 * Buttons link to the Beet multiwallet
 */
export default function DeepLinkDialog({
  trxJSON,
  operationName,
  dismissCallback,
  headerText,
}: DeepLinkDialogProps) {
  const [activeTab, setActiveTab] = useState<string | null>("object");
  const [deeplink, setDeeplink] = useState<string | null>();

  const usr = useSyncExternalStore($currentUser.subscribe, $currentUser.get, $currentUser.get);

  useEffect(() => {
    async function createDeepLink() {
      let response;
      try {
        response = await fetch(`/endpoints/${usr.chain}/deeplink.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chain: usr.chain,
            opType: operationName,
            operations: trxJSON,
          }),
        });
      } catch (error) {
        console.log({ error });
      }

      let responseContents;
      try {
        responseContents = response ? await response.json() : null;
      } catch (error) {
        console.log({ error });
      }

      if (responseContents && responseContents.deeplink) {
        setDeeplink(responseContents.deeplink);
      }
    }

    if (operationName && trxJSON) {
      createDeepLink();
    }
  }, [operationName, trxJSON]);

  const [downloadClicked, setDownloadClicked] = useState(false);
  const handleDownloadClick = () => {
    if (!downloadClicked) {
      setDownloadClicked(true);
      setTimeout(() => {
        setDownloadClicked(false);
      }, 10000);
    }
  };

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        dismissCallback(open);
      }}
    >
      <DialogContent className="sm:max-w-[800px] bg-white">
        <DialogHeader>
          <DialogTitle>{!deeplink ? "Generating deeplink..." : <>{headerText}</>}</DialogTitle>
          <DialogDescription>
            With the account: {usr.username} ({usr.id})
            {deeplink ? (
              <>
                <br />
                Your Bitshares Beet operation is ready to broadcast!
                <br />
                Choose from the methods below to broadcast to your wallet of choice.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        {activeTab ? (
          <>
            <hr className="mt-3" />
            <div className="grid grid-cols-1 gap-3">
              <Tabs
                defaultValue="object"
                className="w-full"
                key={deeplink ? "deeplinkLoaded" : "loading"}
              >
                <TabsList
                  key={`${activeTab ? activeTab : "loading"}_TabList`}
                  className="grid w-full grid-cols-3 gap-2"
                >
                  <TabsTrigger key="TRXTab" value="object" onClick={() => setActiveTab("object")}>
                    View TRX Object
                  </TabsTrigger>
                  <TabsTrigger
                    key="DLTab"
                    value="deeplink"
                    onClick={() => setActiveTab("deeplink")}
                  >
                    Raw Deeplink
                  </TabsTrigger>
                  <TabsTrigger
                    key="JSONTab"
                    value="localJSON"
                    onClick={() => setActiveTab("localJSON")}
                  >
                    Local JSON file
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="object">
                  <div className="grid w-full gap-1.5 mb-3">
                    <Label className="text-left">Transaction object JSON</Label>
                    <span className="text-left text-sm">Operation type: {operationName}</span>
                    <Textarea
                      value={JSON.stringify(trxJSON, null, 4)}
                      className="min-h-[250px]"
                      id="trxJSON"
                      readOnly
                    />
                  </div>
                  <Button
                    onClick={() => {
                      copyToClipboard(JSON.stringify(trxJSON, null, 4));
                    }}
                  >
                    Copy operation JSON
                  </Button>
                </TabsContent>
                <TabsContent value="deeplink">
                  <Label className="text-left">
                    Using a deeplink to broadcast via the Beet multiwallet
                  </Label>
                  <ol className="ml-4">
                    <li>
                      Launch the BEET wallet and navigate to 'Raw Link' in the menu, the wallet has
                      to remain unlocked for the duration of the broadcast.
                    </li>
                    <li>
                      From this page you can either allow all operations, or solely allow operation
                      '{operationName}' (then click save).
                    </li>
                    <li>
                      Once 'Ready for raw links' shows in Beet, then you can click the button below
                      to proceed.
                    </li>
                    <li>
                      A BEET prompt will display, verify the contents, optionally request a Beet
                      receipt, and then broadcast the transaction onto the blockchain.
                    </li>
                    <li>
                      You won't receive a confirmation in this window, but your operation will be
                      processed within seconds on the blockchain.
                    </li>
                  </ol>
                  {deeplink ? (
                    <>
                      <a
                        href={`rawbeet://api?chain=${
                          usr.chain === "bitshares" ? "BTS" : "BTS_TEST"
                        }&request=${deeplink}`}
                      >
                        <Button className="mt-4">BEET</Button>
                      </a>
                      <a
                        href={`rawbeeteos://api?chain=${
                          usr.chain === "bitshares" ? "BTS" : "BTS_TEST"
                        }&request=${deeplink}`}
                      >
                        <Button className="mt-4 ml-3">BeetEOS</Button>
                      </a>
                    </>
                  ) : null}
                </TabsContent>
                <TabsContent value="localJSON">
                  <Label className="text-left">Via local file upload - ready to proceed</Label>
                  <ol className="ml-4">
                    <li>Launch the BEET wallet and navigate to 'Local' in the menu.</li>
                    <li>
                      At this page either allow all, or allow just operation '{operationName}'.
                    </li>
                    <li>
                      Once at the local upload page, click the button below to download the JSON
                      file to your computer.
                    </li>
                    <li>
                      From the BEET Local page, upload the JSON file, a prompt should then appear.
                    </li>
                    <li>
                      Thoroughly verify the prompt's contents before approving any operation, also
                      consider toggling the optional receipt for post broadcast analysis and
                      verification purposes.
                    </li>
                  </ol>
                  {deeplink && downloadClicked ? (
                    <Button className="mt-4" variant="outline" disabled>
                      Downloading...
                    </Button>
                  ) : null}
                  {deeplink && !downloadClicked ? (
                    <a
                      href={`data:text/json;charset=utf-8,${deeplink}`}
                      download={`${operationName}.json`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={handleDownloadClick}
                    >
                      <Button className="mt-4">Download JSON file</Button>
                    </a>
                  ) : null}
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
