import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiBook, FiLink, FiCopy, FiCheck } from 'react-icons/fi';
import IconComponent from './IconComponent';

const CitationGenerator: React.FC = () => {
  const [sourceType, setSourceType] = useState('website');
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    year: '',
    url: '',
    publisher: '',
    journal: '',
    volume: '',
    pages: '',
    accessDate: new Date().toISOString().split('T')[0]
  });
  const [citationStyle, setCitationStyle] = useState('apa');
  const [generatedCitation, setGeneratedCitation] = useState('');
  const [copied, setCopied] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simplified citation generator (this would be more complex in a real app)
    let citation = '';
    
    if (citationStyle === 'apa') {
      if (sourceType === 'website') {
        citation = `${formData.author ? formData.author + '. ' : ''}(${formData.year || 'n.d.'}). ${formData.title}. Retrieved ${formData.accessDate} from ${formData.url}`;
      } else if (sourceType === 'book') {
        citation = `${formData.author ? formData.author + '. ' : ''}(${formData.year || 'n.d.'}). ${formData.title}. ${formData.publisher}.`;
      } else if (sourceType === 'journal') {
        citation = `${formData.author ? formData.author + '. ' : ''}(${formData.year || 'n.d.'}). ${formData.title}. ${formData.journal}, ${formData.volume}${formData.pages ? ', ' + formData.pages : ''}.`;
      }
    } else if (citationStyle === 'mla') {
      if (sourceType === 'website') {
        citation = `${formData.author ? formData.author + '. ' : ''}"${formData.title}." ${formData.year || 'n.d.'}, ${formData.url}. Accessed ${formData.accessDate}.`;
      } else if (sourceType === 'book') {
        citation = `${formData.author ? formData.author + '. ' : ''}${formData.title}. ${formData.publisher}, ${formData.year || 'n.d.'}.`;
      } else if (sourceType === 'journal') {
        citation = `${formData.author ? formData.author + '. ' : ''}"${formData.title}." ${formData.journal}, vol. ${formData.volume}, ${formData.year || 'n.d.'}, pp. ${formData.pages}.`;
      }
    }
    
    setGeneratedCitation(citation);
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCitation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-teal-700 to-teal-900 p-4 text-white">
        <h3 className="text-lg font-medium flex items-center">
          <IconComponent icon={FiBook} className="mr-2" /> AI Citation Generator
        </h3>
        <p className="text-sm text-teal-100">Get perfectly formatted citations for your research</p>
      </div>
      
      <div className="p-5">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Source Type
            </label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="website">Website</option>
              <option value="book">Book</option>
              <option value="journal">Journal Article</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Title of the work"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Author(s)
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Last name, First name"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Year
              </label>
              <input
                type="text"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Publication year"
              />
            </div>
            
            {sourceType === 'website' && (
              <>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    URL
                  </label>
                  <input
                    type="text"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Access Date
                  </label>
                  <input
                    type="date"
                    name="accessDate"
                    value={formData.accessDate}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </>
            )}
            
            {sourceType === 'book' && (
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Publisher
                </label>
                <input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Publisher name"
                />
              </div>
            )}
            
            {sourceType === 'journal' && (
              <>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Journal
                  </label>
                  <input
                    type="text"
                    name="journal"
                    value={formData.journal}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Journal name"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Volume
                  </label>
                  <input
                    type="text"
                    name="volume"
                    value={formData.volume}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Volume number"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Pages
                  </label>
                  <input
                    type="text"
                    name="pages"
                    value={formData.pages}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Page range (e.g., 123-145)"
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Citation Style
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setCitationStyle('apa')}
                className={`px-3 py-1 rounded-md ${
                  citationStyle === 'apa' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                APA
              </button>
              <button
                type="button"
                onClick={() => setCitationStyle('mla')}
                className={`px-3 py-1 rounded-md ${
                  citationStyle === 'mla' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                MLA
              </button>
            </div>
          </div>
          
          <motion.button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg text-white font-medium shadow-md hover:shadow-lg flex items-center justify-center"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <IconComponent icon={FiLink} className="mr-2" />
            Generate Citation
          </motion.button>
        </form>
        
        {generatedCitation && (
          <div className="mt-6">
            <h4 className="text-gray-700 font-medium mb-2">Generated Citation:</h4>
            <div className="relative">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-gray-700">{generatedCitation}</p>
              </div>
              <motion.button
                onClick={copyToClipboard}
                className="absolute top-3 right-3 p-2 text-gray-500 hover:text-teal-600 bg-white rounded-full shadow-sm"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {copied ? <IconComponent icon={FiCheck} /> : <IconComponent icon={FiCopy} />}
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CitationGenerator; 