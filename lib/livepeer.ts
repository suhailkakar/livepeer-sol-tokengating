import { Asset, CreateAssetArgs } from "@livepeer/react";
import { StudioLivepeerProvider } from "livepeer/providers/studio";
import {
  CreateAssetSource,
  MirrorSizeArray,
  PlaybackInfo,
} from "livepeer/types";
import {
  FetchOptions,
  LivepeerProviderFn,
} from "livepeer/dist/declarations/src/providers/base";
import { StudioPlaybackInfo } from "livepeer/dist/declarations/src/providers/studio/types";

declare global {
  type AssetPlaybackPolicy = {
    type: "public" | "lit_signing_condition";
    unifiedAccessControlConditions: any[];
    resourceId?: Record<string, string>;
  };

  interface BetaAsset extends Asset {
    playbackPolicy: AssetPlaybackPolicy;
  }

  type BetaCreateAssetSource = CreateAssetSource & {
    playbackPolicy?: AssetPlaybackPolicy;
  };

  type BetaCreateAssetSourceType =
    | ReadonlyArray<BetaCreateAssetSource>
    | Array<BetaCreateAssetSource>;

  interface BetaPlaybackInfo extends PlaybackInfo {
    meta: PlaybackInfo["meta"] & {
      playbackPolicy: AssetPlaybackPolicy;
    };
  }
}

class BetaLivepeerStudioProvider extends StudioLivepeerProvider {
  _extraFields: Record<string, object> = {};

  async createAsset<TSource extends BetaCreateAssetSourceType>(
    args: CreateAssetArgs<TSource>
  ): Promise<MirrorSizeArray<TSource, Asset>> {
    for (const src of args.sources) {
      const { url, file, name, ...extra } = { url: "", file: null, ...src };
      this._extraFields[name] = extra;
    }
    return await super.createAsset(args);
  }

  _create<T, P>(
    url: `/${string}`,
    options?: FetchOptions<P> | undefined
  ): Promise<T> {
    const extra = this._extraFields[(options?.json as any)?.name];
    if (extra) {
      options = {
        ...options,
        json: {
          ...options?.json,
          ...extra,
        } as P,
      };
    }
    return super._create(url, options);
  }

  _mapToPlaybackInfo(studioPlaybackInfo: StudioPlaybackInfo): PlaybackInfo {
    return {
      ...studioPlaybackInfo,
      meta: {
        ...studioPlaybackInfo?.["meta"],
        live: studioPlaybackInfo?.["meta"]?.["live"]
          ? Boolean(studioPlaybackInfo?.["meta"]["live"])
          : false,
      },
    };
  }
}

export const betaStudioApiKey = "fbc655bf-8920-43b4-be8c-6dd0c35447a5";

export function betaStudioProvider(): LivepeerProviderFn<BetaLivepeerStudioProvider> {
  return () =>
    new BetaLivepeerStudioProvider({
      name: "Livepeer Studio Beta",
      baseUrl: "https://livepeer.monster/api",
      apiKey: betaStudioApiKey,
    });
}
