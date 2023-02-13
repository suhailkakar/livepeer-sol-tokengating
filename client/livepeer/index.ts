import { createReactClient, studioProvider } from "@livepeer/react";
import { betaStudioProvider } from "../../lib/livepeer";

const client = createReactClient({
  provider: betaStudioProvider(),
});

export default client;
