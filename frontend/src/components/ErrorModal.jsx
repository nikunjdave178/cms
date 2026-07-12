import Modal from './Modal'

// Centered, unmissable error prompt with a single OK button — for failures a
// user needs to actually notice and acknowledge (e.g. a delete blocked by a
// reference/FK constraint), as opposed to routine inline validation errors
// that stay next to the field/action that caused them.
export default function ErrorModal({ title = 'Something went wrong', message, onClose }) {
  return (
    <Modal onClose={onClose} size="sm" title={title}>
      <p className="text-sm text-gray-600">{message}</p>
      <div className="mt-5 flex justify-end">
        <button type="button" className="btn-primary" onClick={onClose} autoFocus>OK</button>
      </div>
    </Modal>
  )
}
