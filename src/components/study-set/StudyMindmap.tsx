import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import { FaProjectDiagram, FaPlus, FaMinus, FaDownload, FaMagic } from 'react-icons/fa';
import { Skeleton } from '../ui/Skeleton';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const parseXMLToMindmap = (xmlString: string) => {
    try {
        // Remove markdown code blocks and trim
        let cleanXml = xmlString.replace(/```xml/g, '').replace(/```/g, '').trim();
        
        // Escape special characters that might break XML parsing
        // Replace & with &amp; if it's not already part of an entity
        cleanXml = cleanXml.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[a-f\d]+);)/gi, '&amp;');

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(cleanXml, "text/xml");
        
        const errorNode = xmlDoc.querySelector('parsererror');
        if (errorNode) {
            console.error('XML Parsing Error:', errorNode.textContent);
            return null;
        }

        const root = xmlDoc.documentElement;

        const processNode = (node: Element): any => {
            const name = node.getAttribute('name') || node.tagName;
            const cleanName = name === 'meeting' ? 'Study Plan' : name;
            
            const result: any = { name: cleanName };
            const children: any[] = [];
            
            Array.from(node.children).forEach(child => {
                if (child.tagName === 'description') {
                    result.value = child.textContent?.trim();
                } else if (child.tagName === 'action_items') {
                    Array.from(child.children).forEach(item => {
                        if (item.tagName === 'item') {
                            children.push({
                                name: item.textContent?.trim(),
                                itemStyle: { color: '#e6a23c', borderColor: '#e6a23c' }
                            });
                        }
                    });
                } else if (child.tagName === 'subtopic' || child.tagName === 'topic') {
                    children.push(processNode(child));
                }
            });

            if (children.length > 0) {
                result.children = children;
            }
            return result;
        };

        return processNode(root);
    } catch (e) {
        console.error("Error parsing XML mindmap:", e);
        return null;
    }
};

const renderTextWithMath = (text: string) => {
    if (!text) return '';
    // Preprocess: convert \[ \] to $$ $$, \( \) to $ $
    let processed = text
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => `$$${eq}$$`)
        .replace(/\\\(([\s\S]*?)\\\)/g, (_, eq) => `$${eq}$`)
        .replace(/\[\s*(\\frac|\\boxed|\\begin|\\sum|\\int|\\partial|\\sqrt|\\mathbf|\\mathrm|\\mathcal|\\mathscr|\\mathfrak|\\mathbb|\\sin|\\cos|\\tan)([\s\S]*?)\]/g, (match, cmd, rest) => `$$${cmd}${rest}$$`);

    // Add heuristic for bare math
    processed = processed.split(/(\s+)/).map(part => {
         if (part.trim() === '') return part;
         if (part.includes('$')) return part;
         const isMath = part.includes('^') || part.includes('\\') || (part.includes('_') && part.includes('{'));
         if (isMath) {
             const match = part.match(/^(.+?)([.,;:]?)$/);
             if (match) {
                 const [_, core, punct] = match;
                 return `$${core}$${punct}`;
             }
             return `$${part}$`;
         }
         return part;
    }).join('');

    // Render Math
    return processed.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
        try {
            return katex.renderToString(tex, { displayMode: true });
        } catch (e) {
            return tex;
        }
    }).replace(/\$([\s\S]*?)\$/g, (_, tex) => {
        try {
            return katex.renderToString(tex, { displayMode: false });
        } catch (e) {
            return tex;
        }
    });
};

