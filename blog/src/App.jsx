import { useEffect, useState } from 'react'
import './App.css'

const COMMENTS_STORAGE_KEY = 'blog-comments-by-post'

const posts = [
  {
    id: 1,
    title: 'Cómo empezar con React',
    content:
      'React te permite crear interfaces en componentes. Empieza por entender estado y eventos.',
  },
  {
    id: 2,
    title: 'Qué es useState y para qué sirve',
    content:
      'useState guarda datos dentro del componente y vuelve a renderizar cuando cambian.',
  },
]

function App() {
  // Guardamos comentarios por id de post: { 1: [...], 2: [...] }
  const [commentsByPost, setCommentsByPost] = useState(() => {
    const savedComments = localStorage.getItem(COMMENTS_STORAGE_KEY)

    if (!savedComments) return {}

    try {
      return JSON.parse(savedComments)
    } catch {
      return {}
    }
  })

  // Guardamos el texto del formulario por id de post.
  const [formByPost, setFormByPost] = useState({})

  // Cada vez que cambian los comentarios, los guardamos en localStorage.
  useEffect(() => {
    localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(commentsByPost))
  }, [commentsByPost])

  const handleInputChange = (postId, field, value) => {
    setFormByPost((currentForm) => ({
      ...currentForm,
      [postId]: {
        ...currentForm[postId],
        [field]: value,
      },
    }))
  }

  const handleAddComment = (postId) => {
    const name = formByPost[postId]?.name?.trim() || 'Anónimo'
    const message = formByPost[postId]?.message?.trim()

    if (!message) return

    const newComment = {
      id: Date.now(),
      name,
      message,
    }

    setCommentsByPost((currentComments) => ({
      ...currentComments,
      [postId]: [...(currentComments[postId] || []), newComment],
    }))

    setFormByPost((currentForm) => ({
      ...currentForm,
      [postId]: {
        name: currentForm[postId]?.name || '',
        message: '',
      },
    }))
  }

  return (
    <main className="blog-page">
      <header className="blog-header">
        <h1>Mi Blog en React</h1>
        <p>Ejemplo para principiantes con publicaciones y comentarios.</p>
      </header>

      {posts.map((post) => {
        const comments = commentsByPost[post.id] || []
        const postForm = formByPost[post.id] || { name: '', message: '' }

        return (
          <article key={post.id} className="post-card">
            <h2>{post.title}</h2>
            <p>{post.content}</p>

            <section className="comments-section">
              <h3>Comentarios ({comments.length})</h3>

              {comments.length === 0 ? (
                <p className="empty-state">Todavía no hay comentarios.</p>
              ) : (
                <ul className="comments-list">
                  {comments.map((comment) => (
                    <li key={comment.id}>
                      <strong>{comment.name}:</strong> {comment.message}
                    </li>
                  ))}
                </ul>
              )}

              <div className="comment-form">
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={postForm.name}
                  onChange={(event) =>
                    handleInputChange(post.id, 'name', event.target.value)
                  }
                />
                <textarea
                  rows="3"
                  placeholder="Escribe tu comentario"
                  value={postForm.message}
                  onChange={(event) =>
                    handleInputChange(post.id, 'message', event.target.value)
                  }
                />
                <button onClick={() => handleAddComment(post.id)}>
                  Publicar comentario
                </button>
              </div>
            </section>
          </article>
        )
      })}
    </main>
  )
}

export default App
