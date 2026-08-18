export async function checkAndIncrement(kind, ip, max, env) {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return { allowed: true };
  }

  const date = new Date().toISOString().slice(0, 10);
  const key = `rl:${kind}:${ip}:${date}`;

  try {
    const response = await fetch(`${env.UPSTASH_REDIS_REST_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, "90000", "NX"],
      ]),
    });

    if (!response.ok) {
      throw new Error(`Upstash responded with ${response.status}`);
    }

    const results = await response.json();
    const count = results[0].result;
    return { allowed: count <= max, count };
  } catch (err) {
    console.error("checkAndIncrement: Upstash request failed, failing open", err);
    return { allowed: true };
  }
}