const cleanLabelText = (text: string) => {
    if (!text) return '';
    let cleaned = text
        .replace(/\\\[/g, '')
        .replace(/\\\]/g, '')
        .replace(/\\\(/g, '')
        .replace(/\\\)/g, '');
    
    // Greek letters
    cleaned = cleaned
        .replace(/\\alpha/g, 'α')
        .replace(/\\beta/g, 'β')
        .replace(/\\gamma/g, 'γ')
        .replace(/\\delta/g, 'δ')
        .replace(/\\epsilon/g, 'ε')
        .replace(/\\theta/g, 'θ')
        .replace(/\\lambda/g, 'λ')
        .replace(/\\mu/g, 'μ')
        .replace(/\\pi/g, 'π')
        .replace(/\\rho/g, 'ρ')
        .replace(/\\sigma/g, 'σ')
        .replace(/\\tau/g, 'τ')
        .replace(/\\phi/g, 'φ')
        .replace(/\\omega/g, 'ω')
        .replace(/\\Delta/g, 'Δ')
        .replace(/\\Theta/g, 'Θ')
        .replace(/\\Lambda/g, 'Λ')
        .replace(/\\Pi/g, 'Π')
        .replace(/\\Sigma/g, 'Σ')
        .replace(/\\Phi/g, 'Φ')
        .replace(/\\Omega/g, 'Ω');

    // Math symbols
    cleaned = cleaned
        .replace(/\\approx/g, '≈')
        .replace(/\\le/g, '≤')
        .replace(/\\ge/g, '≥')
        .replace(/\\neq/g, '≠')
        .replace(/\\pm/g, '±')
        .replace(/\\times/g, '×')
        .replace(/\\cdot/g, '·')
        .replace(/\\div/g, '÷')
        .replace(/\\rightarrow/g, '→')
        .replace(/\\leftarrow/g, '←')
        .replace(/\\infty/g, '∞')
        .replace(/\\sqrt/g, '√')
        .replace(/\\circ/g, '°');

    // Handle superscripts
    const superscripts: { [key: string]: string } = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
        'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ', 'a': 'ᵃ',
        'b': 'ᵇ', 'c': 'ᶜ'
    };

    // Handle subscripts
    const subscripts: { [key: string]: string } = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
        '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
        'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ'
    };

    // Replace superscripts ^{...} or ^x
    cleaned = cleaned.replace(/\^\{([^{}]+)\}/g, (_, content) => {
        return content.split('').map((char: string) => superscripts[char] || char).join('');
    });
    cleaned = cleaned.replace(/\^([0-9a-zA-Z+\-=()])/g, (_, char) => {
        return superscripts[char] || `^${char}`;
    });

    // Replace subscripts _{...} or _x
    cleaned = cleaned.replace(/_\{([^{}]+)\}/g, (_, content) => {
        return content.split('').map((char: string) => subscripts[char] || char).join('');
    });
    cleaned = cleaned.replace(/_([0-9a-zA-Z+\-=()])/g, (_, char) => {
        return subscripts[char] || `_${char}`;
    });

    // Remove other latex commands but keep content where possible
    // e.g. \mathbf{x} -> x
    cleaned = cleaned.replace(/\\[a-zA-Z]+{([^}]*)}/g, '$1');
    
    // Remove curly braces used for grouping in latex
    cleaned = cleaned.replace(/[{}]/g, '');

    // Remove remaining backslashes
    cleaned = cleaned.replace(/\\/g, '');
    
    return cleaned;
};

const getTreeDimensions = (data: any) => {
    let maxDepth = 0;
    let leafCount = 0;
    let maxLeafLabelLength = 0;

    const traverse = (node: any, depth: number) => {
        if (depth > maxDepth) maxDepth = depth;
        
        if (!node.children || node.children.length === 0) {
            leafCount++;
            const label = node.name || '';
            if (label.length > maxLeafLabelLength) maxLeafLabelLength = label.length;
        } else {
            node.children.forEach((child: any) => traverse(child, depth + 1));
        }
    };

    traverse(data, 1);

    // Heuristics for size
    // Width: Depth * 400px + label space + padding
    // We allocate roughly 12px per character for the leaf labels
    const labelSpace = maxLeafLabelLength * 12;
    const width = Math.max(maxDepth * 400 + labelSpace + 600, 2400);
    const height = Math.max(leafCount * 80 + 400, 1200);

    return { width, height, maxLeafLabelLength };
};

