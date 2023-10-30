import { serve } from "https://deno.land/std@0.204.0/http/server.ts";

async function handler(req: Request): Promise<Response> {
  const id = new URL(req.url).searchParams.get("bvid");

  const resp = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${id}`, {
    headers: {
      accept: "application/json",
    },
  });

  const data = await resp.json();

  return new Response(data?.["data"]?.["pic"], {
    status: resp.status
  });
}

serve(handler);