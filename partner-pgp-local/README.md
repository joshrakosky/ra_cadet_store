# Partner PGP local folder

Use this directory on your machine for **non-secret workflow files** you generate while working with the partner (for example the exported **public** `.asc` file).

- **Do not** commit private keys, passphrases, or decrypted partner data to git.
- The `.gitignore` rule keeps everything here out of the repo **except** this `README.md`.

Suggested layout (create as needed):

- `republic-new-hires-partner-public.asc` — OpenPGP public key (other partners; **not** for Republic's X509 portal)
- `proforma-public.pem` — X509 public certificate to send to Republic (from `scripts/generate-proforma-x509.ps1`)
- `proforma-private.pem` — X509 private key (**never** share or commit)
- `inbox/` — encrypted files from the partner
- `decrypted/` — plaintext after local decrypt (treat as sensitive; delete when no longer needed per policy)

See [docs/PARTNER_PGP_SOP.md](../docs/PARTNER_PGP_SOP.md) for OpenPGP.  
See [docs/REPUBLIC_X509_ONBOARDING.md](../docs/REPUBLIC_X509_ONBOARDING.md) for Republic's X509 portal.
