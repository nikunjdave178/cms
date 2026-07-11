import Modal from './Modal'

// Three-choice prompt for the unsaved-changes guard (see
// context/UnsavedChangesContext.jsx) — ConfirmModal is a hardcoded two-button
// Cancel/Delete shell, so this is a new sibling built directly on the generic
// Modal primitive rather than a ConfirmModal variant.
export default function UnsavedChangesModal({ saving, error, onSaveAndContinue, onDiscardAndContinue, onCancel }) {
  return (
    <Modal onClose={onCancel} size="sm" title="Unsaved changes">
      <p className="text-sm text-gray-600">
        You have unsaved changes. Save them before continuing?
      </p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex flex-col gap-2">
        <button className="btn-primary w-full justify-center" onClick={onSaveAndContinue} disabled={saving}>
          {saving ? 'Saving…' : 'Save & Continue'}
        </button>
        <button className="btn-secondary w-full justify-center" onClick={onDiscardAndContinue} disabled={saving}>
          Continue without saving
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="w-full text-center py-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}
