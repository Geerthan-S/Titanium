import Chart from 'chart.js/auto';

const charts = new WeakMap();

export function renderAdminChart(canvas, config, summary = '') {
  if (!canvas) return null;
  charts.get(canvas)?.destroy();
  const chart = new Chart(canvas, {
    ...config,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : { duration: 450 },
      plugins: { legend: { labels: { usePointStyle: true, boxWidth: 8, color: '#4d5b54' } } },
      ...config.options,
    },
  });
  charts.set(canvas, chart);
  const summaryNode = canvas.parentElement?.querySelector('[data-chart-summary]');
  if (summaryNode) summaryNode.textContent = summary;
  return chart;
}

export function destroyAdminCharts(root = document) {
  root.querySelectorAll('canvas').forEach((canvas) => charts.get(canvas)?.destroy());
}
