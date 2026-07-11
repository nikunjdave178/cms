import Modal from './Modal'

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <Modal onClose={onCancel} size="sm">
      <p className="text-gray-800 text-sm">{message}</p>
      <div className="mt-5 flex justify-end gap-3">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-danger" onClick={onConfirm}>Delete</button>
      </div>
    </Modal>
  )
}
