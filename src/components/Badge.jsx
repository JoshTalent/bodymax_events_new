import { cn } from '../utils/cn'

const tones = {
  blue: 'bg-blue-100 text-blue-800',
  dark: 'bg-slate-900 text-white',
  slate: 'bg-slate-100 text-slate-700',
  light: 'bg-blue-50 text-blue-700',
  outline: 'bg-white text-slate-700 border border-slate-300',
}

export function Badge({ children, tone = 'slate', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone] || tones.slate,
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const map = {
    // Registration statuses
    registered: { label: 'Registered', tone: 'blue' },
    pending_approval: { label: 'Pending Approval', tone: 'light' },
    needs_correction: { label: 'Needs Correction', tone: 'dark' },
    approved: { label: 'Approved', tone: 'blue' },
    payment_pending: { label: 'Payment Pending', tone: 'light' },
    payment_confirmed: { label: 'Payment Confirmed', tone: 'blue' },
    awaiting_weighin: { label: 'Awaiting Weigh-In', tone: 'light' },
    weighed: { label: 'Weighed', tone: 'blue' },
    eligible: { label: 'Eligible', tone: 'blue' },
    not_eligible: { label: 'Not Eligible', tone: 'dark' },
    withdrawn: { label: 'Withdrawn', tone: 'slate' },
    eliminated: { label: 'Eliminated', tone: 'dark' },
    completed: { label: 'Completed', tone: 'outline' },
    // Payment statuses
    not_required: { label: 'Not Required', tone: 'slate' },
    pending: { label: 'Pending', tone: 'light' },
    submitted: { label: 'Submitted', tone: 'blue' },
    confirmed: { label: 'Confirmed', tone: 'blue' },
    rejected: { label: 'Rejected', tone: 'dark' },
    // Event statuses
    draft: { label: 'Draft', tone: 'slate' },
    open: { label: 'Open', tone: 'blue' },
    closed: { label: 'Closed', tone: 'dark' },
    in_progress: { label: 'In Progress', tone: 'light' },
    completed_event: { label: 'Completed', tone: 'outline' },
    archived: { label: 'Archived', tone: 'slate' },
    // Weigh-in statuses
    not_weighed: { label: 'Not Weighed', tone: 'light' },
    successful: { label: 'Successful', tone: 'blue' },
    outside_category: { label: 'Outside Category', tone: 'dark' },
    requires_review: { label: 'Requires Review', tone: 'light' },
  }
  const config = map[status] || { label: status, tone: 'slate' }
  return <Badge tone={config.tone}>{config.label}</Badge>
}
