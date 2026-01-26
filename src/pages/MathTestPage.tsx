import React from 'react';
import 'katex/dist/katex.min.css';

// 1. react-latex-next
import Latex from 'react-latex-next';

// 2. react-katex
import { InlineMath, BlockMath } from 'react-katex';

// 3. better-react-mathjax
import { MathJaxContext, MathJax } from 'better-react-mathjax';

// 4. react-markdown + rehype-katex (Existing approach)
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

const MathTestPage: React.FC = () => {
  const testContent = `
    Here is some text with inline math: $E = mc^2$.
    
    And here is a block equation:
    $$
    \\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
    $$

    Complex fraction: $\\frac{1}{2}$
    
    The user's problem case (brackets):
    [ C = \\frac{5}{9}(F-32) ]
  `;

  const latexNextContent = `
    Here is some text with inline math: $E = mc^2$.
    And here is a block equation:
    $$
    \\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
    $$
    The user's problem case (brackets):
    \\[ C = \\frac{5}{9}(F-32) \\]
  `;

  // Preprocessing for react-markdown (what we implemented before)
  const preprocessLaTeX = (content: string) => {
    return content
      .replace(/\\\[(.*?)\\\]/g, (_, eq) => `$$${eq}$$`)   // block math \[ ... \]
      .replace(/\\\((.*?)\\\)/g, (_, eq) => `$${eq}$`)    // inline math \( ... \)
      .replace(/\[\s*([^\[\]]+?)\s*\](?!\()/g, (_, eq) => `$$${eq}$$`); // block math [ ... ]
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8 pt-24">
      <div className="max-w-4xl mx-auto space-y-12">
        <h1 className="text-3xl font-bold text-cyan-400">Math Rendering Library Test</h1>
        
        <p className="text-slate-400">
          This page tests different libraries for rendering mathematical expressions in React.
          It includes the test case `[ C = \\frac{5}{9}(F-32) ]` which was problematic.
        </p>

        {/* 1. react-latex-next */}
        <section className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h2 className="text-xl font-semibold text-teal-400 mb-4">1. react-latex-next</h2>
          <div className="prose prose-invert max-w-none">
            <Latex>{latexNextContent}</Latex>
            <div className="mt-4 p-4 bg-slate-900 rounded border border-slate-700">
                <p className="text-sm text-slate-500 mb-2">Testing [ ... ] directly:</p>
                <Latex>{`[ C = \\frac{5}{9}(F-32) ]`}</Latex>
            </div>
          </div>
        </section>

        {/* 2. react-katex */}
        <section className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h2 className="text-xl font-semibold text-blue-400 mb-4">2. react-katex</h2>
          <p className="text-slate-400 mb-2">Note: react-katex requires explicit components (InlineMath, BlockMath) and doesn't parse text automatically.</p>
          <div className="space-y-4">
            <div>
              <span>Inline: </span>
              <InlineMath math="E = mc^2" />
            </div>
            <div>
              <span>Block: </span>
              <BlockMath math="\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}" />
            </div>
             <div>
              <span>Problem Case (as block): </span>
              <BlockMath math="C = \frac{5}{9}(F-32)" />
            </div>
          </div>
        </section>

        {/* 3. better-react-mathjax */}
        <section className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h2 className="text-xl font-semibold text-purple-400 mb-4">3. better-react-mathjax</h2>
          <MathJaxContext>
            <div className="prose prose-invert max-w-none">
              <MathJax>
                {testContent}
              </MathJax>
            </div>
          </MathJaxContext>
        </section>

        {/* 4. react-markdown + rehype-katex (Control) */}
        <section className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h2 className="text-xl font-semibold text-green-400 mb-4">4. react-markdown + rehype-katex (Current Implementation)</h2>
          <div className="prose prose-invert max-w-none">
             <h3 className="text-lg text-slate-300">Raw (No Preprocessing):</h3>
             <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
             >
                {testContent}
             </ReactMarkdown>

             <h3 className="text-lg text-slate-300 mt-4">With Preprocessing:</h3>
             <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
             >
                {preprocessLaTeX(testContent)}
             </ReactMarkdown>
          </div>
        </section>

      </div>
    </div>
  );
};

export default MathTestPage;
