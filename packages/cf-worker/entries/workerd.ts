import app from "../src";

app.get("/", async (c) => {
  const res = await fetch(
    "https://raw.githubusercontent.com/yy4382/read-aloud/refs/heads/main/packages/cf-worker/src/index.html",
  );

  return c.html(await res.text());
});

export default app;
