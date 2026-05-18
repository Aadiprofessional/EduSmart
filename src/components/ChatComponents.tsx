
import React from 'react';

// Placeholder components for missing dependencies in ChatPage.tsx

export const ProFeatureAlert: React.FC<any> = () => null;
export const ImageSkeleton: React.FC<any> = () => <div className="animate-pulse bg-gray-200 h-48 w-full rounded"></div>;
export const IntelligentImageGeneration: React.FC<any> = () => null;
export const IntelligentImageThinking: React.FC<any> = () => null;
export const ThinkingIndicator: React.FC<any> = () => <div className="text-xs text-gray-500 italic">Thinking...</div>;
export const ChartGenerationBox: React.FC<any> = () => <div className="p-4 border rounded">Chart Generation Placeholder</div>;
export const LinkCirclesButton: React.FC<any> = () => null;
export const LinkCitationsPanel: React.FC<any> = () => null;
export const FilePreviewModal: React.FC<any> = ({ isOpen, onClose, fileName }) => (
  isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-4 rounded shadow-lg">
        <h3 className="font-bold mb-2">Preview: {fileName}</h3>
        <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded">Close</button>
      </div>
    </div>
  ) : null
);
export const FileUploadPopup: React.FC<any> = ({ isOpen, onClose, onFileSelect }) => (
  isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg">
        <h3 className="font-bold mb-4">Upload File</h3>
        <input type="file" onChange={(e) => {
          if (e.target.files?.[0]) {
            onFileSelect({
              file: e.target.files[0],
              fileName: e.target.files[0].name,
              fileType: 'document', // Simplified
              size: e.target.files[0].size,
              url: URL.createObjectURL(e.target.files[0])
            }, 'document');
          }
        }} />
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">Cancel</button>
      </div>
    </div>
  ) : null
);
export const CodeBlock: React.FC<any> = ({ code, language }) => (
  <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto my-2">
    <code className={`language-${language}`}>{code}</code>
  </pre>
);
export const UserMessageAttachments: React.FC<any> = ({ attachments }) => (
  <div className="flex flex-wrap gap-2 mb-2">
    {attachments?.map((att: any, i: number) => (
      <div key={i} className="text-xs bg-gray-100 p-1 rounded border">
        📎 {att.fileName || 'Attachment'}
      </div>
    ))}
  </div>
);
export const BotMessageAttachments: React.FC<any> = ({ attachments }) => (
  <div className="flex flex-wrap gap-2 mb-2">
    {attachments?.map((att: any, i: number) => (
      <div key={i} className="text-xs bg-blue-50 p-1 rounded border border-blue-200">
        📎 {att.fileName || 'Attachment'}
      </div>
    ))}
  </div>
);
export const AIImageStrip: React.FC<any> = () => null;
export const ChargeModal: React.FC<any> = ({ isOpen, onClose, currentCoins = 0 }) => (
  isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-sm w-[calc(100%-2rem)]">
        <h3 className="font-bold mb-2">Not Enough Coins</h3>
        <p className="text-sm text-gray-600">You currently have {currentCoins} coins. Buy more coins to keep using AI tools.</p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">Close</button>
          <button
            onClick={() => { window.location.href = '/subscription'; }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Buy Coins
          </button>
        </div>
      </div>
    </div>
  ) : null
);

// AuthRequiredButton
export const AuthRequiredButton: React.FC<any> = ({ onClick, children, className, ...props }) => (
  <button onClick={onClick} className={className} {...props}>
    {children}
  </button>
);
