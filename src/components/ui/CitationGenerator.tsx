import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineBook, AiOutlineGlobal, AiOutlineFileText, AiOutlineUser, AiOutlineCalendar, AiOutlineLink, AiOutlineCopy, AiOutlineRobot, AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FiBookOpen, FiGlobe, FiFile, FiUser, FiCalendar, FiLink, FiCopy, FiPlus, FiTrash2, FiDownload, FiUpload, FiEdit3 } from 'react-icons/fi';
import IconComponent from './IconComponent';

interface Citation {
  id: string;
  type: 'book' | 'website' | 'journal' | 'newspaper' | 'video' | 'podcast' | 'thesis' | 'conference';
  style: 'APA' | 'MLA' | 'Chicago' | 'Harvard';
  title: string;
  author: string;
  year: string;
  publisher?: string;
  url?: string;
  accessDate?: string;
  pages?: string;
  volume?: string;
  issue?: string;
  doi?: string;
  location?: string;
  formattedCitation: string;
  createdAt: Date;
}

interface CitationGeneratorProps {
  className?: string;
}

// Add interface for citation data from API
interface CitationData {
  title?: string;
  author?: string;
  year?: string;
  publisher?: string;
  type?: string;
  [key: string]: any;
}

const CitationGenerator: React.FC<CitationGeneratorProps> = ({ className = '' }) => {
  const [citations, setCitations] = useState<Citation[]>([]);
  const [currentCitation, setCurrentCitation] = useState<Partial<Citation>>({
    type: 'book',
    style: 'APA',
    title: '',
    author: '',
    year: '',
    publisher: '',
    url: '',
    accessDate: '',
    pages: '',
    volume: '',
    issue: '',
    doi: '',
    location: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'ai' | 'upload'>('manual');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const citationTypes = [
    { value: 'book', label: 'Book', icon: FiBookOpen },
    { value: 'website', label: 'Website', icon: FiGlobe },
    { value: 'journal', label: 'Journal Article', icon: FiFile },
    { value: 'newspaper', label: 'Newspaper', icon: FiFile },
    { value: 'video', label: 'Video', icon: FiFile },
    { value: 'podcast', label: 'Podcast', icon: FiFile },
    { value: 'thesis', label: 'Thesis', icon: FiFile },
    { value: 'conference', label: 'Conference Paper', icon: FiFile }
  ];

  const citationStyles = [
    { value: 'APA', label: 'APA 7th Edition' },
    { value: 'MLA', label: 'MLA 9th Edition' },
    { value: 'Chicago', label: 'Chicago 17th Edition' },
    { value: 'Harvard', label: 'Harvard Style' }
  ];

  // Format citation based on style and type
  const formatCitation = (citation: Partial<Citation>): string => {
    const { type, style, title, author, year, publisher, url, accessDate, pages, volume, issue, doi, location } = citation;
    
    switch (style) {
      case 'APA':
        return formatAPACitation(citation);
      case 'MLA':
        return formatMLACitation(citation);
      case 'Chicago':
        return formatChicagoCitation(citation);
      case 'Harvard':
        return formatHarvardCitation(citation);
      default:
        return formatAPACitation(citation);
    }
  };

  const formatAPACitation = (citation: Partial<Citation>): string => {
    const { type, title, author, year, publisher, url, accessDate, pages, volume, issue, doi, location } = citation;
    
    switch (type) {
      case 'book':
        return `${author} (${year}). *${title}*. ${publisher}.${doi ? ` https://doi.org/${doi}` : ''}`;
      case 'website':
        return `${author} (${year}). ${title}. *Website Name*. ${url}${accessDate ? ` (accessed ${accessDate})` : ''}`;
      case 'journal':
        return `${author} (${year}). ${title}. *Journal Name*, *${volume}*(${issue}), ${pages}.${doi ? ` https://doi.org/${doi}` : ''}`;
      default:
        return `${author} (${year}). *${title}*. ${publisher}.`;
    }
  };

  const formatMLACitation = (citation: Partial<Citation>): string => {
    const { type, title, author, year, publisher, url, accessDate, pages, volume, issue, location } = citation;
    
    switch (type) {
      case 'book':
        return `${author}. *${title}*. ${publisher}, ${year}.`;
      case 'website':
        return `${author}. "${title}." *Website Name*, ${year}, ${url}. Accessed ${accessDate}.`;
      case 'journal':
        return `${author}. "${title}." *Journal Name*, vol. ${volume}, no. ${issue}, ${year}, pp. ${pages}.`;
      default:
        return `${author}. *${title}*. ${publisher}, ${year}.`;
    }
  };

  const formatChicagoCitation = (citation: Partial<Citation>): string => {
    const { type, title, author, year, publisher, url, accessDate, pages, volume, issue, location } = citation;
    
    switch (type) {
      case 'book':
        return `${author}. *${title}*. ${location}: ${publisher}, ${year}.`;
      case 'website':
        return `${author}. "${title}." Website Name. Accessed ${accessDate}. ${url}.`;
      case 'journal':
        return `${author}. "${title}." *Journal Name* ${volume}, no. ${issue} (${year}): ${pages}.`;
      default:
        return `${author}. *${title}*. ${location}: ${publisher}, ${year}.`;
    }
  };

  const formatHarvardCitation = (citation: Partial<Citation>): string => {
    const { type, title, author, year, publisher, url, accessDate, pages, volume, issue, location } = citation;
    
    switch (type) {
      case 'book':
        return `${author} ${year}, *${title}*, ${publisher}, ${location}.`;
      case 'website':
        return `${author} ${year}, *${title}*, viewed ${accessDate}, <${url}>.`;
      case 'journal':
        return `${author} ${year}, '${title}', *Journal Name*, vol. ${volume}, no. ${issue}, pp. ${pages}.`;
      default:
        return `${author} ${year}, *${title}*, ${publisher}, ${location}.`;
    }
  };

  // Generate citation from URL using AI
  const generateCitationFromURL = async () => {
    if (!urlInput.trim()) {
      alert('Please enter a URL');
      return;
    }

    try {
      setIsGenerating(true);

      const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "qwen-vl-max",
          messages: [
            {
              role: "system",
              content: [
                {
                  type: "text", 
                  text: "You are an AI assistant that extracts citation information from URLs. Analyze the provided URL and extract relevant citation information including title, author, publication date, publisher, and other relevant details. Format your response as a JSON object with fields: title, author, year, publisher, type (book/website/journal/etc), and any other relevant citation details."
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Please extract citation information from this URL: ${urlInput}. Provide the information in JSON format with fields like title, author, year, publisher, type, etc.`
                }
              ]
            }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Try to parse the JSON response
      let citationData: CitationData;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          citationData = JSON.parse(jsonMatch[0]);
        } else {
          citationData = JSON.parse(content);
        }
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        throw new Error('Failed to parse citation data');
      }

      // Update current citation with extracted data
      setCurrentCitation(prev => ({
        ...prev,
        title: citationData.title || '',
        author: citationData.author || '',
        year: citationData.year || new Date().getFullYear().toString(),
        publisher: citationData.publisher || '',
        type: citationData.type as Citation['type'] || 'website',
        url: urlInput,
        accessDate: new Date().toLocaleDateString()
      }));

      setUrlInput('');
      alert('Citation information extracted successfully!');
    } catch (error) {
      console.error('Error generating citation from URL:', error);
      alert('Failed to extract citation information. Please try again or enter manually.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle file upload for citation generation
  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      
      // For demonstration, we'll generate a citation based on the file name and type
      const fileName = file.name;
      const fileType = file.type;
      
      let citationType: Citation['type'] = 'book';
      if (fileType.includes('pdf')) citationType = 'journal';
      if (fileType.includes('image')) citationType = 'website';
      
      setCurrentCitation(prev => ({
        ...prev,
        title: fileName.replace(/\.[^/.]+$/, ''), // Remove file extension
        type: citationType,
        year: new Date().getFullYear().toString(),
        accessDate: new Date().toLocaleDateString()
      }));

      alert('File uploaded successfully! Please complete the citation details.');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      handleFileUpload(file);
    }
  };

  const addCitation = () => {
    if (!currentCitation.title || !currentCitation.author) {
      alert('Please fill in at least the title and author fields');
      return;
    }

    const formattedCitation = formatCitation(currentCitation);
    const newCitation: Citation = {
      id: Date.now().toString(),
      type: currentCitation.type as Citation['type'],
      style: currentCitation.style as Citation['style'],
      title: currentCitation.title,
      author: currentCitation.author,
      year: currentCitation.year || new Date().getFullYear().toString(),
      publisher: currentCitation.publisher,
      url: currentCitation.url,
      accessDate: currentCitation.accessDate,
      pages: currentCitation.pages,
      volume: currentCitation.volume,
      issue: currentCitation.issue,
      doi: currentCitation.doi,
      location: currentCitation.location,
      formattedCitation,
      createdAt: new Date()
    };

    setCitations(prev => [newCitation, ...prev]);
    
    // Reset form
    setCurrentCitation({
      type: 'book',
      style: 'APA',
      title: '',
      author: '',
      year: '',
      publisher: '',
      url: '',
      accessDate: '',
      pages: '',
      volume: '',
      issue: '',
      doi: '',
      location: ''
    });
  };

  const deleteCitation = (id: string) => {
    setCitations(prev => prev.filter(citation => citation.id !== id));
  };

  const copyCitation = (citation: string) => {
    navigator.clipboard.writeText(citation);
    alert('Citation copied to clipboard!');
  };

  const copyAllCitations = () => {
    const allCitations = citations.map(c => c.formattedCitation).join('\n\n');
    navigator.clipboard.writeText(allCitations);
    alert('All citations copied to clipboard!');
  };

  const exportCitations = () => {
    const citationsText = citations.map(c => c.formattedCitation).join('\n\n');
    const blob = new Blob([citationsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'citations.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`w-full max-w-6xl mx-auto p-6 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-blue-800 backdrop-blur-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <IconComponent icon={FiBookOpen} className="text-2xl text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-cyan-400">Citation Generator</h2>
                <p className="text-slate-300">Generate properly formatted citations in multiple styles</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyAllCitations}
                disabled={citations.length === 0}
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 border border-white/10"
              >
                <IconComponent icon={FiCopy} className="text-sm" />
                <span className="text-sm">Copy All</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportCitations}
                disabled={citations.length === 0}
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 border border-white/10"
              >
                <IconComponent icon={FiDownload} className="text-sm" />
                <span className="text-sm">Export</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-white/10 bg-slate-700/30 backdrop-blur-sm">
          <div className="flex">
            {[
              { id: 'manual', label: 'Manual Entry', icon: FiEdit3 },
              { id: 'ai', label: 'AI Generator', icon: AiOutlineRobot },
              { id: 'upload', label: 'File Upload', icon: FiUpload }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 border-b-2 ${
                  activeTab === tab.id
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-600/30'
                }`}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
              >
                <IconComponent icon={tab.icon} className="text-lg" />
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Manual Entry Tab */}
          {activeTab === 'manual' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Citation Type and Style Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Citation Type</label>
                  <select
                    value={currentCitation.type}
                    onChange={(e) => setCurrentCitation(prev => ({ ...prev, type: e.target.value as Citation['type'] }))}
                    className="w-full p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    {citationTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Citation Style</label>
                  <select
                    value={currentCitation.style}
                    onChange={(e) => setCurrentCitation(prev => ({ ...prev, style: e.target.value as Citation['style'] }))}
                    className="w-full p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    {citationStyles.map((style) => (
                      <option key={style.value} value={style.value}>{style.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
                  <input
                    type="text"
                    value={currentCitation.title}
                    onChange={(e) => setCurrentCitation(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Enter title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Author *</label>
                  <input
                    type="text"
                    value={currentCitation.author}
                    onChange={(e) => setCurrentCitation(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Enter author name"
                  />
                </div>
              </div>

              {/* Additional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
                  <input
                    type="text"
                    value={currentCitation.year}
                    onChange={(e) => setCurrentCitation(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Publication year"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Publisher</label>
                  <input
                    type="text"
                    value={currentCitation.publisher}
                    onChange={(e) => setCurrentCitation(prev => ({ ...prev, publisher: e.target.value }))}
                    className="w-full p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Publisher name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                  <input
                    type="text"
                    value={currentCitation.location}
                    onChange={(e) => setCurrentCitation(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Publication location"
                  />
                </div>
              </div>

              {/* URL and Access Date */}
              {(currentCitation.type === 'website' || currentCitation.url) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">URL</label>
                    <input
                      type="url"
                      value={currentCitation.url}
                      onChange={(e) => setCurrentCitation(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Access Date</label>
                    <input
                      type="date"
                      value={currentCitation.accessDate}
                      onChange={(e) => setCurrentCitation(prev => ({ ...prev, accessDate: e.target.value }))}
                      className="w-full p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              {/* Journal-specific fields */}
              {currentCitation.type === 'journal' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Volume</label>
                    <input
                      type="text"
                      value={currentCitation.volume}
                      onChange={(e) => setCurrentCitation(prev => ({ ...prev, volume: e.target.value }))}
                      className="w-full p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="Volume number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Issue</label>
                    <input
                      type="text"
                      value={currentCitation.issue}
                      onChange={(e) => setCurrentCitation(prev => ({ ...prev, issue: e.target.value }))}
                      className="w-full p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="Issue number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Pages</label>
                    <input
                      type="text"
                      value={currentCitation.pages}
                      onChange={(e) => setCurrentCitation(prev => ({ ...prev, pages: e.target.value }))}
                      className="w-full p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="Page range"
                    />
                  </div>
                </div>
              )}

              {/* DOI */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">DOI (Digital Object Identifier)</label>
                <input
                  type="text"
                  value={currentCitation.doi}
                  onChange={(e) => setCurrentCitation(prev => ({ ...prev, doi: e.target.value }))}
                  className="w-full p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="10.1000/182"
                />
              </div>

              {/* Add Citation Button */}
              <motion.div className="flex justify-center">
                <motion.button
                  onClick={addCitation}
                  className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center justify-center space-x-2 border border-cyan-500/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <IconComponent icon={FiPlus} className="text-lg" />
                  <span>Add Citation</span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* AI Generator Tab */}
          {activeTab === 'ai' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold text-cyan-400 mb-2">AI Citation Generator</h3>
                <p className="text-slate-300">Enter a URL and let AI extract citation information automatically</p>
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Website URL</label>
                    <div className="flex space-x-3">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="flex-1 p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="https://example.com/article"
                      />
                      <motion.button
                        onClick={generateCitationFromURL}
                        disabled={isGenerating || !urlInput.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed border border-teal-500/30"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isGenerating ? (
                          <IconComponent icon={AiOutlineLoading3Quarters} className="text-lg animate-spin" />
                        ) : (
                          <IconComponent icon={AiOutlineRobot} className="text-lg" />
                        )}
                        <span>{isGenerating ? 'Analyzing...' : 'Generate'}</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Citation Type and Style for AI */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Citation Style</label>
                      <select
                        value={currentCitation.style}
                        onChange={(e) => setCurrentCitation(prev => ({ ...prev, style: e.target.value as Citation['style'] }))}
                        className="w-full p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      >
                        {citationStyles.map((style) => (
                          <option key={style.value} value={style.value}>{style.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Preview extracted information */}
                  {(currentCitation.title || currentCitation.author) && (
                    <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                      <h4 className="text-lg font-semibold text-cyan-400 mb-3">Extracted Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Title:</span>
                          <p className="text-slate-300 font-medium">{currentCitation.title || 'Not found'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Author:</span>
                          <p className="text-slate-300 font-medium">{currentCitation.author || 'Not found'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Year:</span>
                          <p className="text-slate-300 font-medium">{currentCitation.year || 'Not found'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Publisher:</span>
                          <p className="text-slate-300 font-medium">{currentCitation.publisher || 'Not found'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add Citation Button for AI */}
                  {(currentCitation.title && currentCitation.author) && (
                    <motion.button
                      onClick={addCitation}
                      className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center justify-center space-x-2 border border-cyan-500/30"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <IconComponent icon={FiPlus} className="text-lg" />
                      <span>Add Citation</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* File Upload Tab */}
          {activeTab === 'upload' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold text-cyan-400 mb-2">Upload Document</h3>
                <p className="text-slate-300">Upload a PDF or document to extract citation information</p>
              </div>

              <div className="max-w-2xl mx-auto">
                <div 
                  className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-cyan-500/50 cursor-pointer transition-colors bg-slate-600/20 backdrop-blur-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                  />
                  
                  <motion.button
                    className="flex flex-col items-center justify-center space-y-4 w-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isUploading ? (
                      <IconComponent icon={AiOutlineLoading3Quarters} className="text-xl animate-spin text-cyan-400" />
                    ) : (
                      <IconComponent icon={FiUpload} className="text-xl text-cyan-400" />
                    )}
                    <span className="text-lg text-slate-300">{isUploading ? 'Uploading...' : 'Choose File'}</span>
                    <span className="text-sm text-slate-400">Supports PDF, DOC, DOCX files</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Citations List */}
        {citations.length > 0 && (
          <div className="border-t border-white/10 bg-slate-700/20 backdrop-blur-sm p-6">
            <h3 className="text-xl font-semibold text-cyan-400 mb-4">Generated Citations ({citations.length})</h3>
            <div className="space-y-4">
              {citations.map((citation) => (
                <motion.div
                  key={citation.id}
                  className="bg-slate-600/30 backdrop-blur-sm rounded-lg p-4 border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs font-medium border border-cyan-500/30">
                          {citation.style}
                        </span>
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium border border-blue-500/30">
                          {citation.type}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{citation.formattedCitation}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        Created: {citation.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <motion.button
                        onClick={() => copyCitation(citation.formattedCitation)}
                        className="p-2 bg-slate-600/50 hover:bg-slate-500/50 rounded text-slate-300 transition-colors border border-white/10"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Copy citation"
                      >
                        <IconComponent icon={FiCopy} className="text-sm" />
                      </motion.button>
                      <motion.button
                        onClick={() => deleteCitation(citation.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 transition-colors border border-red-500/30"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Delete citation"
                      >
                        <IconComponent icon={FiTrash2} className="text-sm" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CitationGenerator; 