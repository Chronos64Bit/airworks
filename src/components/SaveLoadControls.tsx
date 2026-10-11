// ============================================
// AIRWORKS - Save/Load Controls Component
// ============================================

import React, { useState, useCallback, useEffect } from 'react';
import { SaveData, SAVE_FORMAT_VERSION } from '../core/types';

interface SaveLoadControlsProps {
  onSave: (name: string) => SaveData;
  onLoad: (saveData: SaveData) => void;
  onReset: () => void;
}

export const SaveLoadControls: React.FC<SaveLoadControlsProps> = ({
  onSave,
  onLoad,
  onReset,
}) => {
  const [saves, setSaves] = useState<{ name: string; data: SaveData; timestamp: string }[]>([]);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load saves from localStorage
  useEffect(() => {
    const savedSaves = localStorage.getItem('airworks_saves');
    if (savedSaves) {
      try {
        const parsed = JSON.parse(savedSaves);
        if (Array.isArray(parsed)) {
          setSaves(parsed);
        }
      } catch (e) {
        console.error('Failed to load saves:', e);
      }
    }
  }, []);

  // Save to localStorage
  const saveToLocalStorage = useCallback((saves: any[]) => {
    localStorage.setItem('airworks_saves', JSON.stringify(saves));
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    if (!saveName.trim()) {
      setLoadError('Please enter a name');
      return;
    }

    const saveData = onSave(saveName.trim());
    
    const newSave = {
      name: saveName.trim(),
      data: saveData,
      timestamp: new Date().toISOString(),
    };

    const newSaves = [...saves, newSave];
    setSaves(newSaves);
    saveToLocalStorage(newSaves);
    
    setSaveName('');
    setLoadError(null);
  }, [saveName, saves, onSave, saveToLocalStorage]);

  // Handle load
  const handleLoad = useCallback((save: { name: string; data: SaveData; timestamp: string }) => {
    try {
      // Validate save data
      if (save.data.version !== SAVE_FORMAT_VERSION) {
        setLoadError(`Incompatible save version: ${save.data.version}`);
        return;
      }
      
      onLoad(save.data);
      setShowLoadMenu(false);
      setLoadError(null);
    } catch (e) {
      setLoadError('Failed to load save');
      console.error('Load error:', e);
    }
  }, [onLoad]);

  // Handle delete save
  const handleDeleteSave = useCallback((index: number) => {
    const newSaves = saves.filter((_, i) => i !== index);
    setSaves(newSaves);
    saveToLocalStorage(newSaves);
  }, [saves, saveToLocalStorage]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (window.confirm('Are you sure you want to reset? All unsaved changes will be lost.')) {
      onReset();
    }
  }, [onReset]);

  return (
    <div
      style={{
        background: '#161B22',
        borderLeft: '1px solid #21262D',
        width: 250,
        height: '100%',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#E6EDF3',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        Files
      </div>

      {/* Save section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: 8,
          background: '#0D1117',
          borderRadius: 4,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: '#8B949E',
          }}
        >
          Save
        </div>
        
        <input
          type="text"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          placeholder="Enter save name..."
          style={{
            background: '#161B22',
            border: '1px solid #21262D',
            borderRadius: 4,
            padding: 6,
            color: '#E6EDF3',
            fontSize: 12,
            width: '100%',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave();
            }
          }}
        />
        
        <button
          onClick={handleSave}
          style={{
            background: '#5CB85C',
            border: 'none',
            borderRadius: 4,
            padding: 8,
            cursor: 'pointer',
            color: '#fff',
            fontSize: 12,
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#6BC963';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#5CB85C';
          }}
          disabled={!saveName.trim()}
        >
          Save
        </button>
        
        {loadError && (
          <div
            style={{
              fontSize: 10,
              color: '#F85149',
            }}
          >
            {loadError}
          </div>
        )}
      </div>

      {/* Load section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: 8,
          background: '#0D1117',
          borderRadius: 4,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: '#8B949E',
          }}
        >
          Load
        </div>
        
        <button
          onClick={() => setShowLoadMenu(!showLoadMenu)}
          style={{
            background: '#4A90D9',
            border: 'none',
            borderRadius: 4,
            padding: 8,
            cursor: 'pointer',
            color: '#fff',
            fontSize: 12,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#58A6FF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#4A90D9';
          }}
        >
          <span>Load Save</span>
          <span>{showLoadMenu ? '▲' : '▼'}</span>
        </button>
        
        {showLoadMenu && saves.length > 0 && (
          <div
            style={{
              marginTop: 4,
              maxHeight: 200,
              overflowY: 'auto',
              border: '1px solid #21262D',
              borderRadius: 4,
            }}
          >
            {saves.map((save, index) => (
              <div
                key={index}
                style={{
                  padding: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: index < saves.length - 1 ? '1px solid #21262D' : 'none',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    cursor: 'pointer',
                    fontSize: 11,
                    color: '#E6EDF3',
                  }}
                  onClick={() => handleLoad(save)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#58A6FF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#E6EDF3';
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{save.name}</div>
                  <div style={{ fontSize: 10, color: '#8B949E' }}>
                    {new Date(save.timestamp).toLocaleString()}
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSave(index);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#F85149',
                    fontSize: 10,
                    padding: 2,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#FF7B72';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#F85149';
                  }}
                  title="Delete save"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        {showLoadMenu && saves.length === 0 && (
          <div
            style={{
              marginTop: 4,
              padding: 8,
              fontSize: 10,
              color: '#8B949E',
              textAlign: 'center',
            }}
          >
            No saves found
          </div>
        )}
      </div>

      {/* Reset section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: 8,
          background: '#0D1117',
          borderRadius: 4,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: '#8B949E',
          }}
        >
          Danger Zone
        </div>
        
        <button
          onClick={handleReset}
          style={{
            background: '#D9534F',
            border: 'none',
            borderRadius: 4,
            padding: 8,
            cursor: 'pointer',
            color: '#fff',
            fontSize: 12,
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#E36259';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#D9534F';
          }}
        >
          Reset All
        </button>
      </div>

      {/* Stats */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 8,
          borderTop: '1px solid #21262D',
          fontSize: 10,
          color: '#8B949E',
          textAlign: 'center',
        }}
      >
        {saves.length} save{saves.length !== 1 ? 's' : ''} stored
      </div>
    </div>
  );
};

export default SaveLoadControls;
