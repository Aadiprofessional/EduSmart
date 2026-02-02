import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { FaProjectDiagram, FaPlus, FaMinus, FaDownload } from 'react-icons/fa';

const StudyMindmap: React.FC = () => {
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chartRef.current) {
            const chartInstance = echarts.init(chartRef.current);
            
            const option: any = {
                backgroundColor: '#111111',
                tooltip: {
                    trigger: 'item',
                    triggerOn: 'mousemove'
                },
                series: [
                    {
                        type: 'tree',
                        data: [{
                            name: 'AI System Architecture',
                            children: [
                                {
                                    name: 'Frontend',
                                    children: [
                                        { name: 'React App' },
                                        { name: 'Mobile App' },
                                        { name: 'Web Socket Client' }
                                    ]
                                },
                                {
                                    name: 'Backend',
                                    children: [
                                        { name: 'API Gateway' },
                                        { name: 'Auth Service' },
                                        { name: 'Data Processing' }
                                    ]
                                },
                                {
                                    name: 'AI Models',
                                    children: [
                                        { name: 'NLP Engine' },
                                        { name: 'Image Gen' },
                                        { name: 'Speech to Text' }
                                    ]
                                },
                                {
                                    name: 'Database',
                                    children: [
                                        { name: 'User Data' },
                                        { name: 'Content Store' },
                                        { name: 'Vector DB' }
                                    ]
                                }
                            ]
                        }],
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
    }, []);

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
                    Visual representation of the AI System Architecture. Click on nodes to expand or collapse branches.
                </p>
            </div>
        </div>
    );
};

export default StudyMindmap;
