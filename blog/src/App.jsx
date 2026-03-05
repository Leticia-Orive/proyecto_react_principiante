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

const languageGroups = [
  {
    title: 'Web y Frontend',
    description: 'Lenguajes usados para interfaces en navegadores.',
    languages: ['JavaScript', 'TypeScript', 'HTML', 'CSS'],
  },
  {
    title: 'Backend y APIs',
    description: 'Muy usados para servidores, lógica de negocio y APIs.',
    languages: ['JavaScript (Node.js)', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'PHP', 'Ruby'],
  },
  {
    title: 'Móvil',
    description: 'Para apps Android e iOS nativas o multiplataforma.',
    languages: ['Kotlin', 'Java', 'Swift', 'Dart'],
  },
  {
    title: 'Ciencia de datos e IA',
    description: 'Frecuentes en análisis de datos, machine learning e investigación.',
    languages: ['Python', 'R', 'Julia', 'MATLAB'],
  },
  {
    title: 'Sistemas y alto rendimiento',
    description: 'Orientados a control de memoria, drivers y software de bajo nivel.',
    languages: ['C', 'C++', 'Rust', 'Zig'],
  },
  {
    title: 'Empresa y legado',
    description: 'Lenguajes históricos y todavía presentes en bancos y grandes empresas.',
    languages: ['COBOL', 'Fortran', 'Visual Basic .NET', 'PL/SQL'],
  },
]

function App() {
  // Controla qué página del blog se está viendo.
  const [currentPage, setCurrentPage] = useState('blog')
  // Texto del buscador para filtrar lenguajes.
  const [languageQuery, setLanguageQuery] = useState('')
  // Categoría activa de lenguajes. "Todas" muestra todas las categorías.
  const [selectedLanguageCategory, setSelectedLanguageCategory] = useState('Todas')

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

  // Si salimos de la página de lenguajes, restauramos filtros a estado inicial.
  useEffect(() => {
    if (currentPage !== 'languages') {
      setLanguageQuery('')
      setSelectedLanguageCategory('Todas')
    }
  }, [currentPage])

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

  const normalizedQuery = languageQuery.trim().toLowerCase()

  const languageCategories = ['Todas', ...languageGroups.map((group) => group.title)]

  const filteredLanguageGroups = languageGroups
    .filter(
      (group) =>
        selectedLanguageCategory === 'Todas' || group.title === selectedLanguageCategory,
    )
    .map((group) => ({
      ...group,
      languages: group.languages.filter((language) =>
        language.toLowerCase().includes(normalizedQuery),
      ),
    }))
    .filter((group) => group.languages.length > 0)

  const handleClearLanguageFilters = () => {
    setLanguageQuery('')
    setSelectedLanguageCategory('Todas')
  }

  return (
    <main className="blog-page">
      <header className="blog-header">
        <h1>Mi Blog en React</h1>
        <p>Ejemplo para principiantes con publicaciones, comentarios y páginas.</p>
      </header>

      <nav className="top-nav" aria-label="Navegación principal">
        <button
          className={currentPage === 'blog' ? 'active' : ''}
          onClick={() => setCurrentPage('blog')}
        >
          Inicio del blog
        </button>
        <button
          className={currentPage === 'languages' ? 'active' : ''}
          onClick={() => setCurrentPage('languages')}
        >
          Lenguajes de programación
        </button>
      </nav>

      {currentPage === 'languages' ? (
        <section className="post-card">
          <h2>Lenguajes de programación</h2>
          <p>
            No existe una lista finita de “todos” los lenguajes porque aparecen
            nuevos y hay muchos especializados. Aquí tienes una guía amplia de
            los más usados y conocidos por áreas.
          </p>

          <input
            className="language-search"
            type="text"
            placeholder="Buscar lenguaje (ej: python, java, rust...)"
            value={languageQuery}
            onChange={(event) => setLanguageQuery(event.target.value)}
          />

          <div className="category-filters" aria-label="Filtros por categoría">
            {languageCategories.map((category) => (
              <button
                key={category}
                className={selectedLanguageCategory === category ? 'active' : ''}
                onClick={() => setSelectedLanguageCategory(category)}
              >
                {category}
              </button>
            ))}
            <button className="clear-filters" onClick={handleClearLanguageFilters}>
              Limpiar filtros
            </button>
          </div>

          <div className="languages-grid">
            {filteredLanguageGroups.map((group) => (
              <article key={group.title} className="language-group">
                <h3>{group.title}</h3>
                <p>{group.description}</p>
                <ul>
                  {group.languages.map((language) => (
                    <li key={language}>{language}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          {filteredLanguageGroups.length === 0 && (
            <p className="empty-state">No se encontraron lenguajes con esa búsqueda.</p>
          )}
        </section>
      ) : (
        posts.map((post) => {
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
        })
      )}
    </main>
  )
}

export default App
