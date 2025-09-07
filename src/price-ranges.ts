import {
	AutoscaleInfo,
	Logical,
	Time,
	SeriesAttachedParameter,
	PrimitiveHoveredItem,
	Coordinate,
	IChartApi,
	MouseEventParams,
} from 'lightweight-charts';

import { Point, PricerangesDataSource, InfoLabelData } from './data-source';
import { PricerangesOptions, defaultOptions } from './options';
import { PricerangesPaneView } from './pane-view';
import { PluginBase } from './plugin-base';

// A static class to manage selection state across multiple instances
class SelectionManager {
	private static _selectedItem: Priceranges | null = null;

	public static get selectedItem(): Priceranges | null {
		return this._selectedItem;
	}

	public static set selectedItem(item: Priceranges | null) {
		if (this._selectedItem === item) {
			return;
		}
		if (this._selectedItem) {
			this._selectedItem.setSelected(false);
		}
		this._selectedItem = item;
		if (this._selectedItem) {
			this._selectedItem.setSelected(true);
		}
	}
}

export class Priceranges
	extends PluginBase
	implements PricerangesDataSource
{
	private static _lastHoveredItem: Priceranges | null = null;

	private _options: PricerangesOptions;
	p1: Point;
	p2: Point;
	private _paneViews: PricerangesPaneView[];

	private _isHovered: boolean = false;
	private _isSelected: boolean = false;
	private _isDragging: boolean = false;
	private _draggedPart: string | null = null;
	private _initialP1: Point | null = null;
	private _initialP2: Point | null = null;
	private _startDragLogicalPoint: Point | null = null;

	public constructor(
		p1: Point,
		p2: Point,
		options: Partial<PricerangesOptions> = {}
	) {
		super();
		this.p1 = p1;
		this.p2 = p2;
		this._options = {
			...defaultOptions,
			...options,
		};
		this._paneViews = [new PricerangesPaneView(this)];
	}

	public attached(param: SeriesAttachedParameter<Time>): void {
		super.attached(param);
		this.chart.subscribeClick(this._handleClick);
		this.chart.subscribeCrosshairMove(this._handleCrosshairMove);

		const chartElement = this.chart.chartElement();
		chartElement.addEventListener('mousedown', this._handleMouseDown);
		chartElement.addEventListener('mouseup', this._handleMouseUp);
		chartElement.addEventListener('mousemove', this._handleMouseMove);
		chartElement.addEventListener('mouseleave', this._handleMouseLeave);
	}

	public detached(): void {
		this.chart.unsubscribeClick(this._handleClick);
		this.chart.unsubscribeCrosshairMove(this._handleCrosshairMove);

		const chartElement = this.chart.chartElement();
		chartElement.removeEventListener('mousedown', this._handleMouseDown);
		chartElement.removeEventListener('mouseup', this._handleMouseUp);
		chartElement.removeEventListener('mousemove', this._handleMouseMove);
		chartElement.removeEventListener('mouseleave', this._handleMouseLeave);

		super.detached();
	}

	public isHovered(): boolean {
		return this._isHovered;
	}

	public isSelected(): boolean {
		return this._isSelected;
	}

	public setHovered(value: boolean) {
		if (this._isHovered === value) return;
		this._isHovered = value;
		this.requestUpdate();
	}

	public setSelected(value: boolean) {
		if (this._isSelected === value) return;
		this._isSelected = value;
		this.requestUpdate();
	}

	updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
	}

	paneViews() {
		return this._paneViews;
	}

	public hitTest(x: Coordinate, y: Coordinate): PrimitiveHoveredItem | null {
		return this._paneViews[0].hitTest(x, y);
	}

	public getInfoLabelData(): InfoLabelData | null {
		const p1 = this.p1;
		const p2 = this.p2;
		const priceDiff = p2.price - p1.price;
		const percentageDiff = (priceDiff / p1.price) * 100;
		const timeScale = this.chart.timeScale();
		const barIndex1 = timeScale.timeToIndex(p1.time, true);
		const barIndex2 = timeScale.timeToIndex(p2.time, true);
		if (barIndex1 === null || barIndex2 === null) {
			return null;
		}
		const barDiff = barIndex2 - barIndex1;
		return {
			priceDiff: priceDiff.toFixed(2),
			percentageDiff: percentageDiff.toFixed(2) + '%',
			barDiff: barDiff.toString(),
		};
	}

	autoscaleInfo(
		startTimePoint: Logical,
		endTimePoint: Logical
	): AutoscaleInfo | null {
		if (
			this._timeCurrentlyVisible(this.p1.time, startTimePoint, endTimePoint) ||
			this._timeCurrentlyVisible(this.p2.time, startTimePoint, endTimePoint)
		) {
			return {
				priceRange: {
					minValue: Math.min(this.p1.price, this.p2.price),
					maxValue: Math.max(this.p1.price, this.p2.price),
				},
			};
		}
		return null;
	}

	public get options(): PricerangesOptions {
		return this._options;
	}

	applyOptions(options: Partial<PricerangesOptions>) {
		this._options = { ...this._options, ...options };
		this.requestUpdate();
	}

	private _handleClick = () => {
		if (Priceranges._lastHoveredItem === this) {
			if (SelectionManager.selectedItem === this) {
				SelectionManager.selectedItem = null;
			} else {
				SelectionManager.selectedItem = this;
			}
		}
	};

	private _handleCrosshairMove = (params: MouseEventParams) => {
		if (this._isDragging) return;
		const hoveredSource = params.hoveredSource as unknown as Priceranges | undefined;
		if (hoveredSource && hoveredSource instanceof Priceranges) {
			if (Priceranges._lastHoveredItem !== hoveredSource) {
				if (Priceranges._lastHoveredItem) {
					Priceranges._lastHoveredItem.setHovered(false);
				}
				Priceranges._lastHoveredItem = hoveredSource;
				hoveredSource.setHovered(true);
			}
		} else {
			if (Priceranges._lastHoveredItem) {
				Priceranges._lastHoveredItem.setHovered(false);
				Priceranges._lastHoveredItem = null;
			}
		}
	};

	private _handleMouseDown = (event: MouseEvent) => {
		const chartElement = this.chart.chartElement();
		const rect = chartElement.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		const hitTestResult = this.hitTest(x as Coordinate, y as Coordinate);

		if (hitTestResult && hitTestResult.externalId) {
			SelectionManager.selectedItem = this;
			this._isDragging = true;
			this._draggedPart = hitTestResult.externalId as string;
			const time = this.chart.timeScale().coordinateToTime(x as Coordinate);
			const price = this.series.coordinateToPrice(y as Coordinate);
			if (!time || !price) return;
			this._startDragLogicalPoint = { time, price };
			this._initialP1 = { ...this.p1 };
			this._initialP2 = { ...this.p2 };

			this.chart.applyOptions({
				handleScroll: {
					pressedMouseMove: false,
				},
			});
		}
	};

	private _handleMouseUp = () => {
		this._isDragging = false;
		this._draggedPart = null;
		this._startDragLogicalPoint = null;
		this._initialP1 = null;
		this._initialP2 = null;

		this.chart.applyOptions({
			handleScroll: {
				pressedMouseMove: true,
			},
		});
	};

	private _handleMouseLeave = () => {
		this._isDragging = false;
		this._draggedPart = null;
	};

	private _handleMouseMove = (event: MouseEvent) => {
		if (!this._isDragging || !this._draggedPart) return;
		const chartElement = this.chart.chartElement();
		const rect = chartElement.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		const time = this.chart.timeScale().coordinateToTime(x as Coordinate);
		const price = this.series.coordinateToPrice(y as Coordinate);
		if (!time || !price) return;

		switch (this._draggedPart) {
			case 'left-handle':
				this.p1.time = time;
				break;
			case 'right-handle':
				this.p2.time = time;
				break;
			case 'top-handle':
				this.p1.price = price;
				break;
			case 'bottom-handle':
				this.p2.price = price;
				break;
			case 'top-left-handle':
				this.p1.time = time;
				this.p1.price = price;
				break;
			case 'top-right-handle':
				this.p2.time = time;
				this.p1.price = price;
				break;
			case 'bottom-left-handle':
				this.p1.time = time;
				this.p2.price = price;
				break;
			case 'bottom-right-handle':
				this.p2.time = time;
				this.p2.price = price;
				break;
			case 'body':
				if (this._startDragLogicalPoint && this._initialP1 && this._initialP2) {
					const timeDelta = (time as number) - (this._startDragLogicalPoint.time as number);
					const priceDelta = price - this._startDragLogicalPoint.price;
					this.p1.time = (this._initialP1.time as number) + timeDelta as Time;
					this.p2.time = (this._initialP2.time as number) + timeDelta as Time;
					this.p1.price = this._initialP1.price + priceDelta;
					this.p2.price = this._initialP2.price + priceDelta;
				}
				break;
		}
		this.requestUpdate();
	};

	private _timeCurrentlyVisible(
		time: Time,
		startTimePoint: Logical,
		endTimePoint: Logical
	): boolean {
		const ts = this.chart.timeScale();
		const coordinate = ts.timeToCoordinate(time);
		if (coordinate === null) return false;
		const logical = ts.coordinateToLogical(coordinate);
		if (logical === null) return false;
		return logical <= endTimePoint && logical >= startTimePoint;
	}
}
