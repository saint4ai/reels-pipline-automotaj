# Security

- Never commit API keys, tokens, cookies, private keys, customer media, or credentials.
- Keep local secrets in environment variables or an OS secret manager.
- A historical revision of this private repository contained a 21st.dev API key. The current tree is redacted, but the credential must be revoked and rotated because an ordinary commit does not erase Git history.
- Rewriting published history or force-pushing requires an explicit maintenance decision and coordination with every clone.
- Source podcast media and final renders are excluded from Git. Use an approved private object store if cross-device media synchronization is required.

If a secret is exposed: revoke it first, issue a replacement, update local configuration, and only then consider history cleanup.
