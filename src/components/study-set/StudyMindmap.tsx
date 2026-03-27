import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import { FaProjectDiagram, FaPlus, FaMinus, FaDownload, FaMagic, FaTimes } from 'react-icons/fa';
import { Skeleton } from '../ui/Skeleton';

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
    let maxLeafDescriptionLength = 0;
    let maxLeafLineCount = 1;

    const traverse = (node: any, depth: number) => {
        if (depth > maxDepth) maxDepth = depth;
        
        if (!node.children || node.children.length === 0) {
            leafCount++;
            const label = cleanLabelText(node.name || '');
            const description = cleanLabelText(node.value || '');
            const combinedLines = `${label}\n${description}`.split('\n').filter((line: string) => line.trim().length > 0).length;
            if (label.length > maxLeafLabelLength) maxLeafLabelLength = label.length;
            if (description.length > maxLeafDescriptionLength) maxLeafDescriptionLength = description.length;
            if (combinedLines > maxLeafLineCount) maxLeafLineCount = combinedLines;
        } else {
            node.children.forEach((child: any) => traverse(child, depth + 1));
        }
    };

    traverse(data, 1);

    // Heuristics for size
    // Width: Depth * 400px + label space + padding
    // We allocate roughly 12px per character for the leaf labels
    const labelSpace = maxLeafLabelLength * 11;
    const descriptionSpace = Math.min(maxLeafDescriptionLength * 8, 1800);
    const width = Math.max(maxDepth * 420 + labelSpace + descriptionSpace + 700, 3200);
    const rowHeight = Math.max(maxLeafLineCount * 24, 150);
    const height = Math.max(leafCount * rowHeight + 700, 1800);

    return { width, height, maxLeafLabelLength };
};

const expandAllTreeNodes = (node: any): any => {
    if (!node || typeof node !== 'object') return node;

    const expandedNode = {
        ...node,
        collapsed: false
    };

    if (Array.isArray(node.children)) {
        expandedNode.children = node.children.map((child: any) => expandAllTreeNodes(child));
    }

    return expandedNode;
};

const getNodeDescription = (params: any): string => {
    const valueFromData = params?.data?.value;
    const valueFromParams = params?.value;
    const rawDescription = typeof valueFromData === 'string'
        ? valueFromData
        : typeof valueFromParams === 'string'
            ? valueFromParams
            : '';
    return cleanLabelText(rawDescription).trim();
};

const getTreeNodeCount = (node: any): number => {
    if (!node || typeof node !== 'object') return 0;
    if (!Array.isArray(node.children) || node.children.length === 0) return 1;
    return 1 + node.children.reduce((total: number, child: any) => total + getTreeNodeCount(child), 0);
};

