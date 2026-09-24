import { Delete02Icon } from '@hugeicons/core-free-icons'
import { DialogShell, GhostButton } from '../ui'

export default function DiscardModal({ onClose, onKeepDraft, onDiscard }: { onClose: () => void; onKeepDraft: () => void; onDiscard: () => void }) {
  return (
    <DialogShell
      icon={Delete02Icon}
      title="Leave event setup?"
      width="max-w-[480px]"
      onClose={onClose}
      footer={
        <>
          <GhostButton onClick={onClose}>Keep editing</GhostButton>
          <div className="flex gap-2">
            <GhostButton onClick={onDiscard} className="border-danger-500/30 text-danger-500 hover:bg-danger-500/5">
              Discard
            </GhostButton>
            <button onClick={onKeepDraft} className="rounded-full bg-brand-500 px-5 py-2.5 text-base font-medium text-white hover:brightness-95">
              Save draft
            </button>
          </div>
        </>
      }
    >
      <p className="rounded-2xl bg-white p-5 text-sm leading-[1.5] text-ink-800">
        Your changes are saved as a draft, so you can pick up where you left off from <strong>Create New</strong>. Discard deletes the draft for good.
      </p>
    </DialogShell>
  )
}
