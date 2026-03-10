import { useEffect, useState } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/api'
import type { Category } from '@/types'
import { Button } from '@/components/ui/button'

export default function CategoriesPage() {
  const [list, setList] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', color: '#6B7280', icon: '' })

  function load() {
    setLoading(true)
    getCategories()
      .then(setList)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', color: '#6B7280', icon: '' })
  }

  function openEdit(c: Category) {
    setEditing(c)
    setForm({ name: c.name, color: c.color, icon: c.icon })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editing) {
      updateCategory(editing.id, form).then(() => {
        setEditing(null)
        setForm({ name: '', color: '#6B7280', icon: '' })
        load()
      })
    } else {
      createCategory(form).then(() => {
        setForm({ name: '', color: '#6B7280', icon: '' })
        load()
      })
    }
  }

  function handleDelete(c: Category) {
    if (!window.confirm(`Excluir a categoria "${c.name}"?`)) return
    deleteCategory(c.id).then(load)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A1A2E]">Categorias</h1>
      <p className="mt-1 text-[#6B7280]">Gerencie suas categorias de receitas e despesas.</p>

      <form onSubmit={handleSubmit} className="mt-6 p-4 bg-white rounded-lg border flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-[#1A1A2E]">Nome</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 rounded-md border border-[#E5E7EB] px-3 py-2 text-sm w-48"
            placeholder="Ex: Alimentação"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1A1A2E]">Cor</label>
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            className="mt-1 h-9 w-14 rounded border border-[#E5E7EB] cursor-pointer"
          />
        </div>
        <Button type="submit">{editing ? 'Salvar' : 'Nova categoria'}</Button>
        {editing && (
          <Button type="button" variant="outline" onClick={openCreate}>
            Cancelar
          </Button>
        )}
      </form>

      {loading ? (
        <p className="mt-4 text-[#6B7280]">Carregando...</p>
      ) : list.length === 0 ? (
        <p className="mt-4 text-[#6B7280]">Nenhuma categoria. Crie uma acima.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {list.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border"
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: c.color }}
                />
                <span className="font-medium text-[#1A1A2E]">{c.name}</span>
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(c)}>
                  Excluir
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
