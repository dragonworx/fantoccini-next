/**
 * Flexbox-style layout manager
 * @namespace core.ui
 * @memberof core.ui
 */

import type { ILayoutManager } from '../types';
import type { Container } from '../elements/container';

/**
 * Implements flexbox-style layout algorithm
 * @memberof core.ui
 */
export class FlexLayout implements ILayoutManager {
	public name = 'flex';
	
	public constructor(
		public direction: 'row' | 'column' = 'row',
		public justifyContent: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly' = 'start',
		public alignItems: 'start' | 'center' | 'end' | 'stretch' = 'start',
		public gap: number = 0,
		public wrap: boolean = false
	) {}

	/**
	 * Calculate layout using flexbox-like algorithm
	 */
	public calculateLayout(container: Container): void {
		const containerGeometry = container.geometry;
		const containerLayout = container.layout;
		
		// Calculate available space
		const availableWidth = containerGeometry.width - containerLayout.paddingLeft - containerLayout.paddingRight;
		const availableHeight = containerGeometry.height - containerLayout.paddingTop - containerLayout.paddingBottom;
		
		const isRow = this.direction === 'row';
		const mainSize = isRow ? availableWidth : availableHeight;
		const crossSize = isRow ? availableHeight : availableWidth;
		
		// Calculate total size of children
		let totalChildSize = 0;
		let childCount = 0;
		
		for (const child of container.children) {
			const childGeometry = child.geometry;
			const childLayout = child.layout;
			
			if (isRow) {
				totalChildSize += childGeometry.width + childLayout.marginLeft + childLayout.marginRight;
			} else {
				totalChildSize += childGeometry.height + childLayout.marginTop + childLayout.marginBottom;
			}
			childCount++;
		}
		
		// Add gaps
		if (childCount > 1) {
			totalChildSize += this.gap * (childCount - 1);
		}
		
		// Calculate starting position and spacing
		let mainPos = 0;
		let spacing = 0;
		
		switch (this.justifyContent) {
		case 'start':
			mainPos = 0;
			break;
		case 'center':
			mainPos = (mainSize - totalChildSize) / 2;
			break;
		case 'end':
			mainPos = mainSize - totalChildSize;
			break;
		case 'space-between':
			mainPos = 0;
			if (childCount > 1) {
				spacing = (mainSize - totalChildSize + this.gap * (childCount - 1)) / (childCount - 1);
			}
			break;
		case 'space-around':
			spacing = (mainSize - totalChildSize + this.gap * (childCount - 1)) / childCount;
			mainPos = spacing / 2;
			break;
		case 'space-evenly':
			spacing = (mainSize - totalChildSize + this.gap * (childCount - 1)) / (childCount + 1);
			mainPos = spacing;
			break;
		}
		
		// Position children
		for (let i = 0; i < container.children.length; i++) {
			const child = container.children[i];
			const childGeometry = child.geometry;
			const childLayout = child.layout;
			
			// Calculate cross-axis position
			let crossPos = 0;
			switch (this.alignItems) {
			case 'start':
				crossPos = isRow ? childLayout.marginTop : childLayout.marginLeft;
				break;
			case 'center':
				if (isRow) {
					crossPos = (crossSize - childGeometry.height) / 2;
				} else {
					crossPos = (crossSize - childGeometry.width) / 2;
				}
				break;
			case 'end':
				if (isRow) {
					crossPos = crossSize - childGeometry.height - childLayout.marginBottom;
				} else {
					crossPos = crossSize - childGeometry.width - childLayout.marginRight;
				}
				break;
			case 'stretch':
				// For stretch, we'd need to modify child size
				// For now, treat as start
				crossPos = isRow ? childLayout.marginTop : childLayout.marginLeft;
				break;
			}
			
			// Set position
			if (isRow) {
				child.geometry = {
					left: containerLayout.paddingLeft + mainPos + childLayout.marginLeft,
					top: containerLayout.paddingTop + crossPos
				};
				mainPos += childGeometry.width + childLayout.marginLeft + childLayout.marginRight + this.gap + spacing;
			} else {
				child.geometry = {
					left: containerLayout.paddingLeft + crossPos,
					top: containerLayout.paddingTop + mainPos + childLayout.marginTop
				};
				mainPos += childGeometry.height + childLayout.marginTop + childLayout.marginBottom + this.gap + spacing;
			}
		}
	}
}