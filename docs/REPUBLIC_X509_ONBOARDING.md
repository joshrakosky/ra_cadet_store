# Republic Airways — X509 public key onboarding (Proforma)

Republic's portal form **"Create x509 Public Key"** requires an **X509 certificate** (`-----BEGIN CERTIFICATE-----`).  
An **OpenPGP / PGP** key (`-----BEGIN PGP PUBLIC KEY BLOCK-----`) will always fail with *"The certificate's text format is invalid."*

## Roles

| Party | Responsibility |
|--------|----------------|
| **Proforma** | Generate X509 key pair; send **public certificate only** to Republic |
| **Republic Airways** | Paste Proforma's public cert into their portal |

---

## Step 1 — Proforma: generate certificate (one-time)

From repo root:

```powershell
powershell -File scripts/generate-proforma-x509.ps1
```

This writes to `partner-pgp-local/` (git-ignored):

| File | Share with Republic? |
|------|----------------------|
| `proforma-public.pem` | **Yes** — public certificate only |
| `proforma-private.pem` | **Never** — vault / password manager only |

The script prints **notBefore** / **notAfter** dates — include those in the email to Republic for the portal's Valid From / Valid To fields.

To replace an existing pair, delete both `.pem` files first, then re-run the script.

---

## Step 2 — Proforma: email Republic

Use your org's secure channel. Copy/adapt:

**Subject:** Proforma X509 public certificate for portal registration

**Body:**

> Hi,
>
> The key we sent earlier was OpenPGP format. Your "Create x509 Public Key" portal requires an X509 certificate instead — they are different formats, which is why you saw "The certificate's text format is invalid."
>
> Please use the attached **proforma-public.pem** (or pasted below) and **do not** use the previous PGP file.
>
> In your portal:
> 1. **Name:** Proforma (or X509 Proforma)
> 2. **Valid From / Valid To:** [paste notBefore / notAfter from script output]
> 3. **Certificate:** paste the entire contents of proforma-public.pem including BEGIN and END lines
>
> Do not share this email outside your team. We never send our private key.
>
> Please confirm once the upload succeeds.

Attach `partner-pgp-local/proforma-public.pem` or paste its full text.

---

## Step 3 — Republic: paste into portal

Republic opens **Create x509 Public Key** and pastes the full public certificate. Save — the format error should clear.

---

## Step 4 — Proforma: confirm and track expiry

- Ask Republic to confirm success.
- Record **notAfter** date; renew and send a new public cert before expiry (~2 years with default script settings).

---

## What NOT to do

- Do **not** re-send the PGP `.asc` key for this portal.
- Do **not** send `proforma-private.pem` or any private key material.
- Do **not** commit `.pem` files to git (`partner-pgp-local/` is ignored).

---

## Related files

| File | Purpose |
|------|---------|
| [`scripts/generate-proforma-x509.ps1`](../scripts/generate-proforma-x509.ps1) | Generate cert pair |
| [`docs/PARTNER_PGP_SOP.md`](PARTNER_PGP_SOP.md) | OpenPGP flow (other partners; not Republic portal) |
| [`partner-pgp-local/README.md`](../partner-pgp-local/README.md) | Local artifact folder |
