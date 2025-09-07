import { CrosshairMode, LineSeries, createChart } from 'lightweight-charts';
import { generateLineData } from '../sample-data';
import { Priceranges } from '../price-ranges';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
	crosshair: {
		mode: CrosshairMode.Normal
	},
}));

const lineSeries = chart.addSeries(LineSeries, {
	color: '#000000',
});
const data = generateLineData();
lineSeries.setData(data);

const time1 = data[data.length - 50].time;
const time2 = data[data.length - 10].time;

const primitive = new Priceranges(
	{ price: 100, time: time1 },
	{ price: 500, time: time2 }
);

lineSeries.attachPrimitive(primitive);
