'use client';

import { useState } from 'react';

type Note = {
  id: string;
  content: string;
  url_pattern: string;
  created_at: string;
  // include other necessary fields based on the schema
};

export default function WeaveUI({ initialNotes }: { initialNotes: Note[] }) {
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [prompt, setPrompt] = useState('');

  const handleNoteToggle = (noteId: string) => {
    setSelectedNoteIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const handleGenerate = () => {
    console.log('--- Weaver Generation Initiated ---');
    console.log('Selected Note IDs:', Array.from(selectedNoteIds));
    console.log('Prompt:', prompt);
    console.log('-----------------------------------');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Pane: Notes List */}
      <div className="w-full lg:w-1/2 flex flex-col h-[calc(100vh-200px)]">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Select Context</h2>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex-1 overflow-y-auto p-4 space-y-3">
          {initialNotes && initialNotes.length > 0 ? (
            initialNotes.map((note) => (
              <label 
                key={note.id} 
                className={`block border rounded-md p-4 cursor-pointer transition-colors ${
                  selectedNoteIds.has(note.id) 
                    ? 'border-blue-500 bg-blue-50/50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      checked={selectedNoteIds.has(note.id)}
                      onChange={() => handleNoteToggle(note.id)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 truncate max-w-[200px]">
                        {note.url_pattern || 'No URL'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                      {note.content}
                    </p>
                  </div>
                </div>
              </label>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No cues found.
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Generator */}
      <div className="w-full lg:w-1/2 flex flex-col h-[calc(100vh-200px)]">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Weave Ideas</h2>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col h-full">
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            どのようなアイデアを作りますか？
          </label>
          <textarea
            id="prompt"
            rows={4}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border mb-4 resize-none"
            placeholder="例：これらのメモの内容を統合して、新しいブログ記事の構成案を作って！"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          
          <button
            onClick={handleGenerate}
            disabled={selectedNoteIds.size === 0 || !prompt.trim()}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mb-6"
          >
            ✨ 錬成する（Generate）
          </button>

          {/* Results Area (Mock) */}
          <div className="flex-1 bg-gray-50 rounded-md border border-gray-100 p-4 overflow-y-auto">
             <p className="text-sm text-gray-500 text-center mt-8">
                生成結果がここに表示されます。
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
