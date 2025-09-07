import { Time, isBusinessDay } from 'lightweight-charts';

export interface PricerangesOptions {
	//* Define the options for the primitive.
	fillColor: string;
	hoverFillColor: string;
	selectedFillColor: string;
	dragHandleColor: string;
	borderColor: string;
	borderWidth: number;
	hoverBorderWidth: number;
	selectedBorderWidth: number;

	showInfoLabel: boolean;
	arrowColor: string;
	arrowWidth: number;
	labelBackgroundColor: string;
	labelTextColor: string;
	labelBorderColor: string;
	labelBorderWidth: number;
	labelFont: string;

	labelColor: string;
	labelTextColor: string;
	showLabels: boolean;
	priceLabelFormatter: (price: number) => string;
	timeLabelFormatter: (time: Time) => string;
}

export const defaultOptions: PricerangesOptions = {
	//* Define the default values for all the primitive options.
	fillColor: 'rgba(0, 122, 255, 0.25)',
	hoverFillColor: 'rgba(0, 122, 255, 0.4)',
	selectedFillColor: 'rgba(0, 122, 255, 0.55)',
	dragHandleColor: 'rgba(0, 122, 255, 1)',
	borderColor: 'rgba(0, 122, 255, 1)',
	borderWidth: 1,
	hoverBorderWidth: 2,
	selectedBorderWidth: 3,

	showInfoLabel: true,
	arrowColor: 'rgba(0, 122, 255, 1)',
	arrowWidth: 1,
	labelBackgroundColor: 'rgba(40, 40, 40, 1)',
	labelTextColor: 'white',
	labelBorderColor: 'rgba(150, 150, 150, 1)',
	labelBorderWidth: 1,
	labelFont: '12px sans-serif',

	labelColor: 'rgba(0, 122, 255, 1)',
	labelTextColor: 'white',
	showLabels: true,
	priceLabelFormatter: (price: number) => price.toFixed(2),
	timeLabelFormatter: (time: Time) => {
		if (typeof time == 'string') return time;
		const date = isBusinessDay(time)
			? new Date(time.year, time.month, time.day)
			: new Date(time * 1000);
		return date.toLocaleDateString();
	},
} as const;

