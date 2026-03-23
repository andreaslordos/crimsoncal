import { verifyToken, githubFetch, upsertGitHubVariable } from './_auth.js';
import sodium from 'libsodium-wrappers';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await verifyToken(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { cookie } = req.body || {};
  if (!cookie || !cookie.trim()) {
    return res.status(400).json({ error: 'cookie is required' });
  }

  try {
    // GitHub requires secret values to be encrypted with the repo's public key
    // using libsodium sealed boxes
    await sodium.ready;

    // Step 1: Get the repo's public key
    const keyRes = await githubFetch('/actions/secrets/public-key');
    const { key: publicKey, key_id: keyId } = await keyRes.json();

    // Step 2: Encrypt the cookie value
    const binKey = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);
    const binSecret = sodium.from_string(cookie.trim());
    const encryptedBytes = sodium.crypto_box_seal(binSecret, binKey);
    const encryptedValue = sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL);

    // Step 3: Update the secret
    await githubFetch('/actions/secrets/MY_HARVARD_COOKIE', {
      method: 'PUT',
      body: JSON.stringify({
        encrypted_value: encryptedValue,
        key_id: keyId,
      }),
    });

    // Also save to a readable variable so we can test it later
    try { await upsertGitHubVariable('MY_HARVARD_COOKIE_VAR', cookie.trim()); } catch {}

    return res.status(200).json({ ok: true, detail: 'Cookie saved to GitHub Actions secret' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save cookie', detail: err.message });
  }
}
