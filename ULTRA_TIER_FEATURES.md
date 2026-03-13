# ClawHQ Ultra ($350/mo) — Dashboard Features

Ultra includes everything from Starter ($59) + Pro ($129) plus a full Mission Control command center.

**Credits:** 5X (vs 1X Starter, 2X Pro)
**VPS:** 16 vCPU / 64GB RAM / 800GB NVMe / 64TB bandwidth

---

## MISSION CONTROL (Full Command Center)

### 1. Agent Squad Builder
- Design teams of specialized AI agents that work together
- Define agent roles, personalities, and capabilities via SOUL templates
- Pre-built squad templates (Support Team, Research Team, Sales Team, etc.)
- Agent-to-agent communication and handoffs
- Lead/orchestrator agent that coordinates the squad
- Unlimited custom agents

### 2. Task Board (Kanban)
- Drag-and-drop Kanban board (Inbox → Backlog → In Progress → Review → Done)
- Assign tasks to specific agents or let orchestrator auto-dispatch
- Parent-child subtasks for complex work decomposition
- Task dependencies and blocking
- Priority levels (low, medium, high, critical)
- Due dates and deadline tracking
- Tags and labels
- AI-assisted task decomposition — describe a goal, get subtasks auto-generated
- Threaded comments on tasks
- Acceptance criteria per task

### 3. Agent Roster
- See every agent's status in real-time (online, working, idle, blocked, sleeping)
- Agent capacity and current workload
- Heartbeat monitoring with auto-sleep
- Per-agent performance stats (tasks completed, success rate, avg response time)
- Agent versioning with rollback
- One-click deploy/retire agents

### 4. Live Event Feed
- Real-time activity stream (SSE, 2-second refresh)
- Webhook events, tool invocations, errors — all in one feed
- Filter by agent, event type, severity
- Timestamped with full context
- Click any event to drill into details

### 5. Session Tracker
- See all active/idle agent sessions
- Token usage per session, per model, per agent
- Session duration and status
- Pause/resume sessions
- Session replay — rewind and replay any agent run step-by-step
- Crash recovery with auto-continuation

### 6. 4-Pane Dashboard Layout
- **Pane 1:** Task queue (Kanban)
- **Pane 2:** Agent roster (status + capacity)
- **Pane 3:** Live event stream (real-time feed)
- **Pane 4:** Detail panel (task context, agent details, session inspector)
- Resizable panes, customizable layout

---

## ADVANCED MONITORING (Enterprise-Grade)

### 7. Real-Time System Monitoring
- CPU, RAM, disk, network usage graphs over time
- Process list with resource consumption
- Uptime history with SLA percentage
- Request rate (requests/min, requests/hour)
- Response latency distribution
- Error rate tracking
- Bottleneck detection
- Environment filtering (if multi-env)

### 8. Cost & Token Dashboard
- Token usage breakdown per model, per agent, per task
- Input/output tokens tracked separately
- Cache read/creation token monitoring
- Cost estimation per session
- Monthly spend tracking with trend charts
- Budget alerts before overspend
- Cost spike correlation with prompt/config changes
- ROI metrics

### 9. Alerts & Notifications
- Configurable alert rules (CPU threshold, error rate, latency spike, downtime)
- Alert cooldowns to prevent spam
- Notification channels: email, Slack, webhook, in-dashboard
- Cost/budget alerts
- Agent failure alerts
- Custom alert conditions

---

## TRACING & DEBUGGING

### 10. End-to-End Tracing
- Full request lifecycle visualization (prompt → LLM call → tool use → response)
- Step-by-step agent interaction traces
- LLM call tracking with inputs/outputs
- Tool invocation logs with timing
- Latency breakdown per step
- Error pinpointing in trace

### 11. Logs Explorer (Advanced)
- Real-time log streaming
- Search/filter by agent, level, time range, keyword
- Download logs (CSV/JSON)
- Conversation logging with full history
- Credential scrubbing in logs (auto-redact secrets)
- Log retention policies

### 12. Time Travel Debugging
- Restart any session from a checkpoint
- Rewind to any point in an agent's execution
- Compare different runs side-by-side
- Iteration history visualization

---

## WORKFLOW & AUTOMATION

### 13. Workflow Builder
- Visual workflow editor — chain agents together
- Sequential and parallel execution paths
- Conditional branching (if/else based on agent output)
- Trigger-based automation (on event, on schedule, on webhook)
- Loop detection with auto-escalation after failures
- Workflow templates for common patterns
- Cron job scheduling from dashboard

### 14. Continuous Missions
- Set long-running autonomous goals
- Agents work on missions in the background
- Auto-dispatch tasks as dependencies complete
- Progress tracking across iterations
- Human approval checkpoints for critical decisions
- Pause/resume missions

### 15. Slash Commands
- Quick agent invocation from dashboard (/orchestrate, /standup, /brainstorm)
- Custom slash commands per agent
- Rapid task creation and assignment

---

## COLLABORATION & GOVERNANCE

