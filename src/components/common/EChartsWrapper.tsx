import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface EChartsWrapperProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  option: any;
  style?: React.CSSProperties;
  className?: string;
  loading?: boolean;
  onChartClick?: (params: unknown) => void;
}

export const EChartsWrapper: React.FC<EChartsWrapperProps> = ({
  option,
  style = { height: '360px', width: '100%' },
  className = '',
  loading = false,
  onChartClick
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas'
      });
    }

    const chart = chartInstanceRef.current;

    if (loading) {
      chart.showLoading({
        text: 'Computing Algorithm...',
        color: '#4F46E5',
        textColor: '#4F46E5',
        maskColor: 'rgba(255, 255, 255, 0.7)',
        zlevel: 10
      });
    } else {
      chart.hideLoading();
      chart.setOption(option, true);
    }

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(chartRef.current);

    // Click listener
    if (onChartClick) {
      chart.off('click');
      chart.on('click', onChartClick);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [option, loading, onChartClick]);

  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={chartRef}
      style={style}
      className={`relative rounded-xl overflow-hidden ${className}`}
    />
  );
};
