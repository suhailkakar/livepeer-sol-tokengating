import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { Nav } from "../../components";
import useLit from "../../hooks/useLit";
import { usePlaybackInfo } from "@livepeer/react/hooks";
import { LivepeerProvider } from "@livepeer/react";
import { betaStudioApiKey } from "../../lib/livepeer";
//@ts-ignore
import LitJsSdk from "lit-js-sdk";
import GatedPlayer from "../../components/GatedPlayer";

async function checkLitGate(
  litNodeClient: any,
  playbackId: string,
  playbackUrl: URL,
  playbackPolicy: AssetPlaybackPolicy
) {
  if (playbackPolicy.type !== "lit_signing_condition") {
    throw new Error("not a lit gated asset");
  }

  // console.log("resolving")
  // TODO: Compute and sign other chains based on conditions
  const ethSig = await LitJsSdk.checkAndSignAuthMessage({
    chain: "solana",
    switchChain: false,
  });

  const jwt = await litNodeClient.getSignedToken({
    unifiedAccessControlConditions:
      playbackPolicy.unifiedAccessControlConditions,
    authSig: { solana: ethSig },
    resourceId: playbackPolicy.resourceId,
  });

  const res = await fetch(
    `${playbackUrl.protocol}//${playbackUrl.host}/verify-lit-jwt`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${betaStudioApiKey}`,
      },
      body: JSON.stringify({ playbackId, jwt }),
      credentials: "include",
    }
  );
  // console.log("verify jwt", res)
  if (!res.ok) {
    const { errors } = await res.json();
    console.log(errors);
    throw new Error(errors[0]);
  }
}

export default function Watch() {
  const router = useRouter();
  const playbackId = router.query.playbackId?.toString();

  const { litNodeClient, litConnected } = useLit();
  const { publicKey } = useWallet();

  const address = publicKey?.toBase58();

  const [gatingError, setGatingError] = useState<string>();
  const [gateState, setGateState] = useState<"open" | "closed" | "checking">();

  // Step 1: Fetch playback URL
  const {
    data: playbackInfo,
    status: playbackInfoStatus,
    error: pinfoError,
  } = usePlaybackInfo<LivepeerProvider, BetaPlaybackInfo>({
    playbackId,
  });
  const playbackUrl = useMemo(() => {
    try {
      return new URL(
        playbackInfo?.meta?.source?.find(
          (s) => s.type === "html5/application/vnd.apple.mpegurl"
        )?.url ?? ""
      );
    } catch {
      return null;
    }
  }, [playbackInfo]);

  // Step 2: Check Lit signing condition and obtain playback cookie
  useEffect(() => {
    if (playbackInfoStatus !== "success" || !playbackId) return;

    const { playbackPolicy } = playbackInfo?.meta ?? {};
    if (playbackPolicy?.type !== "lit_signing_condition") {
      setGateState("open");
      return;
    }
    setGateState("checking");

    if (!address || !litConnected || !playbackUrl) {
      // console.log("not ready to check gate")
      return;
    }

    // console.log("checking gating conditions", playbackInfo)
    checkLitGate(litNodeClient, playbackId, playbackUrl, playbackPolicy)
      .then(() => setGateState("open"))
      .catch((err: any) => {
        const msg = err?.message || err;
        setGatingError(
          `You are not allowed to view this content. Gate error: ${msg}`
        );
        setGateState("closed");
      });
  }, [
    address,
    litNodeClient,
    litConnected,
    playbackInfoStatus,
    playbackInfo,
    playbackId,
    playbackUrl,
  ]);

  // UI state integration

  const readyToPlay = useMemo(
    () =>
      address &&
      playbackInfoStatus === "success" &&
      (playbackInfo?.meta?.playbackPolicy?.type !== "lit_signing_condition" ||
        gateState === "open"),
    [address, playbackInfoStatus, playbackInfo, gateState]
  );

  return (
    <>
      <Nav />
      <div className="flex flex-col text-lg items-center justify-center mt-40">
        <h1 className="text-4xl font-bold font-MontHeavy text-gray-100 mt-6">
          VOD Token Gating with Lit Signing Conditions
        </h1>
        <p className="text-base font-light text-gray-500 mt-2 w-1/2 text-center">
          Prove your identity to access the gated content.
        </p>
      </div>
      <div className="flex justify-center text-center font-matter">
        <div className="overflow-auto border border-solid border-[#C12EF150] rounded-md p-6 w-3/5 mt-20 ">
          {readyToPlay ? (
            <GatedPlayer playbackUrl={playbackUrl?.toString()} />
          ) : !address ? (
            <p className="text-gray-500">
              Please connect your wallet to aunthenticate.
            </p>
          ) : pinfoError || (gateState === "closed" && gatingError) ? (
            <p className="text-primary">{gatingError || pinfoError?.message}</p>
          ) : (
            <p className="text-primary">Checking gate...</p>
          )}
        </div>
      </div>
    </>
  );
}
