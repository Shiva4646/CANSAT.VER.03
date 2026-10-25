import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useTelemetry } from '../context/TelemetryContext'

const EMPTY_POINT = { timestamp: 0, altitude: 0, pressure: 0, temperature: 0 }

const colorToRgba = (color, alpha) => {
  const [red, green, blue] = color
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16))
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

function RealtimeChart({
  metric,
  label,
  color,
  unit = '',
  height = 220,
  chartOptions = {},
}) {
  const { history } = useTelemetry()
  const points = history.length ? history : [EMPTY_POINT]

  const data = {
    labels: points.map((point) =>
      new Date(point.timestamp).toLocaleTimeString('en-GB'),
    ),
    datasets: [
      {
        label: `${label}${unit ? ` (${unit})` : ''}`,
        data: points.map((point) => point[metric] ?? 0),
        borderColor: color,
        backgroundColor: (context) => {
          const { chart } = context
          const { ctx, chartArea } = chart
          if (!chartArea) return colorToRgba(color, 0.2)
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
          gradient.addColorStop(0, colorToRgba(color, 0.25))
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
          return gradient
        },
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHitRadius: 10,
        borderWidth: 2,
      },
    ],
  }

  return (
    <div className="realtime-chart" style={{ height }}>
      <Line
        data={data}
        options={{
          animation: false,
          responsive: true,
          maintainAspectRatio: false,
          ...chartOptions,
          interaction: {
            mode: 'index',
            intersect: false,
            ...chartOptions.interaction,
          },
          plugins: {
            ...chartOptions.plugins,
            legend: { display: false, ...chartOptions.plugins?.legend },
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
              backgroundColor: '#24170e',
              titleColor: '#f6eee7',
              bodyColor: '#d8c6b6',
              borderColor: '#654127',
              borderWidth: 1,
              displayColors: true,
              padding: 10,
              ...chartOptions.plugins?.tooltip,
            },
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(56, 68, 90, 0.3)',
                borderDash: [2, 4],
              },
              ...chartOptions.scales?.x,
              ticks: {
                maxTicksLimit: 6,
                color: '#64748b',
                font: { size: 10 },
                ...chartOptions.scales?.x?.ticks,
              },
            },
            y: {
              grid: {
                color: 'rgba(56, 68, 90, 0.3)',
                borderDash: [2, 4],
              },
              ...chartOptions.scales?.y,
              ticks: {
                color: '#64748b',
                font: { size: 10 },
                ...chartOptions.scales?.y?.ticks,
              },
            },
          },
        }}
      />
    </div>
  )
}

export default RealtimeChart
