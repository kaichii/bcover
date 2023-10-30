import { parseMediaType } from "https://deno.land/std@0.175.0/media_types/parse_media_type.ts";
import {
  ImageMagick,
  IMagickImage,
} from "https://deno.land/x/imagemagick_deno@0.0.14/mod.ts";

async function getRemoteImage(image: string) {
  const sourceRes = await fetch(image, {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    },
  });

  if (!sourceRes.ok) {
    return "Error retrieving image from URL.";
  }
  const mediaType = parseMediaType(sourceRes.headers.get("Content-Type")!)[0];

  if (mediaType.split("/")[0] !== "image") {
    return "URL is not image type.";
  }

  return {
    // deno-lint-ignore no-async-promise-executor
    image: await new Promise<Uint8Array>((async (resolve) => {
      ImageMagick.read(
        new Uint8Array(await sourceRes.arrayBuffer()),
        (image: IMagickImage) => image.write((d: Uint8Array) => resolve(d)),
      );
    })),
    mediaType,
  };
}

async function handler(req: Request): Promise<Response> {
  const id = new URL(req.url).searchParams.get("bvid");

  if (!id) {
    return new Response("bvid is missing", { status: 400 });
  }

  const resp = await fetch(
    `https://api.bilibili.com/x/web-interface/view?bvid=${id}`,
    {
      headers: {
        accept: "application/json",
      },
    },
  );

  const data = await resp.json();
  const imgSrc = data?.["data"]?.["pic"];

  const image = await getRemoteImage(imgSrc);

  if (typeof image === "string") {
    return new Response(image, { status: 400 });
  }

  return new Response(image.image, {
    headers: {
      "Content-Type": image.mediaType,
    },
  });
}

Deno.serve(handler);
