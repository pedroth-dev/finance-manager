import { useEffect, useState } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/api'
import type { Category } from '@/types'
import EmojiPicker from '@/components/EmojiPicker'
import ConfirmDialog from '@/components/ConfirmDialog'

const COLOR_SWATCHES = [
  '#4d9fff', '#00e5a0', '#ff5e6c', '#f5c842',
  '#a78bfa', '#fb923c', '#34d399', '#f472b6',
]

export default function CategoriesPage() {
  const [list, setList] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Category | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [form, setForm] = useState({ name: '', color: '#4d9fff', icon: '🍔' })

  function load() {
    setLoading(true)
    getCategories()
      .then(setList)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function resetForm() {
    setEditing(null)
    setForm({ name: '', color: '#4d9fff', icon: '🍔' })
  }

  function openCreate() {
    resetForm()
    setModalOpen(true)
  }

  function openEdit(c: Category) {
    setEditing(c)
    setForm({ name: c.name, color: c.color, icon: c.icon || '🍔' })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    resetForm()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    const promise = editing
      ? updateCategory(editing.id, form)
      : createCategory(form)

    promise.then(() => { closeModal(); load() })
  }

  function openDeleteConfirm(c: Category) {
    setCategoryToDelete(c)
  }

  function closeDeleteConfirm() {
    if (!deleteLoading) setCategoryToDelete(null)
  }

  function confirmDelete() {
    if (!categoryToDelete) return
    setDeleteLoading(true)
    deleteCategory(categoryToDelete.id)
      .then(() => {
        setCategoryToDelete(null)
        load()
      })
      .catch((err) => window.alert(err instanceof Error ? err.message : 'Erro ao excluir.'))
      .finally(() => setDeleteLoading(false))
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Categorias ativas · {list.length}</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-[var(--green)] text-black border-none rounded-lg px-4 py-2 text-[13px] font-semibold cursor-pointer transition-[opacity,transform] duration-75 hover:opacity-90 hover:-translate-y-px active:translate-y-0"
          >
            + Nova categoria
          </button>
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[var(--green)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <p className="text-sm text-[var(--text3)] py-16 text-center">Nenhuma categoria criada.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
            {list.map((c) => (
              <div
                key={c.id}
                className="group relative bg-[var(--surface2)] border border-[var(--border)] rounded-[var(--radius)] p-5 overflow-hidden cursor-pointer transition-[border-color,transform] duration-100 hover:border-[var(--border2)] hover:-translate-y-0.5"
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: c.color }} />

                {/* Header: icon + actions */}
                <div className="flex items-center justify-between mb-3.5">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${c.color}1a` }}
                  >
                    {c.icon || '📁'}
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-75">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(c) }}
                      className="text-[11px] px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface3)] text-[var(--text2)] hover:text-foreground hover:border-[var(--border2)] transition-colors duration-75"
                    >
                      Editar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openDeleteConfirm(c) }}
                      className="text-[11px] px-2.5 py-1 rounded-md border border-[var(--red)]/20 text-[var(--red)] hover:bg-[var(--red)]/10 transition-colors duration-75"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                {/* Name */}
                <p className="text-[15px] font-semibold text-foreground mb-1">{c.name}</p>

                {/* Color indicator */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-xs font-mono text-[var(--text3)]">{c.color}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-[var(--surface)] border border-[var(--border2)] rounded-[var(--radius)] p-7 w-[480px] max-w-full animate-fade-up">
            <h2 className="text-base font-semibold text-foreground mb-1.5">
              {editing ? 'Editar categoria' : 'Nova categoria'}
            </h2>
            <p className="text-[13px] text-[var(--text3)] mb-6">
              {editing ? 'Altere os dados da categoria' : 'Crie uma categoria para organizar suas transações'}
            </p>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-5">
                {/* Name + Emoji */}
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)] mb-1.5">
                    Nome da categoria
                  </label>
                  <div className="flex gap-2">
                    <EmojiPicker value={form.icon} onChange={(emoji) => setForm((f) => ({ ...f, icon: emoji }))} />
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface3)] px-3 py-2.5 text-[13px] text-foreground placeholder:text-[var(--text3)] focus:border-[var(--green)] focus:outline-none transition-colors"
                      placeholder="Ex: Alimentação"
                      required
                    />
                  </div>
                </div>

                {/* Color swatches */}
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text3)] mb-2">
                    Cor
                  </label>
                  <div className="flex items-center gap-2">
                    {COLOR_SWATCHES.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, color }))}
                        className="w-7 h-7 rounded-lg cursor-pointer transition-transform duration-75 hover:scale-110 shrink-0"
                        style={{
                          backgroundColor: color,
                          border: form.color === color ? '2px solid white' : '2px solid transparent',
                          transform: form.color === color ? 'scale(1.1)' : undefined,
                        }}
                      />
                    ))}
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                      className="w-7 h-7 rounded-lg cursor-pointer border-none bg-transparent p-0"
                      title="Cor personalizada"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex items-center gap-1.5 bg-[var(--surface2)] text-[var(--text2)] border border-[var(--border)] rounded-lg px-4 py-2 text-[13px] font-medium hover:border-[var(--border2)] hover:text-foreground transition-colors duration-75 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-[var(--green)] text-black border-none rounded-lg px-4 py-2 text-[13px] font-semibold cursor-pointer transition-[opacity,transform] duration-75 hover:opacity-90"
                >
                  {editing ? 'Salvar' : 'Criar categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={categoryToDelete !== null}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDelete}
        title="Excluir categoria"
        message={categoryToDelete ? `Tem certeza que deseja excluir a categoria "${categoryToDelete.name}"? Esta ação não pode ser desfeita.` : ''}
        confirmLabel="Excluir"
        isLoading={deleteLoading}
      />
    </>
  )
}