const StudyMindmap: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const chartRef = useRef<HTMLDivElement>(null);
    const [mindmapData, setMindmapData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        let isMounted = true;

        const fetchData = async () => {
            if (!id || !user) return;

            try {
                const { data, error } = await supabase
                    .from('mindmaps')
                    .select('mindmap_data')
                    .eq('document_id', id)
                    .eq('uid', user.id)
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching data:', error);
                }

                if (isMounted) {
                    if (data && data.mindmap_data) {
                        let processedData = data.mindmap_data;
                        
                        if (typeof processedData === 'string') {
                            if (processedData.includes('```xml') || processedData.trim().startsWith('<')) {
                                const parsed = parseXMLToMindmap(processedData);
                                processedData = parsed || { name: 'Error parsing data', children: [] };
                            }
                        }

                        setMindmapData(processedData);
                        setLoading(false);
                        setIsGenerating(false);
                        if (intervalId) clearInterval(intervalId);
                    } else {
                        // Data not ready yet, keep polling
                        setIsGenerating(true);
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            }
        };

        fetchData();
        intervalId = setInterval(fetchData, 3000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [id, user]);

    const chartInstanceRef = useRef<echarts.ECharts | null>(null);

    useEffect(() => {
        if (chartRef.current && !isGenerating && !loading) {
            const chartInstance = echarts.init(chartRef.current, undefined, { renderer: 'svg' });
            chartInstanceRef.current = chartInstance;
            const isDark = document.documentElement.classList.contains('dark');
            
            const defaultData = [{
                name: 'No Data Available',
                children: []
            }];

            const chartData = mindmapData || defaultData;

            const option: any = {
                backgroundColor: isDark ? '#111111' : '#f9fafb',
                tooltip: {
                    trigger: 'item',
                    triggerOn: 'mousemove',
                    formatter: function (params: any) {
                        const description = params.value;
                        if (description) {
                            return `<div style="text-align: left;">
                                <div style="font-weight: bold; margin-bottom: 5px;">${params.name}</div>
                                <div style="max-width: 300px; white-space: normal; font-size: 12px; opacity: 0.9;">${renderTextWithMath(description)}</div>
                            </div>`;
                        }
                        return `<div style="text-align: left;">
                                <div style="font-weight: bold;">${renderTextWithMath(params.name)}</div>
                            </div>`;
                    }
                },
                series: [
                    {
                        type: 'tree',
                        roam: true,
                        data: Array.isArray(chartData) ? chartData : [chartData],
                        top: '5%',
                        left: '10%',
                        bottom: '5%',
                        right: '20%',
                        symbolSize: 10,
                        label: {
                            position: 'left',
                            verticalAlign: 'middle',
                            align: 'right',
                            fontSize: 14,
                            color: isDark ? '#fff' : '#111827',
                            formatter: function (params: any) {
                                return cleanLabelText(params.name);
                            }
                        },
                        leaves: {
                            label: {
                                position: 'right',
                                verticalAlign: 'middle',
                                align: 'left',
                                formatter: function (params: any) {
                                    return cleanLabelText(params.name);
                                }
                            }
                        },
                        emphasis: {
                            focus: 'descendant'
                        },
                        expandAndCollapse: true,
                        animationDuration: 550,
                        animationDurationUpdate: 750,
                        itemStyle: {
                            color: '#c2410c',
                            borderColor: isDark ? '#fff' : '#e5e7eb'
                        },
                        lineStyle: {
                            color: isDark ? '#555' : '#9ca3af',
                            curveness: 0.5
                        }
                    }
                ]
            };

            chartInstance.setOption(option);

            const handleResize = () => {
                chartInstance.resize();
            };

            // Observer for theme changes
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class') {
                        const isDarkNow = document.documentElement.classList.contains('dark');
                        chartInstance.setOption({
                            backgroundColor: isDarkNow ? '#111111' : '#f9fafb',
                            series: [{
                                label: { color: isDarkNow ? '#fff' : '#111827' },
                                itemStyle: { borderColor: isDarkNow ? '#fff' : '#e5e7eb' },
                                lineStyle: { color: isDarkNow ? '#555' : '#9ca3af' }
                            }]
                        });
                    }
                });
            });

            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class']
            });

            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                observer.disconnect();
                chartInstance.dispose();
                chartInstanceRef.current = null;
            };
        }
    }, [mindmapData, isGenerating, loading]);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-[#111111] relative overflow-hidden">
                {/* Central Node */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-8">
                     {/* Left Branch */}
                     <div className="flex flex-col gap-8 items-end">
                        <Skeleton width={120} height={40} className="rounded-lg" />
                        <Skeleton width={140} height={40} className="rounded-lg" />
                        <Skeleton width={100} height={40} className="rounded-lg" />
                     </div>
                     
                     {/* Center */}
                     <Skeleton width={160} height={60} className="rounded-xl border-4 border-gray-200 dark:border-white/10" />

                     {/* Right Branch */}
                     <div className="flex flex-col gap-8">
                        <Skeleton width={130} height={40} className="rounded-lg" />
                        <Skeleton width={110} height={40} className="rounded-lg" />
                        <Skeleton width={150} height={40} className="rounded-lg" />
                     </div>
                </div>
            </div>
        );
    }

    if (isGenerating) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-[#111111]">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                    <FaMagic className="relative text-5xl text-indigo-400 mb-6 animate-bounce" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Generating with AI magic...</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md text-center">
                    We're structuring your knowledge into a mind map. This usually takes just a moment!
                </p>
            </div>
        );
    }

    const handleExport = () => {
        if (!mindmapData) return;

        // 1. Calculate dimensions
        const { width, height, maxLeafLabelLength } = getTreeDimensions(mindmapData);
        
        // 2. Create off-screen container
        const div = document.createElement('div');
        div.style.visibility = 'hidden';
        div.style.position = 'fixed'; // Use fixed to ensure it's removed from flow but rendering context is valid
        div.style.top = '0';
        div.style.left = '-10000px'; // Move far off-screen
        div.style.width = `${width}px`;
        div.style.height = `${height}px`;
        document.body.appendChild(div);

        // 3. Init ECharts
        const chart = echarts.init(div, undefined, { renderer: 'svg' });
        
        // 4. Set Options
        // For export, we force a light theme-like high contrast look to ensure visibility in all viewers
        // unless specific dark requirement, but standardizing on white bg/black text is safest for "visibility"
        const exportBgColor = '#ffffff';
        const exportTextColor = '#000000';
        const exportLineColor = '#555555';

        // Calculate dynamic right margin based on text length
        // 16px font size * ~12px width estimate per char + buffer
        const rightMargin = Math.max(maxLeafLabelLength * 12 + 100, 300);

        chart.setOption({
            backgroundColor: exportBgColor,
            animation: false, // CRITICAL: Disable animation for immediate full render
            series: [{
                type: 'tree',
                data: [mindmapData],
                top: '100px',
                left: '100px',
                bottom: '100px',
                right: `${rightMargin}px`,
                symbolSize: 12,
                initialTreeDepth: -1, // Expand all
                label: {
                    position: 'left',
                    verticalAlign: 'middle',
                    align: 'right',
                    fontSize: 16, // Slightly larger for export
                    color: exportTextColor,
                    fontFamily: 'sans-serif',
                    formatter: function (params: any) {
                        return cleanLabelText(params.name);
                    }
                },
                leaves: {
                    label: {
                        position: 'right',
                        verticalAlign: 'middle',
                        align: 'left',
                        fontSize: 16,
                        color: exportTextColor,
                        fontFamily: 'sans-serif',
                        formatter: function (params: any) {
                            return cleanLabelText(params.name);
                        }
                    }
                },
                expandAndCollapse: false,
                itemStyle: {
                    color: '#c2410c',
                    borderColor: exportLineColor
                },
                lineStyle: {
                    color: exportLineColor,
                    curveness: 0.5,
                    width: 2
                }
            }]
        });

        // 5. Export with a small timeout to ensure rendering is complete
        // Although SVG render is sync, sometimes DOM updates need a tick
        setTimeout(() => {
            try {
                const url = chart.getDataURL({
                    type: 'svg',
                    backgroundColor: exportBgColor,
                    excludeComponents: ['toolbox']
                });

                // 6. Download
                const a = document.createElement('a');
                a.href = url;
                a.download = 'mindmap-full.svg';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (e) {
                console.error("Export failed:", e);
            } finally {
                // 7. Cleanup
                chart.dispose();
                document.body.removeChild(div);
            }
        }, 100);
    };

    return (
        <div className="h-full relative flex flex-col bg-gray-50 dark:bg-[#111111]">
            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button className="p-2 bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 border border-gray-200 dark:border-transparent rounded-lg text-gray-700 dark:text-white transition-colors">
                    <FaPlus size={14} />
                </button>
                <button className="p-2 bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 border border-gray-200 dark:border-transparent rounded-lg text-gray-700 dark:text-white transition-colors">
                    <FaMinus size={14} />
                </button>
                <button 
                    onClick={handleExport}
                    className="p-2 bg-[#c2410c] hover:bg-[#9a3412] rounded-lg text-white transition-colors flex items-center gap-2 shadow-lg shadow-orange-900/20"
                >
                    <FaDownload size={12} />
                    <span className="text-sm font-bold">Export</span>
                </button>
            </div>

            <div className="flex-1 w-full h-full" ref={chartRef}></div>
            
            <div className="absolute bottom-8 left-8 p-4 bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 max-w-sm shadow-lg">
                <div className="flex items-center gap-2 text-[#c2410c] mb-2">
                    <FaProjectDiagram />
                    <span className="font-bold">Mindmap View</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Visual representation of your study material. Click on nodes to expand or collapse branches.
                </p>
            </div>
        </div>
    );
};

export default StudyMindmap;
