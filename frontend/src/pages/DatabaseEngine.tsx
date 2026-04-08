import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/api'
import { BackButton } from '../components/ui/BackButton'
import { ritualChime } from '../components/layout/TerminalAtmosphere'

export function DatabaseEngine() {
  const [query, setQuery] = useState('SELECT * FROM "Election" LIMIT 10;')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [tables, setTables] = useState<string[]>([])
  const [isTablesLoading, setIsTablesLoading] = useState(true)

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    setIsTablesLoading(true)
    try {
      const { tables } = await api.getTables()
      setTables(tables)
    } catch (err) {
      console.error('Failed to fetch tables', err)
    } finally {
      setIsTablesLoading(false)
    }
  }

  const handleExecute = async () => {
    ritualChime('click')
    setIsLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await api.executeSQL({ query })
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Execution failed')
    } finally {
      setIsLoading(false)
    }
  }

  const selectTable = (tableName: string) => {
    ritualChime('click')
    setQuery(`SELECT * FROM "${tableName}" LIMIT 10;`)
  }

  const renderTable = (data: any[]) => {
    if (!data.length) return <div className="text-ash text-sm p-4">Empty result set.</div>
    const keys = Object.keys(data[0])
    return (
      <div className="overflow-x-auto border border-white/10 rounded">
        <table className="w-full text-left text-xs text-white">
          <thead className="bg-white/5 border-b border-white/10 text-gold font-cinzel">
            <tr>
              {keys.map(k => <th key={k} className="px-4 py-3 uppercase tracking-tighter">{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                {keys.map(k => (
                  <td key={k} className="px-4 py-2 text-ash/80 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                    {String(row[k] === null ? 'NULL' : row[k])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-[1400px] mx-auto flex flex-col h-full">
      <BackButton fallback="/admin/dashboard" />
      
      <div className="mb-12">
        <h1 className="font-cinzel text-3xl tracking-[0.3em] text-gold uppercase mb-2">Vault Query Engine</h1>
        <p className="text-ash text-[10px] tracking-[0.2em] uppercase opacity-60">Direct Cryptosystem Interface // Admin Only</p>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1">
        {/* Left Sidebar: Table Explorer */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-void/40 backdrop-blur-xl border border-white/10 rounded-xl p-4 sticky top-32 h-fit">
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="font-cinzel text-xs tracking-widest text-gold uppercase">Schema Explorer</h3>
              <button 
                onClick={fetchTables} 
                className="text-ash hover:text-gold transition-colors text-[10px] uppercase font-cinzel tracking-widest"
                title="Refresh Schema"
              >
                Sync
              </button>
            </div>
            
            {isTablesLoading ? (
              <div className="space-y-2 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-8 bg-white/5 rounded-md" />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {tables.map(table => (
                  <button
                    key={table}
                    onClick={() => selectTable(table)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-gold/10 text-ash hover:text-white transition-all font-mono text-xs group flex justify-between items-center"
                  >
                    <span>{table}</span>
                    <span className="opacity-0 group-hover:opacity-100 text-gold text-[8px]">→</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Workspace */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="bg-void/40 backdrop-blur-xl border border-white/10 p-6 rounded-xl space-y-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono text-ash/40 uppercase tracking-widest">Query Buffer</span>
              <div className="flex gap-4">
                <button
                  onClick={handleExecute}
                  disabled={isLoading || !query}
                  className="bg-gold/80 hover:bg-gold text-void px-6 py-2 rounded-lg font-cinzel uppercase tracking-widest text-[10px] font-bold transition-all shadow-[0_4px_20px_rgba(255,179,0,0.2)] disabled:opacity-50"
                >
                  {isLoading ? 'Processing Ritual...' : 'Run Query'}
                </button>
                <button
                  onClick={() => { setQuery(''); setResult(null); setError(null); }}
                  className="bg-white/5 border border-white/10 text-ash/60 px-6 py-2 rounded-lg font-cinzel uppercase tracking-widest text-[10px] hover:text-white transition-all"
                >
                  Purge Buffer
                </button>
              </div>
            </div>

            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-lg p-6 font-mono text-sm text-gold focus:border-gold/30 outline-none h-56 transition-all resize-none shadow-inner"
              spellCheck={false}
              placeholder="ENTER SQL RITUAL..."
            />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-ember/5 border border-ember/20 p-6 rounded-xl text-ember font-mono text-[10px] leading-relaxed relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-ember/40" />
                <span className="font-cinzel text-xs text-ember block mb-2 tracking-widest">Ritual Error</span>
                {error}
              </motion.div>
            )}

            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-void/40 backdrop-blur-xl border border-white/10 p-6 rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-cinzel text-gold text-xs uppercase tracking-widest">Ritual Output</h3>
                  <span className="text-[9px] font-mono text-ash/30 uppercase">{Array.isArray(result) ? `${result.length} Records Manifested` : 'Operation Log'}</span>
                </div>
                
                {Array.isArray(result) ? renderTable(result) : (
                  <pre className="font-mono text-[11px] text-ash/80 overflow-x-auto p-4 bg-black/30 rounded-lg">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
