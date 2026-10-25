import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import { BatteryCharging, Download, Gauge, MapPin, Radio, Zap } from 'lucide-react'
import { Line } from 'react-chartjs-2'
import GPSMap from '../components/GPSMap'
import RealtimeChart from '../components/RealtimeChart'
import Satellite3D from '../components/Satellite3D'
import UplinkControl from '../components/UplinkControl'
import { useTelemetry } from '../context/TelemetryContext'


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
)

const formatNumber = (value, digits = 2) => Number(value ?? 0).toFixed(digits)
const imuColors = ['#ff9a4b', '#ffd08a', '#52d29a']

const colorToRgba = (color, alpha) => {
  const [red, green, blue] = color
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16))
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="dashboard-metric telemetry-tile">
      <div className="telemetry-tile-label">
        <Icon size={14} aria-hidden="true" />
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </div>
  )
}

function StatusBadge({ label, value }) {
  const deployed = String(value).toUpperCase() === 'DEPLOYED'

  return (
    <div className={`recovery-status ${deployed ? 'is-deployed' : ''}`}>
      <span className="recovery-status-dot" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ImuChart({ title, fields }) {
  const { history } = useTelemetry()
  const points = history.length ? history : [{ timestamp: 0 }]

  return (
    <div className="dashboard-imu-card">
      <h3>{title}</h3>
      <div className="dashboard-imu-chart">
        <Line
          data={{
            labels: points.map((point) =>
              new Date(point.timestamp).toLocaleTimeString('en-GB'),
            ),
            datasets: fields.map((field, index) => ({
              label: field.label,
              data: points.map((point) => point[field.key] ?? 0),
              borderColor: imuColors[index],
              backgroundColor: (context) => {
                const { chart } = context
                const { ctx, chartArea } = chart
                const color = imuColors[index]
                if (!chartArea) return colorToRgba(color, 0.2)

                const gradient = ctx.createLinearGradient(
                  0,
                  chartArea.top,
                  0,
                  chartArea.bottom,
                )
                gradient.addColorStop(0, colorToRgba(color, 0.25))
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
                return gradient
              },
              fill: true,
              borderWidth: 1.5,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHitRadius: 10,
              tension: 0.3,
            })),
          }}
          options={{
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: '#24170e',
                titleColor: '#f6eee7',
                bodyColor: '#d8c6b6',
                borderColor: '#654127',
                borderWidth: 1,
                padding: 10,
              },
            },
            scales: {
              x: {
                ticks: { color: '#64748b', maxTicksLimit: 4, font: { size: 9 } },
                grid: { color: 'rgba(56, 68, 90, 0.3)' },
              },
              y: {
                ticks: { color: '#64748b', font: { size: 9 } },
                grid: { color: 'rgba(56, 68, 90, 0.3)' },
              },
            },
          }}
        />
      </div>
    </div>
  )
}

