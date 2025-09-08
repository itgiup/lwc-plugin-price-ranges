import {
	CandlestickSeries, ColorType, CrosshairMode,
	createChart,
} from 'lightweight-charts';
import { Priceranges } from '../price-ranges';

async function getBinanceKlines(symbol = 'BTCUSDT', interval = '1d', limit = 500) {
	const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
	const response = await fetch(url);
	const klines = await response.json();
	return klines.map((k: any) => ({
		time: k[0] / 1000, // Binance provides timestamp in ms, lightweight-charts expects seconds
		open: parseFloat(k[1]),
		high: parseFloat(k[2]),
		low: parseFloat(k[3]),
		close: parseFloat(k[4]),
	}));
}

async function setupChart() {
	const chart = createChart('chart', {
		autoSize: true,
		crosshair: {
			mode: CrosshairMode.Normal,
		},
		layout: {
			background: { type: ColorType.Solid, color: '#161616ff' },
			textColor: '#333',
		},
		grid: {
			vertLines: {
				color: 'rgba(197, 203, 206, 0.5)',
			},
			horzLines: {
				color: 'rgba(197, 203, 206, 0.5)',
			},
		},
	});

	// Expose chart instance to Priceranges static property
	Priceranges.setChart(chart); // Call the new static method

	const candlestickSeries = chart.addSeries(CandlestickSeries, {
		upColor: '#26a69a',
		downColor: '#ef5350',
		borderDownColor: '#ef5350',
		borderUpColor: '#26a69a',
		wickDownColor: '#ef5350',
		wickUpColor: '#26a69a',
	});
	Priceranges.setTargetSeries(candlestickSeries); // Set the target series for drawing

	const data = await getBinanceKlines();
	candlestickSeries.setData(data);

	if (data.length > 50) {
		const time1 = data[data.length - 50].time;
		const time2 = data[data.length - 10].time;

		const primitive1 = new Priceranges(
			{ price: data[data.length - 50].low * 0.95, time: time1 },
			{ price: data[data.length - 10].high * 1.05, time: time2 }
		);
		const primitive2 = new Priceranges(
			{ price: data[data.length - 80].low * 0.95, time: data[data.length - 80].time },
			{ price: data[data.length - 60].high * 1.05, time: data[data.length - 60].time }
		);

		candlestickSeries.attachPrimitive(primitive1);
		candlestickSeries.attachPrimitive(primitive2);
	}
}

setupChart();

// Add button event listener
const drawButton = document.getElementById('drawPriceRangeButton');
if (drawButton) {
	drawButton.addEventListener('click', () => {
		Priceranges.setDrawingMode(true);
		drawButton.title = 'Drawing... Click on chart to place points';
		(drawButton as HTMLButtonElement).disabled = true;

		// Set the callback for when drawing is completed
		Priceranges.setOnDrawingCompleted(() => {
			drawButton.title = 'Draw Price Range';
			(drawButton as HTMLButtonElement).disabled = false;
		});
	});
}
