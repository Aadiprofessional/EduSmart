import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import { FaProjectDiagram, FaPlus, FaMinus, FaDownload, FaMagic } from 'react-icons/fa';
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
                                itemStyle: { color: '#e6a23c', borderColor: '#e6a23c' },
                                label: { color: '#ffecb3' }
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
                    .single();

                if (error && error.code !== 'PGRST116') {
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

    useEffect(() => {
        if (chartRef.current && !isGenerating && !loading) {
            const chartInstance = echarts.init(chartRef.current);
            
            const defaultData = [{
                name: 'No Data Available',
                children: []
            }];

            const chartData = mindmapData || defaultData;

            const option: any = {
                backgroundColor: '#111111',
                tooltip: {
                    trigger: 'item',
                    triggerOn: 'mousemove',
                    formatter: function (params: any) {
                        const description = params.value;
                        if (description) {
                            return `<div style="text-align: left;">
                                <div style="font-weight: bold; margin-bottom: 5px;">${params.name}</div>
                                <div style="max-width: 300px; white-space: normal; font-size: 12px; opacity: 0.9;">${description}</div>
                            </div>`;
                        }
                        return params.name;
                    }
                },
                series: [
                    {
                        type: 'tree',
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
                            color: '#fff'
                        },
                        leaves: {
                            label: {
                                position: 'right',
                                verticalAlign: 'middle',
                                align: 'left'
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
                            borderColor: '#fff'
                        },
                        lineStyle: {
                            color: '#555',
                            curveness: 0.5
                        }
                    }
                ]
            };

            chartInstance.setOption(option);

            const handleResize = () => {
                chartInstance.resize();
            };

            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                chartInstance.dispose();
            };
        }
    }, [mindmapData, isGenerating, loading]);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#111111] relative overflow-hidden">
                {/* Central Node */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-8">
                     {/* Left Branch */}
                     <div className="flex flex-col gap-8 items-end">
                        <Skeleton dark width={120} height={40} className="rounded-lg" />
                        <Skeleton dark width={140} height={40} className="rounded-lg" />
                        <Skeleton dark width={100} height={40} className="rounded-lg" />
                     </div>
                     
                     {/* Center */}
                     <Skeleton dark width={160} height={60} className="rounded-xl border-4 border-white/10" />

                     {/* Right Branch */}
                     <div className="flex flex-col gap-8">
                        <Skeleton dark width={130} height={40} className="rounded-lg" />
                        <Skeleton dark width={110} height={40} className="rounded-lg" />
                        <Skeleton dark width={150} height={40} className="rounded-lg" />
                     </div>
                </div>
            </div>
        );
    }

    if (isGenerating) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#111111]">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                    <FaMagic className="relative text-5xl text-indigo-400 mb-6 animate-bounce" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Generating with AI magic...</h2>
                <p className="text-gray-400 max-w-md text-center">
                    We're structuring your knowledge into a mind map. This usually takes just a moment!
                </p>
            </div>
        );
    }

    return (
        <div className="h-full relative flex flex-col bg-[#111111]">
            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                    <FaPlus size={14} />
                </button>
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                    <FaMinus size={14} />
                </button>
                <button className="p-2 bg-[#c2410c] hover:bg-[#9a3412] rounded-lg text-white transition-colors flex items-center gap-2">
                    <FaDownload size={12} />
                    <span className="text-sm font-bold">Export</span>
                </button>
            </div>

            <div className="flex-1 w-full h-full" ref={chartRef}></div>
            
            <div className="absolute bottom-8 left-8 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 max-w-sm">
                <div className="flex items-center gap-2 text-[#c2410c] mb-2">
                    <FaProjectDiagram />
                    <span className="font-bold">Mindmap View</span>
                </div>
                <p className="text-sm text-gray-400">
                    Visual representation of your study material. Click on nodes to expand or collapse branches.
                </p>
            </div>
        </div>
    );
};

export default StudyMindmap;
