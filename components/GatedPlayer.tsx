import { FunctionComponent, useEffect, useRef, useState } from "react"

import { createNewHls, isHlsSupported } from "livepeer/media/hls"

// This is a manual HLS player setup, as we we need custom attributes in the
// <video> element. This would not be necessary with full support in the SDK for
// Lit token gating.
//
// The only requirement is `withCredentials on the hls.js requests and the
// crossOrigin="use-credentials" attribute on the <video>.
const GatedPlayer: FunctionComponent<{
  playbackUrl?: string
}> = ({ playbackUrl }) => {
  const [videoSrc, setVideoSrc] = useState<string>()
  const videoElm = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!playbackUrl || !videoElm.current) return

    if (!isHlsSupported()) {
      // browser supports hls natively
      setVideoSrc(playbackUrl.toString())
    } else {
      createNewHls(
        playbackUrl.toString(),
        videoElm.current,
        {},
        {
          xhrSetup(xhr) {
            xhr.withCredentials = true
          },
        }
      )
    }
  }, [playbackUrl])

  return (
    <video
      controls
      width="100%"
      autoPlay
      muted
      crossOrigin="use-credentials"
      ref={videoElm}
      src={videoSrc}
    >
      <track kind="captions" />
    </video>
  )
}

export default GatedPlayer
