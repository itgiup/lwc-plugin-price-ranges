import { CanvasRenderingTarget2D } from 'fancy-canvas';
import { IPrimitivePaneRenderer } from 'lightweight-charts';
import { PricerangesDataSource } from './data-source';
import { ViewPoint } from './pane-view';
import { positionsBox } from './helpers/dimensions/positions';
import { ExternalId } from './helpers/constants';

const handleWidth = 3;
const handleHeight = 3;

export class PricerangesPaneRenderer implements IPrimitivePaneRenderer {
	_p1: ViewPoint;
	_p2: ViewPoint;
	_source: PricerangesDataSource;

	constructor(p1: ViewPoint, p2: ViewPoint, source: PricerangesDataSource) {
		this._p1 = p1;
		this._p2 = p2;
		this._source = source;
	}

	draw(target: CanvasRenderingTarget2D) {
		target.useBitmapCoordinateSpace(scope => {
			if (
				this._p1.x === null ||
				this._p1.y === null ||
				this._p2.x === null ||
				this._p2.y === null
			)
				return;
			const ctx = scope.context;
			const horizontalPositions = positionsBox(
				this._p1.x,
				this._p2.x,
				scope.horizontalPixelRatio
			);
			const verticalPositions = positionsBox(
				this._p1.y,
				this._p2.y,
				scope.verticalPixelRatio
			);

			const options = this._source.options;
			if (this._source.isSelected()) {
				ctx.fillStyle = options.selectedFillColor;
			} else if (this._source.isHovered()) {
				ctx.fillStyle = options.hoverFillColor;
			} else {
				ctx.fillStyle = options.fillColor;
			}

			ctx.fillRect(
				horizontalPositions.position,
				verticalPositions.position,
				horizontalPositions.length,
				verticalPositions.length
			);

			// Draw border
			ctx.strokeStyle = options.borderColor;
			if (this._source.isSelected()) {
				ctx.lineWidth = options.selectedBorderWidth;
			} else if (this._source.isHovered()) {
				ctx.lineWidth = options.hoverBorderWidth;
			} else {
				ctx.lineWidth = options.borderWidth;
			}
			ctx.strokeRect(
				horizontalPositions.position,
				verticalPositions.position,
				horizontalPositions.length,
				verticalPositions.length
			);

			if (options.showInfoLabel) {
				const labelData = this._source.getInfoLabelData();
				if (labelData) {
					// Draw Arrow
					ctx.strokeStyle = options.arrowColor;
					ctx.lineWidth = options.arrowWidth;
					const xCenter = horizontalPositions.position + horizontalPositions.length / 2;
					ctx.beginPath();
					ctx.moveTo(xCenter, verticalPositions.position + verticalPositions.length); // bottom-center
					ctx.lineTo(xCenter, verticalPositions.position); // top-center
					// arrowhead
					ctx.lineTo(xCenter - 5, verticalPositions.position + 5);
					ctx.moveTo(xCenter, verticalPositions.position);
					ctx.lineTo(xCenter + 5, verticalPositions.position + 5);
					ctx.stroke();

					// Draw Label
					const labelText = `${labelData.priceDiff} (${labelData.percentageDiff}) ${labelData.barDiff}`;
					ctx.font = options.labelFont;
					const textMetrics = ctx.measureText(labelText);
					const labelWidth = textMetrics.width + 10; // padding
					const labelHeight = 20; // fixed height
					const labelX = xCenter - labelWidth / 2;
					const labelY = verticalPositions.position - labelHeight - 5; // 5px above the box

					// background
					ctx.fillStyle = options.labelBackgroundColor;
					ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
					// border
					ctx.strokeStyle = options.labelBorderColor;
					ctx.lineWidth = options.labelBorderWidth;
					ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
					// text
					ctx.fillStyle = options.labelTextColor;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText(labelText, xCenter, labelY + labelHeight / 2);
				}
			}

			// Draw handles if selected or hovered
			if (this._source.isSelected() || this._source.isHovered()) {
				const selectedHandle = this._source.getSelectedHandle();

				// Helper function to draw a handle
				const drawHandle = (x: number, y: number, width: number, height: number, handleId: string) => {
					if (selectedHandle === handleId) {
						ctx.fillStyle = options.selectedHandleColor;
						ctx.fillRect(x, y, width, height);
					} else {
						ctx.fillStyle = options.dragHandleColor;
						ctx.fillRect(x, y, width, height);
					}
				};

				// Helper function to draw a circular handle
				const drawCircularHandle = (x: number, y: number, radius: number, handleId: string) => {
					if (selectedHandle === handleId) {
						ctx.fillStyle = options.selectedHandleColor;
						ctx.beginPath();
						ctx.arc(x, y, radius, 0, 2 * Math.PI);
						ctx.fill();
					} else {
						ctx.fillStyle = options.dragHandleColor;
						ctx.beginPath();
						ctx.arc(x, y, radius, 0, 2 * Math.PI);
						ctx.fill();
					}
				};

				// horizontal handles
				const handleX1 = horizontalPositions.position - handleWidth / 2;
				const handleX2 = horizontalPositions.position + horizontalPositions.length - handleWidth / 2;
				drawHandle(handleX1, verticalPositions.position, handleWidth, verticalPositions.length, ExternalId.LEFT_HANDLE);
				drawHandle(handleX2, verticalPositions.position, handleWidth, verticalPositions.length, ExternalId.RIGHT_HANDLE);

				// vertical handles
				const handleY1 = verticalPositions.position - handleHeight / 2;
				const handleY2 = verticalPositions.position + verticalPositions.length - handleHeight / 2;
				drawHandle(horizontalPositions.position, handleY1, horizontalPositions.length, handleHeight, ExternalId.TOP_HANDLE);
				drawHandle(horizontalPositions.position, handleY2, horizontalPositions.length, handleHeight, ExternalId.BOTTOM_HANDLE);

				// corner handles
				drawCircularHandle(horizontalPositions.position, verticalPositions.position, handleWidth, ExternalId.TOP_LEFT_HANDLE);
				drawCircularHandle(horizontalPositions.position + horizontalPositions.length, verticalPositions.position, handleWidth, ExternalId.TOP_RIGHT_HANDLE);
				drawCircularHandle(horizontalPositions.position, verticalPositions.position + verticalPositions.length, handleWidth, ExternalId.BOTTOM_LEFT_HANDLE);
				drawCircularHandle(horizontalPositions.position + horizontalPositions.length, verticalPositions.position + verticalPositions.length, handleWidth, ExternalId.BOTTOM_RIGHT_HANDLE);
			}
		});
	}
}