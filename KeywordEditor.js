// components/KeywordEditor.js
// KEYWORD EDITOR COMPONENT FOR LEARNING

'use client';

import { useState } from 'react';
import { X, Plus, Save, AlertCircle } from 'lucide-react';

export default function KeywordEditor({ 
  analysisId, 
  itemType, 
  brand, 
  initialKeywords = [],
  onSave 
}) {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [newKeyword, setNewKeyword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const removeKeyword = (index) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const saveKeywords = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          itemType,
          brand,
          originalKeywords: initialKeywords,
          correctedKeywords: keywords
        })
      });
      
      if (response.ok) {
        setMessage('Keywords updated! AI is learning from your changes.');
        if (onSave) onSave(keywords);
      } else {
        setMessage('Failed to save keywords');
      }
    } catch (error) {
      setMessage('Error saving keywords');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(keywords) !== JSON.stringify(initialKeywords);

  return (
    <div className="bg-white rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">eBay Keywords</h3>
        {hasChanges && (
          <span className="text-xs text-orange-600 flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            Unsaved changes
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {keywords.map((keyword, index) => (
          <span
            key={index}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
          >
            {keyword}
            <button
              onClick={() => removeKeyword(index)}
              className="ml-2 hover:text-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
          placeholder="Add keyword..."
          className="flex-1 px-3 py-1 border rounded-lg text-sm"
        />
        <button
          onClick={addKeyword}
          className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      {hasChanges && (
        <button
          onClick={saveKeywords}
          disabled={saving}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save & Teach AI'}
        </button>
      )}
      
      {message && (
        <p className="mt-2 text-sm text-green-600">{message}</p>
      )}
      
      <p className="text-xs text-gray-500 mt-3">
        When you edit keywords, the AI learns what works best for {brand} {itemType} items
      </p>
    </div>
  );
}