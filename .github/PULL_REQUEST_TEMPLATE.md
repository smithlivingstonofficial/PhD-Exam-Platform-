## Summary of Changes
Provide a brief explanation of the problem solved and changes implemented in this pull request.

## Related Issues
Closes #(issue_number)

## Type of Change
- [ ] 🚀 New Feature
- [ ] 🐛 Bug Fix
- [ ] 🛡️ Security / Anti-Cheat Enhancement
- [ ] ⚡ Performance Optimization
- [ ] 📚 Documentation Update

## Verification & Pre-flight Checklist
- [ ] `npm run lint` and `npm run build` pass without warnings or errors.
- [ ] Client-side AI: Verified that no continuous video/audio streams are routed through serverless functions.
- [ ] Security: Verified that Supabase queries do not expose `correct_answers` to candidate sessions.
- [ ] Storage: Evidence media (WebP/Opus) uploads directly to Cloudflare R2 via pre-signed URLs.
- [ ] Tested in Google Chrome / Microsoft Edge.
