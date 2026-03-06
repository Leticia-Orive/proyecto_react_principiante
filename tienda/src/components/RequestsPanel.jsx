function RequestsPanel({
  isAdmin,
  requestForm,
  requestError,
  requestSuccess,
  myRequests,
  customerRequests,
  formatDateTime,
  onRequestInputChange,
  onCreateRequest,
  onDeleteRequest,
  getAdminReplyDraft,
  onAdminReplyChange,
  onReplyRequest,
}) {
  if (!isAdmin) {
    return (
      <section className="request-section" aria-label="Comentarios y pedidos especiales">
        <h2>¿No encuentras lo que buscas?</h2>
        <p>Dejanos un comentario o un pedido especial para que el administrador lo revise.</p>

        <form className="request-form" onSubmit={onCreateRequest}>
          <label>
            Tipo
            <select name="type" value={requestForm.type} onChange={onRequestInputChange}>
              <option value="pedido">Pedido especial</option>
              <option value="comentario">Comentario</option>
            </select>
          </label>

          <label>
            Asunto
            <input
              type="text"
              name="subject"
              placeholder="Ej: Busco chaqueta roja talla M"
              value={requestForm.subject}
              onChange={onRequestInputChange}
            />
          </label>

          <label>
            Detalle
            <textarea
              name="message"
              rows="3"
              placeholder="Cuentanos que necesitas o tu comentario"
              value={requestForm.message}
              onChange={onRequestInputChange}
            />
          </label>

          <button type="submit">Enviar solicitud</button>
        </form>

        {requestError && <p className="request-message request-message--error">{requestError}</p>}
        {requestSuccess && <p className="request-message request-message--success">{requestSuccess}</p>}

        <div className="my-requests">
          <h3>Mis solicitudes y respuestas</h3>
          {myRequests.length === 0 ? (
            <p className="my-requests__empty">Aun no has enviado solicitudes.</p>
          ) : (
            <ul className="my-requests__list">
              {myRequests.map((requestItem) => (
                <li key={requestItem.id} className="my-requests__item">
                  <p className="my-requests__subject">{requestItem.subject}</p>
                  <p className="my-requests__meta">Enviado el {formatDateTime(requestItem.createdAt)}</p>
                  <p className="my-requests__message">{requestItem.message}</p>

                  {requestItem.adminReply ? (
                    <div className="my-requests__reply">
                      <p className="my-requests__reply-title">Respuesta del administrador</p>
                      <p className="my-requests__reply-message">{requestItem.adminReply}</p>
                      <p className="my-requests__reply-meta">
                        Respondido el {formatDateTime(requestItem.repliedAt)}
                      </p>
                    </div>
                  ) : (
                    <p className="my-requests__pending">Pendiente de respuesta del administrador.</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="admin-requests" aria-label="Solicitudes de clientes">
      <h2>Solicitudes de clientes</h2>

      {customerRequests.length === 0 ? (
        <p className="admin-requests__empty">No hay solicitudes pendientes.</p>
      ) : (
        <ul className="admin-requests__list">
          {customerRequests.map((requestItem) => (
            <li key={requestItem.id} className="admin-requests__item">
              <div className="admin-requests__head">
                <span className="admin-requests__type">{requestItem.type}</span>
                <button
                  type="button"
                  className="admin-requests__delete"
                  onClick={() => onDeleteRequest(requestItem.id)}
                >
                  Eliminar
                </button>
              </div>
              <p className="admin-requests__subject">{requestItem.subject}</p>
              <p className="admin-requests__meta">
                De: {requestItem.userName} ({requestItem.userEmail})
              </p>
              <p className="admin-requests__message">{requestItem.message}</p>
              {requestItem.adminReply && (
                <div className="admin-requests__reply-preview">
                  <p className="admin-requests__reply-title">Respuesta enviada</p>
                  <p className="admin-requests__reply-message">{requestItem.adminReply}</p>
                  <p className="admin-requests__reply-meta">
                    Respondido el {formatDateTime(requestItem.repliedAt)}
                  </p>
                </div>
              )}
              <label className="admin-requests__reply-form">
                {requestItem.adminReply ? 'Editar respuesta' : 'Responder mensaje'}
                <textarea
                  rows="2"
                  value={getAdminReplyDraft(requestItem)}
                  onChange={(event) => onAdminReplyChange(requestItem.id, event.target.value)}
                  placeholder="Escribe la respuesta para el cliente"
                />
              </label>
              <button
                type="button"
                className="admin-requests__reply-button"
                onClick={() => onReplyRequest(requestItem.id)}
              >
                {requestItem.adminReply ? 'Actualizar respuesta' : 'Enviar respuesta'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default RequestsPanel