function Dashboard() {
  const telemetry = useTelemetry()

  const handleDownloadLog = async () => {
    let objectUrl
    let anchor

    try {
      const response = await fetch('http://localhost:3000/api/download-log')
      if (!response.ok) {
        throw new Error(`Download request failed with status ${response.status}`)
      }

      const blob = await response.blob()
      objectUrl = URL.createObjectURL(blob)
      anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = 'mission_log.csv'
      anchor.style.display = 'none'
      document.body.appendChild(anchor)
      anchor.click()
    } catch {
      alert('Unable to download the flight log. Please try again.')
    } finally {
      anchor?.remove()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }


  const { telemetry: values, gyroscope } = telemetry

  return (
    <section className="dashboard-page reference-dashboard">
      <UplinkControl />
      <button
        className="flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 font-medium text-white transition hover:bg-cyan-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
        onClick={handleDownloadLog}
        type="button"
      >
        <Download aria-hidden="true" size={16} />
        Download Flight Log
      </button>
      <div className="dashboard-main-grid">
        <section className="dashboard-panel dashboard-sensor-panel">
          <div className="dashboard-chart-card">
            <div className="dashboard-chart-header">
              <h3>Pressure</h3>
              <span>{formatNumber(values.pressure)} hPa</span>
            </div>
            <RealtimeChart
              chartOptions={{
                scales: {
                  x: { ticks: { maxTicksLimit: 5, maxRotation: 25, minRotation: 25 } },
                },
              }}
              color="#ffad67"
              label="Pressure"
              metric="pressure"
              unit="hPa"
            />
          </div>
          <div className="dashboard-chart-card">
            <div className="dashboard-chart-header">
              <h3>Temperature</h3>
              <span>{formatNumber(values.temperature, 2)} °C</span>
            </div>
            <RealtimeChart
              chartOptions={{
                scales: {
                  x: { ticks: { maxTicksLimit: 5, maxRotation: 25, minRotation: 25 } },
                },
              }}
              color="#ffd08a"
              label="Temperature"
              metric="temperature"
              unit="°C"
            />
          </div>
        </section>

        <section className="dashboard-panel dashboard-satellite-panel">
          <h3 className="panel-eyebrow">3D Orientation</h3>
          <Satellite3D />
          <div className="dashboard-orientation">
            <span className="orientation-readout">ROLL <strong>{formatNumber(gyroscope.roll)}°</strong></span>
            <span className="orientation-readout">PITCH <strong>{formatNumber(gyroscope.pitch)}°</strong></span>
            <span className="orientation-readout">YAW <strong>{formatNumber(gyroscope.yaw)}°</strong></span>
            <strong
              className={`motion-status ${
                String(telemetry.motionState).toUpperCase() === 'TUMBLING'
                  ? 'is-warning'
                  : 'is-stable'
              }`}
            >
              {telemetry.motionState}
            </strong>
          </div>
        </section>

        <section className="dashboard-panel dashboard-altitude-panel">
          <div className="dashboard-chart-card">
            <div className="dashboard-chart-header">
              <h3>Altitude</h3>
            </div>
            <RealtimeChart
              chartOptions={{
                maintainAspectRatio: false,
                scales: {
                  x: { ticks: { maxTicksLimit: 5, maxRotation: 0, minRotation: 0 } },
                  y: { beginAtZero: false, grace: '10%' },
                },
              }}
              color="#ff8a32"
              height="100%"
              label="Altitude"
              metric="altitude"
              unit="m"
            />
            <div className="dashboard-chart-readout">
              {formatNumber(values.altitude, 1)} m
            </div>
          </div>
          <div className="dashboard-recovery-box">
            <h3>Recovery System</h3>
            <StatusBadge
              label="Primary"
              value={telemetry.primaryParachute || '--'}
            />
            <StatusBadge
              label="Secondary"
              value={telemetry.secondaryParachute || '--'}
            />
          </div>
        </section>

        <section className="dashboard-panel dashboard-power-panel">
          <h3>Power Subsystem</h3>
          <div className="power-stat-stack">
            <Metric
              icon={BatteryCharging}
              label="Voltage"
              value={`${formatNumber(telemetry.batteryVoltage)} V`}
            />
            <Metric
              icon={Gauge}
              label="Current"
              value={`${formatNumber(telemetry.batteryCurrent)} mA`}
            />
            <Metric
              icon={Zap}
              label="Power"
              value={`${formatNumber(telemetry.power)} W`}
            />
          </div>
        </section>

        <section className="dashboard-panel dashboard-gnss-panel">
          <h3>Status &amp; Telemetry</h3>
          <div className="dashboard-status-grid">
            <div>
              <Metric icon={MapPin} label="LATITUDE:" value={formatNumber(telemetry.gnssLat, 6)} />
              <Metric icon={MapPin} label="LONGITUDE:" value={formatNumber(telemetry.gnssLon, 6)} />
              <Metric icon={MapPin} label="GNSS ALT:" value={`${formatNumber(telemetry.gnssAlt)} m`} />
            </div>
            <div>
              <Metric icon={Radio} label="PORT:" value={telemetry.port} />
              <Metric icon={Radio} label="BAUD RATE:" value={telemetry.baudRate} />
              <Metric icon={Radio} label="PACKETS:" value={telemetry.packetCount} />
            </div>
          </div>
        </section>

        <section className="dashboard-panel dashboard-map-panel">
          <h3>GPS Tracking</h3>
          <div className="dashboard-map-widget">
            <GPSMap />
          </div>
        </section>
      </div>

      <section className="dashboard-imu-row">
        <ImuChart
          fields={[
            { key: 'accelX', label: 'X' },
            { key: 'accelY', label: 'Y' },
            { key: 'accelZ', label: 'Z' },
          ]}
          title="Accelerometer"
        />
        <ImuChart
          fields={[
            { key: 'gyroX', label: 'X' },
            { key: 'gyroY', label: 'Y' },
            { key: 'gyroZ', label: 'Z' },
          ]}
          title="Gyroscope"
        />
        <ImuChart
          fields={[
            { key: 'magX', label: 'X' },
            { key: 'magY', label: 'Y' },
            { key: 'magZ', label: 'Z' },
          ]}
          title="Magnetometer"
        />
      </section>
    </section>
  )
}

export default Dashboard
