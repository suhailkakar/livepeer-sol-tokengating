import React from "react";

export default function Steps({
  publickey,
  litGateParams,
  completed,
}: {
  publickey: string | undefined;
  litGateParams: string;
  completed: boolean;
}) {
  const steps = ["Connect Wallet", "Choose Conditions", "Upload Video"];

  const step = completed
    ? 3
    : publickey && litGateParams !== "null"
    ? 2
    : publickey
    ? 1
    : 0;

  console.log(litGateParams);

  return (
    <div className="flex flex-row mt-10 items-center ">
      {steps.map((s, i) => (
        <>
          <div className="flex flex-col items-center justify-center">
            <div
              className={
                " rounded-full w-[4rem] h-[4rem] flex items-center justify-center border-dashed border-zinc-700 border  text-xl " +
                (i < step
                  ? "bg-primary border-none text-black"
                  : "text-zinc-700")
              }
            >
              {i + 1}
            </div>
            <h4
              className={
                "mt-2 w-[9rem] text-center" +
                (i < step ? " text-primary" : " text-gray-600")
              }
            >
              {s}
            </h4>
          </div>
          {i !== steps.length - 1 && (
            <hr
              className={
                "border border-dashed border-zinc-700 w-[10rem] -mt-10" +
                (i < step ? " border-primary" : "")
              }
            />
          )}
        </>
      ))}
    </div>
  );
}
