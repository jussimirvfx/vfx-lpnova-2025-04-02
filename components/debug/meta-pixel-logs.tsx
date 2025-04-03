'use client'

import React, { useState, useEffect } from 'react'
import { logger, LogCategory, LogEntry, eventLogs } from '@/lib/utils/logger'

// Adicionado: Verificar explicitamente o ambiente Vercel também
const isProduction = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

interface MetaPixelLogsProps {
  maxEntries?: number
  filter?: LogCategory[]
  autoRefresh?: boolean
}

export default function MetaPixelLogs({ 
  maxEntries = 100,
  filter,
  autoRefresh = true
}: MetaPixelLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<LogCategory | 'ALL'>('ALL')
  
  // Estilos para o componente de debug
  const containerStyle = {
    position: 'fixed',
    bottom: isExpanded ? '0' : '-550px',
    left: '0',
    width: '100%',
    height: '600px',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: '12px',
    zIndex: 9999,
    transition: 'bottom 0.3s ease-in-out',
    display: 'flex',
    flexDirection: 'column',
    borderTop: '2px solid #444'
  } as React.CSSProperties

  const headerStyle = {
    padding: '8px 16px',
    backgroundColor: '#222',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #444'
  } as React.CSSProperties

  const bodyStyle = {
    padding: '8px',
    overflowY: 'auto',
    flexGrow: 1
  } as React.CSSProperties

  const toggleStyle = {
    position: 'absolute',
    top: '-30px',
    right: '20px',
    backgroundColor: '#222',
    color: '#fff',
    border: '1px solid #444',
    padding: '5px 10px',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    cursor: 'pointer'
  } as React.CSSProperties

  const entryStyle = {
    padding: '6px 8px',
    marginBottom: '4px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  } as React.CSSProperties

  const categoryFilterStyle = {
    display: 'flex',
    gap: '8px',
    marginLeft: '16px',
    flexWrap: 'wrap'
  } as React.CSSProperties

  const pillStyle = (active: boolean) => ({
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    backgroundColor: active ? '#187eff' : '#333',
    cursor: 'pointer',
    border: 'none',
    color: '#fff'
  }) as React.CSSProperties

  const levelColors = {
    debug: '#888',
    info: '#187eff',
    warn: '#ff9800',
    error: '#f44336'
  }

  // Função para filtrar os logs
  const getFilteredLogs = () => {
    let filtered = [...eventLogs]
    
    // Aplicar filtro de categoria
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(log => log.category === selectedCategory)
    }
    
    // Aplicar filtro de quantidade
    return filtered.slice(0, maxEntries)
  }

  // Atualizar logs periodicamente
  useEffect(() => {
    if (!autoRefresh) return
    
    const intervalId = setInterval(() => {
      setLogs(getFilteredLogs())
    }, 500)
    
    return () => clearInterval(intervalId)
  }, [autoRefresh, maxEntries, selectedCategory])

  // Forçar atualização quando os filtros mudarem
  useEffect(() => {
    setLogs(getFilteredLogs())
  }, [selectedCategory])

  // Formatar dados JSON para visualização, ocultando chaves sensíveis em produção
  const formatData = (data: any): string => {
    if (!data) return ''
    try {
      // Em produção, ou se não for um objeto, apenas retorne um placeholder
      if (isProduction || typeof data !== 'object' || data === null) {
         // Não mostrar dados detalhados em produção
         return isProduction ? '[Data hidden in production]' : String(data); 
      }

      // Clonar o objeto para não modificar o original
      const dataClone = JSON.parse(JSON.stringify(data)); 
      
      // Chaves a serem ocultadas (adicione outras se necessário)
      const sensitiveKeys = ['access_token', 'apiKey', 'secret', 'token', 'client_secret'];

      // Função recursiva para percorrer e ocultar
      const redact = (obj: any) => {
        if (typeof obj !== 'object' || obj === null) return;
        Object.keys(obj).forEach(key => {
          if (sensitiveKeys.includes(key.toLowerCase())) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object') {
            redact(obj[key]); // Recursivamente para objetos aninhados
          }
        });
      };

      redact(dataClone); // Ocultar chaves sensíveis

      return JSON.stringify(dataClone, null, 2)
    } catch (e) {
      // Em caso de erro na serialização, retorne um placeholder seguro
      console.error("Error formatting log data:", e);
      return isProduction ? '[Data hidden in production]' : '[Error formatting data]';
    }
  }

  // Função para limpar logs
  const clearLogs = () => {
    logger.clearLogs()
    setLogs([])
  }

  // Só renderizar em desenvolvimento
  // Usar a variável isProduction que checa NODE_ENV e VERCEL_ENV
  if (isProduction) {
    // Log de aviso caso tente renderizar em produção (ajuda a debugar config errada)
    if (typeof window !== 'undefined') {
        console.warn("MetaPixelLogs component attempted to render in a production environment. Check NODE_ENV/VERCEL_ENV settings.");
    }
    return null
  }

  return (
    <div style={containerStyle}>
      <button 
        style={toggleStyle}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '↓ Esconder Logs' : '↑ Mostrar Logs'}
      </button>
      
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '14px' }}>Meta Pixel Logs ({logs.length})</h2>
          
          <div style={categoryFilterStyle}>
            <button 
              style={pillStyle(selectedCategory === 'ALL')}
              onClick={() => setSelectedCategory('ALL')}
            >
              Todos
            </button>
            {Object.values(LogCategory).map(category => (
              <button
                key={category}
                style={pillStyle(selectedCategory === category)}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <button 
            onClick={clearLogs}
            style={{
              backgroundColor: '#444',
              border: 'none',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Limpar Logs
          </button>
        </div>
      </div>
      
      <div style={bodyStyle}>
        {logs.length === 0 ? (
          <div style={{ padding: '16px', color: '#888', textAlign: 'center' }}>
            Nenhum log encontrado. Tente recarregar a página ou mudar o filtro.
          </div>
        ) : (
          logs.map((log, index) => (
            <div 
              key={`${log.timestamp}-${index}`}
              style={{
                ...entryStyle,
                backgroundColor: log.level === 'error' ? 'rgba(244, 67, 54, 0.1)' : 
                                 log.level === 'warn' ? 'rgba(255, 152, 0, 0.1)' : 
                                 'rgba(34, 34, 34, 0.8)',
                borderLeft: `4px solid ${levelColors[log.level] || '#888'}`
              }}
            >
              <div>
                <span style={{ color: '#888' }}>[{log.formattedTime.split('T')[1].split('.')[0]}]</span>{' '}
                <span style={{ color: levelColors[log.level] || '#888' }}>[{log.level.toUpperCase()}]</span>{' '}
                <span style={{ color: '#aaa' }}>[{log.category}]</span>{' '}
                <span>{log.message}</span>
              </div>
              
              {log.data && (
                <pre style={{ 
                  margin: '4px 0 0', 
                  padding: '4px 8px', 
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  color: '#bbb'
                }}>
                  {formatData(log.data)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
} 