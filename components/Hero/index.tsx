import React, { useEffect, useMemo, useRef, useState } from "react";
import Button from "../shared/Button";
import Input from "../shared/Input";
import { useWallet } from "@solana/wallet-adapter-react";
import Steps from "../Steps";
import useLit from "../../hooks/useLit";
//@ts-ignore
import LitJsSdk from "lit-js-sdk";
import { toast } from "react-hot-toast";
import { LivepeerProvider, useAsset, useCreateAsset } from "@livepeer/react";
import Link from "next/link";

// @ts-ignore
import LitShareModal from "lit-share-modal-v3";

type LitGateParams = {
  unifiedAccessControlConditions: any[] | null;
  permanent: boolean;
  chains: string[];
  authSigTypes: string[];
};

export default function Hero() {
  // Inputs
  const [name, setName] = useState<string | undefined>(undefined);
  const [file, setFile] = useState<File | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lit
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [savedSigningConditionsId, setSavedSigningConditionsId] =
    useState<string>();
  const [authSig, setAuthSig] = useState<Record<string, object>>({});
  const { litNodeClient, litConnected } = useLit();

  const [litGateParams, setLitGateParams] = useState<LitGateParams>({
    unifiedAccessControlConditions: null,
    permanent: false,
    chains: [],
    authSigTypes: [],
  });

  // Misc
  const { publicKey } = useWallet();

  // Step 1: pre-sign the auth message
  useEffect(() => {
    if (publicKey?.toBase58()) {
      Promise.resolve().then(async () => {
        try {
          setAuthSig({
            solana: await LitJsSdk.checkAndSignAuthMessage({
              chain: "solana",
              switchChain: false,
            }),
          });
        } catch (err: any) {
          alert(`Error signing auth message: ${err?.message || err}`);
        }
      });
    }
  }, [publicKey]);

  // Step 2: Creating an asset
  const {
    mutate: createAsset,
    data: createdAsset,
    status: createStatus,
    progress,
  } = useCreateAsset<LivepeerProvider, BetaCreateAssetSourceType>(
    file
      ? {
          sources: [
            {
              file: file,
              name: name || file.name,
              playbackPolicy: {
                type: "lit_signing_condition",
                unifiedAccessControlConditions:
                  litGateParams.unifiedAccessControlConditions ?? [],
              },
            },
          ] as const,
        }
      : null
  );

  // Step 3: Getting asset and refreshing for the status
  const {
    data: asset,
    error,
    status: assetStatus,
  } = useAsset<LivepeerProvider, BetaAsset>({
    assetId: createdAsset?.[0].id,
    refetchInterval: (asset) =>
      asset?.storage?.status?.phase !== "ready" ? 5000 : false,
  });

  // Step 4: After an asset is created, save the signing condition
  useEffect(() => {
    if (
      createStatus === "success" &&
      asset?.id &&
      asset?.id !== savedSigningConditionsId
    ) {
      setSavedSigningConditionsId(asset?.id);
      Promise.resolve().then(async () => {
        try {
          await litNodeClient.saveSigningCondition({
            unifiedAccessControlConditions:
              asset?.playbackPolicy.unifiedAccessControlConditions,
            authSig,
            resourceId: asset?.playbackPolicy.resourceId,
          });
        } catch (err: any) {
          alert(`Error saving signing condition: ${err?.message || err}`);
        }
      });
    }
  }, [litNodeClient, createStatus, savedSigningConditionsId, authSig, asset]);

  const progressFormatted = useMemo(
    () =>
      progress?.[0].phase === "failed" || createStatus === "error"
        ? "Failed to upload video."
        : progress?.[0].phase === "waiting"
        ? "Waiting"
        : progress?.[0].phase === "uploading"
        ? `Uploading: ${Math.round(progress?.[0]?.progress * 100)}%`
        : progress?.[0].phase === "processing"
        ? `Processing: ${Math.round(progress?.[0].progress * 100)}%`
        : null,
    [progress, createStatus]
  );

  const isLoading = useMemo(
    () =>
      createStatus === "loading" ||
      assetStatus === "loading" ||
      (asset && asset?.status?.phase !== "ready") ||
      (asset?.storage && asset?.storage?.status?.phase !== "ready"),
    [asset, assetStatus, createStatus]
  );

  const handleClick = async () => {
    if (!publicKey) {
      toast("Please connect your wallet to continue", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      return;
    }
    if (!name || !litGateParams || !file) {
      toast("Please fill all the fields", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      return;
    }
    createAsset?.();
  };

  return (
    <section className="p-10 h-screen flex flex-col lg:flex-row-reverse">
      <div className="w-full h-1/2 lg:h-full lg:w-1/2">
        <img
          src="https://cdn.midjourney.com/58947cf9-56eb-4c20-b24c-8bbf6914b523/grid_0.png"
          className=" w-full h-full  lg:h-full object-cover rounded-xl object-bottom"
          width={1000}
          height={1000}
          alt="Hero Illustration"
        />
      </div>
      <div className="lg:w-1/2 w-full h-full lg:mr-20">
        <p className="text-base font-light text-primary lg:mt-20 mt-5">
          Livepeer x Solana x Lit
        </p>
        <h1 className="text-6xl font-bold font-MontHeavy text-gray-100 mt-6">
          VOD Token Gating with Lit Signing Conditions.
        </h1>
        <p className="text-base font-light text-gray-500 mt-6">
          Looking to turn your video files into unique, collectible NFTs? With
          Long Take NFT Publisher, you can easily create and share NFTs from
          files up to 10GB on any NFT marketplace on Solana. With Livepeer, you
        </p>
        <div className="flex flex-col mt-6">
          <Input
            onChange={(e) => setName(e.target.value)}
            placeholder={"Enter the name of your video/asset"}
          />
          <div className="h-4" />
          <div onClick={() => setShowShareModal(true)}>
            <Input
              textarea
              disabled
              value={
                !litGateParams.unifiedAccessControlConditions
                  ? ""
                  : JSON.stringify(
                      litGateParams.unifiedAccessControlConditions,
                      null,
                      2
                    )
              }
              placeholder={"Enter the description of your NFT"}
            />
          </div>
          <div className="h-4" />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full border border-dashed border-gray-500 text-gray-500 rounded-xl p-4 flex items-center justify-center hover:border-gray-200 hover:text-gray-200"
          >
            <p className="">
              {file ? (
                file.name +
                " - " +
                Number(file.size / 1024 / 1024).toFixed() +
                " MB"
              ) : (
                <>Choose a video file to upload</>
              )}
            </p>
          </div>
          <input
            onChange={(e) => {
              if (e.target.files) {
                setFile(e.target.files[0]);
              }
            }}
            type="file"
            accept="video/*"
            ref={fileInputRef}
            hidden
          />
        </div>
        <div className="flex flex-row items-center mb-20 lg:mb-0">
          <Button onClick={handleClick}>
            {isLoading ? progressFormatted || "Uploading..." : "Upload"}
          </Button>
          {asset?.status?.phase === "ready" && (
            <div>
              <div className="flex flex-col justify-center items-center ml-5 font-matter">
                <p className="mt-6 text-white">
                  Your token-gated video is uploaded, and you can view it{" "}
                  <Link
                    className="text-primary"
                    target={"_blank"}
                    rel={"noreferrer"}
                    href={`/watch/${asset?.playbackId}`}
                  >
                    here
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
        <Steps
          publickey={publicKey?.toBase58()}
          litGateParams={JSON.stringify(
            litGateParams.unifiedAccessControlConditions
          )}
          completed={false}
        />

        {showShareModal && (
          <div className="fixed top-0 left-0 w-full h-full z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="w-1/3 h-[95%] mt-10">
              <LitShareModal
                // @ts-ignore
                onClose={() => {
                  setShowShareModal(false);
                }}
                chainsAllowed={["ethereum", "solana"]}
                defaultChain={"solana"}
                injectInitialState={true}
                initialUnifiedAccessControlConditions={
                  litGateParams?.unifiedAccessControlConditions
                }
                onUnifiedAccessControlConditionsSelected={(
                  val: LitGateParams
                ) => {
                  setLitGateParams(val);
                  setShowShareModal(false);
                }}
                darkMode={true}
                injectCSS={false}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
