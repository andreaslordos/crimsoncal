import { verifyToken, githubFetch } from './_auth.js';
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
    await sodium.ready;

    const keyRes = await githubFetch('/actions/secrets/public-key');
    const { key: publicKey, key_id: keyId } = await keyRes.json();

    const binKey = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);
    const binSecret = sodium.from_string(cookie.trim());
    const encryptedBytes = sodium.crypto_box_seal(binSecret, binKey);
    const encryptedValue = sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL);

    await githubFetch('/actions/secrets/QGUIDE_COOKIE', {
      method: 'PUT',
      body: JSON.stringify({
        encrypted_value: encryptedValue,
        key_id: keyId,
      }),
    });

    return res.status(200).json({ ok: true, detail: 'Q-Guide cookie saved to GitHub Actions secret' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save cookie', detail: err.message });
  }
}