### 16. Multi-User Workspaces (Advanced)
- Role-based access: Viewer, Operator, Admin, Super Admin
- Team member management with invites
- Per-user activity tracking
- Shared task boards and agent access
- Organization-level management

### 17. Inbox & Approvals
- Agent reports land in inbox for human review
- Approval workflows for high-cost or sensitive operations
- Decision queues with context
- Auto-respond capability for routine items
- @Mentions for agent/human coordination

### 18. Audit Log (Advanced)
- Complete activity log for every action
- Filter by user, agent, action type, date
- Compliance-ready audit trail
- Incident reconstruction capability
- Data lineage from prompt to response
- Export for compliance reporting

---

## MEMORY & KNOWLEDGE

### 19. Memory Dashboard
- View, search, filter, edit agent memory
- Core memory blocks (user preferences, agent persona, task context)
- Episodic memory with timestamped events
- Project-specific isolated or shared memory
- Memory file browser

### 20. Knowledge Base
- Project knowledge base for contextual docs
- Document upload with chunking and indexing
- Skills library with reusable knowledge modules
- Per-agent knowledge scoping

---

## ANALYTICS & REPORTING

### 21. Usage Analytics (Advanced)
- Token usage trends over time
- Conversation counts and patterns
- Peak hours identification
- Channel breakdown (which channels get most traffic)
- Agent performance comparison
- Response quality metrics

### 22. Standup Reports
- Auto-generated daily/weekly standup summaries
- What agents accomplished, what's blocked, what's next
- Export and share with team
- Report history

### 23. Channel Analytics (Advanced)
- Messages per channel over time
- Response rates and times
- User satisfaction per channel
- Peak times per channel
- Auto-response effectiveness

---

## API & INTEGRATIONS

### 24. API Access (Advanced)
- Direct API endpoint to OpenClaw instance
- API key management (create, revoke, rotate)
- API usage dashboard with rate tracking
- Webhook management (outbound) with delivery history and retry logic
- Inbound webhook endpoints for external triggers

### 25. Integrations
- GitHub sync (issues, PRs)
- Slack notifications
- Email notifications
- Calendar integration
- Custom webhook integrations

---

## INFRASTRUCTURE CONTROL

### 26. Mission Control VPS
- Full VPS reboot (not just OpenClaw restart)
- Scheduled maintenance windows
- Scheduled auto-restarts
- Network stats and bandwidth monitoring
- Disk usage breakdown
- Process manager (view/kill processes)
- Firewall rule viewer

### 27. Multi-Gateway Panel
- Monitor multiple OpenClaw gateways
- Gateway health status
- Per-gateway agent discovery
- Cross-gateway orchestration

---

## SUMMARY: What Each Tier Gets

| Feature | Starter ($59) | Pro ($129) | Ultra ($350) |
|---------|:---:|:---:|:---:|
| Credits | 1X | 2X | 5X |
| VPS Specs | 2vCPU/8GB | 8vCPU/32GB | 16vCPU/64GB |
| Context Window | 128K cap | Full | Full |
| Basic VPS Controls | Yes | Yes | Yes |
| Mission Control | - | - | Yes |
| Agent Squad Builder | - | - | Yes |
| Task Board (Kanban) | - | - | Yes |
| Live Event Feed | - | - | Yes |
| Session Tracker | - | - | Yes |
| 4-Pane Command Center | - | - | Yes |
| Time Travel Debugging | - | - | Yes |
| Continuous Missions | - | - | Yes |
| Workflow Builder | - | Basic | Advanced |
| Models | 1 model | Multi-model + Playground | Multi-model + Playground |
| Model Config | - | Custom (temp, top-p) | Custom (temp, top-p) |
| Agent Builder | - | No-code builder | No-code builder |
| Agent Analytics | - | Basic | Deep + per-agent |
| Monitoring | - | Charts + alerts | Enterprise (tracing, debugging) |
| Logs | - | Basic streaming | Advanced (search, filter, download) |
| Usage Analytics | - | Basic | Advanced (trends, reports, standups) |
| Channel Analytics | - | Basic | Advanced |
| Auto-Responses | - | Yes | Yes |
| Cost/Token Dashboard | - | - | Yes |
| Memory Dashboard | - | - | Yes |
| Knowledge Base | - | - | Yes |
| Team Access | - | Basic (invite, roles) | Advanced (RBAC, orgs, approvals) |
| API Access | - | Basic (endpoint, keys) | Advanced (webhooks, integrations) |
| Audit Log | - | Basic | Advanced (compliance, export) |
| Inbox & Approvals | - | - | Yes |
| Slash Commands | - | - | Yes |
| Standup Reports | - | - | Yes |
| GitHub/Slack Integration | - | - | Yes |
| Multi-Gateway | - | - | Yes |

---

## Positioning

- **Starter ($59)** = Use OpenClaw
- **Pro ($129)** = Control OpenClaw
- **Ultra ($350)** = Command an AI Workforce
