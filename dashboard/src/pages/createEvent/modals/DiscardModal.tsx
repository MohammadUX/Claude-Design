import { Delete02Icon } from '@hugeicons/core-free-icons'
import { CloseButton, DialogShell, SubmitButton } from '../ui'

export default function DiscardModal({ onClose, onKeepDraft, onDiscard }: { onClose: () => void; onKeepDraft: () => void; onDiscard: () => void }) {
  return (
    <DialogShell
      icon={Delete02Icon}
      title="Leave event setup?"
      width="max-w-[480px]"
      onClose={onClose}
      footer={
        <>
          <CloseButton>Keep editing</CloseButton>
          <div className="flex gap-2">
            <CloseButton then={onDiscard} className="border-danger-500/30 text-danger-500 hover:bg-danger-500/5">
              Discard
            </CloseButton>
            <SubmitButton onSubmit={() => onKeepDraft}>Save draft</SubmitButton>
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