const StudyMindmap: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const chartRef = useRef<HTMLDivElement>(null);
    const [mindmapData, setMindmapData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showInfo, setShowInfo] = useState(true);

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
                    .order('created_at', { ascending: false })
                    .limit(1)
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
    const currentZoom = useRef(1);

    useEffect(() => {
        if (chartRef.current && !isGenerating && !loading) {
            const chartInstance = echarts.init(chartRef.current, undefined, { renderer: 'svg' });
            chartInstanceRef.current = chartInstance;
            const isDark = document.documentElement.classList.contains('dark');
            
            const defaultData = [{
                name: 'No Data Available',
                children: []
            }];

            const sourceData = mindmapData || defaultData;
            const chartData = Array.isArray(sourceData)
                ? sourceData.map((node: any) => expandAllTreeNodes(node))
                : [expandAllTreeNodes(sourceData)];
            const totalNodeCount = chartData.reduce((total: number, node: any) => total + getTreeNodeCount(node), 0);
            const dynamicNodeGap = totalNodeCount > 20 ? 110 : 95;
            const dynamicLayerGap = totalNodeCount > 20 ? 270 : 240;

            const option: any = {
                backgroundColor: isDark ? '#111111' : '#f9fafb',
                tooltip: {
                    show: false
                },
                series: [
                    {
                        type: 'tree',
                        roam: true,
                        orient: 'LR',
                        data: chartData,
                        top: '4%',
                        left: '6%',
                        bottom: '4%',
                        right: '36%',
                        initialTreeDepth: -1,
                        nodeGap: dynamicNodeGap,
                        layerGap: dynamicLayerGap,
                        symbolSize: 12,
                        label: {
                            position: 'left',
                            verticalAlign: 'middle',
                            align: 'right',
                            fontSize: 12,
                            color: isDark ? '#fff' : '#111827',
                            overflow: 'break',
                            lineHeight: 22,
                            width: 460,
                            formatter: function (params: any) {
                                const title = cleanLabelText(params.name || '');
                                const description = getNodeDescription(params);
                                return description ? `${title}\n${description}` : title;
                            }
                        },
                        leaves: {
                            label: {
                                position: 'right',
                                verticalAlign: 'middle',
                                align: 'left',
                                overflow: 'break',
                                lineHeight: 22,
                                width: 620,
                                formatter: function (params: any) {
                                    const title = cleanLabelText(params.name || '');
                                    const description = getNodeDescription(params);
                                    return description ? `${title}\n${description}` : title;
                                }
                            }
                        },
                        emphasis: {
                            focus: 'descendant'
                        },
                        expandAndCollapse: false,
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
        const exportData = expandAllTreeNodes(mindmapData);

        chart.setOption({
            backgroundColor: exportBgColor,
            animation: false, // CRITICAL: Disable animation for immediate full render
            series: [{
                type: 'tree',
                orient: 'LR',
                data: [exportData],
                top: '120px',
                left: '120px',
                bottom: '120px',
                right: `${rightMargin + 700}px`,
                nodeGap: 130,
                layerGap: 300,
                symbolSize: 12,
                initialTreeDepth: -1, // Expand all
                label: {
                    position: 'left',
                    verticalAlign: 'middle',
                    align: 'right',
                    fontSize: 15, // Slightly larger for export
                    lineHeight: 24,
                    width: 520,
                    overflow: 'break',
                    color: exportTextColor,
                    fontFamily: 'sans-serif',
                    formatter: function (params: any) {
                        const title = cleanLabelText(params.name || '');
                        const description = getNodeDescription(params);
                        return description ? `${title}\n${description}` : title;
                    }
                },
                leaves: {
                    label: {
                        position: 'right',
                        verticalAlign: 'middle',
                        align: 'left',
                        fontSize: 15,
                        lineHeight: 24,
                        width: 780,
                        overflow: 'break',
                        color: exportTextColor,
                        fontFamily: 'sans-serif',
                        formatter: function (params: any) {
                            const title = cleanLabelText(params.name || '');
                            const description = getNodeDescription(params);
                            return description ? `${title}\n${description}` : title;
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
        } as any);

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

    const handleZoom = (type: 'in' | 'out') => {
        if (!chartInstanceRef.current) return;
        
        const newZoom = type === 'in' 
            ? currentZoom.current * 1.2 
            : currentZoom.current / 1.2;
            
        currentZoom.current = newZoom;
        
        chartInstanceRef.current.setOption({
            series: [{
                zoom: newZoom
            }]
        });
    };

    return (
        <div className="h-full relative flex flex-col bg-gray-50 dark:bg-[#111111]">
            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button 
                    onClick={() => handleZoom('in')}
                    className="p-2 bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 border border-gray-200 dark:border-transparent rounded-lg text-gray-700 dark:text-white transition-colors"
                >
                    <FaPlus size={14} />
                </button>
                <button 
                    onClick={() => handleZoom('out')}
                    className="p-2 bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 border border-gray-200 dark:border-transparent rounded-lg text-gray-700 dark:text-white transition-colors"
                >
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
            
            {showInfo && (
                <div className="absolute bottom-8 left-8 p-4 bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 max-w-sm shadow-lg relative">
                    <button
                        aria-label="Close"
                        onClick={() => setShowInfo(false)}
                        className="absolute top-2 right-2 p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <FaTimes size={12} />
                    </button>
                    <div className="flex items-center gap-2 text-[#c2410c] mb-2">
                        <FaProjectDiagram />
                        <span className="font-bold">Mindmap View</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Visual representation of your study material. All node details are shown directly.
                    </p>
                </div>
            )}
        </div>
    );
};

export default StudyMindmap;
