import React from "react";

import Link from "next/link";
import { AiFillGithub } from "react-icons/ai";
import dynamic from "next/dynamic";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function Navbar() {
  return (
    <div className="absolute top-0 left-0  ml-10 mt-10 flex items-center ">
      <WalletMultiButtonDynamic
        style={{
          backgroundColor: "#C12EF1",
          color: "#222222",
          borderRadius: "0.7rem",
        }}
      />
    </div>
  );
}
