import { useState } from "react";
import { SCENE_ART, type SceneKind } from "../game/scene-art";

export function SceneArt({kind, cinematic = false}: {kind: SceneKind; cinematic?: boolean}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (failed === kind) return null;
  const scene = SCENE_ART[kind];
  return <figure className={`scene-art${cinematic ? " cinematic" : ""}`} data-scene={kind}>
    <img src={`${import.meta.env.BASE_URL}scenes/${kind}.webp`}
      srcSet={`${import.meta.env.BASE_URL}scenes/${kind}-small.webp 480w, ${import.meta.env.BASE_URL}scenes/${kind}.webp 960w`}
      sizes="(max-width: 620px) calc(100vw - 56px), 960px" width={960} height={540}
      decoding="async" onError={() => setFailed(kind)} alt={scene.alt} />
    <figcaption>{scene.caption}</figcaption>
  </figure>;
}
