/**
 * Stack layout manager
 * @namespace core.ui
 * @memberof core.ui
 */

import type { ILayoutManager } from '../types';
import type { Container } from '../elements/container';

/**
 * Stacks elements vertically or horizontally
 * @memberof core.ui
 */
export class StackLayout implements ILayoutManager {
	public name = 'stack';
	
	public constructor(
		public direction: 'vertical' | 'horizontal' = 'vertical',
		public gap: number = 0,
		public align: 'start' | 'center' | 'end' = 'start'
	) {}

	/**
	 * Calculate layout - stack children in specified direction
	 */
	public calculateLayout(container: Container): void {
		const containerGeometry = container.geometry;
		const containerLayout = container.layout;
		
		// Calculate available space
		const availableWidth = containerGeometry.width - containerLayout.paddingLeft - containerLayout.paddingRight;
		const availableHeight = containerGeometry.height - containerLayout.paddingTop - containerLayout.paddingBottom;
		
		let currentOffset = 0;
		
		for (let i = 0; i < container.children.length; i++) {
			const child = container.children[i];
			const childGeometry = child.geometry;
			const childLayout = child.layout;
			
			if (this.direction === 'vertical') {
				// Position vertically
				const y = containerLayout.paddingTop + currentOffset + childLayout.marginTop;
				
				// Calculate X position based on alignment
				let x = containerLayout.paddingLeft + childLayout.marginLeft;
				if (this.align === 'center') {
					x = containerLayout.paddingLeft + (availableWidth - childGeometry.width) / 2;
				} else if (this.align === 'end') {
					x = containerGeometry.width - containerLayout.paddingRight - childGeometry.width - childLayout.marginRight;
				}
				
				// Set position
				child.geometry = {
					left: x,
					top: y
				};
				
				// Update offset for next child
				currentOffset += childGeometry.height + childLayout.marginTop + childLayout.marginBottom;
				if (i < container.children.length - 1) {
					currentOffset += this.gap;
				}
			} else {
				// Position horizontally
				const x = containerLayout.paddingLeft + currentOffset + childLayout.marginLeft;
				
				// Calculate Y position based on alignment
				let y = containerLayout.paddingTop + childLayout.marginTop;
				if (this.align === 'center') {
					y = containerLayout.paddingTop + (availableHeight - childGeometry.height) / 2;
				} else if (this.align === 'end') {
					y = containerGeometry.height - containerLayout.paddingBottom - childGeometry.height - childLayout.marginBottom;
				}
				
				// Set position
				child.geometry = {
					left: x,
					top: y
				};
				
				// Update offset for next child
				currentOffset += childGeometry.width + childLayout.marginLeft + childLayout.marginRight;
				if (i < container.children.length - 1) {
					currentOffset += this.gap;
				}
			}
		}
	}
}