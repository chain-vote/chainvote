import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { BackButton } from '../components/ui/BackButton'

export function DatabaseEngine() {
  const [query, setQuery] = useState('SELECT * FROM "Vote";')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleExecute = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await api.executeSQL(query)
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Execution failed')
    } finally {
      setIsLoading(false)
    }
  }

  const renderTable = (data: any[]) => {
    if (!data.length) return <div className="text-ash text-sm">Empty result set.</div>
    const keys = Object.keys(data[0])
    return (
      <div className="overflow-x-auto border border-white/10 rounded">
        <table className="w-full text-left text-sm text-white">
          <thead className="bg-white/5 border-b border-white/10 text-gold font-cinzel">
            <tr>
              {keys.map(k => <th key={k} className="px-4 py-2">{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                {keys.map(k => (
                  <td key={k} className="px-4 py-2 text-ash whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">{String(row[k] === null ? 'NULL' : row[k])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-6xl mx-auto">
      <BackButton fallback="/admin/dashboard" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="font-cinzel text-3xl tracking-widest text-gold uppercase mb-2">Vault Query Engine</h1>
          <p className="text-ash text-sm tracking-wide">Direct SQL Interface to the internal SQLite cryptosystem.</p>
        </div>

        <div className="bg-void/80 border border-white/10 p-4 rounded-lg space-y-4">
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded p-4 font-mono text-sm text-gold focus:border-gold/50 outline-none h-40"
            spellCheck={false}
          />
          <div className="flex gap-4">
            <button
              onClick={handleExecute}
              disabled={isLoading || !query}
              className="bg-gold text-void px-6 py-2 rounded font-cinzel uppercase tracking-widest text-xs font-bold hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Executing...' : 'Run Query'}
            </button>
            <button
              onClick={() => { setQuery(''); setResult(null); setError(null); }}
              className="bg-white/5 border border-white/10 text-ash px-6 py-2 rounded font-cinzel uppercase tracking-widest text-xs hover:bg-white/10 hover:text-white transition-all"
            >
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-[#ff0000]/10 border border-[#ff0000]/30 p-4 rounded text-[#ff0000] font-mono text-xs shadow-lg">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-void/80 border border-white/10 p-4 rounded-lg shadow-2xl">
            <h3 className="font-cinzel text-gold text-sm uppercase tracking-widest mb-4">Query Results</h3>
            {Array.isArray(result) ? renderTable(result) : (
              <pre className="font-mono text-xs text-ash overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
