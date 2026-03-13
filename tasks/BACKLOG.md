# ClawHQ — Backlog (Post-Current Sprint)

Features and tasks to build after the current admin dashboard + provisioning work is complete.

---

## 0. Deploy Page — RESOLVED

~~Auth blocker resolved.~~ `trusted-proxy` auth mode works. Provisioning is fully automated (12 steps via `provision-v3.ts`): DNS → Firewall → SSH → OpenClaw install → Config → Systemd → Gateway → SSL → Nginx → Basic Auth → Verify.

- [x] Automated provisioning pipeline (DNS, firewall, SSH, OpenClaw, nginx, SSL)
- [x] `trusted-proxy` auth mode bypasses device identity
- [x] HTTP Basic Auth on nginx for dashboard access
- [x] Polling-based live progress UI
- [x] Chat completions endpoint auto-enabled during provisioning

---

## 1. Customer Password Flow
- [ ] Send welcome email to customer after VPS provisioning (include credentials + dashboard URL)
- [x] "Change Dashboard Password" on customer dashboard (`dashboard-password.tsx`)
- [x] API route: SSH into customer VPS, update htpasswd, reload nginx (`api/vps/password`)
- [x] Update `vps_instances.dashboard_password` in DB after change
- [ ] Email service setup (Resend, SendGrid, or similar)

## 2. Full Admin CRUD Operations
- [x] Admin: Edit customer subscription — `admin-subscription-editor.tsx` + API
- [x] Admin: Edit VPS details — `admin-vps-editor.tsx` + API
- [x] Admin: Delete customer account — `admin-delete-customer.tsx` + cascade delete API
- [x] Admin: Reset customer dashboard password remotely (`api/admin/vps-password`)
- [x] Admin: Force restart/stop customer VPS gateway (admin customer detail page)
- [x] Admin: View customer OpenClaw logs remotely (`api/vps/logs`)
- [x] Admin: Configure API keys for customer VPS (`api/admin/api-keys`)
- [x] Admin: Bulk actions — checkbox selection + suspend/activate (`api/admin/customers/bulk`)

## 3. OpenClaw Iframe + Chat
- [x] Embed OpenClaw Control UI in `/dashboard/openclaw` page via iframe
- [x] Basic Auth credentials shown to user (credential banner component)
- [x] Chat page: proxy chat through OpenClaw gateway API (`api/chat/send`)
- [x] Agent-specific routing via `openclaw:<agentSlug>` model format
- [x] Conversation persistence via `x-openclaw-session-key` header
- [x] Handle iframe CSP / allowed origins correctly

## 4. Customer Notifications
- [ ] Welcome email after provisioning
- [ ] VPS status change notifications (down, restarted)
- [ ] Subscription expiry reminders
- [ ] Support ticket reply notifications
- [ ] Password change confirmation email

## 5. Billing / Payments
- [ ] XPay Checkout integration for real payments
- [ ] Auto-create subscription after payment
- [ ] Invoice generation
- [ ] Upgrade/downgrade plan flow
- [ ] Cancel subscription flow (grace period)

## 6. Monitoring & Alerts
- [x] Real-time VPS health monitoring — CPU, RAM, disk, uptime, network (`api/vps/monitoring`)
- [x] OpenClaw gateway health check (`api/vps/gateway-health`)
- [x] Auto-restart gateway — systemd `Restart=always` + health check timer every 2min + `enableAutoRestart()` SSH function
- [x] Admin VPS health overview — "Check All" button on admin stats page, per-VPS health status, enable auto-restart for unhealthy VPS
- [x] Customer-facing uptime dashboard — uptime percentage, recent check status bar on VPS page (`api/vps/uptime`)

## 7. Agent Marketplace
- [x] Deploy agents to customer VPS (`deployAgent` in ssh.ts + API route)
- [x] Undeploy agents (`undeployAgent` in ssh.ts + API route)
- [ ] Agent configuration editor
- [ ] Premium agent purchase flow
- [ ] Agent usage analytics

## 8. Channel Integrations
- [x] Channel connect flow: SSH → update openclaw.json → hot-reload (`configureChannel` in ssh.ts)
- [ ] WhatsApp Business API integration
- [ ] Telegram bot setup flow (bot token from @BotFather)
- [ ] Discord bot setup flow (bot token + guild ID)
- [ ] Slack app setup flow (OAuth app credentials)
- [x] Channel disconnect flow: SSH → remove from config → hot-reload (`removeChannel` in ssh.ts)
- [ ] Channel status monitoring (SSH health check per channel)
- [ ] Store channel credentials encrypted in DB

## 9. Security Hardening
- [ ] Rate limiting on all API routes
- [ ] SSH key auth instead of password (for provisioning)
- [ ] Rotate dashboard passwords periodically
- [ ] Audit log for admin actions
- [ ] 2FA for admin accounts
- [x] Account password change requires current password verification
- [x] Forgot password flow (Supabase email reset)

## 10. Production Deployment
- [x] Deploy dashboard to `app.clawhq.tech` (Vercel)
- [x] Set all env vars in Vercel (Supabase, Cloudflare, etc.)
- [x] Set `NEXT_PUBLIC_APP_URL=https://app.clawhq.tech`
- [x] Test provisioning from production (Yashash's VPS deployed successfully)
- [ ] Custom domain SSL verification
- [ ] Error tracking (Sentry or similar)
