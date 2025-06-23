import React, { useEffect, useRef } from 'react';
import { LearningProgress } from '../../types';

interface LearningProgressChartProps {
  userProgress: LearningProgress[];
}

export const LearningProgressChart: React.FC<LearningProgressChartProps> = ({ userProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || userProgress.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set dimensions
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    // Prepare data
    const lastSixMonths = getLastSixMonths();
    const monthlyData = calculateMonthlyProgress(userProgress, lastSixMonths);
    
    // Draw axes
    drawAxes(ctx, padding, width, height, chartHeight, lastSixMonths);
    
    // Draw bars
    drawBars(ctx, monthlyData, padding, chartWidth, chartHeight, lastSixMonths.length);
    
    // Draw legend
    drawLegend(ctx, width, padding);

  }, [userProgress]);

  const getLastSixMonths = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(month);
    }
    
    return months;
  };

  const calculateMonthlyProgress = (progress: LearningProgress[], months: Date[]) => {
    const monthlyData = months.map(month => {
      const year = month.getFullYear();
      const monthIndex = month.getMonth();
      
      // Filter progress entries for this month
      const monthProgress = progress.filter(p => {
        if (!p.startedAt) return false;
        const startDate = new Date(p.startedAt);
        return startDate.getFullYear() === year && startDate.getMonth() === monthIndex;
      });
      
      // Calculate stats
      const completed = monthProgress.filter(p => p.status === 'completed').length;
      const inProgress = monthProgress.filter(p => p.status === 'in_progress').length;
      const totalTime = monthProgress.reduce((sum, p) => sum + p.timeSpent, 0) / 3600; // Convert to hours
      
      return { completed, inProgress, totalTime };
    });
    
    return monthlyData;
  };

  const drawAxes = (
    ctx: CanvasRenderingContext2D, 
    padding: number, 
    width: number, 
    height: number, 
    chartHeight: number,
    months: Date[]
  ) => {
    ctx.strokeStyle = '#e5e7eb'; // gray-200
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Y-axis grid lines and labels
    ctx.fillStyle = '#6b7280'; // gray-500
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const y = height - padding - (i * (chartHeight / ySteps));
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.strokeStyle = '#f3f4f6'; // gray-100
      ctx.stroke();
      
      // Label
      ctx.fillText(`${i * 2}`, padding - 5, y + 3);
    }
    
    // X-axis labels
    ctx.textAlign = 'center';
    const barWidth = (width - (padding * 2)) / months.length;
    
    months.forEach((month, i) => {
      const x = padding + (i * barWidth) + (barWidth / 2);
      const monthName = month.toLocaleDateString('ja-JP', { month: 'short' });
      ctx.fillText(monthName, x, height - padding + 15);
    });
    
    // Y-axis title
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('完了コース数', 0, 0);
    ctx.restore();
  };

  const drawBars = (
    ctx: CanvasRenderingContext2D, 
    data: { completed: number; inProgress: number; totalTime: number }[],
    padding: number,
    chartWidth: number,
    chartHeight: number,
    numMonths: number
  ) => {
    const barWidth = (chartWidth / numMonths) * 0.7;
    const barSpacing = (chartWidth / numMonths) * 0.3;
    const maxValue = 10; // Maximum value for scaling
    
    data.forEach((month, i) => {
      const x = padding + (i * (chartWidth / numMonths)) + (barSpacing / 2);
      
      // Completed courses bar
      const completedHeight = (month.completed / maxValue) * chartHeight;
      ctx.fillStyle = '#3b82f6'; // blue-500
      ctx.fillRect(
        x, 
        padding + (chartHeight - completedHeight), 
        barWidth / 2, 
        completedHeight
      );
      
      // In progress courses bar
      const inProgressHeight = (month.inProgress / maxValue) * chartHeight;
      ctx.fillStyle = '#93c5fd'; // blue-300
      ctx.fillRect(
        x + (barWidth / 2), 
        padding + (chartHeight - inProgressHeight), 
        barWidth / 2, 
        inProgressHeight
      );
      
      // Add value labels if values are significant
      if (month.completed > 0) {
        ctx.fillStyle = '#1f2937'; // gray-800
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          month.completed.toString(), 
          x + (barWidth / 4), 
          padding + (chartHeight - completedHeight) - 5
        );
      }
      
      if (month.inProgress > 0) {
        ctx.fillStyle = '#1f2937'; // gray-800
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          month.inProgress.toString(), 
          x + (barWidth * 3/4), 
          padding + (chartHeight - inProgressHeight) - 5
        );
      }
    });
  };

  const drawLegend = (
    ctx: CanvasRenderingContext2D,
    width: number,
    padding: number
  ) => {
    const legendX = width - padding - 100;
    const legendY = padding;
    
    // Completed legend
    ctx.fillStyle = '#3b82f6'; // blue-500
    ctx.fillRect(legendX, legendY, 15, 15);
    ctx.fillStyle = '#1f2937'; // gray-800
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('完了', legendX + 20, legendY + 12);
    
    // In progress legend
    ctx.fillStyle = '#93c5fd'; // blue-300
    ctx.fillRect(legendX, legendY + 20, 15, 15);
    ctx.fillStyle = '#1f2937'; // gray-800
    ctx.fillText('学習中', legendX + 20, legendY + 32);
  };

  return (
    <div className="w-full h-full">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={400} 
        className="w-full h-full"
      />
    </div>
  );
};