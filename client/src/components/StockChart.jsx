import { useState } from 'react';

function StockChart({ history = [], symbol = 'STOCK', isPositive = true }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!history || history.length === 0) {
    return (
      <div className="chart-empty">
        <p>No historical price data available for {symbol}</p>
      </div>
    );
  }

  // Chart dimensions
  const width = 760;
  const height = 300;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Compute min and max prices
  const prices = history.map((item) => item.price);
  const minPrice = Math.min(...prices) * 0.99;
  const maxPrice = Math.max(...prices) * 1.01;
  const priceRange = maxPrice - minPrice || 1;

  // Map data to SVG coordinates
  const points = history.map((item, index) => {
    const x = padding.left + (index / (history.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - ((item.price - minPrice) / priceRange) * chartHeight;
    return { ...item, x, y };
  });

  // Build SVG path strings
  const pathD = points.reduce((acc, point, index) => {
    return index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
  }, '');

  // Build closed area for gradient fill
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  // Colors
  const strokeColor = isPositive ? '#16a34a' : '#dc2626';
  const gradientStart = isPositive ? 'rgba(22, 163, 74, 0.25)' : 'rgba(220, 38, 38, 0.25)';
  const gradientEnd = isPositive ? 'rgba(22, 163, 74, 0.0)' : 'rgba(220, 38, 38, 0.0)';

  // Handle mouse movement for interactive tooltip
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const scaleX = width / rect.width;
    const adjustedX = mouseX * scaleX;

    // Find nearest point
    let closest = points[0];
    let minDiff = Infinity;
    points.forEach((p) => {
      const diff = Math.abs(p.x - adjustedX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = p;
      }
    });

    setHoveredPoint(closest);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="stock-chart-wrapper">
      <div className="chart-header-info">
        <span className="chart-subtitle">1-Month Daily Price Trend</span>
        {hoveredPoint && (
          <div className="chart-hover-display">
            <span className="hover-date">{hoveredPoint.date}</span>
            <span className="hover-price">${hoveredPoint.price.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="svg-container" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <svg viewBox={`0 0 ${width} ${height}`} className="stock-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientStart} />
              <stop offset="100%" stopColor={gradientEnd} />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-axis labels */}
          {[0, 0.5, 1].map((ratio) => {
            const y = padding.top + chartHeight * (1 - ratio);
            const labelPrice = minPrice + priceRange * ratio;
            return (
              <g key={ratio} className="grid-line-group">
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#94a3b8"
                >
                  ${labelPrice.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* X-axis date labels */}
          {points.length > 0 && (
            <>
              <text
                x={padding.left}
                y={height - 12}
                textAnchor="start"
                fontSize="11"
                fill="#94a3b8"
              >
                {points[0].date}
              </text>
              <text
                x={width - padding.right}
                y={height - 12}
                textAnchor="end"
                fontSize="11"
                fill="#94a3b8"
              >
                {points[points.length - 1].date}
              </text>
            </>
          )}

          {/* Area fill */}
          <path d={areaD} fill={`url(#grad-${symbol})`} />

          {/* Price curve line */}
          <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />

          {/* Interactive crosshair & highlight dot on hover */}
          {hoveredPoint && (
            <g className="hover-marker">
              <line
                x1={hoveredPoint.x}
                y1={padding.top}
                x2={hoveredPoint.x}
                y2={padding.top + chartHeight}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="5"
                fill="#ffffff"
                stroke={strokeColor}
                strokeWidth="3"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

export default StockChart;
